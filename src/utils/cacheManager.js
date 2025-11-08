/**
 * Cache Manager Utility
 * Efficient caching for API responses and Firebase queries
 * 
 * Features:
 * - LRU (Least Recently Used) eviction
 * - Time-based TTL (Time To Live)
 * - Pattern-based invalidation
 * - Memory efficient
 * - Cache statistics
 */

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttls = new Map();
    this.accessTimes = new Map();
    this.maxSize = options.maxSize || 50;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Get cached value or execute function
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Async function to execute on cache miss
   * @param {Object} options - Options
   * @returns {Promise} Cached or fetched value
   */
  async getOrFetch(key, fetchFn, options = {}) {
    const { ttl = this.defaultTTL, forceRefresh = false } = options;

    // Check cache
    if (!forceRefresh && this.has(key)) {
      this.stats.hits++;
      console.log(`✅ Cache hit: ${key}`);
      return this.get(key);
    }

    // Cache miss
    this.stats.misses++;
    console.log(`🔄 Cache miss: ${key}`);

    try {
      const value = await fetchFn();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      console.error(`❌ Cache fetch error for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set cache value with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    // Clear old timeout if exists
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
    }

    // Set value
    this.cache.set(key, value);
    this.accessTimes.set(key, Date.now());

    // Set TTL timeout
    const timeout = setTimeout(() => {
      this.delete(key);
      console.log(`♻️  Cache expired: ${key}`);
    }, ttl);

    this.ttls.set(key, timeout);
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key) {
    if (this.cache.has(key)) {
      // Update access time for LRU
      this.accessTimes.set(key, Date.now());
      return this.cache.get(key);
    }
    return undefined;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
      this.ttls.delete(key);
    }
    this.accessTimes.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      console.log(`🗑️  LRU eviction: ${oldestKey}`);
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string|RegExp} pattern - Pattern to match
   */
  invalidate(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    console.log(`♻️  Invalidated ${count} cache entries matching ${pattern}`);
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timeouts
    for (const timeout of this.ttls.values()) {
      clearTimeout(timeout);
    }

    const count = this.cache.size;
    this.cache.clear();
    this.ttls.clear();
    this.accessTimes.clear();

    console.log(`🗑️  Cleared ${count} cache entries`);
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? Math.round((this.stats.hits / totalRequests) * 100) 
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100),
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: `${hitRate}%`,
      totalRequests,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager({
  maxSize: 50,
  defaultTTL: 300000, // 5 minutes
});

/**
 * Cache trip data
 * @param {string} userEmail - User email
 * @param {Function} fetchFn - Function to fetch trips
 * @returns {Promise} Trips data
 */
export const cacheUserTrips = async (userEmail, fetchFn) => {
  const key = `trips_${userEmail}`;
  return cacheManager.getOrFetch(key, fetchFn, {
    ttl: 60000, // 1 minute for trips list
  });
};

/**
 * Cache single trip
 * @param {string} tripId - Trip ID
 * @param {Function} fetchFn - Function to fetch trip
 * @returns {Promise} Trip data
 */
export const cacheSingleTrip = async (tripId, fetchFn) => {
  const key = `trip_${tripId}`;
  return cacheManager.getOrFetch(key, fetchFn, {
    ttl: 300000, // 5 minutes for single trip
  });
};

/**
 * Cache user profile
 * @param {string} userEmail - User email
 * @param {Function} fetchFn - Function to fetch profile
 * @returns {Promise} Profile data
 */
export const cacheUserProfile = async (userEmail, fetchFn) => {
  const key = `profile_${userEmail}`;
  return cacheManager.getOrFetch(key, fetchFn, {
    ttl: 600000, // 10 minutes for profile
  });
};

/**
 * Invalidate trip cache
 * @param {string} userEmail - Optional user email
 */
export const invalidateTripCache = (userEmail = null) => {
  if (userEmail) {
    cacheManager.invalidate(`trips_${userEmail}`);
    cacheManager.invalidate(`trip_.*`); // Invalidate all trips
  } else {
    cacheManager.invalidate('trip');
  }
};

/**
 * Invalidate profile cache
 * @param {string} userEmail - User email
 */
export const invalidateProfileCache = (userEmail) => {
  cacheManager.invalidate(`profile_${userEmail}`);
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  cacheManager.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return cacheManager.getStats();
};

// Export manager instance and class
export { cacheManager, CacheManager };

export default cacheManager;
