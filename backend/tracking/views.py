from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User

from .models import (
    RestrictedZone, 
    Vehicle, 
    VehicleTelemetry, 
    ViolationLog, 
    ProximityWarningLog, 
    UserProfile,
    UserLoginAudit,
    UserLockoutTracker
)
from .serializers import (
    RestrictedZoneSerializer,
    VehicleSerializer,
    VehicleTelemetrySerializer,
    ViolationLogSerializer,
    ProximityWarningLogSerializer
)
from .services import process_vehicle_location


class RestrictedZoneViewSet(viewsets.ModelViewSet):
    queryset = RestrictedZone.objects.all()
    serializer_class = RestrictedZoneSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(current_status=status_filter)
        return queryset


class VehicleLocationUpdateAPIView(APIView):
    """
    Accepts GPS pings from driver smartphone or telematics unit:
    {
      "vehicle_number": "KA-25-EA-1024",
      "latitude": 15.4418,
      "longitude": 75.0062,
      "speed": 42.5,
      "heading": 85.0
    }
    """
    def POST(self, request, *args, **kwargs):
        vehicle_number = request.data.get('vehicle_number')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        speed = request.data.get('speed', 0.0)
        heading = request.data.get('heading', 0.0)

        if not vehicle_number or latitude is None or longitude is None:
            return Response(
                {"error": "vehicle_number, latitude, and longitude are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)
            speed = float(speed)
            heading = float(heading)
        except ValueError:
            return Response(
                {"error": "Invalid numerical coordinates or speed/heading."},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = process_vehicle_location(
            vehicle_id_or_number=vehicle_number,
            latitude=latitude,
            longitude=longitude,
            speed=speed,
            heading=heading
        )
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        return self.POST(request, *args, **kwargs)


class ViolationLogViewSet(viewsets.ModelViewSet):
    queryset = ViolationLog.objects.all().order_by('-timestamp')
    serializer_class = ViolationLogSerializer
    filterset_fields = ['status', 'vehicle', 'zone']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        vehicle_param = self.request.query_params.get('vehicle_number')
        if vehicle_param:
            qs = qs.filter(vehicle__vehicle_number__icontains=vehicle_param)
        return qs


class DashboardStatsAPIView(APIView):
    """Returns overview metrics for the Security Command Center"""
    def get(self, request):
        total_vehicles = Vehicle.objects.count()
        active_violations = ViolationLog.objects.filter(status='ACTIVE').count()
        approaching_warnings = Vehicle.objects.filter(current_status='APPROACHING_WARNING').count()
        total_zones = RestrictedZone.objects.filter(is_active=True).count()

        recent_violations = ViolationLog.objects.select_related('vehicle', 'zone')[:10]
        recent_serializer = ViolationLogSerializer(recent_violations, many=True)

        return Response({
            'total_vehicles': total_vehicles,
            'active_violations': active_violations,
            'approaching_warnings': approaching_warnings,
            'active_zones': total_zones,
            'recent_violations': recent_serializer.data,
            'system_time': timezone.now().isoformat()
        })


class PresetRoutesAPIView(APIView):
    """
    Returns realistic pre-mapped GPS trajectories in Dharwad / SDMCET region
    for instant simulation demonstrations of approaching warning and zone violations.
    """
    def get(self, request):
        routes = [
            {
                'id': 'sdmcet_cantonment_breach',
                'name': 'Route 1: Dhavalagiri Road Approach to Cantonment Zone (Violation Test)',
                'description': 'Starts 1.2km away on PB Road, approaches within 500m (triggers warning), then enters restricted zone (triggers violation).',
                'vehicle_number': 'KA-25-EA-1024',
                'driver_name': 'Amogh S Patil',
                'vehicle_type': 'CAR',
                'waypoints': [
                    {'lat': 15.4485, 'lng': 75.0020, 'speed': 45.0, 'heading': 135.0},
                    {'lat': 15.4468, 'lng': 75.0042, 'speed': 42.0, 'heading': 130.0},
                    {'lat': 15.4450, 'lng': 75.0065, 'speed': 38.0, 'heading': 125.0}, # Approaching 500m warning zone
                    {'lat': 15.4435, 'lng': 75.0080, 'speed': 35.0, 'heading': 120.0}, # Warning threshold crossed
                    {'lat': 15.4422, 'lng': 75.0092, 'speed': 30.0, 'heading': 115.0}, # Imminent breach warning
                    {'lat': 15.4408, 'lng': 75.0105, 'speed': 28.0, 'heading': 110.0}, # Crosses perimeter
                    {'lat': 15.4398, 'lng': 75.0118, 'speed': 25.0, 'heading': 110.0}, # Inside restricted polygon (Violation!)
                    {'lat': 15.4385, 'lng': 75.0125, 'speed': 20.0, 'heading': 105.0}, # Deep inside zone
                ]
            },
            {
                'id': 'campus_vip_corridor',
                'name': 'Route 2: SDMCET Main Gate to VIP Convocation Corridor',
                'description': 'Simulates vehicle entering campus, receiving warning 400m before VIP cordon, and navigating perimeter.',
                'vehicle_number': 'KA-25-MB-4412',
                'driver_name': 'Aryan Shetty',
                'vehicle_type': 'TRUCK',
                'waypoints': [
                    {'lat': 15.4550, 'lng': 75.0150, 'speed': 40.0, 'heading': 180.0},
                    {'lat': 15.4520, 'lng': 75.0152, 'speed': 35.0, 'heading': 182.0},
                    {'lat': 15.4490, 'lng': 75.0155, 'speed': 30.0, 'heading': 185.0},
                    {'lat': 15.4465, 'lng': 75.0158, 'speed': 25.0, 'heading': 180.0},
                    {'lat': 15.4440, 'lng': 75.0160, 'speed': 20.0, 'heading': 180.0},
                ]
            },
            {
                'id': 'safe_outer_bypass',
                'name': 'Route 3: Dharwad Outer Bypass (Safe Route - No Violation)',
                'description': 'Travels along outer highway safely outside all restricted zones. Proves zero false-positives.',
                'vehicle_number': 'KA-25-Z-9009',
                'driver_name': 'Dharesh Dodmani',
                'vehicle_type': 'BUS',
                'waypoints': [
                    {'lat': 15.4600, 'lng': 74.9950, 'speed': 60.0, 'heading': 210.0},
                    {'lat': 15.4540, 'lng': 74.9910, 'speed': 62.0, 'heading': 212.0},
                    {'lat': 15.4480, 'lng': 74.9870, 'speed': 65.0, 'heading': 215.0},
                    {'lat': 15.4420, 'lng': 74.9830, 'speed': 60.0, 'heading': 218.0},
                ]
            }
        ]
        return Response(routes)


class SeedDemoDataAPIView(APIView):
    """Populates initial Dharwad / SDMCET restricted zones and sample vehicles"""
    def post(self, request):
        # 1. SDMCET Cantonment Adjacent Zone (Dharwad)
        zone1, _ = RestrictedZone.objects.get_or_create(
            name="Dharwad Cantonment Security Zone",
            defaults={
                'description': 'High-security perimeter adjacent to military depot & radar installations. Strict vehicle prohibition without security clearance.',
                'zone_type': 'CANTONMENT',
                'severity': 'CRITICAL',
                'warning_threshold_meters': 500.0,
                'is_active': True,
                'color': '#ef4444',
                # Polygon coordinates around 15.4400, 75.0110 in Dharwad
                'coordinates': [
                    [15.4430, 75.0085],
                    [15.4430, 75.0145],
                    [15.4370, 75.0145],
                    [15.4370, 75.0085],
                    [15.4430, 75.0085]
                ]
            }
        )

        # 2. SDMCET High-Security Research & Exam Vault Zone
        zone2, _ = RestrictedZone.objects.get_or_create(
            name="SDMCET Examination & Research Cordon",
            defaults={
                'description': 'Restricted access zone around Central Computing & Research Labs during confidential evaluations.',
                'zone_type': 'CAMPUS_RESTRICTED',
                'severity': 'HIGH',
                'warning_threshold_meters': 400.0,
                'is_active': True,
                'color': '#f97316',
                # Polygon coordinates around SDMCET Dhavalagiri campus
                'coordinates': [
                    [15.4525, 75.0135],
                    [15.4525, 75.0190],
                    [15.4475, 75.0190],
                    [15.4475, 75.0135],
                    [15.4525, 75.0135]
                ]
            }
        )

        # 3. Dharwad Disaster Relief Emergency Corridor
        zone3, _ = RestrictedZone.objects.get_or_create(
            name="VIP Convocation & Disaster Relief Corridor",
            defaults={
                'description': 'Temporary restricted lane reserved exclusively for emergency convoy movement.',
                'zone_type': 'VIP_CORRIDOR',
                'severity': 'MEDIUM',
                'warning_threshold_meters': 350.0,
                'is_active': True,
                'color': '#eab308',
                'coordinates': [
                    [15.4580, 75.0220],
                    [15.4580, 75.0280],
                    [15.4530, 75.0280],
                    [15.4530, 75.0220],
                    [15.4580, 75.0220]
                ]
            }
        )

        # Sample Vehicles
        v1, _ = Vehicle.objects.get_or_create(
            vehicle_number="KA-25-EA-1024",
            defaults={
                'driver_name': 'Amogh S Patil',
                'driver_phone': '+91 98450 11024',
                'vehicle_type': 'CAR',
                'current_latitude': 15.4485,
                'current_longitude': 75.0020,
                'current_speed': 45.0,
                'current_heading': 135.0,
                'current_status': 'NORMAL'
            }
        )

        v2, _ = Vehicle.objects.get_or_create(
            vehicle_number="KA-25-MB-4412",
            defaults={
                'driver_name': 'Aryan Shetty',
                'driver_phone': '+91 97410 44120',
                'vehicle_type': 'TRUCK',
                'current_latitude': 15.4550,
                'current_longitude': 75.0150,
                'current_speed': 35.0,
                'current_heading': 180.0,
                'current_status': 'NORMAL'
            }
        )

        v3, _ = Vehicle.objects.get_or_create(
            vehicle_number="KA-25-Z-9009",
            defaults={
                'driver_name': 'Dharesh Dodmani',
                'driver_phone': '+91 94801 90090',
                'vehicle_type': 'BUS',
                'current_latitude': 15.4600,
                'current_longitude': 74.9950,
                'current_speed': 60.0,
                'current_heading': 210.0,
                'current_status': 'NORMAL'
            }
        )

        v4, _ = Vehicle.objects.get_or_create(
            vehicle_number="KA-25-X-7762",
            defaults={
                'driver_name': 'Neha B Hunshikatti',
                'driver_phone': '+91 99002 77620',
                'vehicle_type': 'SECURITY_PATROL',
                'current_latitude': 15.4435,
                'current_longitude': 75.0080,
                'current_speed': 25.0,
                'current_heading': 90.0,
                'current_status': 'NORMAL'
            }
        )

        # Demo Users for Role-Based Access Control
        # 1. Admin
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={'email': 'admin@sdmcet.ac.in', 'first_name': 'Dr. S. B.', 'last_name': 'Kulkarni'}
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={'role': 'ADMIN', 'phone': '+91 94480 00001'}
        )

        # 2. Security Personnel
        sec_user, created = User.objects.get_or_create(
            username="security",
            defaults={'email': 'security@sdmcet.ac.in', 'first_name': 'Chief', 'last_name': 'Security Officer'}
        )
        if created:
            sec_user.set_password("security123")
            sec_user.save()
        UserProfile.objects.get_or_create(
            user=sec_user,
            defaults={'role': 'SECURITY', 'phone': '+91 94480 00002'}
        )

        # 3. Vehicle Driver
        driver_user, created = User.objects.get_or_create(
            username="driver",
            defaults={'email': 'driver@sdmcet.ac.in', 'first_name': 'Amogh S', 'last_name': 'Patil'}
        )
        if created:
            driver_user.set_password("driver123")
            driver_user.save()
        UserProfile.objects.get_or_create(
            user=driver_user,
            defaults={'role': 'DRIVER', 'phone': '+91 98450 11024', 'assigned_vehicle_number': 'KA-25-EA-1024'}
        )

        return Response({
            "message": "Demo restricted zones, vehicles, and role accounts initialized successfully!",
            "zones_count": RestrictedZone.objects.count(),
            "vehicles_count": Vehicle.objects.count(),
            "accounts": ["admin/admin123", "security/security123", "driver/driver123"]
        })


class RegisterAPIView(APIView):
    """Register a new user account with role selection"""
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        email = request.data.get('email', '').strip()
        full_name = request.data.get('full_name', '').strip()
        role = request.data.get('role', 'SECURITY').upper()
        phone = request.data.get('phone', '').strip()
        vehicle_number = request.data.get('vehicle_number', '').strip()

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        first_name = full_name
        last_name = ''
        if ' ' in full_name:
            first_name, last_name = full_name.split(' ', 1)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        profile = UserProfile.objects.create(
            user=user,
            role=role if role in ['ADMIN', 'SECURITY', 'DRIVER'] else 'SECURITY',
            phone=phone,
            assigned_vehicle_number=vehicle_number
        )

        # If driver, register their vehicle if provided
        if role == 'DRIVER' and vehicle_number:
            Vehicle.objects.get_or_create(
                vehicle_number=vehicle_number,
                defaults={
                    'driver_name': full_name or username,
                    'driver_phone': phone,
                    'vehicle_type': 'CAR'
                }
            )

        return Response({
            'message': 'Account created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'role': profile.role,
                'phone': profile.phone,
                'assigned_vehicle_number': profile.assigned_vehicle_number
            }
        }, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    """Authenticate user, record audit log, and return role details (reused from AngelRide)"""
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        platform = request.data.get('platform', 'web')
        device_id = request.data.get('deviceId', 'browser')
        ip_addr = request.META.get('REMOTE_ADDR')

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            # Audit failed attempt
            UserLoginAudit.objects.create(
                username=username,
                platform=platform,
                device_id=device_id,
                ip_address=ip_addr,
                status='FAILED',
                failure_reason='INVALID_CREDENTIALS'
            )
            return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Audit successful login
        UserLoginAudit.objects.create(
            username=username,
            platform=platform,
            device_id=device_id,
            ip_address=ip_addr,
            status='SUCCESS'
        )

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'ADMIN' if user.is_superuser else 'SECURITY'}
        )

        return Response({
            'status': 'success',
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'role': profile.role,
                'phone': profile.phone,
                'assigned_vehicle_number': profile.assigned_vehicle_number,
                'redirectUrl': '/dashboard'
            }
        })



