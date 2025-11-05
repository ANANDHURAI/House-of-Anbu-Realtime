from django.urls import re_path
from . import consumers
from videocall.routing import websocket_urlpatterns as videocall_ws

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<chat_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
] + videocall_ws

