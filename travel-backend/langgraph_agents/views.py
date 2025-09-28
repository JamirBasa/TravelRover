# langgraph_agents/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .agents.coordinator import CoordinatorAgent
from .models import TravelPlanningSession, AgentExecutionLog
import uuid
import logging
from asgiref.sync import sync_to_async
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

class LangGraphTravelPlannerView(APIView):
    """
    Main LangGraph Travel Planner API endpoint
    Orchestrates multi-agent travel planning workflow
    """
    
    def post(self, request):
        """Execute LangGraph travel planning workflow"""
        
        try:
            # Generate unique session ID
            session_id = str(uuid.uuid4())
            
            logger.info(f"🤖 Starting LangGraph session: {session_id}")
            
            # Validate required parameters
            required_fields = ['destination', 'startDate', 'endDate', 'travelers']
            missing_fields = [field for field in required_fields if not request.data.get(field)]
            
            if missing_fields:
                return Response({
                    'success': False,
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Add session ID to request data
            trip_data = dict(request.data)
            trip_data['session_id'] = session_id
            
            # Execute LangGraph workflow synchronously (Django handles async internally)
            results = self._execute_langgraph_workflow_sync(session_id, trip_data)
            
            # Return results
            return Response({
                'success': True,
                'session_id': session_id,
                'results': results
            })
            
        except Exception as e:
            logger.error(f"❌ LangGraph execution failed: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _execute_langgraph_workflow_sync(self, session_id: str, trip_data: dict) -> dict:
        """Execute the complete LangGraph workflow synchronously"""
        
        try:
            # Create coordinator agent
            coordinator = CoordinatorAgent(session_id)
            
            # Execute workflow synchronously - coordinator will handle async internally
            results = coordinator.execute_sync(trip_data)
            
            logger.info(f"✅ LangGraph workflow completed for session: {session_id}")
            return results
            
        except Exception as e:
            logger.error(f"❌ LangGraph workflow failed for session {session_id}: {e}")
            raise e

class LangGraphSessionStatusView(APIView):
    """
    Get status and results of a LangGraph session
    """
    
    def get(self, request, session_id):
        """Get session status and results"""
        
        try:
            # Get session
            session = TravelPlanningSession.objects.get(session_id=session_id)
            
            # Get agent execution logs
            agent_logs = AgentExecutionLog.objects.filter(session=session).order_by('started_at')
            
            # Prepare response
            response_data = {
                'session_id': str(session.session_id),
                'status': session.status,
                'destination': session.destination,
                'travelers': session.travelers,
                'budget': session.budget,
                'optimization_score': session.optimization_score,
                'total_estimated_cost': float(session.total_estimated_cost) if session.total_estimated_cost else 0,
                'cost_efficiency': session.cost_efficiency,
                'created_at': session.created_at.isoformat(),
                'completed_at': session.completed_at.isoformat() if session.completed_at else None,
                'agent_executions': [
                    {
                        'agent_type': log.agent_type,
                        'status': log.status,
                        'execution_time_ms': log.execution_time_ms,
                        'error_message': log.error_message,
                        'started_at': log.started_at.isoformat(),
                        'completed_at': log.completed_at.isoformat() if log.completed_at else None
                    }
                    for log in agent_logs
                ]
            }
            
            return Response(response_data)
            
        except TravelPlanningSession.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error retrieving session {session_id}: {e}")
            return Response({
                'success': False,
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LangGraphHealthCheckView(APIView):
    """
    Health check endpoint for LangGraph system
    """
    
    def get(self, request):
        """Check LangGraph system health"""
        
        try:
            # Check database connectivity
            session_count = TravelPlanningSession.objects.count()
            
            # Check recent sessions
            recent_sessions = TravelPlanningSession.objects.filter(
                status='completed'
            ).order_by('-completed_at')[:5]
            
            # Calculate success rate
            total_recent = TravelPlanningSession.objects.count()
            completed_recent = TravelPlanningSession.objects.filter(status='completed').count()
            success_rate = (completed_recent / total_recent * 100) if total_recent > 0 else 0
            
            return Response({
                'status': 'healthy',
                'total_sessions': session_count,
                'success_rate': round(success_rate, 1),
                'recent_sessions': len(recent_sessions),
                'agents': {
                    'coordinator': 'active',
                    'flight': 'active', 
                    'hotel': 'active'
                }
            })
            
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)