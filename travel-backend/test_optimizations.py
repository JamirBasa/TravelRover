#!/usr/bin/env python
"""
Quick test script to verify production optimizations
Run this to ensure all optimizations are working correctly
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from langgraph_agents.models import TravelPlanningSession, AgentExecutionLog
from langgraph_agents.logging_config import get_production_logger
from django.db import connection

def test_database_indexes():
    """Test that indexes are created"""
    print("\n🔍 Testing Database Indexes...")
    
    with connection.cursor() as cursor:
        # Check indexes on TravelPlanningSession
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND tbl_name='langgraph_agents_travelplanningsession'
        """)
        indexes = cursor.fetchall()
        
    print(f"✅ Found {len(indexes)} indexes on TravelPlanningSession:")
    for idx in indexes:
        print(f"   - {idx[0]}")
    
    return len(indexes) > 5  # Should have at least 5 indexes

def test_throttling():
    """Test that throttling classes are imported correctly"""
    print("\n🔍 Testing Rate Limiting...")
    
    try:
        from langgraph_agents.throttling import (
            TripGenerationThrottle,
            BurstTripGenerationThrottle,
            SessionStatusThrottle,
            HealthCheckThrottle
        )
        print("✅ All throttling classes imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Throttling import failed: {e}")
        return False

def test_logging():
    """Test structured logging"""
    print("\n🔍 Testing Structured Logging...")
    
    try:
        logger = get_production_logger('test_logger')
        logger.info("Test log message", user_email="test@example.com")
        logger.trip_generation(
            user_email="test@example.com",
            destination="Test Destination",
            status="test"
        )
        print("✅ Structured logging working correctly")
        return True
    except Exception as e:
        print(f"❌ Logging test failed: {e}")
        return False

def test_models():
    """Test that models are working"""
    print("\n🔍 Testing Database Models...")
    
    try:
        # Count sessions
        session_count = TravelPlanningSession.objects.count()
        log_count = AgentExecutionLog.objects.count()
        
        print(f"✅ Database accessible")
        print(f"   - Sessions: {session_count}")
        print(f"   - Logs: {log_count}")
        return True
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def run_tests():
    """Run all tests"""
    print("=" * 60)
    print("🚀 TravelRover Production Optimization Tests")
    print("=" * 60)
    
    tests = [
        ("Database Indexes", test_database_indexes),
        ("Rate Limiting", test_throttling),
        ("Structured Logging", test_logging),
        ("Database Models", test_models),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} test crashed: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\n🎯 Score: {passed}/{total} ({(passed/total)*100:.0f}%)")
    
    if passed == total:
        print("🎉 All optimizations are working correctly!")
    else:
        print("⚠️ Some optimizations need attention")
    
    return passed == total

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
