"""
Test script for Gemini Proxy Configuration
Verifies backend setup is correct
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
import django
django.setup()

from django.conf import settings
import json


def test_configuration():
    """Test basic configuration"""
    print("=" * 60)
    print("🔧 GEMINI PROXY CONFIGURATION TEST")
    print("=" * 60)
    
    results = {
        "passed": [],
        "failed": [],
        "warnings": []
    }
    
    # Test 1: Check API Key
    print("\n1️⃣  Testing API Key Configuration...")
    try:
        api_key = getattr(settings, 'GOOGLE_GEMINI_AI_API_KEY', None)
        gemini_key = getattr(settings, 'GEMINI_API_KEY', None)
        
        if api_key and gemini_key:
            print(f"   ✅ GOOGLE_GEMINI_AI_API_KEY: {api_key[:10]}...{api_key[-10:]}")
            print(f"   ✅ GEMINI_API_KEY (alias): {gemini_key[:10]}...{gemini_key[-10:]}")
            if api_key == gemini_key:
                print("   ✅ Alias configured correctly")
                results["passed"].append("API Key Configuration")
            else:
                print("   ⚠️  Alias doesn't match main key")
                results["warnings"].append("API Key alias mismatch")
        else:
            print("   ❌ API keys not configured")
            results["failed"].append("API Key Configuration")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        results["failed"].append("API Key Configuration")
    
    # Test 2: Check google-generativeai package
    print("\n2️⃣  Testing google-generativeai Package...")
    try:
        import google.generativeai as genai
        print(f"   ✅ Package imported successfully")
        print(f"   ✅ Version: {genai.__version__}")
        results["passed"].append("google-generativeai Package")
    except ImportError as e:
        print(f"   ❌ Package not installed: {e}")
        results["failed"].append("google-generativeai Package")
    
    # Test 3: Check views exist
    print("\n3️⃣  Testing View Functions...")
    try:
        from langgraph_agents.views_gemini_proxy import gemini_generate, gemini_health
        print("   ✅ gemini_generate function imported")
        print("   ✅ gemini_health function imported")
        results["passed"].append("View Functions")
    except ImportError as e:
        print(f"   ❌ Views not found: {e}")
        results["failed"].append("View Functions")
    
    # Test 4: Check URL routing
    print("\n4️⃣  Testing URL Configuration...")
    try:
        from django.urls import resolve
        from django.urls.exceptions import Resolver404
        
        try:
            gemini_generate_match = resolve('/api/langgraph/gemini/generate/')
            print(f"   ✅ /api/langgraph/gemini/generate/ → {gemini_generate_match.func.__name__}")
        except Resolver404:
            print("   ❌ /api/langgraph/gemini/generate/ not found")
            results["failed"].append("URL: gemini/generate/")
        
        try:
            gemini_health_match = resolve('/api/langgraph/gemini/health/')
            print(f"   ✅ /api/langgraph/gemini/health/ → {gemini_health_match.func.__name__}")
        except Resolver404:
            print("   ❌ /api/langgraph/gemini/health/ not found")
            results["failed"].append("URL: gemini/health/")
        
        if len([f for f in results["failed"] if "URL:" in f]) == 0:
            results["passed"].append("URL Routing")
    except Exception as e:
        print(f"   ❌ Error checking URLs: {e}")
        results["failed"].append("URL Routing")
    
    # Test 5: Test Gemini API connection (if configured)
    print("\n5️⃣  Testing Gemini API Connection...")
    try:
        import google.generativeai as genai
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Simple test prompt
            response = model.generate_content("Say 'OK' if you can read this")
            
            if response and response.text:
                print(f"   ✅ API connection successful")
                print(f"   ✅ Response: {response.text[:50]}...")
                results["passed"].append("API Connection")
            else:
                print("   ⚠️  Got response but no text")
                results["warnings"].append("API Connection (empty response)")
        else:
            print("   ⚠️  API key not configured, skipping connection test")
            results["warnings"].append("API Connection (skipped)")
    except Exception as e:
        print(f"   ❌ API connection failed: {e}")
        results["failed"].append("API Connection")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    print(f"\n✅ Passed: {len(results['passed'])}")
    for test in results["passed"]:
        print(f"   • {test}")
    
    if results["warnings"]:
        print(f"\n⚠️  Warnings: {len(results['warnings'])}")
        for test in results["warnings"]:
            print(f"   • {test}")
    
    if results["failed"]:
        print(f"\n❌ Failed: {len(results['failed'])}")
        for test in results["failed"]:
            print(f"   • {test}")
    
    # Overall result
    print("\n" + "=" * 60)
    if len(results["failed"]) == 0:
        print("🎉 ALL CRITICAL TESTS PASSED")
        print("✅ Gemini Proxy is properly configured")
        if results["warnings"]:
            print(f"⚠️  {len(results['warnings'])} warning(s) - review recommended")
    else:
        print("❌ CONFIGURATION INCOMPLETE")
        print(f"Fix {len(results['failed'])} failed test(s) before proceeding")
    print("=" * 60)
    
    return len(results["failed"]) == 0


if __name__ == "__main__":
    try:
        success = test_configuration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
