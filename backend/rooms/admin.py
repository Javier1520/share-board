from django.contrib import admin
from .models import Room, Message

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('code', 'host', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'host__username')
    readonly_fields = ('code',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'room', 'content', 'created_at')
    list_filter = ('created_at', 'room')
    search_fields = ('content', 'sender__username', 'room__code')
