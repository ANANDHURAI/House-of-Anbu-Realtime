import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Chat, Message
from django.utils import timezone

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Handles ALL global user notifications (calls, chat refreshes, etc.) 
    using a single WebSocket connection to save server RAM.
    """
    async def connect(self):
        self.user = self.scope.get("user")
        
        if not self.user or self.user.is_anonymous:
            await self.close()
            return
        
        self.notification_group = f'notifications_{self.user.id}'
        
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )
        
        await self.accept()
        print(f"Global Notification socket connected for {self.user.name}")

    async def disconnect(self, close_code):
        if hasattr(self, 'notification_group'):
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )

    async def send_notification(self, event):
        """A generic sender for any notification type (calls, refreshes)"""
        await self.send(text_data=json.dumps(event['data']))

    # Handlers for specific event types
    async def call_notification(self, event):
        await self.send(text_data=json.dumps(event['data']))
    
    async def call_ended(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def call_cancelled(self, event):
        await self.send(text_data=json.dumps(event['data']))
        
    async def refresh_chat_list(self, event):
        await self.send(text_data=json.dumps({
            'action': event['action'],
            'type': 'refresh_chat_list'
        }))

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            user = self.scope.get("user")
            if not user or user.is_anonymous:
                await self.close()
                return

            data = json.loads(text_data)
            message_content = data.get('message', '').strip()
            
            if not message_content:
                return

            new_msg, user1_id, user2_id = await self.save_message_and_update_chat(
                self.chat_id, user, message_content
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': new_msg.content,
                    'sender': user.name,
                    'sender_id': user.id,
                    'timestamp': new_msg.timestamp.isoformat()
                }
            )

            for user_id in [user1_id, user2_id]:
                await self.channel_layer.group_send(
                    f'notifications_{user_id}',
                    {
                        'type': 'refresh_chat_list',
                        'action': 'refresh'
                    }
                )

        except Exception as e:
            print(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'sender_id': event.get('sender_id'),
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def save_message_and_update_chat(self, chat_id, sender, message_content):
        chat = Chat.objects.get(id=chat_id)
        msg = Message.objects.create(chat=chat, sender=sender, content=message_content)
        chat.updated_at = timezone.now()
        chat.save(update_fields=['updated_at'])
        return msg, chat.user1_id, chat.user2_id