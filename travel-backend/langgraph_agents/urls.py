from django.urls import path
from . import views

app_name = 'langgraph_agents'

urlpatterns = [
    # Main execution endpoint
    path('execute/', views.LangGraphTravelPlannerView.as_view(), name='execute'),
    
    # Session management
    path('session/<str:session_id>/', views.LangGraphSessionStatusView.as_view(), name='session_status'),
    
    # Health and monitoring
    path('health/', views.LangGraphHealthCheckView.as_view(), name='health'),
    
    # Legacy endpoint for backwards compatibility
    path('orchestrate/', views.LangGraphTravelPlannerView.as_view(), name='orchestrate'),
]