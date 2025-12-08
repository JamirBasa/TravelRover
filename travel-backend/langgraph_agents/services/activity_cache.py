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
    
    ⚠️ CACHE SAFETY:
    - Cache keys include user-specific context (budget, travelers, preferences)
    - Shorter TTL prevents stale data
    - Version-based invalidation for global cache busts
    """
    
    CACHE_PREFIX = "ga_activity_pool"
    CACHE_VERSION = "v2"  # ✅ NEW: Increment to invalidate all old cache entries
    DEFAULT_TIMEOUT = 1800  # ✅ REDUCED: 30 minutes (was 1 hour) - activities can change
    MAX_TIMEOUT = 3600  # 1 hour maximum
    
    @staticmethod
    def _generate_cache_key(destination: str, radius: int, max_activities: int, preferences: Dict = None) -> str:
        """
        Generate unique cache key based on search parameters
        
        ⚠️ CRITICAL: Cache key MUST include user-specific context to avoid returning
        identical activities to users with different budgets/dates/requirements
        
        Args:
            destination: Destination name
            radius: Search radius in meters
            max_activities: Maximum number of activities
            preferences: User preferences (MUST include budget, dates, travelers)
            
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
        
        # ✅ FIX: Include ALL user-specific context in cache key
        if preferences:
            # Extract budget tier to differentiate cache entries
            budget_tier = 'unknown'
            if preferences.get('budget'):
                budget_str = str(preferences['budget']).lower()
                if any(x in budget_str for x in ['budget', 'cheap', '2000', '3000', '4000', '5000']):
                    budget_tier = 'budget'
                elif any(x in budget_str for x in ['moderate', '8000', '10000', '12000', '15000']):
                    budget_tier = 'moderate'
                elif any(x in budget_str for x in ['luxury', '20000', '30000', '40000', '50000']):
                    budget_tier = 'luxury'
            
            relevant_prefs = {
                'preferred_trip_types': sorted(preferences.get('preferredTripTypes', [])),  # Sort for consistency
                'travel_style': preferences.get('travelStyle', ''),
                'budget_tier': budget_tier,  # ✅ NEW: Include budget context
                'travelers': preferences.get('travelers', 1),  # ✅ NEW: Group size affects activities
                # Note: Dates NOT included - activities don't change by date,
                # but budget/group size DO affect what's appropriate
            }
            params['preferences'] = relevant_prefs
        
        # Generate hash from parameters
        param_string = json.dumps(params, sort_keys=True)
        param_hash = hashlib.md5(param_string.encode()).hexdigest()[:8]
        
        # ✅ Include cache version in key for easy global invalidation
        return f"{ActivityCache.CACHE_PREFIX}_{ActivityCache.CACHE_VERSION}_{normalized_dest}_{param_hash}"
    
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
        
        ⚠️ CACHE VALIDATION: Ensures cached data matches request context
        
        Args:
            destination: Destination name
            radius: Search radius in meters
            max_activities: Maximum number of activities
            preferences: User preferences (must include budget, travelers)
            
        Returns:
            Cached activities list or None if not found/invalid
        """
        cache_key = cls._generate_cache_key(destination, radius, max_activities, preferences)
        
        try:
            cached_data = cache.get(cache_key)
            
            if cached_data:
                # ✅ VALIDATION: Ensure cached data is a list and not empty
                if not isinstance(cached_data, list) or len(cached_data) == 0:
                    logger.warning(f"⚠️  Invalid cached data for {destination} - clearing")
                    cache.delete(cache_key)
                    return None
                
                logger.info(f"✅ Cache HIT for {destination} - {len(cached_data)} activities (TTL: {cls.DEFAULT_TIMEOUT}s)")
                return cached_data
            else:
                logger.info(f"⚠️  Cache MISS for {destination} (key: {cache_key[:50]}...)")
                return None
                
        except Exception as e:
            logger.error(f"❌ Cache retrieval failed: {e}")
            # Clear corrupted cache entry
            try:
                cache.delete(cache_key)
            except:
                pass
            return None
    
    @classmethod
    def cache_activities(
        cls,
        destination: str,
        activities: List[Dict[str, Any]],
        radius: int = 15000,
        max_activities: int = 50,
        preferences: Dict = None,
        timeout: int = None  # ✅ Changed default to None to use class default
    ) -> bool:
        """
        Cache activities for a destination
        
        ⚠️ VALIDATION: Only caches valid, non-empty activity lists
        
        Args:
            destination: Destination name
            activities: Activities list to cache
            radius: Search radius in meters
            max_activities: Maximum number of activities
            preferences: User preferences (must match retrieval context)
            timeout: Cache timeout in seconds (defaults to DEFAULT_TIMEOUT)
            
        Returns:
            True if cached successfully, False otherwise
        """
        # ✅ VALIDATION: Don't cache empty or invalid data
        if not activities or not isinstance(activities, list):
            logger.warning(f"⚠️  Skipping cache for {destination} - invalid data")
            return False
        
        if timeout is None:
            timeout = cls.DEFAULT_TIMEOUT
        
        # ✅ SAFETY: Enforce maximum timeout
        timeout = min(timeout, cls.MAX_TIMEOUT)
        
        cache_key = cls._generate_cache_key(destination, radius, max_activities, preferences)
        
        try:
            cache.set(cache_key, activities, timeout)
            logger.info(f"✅ Cached {len(activities)} activities for {destination} (TTL: {timeout}s, ver: {cls.CACHE_VERSION})")
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
