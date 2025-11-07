# langgraph_agents/logging_config.py
"""
Production-ready logging configuration for LangGraph agents
Implements structured logging with different levels and handlers
"""
import logging
import json
from datetime import datetime
from django.conf import settings


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs structured JSON logs
    Ideal for production log aggregation systems (ELK, Splunk, CloudWatch)
    """
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add extra fields if present
        if hasattr(record, 'user_email'):
            log_data['user_email'] = record.user_email
        if hasattr(record, 'session_id'):
            log_data['session_id'] = record.session_id
        if hasattr(record, 'agent_type'):
            log_data['agent_type'] = record.agent_type
        if hasattr(record, 'execution_time_ms'):
            log_data['execution_time_ms'] = record.execution_time_ms
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


class ProductionLogger:
    """
    Wrapper for Django logger with structured logging capabilities
    Use this instead of print statements for production logging
    """
    
    def __init__(self, name):
        self.logger = logging.getLogger(name)
        self.is_production = not settings.DEBUG
    
    def info(self, message, **kwargs):
        """Log info level message with structured context"""
        self._log(logging.INFO, message, **kwargs)
    
    def warning(self, message, **kwargs):
        """Log warning level message with structured context"""
        self._log(logging.WARNING, message, **kwargs)
    
    def error(self, message, **kwargs):
        """Log error level message with structured context"""
        self._log(logging.ERROR, message, **kwargs)
    
    def debug(self, message, **kwargs):
        """Log debug level message with structured context"""
        self._log(logging.DEBUG, message, **kwargs)
    
    def critical(self, message, **kwargs):
        """Log critical level message with structured context"""
        self._log(logging.CRITICAL, message, **kwargs)
    
    def _log(self, level, message, **kwargs):
        """Internal method to log with extra context"""
        extra = {}
        
        # Extract known fields
        if 'user_email' in kwargs:
            extra['user_email'] = kwargs.pop('user_email')
        if 'session_id' in kwargs:
            extra['session_id'] = kwargs.pop('session_id')
        if 'agent_type' in kwargs:
            extra['agent_type'] = kwargs.pop('agent_type')
        if 'execution_time_ms' in kwargs:
            extra['execution_time_ms'] = kwargs.pop('execution_time_ms')
        
        # Append remaining kwargs to message
        if kwargs:
            message = f"{message} | {json.dumps(kwargs)}"
        
        self.logger.log(level, message, extra=extra)
    
    def agent_execution(self, agent_type, session_id, status, execution_time_ms=None, **kwargs):
        """
        Specialized logging for agent executions
        """
        message = f"Agent execution: {agent_type} - {status}"
        self.info(
            message,
            agent_type=agent_type,
            session_id=session_id,
            execution_time_ms=execution_time_ms,
            **kwargs
        )
    
    def api_request(self, endpoint, method, status_code, response_time_ms=None, **kwargs):
        """
        Specialized logging for API requests
        """
        message = f"API {method} {endpoint} - {status_code}"
        if status_code >= 400:
            self.warning(message, response_time_ms=response_time_ms, **kwargs)
        else:
            self.info(message, response_time_ms=response_time_ms, **kwargs)
    
    def trip_generation(self, user_email, destination, status, **kwargs):
        """
        Specialized logging for trip generation
        """
        message = f"Trip generation: {destination} - {status}"
        self.info(
            message,
            user_email=user_email,
            destination=destination,
            **kwargs
        )


def get_production_logger(name):
    """
    Factory function to get a production logger instance
    
    Usage:
        from langgraph_agents.logging_config import get_production_logger
        logger = get_production_logger(__name__)
        logger.info("Message", user_email="test@example.com")
    """
    return ProductionLogger(name)


# Pre-configured loggers for common use cases
trip_logger = get_production_logger('langgraph_agents.trips')
agent_logger = get_production_logger('langgraph_agents.agents')
api_logger = get_production_logger('langgraph_agents.api')
