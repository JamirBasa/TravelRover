/**
 * Firebase Document Size Validator
 * Prevents exceeding Firebase document size limits and quota issues
 * 
 * Firebase Limits:
 * - Maximum document size: 1 MB (1,048,576 bytes)
 * - Maximum writes per second: 10,000 (free tier has lower limits)
 * - Daily quota: 50K reads, 20K writes, 20K deletes (free tier)
 */

// Firebase document size limit
const FIREBASE_MAX_DOC_SIZE = 1048576; // 1 MB
const WARNING_THRESHOLD = 0.8; // Warn at 80% of limit

/**
 * Calculate size of data in bytes
 * @param {any} data - Data to measure
 * @returns {number} Size in bytes
 */
export const calculateDataSize = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch (error) {
    console.error('Error calculating data size:', error);
    return 0;
  }
};

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "523 KB")
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate if data is within Firebase size limits
 * @param {any} data - Data to validate
 * @returns {Object} Validation result
 */
export const validateFirebaseDocSize = (data) => {
  const size = calculateDataSize(data);
  const percentOfLimit = (size / FIREBASE_MAX_DOC_SIZE) * 100;
  
  const result = {
    valid: size <= FIREBASE_MAX_DOC_SIZE,
    size,
    sizeFormatted: formatBytes(size),
    limit: FIREBASE_MAX_DOC_SIZE,
    limitFormatted: formatBytes(FIREBASE_MAX_DOC_SIZE),
    percentOfLimit: Math.round(percentOfLimit * 100) / 100,
    warning: size > FIREBASE_MAX_DOC_SIZE * WARNING_THRESHOLD,
  };
  
  if (!result.valid) {
    result.error = `Document size (${result.sizeFormatted}) exceeds Firebase limit (${result.limitFormatted})`;
    result.suggestion = 'Consider splitting data into multiple documents or removing large fields';
  } else if (result.warning) {
    result.warningMessage = `Document size (${result.sizeFormatted}) is ${result.percentOfLimit}% of limit`;
    result.suggestion = 'Consider optimizing data to reduce size';
  }
  
  return result;
};

/**
 * Optimize data by removing large or unnecessary fields
 * @param {Object} data - Data to optimize
 * @returns {Object} Optimized data
 */
export const optimizeFirebaseDoc = (data) => {
  const optimized = { ...data };
  
  // Remove null/undefined values
  Object.keys(optimized).forEach(key => {
    if (optimized[key] === null || optimized[key] === undefined) {
      delete optimized[key];
    }
  });
  
  // Truncate long strings in certain fields
  const truncateField = (obj, field, maxLength = 1000) => {
    if (obj[field] && typeof obj[field] === 'string' && obj[field].length > maxLength) {
      obj[field] = obj[field].substring(0, maxLength) + '... [truncated]';
      console.warn(`⚠️ Truncated ${field} from ${obj[field].length} to ${maxLength} chars`);
    }
  };
  
  // Truncate potentially large fields
  if (optimized.specificRequests) {
    truncateField(optimized, 'specificRequests', 1000);
  }
  
  // Optimize itinerary by removing verbose descriptions
  if (optimized.tripData?.itinerary) {
    optimized.tripData.itinerary = optimized.tripData.itinerary.map(day => ({
      ...day,
      activities: day.activities?.map(activity => ({
        ...activity,
        // Keep only essential fields
        placeName: activity.placeName,
        placeDetails: activity.placeDetails?.substring(0, 200), // Truncate
        timeTravel: activity.timeTravel,
        ticketPricing: activity.ticketPricing,
      })),
    }));
  }
  
  return optimized;
};

/**
 * Safe Firebase document save with size validation
 * @param {Function} saveFunction - Firebase save function (setDoc, updateDoc, etc.)
 * @param {any} data - Data to save
 * @param {Object} options - Options
 * @returns {Promise<Object>} Save result
 */
export const safeFirebaseSave = async (saveFunction, data, options = {}) => {
  const {
    autoOptimize = true,
    throwOnError = false,
    onSizeWarning = null,
  } = options;
  
  // Validate initial size
  let validation = validateFirebaseDocSize(data);
  
  console.log(`📊 Firebase Document Size: ${validation.sizeFormatted} (${validation.percentOfLimit}% of limit)`);
  
  // If over limit and auto-optimize is enabled
  if (!validation.valid && autoOptimize) {
    console.warn(`⚠️ Document too large, attempting optimization...`);
    const optimizedData = optimizeFirebaseDoc(data);
    validation = validateFirebaseDocSize(optimizedData);
    
    if (validation.valid) {
      console.log(`✅ Optimization successful: ${validation.sizeFormatted}`);
      data = optimizedData;
    }
  }
  
  // Handle warnings
  if (validation.warning && onSizeWarning) {
    onSizeWarning(validation);
  }
  
  // If still over limit
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.validation = validation;
    
    if (throwOnError) {
      throw error;
    } else {
      console.error('❌ Firebase save failed:', validation.error);
      return { success: false, error: validation.error, validation };
    }
  }
  
  // Perform save
  try {
    await saveFunction(data);
    return { 
      success: true, 
      validation,
      message: `Document saved successfully (${validation.sizeFormatted})`
    };
  } catch (error) {
    console.error('❌ Firebase save error:', error);
    return { 
      success: false, 
      error: error.message,
      validation
    };
  }
};

/**
 * Analyze Firebase quota usage (estimate)
 * @param {number} savesPerDay - Estimated saves per day
 * @returns {Object} Quota analysis
 */
export const analyzeFirebaseQuota = (savesPerDay) => {
  const FREE_TIER_WRITES = 20000; // per day
  const percentUsed = (savesPerDay / FREE_TIER_WRITES) * 100;
  
  return {
    savesPerDay,
    freeTierLimit: FREE_TIER_WRITES,
    percentUsed: Math.round(percentUsed * 100) / 100,
    remaining: FREE_TIER_WRITES - savesPerDay,
    warning: percentUsed > 80,
    critical: percentUsed > 95,
  };
};

export default {
  calculateDataSize,
  formatBytes,
  validateFirebaseDocSize,
  optimizeFirebaseDoc,
  safeFirebaseSave,
  analyzeFirebaseQuota,
};
