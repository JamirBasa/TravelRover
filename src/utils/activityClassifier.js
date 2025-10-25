/**
 * Unified Activity Classification Utility
 * Used by both itineraryAutoFix.js and itineraryValidator.js
 * to ensure consistent activity counting logic
 */

/**
 * Determine if an item is a logistics/non-activity item
 * @param {Object|string} item - Activity item or text
 * @returns {boolean} - True if it's logistics, false if it's a real activity
 */
export function isLogisticsItem(item) {
  // Convert item to text for analysis
  let text = '';
  
  if (typeof item === 'string') {
    text = item.toLowerCase();
  } else if (item && typeof item === 'object') {
    const placeName = (item.placeName || '').toLowerCase();
    const placeDetails = (item.placeDetails || '').toLowerCase();
    text = placeName + ' ' + placeDetails;
  } else {
    return false; // Unknown format, treat as activity
  }

  // Exclude meals
  if (text.includes('breakfast') || text.includes('lunch') || text.includes('dinner') ||
      text.includes('meal') || text.includes('snack') || text.includes('coffee break') ||
      text.includes('brunch') || text.includes('eating') || text.includes('food stop')) {
    return true;
  }

  // Exclude transit and transportation
  if (text.includes('transfer') || text.includes('arrive') || text.includes('arrival') ||
      text.includes('depart') || text.includes('departure') ||
      text.includes('bus to') || text.includes('flight to') || text.includes('drive to') ||
      text.includes('taxi') || text.includes('grab') || text.includes('jeepney') ||
      text.includes('transport') || text.includes('travel to')) {
    return true;
  }

  // Exclude hotel operations
  if (text.includes('check-in') || text.includes('check in') || 
      text.includes('check-out') || text.includes('check out') ||
      text.includes('return to hotel') || text.includes('hotel return') ||
      text.includes('back to hotel') || text.includes('rest at hotel') ||
      text.includes('hotel rest') || text.includes('freshen up')) {
    return true;
  }

  // Exclude rest/downtime
  if (text.includes('rest') || text.includes('relax') || text.includes('free time') ||
      text.includes('leisure time') || text.includes('downtime')) {
    return true;
  }

  // If none of the logistics keywords match, it's a real activity
  return false;
}

/**
 * Count real activities (excluding logistics) from a day's plan
 * @param {Array} planArray - Array of activity items
 * @returns {Object} - { activities: Array, logistics: Array, activityCount: number }
 */
export function classifyActivities(planArray) {
  if (!Array.isArray(planArray)) {
    return { activities: [], logistics: [], activityCount: 0 };
  }

  const activities = [];
  const logistics = [];

  planArray.forEach((item) => {
    if (isLogisticsItem(item)) {
      logistics.push(item);
    } else {
      activities.push(item);
    }
  });

  return {
    activities,
    logistics,
    activityCount: activities.length
  };
}

/**
 * Get activity count constraints based on day type
 * @param {boolean} isFirstDay - Is this the arrival day?
 * @param {boolean} isLastDay - Is this the departure day?
 * @param {number} activityPreference - User's preferred activity count (1-3)
 * @returns {Object} - { min: number, max: number, target: number }
 */
export function getActivityConstraints(isFirstDay, isLastDay, activityPreference = 2) {
  if (isFirstDay) {
    return { min: 0, max: 2, target: 1 }; // Arrival day: light schedule
  }
  
  if (isLastDay) {
    return { min: 0, max: 1, target: 0 }; // Departure day: minimal activities
  }
  
  // Middle days: flexible based on user preference
  const minActivities = Math.max(1, activityPreference - 1);
  const maxActivities = activityPreference + 1;
  
  return { 
    min: minActivities, 
    max: maxActivities, 
    target: activityPreference 
  };
}
