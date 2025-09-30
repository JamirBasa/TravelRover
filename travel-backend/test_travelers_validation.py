#!/usr/bin/env python3
"""
Test script to verify travelers validation fix
"""

import requests
import json

def test_travelers_validation():
    """Test the API with different travelers formats"""
    
    api_url = "http://127.0.0.1:8000/api/langgraph/execute/"
    
    test_cases = [
        {
            "name": "String format: '2 People'",
            "data": {
                "destination": "Manila, Philippines",
                "startDate": "2024-01-15",
                "endDate": "2024-01-17",
                "duration": 3,
                "travelers": "2 People",
                "budget": "Moderate",
                "user_email": "test@example.com",
                "flightData": {"includeFlights": False},
                "hotelData": {"includeHotels": False},
                "userProfile": {}
            }
        },
        {
            "name": "String format: '3 to 5 People'", 
            "data": {
                "destination": "Manila, Philippines",
                "startDate": "2024-01-15", 
                "endDate": "2024-01-17",
                "duration": 3,
                "travelers": "3 to 5 People",
                "budget": "Moderate",
                "user_email": "test@example.com",
                "flightData": {"includeFlights": False},
                "hotelData": {"includeHotels": False}, 
                "userProfile": {}
            }
        },
        {
            "name": "Numeric format: 4",
            "data": {
                "destination": "Manila, Philippines",
                "startDate": "2024-01-15",
                "endDate": "2024-01-17", 
                "duration": 3,
                "travelers": 4,
                "budget": "Moderate",
                "user_email": "test@example.com",
                "flightData": {"includeFlights": False},
                "hotelData": {"includeHotels": False},
                "userProfile": {}
            }
        }
    ]
    
    print("🧪 Testing travelers validation with different formats...")
    print("=" * 60)
    
    for test_case in test_cases:
        print(f"\n🔍 Testing: {test_case['name']}")
        
        try:
            response = requests.post(
                api_url, 
                json=test_case['data'],
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"✅ SUCCESS: {test_case['name']}")
                    print(f"   Session ID: {result.get('session_id')}")
                    travelers = result.get('results', {}).get('trip_params', {}).get('travelers')
                    print(f"   Parsed travelers: {travelers}")
                else:
                    print(f"❌ FAILED: {result.get('error', 'Unknown error')}")
            else:
                print(f"❌ HTTP ERROR: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                    
        except requests.exceptions.ConnectionError:
            print("❌ CONNECTION ERROR: Django backend not running on http://127.0.0.1:8000/")
            break
        except Exception as e:
            print(f"❌ UNEXPECTED ERROR: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🏁 Testing completed!")

if __name__ == "__main__":
    test_travelers_validation()