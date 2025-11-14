"""
LongCat API Views
Django REST endpoints for LongCat chat integration
"""

import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import StreamingHttpResponse
import json

from .services.longcat_service import LongCatService

logger = logging.getLogger(__name__)


@api_view(['POST'])
def longcat_chat(request):
    """
    LongCat chat completion endpoint
    
    POST /api/langgraph/longcat/chat/
    
    Request body:
    {
        "messages": [{"role": "user", "content": "Hello"}],
        "model": "chat" | "thinking",  // Optional, defaults to "chat"
        "temperature": 0.7,  // Optional
        "max_tokens": 2000,  // Optional
        "enable_thinking": false  // Optional, only for thinking model
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "content": "Response text",
            "model": "LongCat-Flash-Chat",
            "usage": {...}
        }
    }
    """
    try:
        messages = request.data.get('messages', [])
        model_type = request.data.get('model', 'chat')
        temperature = request.data.get('temperature', 0.7)
        max_tokens = request.data.get('max_tokens', 2000)
        enable_thinking = request.data.get('enable_thinking', False)
        
        if not messages:
            return Response({
                'success': False,
                'error': 'Messages are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Initialize service
        service = LongCatService()
        
        if not service.is_configured():
            return Response({
                'success': False,
                'error': 'LongCat API not configured. Please add LONGCAT_API_KEY to .env'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Select model
        model = service.THINKING_MODEL if model_type == 'thinking' else service.CHAT_MODEL
        
        # Get completion
        result = service.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            enable_thinking=enable_thinking,
            thinking_budget=1024,
        )
        
        # Extract response
        content = result['choices'][0]['message']['content']
        
        return Response({
            'success': True,
            'data': {
                'content': content,
                'model': result.get('model'),
                'usage': result.get('usage', {}),
                'thinking_enabled': enable_thinking,
            }
        })
        
    except Exception as e:
        logger.error(f"LongCat chat error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def longcat_health(request):
    """
    Check LongCat API health
    
    GET /api/langgraph/longcat/health/
    
    Returns:
    {
        "success": true,
        "data": {
            "configured": true,
            "valid": true,
            "model": "LongCat-Flash-Chat"
        }
    }
    """
    try:
        service = LongCatService()
        health_status = service.check_health()
        
        return Response({
            'success': True,
            'data': health_status
        })
        
    except Exception as e:
        logger.error(f"LongCat health check error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
