"""
Geocoding Proxy View - Handles Google Geocoding API with CORS bypass
Proxies geocoding requests to keep API key secure on backend
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
class GoogleGeocodingProxyView(View):
    """
    Proxy view for Google Geocoding API without CORS issues or exposing API keys.
    
    Usage:
        POST /api/langgraph/geocoding/
        Body: {
            "address": "Chocolate Hills, Carmen, Bohol, Philippines",
            "components": "country:PH" (optional)
        }
        
    Returns:
        - JSON with geocoding data if successful
        - JSON error response if failed
    """
    
    GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
    
    @method_decorator(cache_page(60 * 60 * 24 * 7))  # Cache for 1 week (geocoding rarely changes)
    def post(self, request):
        """
        Geocode an address using Google Geocoding API
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
            
            address = body.get('address')
            
            if not address:
                return JsonResponse({
                    'success': False,
                    'error': 'address is required'
                }, status=400)
            
            # Get API key from environment
            api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
            
            if not api_key:
                logger.error("GOOGLE_PLACES_API_KEY not configured for geocoding")
                return JsonResponse({
                    'success': False,
                    'error': 'API key not configured'
                }, status=500)
            
            # Build request parameters
            params = {
                'address': address,
                'key': api_key
            }
            
            # Add optional components (e.g., country:PH to restrict to Philippines)
            if 'components' in body:
                params['components'] = body['components']
            
            logger.info(f"🔍 Proxying geocoding request: {address}")
            
            # Make request to Google Geocoding API with SSL verification
            # Try multiple SSL strategies to handle Windows SSL issues
            response = None
            ssl_errors = []
            
            # Strategy 1: Try with certifi (best practice)
            try:
                import certifi
                verify_ssl = certifi.where()
                logger.info(f"🔐 Trying SSL with certifi: {verify_ssl}")
                response = requests.get(
                    self.GOOGLE_GEOCODING_URL,
                    params=params,
                    timeout=10,
                    verify=verify_ssl
                )
                if response.status_code == 200:
                    logger.info("✅ SSL with certifi succeeded")
            except Exception as e:
                ssl_errors.append(f"certifi: {str(e)[:100]}")
                logger.warning(f"⚠️ SSL with certifi failed: {str(e)[:150]}")
                response = None
            
            # Strategy 2: Skip (same as Strategy 1 on most systems)
            
            # Strategy 3: Last resort - disable SSL verification (dev only)
            if not response and settings.DEBUG:
                try:
                    logger.warning("🔓 Falling back to unverified SSL (development only)")
                    import urllib3
                    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
                    response = requests.get(
                        self.GOOGLE_GEOCODING_URL,
                        params=params,
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
                    'error': f'Failed to connect to geocoding API. SSL errors: {"; ".join(ssl_errors)}. Try setting DEBUG=True in Django settings.'
                }, status=500)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'OK':
                    logger.info(f"✅ Geocoding successful: {address}")
                    
                    return JsonResponse({
                        'success': True,
                        'data': data
                    })
                elif data.get('status') == 'ZERO_RESULTS':
                    logger.warning(f"⚠️ No geocoding results for: {address}")
                    return JsonResponse({
                        'success': False,
                        'error': 'No results found',
                        'status': 'ZERO_RESULTS'
                    }, status=404)
                else:
                    logger.error(f"❌ Geocoding API error: {data.get('status')}")
                    return JsonResponse({
                        'success': False,
                        'error': f"Geocoding API error: {data.get('status')}",
                        'details': data.get('error_message', '')
                    }, status=400)
            else:
                logger.error(f"❌ HTTP error: {response.status_code}")
                return JsonResponse({
                    'success': False,
                    'error': f'HTTP error: {response.status_code}'
                }, status=response.status_code)
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in request: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON in request body'
            }, status=400)
            
        except requests.Timeout:
            logger.error("⏱️ Timeout fetching from Geocoding API")
            return JsonResponse({
                'success': False,
                'error': 'Request timeout'
            }, status=408)
            
        except Exception as e:
            logger.error(f"❌ Error geocoding address: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def get(self, request):
        """Handle GET requests (should use POST, but provide helpful message)"""
        return JsonResponse({
            'success': False,
            'error': 'Method not allowed. Use POST with JSON body containing "address" field.',
            'example': {
                'method': 'POST',
                'url': '/api/langgraph/geocoding/',
                'body': {
                    'address': 'Buenavista, Bohol, Philippines',
                    'components': 'country:PH'
                }
            }
        }, status=405)
    
    def options(self, request):
        """Handle CORS preflight requests"""
        response = JsonResponse({'success': True})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
