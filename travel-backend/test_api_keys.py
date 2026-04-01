#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from django.conf import settings

print("=" * 70)
print("API KEYS CONFIGURATION CHECK")
print("=" * 70)

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

print("\n" + "=" * 70)
