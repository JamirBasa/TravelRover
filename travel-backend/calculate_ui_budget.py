"""
UI Budget Calculator - Python replica of frontend calculateTotalBudget()
Calculates the exact same budget values that users see in the UI
"""

def parse_price(price_str):
    """Parse price string to float (e.g., '₱5,898' -> 5898.0)"""
    if isinstance(price_str, (int, float)):
        return float(price_str)
    if not price_str or price_str == 'Free':
        return 0.0
    
    # Remove currency symbols, commas, whitespace
    cleaned = str(price_str).replace('₱', '').replace(',', '').replace(' ', '').strip()
    try:
        return float(cleaned)
    except:
        return 0.0


def calculate_activities_cost(itinerary):
    """Calculate total activities cost from itinerary"""
    if not itinerary or not isinstance(itinerary, list):
        return 0.0
    
    total = 0.0
    for day in itinerary:
        if not isinstance(day, dict):
            continue
        
        activities = day.get('activities', [])
        if not isinstance(activities, list):
            continue
            
        for activity in activities:
            if not isinstance(activity, dict):
                continue
            
            # Try different price field names
            price = activity.get('ticketPricing') or activity.get('price') or activity.get('cost') or 0
            total += parse_price(price)
    
    return total


def calculate_hotels_cost(hotels, num_nights):
    """Calculate total hotel cost"""
    if not hotels or not isinstance(hotels, list):
        return 0.0
    
    total = 0.0
    for hotel in hotels:
        if not isinstance(hotel, dict):
            continue
        
        # Get price per night
        price = hotel.get('price') or hotel.get('pricePerNight') or 0
        price_numeric = parse_price(price)
        
        # Multiply by nights (hotels usually show per-night price)
        total += price_numeric * num_nights
    
    return total


def calculate_flights_cost(flights, travelers=1):
    """Calculate cheapest flight cost (UI shows cheapest option)"""
    if not flights or not isinstance(flights, list):
        return 0.0
    
    # Find cheapest flight option
    cheapest = None
    cheapest_price = float('inf')
    
    for flight in flights:
        if not isinstance(flight, dict):
            continue
        
        # Try different price fields (prioritize group total if available)
        price = (flight.get('total_for_group_numeric') or 
                flight.get('total_for_group') or 
                flight.get('price_numeric') or 
                flight.get('price') or 0)
        
        price_numeric = parse_price(price)
        
        if price_numeric > 0 and price_numeric < cheapest_price:
            cheapest_price = price_numeric
            cheapest = flight
    
    return cheapest_price if cheapest_price != float('inf') else 0.0


def calculate_ui_total_budget(trip_doc):
    """
    Calculate total budget exactly as the UI does
    Replicates frontend's calculateTotalBudget() function
    
    Returns: dict with {total, breakdown: {activities, hotels, flights}}
    """
    breakdown = {
        'activities': 0.0,
        'hotels': 0.0,
        'flights': 0.0
    }
    
    trip_data = trip_doc.get('tripData', {})
    
    # 1. ACTIVITIES COST
    itinerary = trip_data.get('itinerary_data') or trip_data.get('itinerary', [])
    breakdown['activities'] = calculate_activities_cost(itinerary)
    
    # 2. HOTELS COST
    duration = trip_doc.get('userSelection', {}).get('duration') or 1
    num_nights = max(1, duration - 1)
    
    # Check if user opted out of hotel search
    hotel_search_requested = trip_doc.get('hotelSearchRequested', True)
    
    if hotel_search_requested:
        # Prioritize real hotel data over AI estimates
        hotels = None
        if trip_doc.get('realHotelData', {}).get('hotels'):
            hotels = trip_doc['realHotelData']['hotels']
        elif trip_data.get('hotels'):
            hotels = trip_data['hotels']
        
        breakdown['hotels'] = calculate_hotels_cost(hotels, num_nights)
    
    # 3. FLIGHTS COST
    travelers = trip_doc.get('userSelection', {}).get('travelers', 1)
    travelers_num = int(travelers) if isinstance(travelers, (int, str)) else 1
    
    # Prioritize real flight data over AI estimates
    flights = None
    if trip_doc.get('realFlightData', {}).get('flights'):
        flights = trip_doc['realFlightData']['flights']
    elif trip_data.get('flights'):
        flights = trip_data['flights']
    
    breakdown['flights'] = calculate_flights_cost(flights, travelers_num)
    
    # TOTAL
    total = breakdown['activities'] + breakdown['hotels'] + breakdown['flights']
    
    return {
        'total': total,
        'breakdown': breakdown
    }
