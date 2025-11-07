"""
Photo Proxy View - Handles Google Places API photo fetching with CORS bypass
This view acts as a proxy to fetch photos from Google Places API and serve them
to the frontend without CORS issues.
"""

import requests
import logging
from django.http import HttpResponse, JsonResponse
from django.views import View
from django.conf import settings
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)


class GooglePlacesPhotoProxyView(View):
    """
    Proxy view to fetch Google Places API photos without CORS issues.
    
    Usage:
        GET /api/langgraph/photo-proxy/?photo_ref=<PHOTO_REFERENCE>
        
    Returns:
        - Image file (JPEG) if successful
        - JSON error response if failed
    
    Note: photo_ref should be the full photo name like:
          places/ChIJ.../photos/AWn5SU...
    """
    
    GOOGLE_PLACES_PHOTO_URL = "https://places.googleapis.com/v1/{photo_ref}/media"
    
    @method_decorator(cache_page(60 * 60 * 24))  # Cache for 24 hours
    def get(self, request):
        """
        Fetch photo from Google Places API and return it to the client
        """
        photo_ref = request.GET.get('photo_ref')
        
        if not photo_ref:
            return JsonResponse({
                'success': False,
                'error': 'photo_ref parameter is required'
            }, status=400)
        
        # Get API key from environment
        api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
        
        if not api_key:
            logger.error("GOOGLE_PLACES_API_KEY not configured")
            return JsonResponse({
                'success': False,
                'error': 'API key not configured'
            }, status=500)
        
        try:
            # Build the photo URL
            photo_url = f"{self.GOOGLE_PLACES_PHOTO_URL.format(photo_ref=photo_ref)}"
            
            # Add query parameters (note: key goes in query params, not headers for media endpoint)
            params = {
                'maxHeightPx': request.GET.get('maxHeightPx', '600'),
                'maxWidthPx': request.GET.get('maxWidthPx', '600'),
                'key': api_key
            }
            
            logger.info(f"🔄 Proxying photo request: {photo_ref[:50]}...")
            logger.info(f"📸 Photo URL: {photo_url}")
            
            # Fetch the photo from Google Places API with SSL verification
            # Try multiple SSL strategies to handle Windows SSL issues
            response = None
            ssl_errors = []
            
            # Strategy 1: Try with certifi (best practice)
            try:
                import certifi
                verify_ssl = certifi.where()
                logger.info(f"🔐 Trying SSL with certifi")
                response = requests.get(
                    photo_url,
                    params=params,
                    timeout=10,
                    stream=True,
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
                    response = requests.get(
                        photo_url,
                        params=params,
                        timeout=10,
                        stream=True,
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
            
            logger.info(f"📊 Google API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                logger.info(f"✅ Photo fetched successfully: {photo_ref[:50]}...")
                
                # Create Django response with the image
                django_response = HttpResponse(
                    response.content,
                    content_type=response.headers.get('Content-Type', 'image/jpeg')
                )
                
                # Add CORS headers
                django_response['Access-Control-Allow-Origin'] = '*'
                django_response['Access-Control-Allow-Methods'] = 'GET'
                django_response['Cache-Control'] = 'public, max-age=86400'  # 24 hours
                
                return django_response
            
            else:
                logger.error(f"❌ Google Places API error: {response.status_code}")
                logger.error(f"📄 Response content: {response.text[:200]}")
                return JsonResponse({
                    'success': False,
                    'error': f'Failed to fetch photo: {response.status_code}',
                    'details': response.text[:200]
                }, status=response.status_code)
                
        except requests.Timeout:
            logger.error("⏱️ Timeout fetching photo from Google Places API")
            return JsonResponse({
                'success': False,
                'error': 'Request timeout'
            }, status=408)
            
        except Exception as e:
            logger.error(f"❌ Error fetching photo: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
