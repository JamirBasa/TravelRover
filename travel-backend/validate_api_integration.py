"""
API Integration Validation Script
Tests all critical API connections for TravelRover backend
"""

import os
import sys
import django
import requests
from datetime import datetime, timedelta

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from django.conf import settings

def print_header(title):
    """Print formatted section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_result(test_name, success, message="", details=None):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} | {test_name}")
    if message:
        print(f"     {message}")
    if details:
        for key, value in details.items():
            print(f"     • {key}: {value}")

def test_environment_variables():
    """Test 1: Verify all required API keys are present"""
    print_header("TEST 1: Environment Variables")
    
    required_keys = {
        'SERPAPI_KEY': 'SerpAPI (Flight Search)',
        'GOOGLE_PLACES_API_KEY': 'Google Places API (Hotels)',
        'GOOGLE_MAPS_API_KEY': 'Google Maps API (Geocoding)',
        'GOOGLE_GEMINI_AI_API_KEY': 'Google Gemini AI (Itinerary Generation)'
    }
    
    all_present = True
    results = {}
    
    for key, description in required_keys.items():
        value = getattr(settings, key, None)
        is_present = bool(value and len(value) > 10)
        results[description] = f"{'Present' if is_present else 'MISSING'} ({len(value) if value else 0} chars)"
        if not is_present:
            all_present = False
    
    print_result(
        "API Keys Configuration",
        all_present,
        "All required API keys are configured" if all_present else "Some API keys are missing or invalid",
        results
    )
    
    return all_present

def test_serpapi_connection():
    """Test 2: Validate SerpAPI connectivity and response"""
    print_header("TEST 2: SerpAPI (Flight Search)")
    
    api_key = getattr(settings, 'SERPAPI_KEY', '')
    
    if not api_key:
        print_result("SerpAPI Connection", False, "API key not configured")
        return False
    
    try:
        # Test with a simple search (account info)
        url = "https://serpapi.com/account"
        params = {'api_key': api_key}
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print_result(
                "SerpAPI Account Status",
                True,
                "API key is valid and working",
                {
                    'Account Email': data.get('account_email', 'N/A'),
                    'Searches Left': f"{data.get('total_searches_left', 'N/A')} remaining",
                    'Plan': data.get('plan', 'N/A')
                }
            )
            return True
        elif response.status_code == 401:
            print_result("SerpAPI Connection", False, "Invalid API key (401 Unauthorized)")
            return False
        else:
            print_result("SerpAPI Connection", False, f"HTTP {response.status_code}: {response.text[:100]}")
            return False
            
    except requests.Timeout:
        print_result("SerpAPI Connection", False, "Request timeout (>10 seconds)")
        return False
    except Exception as e:
        print_result("SerpAPI Connection", False, f"Error: {str(e)}")
        return False

def test_google_places_api():
    """Test 3: Validate Google Places API connectivity"""
    print_header("TEST 3: Google Places API (Hotel Search)")
    
    api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', '')
    
    if not api_key:
        print_result("Google Places API", False, "API key not configured")
        return False
    
    try:
        # Test 1: Geocoding (convert city to coordinates)
        geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': 'Cebu City, Philippines',
            'key': api_key
        }
        
        response = requests.get(geocode_url, params=params, timeout=10)
        
        if response.status_code != 200:
            print_result("Google Geocoding API", False, f"HTTP {response.status_code}")
            return False
        
        geo_data = response.json()
        
        if geo_data.get('status') != 'OK':
            print_result("Google Geocoding API", False, f"API Status: {geo_data.get('status')}")
            return False
        
        location = geo_data['results'][0]['geometry']['location']
        lat, lng = location['lat'], location['lng']
        
        print_result(
            "Google Geocoding API",
            True,
            "Successfully geocoded test location",
            {
                'Test Location': 'Cebu City, Philippines',
                'Coordinates': f"({lat}, {lng})"
            }
        )
        
        # Test 2: Nearby Search (find hotels)
        nearby_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': f"{lat},{lng}",
            'radius': 5000,
            'type': 'lodging',
            'key': api_key
        }
        
        response = requests.get(nearby_url, params=params, timeout=10)
        
        if response.status_code != 200:
            print_result("Google Places Nearby Search", False, f"HTTP {response.status_code}")
            return False
        
        places_data = response.json()
        
        if places_data.get('status') == 'REQUEST_DENIED':
            print_result(
                "Google Places Nearby Search",
                False,
                f"Request denied: {places_data.get('error_message', 'Check API key restrictions')}"
            )
            return False
        
        if places_data.get('status') != 'OK':
            print_result("Google Places Nearby Search", False, f"API Status: {places_data.get('status')}")
            return False
        
        hotels_found = len(places_data.get('results', []))
        
        print_result(
            "Google Places Nearby Search",
            True,
            "Successfully retrieved hotel listings",
            {
                'Hotels Found': f"{hotels_found} results",
                'Sample Hotel': places_data['results'][0]['name'] if hotels_found > 0 else 'N/A'
            }
        )
        
        return True
        
    except requests.Timeout:
        print_result("Google Places API", False, "Request timeout (>10 seconds)")
        return False
    except Exception as e:
        print_result("Google Places API", False, f"Error: {str(e)}")
        return False

def test_flight_search_integration():
    """Test 4: End-to-end flight search integration"""
    print_header("TEST 4: Flight Search Integration (MNL → CEB)")
    
    try:
        from flights.views import FlightSearchView
        from rest_framework.test import APIRequestFactory
        
        # Create test request
        factory = APIRequestFactory()
        
        # Calculate dates (7 days from now, return 3 days later)
        departure_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        return_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        
        request_data = {
            'from_airport': 'MNL',
            'to_airport': 'CEB',
            'departure_date': departure_date,
            'return_date': return_date,
            'adults': 2,
            'trip_type': 'round-trip'
        }
        
        request = factory.post('/api/search-flights/', request_data, format='json')
        
        # Execute flight search
        view = FlightSearchView()
        response = view.post(request)
        
        if response.status_code == 200:
            data = response.data
            flights = data.get('flights', [])
            
            print_result(
                "Flight Search (SerpAPI Integration)",
                len(flights) > 0,
                f"Flight search completed successfully",
                {
                    'Route': f"{request_data['from_airport']} → {request_data['to_airport']}",
                    'Departure Date': departure_date,
                    'Return Date': return_date,
                    'Flights Found': f"{len(flights)} options",
                    'Best Price': flights[0].get('price', 'N/A') if flights else 'N/A'
                }
            )
            return len(flights) > 0
        else:
            print_result("Flight Search Integration", False, f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_result("Flight Search Integration", False, f"Error: {str(e)}")
        return False

def test_hotel_search_integration():
    """Test 5: End-to-end hotel search integration"""
    print_header("TEST 5: Hotel Search Integration (Cebu)")
    
    try:
        from langgraph_agents.agents.hotel_agent import HotelAgent
        import asyncio
        
        # Create hotel agent
        agent = HotelAgent(session_id='test-validation')
        
        # Test parameters
        hotel_params = {
            'destination': 'Cebu City, Philippines',
            'checkin_date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
            'checkout_date': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
            'guests': 2,
            'duration': 3,
            'preferred_type': 'hotel',
            'budget_level': 2
        }
        
        # Execute hotel search
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            agent._execute_logic({'hotel_params': hotel_params})
        )
        loop.close()
        
        if result.get('success'):
            hotels = result.get('hotels', [])
            
            print_result(
                "Hotel Search (Google Places Integration)",
                len(hotels) > 0,
                "Hotel search completed successfully",
                {
                    'Destination': hotel_params['destination'],
                    'Check-in': hotel_params['checkin_date'],
                    'Hotels Found': f"{len(hotels)} options",
                    'Top Hotel': hotels[0].get('name', 'N/A') if hotels else 'N/A',
                    'Rating': f"{hotels[0].get('rating', 'N/A')}/5" if hotels else 'N/A'
                }
            )
            return len(hotels) > 0
        else:
            print_result("Hotel Search Integration", False, result.get('error', 'Unknown error'))
            return False
            
    except Exception as e:
        print_result("Hotel Search Integration", False, f"Error: {str(e)}")
        return False

def main():
    """Run all validation tests"""
    print("\n" + "█"*70)
    print("█" + " "*68 + "█")
    print("█" + "  TravelRover API Integration Validation".center(68) + "█")
    print("█" + f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".center(68) + "█")
    print("█" + " "*68 + "█")
    print("█"*70)
    
    results = []
    
    # Run all tests
    results.append(("Environment Variables", test_environment_variables()))
    results.append(("SerpAPI Connection", test_serpapi_connection()))
    results.append(("Google Places API", test_google_places_api()))
    results.append(("Flight Search Integration", test_flight_search_integration()))
    results.append(("Hotel Search Integration", test_hotel_search_integration()))
    
    # Summary
    print_header("VALIDATION SUMMARY")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"\nTests Passed: {passed}/{total}")
    print("\nDetailed Results:")
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} | {test_name}")
    
    if passed == total:
        print("\n🎉 All tests passed! Your API integration is fully functional.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
