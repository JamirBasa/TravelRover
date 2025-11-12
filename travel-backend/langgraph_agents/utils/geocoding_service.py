"""
Philippine Location Geocoding Service
Provides coordinates and distance calculations for Philippine cities
Supports both hardcoded major cities and dynamic Google Geocoding API lookups
"""

import requests
import logging
from typing import Dict, Tuple, Optional
from math import radians, cos, sin, asin, sqrt
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Hardcoded coordinates for major Philippine cities (fast lookup)
# Format: 'city_name': (latitude, longitude)
MAJOR_CITY_COORDINATES = {
    # NCR Metro Manila
    'manila': (14.5995, 120.9842),
    'quezon city': (14.6760, 121.0437),
    'makati': (14.5547, 121.0244),
    'taguig': (14.5176, 121.0509),
    'pasig': (14.5764, 121.0851),
    'mandaluyong': (14.5794, 121.0359),
    'caloocan': (14.6507, 120.9830),
    'las piñas': (14.4483, 120.9830),
    'parañaque': (14.4793, 121.0198),
    
    # CAR - Cordillera
    'baguio': (16.4023, 120.5960),
    'baguio city': (16.4023, 120.5960),
    'la trinidad': (16.4540, 120.5928),
    'sagada': (17.0833, 120.9000),
    'banaue': (16.9260, 121.0579),
    
    # Region I - Ilocos
    'laoag': (18.1987, 120.5937),
    'vigan': (17.5747, 120.3869),
    'san fernando': (16.6158, 120.3209),
    'dagupan': (16.0433, 120.3341),
    'alaminos': (16.1551, 119.9823),
    
    # Region II - Cagayan Valley
    'tuguegarao': (17.6132, 121.7270),
    'santiago': (16.6875, 121.5467),
    'ilagan': (17.1464, 121.8893),
    
    # Region III - Central Luzon
    'clark': (15.1859, 120.5600),
    'angeles': (15.1450, 120.5887),
    'olongapo': (14.8295, 120.2824),
    'subic': (14.8787, 120.2723),
    'tarlac': (15.4755, 120.5964),
    'san jose': (15.7889, 120.9950),
    'cabanatuan': (15.4860, 120.9670),
    
    # Region IV-A - CALABARZON
    'batangas': (13.7565, 121.0583),
    'batangas city': (13.7565, 121.0583),
    'lipa': (13.9411, 121.1624),
    'tagaytay': (14.1050, 120.9609),
    'lucena': (13.9372, 121.6174),
    'santa cruz': (14.2794, 121.4161),
    'antipolo': (14.5863, 121.1758),
    'cavite': (14.4791, 120.8965),
    'imus': (14.4297, 120.9367),
    'dasmariñas': (14.3294, 120.9366),
    
    # Region IV-B - MIMAROPA
    'puerto princesa': (9.7421, 118.7594),
    'puerto galera': (13.5060, 120.9540),
    'coron': (12.0005, 120.2070),
    'el nido': (11.1940, 119.4010),
    'san jose': (12.3521, 121.0685),
    'calapan': (13.4117, 121.1803),
    
    # Region V - Bicol
    'legazpi': (13.1391, 123.7436),
    'naga': (13.6218, 123.1948),
    'daet': (14.1114, 122.9548),
    'sorsogon': (12.9740, 124.0070),
    'daraga': (13.1597, 123.6947),
    
    # Region VI - Western Visayas
    'iloilo': (10.7202, 122.5621),
    'iloilo city': (10.7202, 122.5621),
    'bacolod': (10.6770, 122.9500),
    'roxas': (11.5854, 122.7511),
    'kalibo': (11.7100, 122.3700),
    'boracay': (11.9674, 121.9248),
    'guimaras': (10.5930, 122.6320),
    
    # Region VII - Central Visayas
    'cebu': (10.3157, 123.8854),
    'cebu city': (10.3157, 123.8854),
    'mandaue': (10.3237, 123.9227),
    'lapu-lapu': (10.3103, 123.9494),
    'tagbilaran': (9.6476, 123.8538),
    'dumaguete': (9.3068, 123.3054),
    'toledo': (10.3777, 123.6388),
    'bogo': (11.0501, 124.0056),
    'moalboal': (9.9477, 123.3930),
    'oslob': (9.5169, 123.3910),
    'siquijor': (9.1997, 123.5904),
    'bohol': (9.8500, 124.1435),
    
    # Region VIII - Eastern Visayas
    'tacloban': (11.2444, 125.0039),
    'ormoc': (11.0059, 124.6075),
    'catbalogan': (11.7751, 124.8858),
    'borongan': (11.6051, 125.4331),
    'maasin': (10.1300, 124.8400),
    
    # Region IX - Zamboanga Peninsula
    'zamboanga': (6.9214, 122.0790),
    'zamboanga city': (6.9214, 122.0790),
    'pagadian': (7.8250, 123.4392),
    'dipolog': (8.5800, 123.3422),
    'dapitan': (8.6581, 123.4231),
    'isabela': (6.7067, 121.9742),
    
    # Region X - Northern Mindanao
    'cagayan de oro': (8.4542, 124.6319),
    'iligan': (8.2280, 124.2453),
    'malaybalay': (8.1538, 125.1275),
    'valencia': (7.9069, 125.0939),
    'ozamiz': (8.1489, 123.8414),
    'oroquieta': (8.4864, 123.8025),
    'tangub': (8.0644, 123.7467),
    'gingoog': (8.8267, 125.1014),
    
    # Region XI - Davao
    'davao': (7.0731, 125.6128),
    'davao city': (7.0731, 125.6128),
    'tagum': (7.4479, 125.8078),
    'digos': (6.7497, 125.3569),
    'mati': (6.9549, 126.2173),
    'panabo': (7.3072, 125.6836),
    
    # Region XII - SOCCSKSARGEN
    'general santos': (6.1164, 125.1716),
    'gensan': (6.1164, 125.1716),
    'koronadal': (6.5008, 124.8469),
    'tacurong': (6.6906, 124.6739),
    'kidapawan': (7.0089, 125.0892),
    'surallah': (6.3767, 124.7378),
    
    # Region XIII - Caraga
    'butuan': (8.9475, 125.5406),
    'surigao': (9.7857, 125.4908),
    'tandag': (9.0783, 126.1992),
    'bislig': (8.2062, 126.3214),
    
    # BARMM - Bangsamoro
    'cotabato': (7.2231, 124.2452),
    'cotabato city': (7.2231, 124.2452),
    'marawi': (7.9986, 124.2928),
    'lamitan': (6.6500, 122.1333),
    'jolo': (6.0543, 121.0030),
    
    # Popular Tourist Destinations
    'siargao': (9.8600, 126.0460),
    'camiguin': (9.1736, 124.7297),
    'malapascua': (11.3267, 124.1150),
}


