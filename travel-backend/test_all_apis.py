"""
Comprehensive API Test - Tests all critical APIs with actual requests
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_serpapi():
    """Test SerpAPI with a real flight search"""
    print("\n🔍 Testing SerpAPI (Flight Search)...")
    print("-" * 60)
    
    api_key = os.getenv('SERPAPI_KEY')
    if not api_key:
        print("   ❌ SERPAPI_KEY not configured")
        return False
    
    try:
        # Test with a simple one-way flight search
        url = "https://serpapi.com/search"
        params = {
            'engine': 'google_flights',
            'departure_id': 'MNL',
            'arrival_id': 'CEB',
            'outbound_date': '2025-11-01',
            'type': '2',  # One-way flight
            'currency': 'PHP',
            'hl': 'en',
            'api_key': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'best_flights' in data or 'other_flights' in data:
                print("   ✅ SerpAPI connection successful!")
                print(f"   📍 Test query: Manila (MNL) → Cebu (CEB)")
                if 'best_flights' in data and data['best_flights']:
                    flight = data['best_flights'][0]
                    print(f"   ✈️  Sample result: {flight.get('flights', [{}])[0].get('airline', 'N/A')}")
                return True
            else:
                print(f"   ⚠️  API response missing flight data: {list(data.keys())}")
                return False
        else:
            print(f"   ❌ SerpAPI returned status code: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   ❌ SerpAPI test failed: {str(e)}")
        return False


def test_google_places():
    """Test Google Places API"""
    print("\n🗺️  Testing Google Places API...")
    print("-" * 60)
    
    api_key = os.getenv('GOOGLE_PLACES_API_KEY')
    if not api_key:
        print("   ❌ GOOGLE_PLACES_API_KEY not configured")
        return False
    
    try:
        # Test with Place Details API
        url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        params = {
            'input': 'Intramuros Manila',
            'inputtype': 'textquery',
            'fields': 'name,formatted_address,place_id',
            'key': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'OK' and data.get('candidates'):
                place = data['candidates'][0]
                print("   ✅ Google Places API connection successful!")
                print(f"   📍 Found: {place.get('name')}")
                print(f"   🏠 Address: {place.get('formatted_address')}")
                return True
            else:
                print(f"   ⚠️  API status: {data.get('status')}")
                return False
        else:
            print(f"   ❌ API returned status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Google Places API test failed: {str(e)}")
        return False


def test_google_gemini():
    """Test Google Gemini AI API"""
    print("\n🤖 Testing Google Gemini AI...")
    print("-" * 60)
    
    api_key = os.getenv('GOOGLE_GEMINI_AI_API_KEY')
    if not api_key:
        print("   ❌ GOOGLE_GEMINI_AI_API_KEY not configured")
        return False
    
    try:
        # Test with a simple generation request using the correct model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        data = {
            'contents': [{
                'parts': [{
                    'text': 'Say "Hello, TravelRover!" in exactly three words.'
                }]
            }]
        }
        
        response = requests.post(url, json=data, headers=headers, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and result['candidates']:
                text = result['candidates'][0]['content']['parts'][0]['text']
                print("   ✅ Google Gemini AI connection successful!")
                print(f"   💬 AI Response: {text.strip()}")
                return True
            else:
                print(f"   ⚠️  Unexpected response format: {result}")
                return False
        else:
            print(f"   ❌ API returned status code: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Google Gemini AI test failed: {str(e)}")
        return False


def test_google_geocoding():
    """Test Google Geocoding API (Maps)"""
    print("\n📍 Testing Google Geocoding API...")
    print("-" * 60)
    
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("   ℹ️  GOOGLE_MAPS_API_KEY not configured (optional)")
        return None
    
    try:
        # Test geocoding
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': 'Rizal Park, Manila',
            'key': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'OK' and data.get('results'):
                location = data['results'][0]['geometry']['location']
                print("   ✅ Google Geocoding API connection successful!")
                print(f"   📍 Coordinates: {location['lat']}, {location['lng']}")
                return True
            else:
                print(f"   ⚠️  API status: {data.get('status')}")
                return False
        else:
            print(f"   ❌ API returned status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Google Geocoding API test failed: {str(e)}")
        return False


def main():
    print("\n" + "=" * 60)
    print("🧪 COMPREHENSIVE API CONNECTION TEST")
    print("=" * 60)
    
    results = {}
    
    # Test critical APIs
    results['SerpAPI'] = test_serpapi()
    results['Google Places'] = test_google_places()
    results['Google Gemini AI'] = test_google_gemini()
    
    # Test optional APIs
    results['Google Geocoding'] = test_google_geocoding()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    critical_passed = 0
    critical_total = 0
    optional_passed = 0
    optional_total = 0
    
    critical_apis = ['SerpAPI', 'Google Places', 'Google Gemini AI']
    optional_apis = ['Google Geocoding']
    
    print("\n🔴 Critical APIs:")
    for api in critical_apis:
        critical_total += 1
        status = "✅ PASS" if results.get(api) else "❌ FAIL"
        if results.get(api):
            critical_passed += 1
        print(f"   {status} - {api}")
    
    print("\n🟡 Optional APIs:")
    for api in optional_apis:
        optional_total += 1
        result = results.get(api)
        if result is None:
            status = "ℹ️  NOT CONFIGURED"
        elif result:
            status = "✅ PASS"
            optional_passed += 1
        else:
            status = "❌ FAIL"
        print(f"   {status} - {api}")
    
    print("\n" + "=" * 60)
    print(f"✅ Critical APIs: {critical_passed}/{critical_total} passed")
    print(f"🟡 Optional APIs: {optional_passed}/{optional_total} passed")
    
    if critical_passed == critical_total:
        print("\n✅ All critical API tests passed! System ready for production.")
    else:
        print("\n⚠️  Some critical API tests failed. Please check configuration.")
    
    print("=" * 60)


if __name__ == "__main__":
    main()
