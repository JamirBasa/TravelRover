"""
Session management service for LangGraph agents
"""

import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, date

from django.utils import timezone
from asgiref.sync import sync_to_async

from ..models import TravelPlanningSession, AgentExecutionLog
from ..utils import get_agent_logger, validate_trip_params
from ..exceptions import DataValidationError, LangGraphAgentError


class SessionService:
    """
    Service for managing LangGraph session lifecycle
    """
    
    def __init__(self):
        self.logger = get_agent_logger("SessionService")
    
    def _parse_date(self, date_str: str) -> date:
        """Parse date string in YYYY-MM-DD format"""
        if isinstance(date_str, date):
            return date_str
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            # Fallback to today's date if parsing fails
            return timezone.now().date()
    
    async def create_session(self, user_email: str, trip_params: Dict[str, Any]) -> str:
        """
        Create a new travel planning session
        
        Args:
            user_email: User's email address
            trip_params: Trip parameters
            
        Returns:
            Session ID
            
        Raises:
            DataValidationError: If parameters are invalid
            LangGraphAgentError: If session creation fails
        """
        try:
            self.logger.info(f"🔄 Creating session for user: {user_email}")
            
            # Validate parameters
            validated_params = validate_trip_params(trip_params)
            
            # Generate unique session ID
            session_id = str(uuid.uuid4())
            
            # Create session record
            session = await sync_to_async(TravelPlanningSession.objects.create)(
                session_id=session_id,
                user_email=user_email,
                destination=validated_params.get('destination', ''),
                start_date=self._parse_date(validated_params.get('startDate', validated_params.get('start_date'))),
                end_date=self._parse_date(validated_params.get('endDate', validated_params.get('end_date'))),
                travelers=validated_params.get('travelers', '1'),
                budget=validated_params.get('budget', 'moderate'),
                status='pending'
            )
            
            self.logger.info(f"✅ Session created: {session_id}")
            return session_id
            
        except Exception as e:
            self.logger.error(f"❌ Session creation failed: {str(e)}")
            raise LangGraphAgentError(f"Failed to create session: {str(e)}")
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session by ID
        
        Args:
            session_id: Session identifier
            
        Returns:
            Session data or None if not found
        """
        try:
            session = await sync_to_async(
                TravelPlanningSession.objects.get
            )(session_id=session_id)
            
            return {
                'session_id': session.session_id,
                'user_email': session.user_email,
                'trip_params': session.trip_params,
                'status': session.status,
                'results': session.results,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat()
            }
            
        except TravelPlanningSession.DoesNotExist:
            self.logger.warning(f"Session not found: {session_id}")
            return None
        except Exception as e:
            self.logger.error(f"❌ Error getting session {session_id}: {str(e)}")
            return None
    
    async def update_session_status(self, session_id: str, status: str, results: Dict[str, Any] = None):
        """
        Update session status and results
        
        Args:
            session_id: Session identifier
            status: New status ('active', 'completed', 'failed')
            results: Optional results data
        """
        try:
            session = await sync_to_async(
                TravelPlanningSession.objects.get
            )(session_id=session_id)
            
            session.status = status
            if results:
                session.results = results
            session.updated_at = timezone.now()
            
            await sync_to_async(session.save)()
            
            self.logger.info(f"✅ Session {session_id} updated to status: {status}")
            
        except TravelPlanningSession.DoesNotExist:
            self.logger.error(f"❌ Session not found for update: {session_id}")
        except Exception as e:
            self.logger.error(f"❌ Error updating session {session_id}: {str(e)}")
    
    async def log_agent_execution(
        self, 
        session_id: str, 
        agent_type: str, 
        status: str, 
        input_data: Dict[str, Any] = None,
        output_data: Dict[str, Any] = None,
        error_message: str = None,
        execution_time_ms: int = None
    ):
        """
        Log agent execution details
        
        Args:
            session_id: Session identifier
            agent_type: Type of agent (e.g., 'FlightAgent', 'HotelAgent')
            status: Execution status ('success', 'failed', 'started')
            input_data: Input parameters
            output_data: Output results
            error_message: Error message if failed
            execution_time_ms: Execution time in milliseconds
        """
        try:
            await sync_to_async(AgentExecutionLog.objects.create)(
                session_id=session_id,
                agent_type=agent_type,
                status=status,
                input_data=input_data or {},
                output_data=output_data or {},
                error_message=error_message,
                execution_time_ms=execution_time_ms,
                executed_at=timezone.now()
            )
            
            self.logger.debug(f"📝 Agent execution logged: {agent_type} - {status}")
            
        except Exception as e:
            self.logger.error(f"❌ Error logging agent execution: {str(e)}")
    
    async def get_session_logs(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Get all agent execution logs for a session
        
        Args:
            session_id: Session identifier
            
        Returns:
            List of execution logs
        """
        try:
            logs = await sync_to_async(list)(
                AgentExecutionLog.objects.filter(session_id=session_id).order_by('executed_at')
            )
            
            return [
                {
                    'agent_type': log.agent_type,
                    'status': log.status,
                    'input_data': log.input_data,
                    'output_data': log.output_data,
                    'error_message': log.error_message,
                    'execution_time_ms': log.execution_time_ms,
                    'executed_at': log.executed_at.isoformat()
                }
                for log in logs
            ]
            
        except Exception as e:
            self.logger.error(f"❌ Error getting session logs: {str(e)}")
            return []
    
    async def cleanup_old_sessions(self, days_old: int = 7):
        """
        Cleanup old sessions and their logs
        
        Args:
            days_old: Remove sessions older than this many days
        """
        try:
            cutoff_date = timezone.now() - timezone.timedelta(days=days_old)
            
            # Get old sessions
            old_sessions = await sync_to_async(list)(
                TravelPlanningSession.objects.filter(created_at__lt=cutoff_date)
            )
            
            # Delete logs first (due to foreign key)
            for session in old_sessions:
                await sync_to_async(
                    AgentExecutionLog.objects.filter(session_id=session.session_id).delete
                )()
            
            # Delete sessions
            deleted_count = await sync_to_async(
                TravelPlanningSession.objects.filter(created_at__lt=cutoff_date).delete
            )()
            
            self.logger.info(f"🧹 Cleaned up {deleted_count[0]} old sessions")
            
        except Exception as e:
            self.logger.error(f"❌ Error cleaning up old sessions: {str(e)}")