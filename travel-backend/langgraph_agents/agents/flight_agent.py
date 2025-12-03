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

# ✅ COMPREHENSIVE: Airports with limited or no commercial service (60+ destinations)
# Synchronized with frontend flightRecommendations.js
INACTIVE_AIRPORTS = {
    # === NORTHERN LUZON ===
    "BAG": {
        "name": "Baguio",
        "status": "No commercial service (suspended July 2024)",
        "alternatives": ["CRK", "MNL"],
        "alternative_names": ["Clark", "Manila"],
        "transport": "bus",
        "travel_time": "4-6 hours from Manila, 3-4 hours from Clark",
        "recommendation": "Fly to Clark or Manila, then bus to Baguio"
    },
    "KAP": {
        "name": "Kapangan, Benguet",
        "status": "No airport",
        "alternatives": ["CRK", "MNL"],
        "alternative_names": ["Clark", "Manila"],
        "transport": "bus",
        "travel_time": "5-7 hours from Manila, 4-5 hours from Clark",
        "recommendation": "Fly to Clark or Manila, then bus to Baguio and transfer to Kapangan"
    },
    "VIG": {
        "name": "Vigan",
        "status": "No airport",
        "alternatives": ["LAO", "MNL"],
        "alternative_names": ["Laoag", "Manila"],
        "transport": "bus",
        "travel_time": "2 hours from Laoag, 8-9 hours from Manila",
        "recommendation": "Fly to Laoag, then bus to Vigan (most convenient)"
    },
    "SAG": {
        "name": "Sagada",
        "status": "No airport",
        "alternatives": ["TUG"],
        "alternative_names": ["Tuguegarao"],
        "transport": "bus/van",
        "travel_time": "5-6 hours from Tuguegarao",
        "recommendation": "Fly to Tuguegarao (TUG), then bus/van to Sagada (5-6 hrs, ₱300-500). More convenient than 12-hour direct bus from Manila."
    },
    "BAN": {
        "name": "Banaue",
        "status": "No airport",
        "alternatives": ["TUG"],
        "alternative_names": ["Tuguegarao"],
        "transport": "bus/van",
        "travel_time": "6-7 hours from Tuguegarao",
        "recommendation": "Fly to Tuguegarao (TUG), then bus to Banaue Rice Terraces (6-7 hrs, ₱400-600). More convenient than 10-hour direct bus from Manila."
    },
    "PAG": {
        "name": "Pagudpud",
        "status": "No airport",
        "alternatives": ["LAO"],
        "alternative_names": ["Laoag"],
        "transport": "bus/van",
        "travel_time": "2 hours from Laoag",
        "recommendation": "Fly to Laoag, then bus/van to Pagudpud"
    },
    "HUN": {
        "name": "Hundred Islands (Alaminos)",
        "status": "No airport",
        "alternatives": ["MNL"],
        "alternative_names": ["Manila"],
        "transport": "bus",
        "travel_time": "4-5 hours from Manila",
        "recommendation": "Bus from Manila to Alaminos, Pangasinan"
    },
    
    # === CENTRAL LUZON ===
    "SFS": {
        "name": "Subic",
        "status": "Limited service",
        "alternatives": ["CRK", "MNL"],
        "alternative_names": ["Clark", "Manila"],
        "transport": "bus",
        "travel_time": "1.5 hours from Clark, 3 hours from Manila",
        "recommendation": "Fly to Clark then take bus to Subic. Limited direct flights available."
    },
    "BSO": {
        "name": "Batangas",
        "status": "Military base - no commercial flights",
        "alternatives": ["MNL"],
        "alternative_names": ["Manila"],
        "transport": "bus",
        "travel_time": "2-3 hours from Manila",
        "recommendation": "Fly to Manila then take bus to Batangas."
    },
    "SFE": {
        "name": "San Fernando, La Union",
        "status": "No airport",
        "alternatives": ["MNL"],
        "alternative_names": ["Manila"],
        "transport": "bus",
        "travel_time": "4-5 hours from Manila",
        "recommendation": "Direct bus from Manila to La Union (surfing destination)"
    },
    "ANC": {
        "name": "Anilao",
        "status": "No airport",
        "alternatives": ["MNL"],
        "alternative_names": ["Manila"],
        "transport": "bus/van",
        "travel_time": "2-3 hours from Manila",
        "recommendation": "Bus to Batangas, then tricycle to Anilao (diving destination)"
    },
    
    # === SOUTHERN LUZON / BICOL ===
    "LGZ": {
        "name": "Legaspi/Legazpi",
        "status": "Has airport with flights",
        "alternatives": ["LGP", "MNL"],
        "alternative_names": ["Legazpi Airport", "Manila"],
        "transport": "flight/bus",
        "travel_time": "1 hour flight or 10-12 hours bus from Manila",
        "recommendation": "Fly to Legazpi Airport (gateway to Mayon Volcano)"
    },
    "DAR": {
        "name": "Daet/Camarines Norte",
        "status": "No airport",
        "alternatives": ["LGP", "MNL"],
        "alternative_names": ["Legazpi", "Manila"],
        "transport": "bus",
        "travel_time": "8-10 hours from Manila",
        "recommendation": "Bus from Manila to Daet (gateway to Calaguas)"
    },
    "CAL": {
        "name": "Calaguas Island",
        "status": "No airport",
        "alternatives": ["LGP", "MNL"],
        "alternative_names": ["Legazpi", "Manila"],
        "transport": "bus + boat",
        "travel_time": "8-10 hours bus to Daet, then 2 hours boat",
        "recommendation": "Travel to Daet, then boat to Calaguas"
    },
    "DON": {
        "name": "Donsol",
        "status": "No airport",
        "alternatives": ["LGP"],
        "alternative_names": ["Legazpi"],
        "transport": "bus/van",
        "travel_time": "2 hours from Legazpi",
        "recommendation": "Fly to Legazpi, then bus to Donsol (whale shark watching)"
    },
    "MSB": {
        "name": "Masbate",
        "status": "Has airport with flights",
        "alternatives": ["MBT"],
        "alternative_names": ["Masbate Airport"],
        "transport": "flight/ferry",
        "travel_time": "1 hour flight from Manila or ferry from various ports",
        "recommendation": "Fly to Masbate or take ferry from Lucena/Pilar"
    },
    "DRP": {
        "name": "Sorsogon",
        "status": "Limited service",
        "alternatives": ["LGP"],
        "alternative_names": ["Legazpi"],
        "transport": "van/bus",
        "travel_time": "2 hours from Legazpi",
        "recommendation": "Fly to Legazpi then take van to Sorsogon. Limited direct service available."
    },
    
    # === MINDORO ===
    "SJO": {
        "name": "San Jose, Occidental Mindoro",
        "status": "No airport",
        "alternatives": ["MNL"],
        "alternative_names": ["Manila"],
        "transport": "bus + ferry",
        "travel_time": "6-8 hours from Manila",
        "recommendation": "Bus to Batangas Pier, then ferry to San Jose"
    },
    "PUG": {
        "name": "Puerto Galera",
        "status": "No airport",
        "alternatives": ["MNL"],
        "alternative_names": ["Manila"],
        "transport": "bus + ferry",
        "travel_time": "4-5 hours from Manila",
        "recommendation": "Bus to Batangas, then ferry to Puerto Galera"
    },
    
    # === PALAWAN ===
    "ELN": {
        "name": "El Nido",
        "status": "No commercial airport",
        "alternatives": ["PPS"],
        "alternative_names": ["Puerto Princesa"],
        "transport": "bus/van",
        "travel_time": "5-6 hours from Puerto Princesa",
        "recommendation": "Fly to Puerto Princesa, then shuttle van to El Nido"
    },
    "COR": {
        "name": "Coron",
        "status": "Limited service (Busuanga Airport nearby)",
        "alternatives": ["USU", "PPS"],
        "alternative_names": ["Busuanga (Coron)", "Puerto Princesa"],
        "transport": "ferry/flight",
        "travel_time": "30min flight to Busuanga or 14-16 hours ferry from Manila",
        "recommendation": "Fly to Busuanga (Coron) Airport or take overnight ferry from Manila"
    },
    "SAB": {
        "name": "Sabang (Underground River)",
        "status": "No airport",
        "alternatives": ["PPS"],
        "alternative_names": ["Puerto Princesa"],
        "transport": "van",
        "travel_time": "2 hours from Puerto Princesa",
        "recommendation": "Fly to Puerto Princesa, then van to Sabang"
    },
    "BAL": {
        "name": "Balabac",
        "status": "No airport",
        "alternatives": ["PPS"],
        "alternative_names": ["Puerto Princesa"],
        "transport": "bus + boat",
        "travel_time": "10-12 hours from Puerto Princesa",
        "recommendation": "Fly to Puerto Princesa, then bus + boat to Balabac"
    },
    
    # === VISAYAS - PANAY ===
    "BOR": {
        "name": "Boracay",
        "status": "No airport (nearby airports available)",
        "alternatives": ["KLO", "MPH"],
        "alternative_names": ["Kalibo", "Caticlan"],
        "transport": "flight + boat",
        "travel_time": "2 hours from Kalibo or 30min from Caticlan + 15min boat",
        "recommendation": "Fly to Caticlan (closest) or Kalibo, then boat to Boracay"
    },
    "GIM": {
        "name": "Guimaras",
        "status": "No airport",
        "alternatives": ["ILO"],
        "alternative_names": ["Iloilo"],
        "transport": "ferry",
        "travel_time": "15-20 minutes ferry from Iloilo",
        "recommendation": "Fly to Iloilo, then ferry to Guimaras"
    },
    "ANT": {
        "name": "Antique",
        "status": "No commercial airport",
        "alternatives": ["ILO"],
        "alternative_names": ["Iloilo"],
        "transport": "bus",
        "travel_time": "2-3 hours from Iloilo",
        "recommendation": "Fly to Iloilo, then bus to Antique towns"
    },
    
    # === VISAYAS - NEGROS ===
    "DUM": {
        "name": "Dumaguete",
        "status": "Has airport with flights",
        "alternatives": ["DGT"],
        "alternative_names": ["Dumaguete Airport"],
        "transport": "flight",
        "travel_time": "1 hour from Manila/Cebu",
        "recommendation": "Fly direct to Dumaguete (Sibulan Airport)"
    },
    "SIQ": {
        "name": "Siquijor",
        "status": "No airport",
        "alternatives": ["DGT", "TAG"],
        "alternative_names": ["Dumaguete", "Tagbilaran (Bohol)"],
        "transport": "ferry",
        "travel_time": "1 hour ferry from Dumaguete",
        "recommendation": "Fly to Dumaguete, then fast ferry to Siquijor"
    },
    "DAU": {
        "name": "Dauin (Apo Island)",
        "status": "No airport",
        "alternatives": ["DGT"],
        "alternative_names": ["Dumaguete"],
        "transport": "ferry/van",
        "travel_time": "30min from Dumaguete + 30min boat to Apo Island",
        "recommendation": "Fly to Dumaguete, then van to Dauin pier for Apo Island"
    },
    
    # === VISAYAS - BOHOL ===
    "PAN": {
        "name": "Panglao Island",
        "status": "Has airport with flights",
        "alternatives": ["TAG"],
        "alternative_names": ["Tagbilaran"],
        "transport": "flight",
        "travel_time": "Direct flights to Panglao Airport",
        "recommendation": "Fly direct to Panglao-Bohol International Airport"
    },
    "CHO": {
        "name": "Chocolate Hills",
        "status": "No airport",
        "alternatives": ["TAG"],
        "alternative_names": ["Tagbilaran"],
        "transport": "van",
        "travel_time": "2 hours from Tagbilaran",
        "recommendation": "Fly to Tagbilaran/Panglao, then van to Carmen for Chocolate Hills"
    },
    "AMO": {
        "name": "Anda",
        "status": "No airport",
        "alternatives": ["TAG"],
        "alternative_names": ["Tagbilaran"],
        "transport": "van",
        "travel_time": "3 hours from Tagbilaran",
        "recommendation": "Fly to Tagbilaran, then van to Anda (off-the-beaten-path beaches)"
    },
    
    # === VISAYAS - CEBU ===
    "BANT": {
        "name": "Bantayan Island",
        "status": "No airport",
        "alternatives": ["CEB"],
        "alternative_names": ["Cebu"],
        "transport": "bus + ferry",
        "travel_time": "4 hours from Cebu City",
        "recommendation": "Fly to Cebu, then bus to Hagnaya Port + ferry to Bantayan"
    },
    "MAL": {
        "name": "Malapascua Island",
        "status": "No airport",
        "alternatives": ["CEB"],
        "alternative_names": ["Cebu"],
        "transport": "bus + boat",
        "travel_time": "4 hours from Cebu City",
        "recommendation": "Fly to Cebu, then bus to Maya Port + boat to Malapascua"
    },
    "OSL": {
        "name": "Oslob (Whale Sharks)",
        "status": "No airport",
        "alternatives": ["CEB"],
        "alternative_names": ["Cebu"],
        "transport": "bus",
        "travel_time": "3 hours from Cebu City",
        "recommendation": "Fly to Cebu, then bus to Oslob for whale shark watching"
    },
    "MOA": {
        "name": "Moalboal",
        "status": "No airport",
        "alternatives": ["CEB"],
        "alternative_names": ["Cebu"],
        "transport": "bus",
        "travel_time": "2.5 hours from Cebu City",
        "recommendation": "Fly to Cebu, then bus to Moalboal (sardine run diving)"
    },
    
    # === VISAYAS - LEYTE/SAMAR ===
    "TUB": {
        "name": "Tubigon/Padre Burgos",
        "status": "No airport",
        "alternatives": ["TAC"],
        "alternative_names": ["Tacloban"],
        "transport": "van",
        "travel_time": "2 hours from Tacloban",
        "recommendation": "Fly to Tacloban, then van to Padre Burgos (diving)"
    },
    "SOH": {
        "name": "Sohoton Cave",
        "status": "No airport",
        "alternatives": ["TAC"],
        "alternative_names": ["Tacloban"],
        "transport": "van + boat",
        "travel_time": "4 hours from Tacloban",
        "recommendation": "Fly to Tacloban, then van + boat to Sohoton, Samar"
    },
    "KAL": {
        "name": "Kalanggaman Island",
        "status": "No airport",
        "alternatives": ["TAC"],
        "alternative_names": ["Tacloban"],
        "transport": "van + boat",
        "travel_time": "3 hours from Tacloban",
        "recommendation": "Fly to Tacloban, then van to Palompon + boat to Kalanggaman"
    },
    
    # === MINDANAO - NORTHERN ===
    "MBL": {
        "name": "Malaybalay",
        "status": "Limited/seasonal service",
        "alternatives": ["CGY"],
        "alternative_names": ["Cagayan de Oro"],
        "transport": "van/bus",
        "travel_time": "2 hours from Cagayan de Oro",
        "recommendation": "Fly to Cagayan de Oro then take van to Malaybalay."
    },
    "CAM": {
        "name": "Camiguin",
        "status": "No commercial airport",
        "alternatives": ["CGY"],
        "alternative_names": ["Cagayan de Oro"],
        "transport": "ferry",
        "travel_time": "2 hours ferry from Balingoan Port",
        "recommendation": "Fly to Cagayan de Oro, then 2-hour bus + ferry to Camiguin"
    },
    "BUK": {
        "name": "Bukidnon (Dahilayan)",
        "status": "No airport",
        "alternatives": ["CGY"],
        "alternative_names": ["Cagayan de Oro"],
        "transport": "van",
        "travel_time": "2 hours from Cagayan de Oro",
        "recommendation": "Fly to Cagayan de Oro, then van to Manolo Fortich/Dahilayan"
    },
    "ILG": {
        "name": "Iligan (Tinago Falls)",
        "status": "No commercial airport",
        "alternatives": ["CGY"],
        "alternative_names": ["Cagayan de Oro"],
        "transport": "bus",
        "travel_time": "2 hours from Cagayan de Oro",
        "recommendation": "Fly to Cagayan de Oro, then bus to Iligan"
    },
    
    # === MINDANAO - CARAGA (SIARGAO) ===
    "GLE": {
        "name": "General Luna (Siargao)",
        "status": "Has airport with flights",
        "alternatives": ["IAO", "DGT"],
        "alternative_names": ["Siargao Airport", "Siargao Airport"],
        "transport": "flight",
        "travel_time": "Direct flights available",
        "recommendation": "Fly direct to Siargao (Sayak Airport)"
    },
    "BUR": {
        "name": "Burgos (Siargao)",
        "status": "No airport",
        "alternatives": ["IAO"],
        "alternative_names": ["Siargao Airport"],
        "transport": "van",
        "travel_time": "1 hour from Siargao Airport",
        "recommendation": "Fly to Siargao, then van to Burgos (Magpupungko Rock Pools)"
    },
    "BIS": {
        "name": "Bislig (Tinuy-an Falls)",
        "status": "No commercial airport",
        "alternatives": ["DVO", "BXU"],
        "alternative_names": ["Davao", "Butuan"],
        "transport": "bus",
        "travel_time": "4-5 hours from Davao or Butuan",
        "recommendation": "Fly to Davao or Butuan, then bus to Bislig"
    },
    "BRI": {
        "name": "Britania Islands",
        "status": "No airport",
        "alternatives": ["BXU"],
        "alternative_names": ["Butuan"],
        "transport": "van + boat",
        "travel_time": "4 hours from Butuan",
        "recommendation": "Fly to Butuan, then van + boat to Britania Islands"
    },
    
    # === MINDANAO - DAVAO REGION ===
    "SAM": {
        "name": "Samal Island",
        "status": "No airport",
        "alternatives": ["DVO"],
        "alternative_names": ["Davao"],
        "transport": "ferry",
        "travel_time": "15 minutes from Davao City",
        "recommendation": "Fly to Davao, then ferry to Samal Island"
    },
    "MAT": {
        "name": "Mati (Dahican Beach)",
        "status": "No commercial airport",
        "alternatives": ["DVO"],
        "alternative_names": ["Davao"],
        "transport": "bus",
        "travel_time": "3 hours from Davao City",
        "recommendation": "Fly to Davao, then bus to Mati"
    },
    "TBL": {
        "name": "Lake Sebu",
        "status": "No airport",
        "alternatives": ["GES"],
        "alternative_names": ["General Santos"],
        "transport": "van",
        "travel_time": "2.5 hours from General Santos",
        "recommendation": "Fly to General Santos, then van to Lake Sebu"
    },
    
    # === MINDANAO - WESTERN (ZAMBOANGA) ===
    "PAG_CITY": {
        "name": "Pagadian",
        "status": "Limited service",
        "alternatives": ["ZAM"],
        "alternative_names": ["Zamboanga"],
        "transport": "bus",
        "travel_time": "3 hours from Zamboanga",
        "recommendation": "Fly to Zamboanga then take bus to Pagadian. Limited direct flights available."
    },
    "JOL": {
        "name": "Jolo",
        "status": "Very limited service",
        "alternatives": ["ZAM"],
        "alternative_names": ["Zamboanga"],
        "transport": "ferry",
        "travel_time": "8-12 hours ferry from Zamboanga",
        "recommendation": "Ferry from Zamboanga is recommended. Limited airport service available."
    },
    "SAN": {
        "name": "Santa Cruz Island (Pink Beach)",
        "status": "No airport",
        "alternatives": ["ZAM"],
        "alternative_names": ["Zamboanga"],
        "transport": "boat",
        "travel_time": "30 minutes from Zamboanga City",
        "recommendation": "Fly to Zamboanga, then boat to Santa Cruz Island"
    },
    "BAS": {
        "name": "Basilan",
        "status": "No commercial airport",
        "alternatives": ["ZAM"],
        "alternative_names": ["Zamboanga"],
        "transport": "ferry",
        "travel_time": "2 hours from Zamboanga",
        "recommendation": "Fly to Zamboanga, then ferry to Basilan (check travel advisories)"
    },
    
    # === MINDANAO - SOUTHERN (SULU/TAWI-TAWI) ===
    "TAW": {
        "name": "Tawi-Tawi",
        "status": "Has airport with flights",
        "alternatives": ["TWT"],
        "alternative_names": ["Tawi-Tawi Airport"],
        "transport": "flight",
        "travel_time": "Direct flights from Manila/Zamboanga",
        "recommendation": "Fly direct to Tawi-Tawi (southernmost Philippines)"
    },
    "SIT": {
        "name": "Sitangkai",
        "status": "No airport",
        "alternatives": ["TWT"],
        "alternative_names": ["Tawi-Tawi"],
        "transport": "boat",
        "travel_time": "3-4 hours from Bongao",
        "recommendation": "Fly to Tawi-Tawi, then boat to Sitangkai (Venice of the South)"
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
                    'recommendation': inactive_info['recommendation'],
                    # ✅ FIX: Include transport details for reroute info display
                    'transport': inactive_info.get('transport', 'bus'),
                    'travel_time': inactive_info.get('travel_time', 'Unknown'),
                    'status': inactive_info.get('status', 'No airport')
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
                    'recommendation': inactive_info['recommendation'],
                    # ✅ FIX: Include transport details for reroute info display
                    'transport': inactive_info.get('transport', 'bus'),
                    'travel_time': inactive_info.get('travel_time', 'Unknown'),
                    'status': inactive_info.get('status', 'No airport')
                }
            else:
                return {
                    'valid': False,
                    'message': f"Destination airport '{to_airport}' not found or has no commercial service",
                    'airport_type': 'destination'
                }
        
        return {'valid': True, 'message': 'Airports validated successfully'}
    
    def _validate_flight_pricing(self, flight: Dict[str, Any]) -> Dict[str, Any]:
        """
        ✅ NEW: Validate individual flight pricing data from SERP API
        Returns validation result with sanitized data
        """
        import re
        
        validation_result = {
            'valid': True,
            'warnings': [],
            'errors': [],
            'sanitized_flight': flight.copy()
        }
        
        # 1. Validate price exists and is numeric
        price_str = flight.get('price', '₱0')
        try:
            # Extract numeric value from price string
            numeric_price = int(str(price_str).replace('₱', '').replace(',', '').strip())
            
            # Check for unrealistic price values
            if numeric_price <= 0:
                validation_result['valid'] = False
                validation_result['errors'].append('Price is zero or negative')
                validation_result['sanitized_flight']['price'] = '₱0'
            elif numeric_price < 500:  # Unrealistically low for Philippine flights
                validation_result['valid'] = False
                validation_result['errors'].append(f'Price ₱{numeric_price:,} is unrealistically low (min ₱500)')
            elif numeric_price > 100000:  # Unrealistically high for domestic flights
                validation_result['warnings'].append(f'Price ₱{numeric_price:,} is unusually high (max ₱100,000 typical)')
            
            # Ensure proper formatting
            validation_result['sanitized_flight']['price'] = f'₱{numeric_price:,}'
            validation_result['sanitized_flight']['numeric_price'] = numeric_price
            
        except (ValueError, TypeError) as e:
            validation_result['valid'] = False
            validation_result['errors'].append(f'Invalid price format: {price_str}')
            validation_result['sanitized_flight']['price'] = '₱0'
            validation_result['sanitized_flight']['numeric_price'] = 0
        
        # 2. Validate required fields exist
        required_fields = ['name', 'departure', 'arrival', 'duration']
        for field in required_fields:
            if not flight.get(field):
                validation_result['warnings'].append(f'Missing or empty field: {field}')
                validation_result['sanitized_flight'][field] = 'N/A'
        
        # 3. Validate airline name is not generic
        airline_name = flight.get('name', '')
        if airline_name in ['Unknown Airline', 'N/A', '']:
            validation_result['warnings'].append('Generic airline name detected')
        
        # 4. Validate duration format
        duration = flight.get('duration', '')
        if duration and duration != 'N/A':
            # Check if duration matches expected pattern (e.g., "2h 30m", "105", "2.5 hours")
            valid_patterns = [
                r'^\d+h\s*\d*m?$',  # 2h 30m, 2h
                r'^\d+$',  # 105 (minutes)
                r'^\d+\.?\d*\s*(hours?|minutes?)$'  # 2.5 hours, 90 minutes
            ]
            
            if not any(re.match(pattern, str(duration).strip()) for pattern in valid_patterns):
                validation_result['warnings'].append(f'Unusual duration format: {duration}')
        
        # 5. Validate stops count is realistic
        stops = flight.get('stops', 0)
        if not isinstance(stops, int) or stops < 0 or stops > 3:
            validation_result['warnings'].append(f'Unusual stops count: {stops}')
            validation_result['sanitized_flight']['stops'] = 0
        
        # 6. Cross-validate price with flight characteristics
        numeric_price = validation_result['sanitized_flight'].get('numeric_price', 0)
        if numeric_price > 0:
            # Direct flights should typically cost more
            if stops == 0 and numeric_price < 2000:
                validation_result['warnings'].append(
                    f'Unusually low price (₱{numeric_price:,}) for direct flight'
                )
            
            # Connecting flights should be cheaper or similar
            elif stops >= 1 and numeric_price > 50000:
                validation_result['warnings'].append(
                    f'Unusually high price (₱{numeric_price:,}) for connecting flight'
                )
        
        return validation_result
    
    def _validate_flight_batch(self, flights: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        ✅ NEW: Validate batch of flights and flag anomalies
        Returns validation summary with sanitized flights
        """
        if not flights:
            return {
                'valid': False,
                'error': 'No flights to validate',
                'sanitized_flights': [],
                'validation_summary': {}
            }
        
        validated_flights = []
        total_errors = 0
        total_warnings = 0
        invalid_flights = []
        
        # Collect all numeric prices for statistical analysis
        valid_prices = []
        
        for idx, flight in enumerate(flights):
            validation = self._validate_flight_pricing(flight)
            
            if validation['valid']:
                validated_flights.append(validation['sanitized_flight'])
                numeric_price = validation['sanitized_flight'].get('numeric_price', 0)
                if numeric_price > 0:
                    valid_prices.append(numeric_price)
            else:
                invalid_flights.append({
                    'index': idx,
                    'flight': flight.get('name', 'Unknown'),
                    'errors': validation['errors']
                })
            
            total_errors += len(validation['errors'])
            total_warnings += len(validation['warnings'])
        
        # Statistical validation of price distribution
        price_anomalies = []
        if valid_prices:
            avg_price = sum(valid_prices) / len(valid_prices)
            min_price = min(valid_prices)
            max_price = max(valid_prices)
            
            # Flag outliers (prices more than 3x average or less than 1/3 average)
            for flight in validated_flights:
                price = flight.get('numeric_price', 0)
                if price > 0:
                    if price > avg_price * 3:
                        price_anomalies.append({
                            'flight': flight.get('name', 'Unknown'),
                            'price': f'₱{price:,}',
                            'reason': f'Price is {price/avg_price:.1f}x higher than average (₱{avg_price:,.0f})'
                        })
                    elif price < avg_price / 3:
                        price_anomalies.append({
                            'flight': flight.get('name', 'Unknown'),
                            'price': f'₱{price:,}',
                            'reason': f'Price is {avg_price/price:.1f}x lower than average (₱{avg_price:,.0f})'
                        })
        
        validation_summary = {
            'total_flights': len(flights),
            'valid_flights': len(validated_flights),
            'invalid_flights': len(invalid_flights),
            'total_errors': total_errors,
            'total_warnings': total_warnings,
            'price_statistics': {
                'average': sum(valid_prices) / len(valid_prices) if valid_prices else 0,
                'min': min(valid_prices) if valid_prices else 0,
                'max': max(valid_prices) if valid_prices else 0,
                'count': len(valid_prices)
            } if valid_prices else None,
            'price_anomalies': price_anomalies,
            'invalid_flight_details': invalid_flights
        }
        
        return {
            'valid': len(validated_flights) > 0,
            'sanitized_flights': validated_flights,
            'validation_summary': validation_summary,
            'quality_score': (len(validated_flights) / len(flights) * 100) if flights else 0
        }
    
    def _analyze_flight_options(self, flight_results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze flight options with validation and add LangGraph intelligence"""
        
        flights = flight_results.get('flights', [])
        
        # ✅ NEW: Validate all flights before analysis
        validation_result = self._validate_flight_batch(flights)
        
        if not validation_result['valid']:
            logger.error(f"❌ Flight validation failed: {validation_result.get('validation_summary')}")
            return {
                **flight_results,
                'success': False,
                'error': 'Flight data validation failed',
                'validation_details': validation_result['validation_summary'],
                'flights': []
            }
        
        # Use sanitized flights for further processing
        validated_flights = validation_result['sanitized_flights']
        
        # Log validation warnings
        if validation_result['validation_summary']['total_warnings'] > 0:
            logger.warning(
                f"⚠️ Flight data has {validation_result['validation_summary']['total_warnings']} warnings"
            )
        
        # Log price anomalies
        if validation_result['validation_summary'].get('price_anomalies'):
            logger.warning(
                f"⚠️ Detected {len(validation_result['validation_summary']['price_anomalies'])} price anomalies"
            )
            for anomaly in validation_result['validation_summary']['price_anomalies'][:3]:  # Log first 3
                logger.warning(f"  • {anomaly['flight']}: {anomaly['price']} - {anomaly['reason']}")
        
        flights = validated_flights
        
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
            'validation_summary': validation_result['validation_summary'],
            'data_quality_score': validation_result['quality_score'],
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
