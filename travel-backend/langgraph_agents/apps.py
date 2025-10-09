# langgraph_agents/apps.py
from django.apps import AppConfig


class LanggraphAgentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'langgraph_agents'
    verbose_name = 'TravelRover LangGraph Agents'
    
    def ready(self):
        """
        Import checks when Django starts
        This registers system checks for API key validation
        """
        from . import checks  # noqa: F401