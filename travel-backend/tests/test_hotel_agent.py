#!/usr/bin/env python3
"""
Test script to debug hotel agent execution
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

from langgraph_agents.agents.hotel_agent import HotelAgent

async def test_hotel_agent():
    print("🧪 Testing Hotel Agent directly...")
    
    agent = HotelAgent("test-session-456")
    
    test_params = {
        'hotel_params': {
            'destination': 'Intramuros, Manila, Metro Manila, Philippines',
            'checkin_date': '2025-09-29',
            'checkout_date': '2025-10-10',
            'guests': 1,
            'duration': 11,
            'preferred_type': 'hotel',
            'budget_level': 3  # Luxury
        }
    }
    
    print(f"📤 Hotel agent params: {test_params}")
    
    try:
        result = await agent.execute(test_params)
        print(f"✅ Hotel agent result: {result}")
        return result
    except Exception as e:
        print(f"❌ Hotel agent failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = asyncio.run(test_hotel_agent())