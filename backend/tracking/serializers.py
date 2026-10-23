from rest_framework import serializers
from .models import RestrictedZone, Vehicle, VehicleTelemetry, ViolationLog, ProximityWarningLog


class RestrictedZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestrictedZone
        fields = '__all__'


class VehicleSerializer(serializers.ModelSerializer):
    nearest_zone_name = serializers.ReadOnlyField(source='nearest_zone.name')

    class Meta:
        model = Vehicle
        fields = '__all__'


class VehicleTelemetrySerializer(serializers.ModelSerializer):
    vehicle_number = serializers.ReadOnlyField(source='vehicle.vehicle_number')

    class Meta:
        model = VehicleTelemetry
        fields = '__all__'


class ViolationLogSerializer(serializers.ModelSerializer):
    vehicle_number = serializers.ReadOnlyField(source='vehicle.vehicle_number')
    driver_name = serializers.ReadOnlyField(source='vehicle.driver_name')
    driver_phone = serializers.ReadOnlyField(source='vehicle.driver_phone')
    zone_name = serializers.ReadOnlyField(source='zone.name')
    zone_type = serializers.ReadOnlyField(source='zone.get_zone_type_display')
    severity = serializers.ReadOnlyField(source='zone.severity')

    class Meta:
        model = ViolationLog
        fields = '__all__'


class ProximityWarningLogSerializer(serializers.ModelSerializer):
    vehicle_number = serializers.ReadOnlyField(source='vehicle.vehicle_number')
    zone_name = serializers.ReadOnlyField(source='zone.name')

    class Meta:
        model = ProximityWarningLog
        fields = '__all__'
