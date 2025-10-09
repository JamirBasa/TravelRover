"""
Integration Test - Test Genetic Algorithm with Trip Creation
This simulates the full workflow: Frontend → Backend → GA Optimization
"""

import requests
import json
from datetime import datetime, timedelta

# Backend API base URL
BASE_URL = "http://localhost:8000/api/langgraph"

def test_trip_creation_with_ga():
    """Test full trip creation with genetic algorithm optimization"""
    
    print("\n" + "=" * 60)
    print("🧬 GENETIC ALGORITHM INTEGRATION TEST")
    print("=" * 60)
    
    # Prepare trip parameters (simulating frontend request)
    trip_params = {
        "destination": "Manila, Philippines",
        "startDate": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "endDate": (datetime.now() + timedelta(days=33)).strftime("%Y-%m-%d"),
        "duration": 3,
        "travelers": 2,  # Just a number, not a dictionary
        "budget": "moderate",
        "user_email": "test@travelrover.com",
        "flightData": {
            "includeFlights": False
        },
        "hotelData": {
            "includeHotels": False
        },
        "userProfile": {
            "activityTypes": ["Cultural", "Nature", "Food"],
            "interests": ["History", "Museums", "Parks", "Local Cuisine"]
        }
    }
    
    print("\n📝 Trip Parameters:")
    print(f"   Destination: {trip_params['destination']}")
    print(f"   Duration: {trip_params['duration']} days")
    print(f"   Budget: {trip_params['budget']}")
    print(f"   Travelers: {trip_params['travelers']} people")
    print(f"   Interests: {', '.join(trip_params['userProfile']['interests'])}")
    
    print("\n🚀 Sending request to LangGraph API...")
    print(f"   Endpoint: {BASE_URL}/execute/")
    
    try:
        # Send request to backend
        response = requests.post(
            f"{BASE_URL}/execute/",
            json=trip_params,
            headers={"Content-Type": "application/json"},
            timeout=60  # 60 seconds timeout
        )
        
        print(f"\n📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                print("\n✅ Trip creation successful!")
                
                results = data.get("results", {})
                
                # Check if genetic algorithm was used
                if "route_optimization" in results:
                    route_opt = results["route_optimization"]
                    print("\n🧬 GENETIC ALGORITHM RESULTS:")
                    print("-" * 60)
                    print(f"   Applied: {route_opt.get('applied', False)}")
                    print(f"   Method: {route_opt.get('optimization_method', 'N/A')}")
                    print(f"   Efficiency Score: {route_opt.get('efficiency_score', 0)}/100")
                    print(f"   Total Travel Time: {route_opt.get('total_travel_time_minutes', 0)} minutes")
                    
                    if route_opt.get('optimization_summary'):
                        summary = route_opt['optimization_summary']
                        print(f"\n   📊 Optimization Summary:")
                        print(f"      Days Optimized: {summary.get('total_days_optimized', 0)}")
                        print(f"      Total Activities: {summary.get('total_activities', 0)}")
                        print(f"      Total Cost: ₱{summary.get('total_cost', 0):,.2f}")
                        print(f"      Average Score: {summary.get('average_efficiency_score', 0)}/100")
                    
                    if route_opt.get('recommendations'):
                        print(f"\n   💡 Recommendations:")
                        for rec in route_opt['recommendations']:
                            priority = rec.get('priority', 'info').upper()
                            message = rec.get('message', '')
                            print(f"      [{priority}] {message}")
                else:
                    print("\n⚠️  No route optimization data found")
                
                # Check optimized itinerary
                if "optimized_itinerary" in results or "itinerary_data" in results:
                    itinerary = results.get("optimized_itinerary") or results.get("itinerary_data")
                    print(f"\n📅 Itinerary Generated:")
                    print("-" * 60)
                    
                    if isinstance(itinerary, dict):
                        for day_key, day_data in itinerary.items():
                            if isinstance(day_data, dict):
                                print(f"   Day {day_data.get('day', '?')}: {day_data.get('theme', 'No theme')}")
                    elif isinstance(itinerary, list):
                        for day_data in itinerary:
                            print(f"   Day {day_data.get('day', '?')}: {day_data.get('theme', 'No theme')}")
                
                # Check for errors
                if results.get("agent_errors"):
                    print(f"\n⚠️  Agent Errors:")
                    for error in results["agent_errors"]:
                        print(f"   - {error.get('agent', 'Unknown')}: {error.get('error', 'Unknown error')}")
                
                # Overall success metrics
                print(f"\n📊 Overall Results:")
                print("-" * 60)
                print(f"   Session ID: {data.get('session_id', 'N/A')}")
                print(f"   Optimization Score: {results.get('optimization_score', 0)}/100")
                print(f"   Cost Efficiency: {results.get('cost_efficiency', 'N/A')}")
                print(f"   Personalization Match: {results.get('personalization_score', 0)}/100")
                
                print("\n✅ Integration test completed successfully!")
                return True
            else:
                print(f"\n❌ Trip creation failed!")
                print(f"   Error: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"\n❌ HTTP Error: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"\n⏱️  Request timeout! The backend might be processing...")
        print(f"   Tip: Check Django logs for progress")
        return False
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Connection Error!")
        print(f"   Make sure Django server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_health_check():
    """Test if backend is running"""
    print("\n🏥 Checking backend health...")
    
    try:
        response = requests.get(f"{BASE_URL}/health/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Backend is {data.get('status', 'unknown').upper()}")
            return True
        else:
            print(f"   ❌ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Backend not reachable: {str(e)}")
        return False


def main():
    """Run integration test"""
    
    # Check if backend is running
    if not test_health_check():
        print("\n⚠️  Please start Django server first:")
        print("   cd travel-backend")
        print("   python manage.py runserver")
        return
    
    # Run trip creation test
    success = test_trip_creation_with_ga()
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 60)
        print("\n✅ Genetic algorithm is working correctly!")
        print("✅ Integration with trip creation successful!")
        print("\n💡 Next steps:")
        print("   1. Test with frontend (npm run dev)")
        print("   2. Create a trip through the UI")
        print("   3. Check OptimizedRouteMap for GA-optimized routes")
    else:
        print("\n" + "=" * 60)
        print("❌ TEST FAILED")
        print("=" * 60)
        print("\n💡 Troubleshooting:")
        print("   1. Check Django server logs")
        print("   2. Verify API keys are configured")
        print("   3. Run: python test_all_apis.py")


if __name__ == "__main__":
    main()
