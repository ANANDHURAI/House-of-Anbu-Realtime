from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q
from .models import Chat, Message
from accounts.models import UserAccount
from .serializers import MessageSerializer


class SearchingView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '').strip()

        users = UserAccount.objects.filter(
            Q(name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone__icontains=query)
        ).exclude(id=request.user.id)

        results = [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "about_me": user.about_me,
                "profile_image": request.build_absolute_uri(user.profile_image.url) if user.profile_image else None,
            }
            for user in users
        ]

        return Response({"results": results}, status=status.HTTP_200_OK)

class GetOrCreateChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("user_id")
        if not other_user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

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




    
