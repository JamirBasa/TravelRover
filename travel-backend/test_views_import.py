#!/usr/bin/env python
"""Test views module for errors"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

print("Testing views module import...")

try:
    from langgraph_agents import views
    print("✅ Views module imported")
    
    # Test each view
    print(f"✅ LangGraphTravelPlannerView exists")
    print(f"✅ LangGraphSessionStatusView exists")
    print(f"✅ TransportModeAnalysisView exists")
    print(f"✅ LangGraphHealthCheckView exists")
    
    # Try instantiating health check
    health_view = views.LangGraphHealthCheckView()
    print("✅ LangGraphHealthCheckView instantiated")
    
    # Check the get method exists
    assert hasattr(health_view, 'get'), "get method not found"
    print("✅ get method exists")
    
    print("\n✅ All checks passed!")
    
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
