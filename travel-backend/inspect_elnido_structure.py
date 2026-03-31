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

print("="*80)
print("EL NIDO DATA STRUCTURE FOR UI CALCULATION")
print("="*80)

# Check itinerary
itinerary = trip.get('tripData', {}).get('itinerary', [])
print(f"\n1. ITINERARY: {len(itinerary)} days found")
print(f"   Type: {type(itinerary)}")

if itinerary:
    for i, day in enumerate(itinerary[:2], 1):  # First 2 days only
        print(f"\n   Day {i}:")
        print(f"   - Type: {type(day)}")
        if isinstance(day, dict):
            print(f"   - Keys: {list(day.keys())}")
            activities = day.get('activities', [])
            print(f"   - Activities count: {len(activities) if isinstance(activities, list) else 0}")
            if activities and isinstance(activities, list):
                for j, act in enumerate(activities[:2], 1):
                    if isinstance(act, dict):
                        print(f"      Activity {j}: {act.get('placeName', 'N/A')}")
                        print(f"         ticketPricing: {act.get('ticketPricing')}")
                        print(f"         price: {act.get('price')}")
                        print(f"         cost: {act.get('cost')}")

# Check hotels
print(f"\n2. HOTELS:")
real_hotels = trip.get('realHotelData', {}).get('hotels', [])
ai_hotels = trip.get('tripData', {}).get('hotels', [])
print(f"   realHotelData.hotels: {len(real_hotels) if real_hotels else 0}")
print(f"   tripData.hotels: {len(ai_hotels) if ai_hotels else 0}")

if real_hotels:
    print(f"\n   Real Hotels (first one):")
    h = real_hotels[0]
    print(f"   - Name: {h.get('hotelName')}")
    print(f"   - price: {h.get('price')}")
    print(f"   - pricePerNight: {h.get('pricePerNight')}")
    print(f"   - All keys: {list(h.keys())}")
elif ai_hotels:
    print(f"\n   AI Hotels (first one):")
    h = ai_hotels[0]
    print(f"   - Name: {h.get('hotelName')}")
    print(f"   - price: {h.get('price')}")
    print(f"   - Type: {type(h)}")
    if isinstance(h, dict):
        print(f"   - Keys: {list(h.keys())}")

# Check flights
print(f"\n3. FLIGHTS:")
real_flights = trip.get('realFlightData', {}).get('flights', [])
ai_flights = trip.get('tripData', {}).get('flights', [])
print(f"   realFlightData.flights: {len(real_flights) if real_flights else 0}")
print(f"   tripData.flights: {len(ai_flights) if ai_flights else 0}")

if real_flights:
    print(f"\n   Real Flights (first one):")
    f = real_flights[0]
    print(f"   - Name: {f.get('name')}")
    print(f"   - price: {f.get('price')}")
    print(f"   - total_for_group: {f.get('total_for_group')}")
    print(f"   - price_numeric: {f.get('price_numeric')}")
    print(f"   - total_for_group_numeric: {f.get('total_for_group_numeric')}")

print("\n" + "="*80)
