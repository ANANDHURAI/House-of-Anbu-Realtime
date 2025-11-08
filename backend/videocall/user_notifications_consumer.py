import json
from channels.generic.websocket import AsyncWebsocketConsumer

class UserNotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        if not self.user or self.user.is_anonymous:
            await self.close()
            return
        
        self.notification_group = f'user_notifications_{self.user.id}'
        
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'notification_group'):
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )
    
    async def refresh_chat_list(self, event):
        await self.send(text_data=json.dumps({
            'action': event['action']
        }))