/**
 * Itinerary Deduplication Utility
 * Removes duplicate activities from itinerary, especially "Return to hotel" entries
 * Handles time format inconsistencies (12-hour vs 24-hour)
 */

import { isLogisticsItem } from './activityClassifier';

/**
 * Normalize time string to 24-hour format for comparison
 * @param {string} timeStr - Time string (e.g., "8:00 PM", "20:00", "8:00 AM")
 * @returns {string} - Normalized time in HH:MM format
 */
function normalizeTime(timeStr) {
  if (!timeStr) return '';
  
  const str = timeStr.trim().toUpperCase();
  
  // Already 24-hour format (HH:MM or H:MM)
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [hours, minutes] = str.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // 12-hour format with AM/PM
  const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return str; // Return as-is if can't parse
}

/**
 * Check if two activities are duplicates
 * @param {Object} activity1 - First activity
 * @param {Object} activity2 - Second activity
 * @returns {boolean} - True if activities are duplicates
 */
function isDuplicateActivity(activity1, activity2) {
  // Normalize place names for comparison
  const name1 = (activity1.placeName || '').toLowerCase().trim();
  const name2 = (activity2.placeName || '').toLowerCase().trim();
  
  // Check for same place name
  const sameName = name1 === name2;
  
  // Check for similar logistics items (return to hotel, check-in, meals)
  const bothLogistics = isLogisticsItem(activity1) && isLogisticsItem(activity2);
  
  if (bothLogistics) {
    // Special handling for "return to hotel" - multiple variations
    const isReturn1 = name1.includes('return') || name1.includes('back to') || name1.includes('evening at hotel');
    const isReturn2 = name2.includes('return') || name2.includes('back to') || name2.includes('evening at hotel');
    
    if (isReturn1 && isReturn2) {
      // Same type of return activity
      return true;
    }
    
    // Check-in/check-out duplicates
    const isCheckIn1 = name1.includes('check-in') || name1.includes('check in');
    const isCheckIn2 = name2.includes('check-in') || name2.includes('check in');
    if (isCheckIn1 && isCheckIn2) return true;
    
    const isCheckOut1 = name1.includes('check-out') || name1.includes('check out');
    const isCheckOut2 = name2.includes('check-out') || name2.includes('check out');
    if (isCheckOut1 && isCheckOut2) return true;
    
    // Meal duplicates (same meal type)
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'brunch'];
    for (const meal of mealTypes) {
      if (name1.includes(meal) && name2.includes(meal)) {
        return true;
      }
    }
  }
  
  // Check for exact name match
  if (sameName) {
    // If times are close (within 30 minutes), consider duplicate
    const time1 = normalizeTime(activity1.time);
    const time2 = normalizeTime(activity2.time);
    
    if (time1 && time2) {
      const [h1, m1] = time1.split(':').map(Number);
      const [h2, m2] = time2.split(':').map(Number);
      const minutes1 = h1 * 60 + m1;
      const minutes2 = h2 * 60 + m2;
      
      const timeDiff = Math.abs(minutes1 - minutes2);
      
      // Same activity within 30 minutes = duplicate
      if (timeDiff <= 30) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Deduplicate activities in a single day's plan
 * @param {Array} planArray - Array of activities for one day
 * @returns {Array} - Deduplicated activities
 */
export function deduplicateDayActivities(planArray) {
  if (!Array.isArray(planArray) || planArray.length === 0) {
    return planArray;
  }
  
  const deduplicated = [];
  const seen = new Set();
  
  for (let i = 0; i < planArray.length; i++) {
    const activity = planArray[i];
    
    // Check if we've already added a duplicate of this activity
    let isDuplicate = false;
    
    for (let j = 0; j < deduplicated.length; j++) {
      if (isDuplicateActivity(activity, deduplicated[j])) {
        isDuplicate = true;
        
        // Keep the one with more complete information
        if ((activity.placeDetails?.length || 0) > (deduplicated[j].placeDetails?.length || 0)) {
          // Replace with better version
          deduplicated[j] = activity;
        }
        
        break;
      }
    }
    
    if (!isDuplicate) {
      deduplicated.push(activity);
    }
  }
  
  return deduplicated;
}

/**
 * Deduplicate activities across entire itinerary
 * @param {Array} itinerary - Full itinerary with day objects
 * @returns {Array} - Deduplicated itinerary
 */
export function deduplicateItinerary(itinerary) {
  if (!Array.isArray(itinerary)) {
    return itinerary;
  }
  
  return itinerary.map(day => {
    if (!day.plan || !Array.isArray(day.plan)) {
      return day;
    }
    
    return {
      ...day,
      plan: deduplicateDayActivities(day.plan)
    };
  });
}

/**
 * Remove redundant "Return to hotel" entries (keep only the last one per day)
 * @param {Array} planArray - Array of activities for one day
 * @returns {Array} - Cleaned activities with single return
 */
export function consolidateHotelReturns(planArray) {
  if (!Array.isArray(planArray) || planArray.length === 0) {
    return planArray;
  }
  
  // Find all "return to hotel" activities
  const returnIndices = [];
  planArray.forEach((activity, index) => {
    const name = (activity.placeName || '').toLowerCase();
    if (name.includes('return') || name.includes('back to') || name.includes('evening at hotel')) {
      if (name.includes('hotel') || name.includes('homestay') || name.includes('resort')) {
        returnIndices.push(index);
      }
    }
  });
  
  // If multiple returns found, keep only the last one
  if (returnIndices.length > 1) {
    const keepIndex = returnIndices[returnIndices.length - 1];
    return planArray.filter((_, index) => {
      return !returnIndices.includes(index) || index === keepIndex;
    });
  }
  
  return planArray;
}

/**
 * Clean and deduplicate itinerary (main entry point)
 * @param {Array} itinerary - Full itinerary
 * @returns {Array} - Cleaned itinerary
 */
export function cleanItinerary(itinerary) {
  if (!Array.isArray(itinerary)) {
    return itinerary;
  }
  
  // Step 1: Deduplicate similar activities
  let cleaned = deduplicateItinerary(itinerary);
  
  // Step 2: Consolidate multiple hotel returns per day
  cleaned = cleaned.map(day => {
    if (!day.plan || !Array.isArray(day.plan)) {
      return day;
    }
    
    return {
      ...day,
      plan: consolidateHotelReturns(day.plan)
    };
  });
  
  return cleaned;
}
