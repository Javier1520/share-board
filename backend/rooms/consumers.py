import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Message
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f"room_{self.room_code}"

        self.user = await self.get_user()

        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'message':
            content = data.get('content')
            await self.save_message(content)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat.message',
                    'sender': self.user.username,
                    'content': content
                }
            )
        elif action == 'update_shared_text':
            await self.update_shared_text(data.get('shared_text'))
        elif action == 'update_drawing':
            await self.update_drawing_data(data.get('drawing_data'))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user(self):
        query_string = self.scope['query_string'].decode()
        token = parse_qs(query_string).get('token', [None])[0]
        if not token:
            return AnonymousUser()
        try:
            validated_token = UntypedToken(token)
            jwt_auth = JWTAuthentication()
            user, _ = jwt_auth.get_user(validated_token), validated_token
            return user
        except:
            return AnonymousUser()

    @database_sync_to_async
    def save_message(self, content):
        room = Room.objects.get(code=self.room_code)
        return Message.objects.create(room=room, sender=self.user, content=content)

    @database_sync_to_async
    def update_shared_text(self, text):
        room = Room.objects.get(code=self.room_code)
        room.shared_text = text
        room.save()

    @database_sync_to_async
    def update_drawing_data(self, data):
        room = Room.objects.get(code=self.room_code)
        room.drawing_data = data
        room.save()
