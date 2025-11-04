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
            'temperature': 0.2,  # Lower = faster, more consistent
            'top_p': 0.9,
            'top_k': 20,
            'max_output_tokens': 32768,  # ✅ DOUBLED from 16384
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
        model_name = generation_config.get('model', 'gemini-2.5-flash')
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=config,
            safety_settings=safety_settings
        )
        
        # Enhanced system prompt for travel planning
        system_context = """
You are an expert Philippine travel planner generating JSON itineraries. Follow these CRITICAL rules:

🛫 AIRPORT SELECTION (MANDATORY):
✅ IF destination has direct airport → Use it with proper code
✅ IF destination has NO direct airport → Recommend NEAREST airport + ground transfer details

PHILIPPINES AIRPORT GUIDE:
✅ Cities WITH Direct Airports:
- Manila (MNL), Cebu (CEB), Davao (DVO), Clark (CRK)
- Puerto Princesa (PPS), Tagbilaran (TAG), Iloilo (ILO)
- Kalibo (KLO), Caticlan (MPH) for Boracay
- Busuanga (USU) for Coron, Siargao (IAO)

❌ Cities WITHOUT Direct Airports (Use Nearest + Ground Transfer):
- Baguio → Manila (MNL) 6hrs or Clark (CRK) 4hrs + bus (₱500-800)
- El Nido → Puerto Princesa (PPS) + 5-6hr van (₱600-1,200)
- Sagada → Manila (MNL) + 12hr bus (₱800-1,200)
- Vigan → Laoag (LAO) + 2hr bus (₱200-400)
- Camiguin → Cagayan de Oro (CGY) + 2hr ferry (₱500)

🗺️ TRAVEL TIME CALCULATION (CRITICAL):
Use coordinates to calculate accurate travel times:

CALCULATION METHOD:
1. Get straight-line distance from coordinates
2. Multiply by circuity: Urban 1.3x | Suburban 1.4x | Mountainous 1.8x
3. Divide by speed: Manila 20 km/h | Peak 12 km/h | Tourist areas 25 km/h | Walking 4 km/h
4. Add traffic buffer: +30-50% for major cities during peak hours
5. Round to nearest 5 min (minimum 5 min)

SPEED REFERENCE:
• Metro Manila/Cebu (normal): 20-25 km/h
• Metro Manila/Cebu (peak 7-9 AM, 5-7 PM): 12-15 km/h
• Tourist areas: 25 km/h
• Provincial highway: 60 km/h
• Walking: 4 km/h
• Jeepney: 18 km/h

EXAMPLES:
• Burnham Park → Baguio Cathedral (250m): "5 minutes walking distance (free)"
• NAIA → Makati (13km): "35 minutes by taxi (₱220)" or "65 minutes during rush hour"
• Intramuros sites (<500m): "5 minutes walking distance (free)"

timeTravel FORMAT: "[X] minutes by [transport] (₱[cost])"
Example: "15 minutes by jeepney (₱15)"

🏨 DAILY STRUCTURE (MANDATORY):
✅ Day 1: Arrival → Hotel Check-in (2:00 PM) → 2-3 activities → Return to hotel (8:00 PM)
   ⚠️ CRITICAL: Day 1 "Hotel Check-in" activity MUST reference the FIRST hotel from your hotels array
   Example: If hotels[0].hotelName = "Bayfront Hotel Manila", then Day 1 must show:
   {
     "time": "2:00 PM",
     "placeName": "Check-in at Bayfront Hotel Manila",
     "placeDetails": "Check-in at Bayfront Hotel Manila, settle into your room",
     ...
   }
   ❌ NEVER use generic "Check-in at Hotel" - always use EXACT hotel name from hotels[0]
   
✅ Day 2-N (Middle): Morning → Lunch → Afternoon → Dinner → **Return to hotel (8:00 PM)**
✅ Last Day: Breakfast → Activity → Hotel Check-out (11:00 AM) → Departure

EVERY MIDDLE DAY MUST END WITH:
{
  "time": "8:00 PM",
  "placeName": "Return to hotel",
  "placeDetails": "End of day, return to hotel for rest",
  "ticketPricing": "Free",
  "timeTravel": "20 minutes by taxi (₱100)"
}

⚠️ FORBIDDEN:
❌ NO suggesting direct flights to cities without airports (e.g., "Arrive at Baguio City via flight")
❌ NO middle days ending without "Return to hotel" activity
❌ NO activities past 9:00 PM without hotel return
❌ NO Day 1 without hotel check-in around 2:00 PM
❌ NO Last Day without hotel check-out around 11:00 AM
❌ NO generic travel times without calculating from coordinates
❌ NO "15 minutes" for all locations without checking actual distance

Generate realistic, logistically accurate itineraries with ACCURATE travel times calculated from coordinates.
"""
        
        # Check if this is a travel itinerary request (contains travel-related keywords)
        is_travel_request = any(keyword in prompt.lower() for keyword in [
            'itinerary', 'trip', 'travel', 'destination', 'hotel', 'flight', 
            'budget', 'travelers', 'places to visit', 'duration'
        ])
        
        # Prepend system context for travel requests
        enhanced_prompt = f"{system_context}\n\n{prompt}" if is_travel_request else prompt
        
        logger.info(f"🤖 Calling Gemini model: {model_name} (Travel context: {is_travel_request})")
        
        # Generate content with enhanced prompt
        response = model.generate_content(enhanced_prompt)
        
        # Calculate execution time
        execution_time = time.time() - start_time
        
        # ============================================================
        # CRITICAL FIX: Check finish_reason BEFORE accessing response.text
        # ============================================================
        
        # Check candidates exist
        if not response.candidates:
            logger.error("❌ No candidates returned in response")
            return Response({
                'success': False,
                'error': 'No response candidates returned from Gemini',
                'error_type': 'api_error',
                'metadata': {
                    'execution_time': execution_time,
                    'timestamp': time.time()
                }
            }, status=500)
        
        # Get first candidate
        candidate = response.candidates[0]
        finish_reason = candidate.finish_reason
        
        # Log finish reason for debugging
        logger.info(f"📊 Finish reason: {finish_reason}")
        
        # Handle different finish reasons
        # FinishReason enum values: 1=STOP, 2=MAX_TOKENS, 3=SAFETY, 4=RECITATION
        if finish_reason == 2:  # MAX_TOKENS
            logger.error(f"❌ Response hit MAX_TOKENS limit. Prompt: {len(prompt)} chars")
            
            # Try to get partial response if available
            partial_text = ""
            try:
                if candidate.content and candidate.content.parts:
                    partial_text = candidate.content.parts[0].text
            except:
                pass
            
            return Response({
                'success': False,
                'error': f'Response hit MAX_TOKENS limit. Increase maxOutputTokens (currently {config["max_output_tokens"]}) or reduce prompt size.',
                'error_type': 'max_tokens',
                'partial_response': partial_text if partial_text else None,
                'metadata': {
                    'execution_time': execution_time,
                    'finish_reason': 'MAX_TOKENS',
                    'prompt_length': len(prompt),
                    'max_output_tokens': config['max_output_tokens'],
                    'timestamp': time.time()
                }
            }, status=400)
        
        elif finish_reason == 3:  # SAFETY
            logger.warning("⚠️ Response blocked by safety filters")
            
            # Extract safety ratings
            safety_ratings = []
            try:
                if candidate.safety_ratings:
                    safety_ratings = [
                        {
                            'category': rating.category.name if hasattr(rating.category, 'name') else str(rating.category),
                            'probability': rating.probability.name if hasattr(rating.probability, 'name') else str(rating.probability)
                        }
                        for rating in candidate.safety_ratings
                    ]
            except Exception as e:
                logger.warning(f"Could not extract safety ratings: {str(e)}")
            
            return Response({
                'success': False,
                'error': 'Response blocked by safety filters. Content may violate safety guidelines.',
                'error_type': 'safety_filter',
                'safety_ratings': safety_ratings,
                'metadata': {
                    'execution_time': execution_time,
                    'finish_reason': 'SAFETY',
                    'timestamp': time.time()
                }
            }, status=400)
        
        elif finish_reason == 4:  # RECITATION
            logger.warning("⚠️ Response blocked due to recitation concerns")
            return Response({
                'success': False,
                'error': 'Response blocked due to potential copyright/recitation concerns.',
                'error_type': 'recitation',
                'metadata': {
                    'execution_time': execution_time,
                    'finish_reason': 'RECITATION',
                    'timestamp': time.time()
                }
            }, status=400)
        
        elif finish_reason != 1:  # Not STOP (1) - unexpected finish reason
            logger.error(f"❌ Unexpected finish_reason: {finish_reason}")
            return Response({
                'success': False,
                'error': f'Unexpected finish reason: {finish_reason}',
                'error_type': 'api_error',
                'metadata': {
                    'execution_time': execution_time,
                    'finish_reason': finish_reason,
                    'timestamp': time.time()
                }
            }, status=500)
        
        # Only access response.text if finish_reason is STOP (1)
        try:
            response_text = response.text
        except Exception as e:
            logger.error(f"❌ Failed to extract response text: {str(e)}")
            # Fallback: try to extract from parts
            try:
                response_text = candidate.content.parts[0].text
            except:
                return Response({
                    'success': False,
                    'error': f'Failed to extract response text: {str(e)}',
                    'error_type': 'parsing_error',
                    'metadata': {
                        'execution_time': execution_time,
                        'timestamp': time.time()
                    }
                }, status=500)
        
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
            'finish_reason': 'STOP',
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
                
                # Add warning if approaching token limit (90% of max)
                if metadata['usage']['candidates_token_count'] >= config['max_output_tokens'] * 0.9:
                    logger.warning(
                        f"⚠️ Response used {metadata['usage']['candidates_token_count']} tokens, "
                        f"approaching limit of {config['max_output_tokens']}"
                    )
                    
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
            model = genai.GenerativeModel('gemini-2.5-flash')
            
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
