#!/usr/bin/env python
"""Check Django settings on Railway-like environment"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')

# Instead of django.setup(), let's load settings
from django.conf import settings

print("Django Settings Check:\n")

# Critical settings
settings_to_check = [ 'DEBUG',
    'SECRET_KEY',
    'ALLOWED_HOSTS',
    'DATABASE_URL',
    'DATABASES',
    'INSTALLED_APPS',
    'MIDDLEWARE',
]

for setting in settings_to_check:
    try:
        value = getattr(settings, setting)
        if setting == 'SECRET_KEY':
            print(f"✅ {setting}: [redacted]")
        elif setting == 'DATABASES':
            print(f"✅ {setting}: {list(value.keys())}")
        elif isinstance(value, list) and len(value) > 3:
            print(f"✅ {setting}: {len(value)} items")
        else:
            print(f"✅ {setting}: {str(value)[:80]}")
    except Exception as e:
        print(f"❌ {setting}: {type(e).__name__}: {str(e)[:80]}")

print("\n\nEnvironment Variables:\n")
for key in ['DEBUG', 'DATABASE_URL', 'ALLOWED_HOSTS', 'CORS_ALLOWED_ORIGINS', 'SECRET_KEY']:
    value = os.environ.get(key, '[NOT SET]')
    if key == 'SECRET_KEY':
        print(f"  {key}: [redacted]")
    else:
        print(f"  {key}: {value[:60] if value != '[NOT SET]' else value}")

print("\nNow testing django.setup()...")
try:
    django.setup()
    print("✅ django.setup() successful")
except Exception as e:
    print(f"❌ django.setup() failed: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
