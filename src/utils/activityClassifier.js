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

  // Exclude meals (generic and specific patterns)
  if (text.includes('breakfast') || text.includes('lunch') || text.includes('dinner') ||
      text.includes('meal') || text.includes('snack') || text.includes('coffee break') ||
      text.includes('brunch') || text.includes('eating') || text.includes('food stop') ||
      text.includes('breakfast at') || text.includes('lunch at') || text.includes('dinner at') ||
      text.includes('eat at') || text.includes('dine at') || text.includes('food court') ||
      text.includes('merienda') || text.includes('light meal') || text.includes('quick bite')) {
    return true;
  }

  // Exclude transit and transportation (expanded patterns)
  if (text.includes('transfer') || text.includes('arrive') || text.includes('arrival') ||
      text.includes('depart') || text.includes('departure') ||
      text.includes('bus to') || text.includes('flight to') || text.includes('drive to') ||
      text.includes('taxi to') || text.includes('grab to') || text.includes('uber to') ||
      text.includes('taxi') || text.includes('grab') || text.includes('jeepney') ||
      text.includes('transport') || text.includes('travel to') || text.includes('ride to') ||
      text.includes('van transfer') || text.includes('shuttle to') || text.includes('ferry to') ||
      text.includes('airport transfer') || text.includes('ground transfer') ||
      text.includes('proceed to') || text.includes('head to') || text.includes('commute to')) {
    return true;
  }

  // Exclude hotel operations (comprehensive patterns)
  if (text.includes('check-in') || text.includes('check in') || 
      text.includes('check-out') || text.includes('check out') ||
      text.includes('checkout') || text.includes('checkin') ||
      text.includes('return to hotel') || text.includes('hotel return') ||
      text.includes('back to hotel') || text.includes('rest at hotel') ||
      text.includes('hotel rest') || text.includes('freshen up') ||
      text.includes('hotel check') || text.includes('settle in') ||
      text.includes('unpack') || text.includes('prepare for next day')) {
    return true;
  }

  // Exclude rest/downtime (expanded patterns)
  if (text.includes('rest') || text.includes('relax') || text.includes('free time') ||
      text.includes('leisure time') || text.includes('downtime') ||
      text.includes('rest period') || text.includes('break time') ||
      text.includes('chill') || text.includes('unwind') || text.includes('recuperate')) {
    return true;
  }

  // Exclude airport operations
  if (text.includes('airport') && (
      text.includes('arrival') || text.includes('departure') ||
      text.includes('flight') || text.includes('terminal') ||
      text.includes('boarding') || text.includes('check-in')
  )) {
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
