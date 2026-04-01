# langgraph_agents/apps.py
from django.apps import AppConfig


class LanggraphAgentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'langgraph_agents'
    verbose_name = 'TravelRover LangGraph Agents'
    
    def ready(self):
        """
        Initialize app when Django starts
        CRITICAL: Don't crash the entire app on initialization errors
        """
        try:
            # Import checks for system validation
            from . import checks  # noqa: F401
        except Exception as e:
            # Log the error but don't crash
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"⚠️ Check registry initialization failed: {str(e)}", exc_info=True)