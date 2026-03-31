import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase
cred = credentials.Certificate('serviceAccountKey.json')
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Get El Nido trip
trips = db.collection('AITrips').where('userSelection.location', '==', 'El Nido, Palawan, Philippines').limit(1).get()

trip = trips[0]
data = trip.to_dict()
trip_data = data.get('tripData', {})

print("="*80)
print("EL NIDO UI BREAKDOWN SOURCE CHECK")
print("="*80)

# Check all possible cost breakdown fields
print("\n1. Checking costBreakdown field:")
cost_breakdown = trip_data.get('costBreakdown')
if cost_breakdown:
    print(f"   {json.dumps(cost_breakdown, indent=2)}")
else:
    print("   ❌ No costBreakdown field")

print("\n2. Checking budgetSummary field:")
budget_summary = trip_data.get('budgetSummary')
if budget_summary:
    print(f"   {json.dumps(budget_summary, indent=2)}")
else:
    print("   ❌ No budgetSummary field")

# Manual calculation from itinerary
print("\n3. Manual calculation from itinerary:")
itinerary = trip_data.get('itinerary', [])
total_accommodation = 0
total_activities = 0

for day in itinerary:
    # Hotel
    hotel = day.get('hotel', {})
    if hotel and hotel.get('price'):
        price_str = str(hotel['price']).replace('₱', '').replace(',', '')
        try:
            total_accommodation += float(price_str)
        except:
            pass
    
    # Activities
    for activity in day.get('activities', []):
        pricing = activity.get('ticketPricing', '0')
        if pricing and pricing != 'Free':
            price_str = str(pricing).replace('₱', '').replace(',', '').replace('Free', '0')
            try:
                total_activities += float(price_str)
            except:
                pass

# Flights
flights = trip_data.get('flights', [])
total_flights = 0
for flight in flights:
    price = flight.get('price', 0)
    if isinstance(price, (int, float)):
        total_flights += price
    elif isinstance(price, str):
        price_str = price.replace('₱', '').replace(',', '')
        try:
            total_flights += float(price_str)
        except:
            pass

print(f"   Accommodation: ₱{total_accommodation:,.2f}")
print(f"   Activities: ₱{total_activities:,.2f}")
print(f"   Flights: ₱{total_flights:,.2f}")
print(f"   {'─'*40}")
print(f"   TOTAL: ₱{total_accommodation + total_activities + total_flights:,.2f}")

# Parse dailyCosts string
print("\n4. Parsed dailyCosts:")
daily_costs_str = trip_data.get('dailyCosts', '')
if daily_costs_str:
    # Fix the concatenated JSON objects
    daily_costs_str = f"[{daily_costs_str}]"
    try:
        daily_costs = json.loads(daily_costs_str)
        total_daily = 0
        for day in daily_costs:
            subtotal = day['breakdown']['subtotal']
            total_daily += subtotal
            print(f"   Day {day['day']}: ₱{subtotal:,} (Acc: ₱{day['breakdown']['accommodation']}, Meals: ₱{day['breakdown']['meals']}, Act: ₱{day['breakdown']['activities']}, Trans: ₱{day['breakdown']['transport']})")
        print(f"   {'─'*40}")
        print(f"   Total from dailyCosts: ₱{total_daily:,}")
    except Exception as e:
        print(f"   Error parsing: {e}")

# Check if there's a separate view-trip calculation
print("\n5. Looking for view-trip specific fields:")
all_keys = trip_data.keys()
cost_related = [k for k in all_keys if 'cost' in k.lower() or 'budget' in k.lower() or 'total' in k.lower()]
print(f"   Cost-related keys: {cost_related}")

print("\n" + "="*80)
print("MYSTERY: UI shows ₱22,448 but Firebase shows:")
print("  - budgetCompliance.totalCost = ₱22,000")
print("  - dailyCosts sum = ₱22,000 (6500+7100+7000+1400)")
print("  - UI breakdown: Activities ₱5,300 + Accommodation ₱11,250 + Flights ₱5,898 = ₱22,448")
print("\n❓ Where does ₱22,448 come from? It's +₱448 more than Firebase storage!")
print("="*80)
