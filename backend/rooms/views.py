from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.pagination import PageNumberPagination, CursorPagination
from .models import Room, Message, WebSocketTicket
from .serializers import RoomSerializer, MessageSerializer, UserRegistrationSerializer, WebSocketTicketSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class RoomListCreateView(generics.ListCreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    pagination_class = StandardResultsSetPagination

class RoomDetailView(generics.RetrieveUpdateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    lookup_field = 'code'

class MessageCursorPagination(CursorPagination):
    page_size = 20
    ordering = '-created_at'

class MessageCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessageCursorPagination

    def get_queryset(self):
        room_id = self.request.query_params.get('room_id')
        if room_id is not None:
            return Message.objects.filter(room_id=room_id).order_by('-created_at')
        return Message.objects.none()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class CreateWebSocketTicketView(generics.CreateAPIView):
    serializer_class = WebSocketTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = WebSocketTicket.objects.all()
    throttle_classes = [UserRateThrottle]

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessageCursorPagination
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        room_code = self.kwargs['room_code']
        return Message.objects.filter(room__code=room_code)
