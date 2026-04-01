"""
CORS Debug View - Helps troubleshoot CORS configuration issues
Add this to check if CorsMiddleware is working properly
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.http import HttpResponse
import json

@api_view(['OPTIONS', 'GET', 'POST'])
def cors_debug_view(request):
    """
    Debug endpoint for CORS testing
    
    Call from browser:
    fetch('https://travelrover-production-9217.up.railway.app/api/langgraph/cors-debug/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({test: 'data'})
    })
    
    Check response headers for Access-Control-Allow-Origin
    """
    
    debug_info = {
        'debug': settings.DEBUG,
        'allowed_hosts': settings.ALLOWED_HOSTS,
        'cors_allowed_origins': list(settings.CORS_ALLOWED_ORIGINS),
        'cors_allow_credentials': settings.CORS_ALLOW_CREDENTIALS,
        'request_origin': request.META.get('HTTP_ORIGIN', 'No origin header'),
        'request_method': request.method,
        'middleware_installed': 'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE,
        'middleware_position': settings.MIDDLEWARE.index('corsheaders.middleware.CorsMiddleware') if 'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE else -1,
    }
    
    return Response(debug_info)


# Alternative: Plain view that returns raw HTTP headers for debugging
def cors_debug_raw(request):
    """Raw debug endpoint that shows CORS headers in response"""
    
    debug_info = {
        'debug': settings.DEBUG,
        'allowed_origins': list(settings.CORS_ALLOWED_ORIGINS),
        'request_origin': request.META.get('HTTP_ORIGIN', 'None'),
        'cors_middleware_enabled': 'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE,
        'message': 'If Access-Control-Allow-Origin header is missing below, CORS middleware is not running',
    }
    
    response = HttpResponse(
        json.dumps(debug_info, indent=2),
        content_type='application/json'
    )
    # Try to add CORS headers manually (this should be done by middleware, but useful for debugging)
    origin = request.META.get('HTTP_ORIGIN')
    if origin in settings.CORS_ALLOWED_ORIGINS:
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
    
    return response
