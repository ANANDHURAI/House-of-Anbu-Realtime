

from rest_framework import serializers
from .models import Call

class CallSerializer(serializers.ModelSerializer):
    caller_name = serializers.CharField(source='caller.name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.name', read_only=True)
    caller_image = serializers.ImageField(source='caller.profile_image', read_only=True)
    receiver_image = serializers.ImageField(source='receiver.profile_image', read_only=True)
    
    class Meta:
        model = Call
        fields = ['id', 'caller', 'caller_name', 'caller_image', 'receiver', 
                  'receiver_name', 'receiver_image', 'status', 'room_name', 
                  'started_at', 'ended_at', 'duration', 'is_missed']
        read_only_fields = ['id', 'started_at']