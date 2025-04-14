from django.urls import path
from rooms.consumers import RoomConsumer

websocket_urlpatterns = [
    path('ws/room/<str:room_code>/', RoomConsumer.as_asgi()),
]