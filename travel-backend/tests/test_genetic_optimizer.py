"""
Test suite for Genetic Algorithm Itinerary Optimizer
"""

import sys
import os
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langgraph_agents.agents.genetic_optimizer import GeneticItineraryOptimizer, ItineraryChromosome


def create_test_activities():
    """Create sample activities for testing"""
    return [
        {
            'placeName': 'National Museum of Anthropology',
            'placeDetails': 'Explore Filipino cultural heritage',
            'ticketPricing': '₱150',
            'time': '9:00 AM',
            'timeTravel': '2 hours',
            'geoCoordinates': {'latitude': 14.5833, 'longitude': 120.9789}
        },
        {
            'placeName': 'Intramuros',
            'placeDetails': 'Historic walled city',
            'ticketPricing': 'Free',
            'time': '11:30 AM',
            'timeTravel': '3 hours',
            'geoCoordinates': {'latitude': 14.5892, 'longitude': 120.9751}
        },
        {
            'placeName': 'Rizal Park',
            'placeDetails': 'Beautiful urban park',
            'ticketPricing': 'Free',
            'time': '2:00 PM',
            'timeTravel': '1.5 hours',
            'geoCoordinates': {'latitude': 14.5834, 'longitude': 120.9806}
        },
        {
            'placeName': 'Manila Ocean Park',
            'placeDetails': 'Marine theme park',
            'ticketPricing': '₱800',
            'time': '4:00 PM',
            'timeTravel': '2.5 hours',
            'geoCoordinates': {'latitude': 14.5720, 'longitude': 120.9756}
        },
        {
            'placeName': 'SM Mall of Asia',
            'placeDetails': 'Shopping and entertainment',
            'ticketPricing': 'Free',
            'time': '7:00 PM',
            'timeTravel': '2 hours',
            'geoCoordinates': {'latitude': 14.5351, 'longitude': 120.9823}
        },
        {
            'placeName': 'Fort Santiago',
            'placeDetails': 'Spanish colonial fortress',
            'ticketPricing': '₱75',
            'time': '10:00 AM',
            'timeTravel': '1.5 hours',
            'geoCoordinates': {'latitude': 14.5931, 'longitude': 120.9739}
        },
        {
            'placeName': 'Casa Manila',
            'placeDetails': 'Colonial house museum',
            'ticketPricing': '₱75',
            'time': '12:00 PM',
            'timeTravel': '1 hour',
            'geoCoordinates': {'latitude': 14.5900, 'longitude': 120.9745}
        },
        {
            'placeName': 'Manila Bay Sunset Cruise',
            'placeDetails': 'Scenic sunset boat tour',
            'ticketPricing': '₱1,200',
            'time': '5:30 PM',
            'timeTravel': '2 hours',
            'geoCoordinates': {'latitude': 14.5729, 'longitude': 120.9780}
        }
    ]


def create_test_trip_params():
    """Create sample trip parameters"""
    return {
        'duration': 3,
        'budget': 'moderate',
        'user_profile': {
            'activityTypes': ['Cultural', 'Nature', 'Shopping'],
            'interests': ['History', 'Museums', 'Parks', 'Food']
        }
    }


def test_basic_initialization():
    """Test optimizer initialization"""
    print("\n🧪 TEST 1: Basic Initialization")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer(
        population_size=20,
        generations=50,
        mutation_rate=0.15,
        crossover_rate=0.7,
        elite_size=3
    )
    
    assert optimizer.population_size == 20
    assert optimizer.generations == 50
    assert optimizer.mutation_rate == 0.15
    assert optimizer.crossover_rate == 0.7
    assert optimizer.elite_size == 3
    
    print("✅ Optimizer initialized successfully")
    print(f"   Population: {optimizer.population_size}")
    print(f"   Generations: {optimizer.generations}")
    print(f"   Mutation Rate: {optimizer.mutation_rate}")
    print(f"   Crossover Rate: {optimizer.crossover_rate}")
    print(f"   Elite Size: {optimizer.elite_size}")


