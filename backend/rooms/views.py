from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Room, Message, Drawing
from .serializers import RoomSerializer, MessageSerializer, DrawingSerializer

# Create your views here.

class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(participants=self.request.user) | Room.objects.filter(host=self.request.user)

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        room = self.get_object()
        if room.is_active:
            room.participants.add(request.user)
            return Response({'status': 'joined room'})
        return Response({'status': 'room is not active'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        room = self.get_object()
        if request.user == room.host:
            room.is_active = False
            room.save()
            return Response({'status': 'room closed'})
        else:
            room.participants.remove(request.user)
            return Response({'status': 'left room'})

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(room_id=self.kwargs['room_pk'])

    def perform_create(self, serializer):
        room = get_object_or_404(Room, pk=self.kwargs['room_pk'])
        serializer.save(sender=self.request.user, room=room)

class DrawingViewSet(viewsets.ModelViewSet):
    serializer_class = DrawingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Drawing.objects.filter(room_id=self.kwargs['room_pk'])

    def perform_create(self, serializer):
        room = get_object_or_404(Room, pk=self.kwargs['room_pk'])
        serializer.save(user=self.request.user, room=room)
