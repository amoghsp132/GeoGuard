import json
from channels.generic.websocket import AsyncWebsocketConsumer


class SecurityConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for the Security Monitoring Dashboard.
    Broadcasts real-time vehicle positions, warnings, and violation alerts.
    """
    async def connect(self):
        self.room_group_name = 'security_room'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'CONNECTION_ESTABLISHED',
            'message': 'Connected to Real-Time Security Monitoring Broadcast'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Allow ping / heartbeat
        try:
            data = json.loads(text_data)
            action = data.get('action')
            if action == 'PING':
                await self.send(text_data=json.dumps({'type': 'PONG'}))
        except Exception:
            pass

    async def vehicle_update(self, event):
        """Called when a vehicle sends GPS update and is processed by services.py"""
        await self.send(text_data=json.dumps({
            'type': 'VEHICLE_UPDATE',
            'data': event['payload']
        }))


class DriverConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for the in-vehicle Driver Companion App / Mobile Unit.
    Delivers proximity warnings and in-cab violation alerts.
    """
    async def connect(self):
        self.vehicle_number = self.scope['url_route']['kwargs'].get('vehicle_number', 'DEFAULT')
        safe_group = self.vehicle_number.replace('-', '_').replace(' ', '_')
        self.room_group_name = f"driver_{safe_group}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'DRIVER_CONNECTED',
            'vehicle_number': self.vehicle_number,
            'message': f'Active geofencing tracking enabled for {self.vehicle_number}'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def driver_alert(self, event):
        """Delivers proximity warning or violation directly to driver HUD"""
        await self.send(text_data=json.dumps({
            'type': 'HUD_ALERT',
            'data': event['payload']
        }))