def get_city_coordinates(city_name: str, use_api: bool = True) -> Optional[Tuple[float, float]]:
    """
    Get coordinates for a Philippine city
    
    Args:
        city_name: Name of the city
        use_api: Whether to use Google Geocoding API if not in hardcoded list
    
    Returns:
        (latitude, longitude) or None if not found
    """
    if not city_name or not city_name.strip():
        return None
    
    normalized = city_name.lower().strip()
    
    # Remove common suffixes for better matching
    normalized = normalized.replace(' city', '').replace(' municipality', '').strip()
    
    # Check hardcoded list first (instant, free)
    if normalized in MAJOR_CITY_COORDINATES:
        logger.info(f"✅ Found {city_name} in hardcoded coordinates")
        return MAJOR_CITY_COORDINATES[normalized]
    
    # Check cache (avoid repeated API calls)
    cache_key = f"geocode_ph_{normalized.replace(' ', '_')}"
    cached = cache.get(cache_key)
    if cached:
        logger.info(f"✅ Found {city_name} in cache")
        return cached
    
    # Call Google Geocoding API if enabled
    if use_api:
        try:
            from django.conf import settings
            
            # Check if API key is configured
            api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', None)
            if not api_key:
                logger.warning("⚠️ Google Maps API key not configured")
                return None
            
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': f"{city_name}, Philippines",
                'key': api_key,
                'components': 'country:PH'
            }
            
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                location = data['results'][0]['geometry']['location']
                coords = (location['lat'], location['lng'])
                
                # Cache for 30 days (coordinates don't change)
                cache.set(cache_key, coords, 60 * 60 * 24 * 30)
                logger.info(f"✅ Geocoded {city_name} via API: {coords}")
                return coords
            else:
                logger.warning(f"⚠️ Geocoding API returned: {data['status']} for {city_name}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Geocoding API error for {city_name}: {str(e)}")
            return None
    
    logger.warning(f"⚠️ Could not find coordinates for {city_name}")
    return None


def calculate_haversine_distance(
    lat1: float, lon1: float, 
    lat2: float, lon2: float
) -> float:
    """
    Calculate great-circle distance between two points on Earth
    Uses the Haversine formula
    
    Args:
        lat1, lon1: Coordinates of first point
        lat2, lon2: Coordinates of second point
    
    Returns:
        Distance in kilometers (rounded to 1 decimal)
    """
    # Convert to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Earth's radius in kilometers
    km = 6371 * c
    
    return round(km, 1)


