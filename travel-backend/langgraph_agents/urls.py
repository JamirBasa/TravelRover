from django.urls import path
from . import views
from .views_health import HealthCheckView, QuickHealthView
from .views_photo_proxy import GooglePlacesPhotoProxyView
from .views_places_proxy import GooglePlacesSearchProxyView
from .views_geocoding_proxy import GoogleGeocodingProxyView
from .views_gemini_proxy import gemini_generate, gemini_health
from .views_longcat import longcat_chat, longcat_health

app_name = 'langgraph_agents'

urlpatterns = [
    # Main execution endpoint
    path('execute/', views.LangGraphTravelPlannerView.as_view(), name='execute'),
    
    # Session management
    path('session/<str:session_id>/', views.LangGraphSessionStatusView.as_view(), name='session_status'),
    
    # Transport mode analysis
    path('transport-mode/', views.TransportModeAnalysisView.as_view(), name='transport_mode_analysis'),
    
    # Photo proxy (CORS bypass for Google Places photos)
    path('photo-proxy/', GooglePlacesPhotoProxyView.as_view(), name='photo_proxy'),
    
    # Places search proxy (CORS bypass + secure API key for Google Places search)
    path('places-search/', GooglePlacesSearchProxyView.as_view(), name='places_search'),
    
    # Geocoding proxy (CORS bypass + secure API key for Google Geocoding)
    path('geocoding/', GoogleGeocodingProxyView.as_view(), name='geocoding'),
    
    # Gemini AI proxy (secure API key on backend)
    path('gemini/generate/', gemini_generate, name='gemini_generate'),
    path('gemini/health/', gemini_health, name='gemini_health'),
    
    # LongCat AI proxy (secure API key on backend)
    path('longcat/chat/', longcat_chat, name='longcat_chat'),
    path('longcat/health/', longcat_health, name='longcat_health'),
    
    # Health and monitoring
    path('health/', views.LangGraphHealthCheckView.as_view(), name='health'),
    path('health/detailed/', HealthCheckView.as_view(), name='health_detailed'),
    path('health/ping/', QuickHealthView.as_view(), name='health_ping'),
    
    # Legacy endpoint for backwards compatibility
    path('orchestrate/', views.LangGraphTravelPlannerView.as_view(), name='orchestrate'),
]