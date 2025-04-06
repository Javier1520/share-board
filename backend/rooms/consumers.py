import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Room, Message, Drawing

User = get_user_model()

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'room_{self.room_code}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'user_join':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'user': data['user']
                }
            )
        elif message_type == 'user_leave':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': data['user']
                }
            )

    async def user_join(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'user': event['user']
        }))

    async def user_leave(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'user': event['user']
        }))

class DrawingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.drawing_group_name = f'drawing_{self.room_code}'

        await self.channel_layer.group_add(
            self.drawing_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.drawing_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)

        await self.channel_layer.group_send(
            self.drawing_group_name,
            {
                'type': 'drawing_update',
                'data': data
            }
        )

        # Save drawing data to database
        if data.get('type') == 'draw':
            await self.save_drawing(data)

    async def drawing_update(self, event):
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def save_drawing(self, data):
        room = Room.objects.get(code=self.room_code)
        user = self.scope['user']
        Drawing.objects.create(room=room, user=user, data=data)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.chat_group_name = f'chat_{self.room_code}'

        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        username = data['username']

        # Save message to database
        await self.save_message(message)

        await self.channel_layer.group_send(
            self.chat_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'message': event['message'],
            'username': event['username']
        }))

    @database_sync_to_async
    def save_message(self, message):
        room = Room.objects.get(code=self.room_code)
        user = self.scope['user']
        Message.objects.create(room=room, sender=user, content=message)