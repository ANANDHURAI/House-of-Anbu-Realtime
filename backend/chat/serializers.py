from rest_framework import serializers
from .models import Chat, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    content = serializers.SerializerMethodField() # <--- Add this to make text dynamic!

    class Meta:
        model = Message
        # Make sure 'message_type' is included in fields!
        fields = ['id', 'sender_id', 'sender_name', 'content', 'timestamp', 'is_read', 'message_type']

    def get_content(self, obj):
        request = self.context.get('request')
        
        # If it's a call message, format the text perfectly for the viewer
        if obj.message_type in ['call', 'call_missed'] and obj.call:
            call = obj.call
            current_user = getattr(request, 'user', None)
            
            if not current_user:
                return obj.content
            
            if call.is_missed or call.status in ['cancelled', 'rejected']:
                if call.caller == current_user:
                    if call.status == 'rejected':
                        return f"Call rejected by {call.receiver.name}"
                    return f"Missed call to {call.receiver.name}"
                else:
                    return f"Missed call from {call.caller.name}"
            else:
                duration_str = f"{call.duration // 60}:{call.duration % 60:02d}" if call.duration else "0:00"
                if call.caller == current_user:
                    return f"Outgoing call • {duration_str}"
                else:
                    return f"Incoming call • {duration_str}"
                    
        return obj.content


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'about_me', 'profile_image']

    def get_profile_image(self, obj):
        request = self.context.get('request')
        if obj.profile_image:
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None
        
class ChatSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_timestamp = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'other_user', 'last_message', 'last_timestamp', 'unread_count']


    def get_other_user(self, obj):
        request = self.context.get('request')
        if obj.user1 == request.user:
            return UserMiniSerializer(obj.user2, context={'request': request}).data
        return UserMiniSerializer(obj.user1, context={'request': request}).data

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            if last_msg.message_type in ['call', 'call_missed']:
                return "Video Call"
            return last_msg.content or "Media message"
        return None

    def get_last_timestamp(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        return last_msg.timestamp if last_msg else None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
    

    