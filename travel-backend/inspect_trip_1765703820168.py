import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase
cred = credentials.Certificate('serviceAccountKey.json')
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

TRIP_ID = '1765703820168'

print("="*90)
print(f"DETAILED TRIP ANALYSIS: {TRIP_ID}")
print("="*90)

# Get the specific trip
trip_doc = db.collection('AITrips').document(TRIP_ID).get()

if not trip_doc.exists:
    print(f"Trip {TRIP_ID} not found!")
    exit(1)

data = trip_doc.to_dict()

# Basic Info
destination = data.get('userSelection', {}).get('location', 'Unknown')
user_budget = data.get('userSelection', {}).get('budgetAmount')

print(f"\nDestination: {destination}")
print(f"User Budget: ₱{user_budget:,}")

# Budget Fields
print(f"\n{'─'*90}")
print("BUDGET FIELDS IN FIREBASE")
print(f"{'─'*90}")

trip_data = data.get('tripData', {})

print(f"\n1. tripData.budget: {trip_data.get('budget')}")
print(f"2. tripData.grandTotal: {trip_data.get('grandTotal')}")

budget_compliance = trip_data.get('budgetCompliance', {})
if budget_compliance:
    print(f"3. budgetCompliance:")
    print(f"   - userBudget: ₱{budget_compliance.get('userBudget', 0):,}")
    print(f"   - totalCost: ₱{budget_compliance.get('totalCost', 0):,}")
    print(f"   - remaining: ₱{budget_compliance.get('remaining', 0):,}")
    print(f"   - withinBudget: {budget_compliance.get('withinBudget')}")

# Daily Costs
daily_costs = trip_data.get('dailyCosts')
if daily_costs:
    print(f"\n4. dailyCosts: {daily_costs}")

# Check if there's a breakdown field
if 'breakdown' in trip_data:
    print(f"\n5. tripData.breakdown: {trip_data.get('breakdown')}")

# Detailed Component Analysis
print(f"\n{'─'*90}")
print("COMPONENT-BY-COMPONENT BREAKDOWN")
print(f"{'─'*90}")

# Flights
print(f"\n🛫 FLIGHTS:")
flights = trip_data.get('flights', [])
total_flights = 0
for idx, flight in enumerate(flights, 1):
    price_raw = flight.get('price', 0)
    if isinstance(price_raw, str):
        price = float(price_raw.replace('₱', '').replace(',', '').strip())
    else:
        price = float(price_raw) if price_raw else 0
    
    total_flights += price
    print(f"   Flight {idx}: {flight.get('airline', 'N/A')} - ₱{price:,.2f}")

print(f"   ───────────────────")
print(f"   Total Flights: ₱{total_flights:,.2f}")

# Hotels/Accommodation
print(f"\n🏨 ACCOMMODATION:")
itinerary = trip_data.get('itinerary', [])
total_hotels = 0

for day_num, day in enumerate(itinerary, 1):
    hotel = day.get('hotel', {})
    if hotel:
        hotel_name = hotel.get('name', 'N/A')
        price_raw = hotel.get('price', 0)
        
        if isinstance(price_raw, str):
            price = float(price_raw.replace('₱', '').replace(',', '').strip())
        else:
            price = float(price_raw) if price_raw else 0
        
        total_hotels += price
        print(f"   Day {day_num}: {hotel_name} - ₱{price:,.2f}")

print(f"   ───────────────────")
print(f"   Total Hotels: ₱{total_hotels:,.2f}")

# Activities
print(f"\n🎯 ACTIVITIES & ATTRACTIONS:")
total_activities = 0

for day_num, day in enumerate(itinerary, 1):
    activities = day.get('activities', [])
    day_activity_cost = 0
    
    for activity in activities:
        activity_name = activity.get('placeName', activity.get('name', 'N/A'))
        price_raw = activity.get('ticketPricing', 0)
        
        if isinstance(price_raw, str):
            price = float(price_raw.replace('₱', '').replace(',', '').replace('Free', '0').strip())
        else:
            price = float(price_raw) if price_raw else 0
        
        day_activity_cost += price
        if price > 0:
            print(f"   Day {day_num}: {activity_name} - ₱{price:,.2f}")
    
    total_activities += day_activity_cost

print(f"   ───────────────────")
print(f"   Total Activities: ₱{total_activities:,.2f}")

# Summary
print(f"\n{'─'*90}")
print("CALCULATED TOTAL")
print(f"{'─'*90}")

calculated_total = total_flights + total_hotels + total_activities

print(f"\n   Flights:        ₱{total_flights:>10,.2f}")
print(f"   Accommodation:  ₱{total_hotels:>10,.2f}")
print(f"   Activities:     ₱{total_activities:>10,.2f}")
print(f"   {'─'*40}")
print(f"   TOTAL:          ₱{calculated_total:>10,.2f}")

# Compare with stored values
print(f"\n{'─'*90}")
print("COMPARISON")
print(f"{'─'*90}")

stored_budget = trip_data.get('budget')
if isinstance(stored_budget, str) and '₱' in stored_budget:
    stored_value = float(stored_budget.replace('₱', '').replace(',', ''))
else:
    stored_value = trip_data.get('grandTotal', 0)

print(f"\n   User's Budget:       ₱{user_budget:>10,}")
print(f"   Stored Value:        ₱{stored_value:>10,}")
print(f"   Calculated Total:    ₱{calculated_total:>10,.2f}")
print(f"\n   Difference (Stored vs Calculated): ₱{stored_value - calculated_total:>10,.2f}")
print(f"   Difference (User vs Calculated):   ₱{user_budget - calculated_total:>10,.2f}")

if calculated_total > user_budget:
    over_pct = ((calculated_total - user_budget) / user_budget) * 100
    print(f"\n   ⚠️  OVER BUDGET by ₱{calculated_total - user_budget:,.2f} ({over_pct:.1f}%)")
elif calculated_total < user_budget:
    under_pct = ((user_budget - calculated_total) / user_budget) * 100
    print(f"\n   ✅ UNDER BUDGET by ₱{user_budget - calculated_total:,.2f} ({under_pct:.1f}%)")
else:
    print(f"\n   ✅ EXACTLY ON BUDGET")

print(f"\n{'='*90}\n")
