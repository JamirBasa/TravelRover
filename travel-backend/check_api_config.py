"""
Quick API Configuration Checker
Verifies that backend APIs are properly configured
"""

import os
from pathlib import Path

def check_env_file():
    """Check if .env file exists and has required keys"""
    env_path = Path(__file__).parent / '.env'
    
    if not env_path.exists():
        print("❌ .env file not found!")
        print("   Create .env file in travel-backend/ directory")
        return False
    
    print("✅ .env file found")
    
    # Read .env file
    with open(env_path, 'r') as f:
        env_content = f.read()
    
    # ✅ Check for multiple possible key names (backend uses different naming)
    required_keys = [
        (['SERP_API_KEY', 'SERPAPI_KEY'], 'SerpAPI (Flight Search)'),
        (['GOOGLE_PLACES_API_KEY'], 'Google Places (Hotel Search)'),
        (['GEMINI_API_KEY', 'GOOGLE_GEMINI_AI_API_KEY'], 'Google Gemini (AI Generation)'),
    ]
    
    all_present = True
    for key_variants, name in required_keys:
        found = False
        for key in key_variants:
            if key in env_content:
                # Check if key has a value (not just key=)
                for line in env_content.split('\n'):
                    if line.startswith(key):
                        value = line.split('=', 1)[1].strip() if '=' in line else ''
                        if value and value != 'your_key_here':
                            print(f"✅ {name}: Configured ({key})")
                            found = True
                            break
                        else:
                            print(f"⚠️  {name}: Key present but empty/placeholder ({key})")
                            all_present = False
                            found = True
                            break
                if found:
                    break
        
        if not found:
            print(f"❌ {name}: Missing (expected: {' or '.join(key_variants)})")
            all_present = False
    
    return all_present

def check_django_running():
    """Check if Django server is accessible"""
    import urllib.request
    
    try:
        response = urllib.request.urlopen('http://localhost:8000/api/langgraph/health/', timeout=5)
        if response.status == 200:
            print("✅ Django backend is running")
            return True
    except Exception as e:
        print(f"❌ Django backend not accessible: {e}")
        print("   Run: python manage.py runserver")
        return False

def main():
    print("=" * 60)
    print("TRAVELROVER API CONFIGURATION CHECKER")
    print("=" * 60)
    print()
    
    print("📋 Checking Environment Variables...")
    env_ok = check_env_file()
    print()
    
    print("🌐 Checking Django Backend...")
    django_ok = check_django_running()
    print()
    
    print("=" * 60)
    if env_ok and django_ok:
        print("✅ ALL CHECKS PASSED - Backend is ready!")
        print()
        print("Next steps:")
        print("1. Create a trip with flights enabled")
        print("2. Create a trip with hotels enabled")
        print("3. Check that flight/hotel data appears in trip")
    else:
        print("⚠️  SOME CHECKS FAILED - Fix issues above")
        print()
        print("Quick fixes:")
        if not env_ok:
            print("1. Copy .env.example to .env")
            print("2. Add your API keys to .env")
            print("3. Get keys from:")
            print("   - SerpAPI: https://serpapi.com/")
            print("   - Google Places: https://console.cloud.google.com/")
            print("   - Gemini: https://makersuite.google.com/app/apikey")
        if not django_ok:
            print("4. Start Django: python manage.py runserver")
    print("=" * 60)

if __name__ == "__main__":
    main()
