/**
 * Request Deduplication Utility
 * Prevents duplicate API calls with identical parameters
 * 
 * Use Case:
 * - User clicks "Generate Trip" multiple times rapidly
 * - Same form data submitted multiple times
 * - Identical API requests within short timeframe
 * 
 * Features:
 * - Prevents duplicate requests
 * - Returns existing promise for identical requests
 * - Automatic cleanup after TTL
 * - Memory efficient (limits stored requests)
 */

class RequestDeduplicator {
  constructor(options = {}) {
    this.pendingRequests = new Map();
    this.maxPendingRequests = options.maxPendingRequests || 100;
    this.defaultTTL = options.defaultTTL || 30000; // 30 seconds
  }

  /**
   * Deduplicate request - returns existing promise if identical request pending
   * @param {string} key - Unique identifier for the request
   * @param {Function} requestFn - Async function to execute
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise} Request result
   */
  async deduplicate(key, requestFn, ttl = this.defaultTTL) {
    // Check if identical request is already pending
    if (this.pendingRequests.has(key)) {
      console.log('🔄 Request deduplication:', key);
      console.log('   ↳ Returning existing promise instead of making new request');
      return this.pendingRequests.get(key);
    }

    // Check memory limits
    if (this.pendingRequests.size >= this.maxPendingRequests) {
      console.warn('⚠️ Max pending requests reached, clearing oldest');
      const firstKey = this.pendingRequests.keys().next().value;
      this.pendingRequests.delete(firstKey);
    }

    // Execute request and store promise
    const promise = requestFn()
      .then((result) => {
        console.log('✅ Request completed:', key);
        return result;
      })
      .catch((error) => {
        console.error('❌ Request failed:', key, error.message);
        throw error;
      })
      .finally(() => {
        // Clean up after TTL
        setTimeout(() => {
          if (this.pendingRequests.get(key) === promise) {
            this.pendingRequests.delete(key);
            console.log('♻️  Request cleanup:', key);
          }
        }, ttl);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Generate cache key from parameters
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  generateKey(params) {
    try {
      // Sort keys for consistent hashing
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          acc[key] = params[key];
          return acc;
        }, {});
      
      return JSON.stringify(sortedParams);
    } catch (error) {
      console.error('Error generating key:', error);
      return Math.random().toString(36); // Fallback to random key
    }
  }

  /**
   * Check if request is pending
   * @param {string} key - Request key
   * @returns {boolean} True if request is pending
   */
  isPending(key) {
    return this.pendingRequests.has(key);
  }

  /**
   * Cancel pending request
   * @param {string} key - Request key
   */
  cancel(key) {
    if (this.pendingRequests.has(key)) {
      this.pendingRequests.delete(key);
      console.log('🚫 Request cancelled:', key);
    }
  }

  /**
   * Clear all pending requests
   */
  clearAll() {
    const count = this.pendingRequests.size;
    this.pendingRequests.clear();
    console.log(`🗑️  Cleared ${count} pending requests`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      maxCapacity: this.maxPendingRequests,
      utilizationPercent: Math.round(
        (this.pendingRequests.size / this.maxPendingRequests) * 100
      ),
    };
  }
}

// Create singleton instance
const deduplicator = new RequestDeduplicator({
  maxPendingRequests: 100,
  defaultTTL: 30000, // 30 seconds
});

/**
 * Convenience function for trip generation deduplication
 * @param {Object} formData - Trip form data
 * @param {Function} generateFn - Trip generation function
 * @returns {Promise} Trip generation result
 */
export const deduplicateTripGeneration = async (formData, generateFn) => {
  const key = deduplicator.generateKey({
    action: 'generate_trip',
    location: formData.location,
    startDate: formData.startDate,
    endDate: formData.endDate,
    duration: formData.duration,
    travelers: formData.travelers,
    budget: formData.budget,
  });

  return deduplicator.deduplicate(key, generateFn, 60000); // 1 minute TTL
};

/**
 * Convenience function for API request deduplication
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @param {Function} requestFn - Request function
 * @returns {Promise} Request result
 */
export const deduplicateApiRequest = async (endpoint, params, requestFn) => {
  const key = deduplicator.generateKey({
    endpoint,
    ...params,
  });

  return deduplicator.deduplicate(key, requestFn);
};

// Export singleton instance and class
export { deduplicator as requestDeduplicator, RequestDeduplicator };

export default deduplicator;
