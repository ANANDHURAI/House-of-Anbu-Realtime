from django.urls import re_path
from . import consumers
from .call_notification_consumer import CallNotificationConsumer
from .user_notifications_consumer import UserNotificationsConsumer

websocket_urlpatterns = [
    re_path(r'ws/videocall/(?P<room_name>\w+)/$', consumers.VideoCallConsumer.as_asgi()),
    re_path(r'ws/call-notifications/$', CallNotificationConsumer.as_asgi()),
    re_path(r'ws/user-notifications/$', UserNotificationsConsumer.as_asgi()),
    
]
