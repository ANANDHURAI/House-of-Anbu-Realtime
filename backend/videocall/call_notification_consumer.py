import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CallNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        if not self.user or self.user.is_anonymous:
            await self.close()
            return
        
        self.user_id = self.user.id
        self.notification_group = f'call_notifications_{self.user_id}'
        
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )
        
        await self.accept()
        print(f"Call notification connected for user {self.user.name}")

    async def disconnect(self, close_code):
        if hasattr(self, 'notification_group'):
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )
            print(f"Call notification disconnected for user {self.user.name}")

    async def call_notification(self, event):
        await self.send(text_data=json.dumps(event['data']))
    
    async def call_ended(self, event):
        await self.send(text_data=json.dumps(event['data']))