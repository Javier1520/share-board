from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Room, Message, Drawing
from .serializers import RoomSerializer, MessageSerializer, DrawingSerializer

class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'code'  # Change from pk to code
    lookup_url_kwarg = 'code'  # Add this line

    def get_queryset(self):
        return Room.objects.filter(participants=self.request.user) | Room.objects.filter(host=self.request.user)

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)
        # Add logging
        print(f"Created room with code: {serializer.instance.code}")

    @action(detail=True, methods=['post'])
    def join(self, request, code=None):  # Change pk to code
        room = self.get_object()
        print(f"User {request.user} attempting to join room {code}")
        if room.is_active:
            room.participants.add(request.user)
            print(f"User {request.user} successfully joined room {code}")
            return Response({'status': 'joined room'})
        return Response({'status': 'room is not active'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def leave(self, request, code=None):  # Change pk to code
        room = self.get_object()
        print(f"User {request.user} attempting to leave room {code}")
        if request.user == room.host:
            room.is_active = False
            room.save()
            print(f"Host {request.user} closed room {code}")
            return Response({'status': 'room closed'})
        else:
            room.participants.remove(request.user)
            print(f"User {request.user} left room {code}")
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
