import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Call

class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"videocall_{self.room_name}"
        self.user = self.scope["user"]

        # Join the group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_sdp",
                "message": {
                    "type": "user_joined",
                    "user": self.user.name
                },
                "sender": self.user.name,
            }
        )

        
        call = await self.get_call_info(self.room_name)
        if call and call.receiver.id != self.user.id:
            receiver_group = f'call_notifications_{call.receiver.id}'
            await self.channel_layer.group_send(
                receiver_group,
                {
                    'type': 'call_notification',
                    'data': {
                        'type': 'incoming_call',
                        'call_id': call.id,
                        'caller_id': call.caller.id,
                        'caller_name': call.caller.name,
                        'caller_image': call.caller.profile_image.url if call.caller.profile_image else None,
                        'room_name': self.room_name,
                    }
                }
            )

        await self.send(text_data=json.dumps({
            "type": "connection",
            "message": f"{self.user.name} connected to room {self.room_name}"
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"{self.user.name} disconnected from {self.room_name}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')

        # Forward messages to the other peer(s)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_sdp",
                "message": data,
                "sender": self.user.name,
            }
        )

    async def send_sdp(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    @database_sync_to_async
    def get_call_info(self, room_name):
        try:
            return Call.objects.select_related('caller', 'receiver').get(room_name=room_name)
        except Call.DoesNotExist:
            return None
