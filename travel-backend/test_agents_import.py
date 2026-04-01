#!/usr/bin/env python
"""Test agent module imports"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

print("Testing agent module imports...\n")

agents = [
    ('BaseAgent', 'from langgraph_agents.agents.base_agent import BaseAgent'),
    ('FlightAgent', 'from langgraph_agents.agents.flight_agent import FlightAgent'),
    ('HotelAgent', 'from langgraph_agents.agents.hotel_agent import HotelAgent'),
    ('RouteOptimizerAgent', 'from langgraph_agents.agents.route_optimizer_agent import RouteOptimizerAgent'),
    ('TransportModeAgent', 'from langgraph_agents.agents.transport_mode_agent import TransportModeAgent'),
    ('CoordinatorAgent', 'from langgraph_agents.agents.coordinator import CoordinatorAgent'),
]

for name, import_stmt in agents:
    try:
        exec(import_stmt)
        print(f"✅ {name}")
    except Exception as e:
        print(f"❌ {name}: {type(e).__name__}")
        print(f"   {str(e)[:150]}")
        import traceback
        traceback.print_exc()
        
print("\n✅ All agents imported successfully!")
