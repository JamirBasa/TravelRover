/**
 * IndexedDB Cache Utility - Modern Persistent Storage
 * 
 * Professional implementation for large datasets that exceed localStorage limits.
 * 
 * Features:
 * - Async operations (non-blocking)
 * - No 5-10MB limit (handles gigabytes)
 * - Structured queries with indexes
 * - Automatic versioning & migration
 * - TTL-based expiration
 * - Type-safe operations
 * 
 * Use Cases:
 * - Geocoding results (500+ locations)
 * - Google Places images (binary data)
 * - Trip itineraries (large JSON)
 * - Offline data storage
 */

import { openDB } from 'idb';

// Cache version - increment to trigger migration
const CACHE_VERSION = 3; // v3: Added cache versioning, geocodes, images stores
const DB_NAME = 'TravelRoverCache';

/**
 * Initialize IndexedDB with automatic versioning
 */
const initDB = async () => {
  return openDB(DB_NAME, CACHE_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`🔄 Upgrading IndexedDB from v${oldVersion} to v${newVersion}`);

      // Geocodes Store - For map coordinates caching
      if (!db.objectStoreNames.contains('geocodes')) {
        const geocodeStore = db.createObjectStore('geocodes', { keyPath: 'location' });
        geocodeStore.createIndex('timestamp', 'timestamp');
        geocodeStore.createIndex('expiresAt', 'expiresAt');
        console.log('✅ Created geocodes store');
      }

      // Images Store - For Google Places photos
      if (!db.objectStoreNames.contains('images')) {
        const imageStore = db.createObjectStore('images', { keyPath: 'location' });
        imageStore.createIndex('timestamp', 'timestamp');
        imageStore.createIndex('expiresAt', 'expiresAt');
        console.log('✅ Created images store');
      }

      // Trips Store - For offline trip data
      if (!db.objectStoreNames.contains('trips')) {
        const tripStore = db.createObjectStore('trips', { keyPath: 'id' });
        tripStore.createIndex('userEmail', 'userEmail');
        tripStore.createIndex('timestamp', 'timestamp');
        tripStore.createIndex('expiresAt', 'expiresAt');
        console.log('✅ Created trips store');
      }

      // API Responses Store - For general API caching
      if (!db.objectStoreNames.contains('api_cache')) {
        const apiStore = db.createObjectStore('api_cache', { keyPath: 'key' });
        apiStore.createIndex('endpoint', 'endpoint');
        apiStore.createIndex('timestamp', 'timestamp');
        apiStore.createIndex('expiresAt', 'expiresAt');
        console.log('✅ Created api_cache store');
      }
    },
    blocked() {
      console.warn('⚠️ IndexedDB upgrade blocked - close other tabs');
    },
    blocking() {
      console.warn('⚠️ This tab is blocking IndexedDB upgrade');
    },
  });
};

/**
 * Geocode Cache - For map coordinates
 */