def estimate_road_distance(
    straight_distance_km: float,
    terrain_type: str = 'normal'
) -> float:
    """
    Estimate actual road distance from straight-line distance
    Applies circuity factors based on terrain and road conditions
    
    Args:
        straight_distance_km: Straight-line distance
        terrain_type: Type of terrain (island, mountainous, highway, urban, normal)
    
    Returns:
        Estimated road distance in kilometers
    """
    # Circuity factors based on Philippine road conditions
    CIRCUITY_FACTORS = {
        'island': 1.5,       # Ferry routes + island roads (indirect)
        'mountainous': 1.6,  # Winding mountain roads (Cordillera, Sierra Madre)
        'urban': 1.3,        # City grid with detours (Metro Manila, Cebu)
        'highway': 1.2,      # Expressways (NLEX, SLEX, TPLEX, SCTEX)
        'normal': 1.4,       # Standard provincial roads
        'coastal': 1.35,     # Coastal roads (follows coastline)
    }
    
    factor = CIRCUITY_FACTORS.get(terrain_type, 1.4)
    road_distance = straight_distance_km * factor
    
    return round(road_distance, 1)


def estimate_travel_time(
    distance_km: float,
    terrain_type: str = 'normal',
    transport_mode: str = 'bus'
) -> float:
    """
    Estimate travel time in hours based on distance, terrain, and transport mode
    Based on typical Philippine transport conditions
    
    Args:
        distance_km: Road distance in kilometers
        terrain_type: Type of terrain
        transport_mode: Mode of transport (bus, van, ferry, private)
    
    Returns:
        Estimated travel time in hours (rounded to 1 decimal)
    """
    # Average speeds (km/h) for different terrain types in the Philippines
    SPEEDS = {
        'highway': {
            'bus': 60,
            'van': 65,
            'private': 70,
            'car': 70,
        },
        'normal': {
            'bus': 50,
            'van': 55,
            'private': 60,
            'car': 60,
        },
        'mountainous': {
            'bus': 35,
            'van': 40,
            'private': 45,
            'car': 45,
        },
        'urban': {
            'bus': 25,
            'van': 30,
            'private': 35,
            'car': 35,
        },
        'coastal': {
            'bus': 45,
            'van': 50,
            'private': 55,
            'car': 55,
        },
        'island': {
            'ferry': 30,
            'boat': 25,
            'fastcraft': 40,
        },
    }
    
    terrain_speeds = SPEEDS.get(terrain_type, SPEEDS['normal'])
    speed = terrain_speeds.get(transport_mode, 50)
    
    # Calculate base travel time
    travel_time = distance_km / speed
    
    # Add buffer for stops, traffic, loading/unloading
    if transport_mode in ['bus', 'van']:
        travel_time *= 1.2  # 20% buffer for passenger stops
    elif transport_mode in ['ferry', 'boat']:
        travel_time *= 1.15  # 15% buffer for boarding/docking
    
    return round(travel_time, 1)


def estimate_travel_cost(
    distance_km: float,
    transport_mode: str = 'bus',
    comfort_level: str = 'standard'
) -> str:
    """
    Estimate travel cost based on distance and transport mode
    Based on typical Philippine transport fares (2024-2025)
    
    Args:
        distance_km: Road distance in kilometers
        transport_mode: Mode of transport
        comfort_level: Comfort level (standard, deluxe, premium)
    
    Returns:
        Cost estimate string (e.g., "₱500-700")
    """
    # Cost per kilometer in Philippine pesos
    COST_PER_KM = {
        'bus': {
            'standard': 1.5,      # Regular aircon bus
            'deluxe': 2.0,        # Deluxe bus (Victory Liner, Genesis)
            'premium': 2.5,       # Premium sleeper bus
        },
        'van': {
            'standard': 2.0,      # Regular van
            'deluxe': 2.5,        # Express van
            'premium': 3.0,       # Private van hire
        },
        'ferry': {
            'standard': 3.0,      # Economy class
            'deluxe': 5.0,        # Tourist class
            'premium': 8.0,       # Business/stateroom
        },
        'private': {
            'standard': 8.0,      # Car rental with driver
            'deluxe': 12.0,       # SUV rental
            'premium': 20.0,      # Premium vehicle
        },
    }
    
    mode_costs = COST_PER_KM.get(transport_mode, COST_PER_KM['bus'])
    cost_per_km = mode_costs.get(comfort_level, mode_costs['standard'])
    
    # Calculate cost range (±15% variation)
    base_cost = distance_km * cost_per_km
    min_cost = int(base_cost * 0.85)
    max_cost = int(base_cost * 1.15)
    
    # Round to nearest 50 for readability
    min_cost = round(min_cost / 50) * 50
    max_cost = round(max_cost / 50) * 50
    
    return f"₱{min_cost:,}-{max_cost:,}"


