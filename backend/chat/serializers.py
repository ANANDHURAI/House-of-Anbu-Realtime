from rest_framework import serializers
from .models import Chat, Message
from django.contrib.auth import get_user_model
from .models import Room , RoomMessage

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    content = serializers.SerializerMethodField()

    call_id = serializers.IntegerField(source='call.id', read_only=True, default=None)
    call_status = serializers.SerializerMethodField()
    call_is_missed = serializers.SerializerMethodField()
    call_duration = serializers.SerializerMethodField()
    viewer_is_caller = serializers.SerializerMethodField()
    call_other_user_id = serializers.SerializerMethodField()
    call_other_user_name = serializers.SerializerMethodField()
    call_title = serializers.SerializerMethodField()
    call_subtext = serializers.SerializerMethodField()
    can_call_back = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'sender_id', 'sender_name', 'content', 'timestamp',
            'is_read', 'message_type',
            'call_id', 'call_status', 'call_is_missed', 'call_duration',
            'viewer_is_caller', 'call_other_user_id', 'call_other_user_name',
            'call_title', 'call_subtext', 'can_call_back',
        ]

    def _viewer(self):
        request = self.context.get('request')
        return getattr(request, 'user', None)

    def _is_call(self, obj):
        return obj.message_type in ('call', 'call_missed') and obj.call_id is not None

    def get_call_status(self, obj):
        return obj.call.status if obj.call else None

    def get_call_is_missed(self, obj):
        return obj.call.is_missed if obj.call else False

    def get_call_duration(self, obj):
        return obj.call.duration if obj.call else 0

    def get_viewer_is_caller(self, obj):
        user = self._viewer()
        if not self._is_call(obj) or not user or user.is_anonymous:
            return None
        return obj.call.caller_id == user.id

    def get_call_other_user_id(self, obj):
        user = self._viewer()
        if not self._is_call(obj) or not user:
            return None
        return obj.call.receiver_id if obj.call.caller_id == user.id else obj.call.caller_id

    def get_call_other_user_name(self, obj):
        user = self._viewer()
        if not self._is_call(obj) or not user:
            return None
        return obj.call.receiver.name if obj.call.caller_id == user.id else obj.call.caller.name

    def get_call_title(self, obj):
        if not self._is_call(obj):
            return None
        status = obj.call.status
        if status == 'ended':
            return "Video Call"
        if status == 'rejected':
            return "Call Declined"
        return "Missed Call"  # missed / cancelled

    def get_call_subtext(self, obj):
        user = self._viewer()
        if not self._is_call(obj) or not user:
            return None
        call = obj.call
        i_am_caller = call.caller_id == user.id
        other_name = call.receiver.name if i_am_caller else call.caller.name

        if call.status == 'ended':
            mins, secs = divmod(call.duration or 0, 60)
            return f"Duration {mins}:{secs:02d}"
        if call.status == 'rejected':
            return "Call not answered" if i_am_caller else "You declined this call"
        if call.status == 'missed':
            return "No answer" if i_am_caller else f"{other_name} called you"
        if call.status == 'cancelled':
            return "You cancelled the call" if i_am_caller else f"Missed call from {other_name}"
        return None

    def get_can_call_back(self, obj):
        user = self._viewer()
        if not self._is_call(obj) or not user:
            return False
        call = obj.call
        i_am_caller = call.caller_id == user.id
        if call.status in ('rejected', 'missed'):
            return True
        if call.status == 'cancelled' and not i_am_caller:
            return True
        return False

    def get_content(self, obj):
        if obj.message_type in ('call', 'call_missed'):
            return self.get_call_subtext(obj) or ""
        return obj.content



class UserMiniSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
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
        last_msg = obj.messages.last()
        if not last_msg:
            return None
        if last_msg.message_type in ('call', 'call_missed'):
            return "Missed video call" if last_msg.call and last_msg.call.is_missed else "Video call"
        return last_msg.content or "Media message"

    def get_last_timestamp(self, obj):
        last_msg = obj.messages.last()
        return last_msg.timestamp if last_msg else None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
    

    


class RoomSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'name', 'is_video_room', 'created_by', 'created_at']
        


class RoomMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)

    class Meta:
        model = RoomMessage
        fields = ['id', 'sender_id', 'sender_name', 'content', 'timestamp']