#!/usr/bin/env python
"""
Verify CORS configuration is loaded correctly
Run: python manage.py shell < verify_cors.py
Or: python verify_cors.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from django.conf import settings

print("=" * 60)
print("CORS Configuration Verification")
print("=" * 60)
print(f"\n📍 DEBUG mode: {settings.DEBUG}")
print(f"📍 ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
print(f"\n✅ CORS_ALLOWED_ORIGINS:")
for origin in settings.CORS_ALLOWED_ORIGINS:
    print(f"   - {origin}")

print(f"\n✅ CORS_ALLOW_CREDENTIALS: {settings.CORS_ALLOW_CREDENTIALS}")
print(f"\n✅ Middleware (first 5):")
for i, middleware in enumerate(settings.MIDDLEWARE[:5], 1):
    print(f"   {i}. {middleware}")

print("\n" + "=" * 60)
if 'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE:
    print("✅ CorsMiddleware is properly configured")
else:
    print("❌ ERROR: CorsMiddleware not found in MIDDLEWARE!")

print("=" * 60)
