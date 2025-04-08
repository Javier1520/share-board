import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Room, Message, Drawing

logger = logging.getLogger(__name__)
User = get_user_model()

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.room_code = self.scope['url_route']['kwargs']['room_code']
            self.room_group_name = f'room_{self.room_code}'
            logger.info(f"Attempting to connect to room {self.room_code}")

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
            logger.info(f"Successfully connected to room {self.room_code}")
        except Exception as e:
            logger.error(f"Error connecting to room: {str(e)}")
            raise

    async def disconnect(self, close_code):
        try:
            logger.info(f"Disconnecting from room {self.room_code}, close code: {close_code}")
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"Successfully disconnected from room {self.room_code}")
        except Exception as e:
            logger.error(f"Error disconnecting from room: {str(e)}")
            raise

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            logger.debug(f"Received message in room {self.room_code}, type: {message_type}")

            if message_type == 'user_join':
                logger.info(f"User {data['user']} joining room {self.room_code}")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_join',
                        'user': data['user']
                    }
                )
            elif message_type == 'user_leave':
                logger.info(f"User {data['user']} leaving room {self.room_code}")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_leave',
                        'user': data['user']
                    }
                )
        except Exception as e:
            logger.error(f"Error processing received message: {str(e)}")
            raise

    async def user_join(self, event):
        try:
            logger.debug(f"Sending user_join event for user {event['user']}")
            await self.send(text_data=json.dumps({
                'type': 'user_join',
                'user': event['user']
            }))
        except Exception as e:
            logger.error(f"Error sending user_join event: {str(e)}")
            raise

    async def user_leave(self, event):
        try:
            logger.debug(f"Sending user_leave event for user {event['user']}")
            await self.send(text_data=json.dumps({
                'type': 'user_leave',
                'user': event['user']
            }))
        except Exception as e:
            logger.error(f"Error sending user_leave event: {str(e)}")
            raise

class DrawingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.room_code = self.scope['url_route']['kwargs']['room_code']
            self.drawing_group_name = f'drawing_{self.room_code}'
            logger.info(f"Attempting to connect to drawing room {self.room_code}")

            await self.channel_layer.group_add(
                self.drawing_group_name,
                self.channel_name
            )

            await self.accept()
            logger.info(f"Successfully connected to drawing room {self.room_code}")
        except Exception as e:
            logger.error(f"Error connecting to drawing room: {str(e)}")
            raise

    async def disconnect(self, close_code):
        try:
            logger.info(f"Disconnecting from drawing room {self.room_code}, close code: {close_code}")
            await self.channel_layer.group_discard(
                self.drawing_group_name,
                self.channel_name
            )
            logger.info(f"Successfully disconnected from drawing room {self.room_code}")
        except Exception as e:
            logger.error(f"Error disconnecting from drawing room: {str(e)}")
            raise

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            logger.debug(f"Received drawing data in room {self.room_code}, type: {data.get('type')}")

            await self.channel_layer.group_send(
                self.drawing_group_name,
                {
                    'type': 'drawing_update',
                    'data': data
                }
            )

            # Save drawing data to database
            if data.get('type') == 'draw':
                logger.info(f"Saving drawing data for room {self.room_code}")
                await self.save_drawing(data)
        except Exception as e:
            logger.error(f"Error processing drawing data: {str(e)}")
            raise

    async def drawing_update(self, event):
        try:
            logger.debug(f"Sending drawing update for room {self.room_code}")
            await self.send(text_data=json.dumps(event['data']))
        except Exception as e:
            logger.error(f"Error sending drawing update: {str(e)}")
            raise

    @database_sync_to_async
    def save_drawing(self, data):
        try:
            room = Room.objects.get(code=self.room_code)
            user = self.scope['user']
            Drawing.objects.create(room=room, user=user, data=data)
            logger.debug(f"Successfully saved drawing for room {self.room_code} by user {user}")
        except Exception as e:
            logger.error(f"Error saving drawing: {str(e)}")
            raise

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.room_code = self.scope['url_route']['kwargs']['room_code']
            self.chat_group_name = f'chat_{self.room_code}'
            logger.info(f"Attempting to connect to chat room {self.room_code}")

            await self.channel_layer.group_add(
                self.chat_group_name,
                self.channel_name
            )

            await self.accept()
            logger.info(f"Successfully connected to chat room {self.room_code}")
        except Exception as e:
            logger.error(f"Error connecting to chat room: {str(e)}")
            raise

    async def disconnect(self, close_code):
        try:
            logger.info(f"Disconnecting from chat room {self.room_code}, close code: {close_code}")
            await self.channel_layer.group_discard(
                self.chat_group_name,
                self.channel_name
            )
            logger.info(f"Successfully disconnected from chat room {self.room_code}")
        except Exception as e:
            logger.error(f"Error disconnecting from chat room: {str(e)}")
            raise

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data['message']
            username = data['username']
            logger.info(f"Received chat message from {username} in room {self.room_code}")

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
            logger.debug(f"Broadcasted chat message from {username} in room {self.room_code}")
        except Exception as e:
            logger.error(f"Error processing chat message: {str(e)}")
            raise

    async def chat_message(self, event):
        try:
            logger.debug(f"Sending chat message to room {self.room_code} from {event['username']}")
            await self.send(text_data=json.dumps({
                'type': 'chat',
                'message': event['message'],
                'username': event['username']
            }))
        except Exception as e:
            logger.error(f"Error sending chat message: {str(e)}")
            raise

    @database_sync_to_async
    def save_message(self, message):
        try:
            room = Room.objects.get(code=self.room_code)
            user = self.scope['user']
            Message.objects.create(room=room, sender=user, content=message)
            logger.debug(f"Successfully saved chat message for room {self.room_code} by user {user}")
        except Exception as e:
            logger.error(f"Error saving chat message: {str(e)}")
            raise