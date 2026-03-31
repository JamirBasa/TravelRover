"""
Firebase Budget Accuracy Analyzer with RMSE
Fetches real trip data from Firebase and calculates all accuracy metrics
✅ UPDATED: Uses UI's live budget calculation instead of stored budgetCompliance.totalCost
"""

import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os
from datetime import datetime
import math

# Add parent directory to path to import the main evaluator
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from calculate_budget_recommendation_metrics import BudgetAccuracyEvaluator
from calculate_ui_budget import calculate_ui_total_budget


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("✅ Firebase already initialized")
    except ValueError:
        # Initialize with service account
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized successfully")
    
    return firestore.client()


def extract_budget_data(trip_doc):
    """
    Extract budget comparison data from a Firebase trip document.
    
    ✅ REVERTED: Using budgetCompliance.totalCost (stored value) for consistency
    
    COMPARISON LOGIC:
    - ESTIMATED BUDGET: userSelection.budgetAmount (what user expects to spend)
    - ACTUAL COST: budgetCompliance.totalCost (stored daily breakdown total)
    
    Note: UI may show slightly different values due to live price updates from APIs,
    but budgetCompliance.totalCost represents the authoritative budget calculation
    at trip creation time, making it suitable for thesis accuracy evaluation.
    
    Expected Firebase structure:
    {
        'userSelection': {
            'budgetAmount': 22300,  # User's estimated budget (RECOMMENDED)
            'budget': 'Cheap' | 'Moderate' | 'Luxury',
            'location': 'El Nido, Palawan, Philippines',
            'duration': 4
        },
        'tripData': {
            'budgetCompliance': {
                'totalCost': 22000,  # Actual cost at creation (ACTUAL)
            },
            'grandTotal': 22000,  # Fallback
        }
    }
    
    Returns: dict with {destination, duration, recommended, actual, budget_tier}
             or None if data is incomplete
    """
    try:
        trip_data = trip_doc.get('tripData', {})
        user_selection = trip_doc.get('userSelection', {})
        
        # Get destination (it's a string, not an object)
        destination = user_selection.get('location', 'Unknown')
        if isinstance(destination, dict):
            destination = destination.get('label', 'Unknown')
        
        # Get duration
        duration = user_selection.get('duration') or user_selection.get('noOfDays', 0)
        
        # Get recommended budget - use budgetAmount if available, otherwise map from tier
        recommended = user_selection.get('budgetAmount')
        if recommended is None:
            budget_tier = user_selection.get('budget', 'Cheap')
            tier_mapping = {
                'Cheap': 22500,      # Mid-point of 15,000-30,000
                'Moderate': 45000,   # Mid-point of 30,000-60,000
                'Luxury': 75000      # Above 60,000
            }
            recommended = tier_mapping.get(budget_tier, 22500)
            budget_tier_label = budget_tier
        else:
            # Determine tier from budgetAmount
            if recommended < 30000:
                budget_tier_label = 'Cheap'
            elif recommended < 60000:
                budget_tier_label = 'Moderate'
            else:
                budget_tier_label = 'Luxury'
        
        # ACTUAL COST: Get from budgetCompliance.totalCost (stored value)
        # This represents the official budget calculation at trip creation time
        actual = None
        if isinstance(trip_data, dict):
            # PRIORITY 1: budgetCompliance.totalCost
            if 'budgetCompliance' in trip_data:
                bc = trip_data['budgetCompliance']
                if isinstance(bc, dict) and 'totalCost' in bc:
                    actual = float(bc['totalCost'])
            
            # PRIORITY 2: grandTotal (fallback)
            if actual is None and 'grandTotal' in trip_data:
                actual = float(trip_data['grandTotal'])
        
        return {
            'destination': destination,
            'duration': duration,
            'recommended': recommended,
            'actual': actual,
            'budget_tier': budget_tier_label
        }
    
    except Exception as e:
        print(f"⚠️  Error extracting data: {e}")
        import traceback
        traceback.print_exc()
        return None


