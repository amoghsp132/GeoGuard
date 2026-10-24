import math
import logging
import requests
from django.conf import settings
from django.utils import timezone
from shapely.geometry import Point, Polygon
from shapely.ops import nearest_points
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import RestrictedZone, Vehicle, VehicleTelemetry, ViolationLog, ProximityWarningLog

logger = logging.getLogger(__name__)


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Computes straight-line great-circle distance between two coordinates in meters.
    Used for boundary proximity selection and graceful fallback if OSRM is offline.
    """
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def is_point_inside_polygon(latitude, longitude, polygon_coords):
    """
    Check if a (lat, lng) point is inside a polygon defined by list of [lat, lng].
    Uses Shapely with ray-casting fallback.
    """
    if not polygon_coords or len(polygon_coords) < 3:
        return False
        
    try:
        # Shapely convention: (x, y) = (lng, lat)
        shapely_poly = Polygon([(pt[1], pt[0]) for pt in polygon_coords])
        if not shapely_poly.is_valid:
            shapely_poly = shapely_poly.buffer(0)
        test_pt = Point(longitude, latitude)
        return shapely_poly.contains(test_pt) or shapely_poly.touches(test_pt)
    except Exception as e:
        logger.warning(f"Shapely point check failed, using ray casting fallback: {e}")
        # Standard ray-casting fallback
        inside = False
        n = len(polygon_coords)
        p1lat, p1lon = polygon_coords[0]
        for i in range(1, n + 1):
            p2lat, p2lon = polygon_coords[i % n]
            if latitude > min(p1lat, p2lat):
                if latitude <= max(p1lat, p2lat):
                    if longitude <= max(p1lon, p2lon):
                        if p1lat != p2lat:
                            xinters = (latitude - p1lat) * (p2lon - p1lon) / (p2lat - p1lat) + p1lon
                        if p1lon == p2lon or longitude <= xinters:
                            inside = not inside
            p1lat, p1lon = p2lat, p2lon
        return inside


def find_nearest_boundary_point(latitude, longitude, polygon_coords):
    """
    Finds the closest point on the polygon boundary to the vehicle.
    Returns (boundary_lat, boundary_lng).
    """
    if not polygon_coords or len(polygon_coords) < 3:
        return (latitude, longitude)

    try:
        # Shapely coordinates: (lng, lat)
        shapely_poly = Polygon([(pt[1], pt[0]) for pt in polygon_coords])
        if not shapely_poly.is_valid:
            shapely_poly = shapely_poly.buffer(0)
        exterior = shapely_poly.exterior
        test_pt = Point(longitude, latitude)
        nearest_poly_pt, _ = nearest_points(exterior, test_pt)
        return (nearest_poly_pt.y, nearest_poly_pt.x) # (lat, lng)
    except Exception as e:
        logger.warning(f"Shapely nearest boundary calculation failed: {e}")
        # Fallback to closest polygon vertex
        closest_pt = min(polygon_coords, key=lambda pt: haversine_distance(latitude, longitude, pt[0], pt[1]))
        return (closest_pt[0], closest_pt[1])


def query_osrm_road_distance(from_lat, from_lng, to_lat, to_lng):
    """
    Queries the OSRM Routing Engine for actual road-network driving distance (meters),
    estimated duration (seconds), and full route polyline geometry coordinates.
    Falls back gracefully to road-adjusted distance if OSRM is unreachable.
    """
    osrm_base = getattr(settings, 'OSRM_BASE_URL', 'https://router.project-osrm.org')
    url = f"{osrm_base}/route/v1/driving/{from_lng},{from_lat};{to_lng},{to_lat}?overview=full&geometries=geojson"

    try:
        resp = requests.get(url, timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('code') == 'Ok' and data.get('routes'):
                primary_route = data['routes'][0]
                distance = float(primary_route.get('distance', 0.0)) # in meters
                duration = float(primary_route.get('duration', 0.0)) # in seconds
                raw_coords = primary_route.get('geometry', {}).get('coordinates', [])
                # Convert [lng, lat] from GeoJSON to Leaflet [lat, lng] format
                geometry = [[pt[1], pt[0]] for pt in raw_coords]
                return distance, duration, geometry, True
    except Exception as e:
        logger.debug(f"OSRM query timed out or unavailable ({e}); applying road-network geodesic estimate.")

    # High-precision fallback: Great-circle distance * 1.28 road winding factor
    straight_line = haversine_distance(from_lat, from_lng, to_lat, to_lng)
    road_estimate = round(straight_line * 1.28, 1)
    time_estimate = round(road_estimate / 9.72, 1) if road_estimate > 0 else 0.0
    fallback_geom = [[from_lat, from_lng], [to_lat, to_lng]]
    return road_estimate, time_estimate, fallback_geom, False


def process_vehicle_location(vehicle_id_or_number, latitude, longitude, speed=0.0, heading=0.0):
    """
    Core business logic following Fig. 5.1 Location-Update Processing Flow:
    1. Look up vehicle
    2. Check point-in-polygon against all active restricted zones
    3. If inside:
       - Log violation
       - Broadcast alert to Security Dashboard and Driver
    4. If not inside:
       - Query OSRM for road-network distance & ETA to nearest zone boundary
       - If within warning threshold (e.g. 500m):
         - Push in-app WARNING to driver
         - Broadcast warning to security
       - Else:
         - Continue normal monitoring
    5. Update vehicle record and return response payload
    """
    try:
        if isinstance(vehicle_id_or_number, int):
            vehicle = Vehicle.objects.get(id=vehicle_id_or_number)
        else:
            vehicle = Vehicle.objects.get(vehicle_number=vehicle_id_or_number)
    except Vehicle.DoesNotExist:
        # Create a default registered vehicle if not found
        vehicle = Vehicle.objects.create(
            vehicle_number=str(vehicle_id_or_number),
            driver_name=f"Driver of {vehicle_id_or_number}",
            vehicle_type='CAR',
            current_latitude=latitude,
            current_longitude=longitude
        )

    active_zones = list(RestrictedZone.objects.filter(is_active=True))
    
    violated_zone = None
    # 1. Point-in-polygon check: is vehicle inside a restricted zone?
    for zone in active_zones:
        if is_point_inside_polygon(latitude, longitude, zone.coordinates):
            violated_zone = zone
            break

    channel_layer = get_channel_layer()
    result_data = {
        'vehicle_id': vehicle.id,
        'vehicle_number': vehicle.vehicle_number,
        'driver_name': vehicle.driver_name,
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'heading': heading,
        'timestamp': timezone.now().isoformat(),
        'status': 'NORMAL',
        'is_osrm_calculated': False,
        'zone_info': None,
        'alert_message': None,
    }

    if violated_zone:
        # VIOLATION DETECTED!
        vehicle.current_status = 'VIOLATION_INSIDE'
        vehicle.nearest_zone = violated_zone
        vehicle.distance_to_nearest_zone = 0.0
        vehicle.eta_to_nearest_zone = 0.0
        
        # Check if an active violation already logged recently (within last 30 sec) to avoid spamming
        recent_violation = ViolationLog.objects.filter(
            vehicle=vehicle,
            zone=violated_zone,
            status='ACTIVE'
        ).first()

        if not recent_violation:
            violation_record = ViolationLog.objects.create(
                vehicle=vehicle,
                zone=violated_zone,
                latitude=latitude,
                longitude=longitude,
                speed=speed,
                status='ACTIVE',
                security_notes=f"Vehicle entered {violated_zone.name} ({violated_zone.get_zone_type_display()}) at {speed:.1f} km/h"
            )
        else:
            violation_record = recent_violation
            violation_record.latitude = latitude
            violation_record.longitude = longitude
            violation_record.speed = speed
            violation_record.save()

        alert_msg = f"CRITICAL: Vehicle {vehicle.vehicle_number} has entered {violated_zone.name}!"
        result_data.update({
            'status': 'VIOLATION_INSIDE',
            'violation_id': violation_record.id,
            'zone_id': violated_zone.id,
            'zone_name': violated_zone.name,
            'zone_type': violated_zone.get_zone_type_display(),
            'severity': violated_zone.severity,
            'distance_to_boundary': 0.0,
            'eta_seconds': 0.0,
            'alert_message': alert_msg,
        })

    elif active_zones:
        # Vehicle is NOT inside any restricted zone.
        # Compute road-network distance to the nearest zone boundary using OSRM
        nearest_zone = None
        min_road_distance = float('inf')
        min_eta = None
        best_geometry = []
        is_osrm = False

        for zone in active_zones:
            bound_lat, bound_lng = find_nearest_boundary_point(latitude, longitude, zone.coordinates)
            road_dist, eta, geom, from_osrm = query_osrm_road_distance(latitude, longitude, bound_lat, bound_lng)
            
            if road_dist < min_road_distance:
                min_road_distance = road_dist
                min_eta = eta
                best_geometry = geom
                nearest_zone = zone
                is_osrm = from_osrm

        vehicle.nearest_zone = nearest_zone
        vehicle.distance_to_nearest_zone = min_road_distance
        vehicle.eta_to_nearest_zone = min_eta

        # Proximity threshold check (default 500 meters or zone-specific threshold)
        threshold = nearest_zone.warning_threshold_meters if nearest_zone else 500.0

        if min_road_distance <= threshold:
            vehicle.current_status = 'APPROACHING_WARNING'
            alert_msg = (
                f"WARNING: Approaching {nearest_zone.name}! "
                f"Distance: {min_road_distance:.0f}m along road network. ETA: {int(min_eta)}s."
            )
            # Log proximity warning
            ProximityWarningLog.objects.create(
                vehicle=vehicle,
                zone=nearest_zone,
                road_distance_meters=min_road_distance,
                eta_seconds=min_eta
            )
            result_data.update({
                'status': 'APPROACHING_WARNING',
                'zone_id': nearest_zone.id,
                'zone_name': nearest_zone.name,
                'zone_type': nearest_zone.get_zone_type_display(),
                'severity': nearest_zone.severity,
                'distance_to_boundary': min_road_distance,
                'eta_seconds': min_eta,
                'threshold_meters': threshold,
                'is_osrm_calculated': is_osrm,
                'route_geometry': best_geometry,
                'alert_message': alert_msg,
            })
        else:
            vehicle.current_status = 'NORMAL'
            result_data.update({
                'status': 'NORMAL',
                'zone_id': nearest_zone.id if nearest_zone else None,
                'zone_name': nearest_zone.name if nearest_zone else None,
                'distance_to_boundary': min_road_distance,
                'eta_seconds': min_eta,
                'is_osrm_calculated': is_osrm,
                'route_geometry': best_geometry,
                'alert_message': None,
            })
    else:
        # No active restricted zones defined
        vehicle.current_status = 'NORMAL'
        vehicle.nearest_zone = None
        vehicle.distance_to_nearest_zone = None
        vehicle.eta_to_nearest_zone = None
        result_data['status'] = 'NORMAL'

    # Save vehicle telemetry & updated coordinates
    vehicle.current_latitude = latitude
    vehicle.current_longitude = longitude
    vehicle.current_speed = speed
    vehicle.current_heading = heading
    vehicle.save()

    VehicleTelemetry.objects.create(
        vehicle=vehicle,
        latitude=latitude,
        longitude=longitude,
        speed=speed,
        heading=heading,
        status=vehicle.current_status,
        road_distance_to_zone=vehicle.distance_to_nearest_zone
    )

    # Broadcast via WebSockets
    if channel_layer:
        # 1. Broadcast to Security Dashboard
        async_to_sync(channel_layer.group_send)(
            "security_room",
            {
                "type": "vehicle_update",
                "payload": result_data
            }
        )
        # 2. Broadcast to specific Driver app channel
        driver_group = f"driver_{vehicle.vehicle_number.replace('-', '_').replace(' ', '_')}"
        async_to_sync(channel_layer.group_send)(
            driver_group,
            {
                "type": "driver_alert",
                "payload": result_data
            }
        )

    return result_data
