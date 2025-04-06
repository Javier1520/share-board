from rest_framework_nested import routers
from django.urls import path, include
from .views import RoomViewSet, MessageViewSet, DrawingViewSet

router = routers.SimpleRouter()
router.register(r'', RoomViewSet, basename='room')

rooms_router = routers.NestedSimpleRouter(router, r'', lookup='room')
rooms_router.register(r'messages', MessageViewSet, basename='room-messages')
rooms_router.register(r'drawings', DrawingViewSet, basename='room-drawings')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(rooms_router.urls)),
]