def test_population_initialization():
    """Test population initialization"""
    print("\n🧪 TEST 2: Population Initialization")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer(population_size=10)
    activities = create_test_activities()
    
    population = optimizer._initialize_population(activities, num_days=3)
    
    assert len(population) == 10
    assert all(isinstance(c, ItineraryChromosome) for c in population)
    assert all(len(c.activities) > 0 for c in population)
    assert all(len(c.day_assignments) == len(c.activities) for c in population)
    
    print(f"✅ Population initialized: {len(population)} chromosomes")
    for i, chromosome in enumerate(population[:3]):
        print(f"   Chromosome {i+1}: {len(chromosome.activities)} activities")
        print(f"      Day assignments: {chromosome.day_assignments}")


def test_fitness_calculation():
    """Test fitness calculation"""
    print("\n🧪 TEST 3: Fitness Calculation")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer()
    activities = create_test_activities()[:5]
    day_assignments = [1, 1, 2, 2, 3]
    
    chromosome = ItineraryChromosome(activities, day_assignments)
    
    trip_params = create_test_trip_params()
    budget = optimizer._parse_budget(trip_params['budget'])
    preferences = trip_params['user_profile']
    
    fitness = optimizer._calculate_fitness(chromosome, num_days=3, budget=budget, preferences=preferences)
    
    assert 0 <= fitness <= 100
    assert chromosome.distance_score >= 0
    assert chromosome.time_score >= 0
    assert chromosome.cost_score >= 0
    assert chromosome.preference_score >= 0
    
    print(f"✅ Fitness calculated: {fitness:.2f}/100")
    print(f"   Distance Score: {chromosome.distance_score:.2f}")
    print(f"   Time Score: {chromosome.time_score:.2f}")
    print(f"   Cost Score: {chromosome.cost_score:.2f}")
    print(f"   Preference Score: {chromosome.preference_score:.2f}")


def test_crossover_operation():
    """Test crossover operation"""
    print("\n🧪 TEST 4: Crossover Operation")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer()
    activities = create_test_activities()[:6]
    
    parent1 = ItineraryChromosome(activities[:3], [1, 1, 2])
    parent2 = ItineraryChromosome(activities[3:], [1, 2, 2])
    
    child1, child2 = optimizer._crossover(parent1, parent2, num_days=3)
    
    assert isinstance(child1, ItineraryChromosome)
    assert isinstance(child2, ItineraryChromosome)
    assert len(child1.activities) > 0
    assert len(child2.activities) > 0
    assert len(child1.day_assignments) == len(child1.activities)
    assert len(child2.day_assignments) == len(child2.activities)
    
    print(f"✅ Crossover successful")
    print(f"   Parent 1: {len(parent1.activities)} activities -> Child 1: {len(child1.activities)} activities")
    print(f"   Parent 2: {len(parent2.activities)} activities -> Child 2: {len(child2.activities)} activities")
    print(f"   Child 1 days: {child1.day_assignments}")
    print(f"   Child 2 days: {child2.day_assignments}")


def test_mutation_operation():
    """Test mutation operation"""
    print("\n🧪 TEST 5: Mutation Operation")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer()
    activities = create_test_activities()[:5]
    day_assignments = [1, 1, 2, 2, 3]
    
    chromosome = ItineraryChromosome(activities[:], day_assignments[:])
    original_activities = len(chromosome.activities)
    original_days = chromosome.day_assignments[:]
    
    mutated = optimizer._mutate(chromosome, num_days=3)
    
    assert isinstance(mutated, ItineraryChromosome)
    assert len(mutated.activities) >= 3  # Minimum after removal
    assert len(mutated.day_assignments) == len(mutated.activities)
    
    print(f"✅ Mutation successful")
    print(f"   Original: {original_activities} activities, days: {original_days}")
    print(f"   Mutated:  {len(mutated.activities)} activities, days: {mutated.day_assignments}")
    
    # Check if mutation occurred
    if mutated.day_assignments != original_days or len(mutated.activities) != original_activities:
        print(f"   ✨ Mutation applied!")
    else:
        print(f"   ℹ️ No visible mutation (possible swap that doesn't change count)")


