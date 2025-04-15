import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f"room_{self.room_code}"
        self.user = self.scope['user']

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
            shared_text = data.get('shared_text')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'shared.text',
                    'shared_text': shared_text
                }
            )
        elif action == 'save_shared_text':
            await self.update_shared_text(data.get('shared_text'))
        elif action == 'update_drawing':
            drawing_data = data.get('drawing_data')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'drawing.update',
                    'drawing_data': drawing_data
                }
            )
        elif action == 'save_drawing':
            await self.update_drawing_data(data.get('drawing_data'))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def shared_text(self, event):
        await self.send(text_data=json.dumps({
            'action': 'update_shared_text',
            'shared_text': event['shared_text']
        }))

    async def drawing_update(self, event):
        await self.send(text_data=json.dumps({
            'action': 'update_drawing',
            'drawing_data': event['drawing_data']
        }))

    @database_sync_to_async
    def save_message(self, content):
        from .models import Room, Message
        room = Room.objects.get(code=self.room_code)
        return Message.objects.create(room=room, sender=self.user, content=content)

    @database_sync_to_async
    def update_shared_text(self, text):
        from .models import Room
        room = Room.objects.get(code=self.room_code)
        room.shared_text = text
        room.save()

    @database_sync_to_async
    def update_drawing_data(self, data):
        from .models import Room
        room = Room.objects.get(code=self.room_code)
        room.drawing_data = data
        room.save()