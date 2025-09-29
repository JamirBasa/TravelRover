"""
Logging utilities for LangGraph agents
"""

import logging
import sys
from typing import Optional


def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Set up a logger with consistent formatting for LangGraph agents
    
    Args:
        name: Logger name (typically __name__)
        level: Logging level (default: INFO)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
        
    logger.setLevel(level)
    
    # Create console handler with formatting
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    return logger


def get_agent_logger(agent_name: str) -> logging.Logger:
    """
    Get a logger specifically for an agent
    
    Args:
        agent_name: Name of the agent (e.g., 'FlightAgent', 'HotelAgent')
        
    Returns:
        Logger instance for the agent
    """
    logger_name = f"langgraph_agents.{agent_name}"
    return setup_logger(logger_name)


class AgentLoggerMixin:
    """
    Mixin class to provide consistent logging to agents
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.logger = get_agent_logger(self.__class__.__name__)
    
    def log_execution_start(self, method_name: str, params: dict = None):
        """Log the start of agent execution"""
        params_str = f" with params: {params}" if params else ""
        self.logger.info(f"🤖 {method_name} started{params_str}")
    
    def log_execution_success(self, method_name: str, result_summary: str = None):
        """Log successful agent execution"""
        summary_str = f": {result_summary}" if result_summary else ""
        self.logger.info(f"✅ {method_name} completed successfully{summary_str}")
    
    def log_execution_error(self, method_name: str, error: Exception):
        """Log agent execution error"""
        self.logger.error(f"❌ {method_name} failed: {str(error)}")
    
    def log_api_call(self, service: str, endpoint: str, status: str = "started"):
        """Log API calls"""
        if status == "started":
            self.logger.debug(f"🔗 API call to {service} ({endpoint})")
        elif status == "success":
            self.logger.debug(f"✅ API call to {service} successful")
        elif status == "failed":
            self.logger.warning(f"❌ API call to {service} failed")
    
    def log_data_processing(self, action: str, item_count: int = None):
        """Log data processing actions"""
        count_str = f" ({item_count} items)" if item_count is not None else ""
        self.logger.debug(f"📊 {action}{count_str}")