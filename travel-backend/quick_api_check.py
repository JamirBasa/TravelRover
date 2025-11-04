"""
Quick API Status Check
Fast validation of critical API keys without full integration tests
"""

import os
import sys
import django
import requests

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from django.conf import settings

def check_api_key(name, key, validation_url=None):
    """Quick check if API key is present and optionally validate it"""
    print(f"\n{'='*60}")
    print(f"🔑 {name}")
    print(f"{'='*60}")
    
    if not key or len(key) < 10:
        print(f"❌ MISSING or INVALID (length: {len(key) if key else 0})")
        return False
    
    print(f"✅ Present ({len(key)} characters)")
    print(f"   Key Preview: {key[:8]}...{key[-8:]}")
    
    if validation_url:
        try:
            response = requests.get(validation_url, timeout=5)
            if response.status_code == 200:
                print(f"✅ Validation: API responds correctly")
            elif response.status_code == 401:
                print(f"❌ Validation: Invalid key (401 Unauthorized)")
                return False
            else:
                print(f"⚠️  Validation: Unexpected status {response.status_code}")
        except Exception as e:
            print(f"⚠️  Validation: Could not verify ({str(e)[:50]})")
    
    return True

def main():
    print("\n" + "█"*60)
    print("█  TravelRover - Quick API Keys Check")
    print("█"*60)
    
    results = {}
    
    # Check SerpAPI
    serpapi_key = getattr(settings, 'SERPAPI_KEY', '')
    validation_url = f"https://serpapi.com/account?api_key={serpapi_key}" if serpapi_key else None
    results['SerpAPI (Flights)'] = check_api_key('SerpAPI (Flight Search)', serpapi_key, validation_url)
    
    # Check Google Places API
    google_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', '')
    results['Google Places (Hotels)'] = check_api_key('Google Places API (Hotel Search)', google_key)
    
    # Check Google Maps API
    maps_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
    results['Google Maps (Geocoding)'] = check_api_key('Google Maps API (Geocoding)', maps_key)
    
    # Check Gemini AI
    gemini_key = getattr(settings, 'GOOGLE_GEMINI_AI_API_KEY', '')
    results['Gemini AI (Itinerary)'] = check_api_key('Google Gemini AI (Itinerary Generation)', gemini_key)
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 SUMMARY")
    print(f"{'='*60}")
    
    passed = sum(1 for success in results.values() if success)
    total = len(results)
    
    for name, success in results.items():
        status = "✅" if success else "❌"
        print(f"{status} {name}")
    
    print(f"\n{'='*60}")
    if passed == total:
        print(f"✅ All {total} API keys are configured correctly!")
    else:
        print(f"⚠️  {total - passed} API key(s) need attention")
    print(f"{'='*60}\n")
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
