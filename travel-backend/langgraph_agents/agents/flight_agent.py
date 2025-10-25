# langgraph_agents/agents/flight_agent.py

from typing import Dict, Any, Optional, List
import asyncio
from datetime import datetime
import pytz
from .base_agent import BaseAgent
from flights.views import FlightSearchView
from rest_framework.test import APIRequestFactory
import logging

logger = logging.getLogger(__name__)

# ✅ ADDED: List of Philippine airports with commercial service
AIRPORTS_WITH_COMMERCIAL_SERVICE = [
    # International Airports
    "MNL", "CRK", "CEB", "DVO", "ILO", "KLO", "PPS",
    
    # Domestic Airports with scheduled service
    "BCD", "TAG", "BXU", "CYZ", "CBO", "TAC", "DPL", "DGT", 
    "GES", "MPH", "OZC", "CGY", "WNP", "PAG", "RXS", "TWT", 
    "SJI", "SFS", "TUG", "ZAM", "DRP", "BSO", "CYP", "CGM", 
    "CRM", "CYU", "EUQ", "USU", "JOL", "MBT", "OMC", "SWL", 
    "IAO", "SUG", "TDG", "TBH", "VRC", "LGP", "LAO"
]

# ✅ ADDED: Airports with limited or no commercial service
INACTIVE_AIRPORTS = {
    "BAG": {
        "name": "Loakan Airport (Baguio)",
        "status": "No commercial service (suspended July 2024)",
        "alternatives": ["CRK", "MNL"],
        "alternative_names": ["Clark International Airport", "Manila (NAIA)"],
        "recommendation": "Fly to Clark (CRK) or Manila (MNL), then 3-4 hours by bus to Baguio"
    }
}

# ✅ NEW: Philippine timezone constant
PHILIPPINES_TZ = pytz.timezone('Asia/Manila')


