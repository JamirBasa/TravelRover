from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, Avg, Count, Q
from django.http import JsonResponse
from datetime import datetime, timedelta
from .services import APIKeyMonitoringService
from typing import Dict, Any, List
from langgraph_agents.utils import get_agent_logger

import asyncio
import logging

logger = get_agent_logger("AdminAPI")

# Import LangGraph models and utilities with error handling
try:
    from langgraph_agents.models import TravelPlanningSession, AgentExecutionLog
    from langgraph_agents.utils import get_agent_logger
    logger = get_agent_logger("AdminAPI")
    LANGGRAPH_AVAILABLE = True
except ImportError:
    # Fallback if LangGraph models don't exist yet
    logger = logging.getLogger("AdminAPI")
    TravelPlanningSession = None
    AgentExecutionLog = None
    LANGGRAPH_AVAILABLE = False

@method_decorator(csrf_exempt, name='dispatch')
class AdminDashboardStatsView(APIView):
    """Admin dashboard overview statistics following TravelRover patterns"""
    
    def get(self, request):
        """Get comprehensive dashboard statistics"""
        try:
            now = datetime.now()
            last_24h = now - timedelta(hours=24)
            last_7d = now - timedelta(days=7)
            
            # User statistics - always available
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            new_users_24h = User.objects.filter(date_joined__gte=last_24h).count()
            new_users_7d = User.objects.filter(date_joined__gte=last_7d).count()
            
            # Initialize trip and agent stats
            trip_stats = {
                'total': 0,
                'completed': 0,
                'success_rate': 0,
                'new_24h': 0,
                'new_7d': 0
            }
            
            agent_stats = {
                'total_executions': 0,
                'successful_executions': 0,
                'success_rate': 0,
                'executions_24h': 0
            }
            
            revenue_stats = {
                'total_estimated': 0.0,
                'average_trip_value': 0.0
            }
            
            # Trip statistics (only if LangGraph is available)
            if LANGGRAPH_AVAILABLE and TravelPlanningSession:
                total_trips = TravelPlanningSession.objects.count()
                completed_trips = TravelPlanningSession.objects.filter(status='completed').count()
                trips_24h = TravelPlanningSession.objects.filter(created_at__gte=last_24h).count()
                trips_7d = TravelPlanningSession.objects.filter(created_at__gte=last_7d).count()
                
                # Financial statistics
                total_estimated_revenue = TravelPlanningSession.objects.aggregate(
                    total=Sum('total_estimated_cost')
                )['total'] or 0
                
                trip_stats.update({
                    'total': total_trips,
                    'completed': completed_trips,
                    'success_rate': round((completed_trips / total_trips * 100) if total_trips > 0 else 0, 1),
                    'new_24h': trips_24h,
                    'new_7d': trips_7d
                })
                
                revenue_stats.update({
                    'total_estimated': float(total_estimated_revenue),
                    'average_trip_value': round(float(total_estimated_revenue) / total_trips if total_trips > 0 else 0, 2)
                })
            
            # Agent statistics (only if AgentExecutionLog is available)
            if LANGGRAPH_AVAILABLE and AgentExecutionLog:
                total_agent_executions = AgentExecutionLog.objects.count()
                successful_executions = AgentExecutionLog.objects.filter(status='completed').count()
                executions_24h = AgentExecutionLog.objects.filter(started_at__gte=last_24h).count()
                
                agent_stats.update({
                    'total_executions': total_agent_executions,
                    'successful_executions': successful_executions,
                    'success_rate': round((successful_executions / total_agent_executions * 100) if total_agent_executions > 0 else 0, 1),
                    'executions_24h': executions_24h
                })
            
            return Response({
                'success': True,
                'overview': {
                    'users': {
                        'total': total_users,
                        'active': active_users,
                        'new_24h': new_users_24h,
                        'new_7d': new_users_7d,
                        'growth_rate': round((new_users_7d / total_users * 100) if total_users > 0 else 0, 1)
                    },
                    'trips': trip_stats,
                    'agents': agent_stats,
                    'revenue': revenue_stats
                },
                'system_status': {
                    'langgraph_available': LANGGRAPH_AVAILABLE,
                    'backend_status': 'online',
                    'database_status': 'healthy'
                },
                'timestamp': now.isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Error fetching dashboard stats: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class AdminUsersView(APIView):
    """Admin endpoint for comprehensive user management"""
    
    def get(self, request):
        """Get all users with trip statistics"""
        try:
            logger.info("🔍 Admin: Fetching all users with statistics")
            
            # Get all users from Django User model
            users = User.objects.all().order_by('-date_joined')
            
            users_data = []
            for user in users:
                # Calculate user trip statistics if available
                trip_stats = {
                    'total_trips': 0,
                    'completed_trips': 0,
                    'total_spent_estimated': 0.0
                }
                
                if LANGGRAPH_AVAILABLE and TravelPlanningSession:
                    user_sessions = TravelPlanningSession.objects.filter(user_email=user.email)
                    trip_stats.update({
                        'total_trips': user_sessions.count(),
                        'completed_trips': user_sessions.filter(status='completed').count(),
                        'total_spent_estimated': float(user_sessions.aggregate(
                            total=Sum('total_estimated_cost')
                        )['total'] or 0)
                    })
                
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined.isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    **trip_stats
                })
            
            return Response({
                'success': True,
                'users': users_data,
                'metadata': {
                    'total_count': len(users_data),
                    'active_count': len([u for u in users_data if u['is_active']]),
                    'staff_count': len([u for u in users_data if u['is_staff']]),
                    'langgraph_integrated': LANGGRAPH_AVAILABLE
                }
            })
            
        except Exception as e:
            logger.error(f"❌ Error fetching users: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, user_id):
        """Safely delete a user with proper validation"""
        try:
            logger.info(f"🗑️ Admin: Attempting to delete user {user_id}")
            
            user = User.objects.get(id=user_id)
            
            # Security check - prevent deletion of superusers
            if user.is_superuser:
                return Response({
                    'success': False,
                    'error': 'Cannot delete superuser accounts for security reasons'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Clean up associated data if LangGraph is available
            if LANGGRAPH_AVAILABLE and TravelPlanningSession:
                # Delete user's travel sessions and logs
                sessions = TravelPlanningSession.objects.filter(user_email=user.email)
                sessions_count = sessions.count()
                
                if AgentExecutionLog:
                    # Delete execution logs first (foreign key constraint)
                    for session in sessions:
                        AgentExecutionLog.objects.filter(session=session).delete()
                
                # Delete travel sessions
                sessions.delete()
                logger.info(f"🧹 Cleaned up {sessions_count} travel sessions for user {user.email}")
            
            # Delete the user
            user.delete()
            
            logger.info(f"✅ User {user_id} deleted successfully")
            return Response({
                'success': True,
                'message': 'User and associated data deleted successfully'
            })
            
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"❌ Error deleting user: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class AdminTripsView(APIView):
    """Admin endpoint for TravelRover trip management"""
    
    def get(self, request):
        """Get all trips with comprehensive LangGraph session details"""
        try:
            logger.info("🔍 Admin: Fetching all travel sessions")
            
            if not LANGGRAPH_AVAILABLE or not TravelPlanningSession:
                return Response({
                    'success': True,
                    'trips': [],
                    'statistics': {
                        'total_trips': 0,
                        'completed_trips': 0,
                        'success_rate': 0,
                        'total_estimated_cost': 0,
                        'average_trip_cost': 0
                    },
                    'message': 'LangGraph travel planning system not configured'
                })
            
            # Get all travel planning sessions
            sessions = TravelPlanningSession.objects.all().order_by('-created_at')
            
            trips_data = []
            for session in sessions:
                # Get agent execution statistics if available
                agent_stats = {
                    'total_executions': 0,
                    'successful_executions': 0,
                    'failed_executions': 0
                }
                
                if AgentExecutionLog:
                    logs = AgentExecutionLog.objects.filter(session=session)
                    agent_stats.update({
                        'total_executions': logs.count(),
                        'successful_executions': logs.filter(status='completed').count(),
                        'failed_executions': logs.filter(status='failed').count()
                    })
                
                trip_data = {
                    'id': str(session.session_id),
                    'user_email': session.user_email,
                    'destination': session.destination,
                    'start_date': session.start_date.isoformat() if session.start_date else None,
                    'end_date': session.end_date.isoformat() if session.end_date else None,
                    'duration': (session.end_date - session.start_date).days if session.start_date and session.end_date else 0,
                    'travelers': session.travelers,
                    'budget': session.budget,
                    'status': session.status,
                    'optimization_score': session.optimization_score,
                    'total_estimated_cost': float(session.total_estimated_cost or 0),
                    'cost_efficiency': session.cost_efficiency,
                    'flight_search_requested': session.flight_search_requested,
                    'hotel_search_requested': session.hotel_search_requested,
                    'flight_search_completed': session.flight_search_completed,
                    'hotel_search_completed': session.hotel_search_completed,
                    'created_at': session.created_at.isoformat(),
                    'completed_at': session.completed_at.isoformat() if session.completed_at else None,
                    **agent_stats
                }
                trips_data.append(trip_data)
            
            # Calculate aggregate statistics
            total_trips = len(trips_data)
            completed_trips = len([t for t in trips_data if t['status'] == 'completed'])
            total_estimated_cost = sum(t['total_estimated_cost'] for t in trips_data)
            
            return Response({
                'success': True,
                'trips': trips_data,
                'statistics': {
                    'total_trips': total_trips,
                    'completed_trips': completed_trips,
                    'success_rate': round((completed_trips / total_trips * 100) if total_trips > 0 else 0, 1),
                    'total_estimated_cost': total_estimated_cost,
                    'average_trip_cost': round(total_estimated_cost / total_trips if total_trips > 0 else 0, 2)
                }
            })
            
        except Exception as e:
            logger.error(f"❌ Error fetching trips: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, trip_id):
        """Delete a trip session with proper cleanup"""
        try:
            logger.info(f"🗑️ Admin: Deleting trip session {trip_id}")
            
            if not LANGGRAPH_AVAILABLE or not TravelPlanningSession:
                return Response({
                    'success': False,
                    'error': 'LangGraph travel system not available'
                }, status=status.HTTP_404_NOT_FOUND)
            
            session = TravelPlanningSession.objects.get(session_id=trip_id)
            
            # Delete associated execution logs first (foreign key constraint)
            if AgentExecutionLog:
                logs_deleted = AgentExecutionLog.objects.filter(session=session).count()
                AgentExecutionLog.objects.filter(session=session).delete()
                logger.info(f"🧹 Deleted {logs_deleted} execution logs")
            
            # Delete the session
            session.delete()
            
            logger.info(f"✅ Trip session {trip_id} deleted successfully")
            return Response({
                'success': True,
                'message': 'Trip and associated data deleted successfully'
            })
            
        except TravelPlanningSession.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Trip session not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"❌ Error deleting trip: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class AdminAgentsView(APIView):
    """Admin endpoint for monitoring TravelRover's LangGraph agent system"""
    
    def get(self, request):
        """Get comprehensive LangGraph agents status and performance metrics"""
        try:
            logger.info("🔍 Admin: Fetching LangGraph agents data")
            
            if not LANGGRAPH_AVAILABLE:
                return self._get_unavailable_response()
            
            # Calculate time ranges for analytics
            now = datetime.now()
            last_24h = now - timedelta(hours=24)
            last_7d = now - timedelta(days=7)
            
            # System-wide metrics
            system_metrics = self._get_system_metrics(last_24h, last_7d)
            
            # Agent-specific performance data
            agent_performance = self._get_agent_performance(last_24h)
            
            # Recent execution logs for monitoring
            recent_logs = self._get_recent_logs(last_24h)
            
            return Response({
                'success': True,
                'agents': agent_performance,
                'system_metrics': system_metrics,
                'recent_logs': recent_logs,
                'system_status': {
                    'langgraph_status': 'active',
                    'coordinator_agent': 'healthy',
                    'flight_agent': 'healthy',
                    'hotel_agent': 'healthy'
                },
                'timestamp': now.isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Error fetching agents data: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_unavailable_response(self):
        """Return response when LangGraph is not available"""
        return Response({
            'success': True,
            'agents': {
                'coordinator': self._get_inactive_agent_info('Coordinator Agent', 'Multi-agent orchestration and workflow management'),
                'flight': self._get_inactive_agent_info('Flight Agent', 'SerpAPI integration for real-time flight search'),
                'hotel': self._get_inactive_agent_info('Hotel Agent', 'Google Places API integration for hotel search')
            },
            'system_metrics': {
                'total_executions': 0,
                'recent_executions_24h': 0,
                'health_status': 'not_configured',
                'total_sessions': 0,
                'active_sessions': 0
            },
            'recent_logs': [],
            'system_status': {
                'langgraph_status': 'not_configured',
                'message': 'LangGraph multi-agent system not configured'
            },
            'timestamp': datetime.now().isoformat()
        })
    
    def _get_inactive_agent_info(self, name, description):
        """Get inactive agent information structure"""
        return {
            'name': name,
            'status': 'not_configured',
            'total_executions': 0,
            'successful_executions': 0,
            'failed_executions': 0,
            'success_rate': 0,
            'executions_24h': 0,
            'average_execution_time_ms': 0,
            'description': description
        }
    
    def _get_system_metrics(self, last_24h, last_7d):
        """Calculate system-wide metrics"""
        if not AgentExecutionLog or not TravelPlanningSession:
            return {
                'total_executions': 0,
                'recent_executions_24h': 0,
                'recent_executions_7d': 0,
                'health_status': 'partially_configured'
            }
        
        total_executions = AgentExecutionLog.objects.count()
        executions_24h = AgentExecutionLog.objects.filter(started_at__gte=last_24h).count()
        executions_7d = AgentExecutionLog.objects.filter(started_at__gte=last_7d).count()
        
        # Session metrics
        total_sessions = TravelPlanningSession.objects.count()
        active_sessions = TravelPlanningSession.objects.filter(status='running').count()
        completed_sessions = TravelPlanningSession.objects.filter(status='completed').count()
        failed_sessions = TravelPlanningSession.objects.filter(status='failed').count()
        sessions_24h = TravelPlanningSession.objects.filter(created_at__gte=last_24h).count()
        
        return {
            'total_executions': total_executions,
            'recent_executions_24h': executions_24h,
            'recent_executions_7d': executions_7d,
            'health_status': 'healthy',
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'completed_sessions': completed_sessions,
            'failed_sessions': failed_sessions,
            'sessions_24h': sessions_24h,
            'success_rate': round((completed_sessions / total_sessions * 100) if total_sessions > 0 else 0, 1)
        }
    
    def _get_agent_performance(self, last_24h):
        """Get performance metrics for each agent type"""
        if not AgentExecutionLog:
            return {}
        
        agent_performance = {}
        agent_types = ['coordinator', 'flight', 'hotel']
        
        for agent_type in agent_types:
            logs = AgentExecutionLog.objects.filter(agent_type=agent_type)
            
            total = logs.count()
            completed = logs.filter(status='completed').count()
            failed = logs.filter(status='failed').count()
            recent_24h = logs.filter(started_at__gte=last_24h).count()
            
            # Calculate average execution time for completed executions
            avg_time = 0
            completed_logs = logs.filter(status='completed', execution_time_ms__isnull=False)
            if completed_logs.exists():
                avg_time = completed_logs.aggregate(avg=Avg('execution_time_ms'))['avg'] or 0
            
            agent_performance[agent_type] = {
                'name': f"{agent_type.title()} Agent",
                'status': 'active',
                'total_executions': total,
                'successful_executions': completed,
                'failed_executions': failed,
                'success_rate': round((completed / total * 100) if total > 0 else 0, 1),
                'executions_24h': recent_24h,
                'average_execution_time_ms': round(avg_time, 2),
                'description': self._get_agent_description(agent_type)
            }
        
        return agent_performance
    
    def _get_recent_logs(self, last_24h):
        """Get recent execution logs for monitoring"""
        if not AgentExecutionLog:
            return []
        
        recent_logs = AgentExecutionLog.objects.filter(
            started_at__gte=last_24h
        ).select_related('session').order_by('-started_at')[:50]
        
        logs_data = []
        for log in recent_logs:
            logs_data.append({
                'id': log.id,
                'session_id': str(log.session.session_id),
                'agent_type': log.agent_type,
                'status': log.status,
                'execution_time_ms': log.execution_time_ms,
                'started_at': log.started_at.isoformat(),
                'completed_at': log.completed_at.isoformat() if log.completed_at else None,
                'error_message': log.error_message,
                'user_email': log.session.user_email,
                'destination': log.session.destination
            })
        
        return logs_data
    
    def _get_agent_description(self, agent_type):
        """Get description for TravelRover agent types"""
        descriptions = {
            'coordinator': 'Multi-agent orchestration and workflow management for travel planning',
            'flight': 'SerpAPI integration for real-time flight search and optimization',
            'hotel': 'Google Places API integration for hotel search and recommendations'
        }
        return descriptions.get(agent_type, 'Unknown agent type')


@method_decorator(csrf_exempt, name='dispatch')
class AdminHealthView(APIView):
    """Simple health check for admin API system"""
    
    def get(self, request):
        """Basic health check endpoint"""
        return Response({
            'success': True,
            'message': 'TravelRover Admin API is operational',
            'timestamp': datetime.now().isoformat(),
            'system_status': {
                'admin_api': 'healthy',
                'django_backend': 'online',
                'langgraph_system': 'available' if LANGGRAPH_AVAILABLE else 'not_configured',
                'database': 'connected'
            },
            'available_endpoints': [
                '/api/admin/dashboard/',
                '/api/admin/users/',
                '/api/admin/trips/',
                '/api/admin/agents/',
                '/api/admin/health/'
            ]
        })
    
@method_decorator(csrf_exempt, name='dispatch')
class AdminAPIKeyMonitoringView(APIView):
    """
    Admin endpoint for real-time API key monitoring and usage tracking
    Following TravelRover's LangGraph patterns
    """
    
    def get(self, request):
        """Get real-time API key status and usage information"""
        
        async def async_handler():
            try:
                logger.info("🔍 Admin: Fetching real-time API key statuses")
                
                monitoring_service = APIKeyMonitoringService()
                
                try:
                    # Get all API key statuses
                    api_key_statuses = await monitoring_service.check_all_api_keys()
                    
                    # Calculate overall system health
                    all_services = list(api_key_statuses.values())
                    healthy_count = len([s for s in all_services if s.get('health') == 'healthy'])
                    warning_count = len([s for s in all_services if s.get('health') == 'warning'])
                    error_count = len([s for s in all_services if s.get('health') == 'error'])
                    critical_count = len([s for s in all_services if s.get('health') == 'critical'])
                    
                    # Determine overall health
                    if critical_count > 0:
                        overall_health = 'critical'
                        health_message = f'{critical_count} service(s) in critical state'
                    elif error_count > 0:
                        overall_health = 'error'
                        health_message = f'{error_count} service(s) have errors'
                    elif warning_count > 0:
                        overall_health = 'warning'
                        health_message = f'{warning_count} service(s) need attention'
                    else:
                        overall_health = 'healthy'
                        health_message = 'All services operational'
                    
                    # Get recommendations
                    recommendations = self._generate_recommendations(api_key_statuses)
                    
                    return Response({
                        'success': True,
                        'api_keys': api_key_statuses,
                        'system_health': {
                            'overall_status': overall_health,
                            'message': health_message,
                            'healthy_services': healthy_count,
                            'warning_services': warning_count,
                            'error_services': error_count,
                            'critical_services': critical_count,
                            'total_services': len(all_services)
                        },
                        'recommendations': recommendations,
                        'monitoring_info': {
                            'check_frequency': '30 seconds (real-time)',
                            'last_updated': timezone.now().isoformat(),
                            'next_check': (timezone.now() + timedelta(seconds=30)).isoformat()
                        }
                    })
                    
                finally:
                    await monitoring_service.close()
                    
            except Exception as e:
                logger.error(f"❌ Error in API key monitoring: {str(e)}")
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Run async handler
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(async_handler())
    
    def _generate_recommendations(self, api_statuses: Dict[str, Any]) -> list[Dict[str, str]]:
        """Generate actionable recommendations based on API key statuses"""
        recommendations = []
        
        for service, status_info in api_statuses.items():
            health = status_info.get('health', 'unknown')
            service_status = status_info.get('status', 'unknown')
            
            if health == 'critical':
                if 'near_limit' in service_status or 'quota_exceeded' in service_status:
                    recommendations.append({
                        'priority': 'high',
                        'service': service,
                        'title': f'Upgrade {service.title()} Plan',
                        'message': f'{service.title()} is near or at quota limit. Consider upgrading your plan.',
                        'action': 'upgrade_plan'
                    })
            elif health == 'error':
                if 'not_configured' in service_status:
                    recommendations.append({
                        'priority': 'medium',
                        'service': service,
                        'title': f'Configure {service.title()} API Key',
                        'message': f'Add {service.title()} API key to environment variables.',
                        'action': 'configure_key'
                    })
                else:
                    recommendations.append({
                        'priority': 'medium',
                        'service': service,
                        'title': f'Fix {service.title()} Configuration',
                        'message': f'{service.title()} API key has issues. Check configuration.',
                        'action': 'fix_configuration'
                    })
            elif health == 'warning':
                if 'high_usage' in service_status:
                    recommendations.append({
                        'priority': 'low',
                        'service': service,
                        'title': f'Monitor {service.title()} Usage',
                        'message': f'{service.title()} usage is high. Consider monitoring more closely.',
                        'action': 'monitor_usage'
                    })
        
        # Add general recommendations
        if len(recommendations) == 0:
            recommendations.append({
                'priority': 'info',
                'service': 'system',
                'title': 'All Systems Operational',
                'message': 'All API keys are working properly. Continue monitoring.',
                'action': 'continue_monitoring'
            })
        
        return recommendations


@method_decorator(csrf_exempt, name='dispatch') 
class AdminAPIKeyHistoryView(APIView):
    """
    API key usage history endpoint
    """
    
    def get(self, request, service_name):
        """Get usage history for a specific service"""
        
        async def async_handler():
            try:
                monitoring_service = APIKeyMonitoringService()
                
                try:
                    days = int(request.GET.get('days', 30))
                    history = await monitoring_service.get_usage_history(service_name, days)
                    
                    return Response({
                        'success': True,
                        'service': service_name,
                        'history': history,
                        'timestamp': timezone.now().isoformat()
                    })
                    
                finally:
                    await monitoring_service.close()
                    
            except Exception as e:
                logger.error(f"❌ Error getting API key history: {str(e)}")
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(async_handler())

@method_decorator(csrf_exempt, name='dispatch')
class AdminAPIKeyMonitoringView(APIView):
    """
    Admin endpoint for real-time API key monitoring and usage tracking
    Following TravelRover's LangGraph patterns
    """
    
    def get(self, request):
        """Get real-time API key status and usage information"""
        
        async def async_handler():
            try:
                logger.info("🔍 Admin: Fetching real-time API key statuses")
                
                # Import here to avoid circular imports - TravelRover pattern
                from .services import APIKeyMonitoringService
                monitoring_service = APIKeyMonitoringService()
                
                try:
                    # Get all API key statuses
                    api_key_statuses = await monitoring_service.check_all_api_keys()
                    
                    # Calculate overall system health
                    all_services = list(api_key_statuses.values())
                    healthy_count = len([s for s in all_services if s.get('health') == 'healthy'])
                    warning_count = len([s for s in all_services if s.get('health') == 'warning'])
                    error_count = len([s for s in all_services if s.get('health') == 'error'])
                    critical_count = len([s for s in all_services if s.get('health') == 'critical'])
                    
                    # Determine overall health
                    if critical_count > 0:
                        overall_health = 'critical'
                        health_message = f'{critical_count} service(s) in critical state'
                    elif error_count > 0:
                        overall_health = 'error'
                        health_message = f'{error_count} service(s) have errors'
                    elif warning_count > 0:
                        overall_health = 'warning'
                        health_message = f'{warning_count} service(s) need attention'
                    else:
                        overall_health = 'healthy'
                        health_message = 'All services operational'
                    
                    # Get recommendations
                    recommendations = self._generate_recommendations(api_key_statuses)
                    
                    return Response({
                        'success': True,
                        'api_keys': api_key_statuses,
                        'system_health': {
                            'overall_status': overall_health,
                            'message': health_message,
                            'healthy_services': healthy_count,
                            'warning_services': warning_count,
                            'error_services': error_count,
                            'critical_services': critical_count,
                            'total_services': len(all_services)
                        },
                        'recommendations': recommendations,
                        'monitoring_info': {
                            'check_frequency': '30 seconds (real-time)',
                            'last_updated': timezone.now().isoformat(),
                            'next_check': (timezone.now() + timedelta(seconds=30)).isoformat()
                        }
                    })
                    
                finally:
                    await monitoring_service.close()
                    
            except Exception as e:
                logger.error(f"❌ Error in API key monitoring: {str(e)}")
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Run async handler - TravelRover async pattern
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(async_handler())
    
    def _generate_recommendations(self, api_statuses: dict) -> list:
        """Generate actionable recommendations based on API key statuses"""
        recommendations = []
        
        for service, status_info in api_statuses.items():
            health = status_info.get('health', 'unknown')
            service_status = status_info.get('status', 'unknown')
            
            if health == 'critical':
                if 'near_limit' in service_status or 'quota_exceeded' in service_status:
                    recommendations.append({
                        'priority': 'high',
                        'service': service,
                        'title': f'Upgrade {service.title()} Plan',
                        'message': f'{service.title()} is near or at quota limit. Consider upgrading your plan.',
                        'action': 'upgrade_plan'
                    })
            elif health == 'error':
                if 'not_configured' in service_status:
                    recommendations.append({
                        'priority': 'medium',
                        'service': service,
                        'title': f'Configure {service.title()} API Key',
                        'message': f'Add {service.title()} API key to environment variables.',
                        'action': 'configure_key'
                    })
                else:
                    recommendations.append({
                        'priority': 'medium',
                        'service': service,
                        'title': f'Fix {service.title()} Configuration',
                        'message': f'{service.title()} API key has issues. Check configuration.',
                        'action': 'fix_configuration'
                    })
            elif health == 'warning':
                if 'high_usage' in service_status:
                    recommendations.append({
                        'priority': 'low',
                        'service': service,
                        'title': f'Monitor {service.title()} Usage',
                        'message': f'{service.title()} usage is high. Consider monitoring more closely.',
                        'action': 'monitor_usage'
                    })
        
        # Add general recommendations
        if len(recommendations) == 0:
            recommendations.append({
                'priority': 'info',
                'service': 'system',
                'title': 'All Systems Operational',
                'message': 'All API keys are working properly. Continue monitoring.',
                'action': 'continue_monitoring'
            })
        
        return recommendations


@method_decorator(csrf_exempt, name='dispatch') 
class AdminAPIKeyHistoryView(APIView):
    """API key usage history endpoint"""
    
    def get(self, request, service_name):
        """Get usage history for a specific service"""
        
        async def async_handler():
            try:
                from .services import APIKeyMonitoringService
                monitoring_service = APIKeyMonitoringService()
                
                try:
                    days = int(request.GET.get('days', 30))
                    history = await monitoring_service.get_usage_history(service_name, days)
                    
                    return Response({
                        'success': True,
                        'service': service_name,
                        'history': history,
                        'timestamp': timezone.now().isoformat()
                    })
                    
                finally:
                    await monitoring_service.close()
                    
            except Exception as e:
                logger.error(f"❌ Error getting API key history: {str(e)}")
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(async_handler())