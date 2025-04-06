import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Room(models.Model):
    code = models.UUIDField(default=uuid.uuid4, unique=True)
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_rooms')
    participants = models.ManyToManyField(User, related_name='joined_rooms', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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

class Drawing(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='drawings')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    data = models.JSONField()  # Store drawing data as JSON
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Drawing by {self.user.username} in room {self.room.code}"
