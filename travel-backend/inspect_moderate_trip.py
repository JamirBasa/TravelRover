import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Get a trip with "Moderate" budget
trip = db.collection('AITrips').document('1765702690548').get().to_dict()

print("=" * 100)
print("INSPECTING TRIP WITH budget='Moderate'")
print("=" * 100)

trip_data = trip.get('tripData', {})

print("\n1. tripData.budget value:")
print(f"   Type: {type(trip_data.get('budget')).__name__}")
print(f"   Value: {trip_data.get('budget')}")

print("\n2. All keys in tripData:")
for key in sorted(trip_data.keys()):
    print(f"   - {key}")

print("\n3. Checking for budget-related fields:")
budget_fields = [k for k in trip_data.keys() if 'budget' in k.lower() or 'cost' in k.lower() or 'price' in k.lower()]
for field in budget_fields:
    value = trip_data.get(field)
    print(f"   {field}: {type(value).__name__} = {str(value)[:100]}")

print("\n4. Checking if itinerary has budget info:")
itinerary = trip_data.get('itinerary', [])
if itinerary and len(itinerary) > 0:
    day1 = itinerary[0]
    print(f"   Day 1 keys: {list(day1.keys())}")
    if 'activities' in day1 and day1['activities']:
        activity1 = day1['activities'][0]
        print(f"   Activity 1 keys: {list(activity1.keys())}")
