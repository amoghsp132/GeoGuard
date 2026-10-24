from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'System Administrator'),
        ('SECURITY', 'Security Personnel'),
        ('DRIVER', 'Vehicle Driver'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='SECURITY')
    phone = models.CharField(max_length=20, blank=True, default='')
    assigned_vehicle_number = models.CharField(max_length=30, blank=True, default='')

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class UserLoginAudit(models.Model):
    """Reused from AngelRide auth audit core"""
    username = models.CharField(max_length=255)
    device_id = models.CharField(max_length=255, null=True, blank=True)
    platform = models.CharField(max_length=50, default='web')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    login_timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='SUCCESS') # SUCCESS, FAILED
    failure_reason = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        ordering = ['-login_timestamp']


class UserLockoutTracker(models.Model):
    """Reused from AngelRide brute-force protection core"""
    username = models.CharField(max_length=255, unique=True)
    failed_attempts = models.IntegerField(default=0)
    last_failed_attempt = models.DateTimeField(null=True, blank=True)
    locked_until = models.DateTimeField(null=True, blank=True)
    lockout_reason = models.CharField(max_length=100, null=True, blank=True)


class RestrictedZone(models.Model):
    ZONE_TYPE_CHOICES = [
        ('CANTONMENT', 'Cantonment / Military Zone'),
        ('DISASTER_AREA', 'Disaster Hit Area'),
        ('VIP_CORRIDOR', 'VIP Movement Corridor'),
        ('CAMPUS_RESTRICTED', 'Campus Restricted Zone'),
        ('GENERAL', 'General Restricted Zone'),
    ]

    SEVERITY_CHOICES = [
        ('LOW', 'Low Priority'),
        ('MEDIUM', 'Medium Alert'),
        ('HIGH', 'High Alert'),
        ('CRITICAL', 'Critical High Security'),
    ]

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    zone_type = models.CharField(max_length=30, choices=ZONE_TYPE_CHOICES, default='GENERAL')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='HIGH')
    
    # Stored as [[lat, lng], [lat, lng], ...] representing the closed polygon boundary
    coordinates = models.JSONField(help_text="Array of [lat, lng] coordinates forming polygon boundary")
    
    warning_threshold_meters = models.FloatField(
        default=500.0,
        help_text="Road-network distance threshold (in meters) to trigger warning"
    )
    is_active = models.BooleanField(default=True)
    color = models.CharField(max_length=20, default='#ef4444')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_zone_type_display()})"


class Vehicle(models.Model):
    STATUS_CHOICES = [
        ('NORMAL', 'Normal Operation'),
        ('APPROACHING_WARNING', 'Approaching Restricted Zone Warning'),
        ('VIOLATION_INSIDE', 'Active Violation - Inside Zone'),
    ]

    VEHICLE_TYPE_CHOICES = [
        ('CAR', 'Car / Light Vehicle'),
        ('TRUCK', 'Truck / Heavy Goods Vehicle'),
        ('BUS', 'Bus / Passenger Vehicle'),
        ('BIKE', 'Motorcycle / Two Wheeler'),
        ('EMERGENCY', 'Emergency Response Vehicle'),
        ('SECURITY_PATROL', 'Security Patrol'),
    ]

    vehicle_number = models.CharField(max_length=30, unique=True)
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=20, blank=True, default='')
    vehicle_type = models.CharField(max_length=30, choices=VEHICLE_TYPE_CHOICES, default='CAR')
    
    current_latitude = models.FloatField(null=True, blank=True)
    current_longitude = models.FloatField(null=True, blank=True)
    current_speed = models.FloatField(default=0.0) # km/h
    current_heading = models.FloatField(default=0.0) # degrees
    
    current_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='NORMAL')
    distance_to_nearest_zone = models.FloatField(null=True, blank=True, help_text="Road distance in meters")
    eta_to_nearest_zone = models.FloatField(null=True, blank=True, help_text="ETA in seconds via OSRM")
    nearest_zone = models.ForeignKey(RestrictedZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='approaching_vehicles')
    
    is_active_tracking = models.BooleanField(default=True)
    last_ping_time = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['vehicle_number']

    def __str__(self):
        return f"{self.vehicle_number} ({self.driver_name})"


class VehicleTelemetry(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='telemetry_logs')
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField(default=0.0)
    heading = models.FloatField(default=0.0)
    status = models.CharField(max_length=30)
    road_distance_to_zone = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']


class ViolationLog(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active Violation'),
        ('ACKNOWLEDGED', 'Acknowledged by Security'),
        ('RESOLVED', 'Resolved'),
        ('ESCALATED', 'Escalated to Authorities'),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='violations')
    zone = models.ForeignKey(RestrictedZone, on_delete=models.CASCADE, related_name='violations')
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    security_notes = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Violation {self.vehicle.vehicle_number} in {self.zone.name} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"


class ProximityWarningLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='warning_logs')
    zone = models.ForeignKey(RestrictedZone, on_delete=models.CASCADE, related_name='warning_logs')
    road_distance_meters = models.FloatField()
    eta_seconds = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
