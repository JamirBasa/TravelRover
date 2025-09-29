# langgraph_agents/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from .services import OrchestrationService, SessionService
from .utils import get_agent_logger, validate_email
from .exceptions import LangGraphAgentError, DataValidationError
from .models import TravelPlanningSession, AgentExecutionLog

logger = get_agent_logger("LangGraphViews")

@method_decorator(csrf_exempt, name='dispatch')
class LangGraphTravelPlannerView(APIView):
    """
    Main LangGraph Travel Planner API endpoint using modular services
    """
    
    def post(self, request):
        """Execute LangGraph travel planning workflow"""
        
        async def async_handler():
            try:
                logger.info("🤖 Starting LangGraph travel planning request")
                
                # Extract and validate user email
                user_email = validate_email(
                    request.data.get('userEmail', request.data.get('user_email', ''))
                )
                
                # Extract trip parameters
                trip_params = request.data.get('tripParams', request.data)
                
                logger.info(f"🎯 Processing request for {user_email}: {trip_params.get('destination', 'Unknown')}")
                
                # Create orchestration service and execute workflow
                orchestration_service = OrchestrationService()
                results = await orchestration_service.execute_workflow(user_email, trip_params)
                
                logger.info(f"✅ LangGraph workflow completed: {results.get('session_id')}")
                
                return Response(results)
                
            except DataValidationError as e:
                logger.warning(f"⚠️ Validation error: {str(e)}")
                return Response({
                    'success': False,
                    'error': f"Validation error: {str(e)}",
                    'error_type': 'validation'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            except LangGraphAgentError as e:
                logger.error(f"❌ LangGraph agent error: {str(e)}")
                return Response({
                    'success': False,
                    'error': str(e),
                    'error_type': 'agent_error'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except Exception as e:
                logger.error(f"❌ Unexpected error: {str(e)}")
                return Response({
                    'success': False,
                    'error': f"Internal server error: {str(e)}",
                    'error_type': 'internal_error'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Run async handler synchronously
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(async_handler())

class LangGraphSessionStatusView(APIView):
    """
    Get status and results of a LangGraph session using services
    """
    
    def get(self, request, session_id):
        """Get session status and results"""
        
        async def async_handler():
            try:
                logger.info(f"📊 Getting session status: {session_id}")
                
                session_service = SessionService()
                
                # Get session data
                session_data = await session_service.get_session(session_id)
                if not session_data:
                    return Response({
                        'success': False,
                        'error': 'Session not found'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Get execution logs
                logs = await session_service.get_session_logs(session_id)
                
                response_data = {
                    'success': True,
                    'session': session_data,
                    'execution_logs': logs,
                    'summary': {
                        'total_agents': len(set(log['agent_type'] for log in logs)),
                        'successful_executions': len([log for log in logs if log['status'] == 'success']),
                        'failed_executions': len([log for log in logs if log['status'] == 'failed']),
                        'total_execution_time_ms': sum(log.get('execution_time_ms', 0) for log in logs)
                    }
                }
                
                return Response(response_data)
                
            except Exception as e:
                logger.error(f"❌ Error retrieving session {session_id}: {str(e)}")
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Run async handler synchronously
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(async_handler())

class LangGraphHealthCheckView(APIView):
    """
    Health check endpoint for LangGraph system with comprehensive checks
    """
    
    def get(self, request):
        """Check LangGraph system health"""
        
        try:
            from datetime import timedelta
            from django.db import connection
            from django.utils import timezone
            
            health_status = {
                'status': 'healthy',
                'timestamp': timezone.now().isoformat(),
                'version': '1.0.0',
                'components': {}
            }
            
            # Check database connectivity
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                health_status['components']['database'] = 'healthy'
                
                # Get session statistics
                session_count = TravelPlanningSession.objects.count()
                recent_sessions = TravelPlanningSession.objects.filter(
                    created_at__gte=timezone.now() - timedelta(hours=24)
                )
                
                completed_sessions = recent_sessions.filter(status='completed')
                success_rate = (completed_sessions.count() / recent_sessions.count() * 100) if recent_sessions.count() > 0 else 100
                
                health_status['metrics'] = {
                    'total_sessions': session_count,
                    'recent_sessions_24h': recent_sessions.count(),
                    'success_rate_24h': round(success_rate, 1)
                }
                
            except Exception as e:
                health_status['components']['database'] = f'unhealthy: {str(e)}'
                health_status['status'] = 'degraded'
            
            # Check agent services
            try:
                from .services import OrchestrationService
                orchestration_service = OrchestrationService()
                health_status['components']['orchestration_service'] = 'healthy'
                health_status['components']['agents'] = {
                    'coordinator': 'active',
                    'flight_agent': 'active',
                    'hotel_agent': 'active'
                }
            except Exception as e:
                health_status['components']['orchestration_service'] = f'unhealthy: {str(e)}'
                health_status['status'] = 'degraded'
            
            # Overall status
            if any('unhealthy' in str(v) for v in health_status['components'].values()):
                health_status['status'] = 'unhealthy'
            elif any('degraded' in str(v) for v in health_status['components'].values()):
                health_status['status'] = 'degraded'
            
            response_status = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
            
            return Response(health_status, status=response_status)
            
        except Exception as e:
            logger.error(f"❌ Health check failed: {str(e)}")
            return Response({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)