def analyze_firebase_trips(max_trips=10):
    """
    Fetch trips from Firebase and analyze budget accuracy
    
    Args:
        max_trips: Maximum number of trips to analyze
    """
    print("\n" + "="*80)
    print("FIREBASE BUDGET ACCURACY ANALYSIS")
    print("="*80 + "\n")
    
    # Initialize Firebase
    db = initialize_firebase()
    
    # Initialize evaluator
    evaluator = BudgetAccuracyEvaluator()
    
    # Fetch trips from Firebase
    print(f"📥 Fetching up to {max_trips} trips from Firebase...")
    trips_ref = db.collection('AITrips')
    
    # Get trips ordered by creation date (most recent first)
    query = trips_ref.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(max_trips)
    trips = query.stream()
    
    trip_count = 0
    skipped_count = 0
    
    for trip_doc in trips:
        trip_data = trip_doc.to_dict()
        trip_id = trip_doc.id
        
        # Extract budget data
        extracted = extract_budget_data(trip_data)
        
        if extracted and extracted['recommended'] and extracted['actual']:
            trip_count += 1
            
            print(f"\n✓ Trip {trip_count}: {extracted['destination']} ({extracted['duration']} days)")
            print(f"  Recommended: ₱{extracted['recommended']:,.0f}")
            print(f"  Actual: ₱{extracted['actual']:,.0f}")
            
            evaluator.add_trip(
                trip_num=trip_count,
                destination=extracted['destination'],
                duration=extracted['duration'],
                recommended_budget=extracted['recommended'],
                actual_cost=extracted['actual']
            )
        else:
            skipped_count += 1
            print(f"\n⊘ Skipped trip {trip_id}: Missing budget data")
            if extracted:
                print(f"  Recommended: {extracted.get('recommended')}")
                print(f"  Actual: {extracted.get('actual')}")
    
    print(f"\n{'='*80}")
    print(f"📊 Summary: {trip_count} trips analyzed, {skipped_count} skipped")
    print(f"{'='*80}\n")
    
    if trip_count == 0:
        print("❌ No valid trips found with complete budget data.")
        print("\nTroubleshooting:")
        print("1. Check that your Firebase collection 'AITrips' has documents")
        print("2. Verify that trips have 'estimatedBudget' and 'actualCost' fields")
        print("3. Check serviceAccountKey.json is in the correct location")
        return None
    
    # Generate comprehensive report
    print("\n" + "="*80)
    print("GENERATING COMPREHENSIVE REPORT")
    print("="*80 + "\n")
    
    metrics = evaluator.generate_report(output_csv=True)
    
    return metrics


def manual_entry_mode():
    """
    Interactive mode for manually entering trip data
    Useful if Firebase data structure is different
    """
    print("\n" + "="*80)
    print("MANUAL TRIP ENTRY MODE")
    print("="*80 + "\n")
    
    evaluator = BudgetAccuracyEvaluator()
    
    print("Enter trip data manually. Type 'done' when finished.\n")
    
    trip_num = 1
    while True:
        print(f"\n--- Trip {trip_num} ---")
        
        destination = input("Destination (or 'done' to finish): ").strip()
        if destination.lower() == 'done':
            break
        
        try:
            duration = int(input("Duration (days): ").strip())
            recommended = float(input("Recommended Budget (₱): ").strip())
            actual = float(input("Actual Cost (₱): ").strip())
            
            evaluator.add_trip(
                trip_num=trip_num,
                destination=destination,
                duration=duration,
                recommended_budget=recommended,
                actual_cost=actual
            )
            
            print(f"✓ Added trip {trip_num}")
            trip_num += 1
            
        except ValueError:
            print("⚠️  Invalid input. Please enter numbers for duration and budgets.")
            continue
    
    if trip_num > 1:
        print("\n" + "="*80)
        print("GENERATING REPORT")
        print("="*80 + "\n")
        metrics = evaluator.generate_report(output_csv=True)
        return metrics
    else:
        print("\n❌ No trips entered.")
        return None


def main():
    """Main function with mode selection"""
    print("\n" + "="*80)
    print("BUDGET RECOMMENDATION ACCURACY ANALYZER")
    print("="*80 + "\n")
    
    print("Select mode:")
    print("1. Analyze Firebase trips (automatic)")
    print("2. Manual entry mode")
    print("3. Use sample data (demo)")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    if choice == '1':
        # Firebase mode
        max_trips = input("\nHow many trips to analyze? (default: 10): ").strip()
        max_trips = int(max_trips) if max_trips.isdigit() else 10
        
        try:
            analyze_firebase_trips(max_trips=max_trips)
        except Exception as e:
            print(f"\n❌ Error accessing Firebase: {e}")
            print("\nFalling back to manual entry mode...")
            manual_entry_mode()
    
    elif choice == '2':
        # Manual mode
        manual_entry_mode()
    
    else:
        # Sample data mode (from calculate_budget_recommendation_metrics.py)
        print("\n📝 Using sample data for demonstration...")
        from calculate_budget_recommendation_metrics import main as sample_main
        sample_main()


if __name__ == "__main__":
    main()
