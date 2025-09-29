# langgraph_agents/admin.py
from django.contrib import admin
from .models import TravelPlanningSession, AgentExecutionLog

@admin.register(TravelPlanningSession)
class TravelPlanningSessionAdmin(admin.ModelAdmin):
    list_display = [
        'session_id', 'user_email', 'destination', 'status', 
        'optimization_score', 'total_estimated_cost', 'created_at'
    ]
    list_filter = ['status', 'cost_efficiency', 'created_at']
    search_fields = ['user_email', 'destination', 'session_id']
    readonly_fields = ['session_id', 'created_at']
    ordering = ['-created_at']

@admin.register(AgentExecutionLog)
class AgentExecutionLogAdmin(admin.ModelAdmin):
    list_display = [
        'session', 'agent_type', 'status', 'execution_time_ms', 'started_at'
    ]
    list_filter = ['agent_type', 'status', 'started_at']
    search_fields = ['session__session_id', 'agent_type']
    readonly_fields = ['started_at', 'completed_at']
    ordering = ['-started_at']