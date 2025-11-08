import json
from channels.generic.websocket import AsyncWebsocketConsumer

class VideoCallConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"videocall_{self.room_name}"
        self.user = self.scope["user"]

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        if not hasattr(self.channel_layer, 'room_members'):
            self.channel_layer.room_members = {}
        
        if self.room_group_name not in self.channel_layer.room_members:
            self.channel_layer.room_members[self.room_group_name] = []
        
        self.channel_layer.room_members[self.room_group_name].append({
            'user_id': self.user.id,
            'channel_name': self.channel_name,
            'user_name': self.user.name
        })
        
        member_count = len(self.channel_layer.room_members[self.room_group_name])

        print(f"User {self.user.name} joined room {self.room_name}, total members: {member_count}")

        await self.send(text_data=json.dumps({
            "type": "connection",
            "message": f"{self.user.name} connected to room {self.room_name}",
            "member_count": member_count
        }))

        if member_count == 2:
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "send_message",
                    "message": {
                        "type": "both_users_ready"
                    },
                    "sender_channel": None 
                }
            )
            print(f"Both users ready, triggering peer creation")
        
        print(f"User {self.user.name} waiting for peer creation signal")
  
  
    async def disconnect(self, close_code):
        user_name = self.user.name if hasattr(self, 'user') else 'Unknown'
        
        if hasattr(self.channel_layer, 'room_members'):
            if self.room_group_name in self.channel_layer.room_members:
                self.channel_layer.room_members[self.room_group_name] = [
                    member for member in self.channel_layer.room_members[self.room_group_name]
                    if member['user_id'] != self.user.id
                ]
                
                if len(self.channel_layer.room_members[self.room_group_name]) == 0:
                    del self.channel_layer.room_members[self.room_group_name]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_message",
                "message": {
                    "type": "user_left",
                    "user": user_name
                },
                "sender_channel": self.channel_name
            }
        )
    
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        
        print(f"{user_name} disconnected from {self.room_name}")




    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Received from {self.user.name}: {data.get('type')}")
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_message",
                "message": data,
                "sender_channel": self.channel_name,
                "sender_name": self.user.name
            }
        )

    async def send_message(self, event):
        if event.get("sender_channel") is None:
            print(f"Broadcasting {event['message'].get('type')} to {self.user.name}")
            await self.send(text_data=json.dumps(event["message"]))
      
        elif event.get("sender_channel") != self.channel_name:
            print(f"Forwarding {event['message'].get('type')} to {self.user.name}")
            await self.send(text_data=json.dumps(event["message"]))
        else:
            print(f"Skipping echo to sender {self.user.name}")