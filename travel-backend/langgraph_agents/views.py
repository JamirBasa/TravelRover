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
from .throttling import TripGenerationThrottle, BurstTripGenerationThrottle, SessionStatusThrottle, HealthCheckThrottle

logger = get_agent_logger("LangGraphViews")

@method_decorator(csrf_exempt, name='dispatch')
class LangGraphTravelPlannerView(APIView):
    """
    Main LangGraph Travel Planner API endpoint using modular services
    Rate Limited: 5 requests/hour per user, 2 requests/minute burst protection
    """
    throttle_classes = [TripGenerationThrottle, BurstTripGenerationThrottle]
    
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
    Rate Limited: 30 requests/minute per user
    """
    throttle_classes = [SessionStatusThrottle]
    
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

class TransportModeAnalysisView(APIView):
    """
    Transport Mode Analysis API endpoint
    Analyzes optimal transport mode for Philippine routes
    Supports both documented routes and geocoding-based calculations
    """
    
    def post(self, request):
        """
        Analyze transport mode for a route
        
        Request body:
        {
            "departure_city": "Manila",
            "destination": "Baguio",
            "include_flights": true
        }
        
        Response:
        {
            "success": true,
            "data": {
                "mode": "ground_preferred",
                "recommendation": "Ground transport is practical...",
                "ground_route": {
                    "distance": 250,
                    "travel_time": 6,
                    "modes": ["bus"],
                    "operators": ["Victory Liner"],
                    "cost": {"min": 500, "max": 700},
                    ...
                },
                "calculated": false,
                "confidence": "high"
            }
        }
        """
        
        try:
            from .agents.transport_mode_agent import TransportModeAgent
            import uuid
            
            # Extract parameters
            departure_city = request.data.get('departure_city', request.data.get('departureCity', ''))
            destination = request.data.get('destination', '')
            include_flights = request.data.get('include_flights', request.data.get('includeFlights', True))
            
            # Validate inputs
            if not departure_city or not destination:
                return Response({
                    'success': False,
                    'error': 'Both departure_city and destination are required',
                    'error_type': 'validation'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate session ID for this analysis
            session_id = f"transport_mode_{uuid.uuid4().hex[:12]}"
            
            # Create agent and analyze
            agent = TransportModeAgent(session_id=session_id)
            result = agent.analyze_transport_mode(
                destination=destination,
                departure_city=departure_city,
                include_flights=include_flights
            )
            
            # Add success flag if not present
            if 'success' not in result:
                result['success'] = True
            
            # Extract ground transport info and add as ground_route for consistency
            # 🔧 FIX: Only create ground_route if mode is ground_preferred or ground transport is actually available/practical
            ground_transport = result.get('ground_transport')
            is_flight_required = result.get('mode') == 'flight_required'
            
            if ground_transport:
                # Convert ground_transport to ground_route format for frontend compatibility
                try:
                    distance_str = str(ground_transport.get('distance', '0')).replace(' km', '').replace('N/A', '0')
                    distance = int(float(distance_str))  # Convert to float first, then int
                except (ValueError, TypeError):
                    distance = 0
                
                try:
                    time_str = str(ground_transport.get('travel_time', '0')).replace(' hours', '').replace('N/A', '0')
                    travel_time = float(time_str)
                except (ValueError, TypeError):
                    travel_time = 0.0
                
                # Parse modes and operators if they're strings
                modes = ground_transport.get('modes', [])
                if isinstance(modes, str):
                    modes = [m.strip() for m in modes.split(',')]
                
                operators = ground_transport.get('operators', [])
                if isinstance(operators, str):
                    operators = [o.strip() for o in operators.split(',')]
                
                result['ground_route'] = {
                    "distance": distance,
                    "travel_time": travel_time,
                    "modes": modes,
                    "operators": operators,
                    "cost": ground_transport.get('cost', {}),
                    "frequency": ground_transport.get('frequency', 'N/A'),
                    "scenic": ground_transport.get('scenic', False),
                    "has_ferry": 'ferry' in modes,
                    "has_overnight_option": ground_transport.get('has_overnight_option', False),
                    "notes": ground_transport.get('notes', ''),
                    "calculated": ground_transport.get('calculated', False),
                    "confidence": ground_transport.get('confidence', 'unknown'),
                    "practical": ground_transport.get('practical', True),
                    "available": ground_transport.get('available', True),
                }
            elif is_flight_required and result.get('ground_transport_notice'):
                # 🔧 FIX: For flight_required, DON'T create ground_route (it will cause UI duplication)
                # ground_transport_notice is sufficient for showing the warning section
                logger.info(f"⚠️ Flight required route - ground_transport_notice included, ground_route omitted to prevent UI duplication")
            
            logger.info(f"✅ Transport mode analysis: {departure_city} → {destination}: {result.get('mode', 'unknown')}")
            
            return Response(result)
            
        except Exception as e:
            logger.error(f"❌ Transport mode analysis error: {str(e)}")
            return Response({
                'success': False,
                'error': f"Transport mode analysis failed: {str(e)}",
                'error_type': 'internal_error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LangGraphHealthCheckView(APIView):
    """
    Health check endpoint for LangGraph system with comprehensive checks
    Rate Limited: 60 requests/minute
    """
    throttle_classes = [HealthCheckThrottle]
    
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