from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import Room, Message, WebSocketTicket
from django.contrib.auth.models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'content', 'created_at']

class RoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    class Meta:
        model = Room
        fields = ['id', 'code', 'created_at', 'updated_at', 'drawing_data', 'shared_text', 'messages']

class WebSocketTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebSocketTicket
        fields = ['token']

    def create(self, validated_data):
        user = self.context['request'].user
        ticket = WebSocketTicket.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(minutes=60)
        )
        return ticket
