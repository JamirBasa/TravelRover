#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

import requests
import json

print("=" * 70)
print("TESTING LANGGRAPH /EXECUTE/ ENDPOINT")
print("=" * 70)

# Test data
test_payload = {
    "userEmail": "test@example.com",
    "tripParams": {
        "destination": "Baguio",
        "departureCity": "Manila",
        "days": 3,
        "travelers": 1,
        "budget": 10000,
        "departureDate": "2026-04-15",
        "travelersInfo": [{"name": "Test User"}]
    }
}

# Try to call the endpoint locally
try:
    from django.test import Client
    
    client = Client()
    
    # Make POST request to /api/langgraph/execute/
    response = client.post(
        '/api/langgraph/execute/',
        data=json.dumps(test_payload),
        content_type='application/json'
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Time: {response.get('X-Response-Time', 'N/A')}")
    
    try:
        data = json.loads(response.content)
        print(f"\nResponse Data:")
        print(json.dumps(data, indent=2)[:500])
    except:
        print(f"\nResponse Content:")
        print(response.content.decode()[:500])
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
