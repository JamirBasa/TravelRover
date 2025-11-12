"""
Transport Mode Agent for LangGraph
Analyzes ground transport viability and recommends optimal transport modes
Enhanced with geocoding fallback for comprehensive Philippine coverage
"""

import logging
from typing import Dict, Any, Optional
from .base_agent import BaseAgent
from ..data.ground_transport_routes import find_ground_route, has_ground_route
from ..utils.transport_convenience import classify_transport_convenience, should_prefer_ground_transport
from ..data.regional_transport_context import (
    is_regional_transport_practical,
    check_geographic_boundaries,
    find_regional_context
)
from ..utils.geocoding_service import calculate_route_estimates

logger = logging.getLogger(__name__)


class TransportModeAgent(BaseAgent):
    """
    LangGraph Transport Mode Agent
    Determines the most appropriate transport mode for a route
    """
    
    # Transport mode constants
    TRANSPORT_MODES = {
        "FLIGHT": "flight",
        "BUS": "bus",
        "FERRY": "ferry",
        "VAN": "van",
        "PRIVATE_TRANSFER": "private_transfer",
        "COMBINATION": "combination",
        "RORO": "roro",
        "GROUND_PREFERRED": "ground_preferred",
        "FLIGHT_REQUIRED": "flight_required",
    }
    
    def __init__(self, session_id: str):
        super().__init__(session_id, 'transport_mode')
    
    def analyze_transport_mode(
        self, 
        destination: str, 
        departure_city: str, 
        include_flights: bool = True
    ) -> Dict[str, Any]:
        """
        Determine the most appropriate transport mode for a route
        
        Args:
            destination: Destination city
            departure_city: Departure city
            include_flights: Whether user wants flight search
        
        Returns:
            Transport mode analysis with recommendations
        """
        try:
            logger.info(f"🚌 Analyzing transport mode: {departure_city} → {destination}")
            
            # Validate inputs
            if not destination or not departure_city:
                return self._create_invalid_input_result()
            
            # Normalize city names
            norm_destination = destination.strip()
            norm_departure = departure_city.strip()
            
            # Check if same city
            if norm_destination.lower() == norm_departure.lower():
                return self._create_same_city_result()
            
            # Step 1: Check documented ground transport routes (PRIMARY)
            ground_route = find_ground_route(norm_departure, norm_destination)
            
            # Step 2: If no documented route, calculate using geocoding (SECONDARY)
            calculated_route = None
            if not ground_route:
                logger.info(f"🔍 No documented route found, calculating: {norm_departure} → {norm_destination}")
                calculated_route = calculate_route_estimates(norm_departure, norm_destination, use_api=True)
                if calculated_route:
                    logger.info(f"✅ Calculated route: {calculated_route['road_distance']}km, {calculated_route['travel_time']}hrs")
            
            # Step 3: Check regional context
            regional_context = is_regional_transport_practical(norm_departure, norm_destination)
            
            # Step 4: Check geographic boundaries
            boundary_check = check_geographic_boundaries(norm_departure, norm_destination)
            
            # ========== DECISION LOGIC ==========
            
            # Case 1: Documented ground route exists (highest confidence)
            if ground_route:
                convenience = classify_transport_convenience({
                    "travel_time_hours": ground_route["travel_time"],
                    "distance_km": ground_route["distance"],
                    "has_overnight_option": ground_route.get("has_overnight_option", False),
                    "has_ferry": ground_route.get("has_ferry", False),
                    "scenic": ground_route.get("scenic", False),
                })
                
                # Sub-case 1a: IMPRACTICAL (e.g., Zamboanga-CDO)
                # ✅ CHECK: If route has "practical" flag, treat as ground_preferred even if time exceeds threshold
                if ground_route.get("practical", False):
                    logger.info(f"✅ Ground transport preferred (practical override): {ground_route['travel_time']} hours with excellent service")
                    return self._create_ground_preferred_result(ground_route, convenience, regional_context)
                elif convenience["level"] == "IMPRACTICAL" or ground_route.get("impractical", False):
                    logger.info(f"⚠️ Ground transport impractical: {ground_route['travel_time']}+ hours")
                    return self._create_flight_required_result(ground_route, convenience, regional_context)
                
                # Sub-case 1b: PRACTICAL (e.g., Zamboanga-Pagadian)
                if convenience["level"] in ["VERY_CONVENIENT", "CONVENIENT"]:
                    logger.info(f"✅ Ground transport preferred: {ground_route['travel_time']} hours")
                    return self._create_ground_preferred_result(ground_route, convenience, regional_context)
                
                # Sub-case 1c: ACCEPTABLE (e.g., Manila-Baguio)
                if convenience["level"] == "ACCEPTABLE":
                    logger.info(f"⚠️ Ground transport acceptable: {ground_route['travel_time']} hours")
                    return self._create_ground_acceptable_result(ground_route, convenience, regional_context, include_flights)
            
            # Case 2: Calculated route exists (medium confidence)
            elif calculated_route:
                convenience = classify_transport_convenience({
                    "travel_time_hours": calculated_route["travel_time"],
                    "distance_km": calculated_route["road_distance"],
                    "has_overnight_option": calculated_route["travel_time"] >= 8,
                    "has_ferry": calculated_route["terrain"] == "island",
                    "scenic": False,
                })
                
                # Sub-case 2a: IMPRACTICAL calculated route
                if convenience["level"] == "IMPRACTICAL" or calculated_route["travel_time"] > 10:
                    logger.info(f"⚠️ Calculated route impractical: {calculated_route['travel_time']}+ hours")
                    return self._create_flight_required_result(calculated_route, convenience, regional_context, is_calculated=True)
                
                # Sub-case 2b: PRACTICAL calculated route
                elif convenience["level"] in ["VERY_CONVENIENT", "CONVENIENT"]:
                    logger.info(f"✅ Calculated route practical: {calculated_route['travel_time']} hours")
                    return self._create_ground_preferred_result(calculated_route, convenience, regional_context, is_calculated=True)
                
                # Sub-case 2c: ACCEPTABLE calculated route
                else:
                    logger.info(f"⚠️ Calculated route acceptable: {calculated_route['travel_time']} hours")
                    return self._create_ground_acceptable_result(calculated_route, convenience, regional_context, include_flights, is_calculated=True)
            
            # Case 4: Crossing major geographic boundaries
            elif boundary_check["crosses_boundary"]:
                logger.info(f"🌊 Inter-island travel detected: {boundary_check['boundary_type']}")
                return self._create_boundary_crossing_result(boundary_check)
            
            # Case 5: Same region but no documented route
            elif regional_context.get("same_region"):
                logger.info(f"🗺️ Same region: {regional_context.get('region')}")
                return self._create_same_region_result(regional_context, include_flights)
            
            # Case 6: Default - suggest flight if needed
            else:
                logger.info("✈️ No ground transport data - suggesting flight")
                return self._create_default_flight_result(include_flights)
            
        except Exception as e:
            logger.error(f"❌ Transport mode analysis failed: {str(e)}")
            return self._create_error_result(str(e))
    
    # ========== Result Builders ==========
    
    def _create_invalid_input_result(self) -> Dict[str, Any]:
        """Result for invalid input"""
        return {
            "mode": None,
            "search_flights": True,
            "recommendation": "Please provide both departure and destination cities",
            "success": False,
        }
    
    def _create_same_city_result(self) -> Dict[str, Any]:
        """Result for same city travel"""
        return {
            "mode": self.TRANSPORT_MODES["PRIVATE_TRANSFER"],
            "search_flights": False,
            "recommendation": "No inter-city transport needed - already at destination",
            "travel_time": "N/A",
            "estimated_cost": "Minimal (local transport only)",
            "success": True,
        }
    
    def _create_flight_required_result(
        self, 
        ground_route: Dict[str, Any], 
        convenience: Dict[str, Any],
        regional_context: Dict[str, Any],
        is_calculated: bool = False
    ) -> Dict[str, Any]:
        """Result for impractical ground transport"""
        # Handle both documented and calculated routes
        if is_calculated:
            travel_time = ground_route.get('travel_time', 0)
            distance = ground_route.get('road_distance', 0)
            cost_str = ground_route.get('cost', 'N/A')
            modes = ['bus']  # Default for calculated routes
            notes = f"Estimated route via {ground_route.get('terrain', 'normal')} terrain. Flight strongly recommended due to long travel time."
        else:
            travel_time = ground_route.get('travel_time', 0)
            distance = ground_route.get('distance', 0)
            cost_str = ground_route.get('cost', {})
            modes = ground_route.get('modes', ['bus'])
            notes = ground_route.get('notes', '')
        
        return {
            "mode": self.TRANSPORT_MODES["FLIGHT_REQUIRED"],
            "search_flights": True,
            "has_airport": True,
            "recommendation": f"Ground travel takes {travel_time}+ hours. Flight strongly recommended.",
            "ground_transport_notice": {
                "available": True,
                "practical": False,
                "travel_time": f"{travel_time} hours",
                "distance": f"{distance} km",
                "cost": cost_str,
                "modes": modes,
                "warning": convenience["user_message"],
                "has_overnight_option": ground_route.get("has_overnight_option", False),
                "notes": notes,
                "calculated": is_calculated,
                "confidence": "medium" if is_calculated else "high",
            },
            "regional_context": regional_context if regional_context.get("same_region") else None,
            "success": True,
        }
    
    def _create_ground_preferred_result(
        self,
        ground_route: Dict[str, Any],
        convenience: Dict[str, Any],
        regional_context: Dict[str, Any],
        is_calculated: bool = False
    ) -> Dict[str, Any]:
        """Result for practical preferred ground transport"""
        primary_mode = self._determine_primary_mode(ground_route)
        
        # Handle both documented and calculated routes
        if is_calculated:
            travel_time = ground_route.get('travel_time', 0)
            distance = ground_route.get('road_distance', 0)
            cost_str = ground_route.get('cost', 'N/A')
            modes = ['bus']  # Default for calculated routes
            frequency = 'Check with local operators'
            operators = []
            scenic = False
            notes = f"Estimated route via {ground_route.get('terrain', 'normal')} terrain. Actual schedules may vary."
        else:
            travel_time = ground_route.get('travel_time', 0)
            distance = ground_route.get('distance', 0)
            cost_str = ground_route.get('cost', {})
            modes = ground_route.get('modes', ['bus'])
            frequency = ground_route.get("frequency", 'N/A')
            operators = ground_route.get("operators", [])
            scenic = ground_route.get("scenic", False)
            notes = ground_route.get("notes", '')
        
        return {
            "mode": self.TRANSPORT_MODES["GROUND_PREFERRED"],
            "primary_mode": primary_mode,
            "search_flights": False,  # Don't search flights for practical routes
            "has_airport": False,
            "recommendation": f"{convenience['user_message']}. {'/'.join(modes)} is the most convenient option.",
            "ground_transport": {
                "available": True,
                "practical": True,
                "preferred": True,
                "travel_time": f"{travel_time} hours",
                "distance": f"{distance} km",
                "modes": modes,
                "cost": cost_str,
                "frequency": frequency,
                "operators": operators,
                "scenic": scenic,
                "notes": notes,
                "convenience_level": convenience["level"],
                "calculated": is_calculated,
                "confidence": "medium" if is_calculated else "high",
            },
            "regional_context": {
                "region": regional_context.get("region"),
                "characteristics": regional_context.get("characteristics"),
                "hub": regional_context.get("hub"),
            } if regional_context.get("same_region") else None,
            "alternative_mode": None,
            "alternative_note": "Ground transport is most convenient and economical for this route",
            "success": True,
        }
    
    def _create_ground_acceptable_result(
        self,
        ground_route: Dict[str, Any],
        convenience: Dict[str, Any],
        regional_context: Dict[str, Any],
        include_flights: bool,
        is_calculated: bool = False
    ) -> Dict[str, Any]:
        """Result for acceptable ground transport"""
        primary_mode = self._determine_primary_mode(ground_route)
        
        # Handle both documented and calculated routes
        if is_calculated:
            travel_time = ground_route.get('travel_time', 0)
            distance = ground_route.get('road_distance', 0)
            cost_str = ground_route.get('cost', 'N/A')
            modes = ['bus']  # Default for calculated routes
            frequency = 'Check with local operators'
            operators = []
            scenic = False
            notes = f"Estimated route via {ground_route.get('terrain', 'normal')} terrain. Consider flight as alternative."
        else:
            travel_time = ground_route.get('travel_time', 0)
            distance = ground_route.get('distance', 0)
            cost_str = ground_route.get('cost', {})
            modes = ground_route.get('modes', ['bus'])
            frequency = ground_route.get("frequency", 'N/A')
            operators = ground_route.get("operators", [])
            scenic = ground_route.get("scenic", False)
            notes = ground_route.get("notes", '')
        
        return {
            "mode": primary_mode,
            "search_flights": include_flights,  # Allow flight search if user wants
            "has_airport": True,
            "recommendation": f"{convenience['user_message']}. {'/'.join(modes)} available.",
            "ground_transport": {
                "available": True,
                "practical": True,
                "preferred": False,
                "travel_time": f"{travel_time} hours",
                "distance": f"{distance} km",
                "modes": modes,
                "cost": cost_str,
                "frequency": frequency,
                "operators": operators,
                "scenic": scenic,
                "notes": notes,
                "convenience_level": convenience["level"],
                "warning": convenience.get("warning"),
                "calculated": is_calculated,
                "confidence": "medium" if is_calculated else "high",
            },
            "regional_context": regional_context if regional_context.get("same_region") else None,
            "warning": convenience.get("warning"),
            "alternative_mode": "flight",
            "success": True,
        }
    
    def _create_boundary_crossing_result(self, boundary_check: Dict[str, Any]) -> Dict[str, Any]:
        """Result for inter-island travel"""
        return {
            "mode": self.TRANSPORT_MODES["FLIGHT_REQUIRED"],
            "search_flights": True,
            "has_airport": True,
            "recommendation": f"{boundary_check['recommendation']}. Flight is the most practical option.",
            "boundary_info": boundary_check,
            "success": True,
        }
    
    def _create_same_region_result(
        self, 
        regional_context: Dict[str, Any],
        include_flights: bool
    ) -> Dict[str, Any]:
        """Result for same region without documented route"""
        return {
            "mode": self.TRANSPORT_MODES["FLIGHT"] if include_flights else self.TRANSPORT_MODES["BUS"],
            "search_flights": include_flights,
            "has_airport": include_flights,
            "recommendation": f"{regional_context['recommendation']}. Check with local operators for schedules.",
            "regional_context": regional_context,
            "alternative_note": "Ground transport may be available - check locally for schedules",
            "success": True,
        }
    
    def _create_default_flight_result(self, include_flights: bool) -> Dict[str, Any]:
        """Default result when no specific data available"""
        return {
            "mode": self.TRANSPORT_MODES["FLIGHT"] if include_flights else None,
            "search_flights": include_flights,
            "has_airport": include_flights,
            "recommendation": "Flight recommended for this route. Ground transport details not available.",
            "warning": "Route information not in database",
            "success": True,
        }
    
    def _create_error_result(self, error_message: str) -> Dict[str, Any]:
        """Result for errors"""
        return {
            "mode": None,
            "search_flights": True,
            "recommendation": "Error analyzing transport mode",
            "error": error_message,
            "success": False,
        }
    
    def _determine_primary_mode(self, ground_route: Dict[str, Any]) -> str:
        """Determine the primary transport mode from route data"""
        # Handle calculated routes (may not have 'modes' key)
        modes = ground_route.get("modes", ["bus"])
        
        if ground_route.get("has_ferry") or ground_route.get("terrain") == "island":
            return self.TRANSPORT_MODES["FERRY"]
        elif "van" in modes:
            return self.TRANSPORT_MODES["VAN"]
        elif "roro" in modes:
            return self.TRANSPORT_MODES["RORO"]
        else:
            return self.TRANSPORT_MODES["BUS"]
    
    async def _execute_logic(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Implement BaseAgent's required abstract method.
        Wraps the synchronous analyze_transport_mode method.
        
        Args:
            input_data: Dict containing destination, departure_city, include_flights
            
        Returns:
            Transport mode analysis results
        """
        destination = input_data.get('destination', '')
        departure_city = input_data.get('departure_city', 'Manila')
        include_flights = input_data.get('include_flights', True)
        
        # Call the main analysis method (synchronous)
        return self.analyze_transport_mode(
            destination=destination,
            departure_city=departure_city,
            include_flights=include_flights
        )
