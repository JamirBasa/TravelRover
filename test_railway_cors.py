#!/usr/bin/env python3
"""
Test CORS configuration on Railway backend
Run locally: python test_railway_cors.py
"""

import subprocess
import json
import sys

RAILWAY_BACKEND = "https://travelrover-production-9217.up.railway.app"
FRONTEND_ORIGIN = "https://travel-rover-ph.vercel.app"

def test_cors():
    """Test CORS headers with OPTIONS preflight"""
    
    print("\n" + "="*70)
    print("🧪 Testing Railway CORS Configuration")
    print("="*70)
    
    # Test 1: Health check
    print("\n📍 Test 1: Health Check (GET)")
    result = subprocess.run([
        "curl", "-i", "-s",
        f"{RAILWAY_BACKEND}/api/langgraph/health/"
    ], capture_output=True, text=True)
    
    if "200" in result.stdout or "200" in result.stderr:
        print("✅ Health endpoint is accessible")
    else:
        print("❌ Health endpoint not responding")
        print(result.stdout[:500])
    
    # Test 2: OPTIONS preflight
    print("\n📍 Test 2: CORS Preflight (OPTIONS)")
    result = subprocess.run([
        "curl", "-i", "-X", "OPTIONS",
        "-H", f"Origin: {FRONTEND_ORIGIN}",
        "-H", "Access-Control-Request-Method: POST",
        "-H", "Content-Type: application/json",
        f"{RAILWAY_BACKEND}/api/langgraph/transport-mode/"
    ], capture_output=True, text=True)
    
    output = result.stdout + result.stderr
    
    if "Access-Control-Allow-Origin" in output:
        print("✅ CORS headers present")
        # Extract and display CORS headers
        for line in output.split('\n'):
            if 'Access-Control' in line:
                print(f"   {line.strip()}")
    else:
        print("❌ CORS headers MISSING")
        print(output[:1000])
    
    # Test 3: POST request
    print("\n📍 Test 3: Actual POST Request")
    result = subprocess.run([
        "curl", "-i", "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", f"Origin: {FRONTEND_ORIGIN}",
        "-d", json.dumps({
            "departure_city": "Manila",
            "destination": "Baguio",
            "include_flights": True
        }),
        f"{RAILWAY_BACKEND}/api/langgraph/transport-mode/"
    ], capture_output=True, text=True)
    
    output = result.stdout + result.stderr
    
    if "200" in output or "201" in output:
        print("✅ POST request successful")
    else:
        print("⚠️  POST request returned non-200 status (check output)")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    try:
        test_cors()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
