from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer

class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'code'
    lookup_url_kwarg = 'code'

    def get_queryset(self):
        if self.action == 'list':
            return Room.objects.filter(participants=self.request.user) | Room.objects.filter(host=self.request.user)
        return Room.objects.all()

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)

    @action(detail=True, methods=['post'])
    def join(self, request, code=None):
        room = self.get_object()
        if room.is_active:
            room.participants.add(request.user)
            return Response({'status': 'joined room'})
        return Response({'status': 'room is not active'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def leave(self, request, code=None):
        room = self.get_object()
        if request.user == room.host:
            room.is_active = False
            room.save()
            return Response({'status': 'room closed'})
        else:
            room.participants.remove(request.user)
            return Response({'status': 'left room'})

    @action(detail=True, methods=['patch'])
    def update_drawing(self, request, code=None):
        room = self.get_object()
        room.drawing_data = request.data.get('drawing_data', {})
        room.save()
        return Response({'status': 'drawing updated'})

    @action(detail=True, methods=['patch'])
    def update_text(self, request, code=None):
        room = self.get_object()
        room.shared_text = request.data.get('shared_text', '')
        room.save()
        return Response({'status': 'text updated'})

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_code = self.kwargs['room_code']
        return Message.objects.filter(room__code=room_code)

    def perform_create(self, serializer):
        room_code = self.kwargs['room_code']
        room = get_object_or_404(Room, code=room_code)
        serializer.save(sender=self.request.user, room=room)
