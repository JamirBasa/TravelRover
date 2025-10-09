#!/usr/bin/env python3
"""
Environment detection script for TravelRover API keys
Following TravelRover's architecture patterns and Django configuration
"""
import os
import sys
import django
from pathlib import Path

# Add project to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')

try:
    django.setup()
    from django.conf import settings
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    print("💡 Make sure you're in the travel-backend directory and Django is installed")
    sys.exit(1)

def check_api_keys():
    """
    Check all API keys configured in TravelRover Django settings
    Following TravelRover's multi-agent architecture requirements
    """
    
    print("🔍 TravelRover API Key Detection (Django Backend)")
    print("=" * 60)
    print("Checking API keys for LangGraph Multi-Agent System")
    
    # API keys required for TravelRover's services
    api_keys_config = [
        # Backend API Keys (used by LangGraph agents)
        {
            'setting_name': 'SERPAPI_KEY',
            'env_name': 'SERPAPI_KEY',
            'display_name': 'SerpAPI (Flight Search Agent)',
            'service': 'Flight search via Google Flights',
            'required': True
        },
        {
            'setting_name': 'GOOGLE_PLACES_API_KEY', 
            'env_name': 'GOOGLE_PLACES_API_KEY',
            'display_name': 'Google Places API (Hotel Agent)',
            'service': 'Hotel search and location data',
            'required': True
        },
        {
            'setting_name': 'GOOGLE_GEMINI_AI_API_KEY',
            'env_name': 'GOOGLE_GEMINI_AI_API_KEY',
            'display_name': 'Google Gemini AI (AI Generation)',
            'service': 'AI itinerary generation',
            'required': True
        },
        
        # Firebase Configuration (used by admin monitoring)
        {
            'setting_name': 'FIREBASE_PROJECT_ID',
            'env_name': 'FIREBASE_PROJECT_ID',
            'display_name': 'Firebase Project ID',
            'service': 'User authentication and trip storage',
            'required': False
        },
        {
            'setting_name': 'FIREBASE_API_KEY',
            'env_name': 'FIREBASE_API_KEY',
            'display_name': 'Firebase API Key', 
            'service': 'Firebase SDK configuration',
            'required': False
        },
        {
            'setting_name': 'FIREBASE_AUTH_DOMAIN',
            'env_name': 'FIREBASE_AUTH_DOMAIN',
            'display_name': 'Firebase Auth Domain',
            'service': 'User authentication domain',
            'required': False
        },
    ]
    
    print(f"\n📡 Checking {len(api_keys_config)} API configurations:")
    print("-" * 60)
    
    all_required_configured = True
    configured_count = 0
    
    for config in api_keys_config:
        setting_name = config['setting_name']
        env_name = config['env_name']
        display_name = config['display_name']
        service = config['service']
        required = config['required']
        
        # Get value from Django settings
        django_value = getattr(settings, setting_name, '')
        
        # Get value from environment
        env_value = os.getenv(env_name, '')
        
        # Use Django settings value, fallback to env
        value = django_value or env_value
        
        if value and len(value.strip()) > 5:  # Valid key should be longer than 5 chars
            status = "✅ Configured"
            configured_count += 1
            key_length = len(value)
            masked_key = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
        else:
            status = "❌ Not configured" if required else "⚠️ Optional - Not configured"
            if required:
                all_required_configured = False
            key_length = 0
            masked_key = "Not set"
        
        # Status indicators
        required_indicator = "🔴 Required" if required else "🔵 Optional"
        
        print(f"  {status}")
        print(f"    📝 {display_name}")
        print(f"    🎯 Service: {service}")
        print(f"    🔑 Django Settings: {'✅' if django_value else '❌'} (Length: {len(django_value)})")
        print(f"    🌍 Environment: {'✅' if env_value else '❌'} (Length: {len(env_value)})")
        print(f"    📋 Status: {required_indicator}")
        print()
    
    # Summary
    print("=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    required_keys = len([c for c in api_keys_config if c['required']])
    optional_keys = len([c for c in api_keys_config if not c['required']])
    
    print(f"✅ Configured: {configured_count}/{len(api_keys_config)} total")
    print(f"🔴 Required keys: {required_keys} total")
    print(f"🔵 Optional keys: {optional_keys} total")
    
    if all_required_configured:
        print(f"\n🎉 ALL REQUIRED API KEYS CONFIGURED!")
        print("TravelRover's API Key Monitoring System should now show all services as active.")
        print("\n🚀 Next Steps:")
        print("  1. Restart Django server: python manage.py runserver")
        print("  2. Start React frontend: npm run dev")
        print("  3. Check API Key Monitoring in admin panel")
    else:
        print(f"\n⚠️  MISSING REQUIRED API KEYS!")
        print("API Key Monitoring will show services as 'Not Configured'.")
        print("\n💡 Setup Instructions:")
        print("  1. Copy missing API keys to travel-backend/.env")
        print("  2. Add to travel-backend/.env file:")
        
        for config in api_keys_config:
            if config['required']:
                django_value = getattr(settings, config['setting_name'], '')
                env_value = os.getenv(config['env_name'], '')
                if not (django_value or env_value):
                    print(f"     {config['env_name']}=your_actual_key_here")
        
        print("  3. Restart Django server after adding keys")
    
    return all_required_configured

def main():
    """Main execution function following TravelRover patterns"""
    
    print("🌍 TravelRover API Key Environment Checker")
    print("Following TravelRover's LangGraph Multi-Agent Architecture")
    
    try:
        # Check API keys in Django settings
        all_configured = check_api_keys()
        
        # Final recommendations
        print(f"\n🎯 RECOMMENDATIONS:")
        print("-" * 30)
        
        if all_configured:
            print("✅ API Key Monitoring System ready!")
            print("✅ Run: python manage.py runserver")
            print("✅ Test: http://localhost:5173/admin/login")
        else:
            print("🔧 Configure missing API keys in travel-backend/.env")
            print("🔧 Make sure to restart Django server after configuration")
            print("🔧 Test API Key Monitoring in admin panel")
        
        print(f"\n📚 Documentation: See .github/copilot-instructions.md")
        
    except Exception as e:
        print(f"❌ Script execution failed: {e}")
        print("💡 Make sure you're running from travel-backend directory")
        return False
        
    return all_configured

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)