"""
Regional Transport Context for the Philippines
Python port of regionalTransportContext.js
Provides intelligence about regional transport corridors and connectivity
"""

from typing import Dict, List, Optional, Any


# Regional transport corridor definitions
REGIONAL_TRANSPORT_CONTEXT = {
    "METRO_MANILA": {
        "name": "Metro Manila & Nearby",
        "cities": ["Manila", "Quezon City", "Makati", "Pasig", "Taguig", "Caloocan"],
        "characteristics": {
            "primary_mode": "within_metro",
            "infrastructure_quality": "excellent",
            "tourist_friendly": True,
            "notes": "Within metro - local transport only",
        },
    },
    
    "LUZON_SOUTH": {
        "name": "Southern Luzon",
        "cities": ["Tagaytay", "Batangas", "Lipa", "Lucena", "Naga", "Legazpi", "Sorsogon", "Daet"],
        "hub": "Manila",
        "characteristics": {
            "primary_mode": "bus",
            "infrastructure_quality": "excellent",
            "tourist_friendly": True,
            "scenic_routes": True,
        },
        "recommended_routes": [
            "Manila-Tagaytay",
            "Manila-Batangas",
            "Manila-Lucena",
            "Manila-Naga",
            "Naga-Legazpi",
        ],
        "avoid_routes": [
            "Manila-Legazpi",  # 10 hours, very long
        ],
    },
    
    "LUZON_NORTH": {
        "name": "Northern Luzon",
        "cities": ["Baguio", "Banaue", "Sagada", "Vigan", "Laoag", "La Union", "Bontoc", "Tuguegarao"],
        "hub": "Manila",
        "characteristics": {
            "primary_mode": "bus",
            "infrastructure_quality": "good",
            "tourist_friendly": True,
            "scenic_routes": True,
            "mountain_routes": True,
        },
        "recommended_routes": [
            "Manila-Baguio", 
            "Baguio-Sagada",
            "Manila-Vigan",
            "Vigan-Laoag",
            "Baguio-Vigan",
        ],
        "avoid_routes": [
            "Manila-Laoag",  # 10 hours, very long
            "Manila-Tuguegarao",  # 10 hours, very long
        ],
    },
    
    "LUZON_CENTRAL": {
        "name": "Central Luzon",
        "cities": ["Angeles", "Clark", "Olongapo", "Subic", "Tarlac", "Cabanatuan", "Baler"],
        "hub": "Manila",
        "characteristics": {
            "primary_mode": "bus",
            "infrastructure_quality": "excellent",
            "tourist_friendly": True,
        },
        "recommended_routes": [
            "Manila-Subic", 
            "Manila-Clark",
            "Manila-Angeles",
            "Manila-Baler",
        ],
    },
    
    "MINDANAO_WEST": {
        "name": "Western Mindanao Corridor",
        "cities": ["Zamboanga", "Pagadian", "Dipolog", "Ozamis"],
        "hub": "Zamboanga",
        "characteristics": {
            "primary_mode": "bus",
            "infrastructure_quality": "good",
            "tourist_friendly": True,
            "scenic_routes": True,
            "coastal_highway": True,
        },
        "recommended_routes": [
            "Zamboanga-Pagadian",
            "Pagadian-Dipolog",
            "Dipolog-Ozamis",
        ],
        "avoid_routes": [
            "Zamboanga-Cagayan de Oro",  # Too long (11+ hours)
        ],
        "notes": "Well-connected coastal corridor. Avoid cross-island routes to Northern Mindanao.",
    },
    
    "MINDANAO_SOUTH": {
        "name": "Southern Mindanao Corridor",
        "cities": ["Davao", "General Santos", "Digos", "Tagum", "Koronadal", "Kidapawan", "Mati", "Cotabato", "Tacurong"],
        "hub": "Davao",
        "characteristics": {
            "primary_mode": "bus",
            "infrastructure_quality": "excellent",
            "tourist_friendly": True,
        },
        "recommended_routes": [
            "Davao-General Santos",
            "Davao-Tagum",
            "Davao-Digos",
            "Davao-Mati",
            "General Santos-Koronadal",
        ],
    },
    
    "MINDANAO_NORTH": {
        "name": "Northern Mindanao Corridor",
        "cities": ["Cagayan de Oro", "Iligan", "Butuan", "Valencia", "Malaybalay", "Camiguin", "Surigao", "Siargao", "Marawi"],
        "hub": "Cagayan de Oro",
        "characteristics": {
            "primary_mode": "bus",
            "infrastructure_quality": "good",
            "tourist_friendly": True,
        },
        "recommended_routes": [
            "Cagayan de Oro-Iligan",
            "Cagayan de Oro-Valencia",
            "Cagayan de Oro-Butuan",
            "Cagayan de Oro-Malaybalay",
            "Butuan-Surigao",
            "Surigao-Siargao",
        ],
    },
    
    "VISAYAS_CENTRAL": {
        "name": "Central Visayas",
        "cities": ["Cebu", "Mandaue", "Lapu-Lapu", "Tagbilaran", "Dumaguete", "Bohol", "Panglao", "Carmen", "Ormoc", "Silay"],
        "hub": "Cebu",
        "characteristics": {
            "primary_mode": "ferry",
            "infrastructure_quality": "excellent",
            "tourist_friendly": True,
            "island_hopping": True,
            "scenic_routes": True,
        },
        "recommended_routes": [
            "Cebu-Bohol", 
            "Cebu-Dumaguete",
            "Cebu-Ormoc",
            "Bacolod-Dumaguete",
            "Tagbilaran-Panglao",
        ],
        "notes": "Ferry connections are the norm - fast and tourist-friendly",
    },
    
    "VISAYAS_WESTERN": {
        "name": "Western Visayas",
        "cities": ["Iloilo", "Bacolod", "Kalibo", "Boracay", "Roxas", "Caticlan"],
        "hub": "Iloilo",
        "characteristics": {
            "primary_mode": "ferry",
            "infrastructure_quality": "good",
            "tourist_friendly": True,
            "island_hopping": True,
        },
        "recommended_routes": [
            "Iloilo-Bacolod",
            "Iloilo-Kalibo",
            "Kalibo-Caticlan",
            "Iloilo-Roxas",
        ],
    },
    
    "VISAYAS_EASTERN": {
        "name": "Eastern Visayas",
        "cities": ["Tacloban", "Ormoc", "Catbalogan", "Maasin"],
        "hub": "Tacloban",
        "characteristics": {
            "primary_mode": "bus",
            "infrastructure_quality": "good",
            "tourist_friendly": True,
        },
        "recommended_routes": [
            "Cebu-Ormoc",
            "Tacloban-Ormoc",
            "Tacloban-Catbalogan",
            "Ormoc-Maasin",
        ],
    },
    
    "PALAWAN": {
        "name": "Palawan",
        "cities": ["Puerto Princesa", "El Nido", "Coron", "San Vicente", "Sabang"],
        "hub": "Puerto Princesa",
        "characteristics": {
            "primary_mode": "van",
            "infrastructure_quality": "fair",
            "tourist_friendly": True,
            "scenic_routes": True,
            "limited_service": True,
        },
        "recommended_routes": [
            "Puerto Princesa-El Nido",
            "Puerto Princesa-Sabang",
            "Puerto Princesa-San Vicente",
        ],
        "notes": "Long van rides common. Puerto Princesa to El Nido = 5-6 hours but scenic.",
    },
    
    "MINDORO": {
        "name": "Mindoro",
        "cities": ["Calapan", "Puerto Galera"],
        "hub": "Calapan",
        "characteristics": {
            "primary_mode": "ferry+bus",
            "infrastructure_quality": "fair",
            "tourist_friendly": True,
            "scenic_routes": True,
        },
        "recommended_routes": [
            "Batangas-Calapan",
            "Batangas-Puerto Galera",
        ],
        "notes": "Access via ferry from Batangas",
    },
}


