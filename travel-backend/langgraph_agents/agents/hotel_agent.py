# langgraph_agents/agents/hotel_agent.py
from typing import Dict, Any
import asyncio
import requests
from django.conf import settings
from .base_agent import BaseAgent
import logging

logger = logging.getLogger(__name__)

class HotelAgent(BaseAgent):
    """LangGraph Hotel Search Agent"""
    
    def __init__(self, session_id: str):
        super().__init__(session_id, 'hotel')
    
    async def _execute_logic(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute hotel search using Google Places API"""
        
        # Extract hotel search parameters
        hotel_params = input_data.get('hotel_params', {})
        
        if not hotel_params:
            return {
                'success': False,
                'error': 'No hotel parameters provided',
                'hotels': []
            }
        
        try:
            # Get location coordinates first
            coordinates = await self._get_location_coordinates(hotel_params.get('destination'))
            
            if not coordinates:
                # Fall back to mock data
                return self._generate_mock_hotels(hotel_params)
            
            # Search for hotels using Google Places API
            hotels = await self._search_nearby_hotels(coordinates, hotel_params)
            
            # Enhance with LangGraph analysis
            enhanced_results = self._analyze_hotel_options(hotels, hotel_params)
            
            return {
                'success': True,
                'hotels': enhanced_results['hotels'],
                'langgraph_analysis': enhanced_results['analysis'],
                'location': hotel_params.get('destination'),
                'checkin': hotel_params.get('checkin_date'),
                'checkout': hotel_params.get('checkout_date'),
                'guests': hotel_params.get('guests'),
                'agent_type': 'hotel',
                'processing_time': self.execution_log.execution_time_ms if self.execution_log else None
            }
            
        except Exception as e:
            logger.error(f"Hotel agent execution failed: {e}")
            # Fall back to mock data on error
            return self._generate_mock_hotels(hotel_params)
    
    async def _get_location_coordinates(self, destination: str) -> Dict[str, float]:
        """Get coordinates for destination using Google Geocoding API"""
        
        api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
        if not api_key:
            logger.warning("Google Places API key not configured")
            return None
        
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': destination,
                'key': api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get('results'):
                location = data['results'][0]['geometry']['location']
                return {
                    'lat': location['lat'],
                    'lng': location['lng']
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Geocoding failed: {e}")
            return None
    
    async def _search_nearby_hotels(self, coordinates: Dict[str, float], params: Dict[str, Any]) -> list:
        """Search for hotels using Google Places Nearby Search API"""
        
        api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
        if not api_key:
            raise Exception("Google Places API key not configured")
        
        try:
            url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            search_params = {
                'location': f"{coordinates['lat']},{coordinates['lng']}",
                'radius': 50000,  # 50km radius
                'type': 'lodging',
                'key': api_key
            }
            
            response = requests.get(url, params=search_params, timeout=15)
            data = response.json()
            
            hotels = []
            if data.get('results'):
                for hotel_data in data['results'][:20]:  # Limit to 20 results
                    hotel = self._parse_hotel_data(hotel_data, coordinates, api_key)
                    if hotel:
                        hotels.append(hotel)
            
            return hotels
            
        except Exception as e:
            logger.error(f"Hotel search API failed: {e}")
            return []
    
    def _parse_hotel_data(self, hotel_data: Dict[str, Any], center_coords: Dict[str, float], api_key: str) -> Dict[str, Any]:
        """Parse individual hotel data from Google Places API"""
        
        try:
            # Basic hotel info
            hotel = {
                'id': hotel_data.get('place_id'),
                'name': hotel_data.get('name'),
                'rating': hotel_data.get('rating', 4.0),
                'price_level': hotel_data.get('price_level', 2),
                'address': hotel_data.get('vicinity'),
                'amenities': self._generate_amenities(hotel_data.get('price_level', 2)),
            }
            
            # Price range mapping
            price_levels = {
                1: 'Budget (₱1,000-2,500)',
                2: 'Mid-range (₱2,500-5,000)', 
                3: 'Upscale (₱5,000-10,000)',
                4: 'Luxury (₱10,000+)'
            }
            hotel['price_range'] = price_levels.get(hotel['price_level'], 'Mid-range (₱2,500-5,000)')
            
            # Photo
            if hotel_data.get('photos'):
                photo_ref = hotel_data['photos'][0]['photo_reference']
                hotel['photo'] = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_ref}&key={api_key}"
            else:
                hotel['photo'] = None
            
            # Distance calculation
            hotel_location = hotel_data.get('geometry', {}).get('location', {})
            if hotel_location:
                distance = self._calculate_distance(
                    center_coords, 
                    {'lat': hotel_location['lat'], 'lng': hotel_location['lng']}
                )
                hotel['distance'] = f"{distance:.1f} km from center"
            else:
                hotel['distance'] = 'Distance unknown'
            
            # Recommendation flag
            hotel['is_recommended'] = hotel['rating'] >= 4.0 and hotel['price_level'] <= 3
            
            return hotel
            
        except Exception as e:
            logger.error(f"Error parsing hotel data: {e}")
            return None
    
    def _calculate_distance(self, coord1: Dict[str, float], coord2: Dict[str, float]) -> float:
        """Calculate distance between two coordinates (simple approximation)"""
        import math
        
        lat1, lon1 = coord1['lat'], coord1['lng']
        lat2, lon2 = coord2['lat'], coord2['lng']
        
        # Simple Euclidean distance approximation
        distance = math.sqrt(
            (lat1 - lat2)**2 + (lon1 - lon2)**2
        ) * 111  # Rough km conversion
        
        return distance
    
    def _generate_amenities(self, price_level: int) -> list:
        """Generate amenities based on price level"""
        base_amenities = ['Free WiFi', 'Air Conditioning']
        level_amenities = {
            1: ['24h Reception'],
            2: ['Restaurant', 'Room Service'],
            3: ['Pool', 'Gym', 'Spa', 'Restaurant'],
            4: ['Pool', 'Gym', 'Spa', 'Restaurant', 'Concierge', 'Beach Access']
        }
        
        return base_amenities + level_amenities.get(price_level, [])
    
    def _analyze_hotel_options(self, hotels: list, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze hotel options and add LangGraph intelligence"""
        
        # Add intelligent scoring to each hotel
        for hotel in hotels:
            score = self._calculate_hotel_score(hotel, params)
            hotel['langgraph_score'] = score
            hotel['recommendation_reason'] = self._get_hotel_recommendation_reason(hotel, score)
        
        # Sort by LangGraph score
        hotels.sort(key=lambda x: x.get('langgraph_score', 0), reverse=True)
        
        # Generate overall analysis
        analysis = self._generate_hotel_analysis(hotels, params)
        
        return {
            'hotels': hotels,
            'analysis': analysis
        }
    
    def _calculate_hotel_score(self, hotel: Dict[str, Any], params: Dict[str, Any]) -> int:
        """Calculate intelligent hotel score"""
        score = 50  # Base score
        
        # Rating factor
        rating = hotel.get('rating', 0)
        if rating >= 4.5:
            score += 30
        elif rating >= 4.0:
            score += 20
        elif rating >= 3.5:
            score += 10
        else:
            score -= 10
        
        # Price level factor (balance of value and quality)
        price_level = hotel.get('price_level', 2)
        budget_preference = params.get('budget_level', 2)
        
        if price_level == budget_preference:
            score += 25  # Perfect match
        elif abs(price_level - budget_preference) == 1:
            score += 10  # Close match
        else:
            score -= 15  # Poor match
        
        # Distance factor
        distance_str = hotel.get('distance', '0 km')
        try:
            distance = float(distance_str.split(' ')[0])
            if distance <= 2:
                score += 20
            elif distance <= 5:
                score += 10
            elif distance <= 10:
                score += 5
            else:
                score -= 10
        except:
            pass
        
        # Amenities factor
        amenities = hotel.get('amenities', [])
        score += min(15, len(amenities) * 2)
        
        return max(0, min(100, score))
    
    def _get_hotel_recommendation_reason(self, hotel: Dict[str, Any], score: int) -> str:
        """Generate recommendation reason"""
        reasons = []
        
        if hotel.get('rating', 0) >= 4.5:
            reasons.append("excellent rating")
        elif hotel.get('rating', 0) >= 4.0:
            reasons.append("good rating")
        
        try:
            distance = float(hotel.get('distance', '0 km').split(' ')[0])
            if distance <= 2:
                reasons.append("central location")
        except:
            pass
        
        if hotel.get('price_level', 2) <= 2:
            reasons.append("good value")
        
        if score >= 80:
            return f"Highly recommended - {', '.join(reasons[:2])}"
        elif score >= 60:
            return f"Good choice - {', '.join(reasons[:2])}"
        else:
            return "Alternative option"
    
    def _generate_hotel_analysis(self, hotels: list, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall hotel analysis"""
        if not hotels:
            return {'summary': 'No hotels found'}
        
        # Price level distribution
        price_distribution = {}
        for hotel in hotels:
            level = hotel.get('price_level', 2)
            price_distribution[level] = price_distribution.get(level, 0) + 1
        
        # Rating analysis
        ratings = [h.get('rating', 0) for h in hotels if h.get('rating')]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        analysis = {
            'total_options': len(hotels),
            'average_rating': round(avg_rating, 1),
            'price_distribution': price_distribution,
            'best_value_hotel': hotels[0] if hotels else None,
            'high_rated_count': len([h for h in hotels if h.get('rating', 0) >= 4.0]),
            'recommendation': self._generate_overall_hotel_recommendation(hotels)
        }
        
        return analysis
    
    def _generate_overall_hotel_recommendation(self, hotels: list) -> str:
        """Generate overall recommendation"""
        if not hotels:
            return "No hotels available in this area"
        
        high_rated = len([h for h in hotels if h.get('rating', 0) >= 4.0])
        total = len(hotels)
        
        if high_rated >= total * 0.7:
            return f"Excellent selection with {high_rated}/{total} highly-rated options"
        elif high_rated >= total * 0.5:
            return f"Good variety with {high_rated}/{total} well-rated hotels"
        else:
            return f"Limited options - consider expanding search area or dates"
    
    def _generate_mock_hotels(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate mock hotel data when API fails"""
        
        destination = params.get('destination', 'Unknown')
        
        mock_hotels = [
            {
                'id': 'hotel_1',
                'name': 'Paradise Beach Resort',
                'rating': 4.5,
                'price_level': 3,
                'price_range': 'Upscale (₱5,000-10,000)',
                'address': f'{destination} Beach Area',
                'photo': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
                'amenities': ['Free WiFi', 'Pool', 'Beach Access', 'Restaurant'],
                'distance': '2.1 km from center',
                'is_recommended': True,
                'langgraph_score': 85,
                'recommendation_reason': 'Highly recommended - excellent rating, central location'
            },
            {
                'id': 'hotel_2', 
                'name': 'City Center Hotel',
                'rating': 4.2,
                'price_level': 2,
                'price_range': 'Mid-range (₱2,500-5,000)',
                'address': f'{destination} City Center',
                'photo': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
                'amenities': ['Free WiFi', 'Restaurant', 'Gym', 'Business Center'],
                'distance': '0.5 km from center',
                'is_recommended': True,
                'langgraph_score': 78,
                'recommendation_reason': 'Good choice - good rating, central location'
            },
            {
                'id': 'hotel_3',
                'name': 'Budget Inn',
                'rating': 3.8,
                'price_level': 1,
                'price_range': 'Budget (₱1,000-2,500)',
                'address': f'{destination} Downtown',
                'photo': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
                'amenities': ['Free WiFi', 'Air Conditioning', '24h Reception'],
                'distance': '1.2 km from center',
                'is_recommended': False,
                'langgraph_score': 65,
                'recommendation_reason': 'Good choice - good value'
            }
        ]
        
        return {
            'success': True,
            'hotels': mock_hotels,
            'location': destination,
            'fallback': True,
            'message': 'Using mock hotel data - API unavailable',
            'agent_type': 'hotel',
            'langgraph_analysis': {
                'total_options': 3,
                'average_rating': 4.2,
                'recommendation': 'Good variety with sample data - enable API for real results'
            }
        }