from django.urls import path
from . import views
from .views_health import HealthCheckView, QuickHealthView
from .views_photo_proxy import GooglePlacesPhotoProxyView

app_name = 'langgraph_agents'

urlpatterns = [
    # Main execution endpoint
    path('execute/', views.LangGraphTravelPlannerView.as_view(), name='execute'),
    
    # Session management
    path('session/<str:session_id>/', views.LangGraphSessionStatusView.as_view(), name='session_status'),
    
    # Photo proxy (CORS bypass for Google Places photos)
    path('photo-proxy/', GooglePlacesPhotoProxyView.as_view(), name='photo_proxy'),
    
    # Health and monitoring
    path('health/', views.LangGraphHealthCheckView.as_view(), name='health'),
    path('health/detailed/', HealthCheckView.as_view(), name='health_detailed'),
    path('health/ping/', QuickHealthView.as_view(), name='health_ping'),
    
    # Legacy endpoint for backwards compatibility
    path('orchestrate/', views.LangGraphTravelPlannerView.as_view(), name='orchestrate'),
]