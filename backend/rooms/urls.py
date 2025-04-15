from django.urls import path
from .views import RoomListCreateView, RoomDetailView, MessageCreateView

urlpatterns = [
    path('rooms/', RoomListCreateView.as_view(), name='room-list'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path('messages/', MessageCreateView.as_view(), name='create-message'),
]
