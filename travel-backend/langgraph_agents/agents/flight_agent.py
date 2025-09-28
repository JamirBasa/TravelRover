# langgraph_agents/agents/flight_agent.py
from typing import Dict, Any
import asyncio
from .base_agent import BaseAgent
from flights.views import FlightSearchView
from rest_framework.test import APIRequestFactory
import logging

logger = logging.getLogger(__name__)

class FlightAgent(BaseAgent):
    """LangGraph Flight Search Agent"""
    
    def __init__(self, session_id: str):
        super().__init__(session_id, 'flight')
    
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
            # Use Django's existing FlightSearchView in a synchronous way
            # Create a mock request using APIRequestFactory
            factory = APIRequestFactory()
            request = factory.post('/api/flights/search/', flight_params, format='json')
            
            # Create FlightSearchView instance and call it
            view = FlightSearchView()
            response = view.post(request)
            
            # Convert Django Response to dict
            flight_results = response.data
            
            # Enhance results with LangGraph-specific analysis
            if flight_results.get('success'):
                enhanced_results = self._analyze_flight_options(flight_results)
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
            'processing_time': self.execution_log.execution_time_ms if self.execution_log else None
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