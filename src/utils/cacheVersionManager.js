/**
 * Cache Version Manager
 * 
 * Handles application-wide cache versioning with automatic cleanup.
 * 
 * When you update data structures or change cache formats:
 * 1. Increment CACHE_VERSION
 * 2. System automatically clears old caches
 * 3. Users get fresh data without manual intervention
 */

import { cacheManager as indexedDBManager } from './indexedDBCache';

// ==========================================
// Cache Version Configuration
// ==========================================
const CACHE_VERSION_KEY = 'travelrover_cache_version';
const CURRENT_VERSION = '2025-12-v1'; // Update this when making breaking changes

/**
 * Cache version history (for documentation)
 * 
 * 2025-12-v1: Initial React Query + IndexedDB implementation
 *   - Migrated from localStorage to IndexedDB
 *   - Added React Query for server-state management
 *   - Removed legacy cacheManager.js and requestCache.js
 */

// ==========================================
// Version Management
// ==========================================

/**
 * Get current cache version from storage
 */
const getStoredVersion = () => {
  try {
    return localStorage.getItem(CACHE_VERSION_KEY);
  } catch {
    return null;
  }
};

/**
 * Store current cache version
 */
const setStoredVersion = (version) => {
  try {
    localStorage.setItem(CACHE_VERSION_KEY, version);
  } catch (error) {
    console.error('❌ Failed to store cache version:', error);
  }
};

/**
 * Check if cache version has changed
 */
export const hasCacheVersionChanged = () => {
  const stored = getStoredVersion();
  return stored !== CURRENT_VERSION;
};

/**
 * Clear all legacy localStorage caches
 */
const clearLegacyLocalStorageCaches = () => {
  const legacyKeys = [
    'travelrover_geocode_cache_v1', // Old geocode cache
    'travelrover_gp_img_', // Google Places image cache prefix
    'tripCache',
    'userProfile',
    'draftTrip',
  ];

  let clearedCount = 0;

  try {
    // Clear specific keys
    legacyKeys.forEach(key => {
      if (key.endsWith('_')) {
        // Handle prefix-based caches
        Object.keys(localStorage).forEach(storageKey => {
          if (storageKey.startsWith(key)) {
            localStorage.removeItem(storageKey);
            clearedCount++;
          }
        });
      } else {
        // Handle exact match keys
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    });

    console.log(`🧹 Cleared ${clearedCount} legacy localStorage cache entries`);
  } catch (error) {
    console.error('❌ Error clearing legacy caches:', error);
  }
};

/**
 * Clear all IndexedDB caches
 */
const clearIndexedDBCaches = async () => {
  try {
    await indexedDBManager.clearAll();
    console.log('🧹 Cleared all IndexedDB caches');
  } catch (error) {
    console.error('❌ Error clearing IndexedDB:', error);
  }
};

/**
 * Clear React Query cache
 * (Note: This is handled by QueryClient.clear() in the app)
 */
const clearReactQueryCache = () => {
  // React Query cache is in-memory and will be cleared on page reload
  console.log('ℹ️ React Query cache will clear on reload');
};

/**
 * Initialize cache version system
 * Checks version and clears outdated caches if needed
 */
export const initializeCacheVersion = async () => {
  const storedVersion = getStoredVersion();

  console.log('🔍 Cache version check:', {
    current: CURRENT_VERSION,
    stored: storedVersion || 'none',
  });

  if (storedVersion !== CURRENT_VERSION) {
    console.log('🔄 Cache version changed - clearing old caches');

    // Clear all caches
    clearLegacyLocalStorageCaches();
    await clearIndexedDBCaches();
    clearReactQueryCache();

    // Update version
    setStoredVersion(CURRENT_VERSION);

    console.log('✅ Cache migration complete');
    return { migrated: true, from: storedVersion, to: CURRENT_VERSION };
  }

  console.log('✅ Cache version up to date');
  return { migrated: false };
};

/**
 * Force clear all caches (for debugging)
 */
export const forceClearAllCaches = async () => {
  console.log('🧹 Force clearing all caches...');
  
  clearLegacyLocalStorageCaches();
  await clearIndexedDBCaches();
  clearReactQueryCache();
  
  // Reset version
  localStorage.removeItem(CACHE_VERSION_KEY);
  
  console.log('✅ All caches cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const indexedDBStats = await indexedDBManager.getStats();
    
    const stats = {
      version: CURRENT_VERSION,
      storedVersion: getStoredVersion(),
      indexedDB: indexedDBStats,
      localStorage: {
        used: 0,
        items: 0,
      },
    };

    // Count localStorage items
    try {
      stats.localStorage.items = localStorage.length;
      
      // Estimate localStorage size
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalSize += key.length + (value ? value.length : 0);
      }
      stats.localStorage.used = Math.round(totalSize / 1024); // KB
    } catch {
      stats.localStorage.error = 'Unable to calculate';
    }

    return stats;
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    return null;
  }
};

/**
 * Export version info for Settings page
 */
export const getCacheVersionInfo = () => {
  return {
    current: CURRENT_VERSION,
    stored: getStoredVersion(),
    isUpToDate: !hasCacheVersionChanged(),
  };
};

export default {
  initializeCacheVersion,
  hasCacheVersionChanged,
  forceClearAllCaches,
  getCacheStats,
  getCacheVersionInfo,
  CURRENT_VERSION,
};
