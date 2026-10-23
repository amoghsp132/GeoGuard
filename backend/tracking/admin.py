from django.contrib import admin
from .models import RestrictedZone, Vehicle, VehicleTelemetry, ViolationLog, ProximityWarningLog


@admin.register(RestrictedZone)
class RestrictedZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'zone_type', 'severity', 'warning_threshold_meters', 'is_active', 'created_at')
    list_filter = ('zone_type', 'severity', 'is_active')
    search_fields = ('name', 'description')


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('vehicle_number', 'driver_name', 'vehicle_type', 'current_status', 'distance_to_nearest_zone', 'last_ping_time')
    list_filter = ('current_status', 'vehicle_type')
    search_fields = ('vehicle_number', 'driver_name')


@admin.register(ViolationLog)
class ViolationLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'vehicle', 'zone', 'speed', 'status', 'timestamp')
    list_filter = ('status', 'zone__zone_type')
    search_fields = ('vehicle__vehicle_number', 'zone__name')


@admin.register(ProximityWarningLog)
class ProximityWarningLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'vehicle', 'zone', 'road_distance_meters', 'eta_seconds', 'timestamp')
    list_filter = ('zone',)


@admin.register(VehicleTelemetry)
class VehicleTelemetryAdmin(admin.ModelAdmin):
    list_display = ('id', 'vehicle', 'latitude', 'longitude', 'speed', 'status', 'timestamp')
    list_filter = ('status',)