class AdminUsersAPIView(APIView):
    """Admin: List all registered users with their profiles"""
    def get(self, request):
        # Simple check: pass user_id as query param, verify they have ADMIN role
        user_id = request.query_params.get('requesting_user_id')
        # Get all users with profiles
        users = User.objects.all().select_related('profile').order_by('-date_joined')
        data = []
        for user in users:
            profile = getattr(user, 'profile', None)
            data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.isoformat(),
                'role': profile.role if profile else 'SECURITY',
                'phone': profile.phone if profile else '',
                'assigned_vehicle_number': profile.assigned_vehicle_number if profile else '',
            })
        return Response({'users': data, 'total': len(data)})


class AdminUserDetailAPIView(APIView):
    """Admin: Update or delete a specific user"""
    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Update role
        new_role = request.data.get('role')
        if new_role and new_role in ['ADMIN', 'SECURITY', 'DRIVER']:
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'SECURITY'})
            profile.role = new_role
            profile.save()
            # Sync Django staff/superuser flags
            user.is_staff = (new_role == 'ADMIN')
            user.is_superuser = (new_role == 'ADMIN')

        # Update active status
        is_active = request.data.get('is_active')
        if is_active is not None:
            user.is_active = bool(is_active)

        user.save()
        profile = getattr(user, 'profile', None)
        return Response({
            'id': user.id,
            'username': user.username,
            'is_active': user.is_active,
            'role': profile.role if profile else 'SECURITY',
            'message': 'User updated successfully'
        })

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        username = user.username
        user.delete()
        return Response({'message': f'User {username} deleted successfully'})


