from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    
    re_path(r'ws/chat/(?P<chat_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/room/(?P<room_id>\w+)/$', consumers.RoomChatConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]