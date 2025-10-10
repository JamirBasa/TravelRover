# langgraph_agents/services/activity_cache.py
"""
Activity caching service for GA-First workflow optimization
"""

from django.core.cache import cache
from typing import List, Dict, Any, Optional
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class ActivityCache:
    """
    Cache activity pool data to reduce Google Places API calls
    and speed up GA-First workflow for repeat destinations
    """
    
    CACHE_PREFIX = "ga_activity_pool"
    DEFAULT_TIMEOUT = 3600  # 1 hour (activities don't change frequently)
    
    @staticmethod
    def _generate_cache_key(destination: str, radius: int, max_activities: int, preferences: Dict = None) -> str:
        """
        Generate unique cache key based on search parameters
        
        Args:
            destination: Destination name
            radius: Search radius in meters
            max_activities: Maximum number of activities
            preferences: User preferences (optional)
            
        Returns:
            Cache key string
        """
        # Normalize destination (lowercase, strip whitespace)
        normalized_dest = destination.lower().strip()
        
        # Create parameter signature
        params = {
            'destination': normalized_dest,
            'radius': radius,
            'max_activities': max_activities
        }
        
        # Include relevant preferences if provided
        if preferences:
            relevant_prefs = {
                'preferred_trip_types': preferences.get('preferredTripTypes', []),
                'travel_style': preferences.get('travelStyle', ''),
            }
            params['preferences'] = relevant_prefs
        
        # Generate hash from parameters
        param_string = json.dumps(params, sort_keys=True)
        param_hash = hashlib.md5(param_string.encode()).hexdigest()[:8]
        
        return f"{ActivityCache.CACHE_PREFIX}_{normalized_dest}_{param_hash}"
    
    @classmethod
    def get_cached_activities(
        cls,
        destination: str,
        radius: int = 15000,
        max_activities: int = 50,
        preferences: Dict = None
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve cached activities for a destination
        
        Args:
            destination: Destination name
            radius: Search radius in meters
            max_activities: Maximum number of activities
            preferences: User preferences
            
        Returns:
            Cached activities list or None if not found
        """
        cache_key = cls._generate_cache_key(destination, radius, max_activities, preferences)
        
        try:
            cached_data = cache.get(cache_key)
            
            if cached_data:
                logger.info(f"✅ Cache HIT for {destination} - {len(cached_data)} activities")
                return cached_data
            else:
                logger.info(f"⚠️  Cache MISS for {destination}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Cache retrieval failed: {e}")
            return None
    
    @classmethod
    def cache_activities(
        cls,
        destination: str,
        activities: List[Dict[str, Any]],
        radius: int = 15000,
        max_activities: int = 50,
        preferences: Dict = None,
        timeout: int = DEFAULT_TIMEOUT
    ) -> bool:
        """
        Cache activities for a destination
        
        Args:
            destination: Destination name
            activities: Activities list to cache
            radius: Search radius in meters
            max_activities: Maximum number of activities
            preferences: User preferences
            timeout: Cache timeout in seconds
            
        Returns:
            True if cached successfully, False otherwise
        """
        cache_key = cls._generate_cache_key(destination, radius, max_activities, preferences)
        
        try:
            cache.set(cache_key, activities, timeout)
            logger.info(f"✅ Cached {len(activities)} activities for {destination} (TTL: {timeout}s)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Cache storage failed: {e}")
            return False
    
    @classmethod
    def clear_destination_cache(cls, destination: str) -> int:
        """
        Clear all cached data for a destination
        
        Args:
            destination: Destination name
            
        Returns:
            Number of cache entries cleared
        """
        normalized_dest = destination.lower().strip()
        pattern = f"{cls.CACHE_PREFIX}_{normalized_dest}_*"
        
        try:
            # Note: This requires Redis cache backend for pattern matching
            # For simple cache backends, this might not work
            cache.delete_pattern(pattern)
            logger.info(f"✅ Cleared cache for destination: {destination}")
            return 1
            
        except AttributeError:
            logger.warning("Cache backend doesn't support pattern deletion")
            return 0
        except Exception as e:
            logger.error(f"❌ Cache clearing failed: {e}")
            return 0
    
    @classmethod
    def get_cache_stats(cls) -> Dict[str, Any]:
        """
        Get cache statistics (if supported by cache backend)
        
        Returns:
            Cache statistics dictionary
        """
        try:
            # This is backend-specific
            stats = {
                'backend': cache.__class__.__name__,
                'supported_operations': {
                    'get': True,
                    'set': True,
                    'delete': True,
                    'pattern_delete': hasattr(cache, 'delete_pattern')
                }
            }
            return stats
            
        except Exception as e:
            logger.error(f"❌ Failed to get cache stats: {e}")
            return {'error': str(e)}


# Convenience functions
def get_cached_activity_pool(destination: str, radius: int = 15000, max_activities: int = 50, preferences: Dict = None):
    """Convenience function for getting cached activities"""
    return ActivityCache.get_cached_activities(destination, radius, max_activities, preferences)


def cache_activity_pool(destination: str, activities: List[Dict], radius: int = 15000, max_activities: int = 50, preferences: Dict = None):
    """Convenience function for caching activities"""
    return ActivityCache.cache_activities(destination, activities, radius, max_activities, preferences)
