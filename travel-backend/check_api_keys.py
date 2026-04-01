#!/usr/bin/env python
"""
Check which API keys are configured in Django settings
Run: python manage.py shell < check_api_keys.py
"""

from django.conf import settings
import os

print("=" * 70)
print("API KEYS CONFIGURATION CHECK")
print("=" * 70)

# Check environment variables
api_keys = {
    'GOOGLE_GEMINI_AI_API_KEY': 'Google Gemini AI',
    'SERPAPI_KEY': 'SerpAPI (Flight Search)',
    'GOOGLE_PLACES_API_KEY': 'Google Places API',
    'GOOGLE_MAPS_API_KEY': 'Google Maps API',
    'FIREBASE_API_KEY': 'Firebase API',
    'UNSPLASH_ACCESS_KEY': 'Unsplash API',
    'LONGCAT_API_KEY': 'LongCat AI',
}

print("\n📋 LOADED FROM DJANGO SETTINGS:")
print("-" * 70)

for key_name, description in api_keys.items():
    value = getattr(settings, key_name, None)
    if value:
        masked = value[:10] + '...' + value[-5:] if len(value) > 20 else value
        print(f"✅ {key_name:<30} ({description:<25})")
        print(f"   Value: {masked}")
    else:
        print(f"❌ {key_name:<30} (MISSING)")

print("\n📋 ALSO CHECKING ENVIRONMENT VARIABLES DIRECTLY:")
print("-" * 70)

for key_name in api_keys.keys():
    value = os.getenv(key_name)
    if value:
        masked = value[:10] + '...' + value[-5:] if len(value) > 20 else value
        print(f"✅ {key_name}: {masked}")
    else:
        print(f"❌ {key_name}: NOT IN ENV")

print("\n" + "=" * 70)
print("⚠️  IF KEYS ARE MISSING:")
print("-" * 70)
print("1. Go to Railway dashboard")
print("2. Select TravelRover backend service")
print("3. Go to Variables tab")
print("4. Add the missing API keys")
print("5. Redeploy the service")
print("=" * 70)
