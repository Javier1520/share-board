"""
ASGI config for share_board project.
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from rooms.routing import websocket_urlpatterns

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.config.settings')

# Initialize Django apps
django.setup()

# Define the ASGI application
application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Handles HTTP requests
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns  # WebSocket routes
        )
    ),
})