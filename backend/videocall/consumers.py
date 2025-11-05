import json
from channels.generic.websocket import AsyncWebsocketConsumer

class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"videocall_{self.room_name}"
        self.user = self.scope["user"]

        # Join the group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

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
