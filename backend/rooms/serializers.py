from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Room, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'content', 'created_at']
        read_only_fields = ['room', 'sender']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'code', 'host', 'participants', 'is_active', 'created_at',
                 'updated_at', 'messages', 'drawing_data', 'shared_text']
        read_only_fields = ['code', 'host', 'participants']