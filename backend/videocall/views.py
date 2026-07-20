from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Call
import uuid
from django.db import models as django_models
from .serializers import CallSerializer
from  chat.models import Chat , Message
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class StartCallView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        receiver_id = request.data.get("receiver_id")
        
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
        room_name = str(uuid.uuid4())[:8]
       
        chat = Chat.objects.filter(
            django_models.Q(user1=request.user, user2=receiver) | 
            django_models.Q(user1=receiver, user2=request.user)
        ).first()
        
        
        if not chat:
            chat = Chat.objects.create(user1=request.user, user2=receiver)
        
        call = Call.objects.create(
            caller=request.user, 
            receiver=receiver, 
            room_name=room_name,
            chat=chat,
            status='ringing'
        )

        profile_image_url = None
        if request.user.profile_image:
            profile_image_url = request.build_absolute_uri(request.user.profile_image.url)

       
        channel_layer = get_channel_layer()
        receiver_group = f'notifications_{receiver.id}'
        
        async_to_sync(channel_layer.group_send)(
            receiver_group,
            {
                'type': 'call_notification',
                'data': {
                    'type': 'incoming_call',
                    'call_id': call.id,
                    'caller_id': request.user.id,
                    'caller_name': request.user.name,
                    'caller_image': profile_image_url,
                    'room_name': room_name,
                }
            }
        )
        
        print(f"Sent call notification to user {receiver.id} for room {room_name}")
        
        return Response({
            "room_name": room_name,
            "call_id": call.id
        })


class UpdateCallStatusView(APIView):
    permission_classes = [IsAuthenticated]
    TERMINAL_STATUSES = {'ended', 'rejected', 'cancelled', 'missed'}

    def post(self, request, call_id):
        from django.utils import timezone

        try:
            call = Call.objects.select_related('caller', 'receiver', 'chat').get(id=call_id)
        except Call.DoesNotExist:
            return Response({"error": "Call not found"}, status=404)

        if request.user not in (call.caller, call.receiver):
            return Response({"error": "Not authorized"}, status=403)

       
        if call.status in self.TERMINAL_STATUSES:
            return Response(CallSerializer(call, context={'request': request}).data)

        new_status = request.data.get('status')
        valid = dict(Call.CALL_STATUS)
        if new_status not in valid:
            return Response({"error": "Invalid status"}, status=400)

        call.status = new_status

        if new_status == 'ended':
            call.ended_at = timezone.now()
            if call.started_at:
                call.duration = int((call.ended_at - call.started_at).total_seconds())

        if new_status in ('rejected', 'cancelled', 'missed'):
            call.is_missed = True
            call.ended_at = timezone.now()

        call.save()

        channel_layer = get_channel_layer()
        other_user = call.receiver if call.caller == request.user else call.caller

        if new_status in self.TERMINAL_STATUSES:
            async_to_sync(channel_layer.group_send)(
                f'notifications_{other_user.id}',
                {'type': 'call_ended', 'data': {'type': 'call_ended', 'call_id': call.id, 'status': new_status}}
            )

            if call.chat:
                message_type = 'call_missed' if call.is_missed else 'call'
                Message.objects.create(
                    chat=call.chat, sender=call.caller, content="",
                    message_type=message_type, call=call,
                    is_read=not call.is_missed,
                )
                for uid in (call.caller_id, call.receiver_id):
                    async_to_sync(channel_layer.group_send)(
                        f'notifications_{uid}', {'type': 'refresh_chat_list', 'action': 'refresh'}
                    )

        return Response(CallSerializer(call, context={'request': request}).data)



class CallHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        
        calls = Call.objects.filter(
            django_models.Q(caller=request.user) | django_models.Q(receiver=request.user)
        ).exclude(caller=request.user, receiver=request.user).select_related('caller', 'receiver').order_by('-started_at')
        
        serializer = CallSerializer(calls, many=True, context={'request': request})
        return Response(serializer.data)
