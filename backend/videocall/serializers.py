from rest_framework import serializers
from .models import Call

class CallSerializer(serializers.ModelSerializer):
    caller_name = serializers.CharField(source='caller.name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.name', read_only=True)
    caller_image = serializers.SerializerMethodField()
    receiver_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Call
        fields = ['id', 'caller', 'caller_name', 'caller_image', 'receiver', 
                  'receiver_name', 'receiver_image', 'status', 'room_name', 
                  'started_at', 'ended_at', 'duration', 'is_missed']
        read_only_fields = ['id', 'started_at']
    
    def get_caller_image(self, obj):
        if obj.caller.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.caller.profile_image.url)
            return obj.caller.profile_image.url
        return None
    
    def get_receiver_image(self, obj):
        if obj.receiver.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receiver.profile_image.url)
            return obj.receiver.profile_image.url
        return None