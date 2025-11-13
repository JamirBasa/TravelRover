"""
Orchestration service for coordinating LangGraph agents
"""

import asyncio
import time
from typing import Dict, Any, List, Tuple

from ..agents.coordinator import CoordinatorAgent
from ..agents.flight_agent import FlightAgent  
from ..agents.hotel_agent import HotelAgent
from ..services.session_service import SessionService
from ..utils import get_agent_logger, sanitize_response_data
from ..exceptions import LangGraphAgentError, AgentExecutionError


class OrchestrationService:
    """
    Service for orchestrating multiple LangGraph agents
    """
    
    def __init__(self):
        self.logger = get_agent_logger("OrchestrationService")
        self.session_service = SessionService()
        
        # Agents will be initialized per session
        self.flight_agent = None
        self.hotel_agent = None
        self.coordinator = None
    
    def _initialize_agents(self, session_id: str):
        """Initialize agents with session_id"""
        self.flight_agent = FlightAgent(session_id)
        self.hotel_agent = HotelAgent(session_id)
        self.coordinator = CoordinatorAgent(session_id)
        self.logger.info(f"✅ Agents initialized for session: {session_id}")
    
    async def execute_workflow(self, user_email: str, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete LangGraph workflow
        
        Args:
            user_email: User's email address
            trip_params: Trip parameters
            
        Returns:
            Orchestration results
            
        Raises:
            LangGraphAgentError: If orchestration fails
        """
        session_id = None
        
        try:
            self.logger.info("🤖 Starting LangGraph orchestration workflow")
            
            # Create session
            session_id = await self.session_service.create_session(user_email, trip_params)
            
            # Initialize agents with session_id
            self._initialize_agents(session_id)
            
            # Delegate entire workflow to coordinator
            self.logger.info(f"🤖 Delegating workflow to coordinator for session: {session_id}")
            
            # Prepare input for coordinator
            coordinator_input = {
                **trip_params,
                'user_email': user_email,
                'session_id': session_id
            }
            
            # Execute coordinator workflow asynchronously
            optimized_results = await self.coordinator._execute_logic(coordinator_input)
            
            # Update session with final results
            await self.session_service.update_session_status(
                session_id, 
                'completed', 
                optimized_results
            )
            
            self.logger.info(f"✅ LangGraph workflow completed successfully for session: {session_id}")
            
            return {
                'success': True,
                'session_id': session_id,
                'results': optimized_results
            }
            
        except Exception as e:
            self.logger.error(f"❌ LangGraph workflow failed: {str(e)}")
            
            if session_id:
                await self.session_service.update_session_status(
                    session_id, 
                    'failed',
                    {'error': str(e)}
                )
            
            raise LangGraphAgentError(f"Workflow execution failed: {str(e)}")
    
    async def _generate_execution_plan(self, session_id: str, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate execution plan based on trip parameters
        
        Args:
            session_id: Session identifier
            trip_params: Trip parameters
            
        Returns:
            Execution plan
        """
        try:
            start_time = time.time()
            
            await self.session_service.log_agent_execution(
                session_id, 
                'CoordinatorAgent', 
                'started',
                input_data=trip_params
            )
            
            plan = await self.coordinator._create_execution_plan(trip_params)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            await self.session_service.log_agent_execution(
                session_id, 
                'CoordinatorAgent', 
                'success',
                input_data=trip_params,
                output_data=plan,
                execution_time_ms=execution_time
            )
            
            self.logger.info(f"📋 Execution plan generated: {len(plan.get('parallel_tasks', []))} parallel tasks")
            
            return plan
            
        except Exception as e:
            await self.session_service.log_agent_execution(
                session_id, 
                'CoordinatorAgent', 
                'failed',
                input_data=trip_params,
                error_message=str(e)
            )
            raise
    
    async def _execute_parallel_agents(self, session_id: str, execution_plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute agents in parallel by delegating to coordinator
        
        Args:
            session_id: Session identifier
            execution_plan: Generated execution plan (not used - coordinator handles everything)
            
        Returns:
            Combined results from coordinator
        """
        try:
            # Delegate to coordinator for agent execution
            trip_params = execution_plan.get('coordinator', {})
            coordinator_result = await self.coordinator._execute_agents_parallel(execution_plan)
            
            self.logger.info("✅ Coordinator completed parallel agent execution")
            return coordinator_result
            
        except Exception as e:
            self.logger.error(f"❌ Coordinator parallel execution failed: {str(e)}")
            return {
                'flights': None,
                'hotels': None,
                'agent_errors': [{'agent': 'coordinator', 'error': str(e)}]
            }
    
    async def _execute_flight_agent(self, session_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute flight agent
        
        Args:
            session_id: Session identifier
            params: Flight search parameters
            
        Returns:
            Flight search results
        """
        start_time = time.time()
        
        try:
            await self.session_service.log_agent_execution(
                session_id, 
                'FlightAgent', 
                'started',
                input_data=params
            )
            
            result = await self.flight_agent.search_flights(params)
            sanitized_result = sanitize_response_data(result)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            await self.session_service.log_agent_execution(
                session_id, 
                'FlightAgent', 
                'success',
                input_data=params,
                output_data=sanitized_result,
                execution_time_ms=execution_time
            )
            
            return sanitized_result
            
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            
            await self.session_service.log_agent_execution(
                session_id, 
                'FlightAgent', 
                'failed',
                input_data=params,
                error_message=str(e),
                execution_time_ms=execution_time
            )
            
            raise AgentExecutionError(f"Flight agent execution failed: {str(e)}", "FlightAgent", e)
    
    async def _execute_hotel_agent(self, session_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute hotel agent
        
        Args:
            session_id: Session identifier
            params: Hotel search parameters
            
        Returns:
            Hotel search results
        """
        start_time = time.time()
        
        try:
            await self.session_service.log_agent_execution(
                session_id, 
                'HotelAgent', 
                'started',
                input_data=params
            )
            
            result = await self.hotel_agent.search_hotels(params)
            sanitized_result = sanitize_response_data(result)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            await self.session_service.log_agent_execution(
                session_id, 
                'HotelAgent', 
                'success',
                input_data=params,
                output_data=sanitized_result,
                execution_time_ms=execution_time
            )
            
            return sanitized_result
            
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            
            await self.session_service.log_agent_execution(
                session_id, 
                'HotelAgent', 
                'failed',
                input_data=params,
                error_message=str(e),
                execution_time_ms=execution_time
            )
            
            raise AgentExecutionError(f"Hotel agent execution failed: {str(e)}", "HotelAgent", e)
    
    async def _optimize_results(self, session_id: str, results: Dict[str, Any], trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize and merge results from all agents
        
        Args:
            session_id: Session identifier
            results: Results from parallel agents
            trip_params: Original trip parameters
            
        Returns:
            Optimized results
        """
        try:
            start_time = time.time()
            
            await self.session_service.log_agent_execution(
                session_id, 
                'CoordinatorAgent', 
                'started',
                input_data={'results': results, 'trip_params': trip_params}
            )
            
            optimized = await self.coordinator._optimize_results(results, trip_params)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            await self.session_service.log_agent_execution(
                session_id, 
                'CoordinatorAgent', 
                'success',
                input_data={'results': results, 'trip_params': trip_params},
                output_data=optimized,
                execution_time_ms=execution_time
            )
            
            self.logger.info("🎯 Results optimization completed")
            
            return optimized
            
        except Exception as e:
            await self.session_service.log_agent_execution(
                session_id, 
                'CoordinatorAgent', 
                'failed',
                input_data={'results': results, 'trip_params': trip_params},
                error_message=str(e)
            )
            
            self.logger.error(f"❌ Results optimization failed: {str(e)}")
            
            # Return basic merged results as fallback
            return {
                **results,
                'optimization_score': 0,
                'cost_efficiency': 'unknown',
                'optimization_error': str(e)
            }