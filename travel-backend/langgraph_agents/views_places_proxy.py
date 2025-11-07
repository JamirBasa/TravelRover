"""
Places Search Proxy View - Handles Google Places API searchText with CORS bypass
This view acts as a proxy to fetch place details from Google Places API and serve them
to the frontend without CORS issues or exposing API keys.
"""

import requests
import logging
from django.http import JsonResponse
from django.views import View
from django.conf import settings
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class GooglePlacesSearchProxyView(View):
    """
    Proxy view to search Google Places API without CORS issues or exposing API keys.
    
    Usage:
        POST /api/langgraph/places-search/
        Body: {
            "textQuery": "Intramuros, Manila",
            "languageCode": "en" (optional)
        }
        
    Returns:
        - JSON with places data if successful
        - JSON error response if failed
    """
    
    GOOGLE_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
    
    @method_decorator(cache_page(60 * 60))  # Cache for 1 hour
    def post(self, request):
        """
        Search for places using Google Places API and return results to the client
        """
        import json
        
        try:
            # Parse request body
            if request.content_type == 'application/json':
                body = json.loads(request.body.decode('utf-8'))
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Content-Type must be application/json'
                }, status=400)
            
            text_query = body.get('textQuery')
            
            if not text_query:
                return JsonResponse({
                    'success': False,
                    'error': 'textQuery is required'
                }, status=400)
            
            # Get API key from environment
            api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
            
            if not api_key:
                logger.error("GOOGLE_PLACES_API_KEY not configured")
                return JsonResponse({
                    'success': False,
                    'error': 'API key not configured'
                }, status=500)
            
            # Build request to Google Places API
            headers = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': api_key,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.photos,places.formattedAddress'
            }
            
            # Include optional parameters
            request_body = {
                'textQuery': text_query
            }
            
            if 'languageCode' in body:
                request_body['languageCode'] = body['languageCode']
            
            logger.info(f"🔍 Proxying Places search: {text_query}")
            
            # Make request to Google Places API with SSL verification
            # Try multiple SSL strategies to handle Windows SSL issues
            response = None
            ssl_errors = []
            
            # Strategy 1: Try with certifi (best practice)
            try:
                import certifi
                verify_ssl = certifi.where()
                logger.info(f"🔐 Trying SSL with certifi")
                response = requests.post(
                    self.GOOGLE_PLACES_SEARCH_URL,
                    headers=headers,
                    json=request_body,
                    timeout=10,
                    verify=verify_ssl
                )
                if response.status_code == 200:
                    logger.info("✅ SSL with certifi succeeded")
            except Exception as e:
                ssl_errors.append(f"certifi: {str(e)[:100]}")
                logger.warning(f"⚠️ SSL with certifi failed: {str(e)[:150]}")
                response = None
            
            # Strategy 2: Last resort - disable SSL verification (dev only)
            if not response and settings.DEBUG:
                try:
                    logger.warning("🔓 Falling back to unverified SSL (development only)")
                    import urllib3
                    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
                    response = requests.post(
                        self.GOOGLE_PLACES_SEARCH_URL,
                        headers=headers,
                        json=request_body,
                        timeout=10,
                        verify=False
                    )
                    if response.status_code == 200:
                        logger.info("✅ Unverified SSL succeeded (development mode)")
                except Exception as e:
                    ssl_errors.append(f"no-verify: {str(e)[:100]}")
                    logger.error(f"❌ All SSL strategies failed: {ssl_errors}")
                    return JsonResponse({
                        'success': False,
                        'error': f'SSL connection failed: {"; ".join(ssl_errors)}'
                    }, status=500)
            
            if not response:
                return JsonResponse({
                    'success': False,
                    'error': f'Failed to connect to Places API. SSL errors: {"; ".join(ssl_errors)}'
                }, status=500)
            
            if response.status_code == 200:
                logger.info(f"✅ Places search successful: {text_query}")
                
                # Parse response
                places_data = response.json()
                
                # Add CORS headers and return
                json_response = JsonResponse({
                    'success': True,
                    'data': places_data
                })
                
                json_response['Access-Control-Allow-Origin'] = '*'
                json_response['Access-Control-Allow-Methods'] = 'POST'
                json_response['Access-Control-Allow-Headers'] = 'Content-Type'
                
                return json_response
            
            else:
                logger.error(f"❌ Google Places API error: {response.status_code}")
                error_data = response.json() if response.content else {}
                
                return JsonResponse({
                    'success': False,
                    'error': f'Google Places API error: {response.status_code}',
                    'details': error_data
                }, status=response.status_code)
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in request: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON in request body'
            }, status=400)
            
        except requests.Timeout:
            logger.error("⏱️ Timeout fetching from Google Places API")
            return JsonResponse({
                'success': False,
                'error': 'Request timeout'
            }, status=408)
            
        except Exception as e:
            logger.error(f"❌ Error searching places: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def options(self, request):
        """Handle CORS preflight requests"""
        response = JsonResponse({'success': True})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
