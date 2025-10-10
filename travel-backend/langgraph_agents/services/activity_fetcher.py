"""
Activity Pool Fetcher - Fetches all possible activities for GA optimization
Uses Google Places API to get comprehensive activity data
"""

import os
import requests
import logging
from typing import List, Dict, Any
from django.conf import settings
from .activity_cache import ActivityCache

logger = logging.getLogger(__name__)


class ActivityPoolFetcher:
    """Fetches comprehensive activity pool for genetic algorithm optimization"""
    
    # Activity categories for different user preferences
    ACTIVITY_CATEGORIES = {
        'Cultural': ['museum', 'art_gallery', 'church', 'hindu_temple', 'synagogue', 'mosque'],
        'Nature': ['park', 'natural_feature', 'zoo', 'aquarium', 'campground'],
        'Entertainment': ['amusement_park', 'bowling_alley', 'movie_theater', 'night_club', 'casino'],
        'Shopping': ['shopping_mall', 'department_store', 'clothing_store', 'book_store'],
        'Food': ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway'],
        'Historical': ['tourist_attraction', 'point_of_interest', 'establishment'],
        'Adventure': ['stadium', 'gym', 'spa', 'rv_park'],
        'Relaxation': ['spa', 'beauty_salon', 'park', 'cafe']
    }
    
    def __init__(self):
        # Try to get from Django settings first, fallback to environment variable
        try:
            from django.conf import settings
            self.api_key = settings.GOOGLE_PLACES_API_KEY
        except (ImportError, AttributeError):
            self.api_key = os.getenv('GOOGLE_PLACES_API_KEY')
        
        if not self.api_key:
            raise ValueError("GOOGLE_PLACES_API_KEY not configured")
        
        self.base_url = "https://maps.googleapis.com/maps/api/place"
    
    async def fetch_activity_pool(
        self,
        destination: str,
        user_preferences: Dict[str, Any],
        radius: int = 20000,  # 20km default
        max_activities: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Fetch comprehensive activity pool for destination
        
        Args:
            destination: City/location name
            user_preferences: User's activity preferences
            radius: Search radius in meters
            max_activities: Maximum activities to fetch
        
        Returns:
            List of activity dictionaries with details
        """
        
        logger.info(f"🔍 Fetching activity pool for {destination}")
        
        # 🚀 NEW: Try to get from cache first
        cached_activities = ActivityCache.get_cached_activities(
            destination=destination,
            radius=radius,
            max_activities=max_activities,
            preferences=user_preferences
        )
        
        if cached_activities:
            logger.info(f"⚡ Using cached activities for {destination} - saved 5-8s!")
            return cached_activities
        
        try:
            # Step 1: Get destination coordinates
            coordinates = await self._get_coordinates(destination)
            if not coordinates:
                logger.error(f"Failed to get coordinates for {destination}")
                return []
            
            logger.info(f"📍 Location: {coordinates['lat']}, {coordinates['lng']}")
            
            # Step 2: Determine activity types to search
            activity_types = self._get_activity_types(user_preferences)
            logger.info(f"🎯 Searching for types: {activity_types}")
            
            # Step 3: Fetch activities for each type
            all_activities = []
            for activity_type in activity_types:
                activities = await self._search_places(
                    coordinates,
                    activity_type,
                    radius
                )
                all_activities.extend(activities)
            
            # Step 4: Deduplicate and enhance
            unique_activities = self._deduplicate_activities(all_activities)
            enhanced_activities = await self._enhance_activities(unique_activities)
            
            # Step 5: Sort by relevance and limit
            sorted_activities = self._sort_by_relevance(
                enhanced_activities,
                user_preferences
            )
            
            final_activities = sorted_activities[:max_activities]
            
            # 🚀 NEW: Cache the results for future requests
            ActivityCache.cache_activities(
                destination=destination,
                activities=final_activities,
                radius=radius,
                max_activities=max_activities,
                preferences=user_preferences,
                timeout=3600  # 1 hour cache
            )
            
            logger.info(f"✅ Fetched {len(final_activities)} activities (cached for next request)")
            return final_activities
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch activity pool: {str(e)}")
            return []
    
    async def _get_coordinates(self, destination: str) -> Dict[str, float]:
        """Get coordinates for destination using Geocoding API"""
        
        try:
            url = f"{self.base_url}/findplacefromtext/json"
            params = {
                'input': destination,
                'inputtype': 'textquery',
                'fields': 'geometry',
                'key': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get('status') == 'OK' and data.get('candidates'):
                location = data['candidates'][0]['geometry']['location']
                return {
                    'lat': location['lat'],
                    'lng': location['lng']
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Geocoding failed: {str(e)}")
            return None
    
    def _get_activity_types(self, user_preferences: Dict[str, Any]) -> List[str]:
        """Determine which activity types to search based on user preferences"""
        
        preferred_categories = user_preferences.get('activityTypes', [])
        
        # Map user preferences to Google Places types
        types_to_search = set()
        
        for category in preferred_categories:
            if category in self.ACTIVITY_CATEGORIES:
                types_to_search.update(self.ACTIVITY_CATEGORIES[category])
        
        # If no preferences, include popular types
        if not types_to_search:
            types_to_search = {
                'tourist_attraction', 'museum', 'park', 'restaurant',
                'shopping_mall', 'church', 'point_of_interest'
            }
        
        return list(types_to_search)
    
    async def _search_places(
        self,
        coordinates: Dict[str, float],
        place_type: str,
        radius: int
    ) -> List[Dict[str, Any]]:
        """Search for places of specific type near coordinates"""
        
        try:
            url = f"{self.base_url}/nearbysearch/json"
            params = {
                'location': f"{coordinates['lat']},{coordinates['lng']}",
                'radius': radius,
                'type': place_type,
                'key': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get('status') == 'OK':
                results = data.get('results', [])
                
                # Convert to our activity format
                activities = []
                for place in results:
                    activity = self._convert_place_to_activity(place, place_type)
                    if activity:
                        activities.append(activity)
                
                logger.info(f"  Found {len(activities)} {place_type} activities")
                return activities
            
            return []
            
        except Exception as e:
            logger.error(f"Place search failed for {place_type}: {str(e)}")
            return []
    
    def _convert_place_to_activity(
        self,
        place: Dict[str, Any],
        activity_type: str
    ) -> Dict[str, Any]:
        """Convert Google Places result to activity format"""
        
        try:
            return {
                'placeName': place.get('name', 'Unknown'),
                'placeDetails': place.get('vicinity', ''),
                'placeImageUrl': self._get_place_photo(place),
                'geoCoordinates': {
                    'latitude': place['geometry']['location']['lat'],
                    'longitude': place['geometry']['location']['lng']
                },
                'ticketPricing': self._estimate_price(place, activity_type),
                'rating': place.get('rating', 0),
                'userRatingCount': place.get('user_ratings_total', 0),
                'placeId': place.get('place_id', ''),
                'activityType': activity_type,
                'businessStatus': place.get('business_status', 'OPERATIONAL'),
                'openNow': place.get('opening_hours', {}).get('open_now', True),
                'priceLevel': place.get('price_level', 2),
                'types': place.get('types', []),
                'timeTravel': self._estimate_duration(activity_type)
            }
        except Exception as e:
            logger.error(f"Failed to convert place: {str(e)}")
            return None
    
    def _get_place_photo(self, place: Dict[str, Any]) -> str:
        """Get photo URL for place"""
        
        photos = place.get('photos', [])
        if photos:
            photo_reference = photos[0].get('photo_reference')
            if photo_reference:
                return f"{self.base_url}/photo?maxwidth=400&photoreference={photo_reference}&key={self.api_key}"
        
        return None
    
    def _estimate_price(self, place: Dict[str, Any], activity_type: str) -> str:
        """Estimate price based on place data and type"""
        
        price_level = place.get('price_level', 2)
        
        # Price ranges based on price_level (0-4)
        price_ranges = {
            0: 'Free',
            1: '₱50 - ₱200',
            2: '₱200 - ₱500',
            3: '₱500 - ₱1,500',
            4: '₱1,500 - ₱5,000'
        }
        
        # Specific overrides for certain types
        if activity_type in ['park', 'church', 'point_of_interest']:
            return 'Free'
        elif activity_type in ['museum', 'art_gallery']:
            return price_ranges.get(price_level, '₱150 - ₱300')
        
        return price_ranges.get(price_level, '₱200 - ₱500')
    
    def _estimate_duration(self, activity_type: str) -> str:
        """Estimate time needed for activity"""
        
        duration_map = {
            'museum': '2 - 3 hours',
            'art_gallery': '1.5 - 2 hours',
            'park': '1 - 2 hours',
            'restaurant': '1 - 1.5 hours',
            'shopping_mall': '2 - 3 hours',
            'church': '30 minutes - 1 hour',
            'tourist_attraction': '1 - 2 hours',
            'amusement_park': '3 - 5 hours',
            'zoo': '2 - 3 hours',
            'aquarium': '2 - 3 hours'
        }
        
        return duration_map.get(activity_type, '1.5 - 2 hours')
    
    def _deduplicate_activities(
        self,
        activities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Remove duplicate activities based on place name and coordinates"""
        
        seen = set()
        unique = []
        
        for activity in activities:
            # Create unique key from name and coordinates
            key = (
                activity['placeName'].lower(),
                round(activity['geoCoordinates']['latitude'], 4),
                round(activity['geoCoordinates']['longitude'], 4)
            )
            
            if key not in seen:
                seen.add(key)
                unique.append(activity)
        
        logger.info(f"🔄 Deduplicated: {len(activities)} → {len(unique)}")
        return unique
    
    async def _enhance_activities(
        self,
        activities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Enhance activities with additional details"""
        
        # Could add:
        # - Reviews
        # - Detailed descriptions
        # - Popular times
        # - etc.
        
        return activities
    
    def _sort_by_relevance(
        self,
        activities: List[Dict[str, Any]],
        user_preferences: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Sort activities by relevance to user preferences"""
        
        def calculate_relevance(activity):
            score = 0
            
            # Rating score (0-5)
            score += activity.get('rating', 0) * 20
            
            # Popularity score (reviews)
            review_count = activity.get('userRatingCount', 0)
            score += min(review_count / 100, 10)
            
            # Business status
            if activity.get('businessStatus') == 'OPERATIONAL':
                score += 10
            
            # Open now
            if activity.get('openNow'):
                score += 5
            
            # Activity type match
            preferred_types = user_preferences.get('activityTypes', [])
            activity_type = activity.get('activityType', '')
            
            for pref in preferred_types:
                if pref.lower() in activity_type.lower():
                    score += 30
            
            return score
        
        return sorted(activities, key=calculate_relevance, reverse=True)


# Async wrapper for synchronous code
async def fetch_activity_pool_async(*args, **kwargs):
    """Async wrapper for activity fetcher"""
    fetcher = ActivityPoolFetcher()
    return await fetcher.fetch_activity_pool(*args, **kwargs)
