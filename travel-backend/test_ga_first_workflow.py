"""
Test GA-First Workflow - Quick validation
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from langgraph_agents.services.activity_fetcher import ActivityPoolFetcher
from langgraph_agents.agents.genetic_optimizer import GeneticItineraryOptimizer


async def test_activity_fetcher():
    """Test activity pool fetching"""
    print("\n" + "=" * 60)
    print("🧪 TEST 1: Activity Pool Fetcher")
    print("=" * 60)
    
    try:
        fetcher = ActivityPoolFetcher()
        
        print(f"\n📍 Fetching activities for Manila...")
        activities = await fetcher.fetch_activity_pool(
            destination="Manila, Philippines",
            user_preferences={
                'activityTypes': ['Cultural', 'Nature', 'Food'],
                'interests': ['History', 'Museums', 'Parks']
            },
            radius=20000,
            max_activities=50
        )
        
        print(f"\n✅ Fetched {len(activities)} activities")
        
        if activities:
            print(f"\n📋 Sample Activities:")
            for i, activity in enumerate(activities[:5], 1):
                print(f"\n{i}. {activity.get('placeName')}")
                print(f"   📍 Location: {activity.get('placeDetails')}")
                print(f"   💰 Price: {activity.get('ticketPricing')}")
                print(f"   ⭐ Rating: {activity.get('rating')}/5.0")
                print(f"   ⏱️  Duration: {activity.get('timeTravel')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_ga_optimization():
    """Test GA optimization with sample activities"""
    print("\n" + "=" * 60)
    print("🧪 TEST 2: GA Optimization")
    print("=" * 60)
    
    try:
        # Create sample activities
        sample_activities = [
            {
                'placeName': 'National Museum of Anthropology',
                'placeDetails': 'Cultural heritage museum',
                'ticketPricing': '₱150',
                'rating': 4.5,
                'geoCoordinates': {'latitude': 14.5833, 'longitude': 120.9789},
                'timeTravel': '2 hours',
                'activityType': 'museum'
            },
            {
                'placeName': 'Intramuros',
                'placeDetails': 'Historic walled city',
                'ticketPricing': 'Free',
                'rating': 4.7,
                'geoCoordinates': {'latitude': 14.5892, 'longitude': 120.9751},
                'timeTravel': '3 hours',
                'activityType': 'tourist_attraction'
            },
            {
                'placeName': 'Rizal Park',
                'placeDetails': 'Urban park and historical site',
                'ticketPricing': 'Free',
                'rating': 4.6,
                'geoCoordinates': {'latitude': 14.5834, 'longitude': 120.9806},
                'timeTravel': '1.5 hours',
                'activityType': 'park'
            },
            {
                'placeName': 'Manila Ocean Park',
                'placeDetails': 'Marine theme park',
                'ticketPricing': '₱800',
                'rating': 4.3,
                'geoCoordinates': {'latitude': 14.5720, 'longitude': 120.9756},
                'timeTravel': '2.5 hours',
                'activityType': 'aquarium'
            },
            {
                'placeName': 'SM Mall of Asia',
                'placeDetails': 'Shopping and entertainment complex',
                'ticketPricing': 'Free',
                'rating': 4.4,
                'geoCoordinates': {'latitude': 14.5351, 'longitude': 120.9823},
                'timeTravel': '2 hours',
                'activityType': 'shopping_mall'
            },
            {
                'placeName': 'Fort Santiago',
                'placeDetails': 'Spanish colonial fortress',
                'ticketPricing': '₱75',
                'rating': 4.6,
                'geoCoordinates': {'latitude': 14.5931, 'longitude': 120.9739},
                'timeTravel': '1.5 hours',
                'activityType': 'tourist_attraction'
            }
        ]
        
        trip_params = {
            'duration': 3,
            'budget': 'moderate',
            'user_profile': {
                'activityTypes': ['Cultural', 'Nature'],
                'interests': ['History', 'Museums']
            }
        }
        
        print(f"\n🧬 Running GA optimization...")
        print(f"   Activities: {len(sample_activities)}")
        print(f"   Duration: {trip_params['duration']} days")
        print(f"   Budget: {trip_params['budget']}")
        
        optimizer = GeneticItineraryOptimizer(
            population_size=20,  # Reduced for testing
            generations=30,       # Reduced for testing
            mutation_rate=0.15,
            crossover_rate=0.7,
            elite_size=3
        )
        
        result = optimizer.optimize(
            activities=sample_activities,
            trip_params=trip_params
        )
        
        print(f"\n✅ Optimization complete!")
        print(f"   Optimization Score: {result.get('optimization_score', 0):.2f}/100")
        print(f"   Total Activities: {result.get('total_activities', 0)}")
        print(f"   Total Cost: ₱{result.get('total_cost', 0):.2f}")
        
        print(f"\n📅 Generated Itinerary:")
        for day_entry in result.get('itinerary_data', []):
            print(f"\n   Day {day_entry['day']}: {day_entry['theme']}")
            if day_entry.get('planText'):
                activities_text = day_entry['planText'].split(' | ')
                print(f"      {len(activities_text)} activities planned")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_full_workflow():
    """Test complete GA-first workflow"""
    print("\n" + "=" * 60)
    print("🧪 TEST 3: Full GA-First Workflow")
    print("=" * 60)
    
    try:
        # Step 1: Fetch activities
        print(f"\n📍 Step 1: Fetching activities...")
        fetcher = ActivityPoolFetcher()
        activities = await fetcher.fetch_activity_pool(
            destination="Manila, Philippines",
            user_preferences={
                'activityTypes': ['Cultural', 'Nature'],
                'interests': ['History', 'Museums']
            },
            radius=15000,
            max_activities=30
        )
        
        print(f"   ✅ Fetched {len(activities)} activities")
        
        if len(activities) < 5:
            print("   ⚠️  Not enough activities for meaningful test")
            return False
        
        # Step 2: GA optimization
        print(f"\n🧬 Step 2: GA optimization...")
        optimizer = GeneticItineraryOptimizer(
            population_size=20,
            generations=30
        )
        
        trip_params = {
            'duration': 3,
            'budget': 'moderate',
            'user_profile': {
                'activityTypes': ['Cultural', 'Nature'],
                'interests': ['History', 'Museums']
            }
        }
        
        result = optimizer.optimize(activities, trip_params)
        
        print(f"   ✅ Optimization Score: {result.get('optimization_score', 0):.2f}/100")
        
        # Step 3: Validate results
        print(f"\n✅ Step 3: Validating results...")
        
        assert 'itinerary_data' in result, "Missing itinerary_data"
        assert 'optimization_score' in result, "Missing optimization_score"
        assert result['optimization_score'] > 0, "Invalid optimization score"
        assert len(result['itinerary_data']) > 0, "Empty itinerary"
        
        print(f"   ✅ All validations passed!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("🧬 GA-FIRST WORKFLOW - VALIDATION SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Activity Fetcher
    results.append(await test_activity_fetcher())
    
    # Test 2: GA Optimization
    results.append(await test_ga_optimization())
    
    # Test 3: Full Workflow
    results.append(await test_full_workflow())
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"\n✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if passed == total:
        print("\n🎉 All tests passed! GA-First workflow is ready!")
    else:
        print("\n⚠️  Some tests failed. Please review errors above.")
    
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
