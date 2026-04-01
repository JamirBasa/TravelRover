#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from django.conf import settings

print("=" * 70)
print("FIREBASE CONFIGURATION CHECK")
print("=" * 70)

firebase_keys = [
    'FIREBASE_API_KEY',
    'FIREBASE_PROJECT_ID', 
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_STORAGE_BUCKET'
]

configured = []
missing = []

for key in firebase_keys:
    value = getattr(settings, key, None)
    if value:
        configured.append(key)
        masked = value[:15] + '...' + value[-5:] if len(value) > 25 else value
        print(f"✅ {key}: {masked}")
    else:
        missing.append(key)
        print(f"❌ {key}: NOT SET")

print("\n" + "=" * 70)
print(f"Status: {len(configured)}/{len(firebase_keys)} configured")
print("=" * 70)

if missing:
    print(f"\n⚠️  Missing keys: {', '.join(missing)}")
    print("\nAdd to Railway Variables:")
    for key in missing:
        print(f"  {key}=<value>")
else:
    print("\n✅ All Firebase keys are configured!")
