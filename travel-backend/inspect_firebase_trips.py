"""
Quick script to inspect Firebase trip structure
"""
import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Get one trip to inspect structure
trips_ref = db.collection('AITrips')
query = trips_ref.limit(1)
trips = query.stream()

print("\n" + "="*80)
print("FIREBASE TRIP STRUCTURE INSPECTION")
print("="*80 + "\n")

for trip_doc in trips:
    trip_data = trip_doc.to_dict()
    print(f"Trip ID: {trip_doc.id}\n")
    print(json.dumps(trip_data, indent=2, default=str))
    break

print("\n" + "="*80)
