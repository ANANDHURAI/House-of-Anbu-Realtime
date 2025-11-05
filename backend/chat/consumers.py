
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Chat, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'

        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"WebSocket connected for chat {self.chat_id}")

    async def disconnect(self, close_code):
        
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"WebSocket disconnected for chat {self.chat_id}")

    async def receive(self, text_data):
        try:
            
            user = self.scope.get("user")
            
          
            if not user or user.is_anonymous:
                await self.send(text_data=json.dumps({
                    'error': 'User not authenticated'
                }))
                await self.close()
                return

            data = json.loads(text_data)
            message_content = data.get('message', '').strip()
            
            if not message_content:
                return

            
            chat = await self.get_chat(self.chat_id)
            new_msg = await self.create_message(chat, user, message_content)

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
            
            print(f"Message sent: {message_content} from {user.name}")

        except Exception as e:
            print(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'error': str(e)
            }))

    async def chat_message(self, event):
   
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'sender_id': event.get('sender_id'),
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def get_chat(self, chat_id):
        return Chat.objects.get(id=chat_id)

    @database_sync_to_async
    def create_message(self, chat, sender, message):
        return Message.objects.create(
            chat=chat, 
            sender=sender, 
            content=message
        )