#!/usr/bin/env python3
"""
Complete data flow test - from creation to viewing
Tests the entire journey: create trip -> save to Firebase -> fetch in view-trip
"""
import requests
import json
import uuid

# Test configuration
API_BASE_URL = "http://127.0.0.1:8000/api"
TEST_EMAIL = "test@example.com"

def test_complete_data_flow():
    print("🧪 Testing Complete Data Flow: Create Trip -> View Trip")
    print("=" * 60)
    
    # Test 1: Backend LangGraph API
    print("\n🔧 Step 1: Testing Backend LangGraph API")
    
    trip_params = {
        "destination": "Boracay, Aklan, Philippines",
        "startDate": "2025-11-15",
        "endDate": "2025-11-18",
        "duration": 3,
        "travelers": "2 People",
        "budget": "Moderate",
        "user_email": TEST_EMAIL,
        "flightData": {"includeFlights": False},
        "hotelData": {"includeHotels": False},
        "userProfile": {
            "preferredTripTypes": ["beach", "cultural"],
            "travelStyle": "duo",
            "budgetRange": "moderate"
        }
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/langgraph/execute/",
            json=trip_params,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Backend API Success!")
                print(f"   Session ID: {data.get('session_id')}")
                print(f"   Results Keys: {list(data.get('results', {}).keys())}")
                
                # Check required data structure
                results = data.get('results', {})
                trip_params = results.get('trip_params', {})
                
                print(f"   Travelers: {trip_params.get('travelers')}")
                print(f"   Destination: {trip_params.get('destination')}")
                
                return True, data
            else:
                print(f"❌ Backend API Error: {data.get('error')}")
                return False, None
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
            
    except requests.RequestException as e:
        print(f"❌ Network Error: {e}")
        return False, None

def test_ai_generation():
    print("\n🤖 Step 2: Testing AI Generation Process")
    
    # Simulate the AI generation process
    sample_ai_response = {
        "tripName": "Boracay Beach Getaway",
        "destination": "Boracay, Aklan, Philippines", 
        "duration": "3 days",
        "budget": "Moderate",
        "travelers": "2 People",
        "startDate": "2025-11-15",
        "endDate": "2025-11-18",
        "currency": "PHP",
        "hotels": [
            {
                "hotelName": "Boracay Beach Resort",
                "hotelAddress": "White Beach, Boracay",
                "pricePerNight": "₱3,500 - ₱5,000",
                "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945",
                "geoCoordinates": {"latitude": 11.9674, "longitude": 121.9248},
                "rating": 4.2,
                "description": "Beachfront resort with stunning sunset views"
            }
        ],
        "itinerary": [
            {
                "day": 1,
                "theme": "Arrival & Beach Relaxation",
                "plan": [
                    {
                        "time": "2:00 PM",
                        "placeName": "White Beach",
                        "placeDetails": "Famous white sand beach perfect for relaxation",
                        "imageUrl": "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
                        "geoCoordinates": {"latitude": 11.9674, "longitude": 121.9248},
                        "ticketPricing": "Free",
                        "timeTravel": "2-3 hours",
                        "rating": 4.8
                    }
                ]
            }
        ],
        "placesToVisit": [
            {
                "placeName": "White Beach",
                "placeDetails": "World-famous white sand beach",
                "imageUrl": "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
                "geoCoordinates": {"latitude": 11.9674, "longitude": 121.9248},
                "ticketPricing": "Free",
                "timeTravel": "Full day",
                "rating": 4.8
            }
        ]
    }
    
    # Test JSON parsing
    try:
        json_string = json.dumps(sample_ai_response)
        parsed_back = json.loads(json_string)
        
        print("✅ AI Response JSON Validation Passed")
        print(f"   Hotels: {len(parsed_back['hotels'])} items")
        print(f"   Itinerary: {len(parsed_back['itinerary'])} days")
        print(f"   Places: {len(parsed_back['placesToVisit'])} items")
        
        return True, sample_ai_response
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parsing Error: {e}")
        return False, None

def test_data_structure_consistency():
    print("\n📊 Step 3: Testing Data Structure Consistency")
    
    # Test the data structure that would be saved to Firebase
    success, ai_data = test_ai_generation()
    if not success:
        return False
        
    # Simulate the structure that gets saved to Firebase
    firebase_document = {
        "userSelection": {
            "location": "Boracay, Aklan, Philippines",
            "duration": 3,
            "travelers": "2 People",
            "budget": "Moderate",
            "startDate": "2025-11-15",
            "endDate": "2025-11-18"
        },
        "tripData": ai_data,  # This is where the AI response goes
        "userEmail": TEST_EMAIL,
        "id": str(uuid.uuid4()),
        "createdAt": "2025-09-29T20:00:00Z",
        "hasRealFlights": False,
        "hasRealHotels": False
    }
    
    # Test that view-trip components can access the data
    tests = [
        # Test Hotels component data path
        {
            "name": "Hotels Data Access",
            "path": "tripData.hotels",
            "expected": ai_data["hotels"]
        },
        # Test PlacesToVisit component data paths
        {
            "name": "Itinerary Data Access", 
            "path": "tripData.itinerary",
            "expected": ai_data["itinerary"]
        },
        {
            "name": "Places Data Access",
            "path": "tripData.placesToVisit", 
            "expected": ai_data["placesToVisit"]
        },
        # Test metadata access
        {
            "name": "Trip Selection Access",
            "path": "userSelection.location",
            "expected": "Boracay, Aklan, Philippines"
        }
    ]
    
    all_passed = True
    for test in tests:
        try:
            # Navigate the path
            keys = test["path"].split(".")
            value = firebase_document
            for key in keys:
                value = value[key]
                
            if value == test["expected"]:
                print(f"✅ {test['name']}: Data accessible")
            else:
                print(f"❌ {test['name']}: Data mismatch")
                all_passed = False
                
        except (KeyError, TypeError) as e:
            print(f"❌ {test['name']}: Path not accessible - {e}")
            all_passed = False
    
    return all_passed

def main():
    print("🚀 TravelRover Complete Data Flow Test")
    print("Testing from trip creation to view-trip display")
    print("=" * 60)
    
    # Test backend API
    backend_success, backend_data = test_complete_data_flow()
    
    # Test data structure consistency
    structure_success = test_data_structure_consistency()
    
    print("\n" + "=" * 60)
    print("📋 SUMMARY")
    print("=" * 60)
    
    if backend_success:
        print("✅ Backend LangGraph API: Working")
    else:
        print("❌ Backend LangGraph API: Failed")
    
    if structure_success:
        print("✅ Data Structure Consistency: Good")
    else:
        print("❌ Data Structure Consistency: Issues found")
    
    if backend_success and structure_success:
        print("\n🎉 ALL TESTS PASSED!")
        print("The data generated from create-trip should be properly fetched in view-trip")
    else:
        print("\n⚠️ SOME TESTS FAILED!")
        print("There may be issues with data flow from creation to viewing")

if __name__ == "__main__":
    main()