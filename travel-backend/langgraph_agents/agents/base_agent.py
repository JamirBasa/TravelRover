# langgraph_agents/agents/base_agent.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import time
import logging
from asgiref.sync import sync_to_async
from ..models import AgentExecutionLog

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Base class for all LangGraph agents"""
    
    def __init__(self, session_id: str, agent_type: str):
        self.session_id = session_id
        self.agent_type = agent_type
        self.execution_log: Optional[AgentExecutionLog] = None
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent with proper logging and error handling"""
        start_time = time.time()
        
        # Create execution log using sync_to_async
        from ..models import TravelPlanningSession
        
        @sync_to_async
        def create_execution_log():
            session = TravelPlanningSession.objects.get(session_id=self.session_id)
            return AgentExecutionLog.objects.create(
                session=session,
                agent_type=self.agent_type,
                status='running',
                input_data=input_data
            )
        
        self.execution_log = await create_execution_log()
        
        try:
            logger.info(f"🤖 {self.agent_type} agent starting execution")
            result = await self._execute_logic(input_data)
            
            # Calculate execution time
            execution_time = int((time.time() - start_time) * 1000)
            
            # Update log with success using sync_to_async
            @sync_to_async
            def update_success_log():
                self.execution_log.status = 'completed'
                self.execution_log.output_data = result
                self.execution_log.execution_time_ms = execution_time
                self.execution_log.save()
            
            await update_success_log()
            
            logger.info(f"✅ {self.agent_type} agent completed in {execution_time}ms")
            return result
            
        except Exception as e:
            # Calculate execution time
            execution_time = int((time.time() - start_time) * 1000)
            
            # Update log with failure using sync_to_async
            @sync_to_async
            def update_failure_log():
                self.execution_log.status = 'failed'
                self.execution_log.error_message = str(e)
                self.execution_log.execution_time_ms = execution_time
                self.execution_log.save()
            
            await update_failure_log()
            
            logger.error(f"❌ {self.agent_type} agent failed in {execution_time}ms: {e}")
            raise e
    
    @abstractmethod
    async def _execute_logic(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Implement the actual agent logic"""
        pass