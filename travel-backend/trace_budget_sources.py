import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase
cred = credentials.Certificate('serviceAccountKey.json')
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def parse_price(value):
    """Parse price from various formats"""
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        clean = value.replace('₱', '').replace(',', '').strip()
        try:
            return float(clean)
        except:
            return 0.0
    return 0.0

print("="*90)
print("BUDGET SOURCE COMPARISON - TravelRover Firebase Analysis")
print("="*90)

# Get all trips
trips = db.collection('AITrips').stream()

for idx, trip in enumerate(trips, 1):
    data = trip.to_dict()
    
    # Basic info
    destination = data.get('userSelection', {}).get('location', 'Unknown')
    trip_id = trip.id
    
    print(f"\n{'─'*90}")
    print(f"TRIP #{idx}: {destination}")
    print(f"Trip ID: {trip_id}")
    print(f"{'─'*90}")
    
    # ══════════════════════════════════════════════════════════
    # SOURCE 1: User Selection (userSelection.budgetAmount)
    # ══════════════════════════════════════════════════════════
    user_budget = data.get('userSelection', {}).get('budgetAmount')
    
    print(f"\n📋 [1] userSelection.budgetAmount")
    print(f"    Value: ₱{user_budget:,}" if user_budget else "    Value: None")
    print(f"    Purpose: User's expected/recommended budget")
    print(f"    CSV Column: 'Recommended Budget' ✅")
    
    # ══════════════════════════════════════════════════════════
    # SOURCE 2: tripData.budget (can be string or tier name)
    # ══════════════════════════════════════════════════════════
    trip_budget_raw = data.get('tripData', {}).get('budget')
    
    print(f"\n💾 [2] tripData.budget")
    print(f"    Raw: {trip_budget_raw}")
    print(f"    Type: {type(trip_budget_raw).__name__}")
    
    if isinstance(trip_budget_raw, str) and '₱' in trip_budget_raw:
        parsed = parse_price(trip_budget_raw)
        print(f"    Parsed: ₱{parsed:,}")
        print(f"    CSV Column: 'Actual Cost' ✅ (if numeric string)")
    else:
        print(f"    Not a numeric value (might be tier name)")
    
    # ══════════════════════════════════════════════════════════
    # SOURCE 3: tripData.grandTotal
    # ══════════════════════════════════════════════════════════
    grand_total = data.get('tripData', {}).get('grandTotal')
    
    print(f"\n💰 [3] tripData.grandTotal")
    print(f"    Value: ₱{grand_total:,}" if grand_total else "    Value: None")
    if grand_total and not (isinstance(trip_budget_raw, str) and '₱' in trip_budget_raw):
        print(f"    CSV Column: 'Actual Cost' ✅ (fallback)")
    
    # ══════════════════════════════════════════════════════════
    # SOURCE 4: budgetCompliance.totalCost
    # ══════════════════════════════════════════════════════════
    budget_compliance = data.get('tripData', {}).get('budgetCompliance', {})
    total_cost = budget_compliance.get('totalCost') if budget_compliance else None
    
    print(f"\n⚖️ [4] budgetCompliance.totalCost")
    print(f"    Value: ₱{total_cost:,}" if total_cost else "    Value: None")
    if budget_compliance:
        print(f"    Within Budget: {budget_compliance.get('withinBudget', 'N/A')}")
        print(f"    Remaining: ₱{budget_compliance.get('remaining', 0):,}")
    if total_cost and not grand_total and not (isinstance(trip_budget_raw, str) and '₱' in trip_budget_raw):
        print(f"    CSV Column: 'Actual Cost' ✅ (final fallback)")
    
    # ══════════════════════════════════════════════════════════
    # SOURCE 5: Calculate from itinerary components
    # ══════════════════════════════════════════════════════════
    print(f"\n🧮 [5] Calculated from Components (What UI might show)")
    
    # Activities
    total_activities = 0
    itinerary = data.get('tripData', {}).get('itinerary', [])
    for day in itinerary:
        for activity in day.get('activities', []):
            price = activity.get('ticketPricing', 0)
            total_activities += parse_price(price)
    
    # Accommodation
    total_accommodation = 0
    for day in itinerary:
        hotel = day.get('hotel', {})
        price = hotel.get('price', 0)
        total_accommodation += parse_price(price)
    
    # Flights
    total_flights = 0
    flights = data.get('tripData', {}).get('flights', [])
    for flight in flights:
        price = flight.get('price', 0)
        total_flights += parse_price(price)
    
    calculated_total = total_activities + total_accommodation + total_flights
    
    print(f"    Activities: ₱{total_activities:,.2f}")
    print(f"    Accommodation: ₱{total_accommodation:,.2f}")
    print(f"    Flights: ₱{total_flights:,.2f}")
    print(f"    ─────────────────────────")
    print(f"    TOTAL: ₱{calculated_total:,.2f}")
    print(f"    UI Display: 'Estimated Total' ⚠️")
    
    # ══════════════════════════════════════════════════════════
    # COMPARISON SUMMARY
    # ══════════════════════════════════════════════════════════
    print(f"\n📊 COMPARISON SUMMARY")
    print(f"    {'─'*60}")
    
    # Determine what was used in CSV as "Actual Cost"
    csv_actual = None
    if isinstance(trip_budget_raw, str) and '₱' in trip_budget_raw:
        csv_actual = parse_price(trip_budget_raw)
        csv_source = "tripData.budget"
    elif grand_total:
        csv_actual = grand_total
        csv_source = "grandTotal"
    elif total_cost:
        csv_actual = total_cost
        csv_source = "budgetCompliance.totalCost"
    
    print(f"    User Budget (Recommended): ₱{user_budget:,}" if user_budget else "    User Budget: None")
    print(f"    CSV Actual Cost: ₱{csv_actual:,} (from {csv_source})" if csv_actual else "    CSV Actual: None")
    print(f"    Calculated from Components: ₱{calculated_total:,.2f}")
    
    if user_budget and csv_actual:
        csv_diff = csv_actual - user_budget
        csv_pct = (csv_diff / user_budget) * 100
        print(f"    CSV Variance: ₱{csv_diff:+,.2f} ({csv_pct:+.1f}%)")
    
    if user_budget and calculated_total > 0:
        calc_diff = calculated_total - user_budget
        calc_pct = (calc_diff / user_budget) * 100
        print(f"    Component Variance: ₱{calc_diff:+,.2f} ({calc_pct:+.1f}%)")
    
    if csv_actual and calculated_total > 0:
        discrepancy = calculated_total - csv_actual
        print(f"\n    ⚠️  DISCREPANCY: ₱{discrepancy:+,.2f}")
        if abs(discrepancy) > 100:
            print(f"        CSV uses {csv_source}")
            print(f"        UI likely uses calculated components")
            print(f"        This explains the budget mismatch!")

print(f"\n{'='*90}\n")
