from datetime import timezone
import uuid
from django.db import models
from django.contrib.auth.models import User

class Room(models.Model):
    code = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    drawing_data = models.JSONField(default=dict)  # Store drawing data as JSON
    shared_text = models.TextField(blank=True)  # Store shared text

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Room {self.code} hosted by {self.host.username}"

class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

class WebSocketTicket(models.Model):
    token = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_valid(self):
        return self.expires_at > timezone.now()