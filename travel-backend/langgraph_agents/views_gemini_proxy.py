"""
Gemini AI Proxy Endpoint
Secures Gemini API key on backend while maintaining frontend flexibility
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
import logging
import time
import json

logger = logging.getLogger(__name__)

# Import Gemini SDK
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai package not installed")


@api_view(['POST'])
@permission_classes([AllowAny])  # TODO: Add authentication in production
def gemini_generate(request):
    """
    Proxy endpoint for Gemini AI generation
    
    Receives:
        - prompt: Enhanced prompt from frontend
        - schema: Optional response schema
        - generationConfig: Optional generation parameters
    
    Returns:
        - success: Boolean
        - data: AI-generated response
        - error: Error message if failed
        - metadata: Generation stats (tokens, time, etc.)
    """
    
    start_time = time.time()
    
    try:
        # Validate Gemini SDK availability
        if not GENAI_AVAILABLE:
            return Response({
                'success': False,
                'error': 'Gemini SDK not available. Install google-generativeai package.',
                'error_type': 'configuration_error'
            }, status=500)
        
        # Get API key from settings
        api_key = settings.GEMINI_API_KEY if hasattr(settings, 'GEMINI_API_KEY') else None
        
        if not api_key:
            logger.error("GEMINI_API_KEY not configured in settings")
            return Response({
                'success': False,
                'error': 'Gemini API key not configured on server',
                'error_type': 'configuration_error'
            }, status=500)
        
        # Extract request parameters
        prompt = request.data.get('prompt')
        schema = request.data.get('schema')
        generation_config = request.data.get('generationConfig', {})
        
        # Validate prompt
        if not prompt:
            return Response({
                'success': False,
                'error': 'Prompt is required',
                'error_type': 'validation_error'
            }, status=400)
        
        logger.info(f"🤖 Gemini proxy request - Prompt length: {len(prompt)} chars")
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Build generation config
        config = {
            'temperature': generation_config.get('temperature', 0.2),
            'top_p': generation_config.get('topP', 0.9),
            'top_k': generation_config.get('topK', 20),
            'max_output_tokens': generation_config.get('maxOutputTokens', 8192),
        }
        
        # Add response schema if provided
        if schema:
            config['response_mime_type'] = 'application/json'
            config['response_schema'] = schema
        
        # Safety settings
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
        
        # Initialize model
        model_name = generation_config.get('model', 'gemini-2.0-flash-exp')
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=config,
            safety_settings=safety_settings
        )
        
        logger.info(f"🤖 Calling Gemini model: {model_name}")
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Calculate execution time
        execution_time = time.time() - start_time
        
        # Extract response text
        response_text = response.text
        
        logger.info(f"✅ Gemini generation completed in {execution_time:.2f}s")
        logger.info(f"📊 Response length: {len(response_text)} chars")
        
        # Try to parse as JSON for validation
        is_valid_json = False
        parsed_data = None
        try:
            parsed_data = json.loads(response_text)
            is_valid_json = True
            logger.info("✅ Response is valid JSON")
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ Response is not valid JSON: {str(e)}")
        
        # Build metadata
        metadata = {
            'execution_time': execution_time,
            'model': model_name,
            'prompt_length': len(prompt),
            'response_length': len(response_text),
            'is_valid_json': is_valid_json,
            'timestamp': time.time()
        }
        
        # Add usage metadata if available
        try:
            if hasattr(response, 'usage_metadata'):
                metadata['usage'] = {
                    'prompt_token_count': response.usage_metadata.prompt_token_count,
                    'candidates_token_count': response.usage_metadata.candidates_token_count,
                    'total_token_count': response.usage_metadata.total_token_count,
                }
                logger.info(f"📊 Token usage: {metadata['usage']['total_token_count']} total tokens")
        except Exception as e:
            logger.warning(f"Could not extract usage metadata: {str(e)}")
        
        return Response({
            'success': True,
            'data': parsed_data if is_valid_json else response_text,
            'raw_response': response_text if is_valid_json else None,
            'metadata': metadata
        })
        
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"❌ Gemini proxy error after {execution_time:.2f}s: {str(e)}")
        logger.exception(e)
        
        return Response({
            'success': False,
            'error': str(e),
            'error_type': 'generation_error',
            'metadata': {
                'execution_time': execution_time,
                'timestamp': time.time()
            }
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def gemini_health(request):
    """
    Health check endpoint for Gemini proxy
    """
    
    try:
        # Check if SDK is available
        if not GENAI_AVAILABLE:
            return Response({
                'status': 'unhealthy',
                'error': 'Gemini SDK not installed',
                'sdk_available': False,
                'api_key_configured': False
            }, status=500)
        
        # Check if API key is configured
        api_key = settings.GEMINI_API_KEY if hasattr(settings, 'GEMINI_API_KEY') else None
        api_key_configured = bool(api_key)
        
        if not api_key_configured:
            return Response({
                'status': 'unhealthy',
                'error': 'Gemini API key not configured',
                'sdk_available': True,
                'api_key_configured': False
            }, status=500)
        
        # Test API key with simple request
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Simple test generation
            test_response = model.generate_content("Say 'OK' if you can respond.")
            
            return Response({
                'status': 'healthy',
                'message': 'Gemini proxy is operational',
                'sdk_available': True,
                'api_key_configured': True,
                'api_key_valid': True,
                'test_response': test_response.text,
                'timestamp': time.time()
            })
            
        except Exception as e:
            logger.error(f"API key validation failed: {str(e)}")
            return Response({
                'status': 'unhealthy',
                'error': f'API key validation failed: {str(e)}',
                'sdk_available': True,
                'api_key_configured': True,
                'api_key_valid': False
            }, status=500)
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=500)