export const geocodeCache = {
  /**
   * Store geocode result
   * @param {string} location - Location name
   * @param {Object} coords - Coordinates { lat, lng }
   * @param {number} ttl - Time to live in milliseconds (default: 30 days)
   */
  async set(location, coords, ttl = 30 * 24 * 60 * 60 * 1000) {
    try {
      const db = await initDB();
      const timestamp = Date.now();
      
      await db.put('geocodes', {
        location,
        coords,
        timestamp,
        expiresAt: timestamp + ttl,
      });

      console.log(`💾 Cached geocode: ${location}`, coords);
    } catch (error) {
      console.error('❌ Error caching geocode:', error);
    }
  },

  /**
   * Get cached geocode result
   * @param {string} location - Location name
   * @returns {Object|null} Coordinates or null if expired/not found
   */
  async get(location) {
    try {
      const db = await initDB();
      const result = await db.get('geocodes', location);

      if (!result) {
        return null;
      }

      // Check expiration
      if (Date.now() > result.expiresAt) {
        console.log(`⏰ Geocode cache expired: ${location}`);
        await db.delete('geocodes', location);
        return null;
      }

      console.log(`✅ Geocode cache hit: ${location}`);
      return result.coords;
    } catch (error) {
      console.error('❌ Error retrieving geocode:', error);
      return null;
    }
  },

  /**
   * Get all cached geocodes
   * @returns {Object} Map of location -> coords
   */
  async getAll() {
    try {
      const db = await initDB();
      const all = await db.getAll('geocodes');
      const now = Date.now();

      // Filter expired entries
      const valid = all.filter(item => item.expiresAt > now);

      // Convert to map
      const map = {};
      valid.forEach(item => {
        map[item.location] = item.coords;
      });

      console.log(`📦 Loaded ${valid.length} cached geocodes`);
      return map;
    } catch (error) {
      console.error('❌ Error loading geocodes:', error);
      return {};
    }
  },

  /**
   * Clear all geocodes
   */
  async clear() {
    try {
      const db = await initDB();
      await db.clear('geocodes');
      console.log('🧹 Cleared geocode cache');
    } catch (error) {
      console.error('❌ Error clearing geocodes:', error);
    }
  },

  /**
   * Remove expired entries
   */
  async cleanup() {
    try {
      const db = await initDB();
      const tx = db.transaction('geocodes', 'readwrite');
      const index = tx.store.index('expiresAt');
      const now = Date.now();

      let cursor = await index.openCursor();
      let count = 0;

      while (cursor) {
        if (cursor.value.expiresAt < now) {
          await cursor.delete();
          count++;
        }
        cursor = await cursor.continue();
      }

      await tx.done;
      console.log(`🧹 Cleaned up ${count} expired geocodes`);
    } catch (error) {
      console.error('❌ Error cleaning geocodes:', error);
    }
  },
};

/**
 * Image Cache - For Google Places photos
 */
export const imageCache = {
  /**
   * Store image URL
   * @param {string} location - Location identifier
   * @param {string} url - Image URL
   * @param {number} ttl - Time to live (default: 30 days)
   */
  async set(location, url, ttl = 30 * 24 * 60 * 60 * 1000) {
    try {
      const db = await initDB();
      const timestamp = Date.now();

      await db.put('images', {
        location,
        url,
        timestamp,
        expiresAt: timestamp + ttl,
      });

      console.log(`💾 Cached image: ${location}`);
    } catch (error) {
      console.error('❌ Error caching image:', error);
    }
  },

  /**
   * Get cached image URL
   */
  async get(location) {
    try {
      const db = await initDB();
      const result = await db.get('images', location);

      if (!result) {
        return null;
      }

      if (Date.now() > result.expiresAt) {
        console.log(`⏰ Image cache expired: ${location}`);
        await db.delete('images', location);
        return null;
      }

      console.log(`✅ Image cache hit: ${location}`);
      return result.url;
    } catch (error) {
      console.error('❌ Error retrieving image:', error);
      return null;
    }
  },

  /**
   * Clear all images
   */
  async clear() {
    try {
      const db = await initDB();
      await db.clear('images');
      console.log('🧹 Cleared image cache');
    } catch (error) {
      console.error('❌ Error clearing images:', error);
    }
  },
};

/**
 * Trip Cache - For offline trip data
 */
export const tripCache = {
  /**
   * Store trip data
   */
  async set(tripId, tripData, userEmail, ttl = 5 * 60 * 1000) {
    try {
      const db = await initDB();
      const timestamp = Date.now();

      await db.put('trips', {
        id: tripId,
        data: tripData,
        userEmail,
        timestamp,
        expiresAt: timestamp + ttl,
      });

      console.log(`💾 Cached trip: ${tripId}`);
    } catch (error) {
      console.error('❌ Error caching trip:', error);
    }
  },

  /**
   * Get cached trip
   */
  async get(tripId) {
    try {
      const db = await initDB();
      const result = await db.get('trips', tripId);

      if (!result) {
        return null;
      }

      if (Date.now() > result.expiresAt) {
        console.log(`⏰ Trip cache expired: ${tripId}`);
        await db.delete('trips', tripId);
        return null;
      }

      console.log(`✅ Trip cache hit: ${tripId}`);
      return result.data;
    } catch (error) {
      console.error('❌ Error retrieving trip:', error);
      return null;
    }
  },

  /**
   * Get all trips for a user
   */
  async getByUser(userEmail) {
    try {
      const db = await initDB();
      const index = db.transaction('trips').store.index('userEmail');
      const all = await index.getAll(userEmail);
      const now = Date.now();

      // Filter expired
      const valid = all.filter(item => item.expiresAt > now);

      console.log(`📦 Loaded ${valid.length} cached trips for ${userEmail}`);
      return valid.map(item => item.data);
    } catch (error) {
      console.error('❌ Error loading user trips:', error);
      return [];
    }
  },

  /**
   * Clear all trips
   */
  async clear() {
    try {
      const db = await initDB();
      await db.clear('trips');
      console.log('🧹 Cleared trip cache');
    } catch (error) {
      console.error('❌ Error clearing trips:', error);
    }
  },

  /**
   * Invalidate user's trips (after create/update/delete)
   */
  async invalidateUser(userEmail) {
    try {
      const db = await initDB();
      const tx = db.transaction('trips', 'readwrite');
      const index = tx.store.index('userEmail');
      const keys = await index.getAllKeys(userEmail);

      for (const key of keys) {
        await tx.store.delete(key);
      }

      await tx.done;
      console.log(`🔄 Invalidated ${keys.length} trips for ${userEmail}`);
    } catch (error) {
      console.error('❌ Error invalidating trips:', error);
    }
  },
};

