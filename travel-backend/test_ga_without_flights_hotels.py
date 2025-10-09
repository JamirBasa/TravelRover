"""
Test GA-First workflow WITHOUT flights/hotels enabled
This verifies that GA optimization runs even when user doesn't want flights/hotels
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/langgraph"

def test_ga_without_flights_hotels():
    """Test GA-First with flights and hotels DISABLED"""
    
    print("\n" + "=" * 70)
    print("🧬 TEST: GA-First WITHOUT Flights/Hotels")
    print("=" * 70)
    
    # Trip parameters with BOTH flights and hotels DISABLED
    trip_params = {
        "destination": "Manila, Philippines",
        "startDate": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "endDate": (datetime.now() + timedelta(days=33)).strftime("%Y-%m-%d"),
        "duration": 3,
        "travelers": 2,
        "budget": "moderate",
        "user_email": "test@travelrover.com",
        
        # ❌ FLIGHTS DISABLED
        "flightData": {
            "includeFlights": False
        },
        
        # ❌ HOTELS DISABLED
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
    print(f"   ✈️  Include Flights: {trip_params['flightData']['includeFlights']}")
    print(f"   🏨 Include Hotels: {trip_params['hotelData']['includeHotels']}")
    print(f"   🎯 Interests: {', '.join(trip_params['userProfile']['interests'])}")
    
    print("\n🚀 Sending request to LangGraph API...")
    print(f"   Endpoint: {BASE_URL}/execute/")
    print(f"   Expected: GA-First should STILL run (fetch activities + optimize)")
    
    try:
        response = requests.post(
            f"{BASE_URL}/execute/",
            json=trip_params,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"\n📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                print("\n✅ Request successful!")
                
                results = data.get("results", {})
                
                # Check if itinerary was generated
                if "itinerary_data" in results:
                    itinerary = results["itinerary_data"]
                    print("\n📅 GA-OPTIMIZED ITINERARY GENERATED:")
                    print("-" * 70)
                    
                    if isinstance(itinerary, list):
                        print(f"   Total Days: {len(itinerary)}")
                        for day in itinerary:
                            if isinstance(day, dict):
                                day_num = day.get('day', '?')
                                theme = day.get('theme', 'No theme')
                                activities = day.get('activities', [])
                                print(f"\n   📍 Day {day_num}: {theme}")
                                print(f"      Activities: {len(activities)}")
                                
                                # Show first 2 activities
                                for i, activity in enumerate(activities[:2], 1):
                                    if isinstance(activity, dict):
                                        name = activity.get('placeName', 'Unknown')
                                        price = activity.get('ticketPricing', 'N/A')
                                        print(f"      {i}. {name} - {price}")
                
                # Check optimization score
                if "optimization_score" in results:
                    score = results["optimization_score"]
                    print(f"\n🧬 Optimization Score: {score:.2f}/100")
                    
                    if score >= 70:
                        print("   ✅ Good optimization!")
                    else:
                        print("   ⚠️  Low optimization score")
                
                # Check total cost
                if "total_cost" in results:
                    cost = results["total_cost"]
                    print(f"\n💰 Total Estimated Cost: ₱{cost:,.2f}")
                
                # Verify workflow type
                if "workflow_type" in results:
                    workflow = results["workflow_type"]
                    print(f"\n🔄 Workflow Type: {workflow}")
                    
                    if workflow == "ga_first":
                        print("   ✅ GA-First workflow was used!")
                    else:
                        print(f"   ⚠️  Unexpected workflow: {workflow}")
                
                # Check if flights/hotels were skipped
                flights = results.get("flights", {})
                hotels = results.get("hotels", {})
                
                print(f"\n✈️  Flights:")
                if flights and flights.get("flights"):
                    print(f"   ⚠️  Flights were searched (unexpected!)")
                else:
                    print(f"   ✅ Flights correctly skipped")
                
                print(f"\n🏨 Hotels:")
                if hotels and hotels.get("hotels"):
                    print(f"   ⚠️  Hotels were searched (unexpected!)")
                else:
                    print(f"   ✅ Hotels correctly skipped")
                
                # Final verdict
                print("\n" + "=" * 70)
                print("📊 TEST RESULTS:")
                print("=" * 70)
                
                has_itinerary = "itinerary_data" in results
                has_optimization = "optimization_score" in results
                is_ga_first = results.get("workflow_type") == "ga_first"
                flights_skipped = not (flights and flights.get("flights"))
                hotels_skipped = not (hotels and hotels.get("hotels"))
                
                if all([has_itinerary, has_optimization, is_ga_first, flights_skipped, hotels_skipped]):
                    print("✅ PERFECT! GA-First runs WITHOUT flights/hotels!")
                    print("✅ Itinerary was GA-optimized")
                    print("✅ Flights/Hotels were correctly skipped")
                    print("✅ User gets optimized itinerary without extra costs")
                    return True
                else:
                    print("⚠️  PARTIAL SUCCESS:")
                    print(f"   Itinerary: {'✅' if has_itinerary else '❌'}")
                    print(f"   Optimization: {'✅' if has_optimization else '❌'}")
                    print(f"   GA-First: {'✅' if is_ga_first else '❌'}")
                    print(f"   Flights Skipped: {'✅' if flights_skipped else '❌'}")
                    print(f"   Hotels Skipped: {'✅' if hotels_skipped else '❌'}")
                    return False
            else:
                print(f"\n❌ Request failed!")
                print(f"   Error: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"\n❌ HTTP Error: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"\n⏱️  Request timeout!")
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


def main():
    """Run the test"""
    
    # Check if backend is running
    print("\n🏥 Checking backend health...")
    try:
        response = requests.get(f"{BASE_URL}/health/", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend is healthy")
        else:
            print("   ❌ Backend not healthy")
            print("\n⚠️  Please start Django server first:")
            print("   cd travel-backend")
            print("   python manage.py runserver")
            return
    except Exception:
        print("   ❌ Backend not reachable")
        print("\n⚠️  Please start Django server first:")
        print("   cd travel-backend")
        print("   python manage.py runserver")
        return
    
    # Run the test
    success = test_ga_without_flights_hotels()
    
    if success:
        print("\n" + "=" * 70)
        print("🎉 TEST PASSED!")
        print("=" * 70)
        print("\n✅ GA-First works perfectly without flights/hotels!")
        print("✅ Users get optimized itineraries even with basic settings!")
        print("✅ No unnecessary API costs for flights/hotels!")
    else:
        print("\n" + "=" * 70)
        print("❌ TEST FAILED")
        print("=" * 70)
        print("\n💡 Check Django logs for details")


if __name__ == "__main__":
    main()