def test_full_optimization():
    """Test full optimization process"""
    print("\n🧪 TEST 6: Full Optimization Process")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer(
        population_size=20,
        generations=30,  # Reduced for testing
        mutation_rate=0.15,
        crossover_rate=0.7,
        elite_size=3
    )
    
    activities = create_test_activities()
    trip_params = create_test_trip_params()
    
    print(f"📊 Optimizing itinerary with {len(activities)} activities...")
    print(f"   Duration: {trip_params['duration']} days")
    print(f"   Budget: {trip_params['budget']}")
    print(f"   Preferences: {trip_params['user_profile']}")
    
    result = optimizer.optimize(activities, trip_params)
    
    assert 'itinerary_data' in result
    assert 'optimization_score' in result
    assert 'total_cost' in result
    assert 'total_activities' in result
    
    print(f"\n✅ Optimization complete!")
    print(f"   Optimization Score: {result['optimization_score']:.2f}/100")
    print(f"   Total Cost: ₱{result['total_cost']:,.2f}")
    print(f"   Total Activities: {result['total_activities']}")
    
    print(f"\n📅 Generated Itinerary:")
    for day_entry in result['itinerary_data']:
        print(f"   Day {day_entry['day']}: {day_entry['theme']}")
        if day_entry['planText']:
            activities_text = day_entry['planText'].split(' | ')
            print(f"      {len(activities_text)} activities planned")


def test_budget_constraints():
    """Test budget constraint handling"""
    print("\n🧪 TEST 7: Budget Constraints")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer(population_size=20, generations=30)
    
    activities = create_test_activities()
    
    # Test different budgets
    budgets = ['cheap', 'moderate', 'luxury']
    
    for budget in budgets:
        trip_params = {
            'duration': 3,
            'budget': budget,
            'user_profile': {'activityTypes': ['Cultural'], 'interests': ['History']}
        }
        
        result = optimizer.optimize(activities, trip_params)
        budget_value = optimizer._parse_budget(budget)
        
        print(f"\n💰 Budget: {budget.upper()} (₱{budget_value:,})")
        print(f"   Total Cost: ₱{result['total_cost']:,}")
        print(f"   Score: {result['optimization_score']:.2f}/100")
        print(f"   Activities: {result['total_activities']}")


def test_preference_matching():
    """Test preference matching"""
    print("\n🧪 TEST 8: Preference Matching")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer(population_size=20, generations=30)
    
    activities = create_test_activities()
    
    # Test different preferences
    preferences = [
        {
            'name': 'Cultural Focus',
            'profile': {
                'activityTypes': ['Cultural', 'Heritage'],
                'interests': ['History', 'Museums', 'Architecture']
            }
        },
        {
            'name': 'Nature & Shopping',
            'profile': {
                'activityTypes': ['Nature', 'Shopping'],
                'interests': ['Parks', 'Malls', 'Beaches']
            }
        }
    ]
    
    for pref in preferences:
        trip_params = {
            'duration': 3,
            'budget': 'moderate',
            'user_profile': pref['profile']
        }
        
        result = optimizer.optimize(activities, trip_params)
        
        print(f"\n🎯 Preference: {pref['name']}")
        print(f"   Activity Types: {pref['profile']['activityTypes']}")
        print(f"   Interests: {pref['profile']['interests']}")
        print(f"   Optimization Score: {result['optimization_score']:.2f}/100")
        print(f"   Activities Selected: {result['total_activities']}")


def test_convergence():
    """Test convergence detection"""
    print("\n🧪 TEST 9: Convergence Detection")
    print("=" * 60)
    
    optimizer = GeneticItineraryOptimizer(
        population_size=30,
        generations=100,  # High to test convergence
        mutation_rate=0.1,
        crossover_rate=0.7,
        elite_size=5
    )
    
    activities = create_test_activities()
    trip_params = create_test_trip_params()
    
    print(f"🔄 Testing convergence with {optimizer.generations} max generations...")
    
    result = optimizer.optimize(activities, trip_params)
    
    print(f"\n✅ Algorithm completed")
    print(f"   Final Score: {result['optimization_score']:.2f}/100")
    print(f"   Note: Check logs for actual convergence point")


def run_all_tests():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("🧬 GENETIC ALGORITHM OPTIMIZER - TEST SUITE")
    print("=" * 60)
    
    tests = [
        test_basic_initialization,
        test_population_initialization,
        test_fitness_calculation,
        test_crossover_operation,
        test_mutation_operation,
        test_full_optimization,
        test_budget_constraints,
        test_preference_matching,
        test_convergence
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"\n❌ TEST FAILED: {test.__name__}")
            print(f"   Error: {str(e)}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"✅ Passed: {passed}/{len(tests)}")
    print(f"❌ Failed: {failed}/{len(tests)}")
    print(f"Success Rate: {(passed/len(tests)*100):.1f}%")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
