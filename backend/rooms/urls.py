from django.urls import path
from .views import RoomListCreateView, RoomDetailView, MessageCreateView, UserRegistrationView

urlpatterns = [
    path('register', UserRegistrationView.as_view(), name='user-register'),
    path('rooms', RoomListCreateView.as_view(), name='room-list'),
    path('rooms/<uuid:code>', RoomDetailView.as_view(), name='room-detail'),
    path('messages', MessageCreateView.as_view(), name='create-message'),
]
