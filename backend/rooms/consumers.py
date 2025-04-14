import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection."""
        try:
            from .models import Room

            self.room_code = self.scope['url_route']['kwargs']['room_code']
            self.room_group_name = f'room_{self.room_code}'
            self.user = self.scope['user']

            logger.info(f"User {self.user.username if self.user.is_authenticated else 'anonymous'} attempting to connect to room {self.room_code}")

            # Validate authentication
            if not self.user.is_authenticated:
                logger.warning(f"Unauthenticated connection attempt to room {self.room_code}")
                await self.close(code=4003)  # Custom close code for auth failure
                return

            # Verify room exists
            room = await self.get_room()
            if not room:
                logger.warning(f"Attempted to connect to non-existent room {self.room_code}")
                await self.close(code=4004)  # Custom close code for invalid room
                return

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
            logger.info(f"User {self.user.username} successfully connected to room {self.room_code}")

            # Send initial state
            await self.send_initial_state()
            # Notify others about the new user
            await self.handle_user_join({})

        except Exception as e:
            logger.error(f"Error connecting to room: {str(e)}", exc_info=True)
            await self.close(code=4002)  # Custom close code for server error

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        try:
            logger.info(f"User {self.user.username if hasattr(self, 'user') and self.user.is_authenticated else 'anonymous'} disconnecting from room {self.room_code if hasattr(self, 'room_code') else 'unknown'}, close code: {close_code}")

            if hasattr(self, 'room_group_name') and hasattr(self, 'channel_name'):
                # Notify others about the user leaving
                if hasattr(self, 'user') and self.user.is_authenticated:
                    await self.handle_user_leave({})

                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.error(f"Error during disconnect: {str(e)}", exc_info=True)

    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            logger.debug(f"Received {message_type} in room {self.room_code}")

            handlers = {
                'chat_message': self.handle_chat_message,
                'drawing': self.handle_drawing,
                'user_join': self.handle_user_join,
                'user_leave': self.handle_user_leave
            }

            if message_type in handlers:
                await handlers[message_type](data)
            else:
                logger.warning(f"Unknown message type: {message_type}")

        except json.JSONDecodeError:
            logger.error("Received invalid JSON data")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")

    # Message handlers
    async def handle_chat_message(self, data):
        """Process chat messages."""
        from .models import Message

        content = data.get('content')
        if not content:
            return

        user = self.scope['user']
        if not user.is_authenticated:
            return

        try:
            await self.save_message(content)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': content,
                    'username': user.username,
                    'user_id': str(user.id)
                }
            )
        except Exception as e:
            logger.error(f"Error handling chat: {str(e)}")

    async def handle_drawing(self, data):
        """Process drawing updates."""
        from .models import Drawing

        drawing_data = data.get('data')
        if not drawing_data:
            return

        user = self.scope['user']
        if not user.is_authenticated:
            return

        try:
            await self.save_drawing(drawing_data)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'drawing_update',
                    'drawing': drawing_data,
                    'username': user.username,
                    'user_id': str(user.id)
                }
            )
        except Exception as e:
            logger.error(f"Error handling drawing: {str(e)}")

    async def handle_user_join(self, data):
        """Handle user join notifications."""
        user = self.scope['user']
        if not user.is_authenticated:
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',
                'user': {
                    'id': str(user.id),
                    'username': user.username
                }
            }
        )

    async def handle_user_leave(self, data):
        """Handle user leave notifications."""
        user = self.scope['user']
        if not user.is_authenticated:
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_leave',
                'user': {
                    'id': str(user.id),
                    'username': user.username
                }
            }
        )

    # Group message handlers
    async def chat_message(self, event):
        """Send chat message to client."""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'content': event['message'],
            'user': {
                'id': event['user_id'],
                'username': event['username']
            }
        }))

    async def drawing_update(self, event):
        """Send drawing update to client."""
        await self.send(text_data=json.dumps({
            'type': 'drawing',
            'drawing': event['drawing'],
            'user': {
                'id': event['user_id'],
                'username': event['username']
            }
        }))

    async def user_join(self, event):
        """Notify client about user join."""
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'user': event['user']
        }))

    async def user_leave(self, event):
        """Notify client about user leave."""
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'user': event['user']
        }))

    # Database operations
    @database_sync_to_async
    def get_room(self):
        """Get room from database."""
        from .models import Room
        try:
            return Room.objects.get(code=self.room_code)
        except Room.DoesNotExist:
            logger.error(f"Room {self.room_code} not found")
            return None

    @database_sync_to_async
    def save_message(self, content):
        """Save message to database."""
        from .models import Room, Message
        room = Room.objects.get(code=self.room_code)
        return Message.objects.create(
            room=room,
            sender=self.scope['user'],
            content=content
        )

    @database_sync_to_async
    def save_drawing(self, data):
        """Save drawing to database."""
        from .models import Room, Drawing
        room = Room.objects.get(code=self.room_code)
        return Drawing.objects.create(
            room=room,
            user=self.scope['user'],
            data=data
        )

    @database_sync_to_async
    def get_initial_state(self):
        """Get initial room state from database."""
        from .models import Room, Message, Drawing
        room = Room.objects.get(code=self.room_code)
        messages = list(Message.objects.filter(room=room).order_by('created_at')[:50].values(
            'content', 'sender__username', 'sender__id', 'created_at'
        ))
        drawings = list(Drawing.objects.filter(room=room).order_by('created_at')[:50].values(
            'data', 'user__username', 'user__id', 'created_at'
        ))
        participants = list(room.participants.values('id', 'username'))

        return {
            'messages': messages,
            'drawings': drawings,
            'participants': participants
        }

    async def send_initial_state(self):
        """Send initial room state to client."""
        try:
            state = await self.get_initial_state()
            await self.send(text_data=json.dumps({
                'type': 'initial_state',
                'data': state
            }))
        except Exception as e:
            logger.error(f"Error sending initial state: {str(e)}")