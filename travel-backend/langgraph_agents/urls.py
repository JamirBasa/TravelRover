# langgraph_agents/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('execute/', views.LangGraphTravelPlannerView.as_view(), name='langgraph-execute'),
    path('status/<uuid:session_id>/', views.LangGraphSessionStatusView.as_view(), name='langgraph-status'),
    path('health/', views.LangGraphHealthCheckView.as_view(), name='langgraph-health'),
]