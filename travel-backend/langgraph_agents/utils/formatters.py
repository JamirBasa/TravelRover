"""
Response formatting utilities for LangGraph agents
"""

from typing import Dict, Any, List, Optional
from decimal import Decimal, ROUND_HALF_UP


def format_price_range(min_price: float, max_price: float, currency: str = "₱") -> str:
    """
    Format a price range for display
    
    Args:
        min_price: Minimum price
        max_price: Maximum price  
        currency: Currency symbol
        
    Returns:
        Formatted price range string
    """
    if min_price == max_price:
        return f"{currency}{min_price:,.0f}"
    
    return f"{currency}{min_price:,.0f} - {currency}{max_price:,.0f}"


def format_hotel_response(hotels: List[Dict[str, Any]], location: str) -> Dict[str, Any]:
    """
    Format hotel search results into standardized response
    
    Args:
        hotels: List of hotel data
        location: Search location
        
    Returns:
        Formatted hotel response
    """
    formatted_hotels = []
    
    for hotel in hotels[:10]:  # Limit to top 10
        formatted_hotel = {
            'name': hotel.get('name', 'Unknown Hotel'),
            'address': hotel.get('vicinity') or hotel.get('formatted_address', location),
            'rating': round(hotel.get('rating', 0), 1),
            'price_level': hotel.get('price_level', 0),
            'price_range': _get_price_range_text(hotel.get('price_level', 0)),
            'distance_from_center': hotel.get('distance_km', 0),
            'amenities': _extract_amenities(hotel),
            'photo_url': hotel.get('photo'),
            'place_id': hotel.get('place_id'),
            'coordinates': {
                'latitude': hotel.get('geometry', {}).get('location', {}).get('lat', 0),
                'longitude': hotel.get('geometry', {}).get('location', {}).get('lng', 0)
            }
        }
        
        # Add recommendation level
        formatted_hotel['recommendation_level'] = _calculate_recommendation_level(hotel)
        
        formatted_hotels.append(formatted_hotel)
    
    return {
        'success': True,
        'location': location,
        'hotels': formatted_hotels,
        'total_found': len(hotels),
        'search_timestamp': _get_current_timestamp(),
        'langgraph_analysis': {
            'top_rated': _find_top_rated(formatted_hotels),
            'best_value': _find_best_value(formatted_hotels),
            'luxury_options': _find_luxury_options(formatted_hotels)
        }
    }


