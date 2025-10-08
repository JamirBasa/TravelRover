#!/usr/bin/env python3

import requests
import json

# Test the LangGraph API endpoint
url = "http://localhost:8000/api/langgraph/execute/"

test_data = {
    "user_email": "test@example.com",
    "destination": "Manila, Philippines", 
    "travelers": "1",
    "budget": "luxury",
    "startDate": "2025-09-29",
    "endDate": "2025-10-10",
    "duration": 11
}

try:
    print("🧪 Testing LangGraph API endpoint...")
    print(f"📤 Sending data: {json.dumps(test_data, indent=2)}")
    
    response = requests.post(url, json=test_data, timeout=30)
    
    print(f"📊 Status Code: {response.status_code}")
    print(f"📋 Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("✅ Success!")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
    else:
        print("❌ Error!")
        print(f"📄 Response text: {response.text}")
        
except requests.exceptions.RequestException as e:
    print(f"🔥 Request failed: {e}")
except Exception as e:
    print(f"💥 Unexpected error: {e}")