# langgraph_agents/views_health.py
"""
Health check and API key validation endpoints for TravelRover
Ensures all required API keys are configured before system starts
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from langgraph_agents.utils import get_agent_logger

logger = get_agent_logger("HealthCheck")


class HealthCheckView(APIView):
    """
    Comprehensive health check for TravelRover backend
    Validates API keys, database, and agent system status
    """
    
    def get(self, request):
        """Check system health and API key configuration"""
        try:
            # Check API key configuration
            api_keys = self._check_api_keys()
            
            # Check database connectivity
            database_status = self._check_database()
            
            # Check LangGraph agents
            agents_status = self._check_agents()
            
            # Determine overall health
            all_keys_configured = all(key_info['configured'] for key_info in api_keys.values())
            critical_keys = ['serpapi', 'google_places', 'gemini_ai']
            critical_configured = all(api_keys[key]['configured'] for key in critical_keys if key in api_keys)
            
            if critical_configured and database_status['status'] == 'healthy':
                overall_status = 'healthy'
                message = 'All systems operational'
            elif critical_configured:
                overall_status = 'degraded'
                message = 'Core systems functional, some optional services unavailable'
            else:
                overall_status = 'critical'
                message = 'Critical API keys missing - system may not function properly'
            
            return Response({
                'status': overall_status,
                'message': message,
                'timestamp': timezone.now().isoformat(),
                'components': {
                    'api_keys': api_keys,
                    'database': database_status,
                    'agents': agents_status
                },
                'recommendations': self._generate_recommendations(api_keys)
            })
            
        except Exception as e:
            logger.error(f"❌ Health check failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Health check failed: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _check_api_keys(self):
        """Check all API key configurations"""
        api_keys = {
            'serpapi': {
                'name': 'SerpAPI',
                'env_var': 'SERPAPI_KEY',
                'configured': bool(getattr(settings, 'SERPAPI_KEY', None)),
                'purpose': 'Real-time flight search',
                'critical': True
            },
            'google_places': {
                'name': 'Google Places API',
                'env_var': 'GOOGLE_PLACES_API_KEY',
                'configured': bool(getattr(settings, 'GOOGLE_PLACES_API_KEY', None)),
                'purpose': 'Hotel search and location services',
                'critical': True
            },
            'gemini_ai': {
                'name': 'Google Gemini AI',
                'env_var': 'GOOGLE_GEMINI_AI_API_KEY',
                'configured': bool(getattr(settings, 'GOOGLE_GEMINI_AI_API_KEY', None)),
                'purpose': 'AI itinerary generation',
                'critical': True
            },
            'google_maps': {
                'name': 'Google Maps API',
                'env_var': 'GOOGLE_MAPS_API_KEY',
                'configured': bool(getattr(settings, 'GOOGLE_MAPS_API_KEY', None)),
                'purpose': 'Geocoding and mapping',
                'critical': False
            },
            'firebase': {
                'name': 'Firebase',
                'env_var': 'FIREBASE_PROJECT_ID',
                'configured': bool(getattr(settings, 'FIREBASE_PROJECT_ID', None)),
                'purpose': 'Authentication and data storage monitoring',
                'critical': False
            }
        }
        
        # Log API key status
        for key, info in api_keys.items():
            status_emoji = '✅' if info['configured'] else '❌'
            logger.info(f"{status_emoji} {info['name']}: {'Configured' if info['configured'] else 'Missing'}")
        
        return api_keys
    
    def _check_database(self):
        """Check database connectivity"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            return {
                'status': 'healthy',
                'message': 'Database connected',
                'type': 'SQLite'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Database connection failed: {str(e)}',
                'type': 'SQLite'
            }
    
    def _check_agents(self):
        """Check LangGraph agent system status"""
        try:
            # Check if agents are importable
            from langgraph_agents.agents.flight_agent import FlightAgent
            from langgraph_agents.agents.hotel_agent import HotelAgent
            from langgraph_agents.agents.coordinator_agent import CoordinatorAgent
            
            return {
                'status': 'healthy',
                'message': 'All agents available',
                'available_agents': [
                    'FlightAgent',
                    'HotelAgent',
                    'CoordinatorAgent',
                    'RouteOptimizerAgent'
                ]
            }
        except ImportError as e:
            return {
                'status': 'error',
                'message': f'Agent import failed: {str(e)}',
                'available_agents': []
            }
    
    def _generate_recommendations(self, api_keys):
        """Generate actionable recommendations based on configuration"""
        recommendations = []
        
        for key, info in api_keys.items():
            if not info['configured'] and info['critical']:
                recommendations.append({
                    'priority': 'high',
                    'service': info['name'],
                    'message': f"Add {info['env_var']} to .env file",
                    'purpose': info['purpose']
                })
            elif not info['configured']:
                recommendations.append({
                    'priority': 'low',
                    'service': info['name'],
                    'message': f"Optional: Add {info['env_var']} for {info['purpose']}",
                    'purpose': info['purpose']
                })
        
        if not recommendations:
            recommendations.append({
                'priority': 'info',
                'service': 'System',
                'message': 'All API keys configured - system ready',
                'purpose': 'Optimal operation'
            })
        
        return recommendations


class QuickHealthView(APIView):
    """
    Lightweight health check for monitoring and load balancers
    """
    
    def get(self, request):
        """Quick health ping"""
        try:
            # Just check if Django is responding
            return Response({
                'status': 'ok',
                'service': 'TravelRover API',
                'timestamp': timezone.now().isoformat()
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
