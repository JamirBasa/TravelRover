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
    Main LangGraph Travel Planner API endpoint
    TEMPORARY: Simplified to debug 502 errors
    """
    throttle_classes = [TripGenerationThrottle, BurstTripGenerationThrottle]
    
    def post(self, request):
        """Execute LangGraph travel planning workflow"""
        try:
            logger.info("🤖 Request received at /execute/")
            return Response({
                'success': False,
                'error': 'Trip generation temporarily disabled for debugging',
                'message': 'Please check back soon - backend is being fixed',
                'timestamp': __import__('django.utils.timezone', fromlist=['now']).now().isoformat()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f"❌ Error in travel planner: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LangGraphSessionStatusView(APIView):
    """
    Get status of a LangGraph session
    TEMPORARY: Simplified to debug 502 errors
    """
    throttle_classes = [SessionStatusThrottle]
    
    def get(self, request, session_id):
        """Get session status and results"""
        try:
            logger.info(f"📊 Session status request for: {session_id}")
            return Response({
                'success': False,
                'error': 'Session retrieval temporarily disabled',
                'session_id': session_id
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f"❌ Error: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    Health check endpoint - Minimal version for debugging
    """
    throttle_classes = [HealthCheckThrottle]
    
    def get(self, request):
        """Check system health"""
        try:
            from django.db import connection
            from django.utils import timezone
            
            health_status = {
                'status': 'healthy',
                'timestamp': timezone.now().isoformat(),
            }
            
            # Check database
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
            except Exception as e:
                health_status['status'] = 'degraded'
                health_status['db_error'] = str(e)
            
            return Response(health_status)
            
        except Exception as e:
            logger.error(f"Health check error: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)