from rest_framework import serializers
from .models import Chat, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender_id', 'sender_name', 'content', 'timestamp', 'is_read']


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'profile_image']
        

class ChatSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'other_user', 'last_message', 'last_timestamp']

    def get_other_user(self, obj):
        request = self.context.get('request')
        if obj.user1 == request.user:
            return UserMiniSerializer(obj.user2).data
        return UserMiniSerializer(obj.user1).data

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return last_msg.content or "Media message"
        return None

    def get_last_timestamp(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        return last_msg.timestamp if last_msg else None
