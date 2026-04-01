#!/usr/bin/env python
"""Test all view module imports"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

modules_to_test = [
    ('views', '.views'),
    ('views_health', '.views_health'),
    ('views_photo_proxy', '.views_photo_proxy'),
    ('views_places_proxy', '.views_places_proxy'),
    ('views_geocoding_proxy', '.views_geocoding_proxy'),
    ('views_gemini_proxy', '.views_gemini_proxy'),
    ('views_longcat', '.views_longcat'),
]

print("Testing all view module imports...\n")

for name, module_path in modules_to_test:
    try:
        exec(f"from langgraph_agents{module_path} import *")
        print(f"✅ {name}")
    except Exception as e:
        print(f"❌ {name}: {type(e).__name__}: {str(e)[:100]}")
        import traceback
        traceback.print_exc()
        
print("\nTesting URL configuration...")
try:
    from langgraph_agents import urls
    print(f"✅ URL configuration loaded")
    print(f"   URL patterns: {len(urls.urlpatterns)}")
except Exception as e:
    print(f"❌ URL configuration failed: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
