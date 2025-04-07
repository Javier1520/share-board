"""
ASGI config for share_board project.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'share_board.settings')
django_asgi_app = get_asgi_application()

def get_websocket_application():
    from django.urls import path
    from rooms.consumers import RoomConsumer, DrawingConsumer, ChatConsumer

    websocket_urlpatterns = [
        path('ws/room/<str:room_code>/', RoomConsumer.as_asgi()),
        path('ws/draw/<str:room_code>/', DrawingConsumer.as_asgi()),
        path('ws/chat/<str:room_code>/', ChatConsumer.as_asgi()),
    ]

    return AuthMiddlewareStack(URLRouter(websocket_urlpatterns))

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": get_websocket_application(),
})