def find_regional_context(city_name: str) -> Optional[Dict[str, Any]]:
    """
    Find which regional corridor a city belongs to
    
    Args:
        city_name: City to lookup
    
    Returns:
        Regional context dict or None
    """
    if not city_name:
        return None
    
    def normalize_city(city):
        return city.strip().lower().replace("  ", " ")
    
    norm_city = normalize_city(city_name)
    
    for region_key, region_data in REGIONAL_TRANSPORT_CONTEXT.items():
        has_city_match = any(
            normalize_city(city) == norm_city
            for city in region_data["cities"]
        )
        
        if has_city_match:
            return {
                "region_key": region_key,
                **region_data,
            }
    
    return None


def is_regional_transport_practical(city1: str, city2: str) -> Dict[str, Any]:
    """
    Check if two cities are in the same regional transport corridor
    
    Args:
        city1: First city
        city2: Second city
    
    Returns:
        Regional relationship info
    """
    region1 = find_regional_context(city1)
    region2 = find_regional_context(city2)
    
    # If either city not in database
    if not region1 or not region2:
        return {
            "same_region": False,
            "recommendation": "Inter-regional travel - check specific route distances and times",
            "both_regions_found": bool(region1 and region2),
        }
    
    # Same region
    if region1["region_key"] == region2["region_key"]:
        # Check if route is in avoid list
        route_key = f"{city1}-{city2}"
        reverse_key = f"{city2}-{city1}"
        
        avoid_routes = region1.get("avoid_routes", [])
        is_avoided = any(
            route.lower() == route_key.lower() or route.lower() == reverse_key.lower()
            for route in avoid_routes
        )
        
        recommended_routes = region1.get("recommended_routes", [])
        is_recommended = any(
            route.lower() == route_key.lower() or route.lower() == reverse_key.lower()
            for route in recommended_routes
        )
        
        recommendation = (
            f"⚠️ Not recommended within {region1['name']} - consider flying or breaking journey"
            if is_avoided
            else (
                f"✅ {region1['characteristics']['primary_mode']} travel recommended within {region1['name']}"
                if is_recommended
                else f"{region1['characteristics']['primary_mode']} travel available within {region1['name']}"
            )
        )
        
        return {
            "same_region": True,
            "region": region1["name"],
            "is_recommended": is_recommended,
            "is_avoided": is_avoided,
            "characteristics": region1["characteristics"],
            "recommendation": recommendation,
            "hub": region1.get("hub"),
        }
    
    # Different regions
    return {
        "same_region": False,
        "region1": region1["name"],
        "region2": region2["name"],
        "recommendation": f"Inter-regional travel from {region1['name']} to {region2['name']} - check specific route or consider flying",
        "hub1": region1.get("hub"),
        "hub2": region2.get("hub"),
    }


