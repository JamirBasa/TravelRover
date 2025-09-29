"""
Custom exceptions for LangGraph agents
"""


class LangGraphAgentError(Exception):
    """Base exception for all LangGraph agent errors"""
    def __init__(self, message: str, agent_type: str = None, error_code: str = None):
        self.agent_type = agent_type
        self.error_code = error_code
        super().__init__(message)


class AgentExecutionError(LangGraphAgentError):
    """Raised when an agent fails to execute properly"""
    def __init__(self, message: str, agent_type: str = None, original_error: Exception = None):
        self.original_error = original_error
        super().__init__(message, agent_type, "EXECUTION_ERROR")


class APIKeyMissingError(LangGraphAgentError):
    """Raised when required API keys are missing"""
    def __init__(self, service_name: str, agent_type: str = None):
        message = f"API key missing for {service_name}"
        super().__init__(message, agent_type, "API_KEY_MISSING")


class DataValidationError(LangGraphAgentError):
    """Raised when input data validation fails"""
    def __init__(self, message: str, field_name: str = None, agent_type: str = None):
        self.field_name = field_name
        super().__init__(message, agent_type, "DATA_VALIDATION_ERROR")


class ServiceUnavailableError(LangGraphAgentError):
    """Raised when external services are unavailable"""
    def __init__(self, service_name: str, agent_type: str = None, status_code: int = None):
        self.service_name = service_name
        self.status_code = status_code
        message = f"Service {service_name} is unavailable"
        if status_code:
            message += f" (HTTP {status_code})"
        super().__init__(message, agent_type, "SERVICE_UNAVAILABLE")


class RateLimitError(LangGraphAgentError):
    """Raised when API rate limits are exceeded"""
    def __init__(self, service_name: str, retry_after: int = None, agent_type: str = None):
        self.service_name = service_name
        self.retry_after = retry_after
        message = f"Rate limit exceeded for {service_name}"
        if retry_after:
            message += f". Retry after {retry_after} seconds"
        super().__init__(message, agent_type, "RATE_LIMIT_ERROR")