def format_flight_response(flights: List[Dict[str, Any]], search_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format flight search results into standardized response
    
    Args:
        flights: List of flight data
        search_params: Original search parameters
        
    Returns:
        Formatted flight response
    """
    formatted_flights = []
    
    for flight in flights[:20]:  # Limit to top 20
        formatted_flight = {
            'airline': flight.get('airline', 'Unknown Airline'),
            'flight_number': flight.get('flight_number'),
            'departure_time': flight.get('departure_time'),
            'arrival_time': flight.get('arrival_time'),
            'duration': flight.get('duration'),
            'price': flight.get('price', 0),
            'currency': flight.get('currency', 'PHP'),
            'stops': flight.get('stops', 0),
            'aircraft': flight.get('aircraft'),
            'departure_airport': flight.get('departure_airport'),
            'arrival_airport': flight.get('arrival_airport'),
            'booking_link': flight.get('booking_link'),
            'carbon_emissions': flight.get('carbon_emissions')
        }
        
        # Calculate value score
        formatted_flight['value_score'] = _calculate_flight_value_score(flight)
        
        formatted_flights.append(formatted_flight)
    
    return {
        'success': True,
        'flights': formatted_flights,
        'search_params': search_params,
        'current_price': _determine_price_level(formatted_flights),
        'total_found': len(flights),
        'search_timestamp': _get_current_timestamp(),
        'langgraph_analysis': {
            'cheapest_flight': _find_cheapest_flight(formatted_flights),
            'best_value': _find_best_value_flight(formatted_flights),
            'fastest_flight': _find_fastest_flight(formatted_flights),
            'recommended': _get_recommended_flight(formatted_flights)
        }
    }


def _get_price_range_text(price_level: int) -> str:
    """Convert Google Places price level to readable text"""
    price_ranges = {
        0: "Budget (₱1,000-2,500)",
        1: "Budget (₱1,000-2,500)", 
        2: "Mid-range (₱2,500-5,000)",
        3: "Upscale (₱5,000-10,000)",
        4: "Luxury (₱10,000+)"
    }
    return price_ranges.get(price_level, "Price not available")


def _extract_amenities(hotel: Dict[str, Any]) -> List[str]:
    """Extract amenities from hotel data"""
    amenities = []
    
    # Check for common amenities in types
    types = hotel.get('types', [])
    
    if 'spa' in types:
        amenities.append('Spa')
    if 'gym' in types:
        amenities.append('Gym')
    if 'restaurant' in types or 'food' in types:
        amenities.append('Restaurant')
    if 'bar' in types:
        amenities.append('Bar')
    
    # Add standard amenities
    amenities.extend(['Free WiFi', 'Air Conditioning', '24h Reception'])
    
    return amenities


def _calculate_recommendation_level(hotel: Dict[str, Any]) -> str:
    """Calculate recommendation level for hotel"""
    rating = hotel.get('rating', 0)
    price_level = hotel.get('price_level', 0)
    
    if rating >= 4.5:
        return "Highly Recommended"
    elif rating >= 4.0:
        return "Recommended" 
    elif rating >= 3.5:
        return "Good Option"
    else:
        return "Basic Option"


def _find_top_rated(hotels: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find the highest rated hotel"""
    if not hotels:
        return None
    
    return max(hotels, key=lambda h: h.get('rating', 0))


def _find_best_value(hotels: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find the best value hotel (rating vs price)"""
    if not hotels:
        return None
    
    def value_score(hotel):
        rating = hotel.get('rating', 0)
        price_level = hotel.get('price_level', 4)
        return rating / max(price_level, 1)  # Higher rating, lower price = better value
    
    return max(hotels, key=value_score)


def _find_luxury_options(hotels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Find luxury hotel options"""
    return [h for h in hotels if h.get('price_level', 0) >= 3 and h.get('rating', 0) >= 4.0]


def _calculate_flight_value_score(flight: Dict[str, Any]) -> float:
    """Calculate value score for flight based on price, duration, and stops"""
    price = flight.get('price', float('inf'))
    duration_str = flight.get('duration', '0h 0m')
    stops = flight.get('stops', 0)
    
    # Parse duration (assuming format like "2h 30m")
    try:
        duration_parts = duration_str.replace('h', '').replace('m', '').split()
        duration_minutes = int(duration_parts[0]) * 60 + (int(duration_parts[1]) if len(duration_parts) > 1 else 0)
    except:
        duration_minutes = 999  # Default high value for parsing errors
    
    # Calculate score (lower is better for price and duration, stops add penalty)
    if price == 0:
        return 0
        
    score = 1000 / (price + duration_minutes + (stops * 60))
    return round(score, 3)


def _find_cheapest_flight(flights: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find the cheapest flight"""
    if not flights:
        return None
    
    valid_flights = [f for f in flights if f.get('price', 0) > 0]
    if not valid_flights:
        return None
        
    return min(valid_flights, key=lambda f: f.get('price', float('inf')))


def _find_best_value_flight(flights: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find the best value flight"""
    if not flights:
        return None
    
    return max(flights, key=lambda f: f.get('value_score', 0))


def _find_fastest_flight(flights: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find the fastest flight"""
    if not flights:
        return None
    
    def get_duration_minutes(flight):
        duration_str = flight.get('duration', '999h 59m')
        try:
            duration_parts = duration_str.replace('h', '').replace('m', '').split()
            return int(duration_parts[0]) * 60 + (int(duration_parts[1]) if len(duration_parts) > 1 else 0)
        except:
            return 99999
    
    return min(flights, key=get_duration_minutes)


def _get_recommended_flight(flights: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Get the overall recommended flight (best balance of factors)"""
    return _find_best_value_flight(flights)


def _determine_price_level(flights: List[Dict[str, Any]]) -> str:
    """Determine overall price level of flights"""
    if not flights:
        return "unknown"
    
    prices = [f.get('price', 0) for f in flights if f.get('price', 0) > 0]
    if not prices:
        return "unknown"
    
    avg_price = sum(prices) / len(prices)
    
    if avg_price < 10000:
        return "low"
    elif avg_price < 25000:
        return "typical"
    elif avg_price < 50000:
        return "high"
    else:
        return "very_high"


def _get_current_timestamp() -> str:
    """Get current timestamp in ISO format"""
    from django.utils import timezone
    return timezone.now().isoformat()