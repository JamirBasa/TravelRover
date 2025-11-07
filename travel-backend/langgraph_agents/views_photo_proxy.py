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
            
            # ✅ OPTIMIZED: Reduced default photo size for faster loading
            # 400x400 is sufficient for preview cards and loads 44% faster than 600x600
            params = {
                'maxHeightPx': request.GET.get('maxHeightPx', '400'),
                'maxWidthPx': request.GET.get('maxWidthPx', '400'),
                'key': api_key
            }
            
            # ✅ DEVELOPMENT MODE: SSL verification disabled for easier local testing
            # 🔒 PRODUCTION: Change verify=False to verify=True before deployment
            # 
            # Why disabled in dev?
            # - Windows certificate store issues causing SSL errors
            # - Adds 2-3 seconds of retry overhead
            # - Development environment is trusted (localhost)
            #
            # For production deployment:
            # 1. Change verify=False to verify=True
            # 2. Or use: verify=not settings.DEBUG (auto-enables SSL in production)
            
            verify_ssl = False if settings.DEBUG else True
            
            logger.info(f"🔄 Proxying photo request: {photo_ref[:50]}...")
            logger.info(f"📸 Photo URL: {photo_url}")
            logger.info(f"📐 Photo dimensions: {params['maxHeightPx']}x{params['maxWidthPx']}")
            logger.info(f"🔑 API key configured: {'Yes' if api_key else 'No'}")
            logger.info(f"🔓 SSL verification: {verify_ssl}")
            
            if settings.DEBUG:
                logger.info("🔓 DEVELOPMENT MODE: SSL verification disabled")
                # Suppress SSL warnings in development for cleaner logs
                import urllib3
                urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            else:
                logger.info("🔒 PRODUCTION MODE: SSL verification enabled")
            
            # ✅ Make request to Google Places API
            response = None
            try:
                # ✅ Simple, fast request - no SSL retry overhead
                response = requests.get(
                    photo_url,
                    params=params,
                    timeout=30,  # ✅ 30 seconds for large photos (87KB-100KB)
                    stream=True,
                    verify=verify_ssl  # ✅ False in dev (DEBUG=True), True in prod (DEBUG=False)
                )
                
                logger.info(f"📊 Google API Response Status: {response.status_code}")
                
                if response.status_code == 200:
                    mode = "development" if settings.DEBUG else "production"
                    logger.info(f"✅ Photo fetched successfully ({mode} mode)")
                
            except requests.Timeout:
                logger.error("⏱️ Timeout (30s) fetching photo - photo may be too large")
                return JsonResponse({
                    'success': False,
                    'error': 'Photo fetch timeout after 30 seconds'
                }, status=408)
            except requests.exceptions.SSLError as ssl_err:
                logger.error(f"🔒 SSL Error: {str(ssl_err)[:200]}")
                if not settings.DEBUG:
                    logger.error("💡 If this is production, check SSL certificates")
                return JsonResponse({
                    'success': False,
                    'error': f'SSL Error: {str(ssl_err)[:200]}'
                }, status=500)
            except requests.exceptions.RequestException as req_err:
                logger.error(f"🌐 Request failed: {str(req_err)[:200]}")
                return JsonResponse({
                    'success': False,
                    'error': f'Request failed: {str(req_err)[:200]}'
                }, status=500)
            except Exception as e:
                logger.error(f"❌ Failed to fetch photo: {str(e)[:200]}")
                return JsonResponse({
                    'success': False,
                    'error': f'Photo fetch failed: {str(e)[:200]}'
                }, status=500)
            
            # ✅ Validate response exists and has valid status
            if not response:
                logger.error("❌ Response object is None - request may have failed silently")
                return JsonResponse({
                    'success': False,
                    'error': 'No response received from Google API'
                }, status=500)
            
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
                try:
                    error_text = response.text[:200]
                    logger.error(f"📄 Response content: {error_text}")
                except:
                    error_text = "Unable to read response content"
                    logger.error(f"📄 Response content: {error_text}")
                
                return JsonResponse({
                    'success': False,
                    'error': f'Google API returned status: {response.status_code}',
                    'details': error_text
                }, status=response.status_code)
                
        except Exception as e:
            # ✅ Catch any uncaught errors from the outer try block
            logger.error(f"❌ Unexpected error in photo proxy: {str(e)}")
            logger.exception(e)  # Full stack trace
            return JsonResponse({
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }, status=500)
