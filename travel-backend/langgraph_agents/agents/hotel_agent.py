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
        
        # ✅ Log user preferences for debugging
        preferred_type = hotel_params.get('preferred_type', 'Any')
        budget_level = hotel_params.get('budget_level', 2)
        logger.info(f"🏨 Hotel search preferences: Type={preferred_type}, Budget Level={budget_level}")
        
        try:
            # Get location coordinates first
            coordinates = await self._get_location_coordinates(hotel_params.get('destination'))
            
            if not coordinates:
                # Fall back to mock data
                logger.warning(f"⚠️ Could not get coordinates, using mock data")
                return self._generate_mock_hotels(hotel_params)
            
            # Search for hotels using Google Places API
            hotels = await self._search_nearby_hotels(coordinates, hotel_params)
            
            if not hotels:
                logger.warning(f"⚠️ No hotels found, using mock data")
                return self._generate_mock_hotels(hotel_params)
            
            logger.info(f"✅ Found {len(hotels)} hotels matching criteria")
            
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
                'processing_time': getattr(self, 'execution_time_ms', None),
                'user_preferences': {
                    'preferred_type': preferred_type,
                    'budget_level': budget_level
                }
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
            
            # ✅ Map user's preferred type to Google Places search keywords
            preferred_type = params.get('preferred_type', '')
            search_keyword = self._get_search_keyword_for_type(preferred_type)
            
            search_params = {
                'location': f"{coordinates['lat']},{coordinates['lng']}",
                'radius': 50000,  # 50km radius
                'type': 'lodging',
                'key': api_key
            }
            
            # Add keyword filter if user specified a preference
            if search_keyword:
                search_params['keyword'] = search_keyword
                logger.info(f"🏨 Filtering hotels by type: {preferred_type} (keyword: {search_keyword})")
            
            response = requests.get(url, params=search_params, timeout=15)
            data = response.json()
            
            hotels = []
            if data.get('results'):
                for hotel_data in data['results'][:20]:  # Limit to 20 results
                    hotel = self._parse_hotel_data(hotel_data, coordinates, api_key)
                    if hotel:
                        # ✅ Add accommodation type classification
                        hotel['accommodation_type'] = self._classify_accommodation_type(hotel_data, preferred_type)
                        hotels.append(hotel)
                
                # ✅ Filter and prioritize by preferred type
                if preferred_type:
                    hotels = self._filter_by_accommodation_type(hotels, preferred_type)
            
            return hotels
            
        except Exception as e:
            logger.error(f"Hotel search API failed: {e}")
            return []
    
    def _get_search_keyword_for_type(self, preferred_type: str) -> str:
        """Map user's accommodation preference to Google Places search keyword"""
        keyword_mapping = {
            'hotel': 'hotel',
            'resort': 'resort',
            'hostel': 'hostel',
            'aparthotel': 'aparthotel serviced apartment',
            'guesthouse': 'guesthouse inn',
            'boutique': 'boutique hotel'
        }
        return keyword_mapping.get(preferred_type.lower(), '') if preferred_type else ''
    
    def _classify_accommodation_type(self, hotel_data: Dict[str, Any], preferred_type: str) -> str:
        """Classify accommodation type based on name and types"""
        name_lower = hotel_data.get('name', '').lower()
        types = hotel_data.get('types', [])
        
        # Check name for type indicators
        if 'resort' in name_lower:
            return 'resort'
        elif 'hostel' in name_lower or 'backpack' in name_lower:
            return 'hostel'
        elif 'apartment' in name_lower or 'aparthotel' in name_lower:
            return 'aparthotel'
        elif 'inn' in name_lower or 'guesthouse' in name_lower or 'guest house' in name_lower:
            return 'guesthouse'
        elif 'boutique' in name_lower:
            return 'boutique'
        elif 'hotel' in name_lower:
            return 'hotel'
        
        # Check Google Places types
        if 'resort' in types:
            return 'resort'
        elif 'hostel' in types:
            return 'hostel'
        
        # Default to hotel if uncertain
        return 'hotel'
    
    def _filter_by_accommodation_type(self, hotels: list, preferred_type: str) -> list:
        """Filter and prioritize hotels by accommodation type"""
        if not preferred_type:
            return hotels
        
        # Separate exact matches from others
        exact_matches = []
        other_matches = []
        
        for hotel in hotels:
            if hotel.get('accommodation_type') == preferred_type.lower():
                exact_matches.append(hotel)
            else:
                other_matches.append(hotel)
        
        # If we have exact matches, prioritize them but keep some alternatives
        if exact_matches:
            logger.info(f"✅ Found {len(exact_matches)} {preferred_type} matches out of {len(hotels)} total")
            # Return exact matches + top-rated alternatives (in case exact matches are limited)
            return exact_matches[:15] + other_matches[:5]
        else:
            logger.warning(f"⚠️ No exact {preferred_type} matches found, returning all results")
            return hotels
    
    def _parse_hotel_data(self, hotel_data: Dict[str, Any], center_coords: Dict[str, float], api_key: str) -> Dict[str, Any]:
        """Parse individual hotel data from Google Places API with enhanced photo handling"""
        
        try:
            # Basic hotel info
            hotel = {
                'id': hotel_data.get('place_id'),
                'name': hotel_data.get('name'),
                'hotelName': hotel_data.get('name'),  # Add hotelName field for frontend compatibility
                'rating': hotel_data.get('rating', 4.0),
                'user_ratings_total': hotel_data.get('user_ratings_total', 0),
                'reviews_count': hotel_data.get('user_ratings_total', 0),  # Alternative field name
                'price_level': hotel_data.get('price_level', 2),
                'address': hotel_data.get('vicinity'),
                'hotelAddress': hotel_data.get('vicinity'),  # Add hotelAddress for frontend compatibility
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
            hotel['priceRange'] = hotel['price_range']  # Alternative field name for frontend
            
            # Enhanced Photo Handling
            photos_data = self._get_hotel_photos(hotel_data, api_key)
            hotel.update(photos_data)
            
            # Distance calculation and coordinates
            hotel_location = hotel_data.get('geometry', {}).get('location', {})
            if hotel_location:
                # Add coordinates for Google Maps integration
                hotel['geoCoordinates'] = {
                    'latitude': hotel_location.get('lat'),
                    'longitude': hotel_location.get('lng')
                }
                
                distance = self._calculate_distance(
                    center_coords, 
                    {'lat': hotel_location['lat'], 'lng': hotel_location['lng']}
                )
                hotel['distance'] = f"{distance:.1f} km from center"
            else:
                hotel['distance'] = 'Distance unknown'
                hotel['geoCoordinates'] = None
            
            # Additional details from Google Places
            hotel['place_id'] = hotel_data.get('place_id')
            hotel['types'] = hotel_data.get('types', [])
            hotel['business_status'] = hotel_data.get('business_status', 'OPERATIONAL')
            
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
    
    def _get_hotel_photos(self, hotel_data: Dict[str, Any], api_key: str) -> Dict[str, Any]:
        """Enhanced photo handling for hotels with multiple image sources and fallbacks"""
        
        photos = hotel_data.get('photos', [])
        
        # Initialize photo data structure
        photo_data = {
            'photo': None,
            'imageUrl': None,
            'photoUrl': None,
            'photos': [],
            'hasPhotos': False,
            'photoCount': 0
        }
        
        try:
            if photos and len(photos) > 0:
                # Primary photo (highest quality)
                primary_photo = photos[0]
                photo_ref = primary_photo.get('photo_reference')
                
                if photo_ref:
                    # Generate multiple photo URLs with different sizes
                    photo_urls = {
                        'thumbnail': f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference={photo_ref}&key={api_key}",
                        'medium': f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_ref}&key={api_key}",
                        'large': f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo_ref}&key={api_key}"
                    }
                    
                    # Set primary photo fields (for backward compatibility)
                    photo_data['photo'] = photo_urls['medium']
                    photo_data['imageUrl'] = photo_urls['medium']
                    photo_data['photoUrl'] = photo_urls['medium']
                    photo_data['hasPhotos'] = True
                    photo_data['photoCount'] = len(photos)
                    
                    # Add photo size variants
                    photo_data['photoSizes'] = photo_urls
                    
                    # Process additional photos (up to 5 total)
                    all_photos = []
                    for i, photo in enumerate(photos[:5]):
                        if photo.get('photo_reference'):
                            photo_ref = photo['photo_reference']
                            photo_info = {
                                'index': i,
                                'photo_reference': photo_ref,
                                'thumbnail': f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference={photo_ref}&key={api_key}",
                                'medium': f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_ref}&key={api_key}",
                                'large': f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo_ref}&key={api_key}",
                                'width': photo.get('width', 400),
                                'height': photo.get('height', 300)
                            }
                            all_photos.append(photo_info)
                    
                    photo_data['photos'] = all_photos
                    
                    logger.info(f"🏨 Generated {len(all_photos)} photo URLs for hotel: {hotel_data.get('name')}")
                
                else:
                    logger.warning(f"🏨 No photo reference found for hotel: {hotel_data.get('name')}")
                    
            else:
                logger.warning(f"🏨 No photos available for hotel: {hotel_data.get('name')}")
                
        except Exception as e:
            logger.error(f"🏨 Error processing hotel photos: {e}")
            
        # Add fallback images if no Google Photos available
        if not photo_data['hasPhotos']:
            photo_data.update(self._get_fallback_hotel_images(hotel_data))
            
        return photo_data
    
    def _get_fallback_hotel_images(self, hotel_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback images for hotels without Google Photos"""
        
        hotel_name = hotel_data.get('name', 'Hotel')
        price_level = hotel_data.get('price_level', 2)
        
        # High-quality hotel stock images based on price level
        fallback_images = {
            1: [  # Budget hotels
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            2: [  # Mid-range hotels
                'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            3: [  # Upscale hotels
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            4: [  # Luxury hotels
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ]
        }
        
        # Select appropriate fallback image
        images_for_level = fallback_images.get(price_level, fallback_images[2])
        # Use hotel name hash to consistently select same image for same hotel
        image_index = hash(hotel_name) % len(images_for_level)
        selected_image = images_for_level[image_index]
        
        logger.info(f"🏨 Using fallback image for {hotel_name}: {selected_image}")
        
        return {
            'photo': selected_image,
            'imageUrl': selected_image, 
            'photoUrl': selected_image,
            'hasPhotos': True,
            'photoCount': 1,
            'isFallback': True,
            'photoSizes': {
                'thumbnail': selected_image.replace('w=800', 'w=200'),
                'medium': selected_image.replace('w=800', 'w=400'), 
                'large': selected_image
            },
            'photos': [{
                'index': 0,
                'thumbnail': selected_image.replace('w=800', 'w=200'),
                'medium': selected_image.replace('w=800', 'w=400'),
                'large': selected_image,
                'isFallback': True
            }]
        }
    
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
        
        # ✅ NEW: Accommodation type preference match
        preferred_type = params.get('preferred_type', '')
        accommodation_type = hotel.get('accommodation_type', '')
        if preferred_type and accommodation_type == preferred_type.lower():
            score += 20  # Bonus for matching user's preferred accommodation type
            logger.debug(f"✅ Hotel {hotel.get('name')} matches preferred type: {preferred_type}")
        
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
        
        # ✅ NEW: Mention accommodation type if it matches preference
        accommodation_type = hotel.get('accommodation_type', '')
        if accommodation_type:
            reasons.append(f"{accommodation_type}")
        
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
            return f"Highly recommended - {', '.join(reasons[:3])}"
        elif score >= 60:
            return f"Good choice - {', '.join(reasons[:3])}"
        else:
            return f"Alternative option - {', '.join(reasons[:2]) if reasons else 'available'}"
    
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
                'hotelName': 'Paradise Beach Resort',
                'rating': 4.5,
                'price_level': 3,
                'price_range': 'Upscale (₱5,000-10,000)',
                'priceRange': 'Upscale (₱5,000-10,000)',
                'address': f'{destination} Beach Area',
                'hotelAddress': f'{destination} Beach Area',
                'photo': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'imageUrl': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'photoUrl': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'hasPhotos': True,
                'photoCount': 3,
                'isFallback': True,
                'photoSizes': {
                    'thumbnail': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                    'medium': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                    'large': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                },
                'amenities': ['Free WiFi', 'Pool', 'Beach Access', 'Restaurant'],
                'distance': '2.1 km from center',
                'geoCoordinates': {'latitude': 14.5995, 'longitude': 120.9842},
                'place_id': 'ChIJi_mByhCjQjIRwC-F-KQw_so',
                'types': ['lodging', 'establishment'],
                'business_status': 'OPERATIONAL',
                'is_recommended': True,
                'langgraph_score': 85,
                'recommendation_reason': 'Highly recommended - excellent rating, central location'
            },
            {
                'id': 'hotel_2', 
                'name': 'City Center Hotel',
                'hotelName': 'City Center Hotel',
                'rating': 4.2,
                'price_level': 2,
                'price_range': 'Mid-range (₱2,500-5,000)',
                'priceRange': 'Mid-range (₱2,500-5,000)',
                'address': f'{destination} City Center',
                'hotelAddress': f'{destination} City Center',
                'photo': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'imageUrl': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'photoUrl': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'hasPhotos': True,
                'photoCount': 2,
                'isFallback': True,
                'photoSizes': {
                    'thumbnail': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                    'medium': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                    'large': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                },
                'amenities': ['Free WiFi', 'Restaurant', 'Gym', 'Business Center'],
                'distance': '0.5 km from center',
                'geoCoordinates': {'latitude': 14.5547, 'longitude': 121.0244},
                'place_id': 'ChIJATaCTJCjQjIRwC-F-KQw_so',
                'types': ['lodging', 'establishment'],
                'business_status': 'OPERATIONAL',
                'is_recommended': True,
                'langgraph_score': 78,
                'recommendation_reason': 'Good choice - good rating, central location'
            },
            {
                'id': 'hotel_3',
                'name': 'Budget Inn',
                'hotelName': 'Budget Inn',
                'rating': 3.8,
                'price_level': 1,
                'price_range': 'Budget (₱1,000-2,500)',
                'priceRange': 'Budget (₱1,000-2,500)',
                'address': f'{destination} Downtown',
                'hotelAddress': f'{destination} Downtown',
                'photo': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'imageUrl': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'photoUrl': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'hasPhotos': True,
                'photoCount': 1,
                'isFallback': True,
                'photoSizes': {
                    'thumbnail': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                    'medium': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                    'large': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                },
                'amenities': ['Free WiFi', 'Air Conditioning', '24h Reception'],
                'distance': '1.2 km from center',
                'geoCoordinates': {'latitude': 14.5701, 'longitude': 120.9930},
                'place_id': 'ChIJBTaCTJCjQjIRwC-F-KQw_so',
                'types': ['lodging', 'establishment'],
                'business_status': 'OPERATIONAL',
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