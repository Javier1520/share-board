"""
ASGI config for share_board project.
"""

import os
from django.core.asgi import get_asgi_application

# Set the default Django settings module before importing anything that might depend on it
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Get the ASGI application for HTTP requests
django_asgi_app = get_asgi_application()

# Now import the websocket-related dependencies after Django is configured
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from rooms.middlewares import JWTAuthMiddleware

# Import websocket_urlpatterns after Django is configured
from rooms.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})