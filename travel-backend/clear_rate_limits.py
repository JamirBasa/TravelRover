#!/usr/bin/env python
"""
Clear rate limit cache to reset throttling
Run this to immediately reset all rate limits
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from django.core.cache import cache

def clear_rate_limits():
    """Clear all rate limit keys from cache"""
    print("🗑️  Clearing rate limit cache...")
    
    # Get all keys
    try:
        # Try to get all keys (works with dummy cache, memcached, redis)
        keys = cache.keys('*throttle*')
        if keys:
            cache.delete_many(keys)
            print(f"✅ Cleared {len(keys)} throttle keys")
        else:
            # If keys() not supported, clear entire cache
            cache.clear()
            print("✅ Cleared entire cache (keys() not supported by backend)")
    except AttributeError:
        # Some cache backends don't support keys()
        cache.clear()
        print("✅ Cleared entire cache")
    
    print("🎉 Rate limits reset! You can now make new requests.")

if __name__ == '__main__':
    clear_rate_limits()