def determine_terrain_type(city1: str, city2: str) -> str:
    """
    Determine terrain type based on city names and geographic knowledge
    
    Args:
        city1, city2: City names
    
    Returns:
        Terrain type string
    """
    c1_lower = city1.lower()
    c2_lower = city2.lower()
    
    # Island provinces (require ferry or are island-bound)
    ISLAND_CITIES = [
        'siargao', 'camiguin', 'siquijor', 'guimaras', 'boracay',
        'palawan', 'coron', 'el nido', 'puerto princesa', 'puerto galera',
        'bohol', 'panglao', 'malapascua', 'bantayan', 'jolo', 'basilan',
        'marinduque', 'romblon', 'catanduanes', 'biliran'
    ]
    
    # Mountainous areas (Cordillera, upland regions)
    MOUNTAIN_CITIES = [
        'baguio', 'sagada', 'banaue', 'ifugao', 'benguet', 'la trinidad',
        'mountain province', 'kalinga', 'apayao', 'bontoc', 'tabuk',
        'malaybalay', 'valencia', 'bukidnon', 'davao', 'kidapawan'
    ]
    
    # Major highway routes (expressways)
    HIGHWAY_ROUTES = [
        ('manila', 'baguio'),  # TPLEX
        ('manila', 'batangas'),  # SLEX/STAR
        ('manila', 'clark'),  # NLEX
        ('manila', 'angeles'),  # NLEX
        ('manila', 'subic'),  # SCTEX
        ('manila', 'tarlac'),  # TPLEX
        ('manila', 'dagupan'),  # TPLEX
        ('quezon city', 'baguio'),  # TPLEX
    ]
    
    # Metro Manila cities
    METRO_MANILA = [
        'manila', 'quezon city', 'makati', 'taguig', 'pasig', 'mandaluyong',
        'caloocan', 'las piñas', 'parañaque', 'muntinlupa', 'pasay',
        'malabon', 'navotas', 'valenzuela', 'marikina', 'san juan'
    ]
    
    # Check if any city is on an island (requires ferry)
    for island in ISLAND_CITIES:
        if island in c1_lower or island in c2_lower:
            return 'island'
    
    # Check if mountainous
    for mountain in MOUNTAIN_CITIES:
        if mountain in c1_lower or mountain in c2_lower:
            return 'mountainous'
    
    # Check if on major highway
    route_tuple = tuple(sorted([c1_lower.replace(' city', ''), c2_lower.replace(' city', '')]))
    for hw_route in HIGHWAY_ROUTES:
        hw_sorted = tuple(sorted(hw_route))
        if route_tuple == hw_sorted:
            return 'highway'
    
    # Check if within Metro Manila
    if any(metro in c1_lower for metro in METRO_MANILA) and any(metro in c2_lower for metro in METRO_MANILA):
        return 'urban'
    
    # Default to normal provincial roads
    return 'normal'


def calculate_route_estimates(
    origin: str,
    destination: str,
    use_api: bool = True
) -> Optional[Dict[str, any]]:
    """
    Calculate complete route estimates between two cities
    
    Args:
        origin: Origin city name
        destination: Destination city name
        use_api: Whether to use Google Geocoding API
    
    Returns:
        Dict with distance, time, cost estimates or None if calculation fails
    """
    # Get coordinates
    origin_coords = get_city_coordinates(origin, use_api=use_api)
    dest_coords = get_city_coordinates(destination, use_api=use_api)
    
    if not origin_coords or not dest_coords:
        logger.warning(f"⚠️ Could not get coordinates for {origin} → {destination}")
        return None
    
    # Calculate straight-line distance
    straight_distance = calculate_haversine_distance(
        origin_coords[0], origin_coords[1],
        dest_coords[0], dest_coords[1]
    )
    
    # Determine terrain type
    terrain = determine_terrain_type(origin, destination)
    
    # Estimate road distance
    road_distance = estimate_road_distance(straight_distance, terrain)
    
    # Estimate travel time (for bus)
    travel_time = estimate_travel_time(road_distance, terrain, 'bus')
    
    # Estimate cost
    cost_estimate = estimate_travel_cost(road_distance, 'bus', 'standard')
    
    return {
        'origin': origin,
        'destination': destination,
        'straight_distance': straight_distance,
        'road_distance': road_distance,
        'terrain': terrain,
        'travel_time': travel_time,
        'cost': cost_estimate,
        'calculated': True,
        'confidence': 'medium',
        'origin_coords': origin_coords,
        'dest_coords': dest_coords,
    }