class FlightAgent(BaseAgent):
    """LangGraph Flight Search Agent"""
    
    def __init__(self, session_id: str):
        super().__init__(session_id, 'flight')
    
    def _validate_and_normalize_dates(self, departure_date: str, return_date: Optional[str] = None) -> Dict[str, Any]:
        """
        ✅ NEW: Validate and normalize dates to Philippine timezone
        Ensures dates are in YYYY-MM-DD format and prevents timezone issues
        """
        try:
            # Validate departure date format
            if not departure_date:
                return {
                    'valid': False,
                    'error': 'Departure date is required'
                }
            
            # Parse departure date (expects YYYY-MM-DD format)
            try:
                departure_parts = departure_date.split('-')
                if len(departure_parts) != 3:
                    raise ValueError("Invalid date format")
                
                year, month, day = map(int, departure_parts)
                
                # Create timezone-aware datetime in Philippine time
                departure_dt = PHILIPPINES_TZ.localize(
                    datetime(year, month, day, 0, 0, 0)
                )
                
                # Validate departure is not in the past
                now_ph = datetime.now(PHILIPPINES_TZ).replace(hour=0, minute=0, second=0, microsecond=0)
                if departure_dt < now_ph:
                    return {
                        'valid': False,
                        'error': f'Departure date {departure_date} is in the past'
                    }
                
            except (ValueError, IndexError) as e:
                return {
                    'valid': False,
                    'error': f'Invalid departure date format. Expected YYYY-MM-DD, got: {departure_date}'
                }
            
            # Validate return date if provided
            return_dt = None
            if return_date:
                try:
                    return_parts = return_date.split('-')
                    if len(return_parts) != 3:
                        raise ValueError("Invalid date format")
                    
                    ret_year, ret_month, ret_day = map(int, return_parts)
                    return_dt = PHILIPPINES_TZ.localize(
                        datetime(ret_year, ret_month, ret_day, 0, 0, 0)
                    )
                    
                    # Validate return date is after departure
                    if return_dt < departure_dt:
                        return {
                            'valid': False,
                            'error': f'Return date {return_date} must be after departure date {departure_date}'
                        }
                    
                except (ValueError, IndexError) as e:
                    return {
                        'valid': False,
                        'error': f'Invalid return date format. Expected YYYY-MM-DD, got: {return_date}'
                    }
            
            # Return normalized dates (keep in YYYY-MM-DD format)
            return {
                'valid': True,
                'departure_date': departure_date,  # Keep original format
                'return_date': return_date,
                'departure_datetime': departure_dt,
                'return_datetime': return_dt,
                'timezone': 'Asia/Manila'
            }
            
        except Exception as e:
            logger.error(f"Date validation error: {e}")
            return {
                'valid': False,
                'error': f'Date validation failed: {str(e)}'
            }
    
    async def _execute_logic(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute flight search using existing Django flight search logic"""
        
        # Extract flight search parameters
        flight_params = input_data.get('flight_params', {})
        
        if not flight_params:
            return {
                'success': False,
                'error': 'No flight parameters provided',
                'flights': []
            }
        
        try:
            # Call the flight search logic directly instead of through Django view
            view = FlightSearchView()
            
            # Call the flight search methods directly
            from_airport = flight_params.get('from_airport')
            to_airport = flight_params.get('to_airport')
            departure_date = flight_params.get('departure_date')
            return_date = flight_params.get('return_date')
            adults = flight_params.get('adults', 1)
            trip_type = flight_params.get('trip_type', 'round-trip')

            # Validate required fields
            if not all([from_airport, to_airport, departure_date]):
                return {
                    'success': False,
                    'error': 'Missing required fields: from_airport, to_airport, departure_date',
                    'flights': []
                }
            
            # ✅ NEW: Validate dates and timezone
            date_validation = self._validate_and_normalize_dates(departure_date, return_date)
            if not date_validation['valid']:
                return {
                    'success': False,
                    'error': date_validation['error'],
                    'flights': [],
                    'date_validation': date_validation
                }
            
            # Use validated dates
            departure_date = date_validation['departure_date']
            return_date = date_validation['return_date']
            
            # ✅ EXISTING: Validate airport commercial service
            airport_validation = self._validate_airports(from_airport, to_airport)
            if not airport_validation['valid']:
                return {
                    'success': False,
                    'error': airport_validation['message'],
                    'flights': [],
                    'airport_status': airport_validation,
                    'alternatives': airport_validation.get('alternatives', [])
                }

            # Use the view's search logic directly
            from django.conf import settings
            
            # Check if SerpAPI key is configured
            if not getattr(settings, 'SERPAPI_KEY', None):
                logger.warning("SerpAPI key not configured, using fallback data")
                flight_results = view.fallback_response(from_airport, to_airport, trip_type)
            else:
                try:
                    # Search flights using SerpAPI with validated dates
                    flight_results = view.search_flights_serpapi(
                        from_airport, to_airport, departure_date, return_date, adults, trip_type
                    )
                except Exception as e:
                    logger.error(f"SerpAPI error: {e}")
                    flight_results = view.fallback_response(from_airport, to_airport, trip_type)
                    flight_results['note'] = f'SerpAPI error: {str(e)}'
                    flight_results['source'] = 'fallback_error'
            
            # Enhance results with LangGraph-specific analysis
            if flight_results.get('success'):
                enhanced_results = self._analyze_flight_options(flight_results)
                # Add date validation info to results
                enhanced_results['date_validation'] = {
                    'timezone': 'Asia/Manila (UTC+8)',
                    'departure_date': departure_date,
                    'return_date': return_date
                }
                return enhanced_results
            else:
                return flight_results
                
        except Exception as e:
            logger.error(f"Flight agent execution failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'flights': []
            }
    
    def _validate_airports(self, from_airport: str, to_airport: str) -> Dict[str, Any]:
        """
        ✅ EXISTING: Validate if airports have commercial service
        Returns validation status and alternatives if needed
        """
        from_upper = from_airport.upper() if from_airport else ""
        to_upper = to_airport.upper() if to_airport else ""
        
        # Check departure airport
        if from_upper not in AIRPORTS_WITH_COMMERCIAL_SERVICE:
            if from_upper in INACTIVE_AIRPORTS:
                inactive_info = INACTIVE_AIRPORTS[from_upper]
                return {
                    'valid': False,
                    'message': f"{inactive_info['name']} has no commercial flights. {inactive_info['recommendation']}",
                    'inactive_airport': from_upper,
                    'airport_type': 'departure',
                    'alternatives': [
                        {'code': alt, 'name': name} 
                        for alt, name in zip(inactive_info['alternatives'], inactive_info['alternative_names'])
                    ],
                    'recommendation': inactive_info['recommendation']
                }
            else:
                return {
                    'valid': False,
                    'message': f"Departure airport '{from_airport}' not found or has no commercial service",
                    'airport_type': 'departure'
                }
        
        # Check destination airport
        if to_upper not in AIRPORTS_WITH_COMMERCIAL_SERVICE:
            if to_upper in INACTIVE_AIRPORTS:
                inactive_info = INACTIVE_AIRPORTS[to_upper]
                return {
                    'valid': False,
                    'message': f"{inactive_info['name']} has no commercial flights. {inactive_info['recommendation']}",
                    'inactive_airport': to_upper,
                    'airport_type': 'destination',
                    'alternatives': [
                        {'code': alt, 'name': name} 
                        for alt, name in zip(inactive_info['alternatives'], inactive_info['alternative_names'])
                    ],
                    'recommendation': inactive_info['recommendation']
                }
            else:
                return {
                    'valid': False,
                    'message': f"Destination airport '{to_airport}' not found or has no commercial service",
                    'airport_type': 'destination'
                }
        
        return {'valid': True, 'message': 'Airports validated successfully'}
    
    def _analyze_flight_options(self, flight_results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze flight options and add LangGraph intelligence"""
        
        flights = flight_results.get('flights', [])
        
        # Add intelligent scoring
        for flight in flights:
            score = self._calculate_flight_score(flight)
            flight['langgraph_score'] = score
            flight['recommendation_reason'] = self._get_recommendation_reason(flight, score)
        
        # Sort by LangGraph score
        flights.sort(key=lambda x: x.get('langgraph_score', 0), reverse=True)
        
        # Add overall analysis
        analysis = self._generate_flight_analysis(flights)
        
        return {
            **flight_results,
            'flights': flights,
            'langgraph_analysis': analysis,
            'agent_type': 'flight',
            'processing_time': getattr(self, 'execution_time_ms', None)
        }
    
    def _calculate_flight_score(self, flight: Dict[str, Any]) -> int:
        """Calculate intelligent flight score based on multiple factors"""
        score = 50  # Base score
        
        # Price factor (lower price = higher score)
        try:
            price_str = flight.get('price', '₱0').replace('₱', '').replace(',', '')
            price = int(price_str)
            if price < 3000:
                score += 30
            elif price < 5000:
                score += 20
            elif price < 8000:
                score += 10
            else:
                score -= 10
        except:
            pass
        
        # Non-stop flights bonus
        if flight.get('stops', 0) == 0:
            score += 25
        elif flight.get('stops', 0) == 1:
            score += 10
        
        # Best flight indicator
        if flight.get('is_best', False):
            score += 20
        
        # Time convenience (avoid very early/late flights)
        departure = flight.get('departure', '')
        try:
            hour = int(departure.split(':')[0])
            if 6 <= hour <= 20:  # Reasonable hours
                score += 15
            elif hour < 6 or hour > 22:  # Very early/late
                score -= 10
        except:
            pass
        
        return max(0, min(100, score))  # Keep between 0-100
    
    def _get_recommendation_reason(self, flight: Dict[str, Any], score: int) -> str:
        """Generate recommendation reason based on score factors"""
        reasons = []
        
        if flight.get('is_best', False):
            reasons.append("marked as best value")
        
        if flight.get('stops', 0) == 0:
            reasons.append("direct flight")
        
        try:
            price_str = flight.get('price', '₱0').replace('₱', '').replace(',', '')
            price = int(price_str)
            if price < 3000:
                reasons.append("excellent price")
            elif price < 5000:
                reasons.append("good value")
        except:
            pass
        
        if score >= 80:
            return f"Highly recommended - {', '.join(reasons[:2])}"
        elif score >= 60:
            return f"Good option - {', '.join(reasons[:2])}"
        else:
            return "Alternative option"
    
    def _generate_flight_analysis(self, flights: list) -> Dict[str, Any]:
        """Generate overall flight analysis"""
        if not flights:
            return {'summary': 'No flights found'}
        
        # Price analysis
        prices = []
        for flight in flights:
            try:
                price_str = flight.get('price', '₱0').replace('₱', '').replace(',', '')
                prices.append(int(price_str))
            except:
                continue
        
        analysis = {
            'total_options': len(flights),
            'direct_flights': len([f for f in flights if f.get('stops', 0) == 0]),
            'price_range': {
                'min': min(prices) if prices else 0,
                'max': max(prices) if prices else 0,
                'avg': sum(prices) // len(prices) if prices else 0
            },
            'best_value_flight': flights[0] if flights else None,
            'recommendation': self._generate_overall_recommendation(flights)
        }
        
        return analysis
    
    def _generate_overall_recommendation(self, flights: list) -> str:
        """Generate overall recommendation for the flight search"""
        if not flights:
            return "No flights available for this route"
        
        direct_count = len([f for f in flights if f.get('stops', 0) == 0])
        total_count = len(flights)
        
        if direct_count > 0:
            return f"Found {total_count} options including {direct_count} direct flights. Book early for best prices."
        else:
            return f"Found {total_count} connecting flights. Consider flexible dates for better options."
