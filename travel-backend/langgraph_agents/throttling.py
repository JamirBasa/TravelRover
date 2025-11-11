# langgraph_agents/throttling.py
"""
Custom throttling classes for LangGraph API endpoints
Prevents abuse and ensures fair usage
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.core.cache import cache
import time


class TripGenerationThrottle(UserRateThrottle):
    """
    Rate limiting for trip generation endpoint
    Authenticated users: 20 requests per hour (increased for development)
    Anonymous users: 10 requests per hour
    """
    scope = 'trip_generation'
    
    # Override default rates
    rate = '20/hour'  # Increased for development/testing
    
    def get_cache_key(self, request, view):
        """
        Custom cache key based on user email or IP
        """
        # Try to get user email from request data
        user_email = request.data.get('userEmail') or request.data.get('user_email')
        
        if user_email:
            # Use email as cache key for authenticated requests
            ident = user_email
        else:
            # Fall back to IP for anonymous requests
            ident = self.get_ident(request)
            
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
    
    def allow_request(self, request, view):
        """
        Check if request is allowed under current rate limit
        """
        # Get user email to check if authenticated
        user_email = request.data.get('userEmail') or request.data.get('user_email')
        
        if not user_email:
            # Anonymous users get stricter limit
            self.rate = '10/hour'  # Increased for development
        else:
            # Authenticated users get standard limit
            self.rate = '20/hour'  # Increased for development
            
        return super().allow_request(request, view)


class HealthCheckThrottle(AnonRateThrottle):
    """
    Rate limiting for health check endpoint
    Much more permissive since it's read-only
    """
    scope = 'health_check'
    rate = '60/minute'


class SessionStatusThrottle(UserRateThrottle):
    """
    Rate limiting for session status endpoint
    """
    scope = 'session_status'
    rate = '30/minute'


class BurstTripGenerationThrottle(UserRateThrottle):
    """
    Additional burst protection for trip generation
    Prevents rapid-fire requests within short timeframe
    """
    scope = 'trip_generation_burst'
    rate = '10/minute'  # Max 10 requests per minute (increased for development/testing)
    
    def get_cache_key(self, request, view):
        """Use same cache key format as TripGenerationThrottle"""
        user_email = request.data.get('userEmail') or request.data.get('user_email')
        
        if user_email:
            ident = user_email
        else:
            ident = self.get_ident(request)
            
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
