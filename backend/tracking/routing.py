from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/security/$', consumers.SecurityConsumer.as_asgi()),
    re_path(r'^ws/driver/(?P<vehicle_number>[^/]+)/$', consumers.DriverConsumer.as_asgi()),
]
