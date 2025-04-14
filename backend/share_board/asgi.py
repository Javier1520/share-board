"""
ASGI config for share_board project.
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from .routing import websocket_urlpatterns

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'share_board.settings')

# Initialize Django apps
django.setup()

# Get the ASGI application for HTTP
django_asgi_app = get_asgi_application()

# Define the ASGI application
application = ProtocolTypeRouter({
    "http": django_asgi_app,  # Handles HTTP requests
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns  # WebSocket routes
        )
    ),
})