def check_geographic_boundaries(city1: str, city2: str) -> Dict[str, Any]:
    """
    Check if route crosses major geographic boundaries (e.g., inter-island)
    
    Args:
        city1: First city
        city2: Second city
    
    Returns:
        Boundary crossing info
    """
    region1 = find_regional_context(city1)
    region2 = find_regional_context(city2)
    
    if not region1 or not region2:
        return {"crosses_boundary": False, "boundary_type": None}
    
    r1_key = region1["region_key"]
    r2_key = region2["region_key"]
    
    # Define major island groups
    luzon_regions = ["METRO_MANILA", "LUZON_SOUTH", "LUZON_NORTH", "LUZON_CENTRAL"]
    visayas_regions = ["VISAYAS_CENTRAL", "VISAYAS_WESTERN", "VISAYAS_EASTERN"]
    mindanao_regions = ["MINDANAO_WEST", "MINDANAO_SOUTH", "MINDANAO_NORTH"]
    
    is_luzon1 = r1_key in luzon_regions
    is_luzon2 = r2_key in luzon_regions
    is_visayas1 = r1_key in visayas_regions
    is_visayas2 = r2_key in visayas_regions
    is_mindanao1 = r1_key in mindanao_regions
    is_mindanao2 = r2_key in mindanao_regions
    
    # Check for inter-island crossings
    if (is_luzon1 and is_visayas2) or (is_visayas1 and is_luzon2):
        return {
            "crosses_boundary": True,
            "boundary_type": "Luzon-Visayas",
            "recommendation": "Flight or long ferry required",
        }
    
    if (is_luzon1 and is_mindanao2) or (is_mindanao1 and is_luzon2):
        return {
            "crosses_boundary": True,
            "boundary_type": "Luzon-Mindanao",
            "recommendation": "Flight required",
        }
    
    if (is_visayas1 and is_mindanao2) or (is_mindanao1 and is_visayas2):
        return {
            "crosses_boundary": True,
            "boundary_type": "Visayas-Mindanao",
            "recommendation": "Flight or ferry required",
        }
    
    return {
        "crosses_boundary": False,
        "boundary_type": "same-island-group",
        "recommendation": "Ground transport may be available",
    }
