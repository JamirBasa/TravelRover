#!/usr/bin/env python3
"""
Test script to debug flight agent execution
"""
import os
import sys
import django
import asyncio

# Add project to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from langgraph_agents.agents.flight_agent import FlightAgent

async def test_flight_agent():
    print("🧪 Testing Flight Agent directly...")
    
    agent = FlightAgent("test-session-123")
    
    test_params = {
        'flight_params': {
            'from_airport': 'ZAM',
            'to_airport': 'MNL', 
            'departure_date': '2025-09-29',
            'return_date': '2025-10-10',
            'adults': 1,
            'trip_type': 'round-trip'
        }
    }
    
    print(f"📤 Flight agent params: {test_params}")
    
    try:
        result = await agent.execute(test_params)
        print(f"✅ Flight agent result: {result}")
        return result
    except Exception as e:
        print(f"❌ Flight agent failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = asyncio.run(test_flight_agent())