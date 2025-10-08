# langgraph_agents/checks.py
"""
Django system checks for TravelRover API key configuration
Runs automatically on `python manage.py check` and server startup
"""

from django.core.checks import Warning, Error, register, Tags
from django.conf import settings


@register(Tags.security)
def check_api_keys(app_configs, **kwargs):
    """
    Check that all required API keys are configured
    Runs on Django startup and `python manage.py check`
    """
    errors = []
    warnings = []
    
    # Critical API keys (system won't work without these)
    critical_keys = {
        'SERPAPI_KEY': {
            'purpose': 'Real-time flight search functionality',
            'agent': 'FlightAgent',
            'fallback': 'Mock flight data will be used'
        },
        'GOOGLE_PLACES_API_KEY': {
            'purpose': 'Hotel search and location services',
            'agent': 'HotelAgent',
            'fallback': 'Mock hotel data will be used'
        },
        'GOOGLE_GEMINI_AI_API_KEY': {
            'purpose': 'AI-powered itinerary generation',
            'agent': 'CoordinatorAgent',
            'fallback': 'Trip generation will fail'
        }
    }
    
    # Optional API keys (system works without these)
    optional_keys = {
        'GOOGLE_MAPS_API_KEY': {
            'purpose': 'Enhanced geocoding and mapping features',
            'fallback': 'Basic geocoding will be used'
        },
        'FIREBASE_PROJECT_ID': {
            'purpose': 'Firebase configuration monitoring',
            'fallback': 'Admin dashboard Firebase monitoring unavailable'
        }
    }
    
    # Check critical keys
    for key_name, info in critical_keys.items():
        key_value = getattr(settings, key_name, None)
        
        if not key_value or len(key_value.strip()) == 0:
            errors.append(
                Error(
                    f'{key_name} is not configured',
                    hint=(
                        f'Add {key_name} to travel-backend/.env file\n'
                        f'Purpose: {info["purpose"]}\n'
                        f'Affected: {info["agent"]}\n'
                        f'Fallback: {info["fallback"]}'
                    ),
                    id='travelrover.E001',
                )
            )
    
    # Check optional keys
    for key_name, info in optional_keys.items():
        key_value = getattr(settings, key_name, None)
        
        if not key_value or len(key_value.strip()) == 0:
            warnings.append(
                Warning(
                    f'{key_name} is not configured (optional)',
                    hint=(
                        f'Add {key_name} to travel-backend/.env file for enhanced functionality\n'
                        f'Purpose: {info["purpose"]}\n'
                        f'Fallback: {info["fallback"]}'
                    ),
                    id='travelrover.W001',
                )
            )
    
    return errors + warnings


@register(Tags.security)
def check_firebase_configuration(app_configs, **kwargs):
    """
    Check Firebase configuration completeness
    """
    warnings = []
    
    firebase_keys = [
        'FIREBASE_API_KEY',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_STORAGE_BUCKET'
    ]
    
    configured_keys = [
        key for key in firebase_keys 
        if getattr(settings, key, None)
    ]
    
    if len(configured_keys) > 0 and len(configured_keys) < len(firebase_keys):
        warnings.append(
            Warning(
                'Firebase configuration is incomplete',
                hint=(
                    f'Configured: {len(configured_keys)}/{len(firebase_keys)} keys\n'
                    f'Add all Firebase keys to travel-backend/.env for full functionality:\n'
                    + '\n'.join(f'  - {key}' for key in firebase_keys)
                ),
                id='travelrover.W002',
            )
        )
    
    return warnings


@register(Tags.compatibility)
def check_frontend_backend_sync(app_configs, **kwargs):
    """
    Check that frontend and backend are properly configured
    """
    warnings = []
    
    # Check that API keys are in backend, not frontend
    gemini_key = getattr(settings, 'GOOGLE_GEMINI_AI_API_KEY', None)
    
    if gemini_key:
        # Recommend removing from frontend if it exists
        warnings.append(
            Warning(
                'Ensure API keys are only in backend .env',
                hint=(
                    'API keys should ONLY be in travel-backend/.env\n'
                    'Remove VITE_GOOGLE_PLACES_API_KEY and VITE_GOOGLE_GEMINI_AI_API_KEY from frontend .env.local\n'
                    'Keep only VITE_GOOGLE_AUTH_CLIENT_ID and VITE_FIREBASE_* in frontend'
                ),
                id='travelrover.W003',
            )
        )
    
    return warnings
