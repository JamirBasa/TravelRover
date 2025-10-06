from django.urls import path
from . import views

app_name = 'admin_api'

urlpatterns = [
    # System health check
    path('health/', views.AdminHealthView.as_view(), name='health'),
    
    # Dashboard overview
    path('dashboard/', views.AdminDashboardStatsView.as_view(), name='dashboard'),
    
    # Users management
    path('users/', views.AdminUsersView.as_view(), name='users'),
    path('users/<int:user_id>/', views.AdminUsersView.as_view(), name='user_detail'),
    
    # Trips management  
    path('trips/', views.AdminTripsView.as_view(), name='trips'),
    path('trips/<str:trip_id>/', views.AdminTripsView.as_view(), name='trip_detail'),
    
    # Agents monitoring
    path('agents/', views.AdminAgentsView.as_view(), name='agents'),
    
    # API Key monitoring - NEW
    path('api-keys/', views.AdminAPIKeyMonitoringView.as_view(), name='api_keys'),
    path('api-keys/<str:service_name>/history/', views.AdminAPIKeyHistoryView.as_view(), name='api_key_history'),
]