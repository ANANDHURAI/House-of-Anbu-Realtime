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
        
 
        call = Call.objects.create(
            caller=request.user, 
            receiver=receiver, 
            room_name=room_name,
            chat=chat,
            status='ringing'
        )
        
       
        channel_layer = get_channel_layer()
        receiver_group = f'call_notifications_{receiver.id}'
        
        async_to_sync(channel_layer.group_send)(
            receiver_group,
            {
                'type': 'call_notification',
                'data': {
                    'type': 'incoming_call',
                    'call_id': call.id,
                    'caller_id': request.user.id,
                    'caller_name': request.user.name,
                    'caller_image': request.user.profile_image.url if request.user.profile_image else None,
                    'room_name': room_name,
                }
            }
        )
        
        print(f"Sent call notification to user {receiver.id} for room {room_name}")
        
        return Response({
            "room_name": room_name,
            "call_id": call.id
        })



class CallHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        calls = Call.objects.filter(
            django_models.Q(caller=request.user) | django_models.Q(receiver=request.user)
        ).select_related('caller', 'receiver').order_by('-started_at')
        
        serializer = CallSerializer(calls, many=True)
        return Response(serializer.data)

class UpdateCallStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, call_id):
        from django.utils import timezone
        
        call = Call.objects.get(id=call_id)
        status = request.data.get('status')
        
        call.status = status
        
        if status == 'ended':
            call.ended_at = timezone.now()
            if call.started_at:
                duration = (call.ended_at - call.started_at).total_seconds()
                call.duration = int(duration)
        
        if status == 'rejected':
            call.is_missed = True
            
        call.save()
        
        # Create call message in chat
        if call.chat:
            message_type = 'call_missed' if call.is_missed else 'call'
            content = self._get_call_message(call, request.user)
            
            Message.objects.create(
                chat=call.chat,
                sender=request.user,
                content=content,
                message_type=message_type,
                call=call
            )
        
        return Response(CallSerializer(call).data)
    
    def _get_call_message(self, call, current_user):
        if call.is_missed:
            if call.receiver == current_user:
                return f"Missed call from {call.caller.name}"
            else:
                return f"Missed call to {call.receiver.name}"
        else:
            duration_str = f"{call.duration // 60}:{call.duration % 60:02d}" if call.duration else "0:00"
            if call.caller == current_user:
                return f"Outgoing call • {duration_str}"
            else:
                return f"Incoming call • {duration_str}"