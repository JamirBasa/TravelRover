/**
 * Request Cache Utility
 * Implements intelligent caching for API responses to reduce redundant calls
 * 
 * Features:
 * - Time-based TTL (Time To Live)
 * - Memory management with size limits
 * - Cache key generation
 * - Conditional caching based on response status
 */

class RequestCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 50; // Maximum number of cached items
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    this.enabled = options.enabled !== false; // Allow disabling cache
  }

  /**
   * Generate cache key from request parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    
    return `${endpoint}::${JSON.stringify(sortedParams)}`;
  }

  /**
   * Get cached response if valid
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  get(key) {
    if (!this.enabled) return null;

    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access time for LRU tracking
    cached.lastAccessed = Date.now();
    
    console.log(`✅ Cache HIT: ${key}`);
    return cached.data;
  }

  /**
   * Store response in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, data, ttl = this.defaultTTL) {
    if (!this.enabled) return;

    // Enforce size limit using LRU
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + ttl,
    });

    console.log(`💾 Cache SET: ${key} (TTL: ${ttl / 1000}s)`);
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Cache EVICTED (LRU): ${oldestKey}`);
    }
  }

  /**
   * Invalidate specific cache entry
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`❌ Cache INVALIDATED: ${key}`);
    }
  }

  /**
   * Invalidate all cache entries matching pattern
   * @param {string|RegExp} pattern - Pattern to match
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    console.log(`❌ Cache INVALIDATED (pattern): ${count} entries`);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    console.log(`🧹 Cache CLEARED`);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      enabled: this.enabled,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
const requestCache = new RequestCache({
  maxSize: 50,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  enabled: true,
});

/**
 * Wrapper for cached API calls
 * @param {string} endpoint - API endpoint
 * @param {Function} apiCall - Function that makes the API call
 * @param {Object} options - Caching options
 * @returns {Promise} API response
 */
export const cachedApiCall = async (endpoint, apiCall, options = {}) => {
  const {
    params = {},
    ttl = 5 * 60 * 1000,
    forceRefresh = false,
    cacheCondition = (response) => response?.success !== false,
  } = options;

  const cacheKey = requestCache.generateKey(endpoint, params);

  // Check cache unless force refresh
  if (!forceRefresh) {
    const cached = requestCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Make API call
  console.log(`🌐 API CALL: ${endpoint}`);
  const response = await apiCall();

  // Cache if condition met
  if (cacheCondition(response)) {
    requestCache.set(cacheKey, response, ttl);
  }

  return response;
};

/**
 * Invalidate trip-related cache entries
 * Call this after creating/updating/deleting a trip
 */
export const invalidateTripCache = () => {
  requestCache.invalidatePattern(/trip|session/i);
};

/**
 * Get cache instance for advanced usage
 */
export const getCacheInstance = () => requestCache;

export default {
  cachedApiCall,
  invalidateTripCache,
  getCacheInstance,
  RequestCache,
};