class AdminAuditLogsAPIView(APIView):
    """Admin: Get paginated login audit trail"""
    def get(self, request):
        status_filter = request.query_params.get('status', '')
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))

        qs = UserLoginAudit.objects.all().order_by('-login_timestamp')
        if status_filter:
            qs = qs.filter(status=status_filter)

        total = qs.count()
        logs = qs[offset:offset+limit]

        data = [{
            'id': log.id,
            'username': log.username,
            'platform': log.platform,
            'ip_address': str(log.ip_address) if log.ip_address else 'N/A',
            'status': log.status,
            'failure_reason': log.failure_reason or '',
            'timestamp': log.login_timestamp.isoformat(),
        } for log in logs]

        return Response({'logs': data, 'total': total, 'limit': limit, 'offset': offset})


class AdminMetricsAPIView(APIView):
    """Admin: System-level metrics for the admin dashboard"""
    def get(self, request):
        from django.utils import timezone as tz
        import datetime

        today_start = tz.now().replace(hour=0, minute=0, second=0, microsecond=0)

        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        admin_count = UserProfile.objects.filter(role='ADMIN').count()
        security_count = UserProfile.objects.filter(role='SECURITY').count()
        driver_count = UserProfile.objects.filter(role='DRIVER').count()

        logins_today = UserLoginAudit.objects.filter(login_timestamp__gte=today_start).count()
        failed_today = UserLoginAudit.objects.filter(login_timestamp__gte=today_start, status='FAILED').count()
        success_today = UserLoginAudit.objects.filter(login_timestamp__gte=today_start, status='SUCCESS').count()

        active_lockouts = UserLockoutTracker.objects.filter(
            locked_until__gt=tz.now()
        ).count()

        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'role_breakdown': {
                'admin': admin_count,
                'security': security_count,
                'driver': driver_count,
            },
            'login_stats_today': {
                'total': logins_today,
                'success': success_today,
                'failed': failed_today,
            },
            'active_lockouts': active_lockouts,
            'system_time': tz.now().isoformat(),
        })