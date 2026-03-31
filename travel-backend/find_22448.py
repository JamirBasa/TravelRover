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

trip = trips[0].to_dict()
trip_data = trip.get('tripData', {})

print("="*80)
print("EL NIDO: FINDING THE₱22,448 SOURCE")
print("="*80)

# Parse dailyCosts (this is what budgetCompliance uses)
daily_costs_raw = trip_data.get('dailyCosts', '')
print(f"\n1. dailyCosts field exists: {bool(daily_costs_raw)}")

if daily_costs_raw:
    # It's stored as concatenated JSON objects
    try:
        daily_costs_str = f"[{daily_costs_raw}]"
        daily_costs = json.loads(daily_costs_str)
        
        total_accommodation = 0
        total_meals = 0
        total_activities_daily = 0
        total_transport = 0
        
        for day in daily_costs:
            breakdown = day['breakdown']
            total_accommodation += breakdown['accommodation']
            total_meals += breakdown['meals']
            total_activities_daily += breakdown['activities']
            total_transport += breakdown['transport']
            print(f"   Day {day['day']}: Acc ₱{breakdown['accommodation']}, Meals ₱{breakdown['meals']}, Act ₱{breakdown['activities']}, Trans ₱{breakdown['transport']} = ₱{breakdown['subtotal']}")
        
        total_daily = total_accommodation + total_meals + total_activities_daily + total_transport
        print(f"\n   Total from dailyCosts: ₱{total_daily:,}")
        print(f"      - Accommodation: ₱{total_accommodation:,}")
        print(f"      - Meals: ₱{total_meals:,}")
        print(f"      - Activities: ₱{total_activities_daily:,}")
        print(f"      - Transport: ₱{total_transport:,}")
    except Exception as e:
        print(f"   Error parsing: {e}")

# Check real flight data
real_flights = trip.get('realFlightData', {}).get('flights', [])
if real_flights:
    print(f"\n2. realFlightData.flights: {len(real_flights)} options")
    # Sort by price and take cheapest
    sorted_flights = sorted(real_flights, key=lambda f: f.get('total_for_group_numeric', f.get('price_numeric', 999999)))
    cheapest = sorted_flights[0]
    print(f"   Cheapest: {cheapest.get('name')} - ₱{cheapest.get('total_for_group_numeric', cheapest.get('price_numeric')):,}")
    
    print(f"\n3. RECONSTRUCTED UI TOTAL:")
    print(f"   Activities (from dailyCosts):     ₱{total_activities_daily:>7,}")
    print(f"   Accommodation (from dailyCosts):  ₱{total_accommodation:>7,}")
    print(f"   Meals (from dailyCosts):          ₱{total_meals:>7,}")
    print(f"   Transport (from dailyCosts):      ₱{total_transport:>7,}")
    print(f"   Flights (from realFlightData):    ₱{cheapest.get('total_for_group_numeric', 0):>7,}")
    print(f"   {'─'*50}")
    
    # UI groups meals+transport into "Activities & Attractions"?
    ui_activities = total_activities_daily + total_meals + total_transport
    ui_total = ui_activities + total_accommodation + cheapest.get('total_for_group_numeric', 0)
    
    print(f"   POSSIBLE UI GROUPING:")
    print(f"   Activities & Attractions (act+meals+trans): ₱{ui_activities:>7,}")
    print(f"   Accommodation:                               ₱{total_accommodation:>7,}")
    print(f"   Flights:                                     ₱{cheapest.get('total_for_group_numeric', 0):>7,}")
    print(f"   TOTAL:                                       ₱{ui_total:>7,}")
    
    print(f"\n   🎯 Your UI shows: ₱22,448")
    print(f"   ✅ Match: {'YES!' if abs(ui_total - 22448) < 10 else f'NO (off by ₱{abs(ui_total - 22448)})'}")

print("="*80)