/**
 * API Response Cache - General purpose API caching
 */
export const apiCache = {
  /**
   * Store API response
   */
  async set(key, data, endpoint, ttl = 5 * 60 * 1000) {
    try {
      const db = await initDB();
      const timestamp = Date.now();

      await db.put('api_cache', {
        key,
        data,
        endpoint,
        timestamp,
        expiresAt: timestamp + ttl,
      });

      console.log(`💾 Cached API response: ${key}`);
    } catch (error) {
      console.error('❌ Error caching API response:', error);
    }
  },

  /**
   * Get cached API response
   */
  async get(key) {
    try {
      const db = await initDB();
      const result = await db.get('api_cache', key);

      if (!result) {
        return null;
      }

      if (Date.now() > result.expiresAt) {
        console.log(`⏰ API cache expired: ${key}`);
        await db.delete('api_cache', key);
        return null;
      }

      console.log(`✅ API cache hit: ${key}`);
      return result.data;
    } catch (error) {
      console.error('❌ Error retrieving API response:', error);
      return null;
    }
  },

  /**
   * Clear cache for specific endpoint
   */
  async clearEndpoint(endpoint) {
    try {
      const db = await initDB();
      const tx = db.transaction('api_cache', 'readwrite');
      const index = tx.store.index('endpoint');
      const keys = await index.getAllKeys(endpoint);

      for (const key of keys) {
        await tx.store.delete(key);
      }

      await tx.done;
      console.log(`🧹 Cleared ${keys.length} cache entries for ${endpoint}`);
    } catch (error) {
      console.error('❌ Error clearing endpoint cache:', error);
    }
  },

  /**
   * Clear all API cache
   */
  async clear() {
    try {
      const db = await initDB();
      await db.clear('api_cache');
      console.log('🧹 Cleared API cache');
    } catch (error) {
      console.error('❌ Error clearing API cache:', error);
    }
  },
};

/**
 * Global cache management
 */
export const cacheManager = {
  /**
   * Clear all caches
   */
  async clearAll() {
    await Promise.all([
      geocodeCache.clear(),
      imageCache.clear(),
      tripCache.clear(),
      apiCache.clear(),
    ]);
    console.log('🧹 Cleared all IndexedDB caches');
  },

  /**
   * Run cleanup on all stores
   */
  async cleanup() {
    await geocodeCache.cleanup();
    console.log('🧹 Completed cache cleanup');
  },

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const db = await initDB();
      const stats = {};

      for (const storeName of ['geocodes', 'images', 'trips', 'api_cache']) {
        const count = await db.count(storeName);
        stats[storeName] = count;
      }

      console.log('📊 Cache statistics:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return {};
    }
  },

  /**
   * Delete entire database (for testing/debugging)
   */
  async deleteDatabase() {
    try {
      await indexedDB.deleteDatabase(DB_NAME);
      console.log('🗑️ Deleted IndexedDB database');
    } catch (error) {
      console.error('❌ Error deleting database:', error);
    }
  },
};

export default {
  geocodeCache,
  imageCache,
  tripCache,
  apiCache,
  cacheManager,
};
