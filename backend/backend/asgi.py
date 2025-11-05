import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django first due to i get AppRegistryNotReady error so load django first then chat routing
django_asgi_app = get_asgi_application()

# Import routing *after* Django setup
import chat.routing
import videocall.routing
from chat.middleware import TokenAuthMiddlewareStack


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns +
            videocall.routing.websocket_urlpatterns
        )
    ),
})
