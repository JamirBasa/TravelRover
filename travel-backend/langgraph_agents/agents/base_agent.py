# langgraph_agents/agents/base_agent.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import time

from ..utils import AgentLoggerMixin
from ..exceptions import AgentExecutionError


class BaseAgent(AgentLoggerMixin, ABC):
    """
    Base class for all LangGraph agents with integrated logging and error handling
    """
    
    def __init__(self, session_id: str = None, agent_type: str = None):
        super().__init__()
        self.session_id = session_id
        self.agent_type = agent_type or self.__class__.__name__
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent with comprehensive logging and error handling
        
        Args:
            input_data: Input parameters for the agent
            
        Returns:
            Agent execution results
            
        Raises:
            AgentExecutionError: If agent execution fails
        """
        start_time = time.time()
        method_name = "execute"
        
        try:
            # Log execution start
            self.log_execution_start(method_name, input_data)
            
            # Validate input data
            validated_input = self._validate_input(input_data)
            
            # Execute agent logic
            result = await self._execute_logic(validated_input)
            
            # Calculate execution time
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Validate and sanitize output
            validated_result = self._validate_output(result)
            
            # ✅ FIX: Respect success field from agent's internal logic
            # If agent returned success: False (e.g. no flights available), propagate it
            internal_success = validated_result.get('success', True) if isinstance(validated_result, dict) else True
            
            # Log success or warning
            if internal_success:
                self.log_execution_success(
                    method_name, 
                    f"completed in {execution_time_ms}ms"
                )
            else:
                # Log warning if agent completed but returned no results
                self.logger.warning(
                    f"{method_name} completed but returned no valid results: {validated_result.get('error', 'Unknown reason')}"
                )
            
            return {
                'success': internal_success,  # Use agent's internal success flag
                'agent_type': self.agent_type,
                'execution_time_ms': execution_time_ms,
                'data': validated_result,
                'timestamp': time.time()
            }
            
        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Log error
            self.log_execution_error(method_name, e)
            
            # Wrap in custom exception
            agent_error = AgentExecutionError(
                f"{self.agent_type} execution failed: {str(e)}", 
                self.agent_type, 
                e
            )
            
            raise agent_error
    
    def _validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate input data (override in subclasses for specific validation)
        
        Args:
            input_data: Raw input data
            
        Returns:
            Validated input data
        """
        return input_data
    
    def _validate_output(self, output_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate output data (override in subclasses for specific validation)
        
        Args:
            output_data: Raw output data
            
        Returns:
            Validated output data
        """
        return output_data
    
    @abstractmethod
    async def _execute_logic(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Implement the actual agent logic
        
        Args:
            input_data: Validated input parameters
            
        Returns:
            Agent results (will be validated by _validate_output)
        """
        pass