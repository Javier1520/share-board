from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Room, Message, Drawing

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'content', 'created_at']
        read_only_fields = ['room', 'sender']

class DrawingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Drawing
        fields = ['id', 'room', 'user', 'data', 'created_at']
        read_only_fields = ['room', 'user']

class RoomSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    drawings = DrawingSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'code', 'host', 'participants', 'is_active', 'created_at', 'updated_at', 'messages', 'drawings']
        read_only_fields = ['code', 'host', 'participants']