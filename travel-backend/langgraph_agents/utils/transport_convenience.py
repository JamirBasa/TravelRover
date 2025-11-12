"""
Transport Convenience Classification System
Python port of transportConvenience.js
Determines if ground transport is practical for a route based on travel time and distance
"""

from typing import Dict, Any


# Convenience level thresholds
TRANSPORT_THRESHOLDS = {
    "VERY_CONVENIENT": {
        "max_travel_time": 2,  # hours one-way
        "max_distance": 100,  # kilometers
        "recommendation": "Highly recommended for day trips",
        "user_message": "Quick and convenient ground travel",
        "color": "emerald",
    },
    "CONVENIENT": {
        "max_travel_time": 4,  # hours one-way
        "max_distance": 200,  # kilometers
        "recommendation": "Comfortable ground travel option",
        "user_message": "Manageable travel time, good for multi-day trips",
        "color": "green",
    },
    "ACCEPTABLE": {
        "max_travel_time": 6,  # hours one-way
        "max_distance": 300,  # kilometers
        "recommendation": "Feasible but requires early departure",
        "user_message": "Long but scenic journey - plan for travel day",
        "color": "amber",
    },
    "IMPRACTICAL": {
        "min_travel_time": 6,  # hours one-way
        "min_distance": 300,  # kilometers
        "recommendation": "Flight strongly recommended",
        "user_message": "Ground travel not recommended - consider flying",
        "color": "red",
    },
}


def classify_transport_convenience(route_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Classify transport convenience based on route characteristics
    
    Args:
        route_data: Dictionary containing:
            - travel_time_hours: Travel time in hours
            - distance_km: Distance in kilometers
            - has_overnight_option: If overnight bus available (optional)
            - has_ferry: If ferry connection required (optional)
            - scenic: If route is scenic (optional)
    
    Returns:
        Classification result with level and metadata
    """
    travel_time_hours = route_data.get("travel_time_hours", 0)
    distance_km = route_data.get("distance_km", 0)
    has_overnight_option = route_data.get("has_overnight_option", False)
    has_ferry = route_data.get("has_ferry", False)
    scenic = route_data.get("scenic", False)
    
    # Special case: Ferry routes are standard for island tourism
    if has_ferry:
        if travel_time_hours <= 2:
            return {
                "level": "VERY_CONVENIENT",
                "reason": "Fast ferry connection - typical for island tourism",
                "practical": True,
                "preferred": True,
                **TRANSPORT_THRESHOLDS["VERY_CONVENIENT"],
            }
        elif travel_time_hours <= 5:
            return {
                "level": "CONVENIENT",
                "reason": "Ferry connection available - typical for island travel",
                "practical": True,
                "preferred": True,
                **TRANSPORT_THRESHOLDS["CONVENIENT"],
            }
    
    # Very Convenient: Quick trips
    if (travel_time_hours <= TRANSPORT_THRESHOLDS["VERY_CONVENIENT"]["max_travel_time"] and
        distance_km <= TRANSPORT_THRESHOLDS["VERY_CONVENIENT"]["max_distance"]):
        return {
            "level": "VERY_CONVENIENT",
            "practical": True,
            "preferred": True,
            **TRANSPORT_THRESHOLDS["VERY_CONVENIENT"],
        }
    
    # Convenient: Comfortable travel
    if (travel_time_hours <= TRANSPORT_THRESHOLDS["CONVENIENT"]["max_travel_time"] and
        distance_km <= TRANSPORT_THRESHOLDS["CONVENIENT"]["max_distance"]):
        return {
            "level": "CONVENIENT",
            "practical": True,
            "preferred": True,
            **TRANSPORT_THRESHOLDS["CONVENIENT"],
        }
    
    # Acceptable: Manageable with planning
    if (travel_time_hours <= TRANSPORT_THRESHOLDS["ACCEPTABLE"]["max_travel_time"] and
        distance_km <= TRANSPORT_THRESHOLDS["ACCEPTABLE"]["max_distance"]):
        additional_note = "Scenic route adds travel value" if scenic else None
        return {
            "level": "ACCEPTABLE",
            "practical": True,
            "preferred": False,
            "warning": "Consider overnight stay at destination",
            "additional_note": additional_note,
            **TRANSPORT_THRESHOLDS["ACCEPTABLE"],
        }
    
    # Impractical: Flight recommended
    alternative_suggestion = (
        "Consider overnight bus for budget travel" if has_overnight_option
        else "Break journey into multiple days"
    )
    
    return {
        "level": "IMPRACTICAL",
        "practical": False,
        "preferred": False,
        "warning": "Flight or multi-stop itinerary recommended",
        "alternative_suggestion": alternative_suggestion,
        **TRANSPORT_THRESHOLDS["IMPRACTICAL"],
    }


def get_convenience_display(level: str) -> Dict[str, str]:
    """
    Get user-friendly description of convenience level
    
    Args:
        level: Convenience level (VERY_CONVENIENT, CONVENIENT, etc.)
    
    Returns:
        Dictionary with display labels and icons
    """
    displays = {
        "VERY_CONVENIENT": {
            "label": "Very Convenient",
            "icon": "✅",
            "badge": "Recommended",
            "badge_color": "emerald",
        },
        "CONVENIENT": {
            "label": "Convenient",
            "icon": "👍",
            "badge": "Good Option",
            "badge_color": "green",
        },
        "ACCEPTABLE": {
            "label": "Acceptable",
            "icon": "⚠️",
            "badge": "Plan Ahead",
            "badge_color": "amber",
        },
        "IMPRACTICAL": {
            "label": "Not Recommended",
            "icon": "❌",
            "badge": "Fly Instead",
            "badge_color": "red",
        },
    }
    
    return displays.get(level, displays["IMPRACTICAL"])


def should_prefer_ground_transport(convenience: Dict[str, Any], has_airport: bool) -> bool:
    """
    Determine if ground transport should be the primary recommendation
    
    Args:
        convenience: Convenience classification result
        has_airport: If destination has airport
    
    Returns:
        True if ground transport should be preferred
    """
    # If no airport, ground is only option
    if not has_airport:
        return True
    
    # If marked as preferred, use it
    if convenience.get("preferred", False):
        return True
    
    # Otherwise defer to flight option
    return False
