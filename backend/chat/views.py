from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q
from .models import Chat, Message , Room, RoomMessage
from accounts.models import UserAccount
from .serializers import MessageSerializer , ChatSerializer, RoomSerializer , RoomMessageSerializer
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
User = get_user_model()


class SearchingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '').strip()
        if not query:
            return Response({"results": []}, status=status.HTTP_200_OK)

        users = UserAccount.objects.filter(
            Q(name__icontains=query) |
            Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10] 

        results = [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "profile_image": request.build_absolute_uri(user.profile_image.url) if user.profile_image else None,
            }
            for user in users
        ]
        return Response({"results": results}, status=status.HTTP_200_OK)




class GetOrCreateChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("user_id")
        user = request.user

        # BLOCK SELF-CHAT
        if str(user.id) == str(other_user_id):
            return Response({"error": "You cannot chat with yourself."}, status=status.HTTP_400_BAD_REQUEST)

        chat = Chat.objects.filter(
            Q(user1=user, user2_id=other_user_id) |
            Q(user1_id=other_user_id, user2=user)
        ).first()

        if not chat:
            chat = Chat.objects.create(user1=user, user2_id=other_user_id)

        return Response({"chat_id": chat.id}, status=status.HTTP_200_OK)



class ChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_id):
        messages = Message.objects.filter(chat_id=chat_id).order_by("timestamp")
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)




    
class ChatListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        chats = Chat.objects.filter(
            Q(user1=user) | Q(user2=user)
        ).select_related('user1', 'user2').order_by('-updated_at')
        
        serializer = ChatSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)





class MarkMessagesAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id)
            
            Message.objects.filter(
                chat=chat,
                is_read=False
            ).exclude(sender=request.user).update(is_read=True)
            
            return Response({"success": True}, status=status.HTTP_200_OK)
        except Chat.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)




class ChatDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id)
            
            other_user = chat.user2 if chat.user1 == request.user else chat.user1
            
            return Response({
                'id': chat.id,
                'other_user': {
                    'id': other_user.id,
                    'name': other_user.name,
                    'email': other_user.email,
                    'profile_image': request.build_absolute_uri(other_user.profile_image.url) if other_user.profile_image else None
                }
            }, status=status.HTTP_200_OK)
        except Chat.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)
        
        
        
        
class CreateRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        room_name = request.data.get('name', '').strip()
        is_video = request.data.get('is_video_room', False)
        
        if not room_name:
            return Response({"error": "Room name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        room, created = Room.objects.get_or_create(
            name=room_name, 
            defaults={'created_by': request.user, 'is_video_room': is_video}
        )
        
        if created:
            room.participants.add(request.user)
            return Response({
                "message": "Room created!", 
                "room_id": room.id, 
                "name": room.name,
                "is_video_room": room.is_video_room
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "Room already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
        




class RoomListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rooms = Room.objects.filter(participants=request.user).order_by('-created_at')
        serializer = RoomSerializer(rooms, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    


class RoomMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        messages = RoomMessage.objects.filter(room_id=room_id).order_by("timestamp")
        serializer = RoomMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    




class AddRoomParticipantsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        try:
            room = Room.objects.get(id=room_id)
            user_ids = request.data.get('user_ids', [])
            
            if request.user not in room.participants.all():
                return Response({"error": "You must be in the room to add members."}, status=status.HTTP_403_FORBIDDEN)
                
            users_to_add = User.objects.filter(id__in=user_ids)
            room.participants.add(*users_to_add)
            
            added_names = ", ".join([u.name for u in users_to_add])
            announcement = f"added {added_names} to the group."
            
            msg = RoomMessage.objects.create(room=room, sender=request.user, content=announcement)
            
            channel_layer = get_channel_layer()
            
           
            async_to_sync(channel_layer.group_send)(
                f'room_{room.id}',
                {
                    'type': 'chat_message',
                    'content': msg.content,
                    'sender_name': request.user.name,
                    'sender_id': request.user.id,
                    'timestamp': msg.timestamp.isoformat()
                }
            )
            
    
            participant_ids = room.participants.values_list('id', flat=True)
            for user_id in participant_ids:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user_id}',
                    {
                        'type': 'refresh_chat_list',
                        'action': 'refresh'
                    }
                )
            
            return Response({"message": "Participants added successfully!"}, status=status.HTTP_200_OK)
            
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)