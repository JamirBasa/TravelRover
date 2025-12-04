# Test flight cost calculation
travelers = 4
flights = [
    {'name': 'Philippine Airlines', 'price': 'P19,948', 'price_numeric': 19948},
    {'name': 'Philippine Airlines', 'price': 'P23,459', 'price_numeric': 23459},
    {'name': 'Cebu Pacific', 'price': 'P31,046', 'price_numeric': 31046}
]

print('Flight Cost Calculation Test')
print('=' * 60)
print(f'Travelers: {travelers}')
print()

total = 0
for i, flight in enumerate(flights, 1):
    price_numeric = flight['price_numeric']
    total_for_group = price_numeric * travelers
    per_person = price_numeric
    
    print(f'Flight {i}: {flight["name"]}')
    print(f'  Per-Person: P{per_person:,}')
    print(f'  x {travelers} travelers = P{total_for_group:,}')
    print()
    
    total += total_for_group

print('=' * 60)
print(f'TOTAL (all flights): P{total:,}')
print(f'Per person (avg): P{total // travelers:,}')
print()
print('CORRECT: Each flight price x travelers, then sum')
print('WRONG WAS: Using per-person price as group total (not multiplying)')
