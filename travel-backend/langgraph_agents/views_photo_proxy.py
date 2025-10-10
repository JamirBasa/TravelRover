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
            
            # Add query parameters
            params = {
                'maxHeightPx': request.GET.get('maxHeightPx', '600'),
                'maxWidthPx': request.GET.get('maxWidthPx', '600'),
                'key': api_key
            }
            
            logger.info(f"🔄 Proxying photo request: {photo_ref[:50]}...")
            
            # Fetch the photo from Google Places API
            response = requests.get(
                photo_url,
                params=params,
                timeout=10,
                stream=True
            )
            
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
                return JsonResponse({
                    'success': False,
                    'error': f'Failed to fetch photo: {response.status_code}'
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
