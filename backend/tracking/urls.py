from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RestrictedZoneViewSet,
    VehicleViewSet,
    VehicleLocationUpdateAPIView,
    ViolationLogViewSet,
    DashboardStatsAPIView,
    PresetRoutesAPIView,
    SeedDemoDataAPIView,
    RegisterAPIView,
    LoginAPIView,
    AdminUsersAPIView,
    AdminUserDetailAPIView,
    AdminAuditLogsAPIView,
    AdminMetricsAPIView,
)

router = DefaultRouter()
router.register(r'zones', RestrictedZoneViewSet, basename='zone')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'violations', ViolationLogViewSet, basename='violation')

urlpatterns = [
    path('', include(router.urls)),
    path('vehicles/location/', VehicleLocationUpdateAPIView.as_view(), name='vehicle-location-update'),
    path('dashboard/stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('simulation/routes/', PresetRoutesAPIView.as_view(), name='preset-routes'),
    path('seed-demo-data/', SeedDemoDataAPIView.as_view(), name='seed-demo-data'),
    path('auth/register/', RegisterAPIView.as_view(), name='auth-register'),
    path('auth/login/', LoginAPIView.as_view(), name='auth-login'),
    path('admin/users/', AdminUsersAPIView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/', AdminUserDetailAPIView.as_view(), name='admin-user-detail'),
    path('admin/audit-logs/', AdminAuditLogsAPIView.as_view(), name='admin-audit-logs'),
    path('admin/metrics/', AdminMetricsAPIView.as_view(), name='admin-metrics'),
]
