"""
ASGI config for share_board project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'share_board.settings')

from rooms.consumers import RoomConsumer, DrawingConsumer, ChatConsumer

websocket_urlpatterns = [
    path('ws/room/<str:room_code>/', RoomConsumer.as_asgi()),
    path('ws/draw/<str:room_code>/', DrawingConsumer.as_asgi()),
    path('ws/chat/<str:room_code>/', ChatConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
