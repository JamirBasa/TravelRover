"""
API Keys Test Script
Test all API keys used in TravelRover backend
"""

import os
from django.conf import settings

# Configure Django settings if not already configured
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
    import django
    django.setup()

def test_api_keys():
    """Test all API keys"""
    
    print("\n" + "=" * 60)
    print("🔑 TRAVELROVER API KEYS TEST")
    print("=" * 60)
    
    # Define API keys to check
    api_keys = {
        'SERPAPI_KEY': {
            'name': 'SerpAPI',
            'critical': True,
            'purpose': 'Real-time flight search'
        },
        'GOOGLE_PLACES_API_KEY': {
            'name': 'Google Places API',
            'critical': True,
            'purpose': 'Hotel search and location services'
        },
        'GOOGLE_GEMINI_AI_API_KEY': {
            'name': 'Google Gemini AI',
            'critical': True,
            'purpose': 'AI itinerary generation'
        },
        'GOOGLE_MAPS_API_KEY': {
            'name': 'Google Maps API',
            'critical': False,
            'purpose': 'Geocoding and mapping'
        },
        'FIREBASE_CREDENTIALS': {
            'name': 'Firebase',
            'critical': False,
            'purpose': 'Authentication and data storage'
        }
    }
    
    results = {
        'total': len(api_keys),
        'configured': 0,
        'missing': 0,
        'critical_missing': 0
    }
    
    print("\n📊 API Keys Status:")
    print("-" * 60)
    
    for key, info in api_keys.items():
        # Check if key exists in settings
        has_key = hasattr(settings, key) and getattr(settings, key)
        
        # Get value if exists
        if has_key:
            value = str(getattr(settings, key))
            # Mask the key (show only first and last 4 characters)
            if len(value) > 12:
                masked_value = f"{value[:4]}...{value[-4:]}"
            else:
                masked_value = "***"
        else:
            masked_value = "NOT SET"
        
        # Determine status
        if has_key:
            status = "✅"
            results['configured'] += 1
        else:
            status = "❌"
            results['missing'] += 1
            if info['critical']:
                results['critical_missing'] += 1
        
        # Determine priority
        priority = "[CRITICAL]" if info['critical'] else "[OPTIONAL]"
        
        # Print result
        print(f"{status} {info['name']:<25} {priority}")
        print(f"   Purpose: {info['purpose']}")
        print(f"   Key: {masked_value}")
        print()
    
    # Summary
    print("=" * 60)
    print("📈 SUMMARY")
    print("=" * 60)
    print(f"Total API Keys: {results['total']}")
    print(f"✅ Configured: {results['configured']}")
    print(f"❌ Missing: {results['missing']}")
    
    if results['critical_missing'] > 0:
        print(f"\n⚠️  WARNING: {results['critical_missing']} critical API key(s) missing!")
        print("   Application may not function properly.")
    else:
        print(f"\n✅ All critical API keys configured!")
    
    print("=" * 60)
    
    # Test individual APIs if possible
    print("\n🧪 TESTING API CONNECTIONS")
    print("=" * 60)
    
    # Test SerpAPI
    if hasattr(settings, 'SERPAPI_KEY') and settings.SERPAPI_KEY:
        test_serpapi()
    else:
        print("⏭️  Skipping SerpAPI test (key not configured)")
    
    # Test Google Places API
    if hasattr(settings, 'GOOGLE_PLACES_API_KEY') and settings.GOOGLE_PLACES_API_KEY:
        test_google_places()
    else:
        print("⏭️  Skipping Google Places API test (key not configured)")
    
    print("=" * 60)
    print("\n✅ API Keys Test Complete!\n")


def test_serpapi():
    """Test SerpAPI connection"""
    print("\n🔍 Testing SerpAPI...")
    try:
        import requests
        from django.conf import settings
        
        url = "https://serpapi.com/search"
        params = {
            'engine': 'google_flights',
            'departure_id': 'MNL',
            'arrival_id': 'CEB',
            'outbound_date': '2025-11-01',
            'currency': 'PHP',
            'api_key': settings.SERPAPI_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            print("   ✅ SerpAPI connection successful!")
            data = response.json()
            if 'search_metadata' in data:
                print(f"   📊 Status: {data['search_metadata'].get('status', 'Unknown')}")
        else:
            print(f"   ⚠️  SerpAPI returned status code: {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("   ⏱️  SerpAPI request timed out")
    except Exception as e:
        print(f"   ❌ SerpAPI test failed: {str(e)}")


def test_google_places():
    """Test Google Places API connection"""
    print("\n🗺️  Testing Google Places API...")
    try:
        import requests
        from django.conf import settings
        
        url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        params = {
            'input': 'Manila Ocean Park',
            'inputtype': 'textquery',
            'fields': 'formatted_address,name',
            'key': settings.GOOGLE_PLACES_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'OK':
                print("   ✅ Google Places API connection successful!")
                if data.get('candidates'):
                    print(f"   📍 Found: {data['candidates'][0].get('name', 'Unknown')}")
            elif data.get('status') == 'REQUEST_DENIED':
                print(f"   ❌ API Key invalid or restricted")
                print(f"   Error: {data.get('error_message', 'No error message')}")
            else:
                print(f"   ⚠️  Status: {data.get('status')}")
        else:
            print(f"   ⚠️  Google Places API returned status code: {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("   ⏱️  Google Places API request timed out")
    except Exception as e:
        print(f"   ❌ Google Places API test failed: {str(e)}")


if __name__ == "__main__":
    test_api_keys()
