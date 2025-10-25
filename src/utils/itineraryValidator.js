// src/utils/itineraryValidator.js
/**
 * Validates generated itineraries for critical travel requirements
 */

// Cities without direct airports (require nearest airport recommendations)
const CITIES_WITHOUT_AIRPORTS = [
  'baguio',
  'el nido',
  'sagada',
  'vigan',
  'banaue',
  'batad',
  'camiguin',
  'siquijor',
];

// Nearest airport recommendations
const NEAREST_AIRPORT_INFO = {
  baguio: { airport: 'Manila (MNL) or Clark (CRK)', transfer: '4-6 hours by bus', cost: '₱500-800' },
  'el nido': { airport: 'Puerto Princesa (PPS)', transfer: '5-6 hours by van', cost: '₱600-1,200' },
  sagada: { airport: 'Manila (MNL)', transfer: '12 hours by bus', cost: '₱800-1,200' },
  vigan: { airport: 'Laoag (LAO)', transfer: '2 hours by bus', cost: '₱200-400' },
  banaue: { airport: 'Manila (MNL)', transfer: '9 hours by bus', cost: '₱600-900' },
  batad: { airport: 'Manila (MNL)', transfer: '10+ hours', cost: '₱800-1,000' },
  camiguin: { airport: 'Cagayan de Oro (CGY)', transfer: '2 hours by ferry', cost: '₱500' },
  siquijor: { airport: 'Dumaguete or Tagbilaran', transfer: 'Ferry connection', cost: '₱300-500' },
};

/**
 * Validate and fix activity count per day based on user preference
 * @param {Object} tripData - AI-generated trip data
 * @param {Object} formData - User's form data
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[], fixedItinerary?: Object[] }
 */
export const validateActivityCount = (tripData, formData) => {
  const errors = [];
  const warnings = [];
  const itinerary = tripData?.itinerary || [];
  const activityPreference = parseInt(formData?.activityPreference) || 2;
  const totalDays = itinerary.length;

  itinerary.forEach((day, index) => {
    const dayNum = day.day || index + 1;
    const isFirstDay = dayNum === 1;
    const isLastDay = dayNum === totalDays;
    const isMiddleDay = !isFirstDay && !isLastDay;

    // Parse activities from plan array or planText
    let activities = [];
    if (Array.isArray(day.plan)) {
      activities = day.plan;
    } else if (day.planText) {
      activities = day.planText.split('|').map(a => a.trim());
    }

    // Count main activities (exclude meals, transit, hotel check-in/out)
    const mainActivities = activities.filter(activity => {
      const text = typeof activity === 'string'
        ? activity.toLowerCase()
        : (activity?.placeName || '').toLowerCase();

      // Exclude meals
      if (text.includes('breakfast') || text.includes('lunch') || text.includes('dinner') ||
          text.includes('meal') || text.includes('snack') || text.includes('coffee break')) {
        return false;
      }

      // Exclude transit and hotel operations
      if (text.includes('transfer') || text.includes('arrive') || text.includes('depart') ||
          text.includes('check-in') || text.includes('check in') || text.includes('check-out') ||
          text.includes('check out') || text.includes('return to hotel') ||
          text.includes('hotel return') || text.includes('back to hotel') ||
          text.includes('bus to') || text.includes('flight to') ||
          text.includes('taxi') || text.includes('grab') || text.includes('jeepney')) {
        return false;
      }

      return true;
    });

    const activityCount = mainActivities.length;

    // Validate activity count based on day type and user preference
    if (isFirstDay) {
      if (activityCount > 2) {
        errors.push(`Day ${dayNum} (Arrival): Has ${activityCount} activities, maximum allowed is 2`);
      }
    } else if (isMiddleDay) {
      if (activityCount !== activityPreference) {
        errors.push(`Day ${dayNum} (Middle): Has ${activityCount} activities, should be exactly ${activityPreference}`);
      }
    } else if (isLastDay) {
      if (activityCount > 1) {
        errors.push(`Day ${dayNum} (Departure): Has ${activityCount} activities, maximum allowed is 1`);
      }
    }

    // Log activity count for debugging
    console.log(`Day ${dayNum}: ${activityCount} main activities (${mainActivities.length} total activities parsed)`);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    activityPreference,
    totalDays,
  };
};
export const validateItinerary = (tripData, formData) => {
  const errors = [];
  const warnings = [];
  const itinerary = tripData?.itinerary || [];
  const destination = (formData?.location || '').toLowerCase();

  // Validation 1: Daily Hotel Returns
  itinerary.forEach((day, index) => {
    const dayNum = day.day || index + 1;
    const totalDays = itinerary.length;
    const isLastDay = dayNum === totalDays;
    
    // Parse activities from plan array or planText
    let activities = [];
    if (Array.isArray(day.plan)) {
      activities = day.plan;
    } else if (day.planText) {
      activities = day.planText.split('|').map(a => a.trim());
    }
    
    if (activities.length === 0) {
      errors.push(`Day ${dayNum}: No activities found`);
      return;
    }
    
    // Check last activity
    const lastActivity = activities[activities.length - 1];
    const lastActivityText = typeof lastActivity === 'string' 
      ? lastActivity.toLowerCase() 
      : (lastActivity?.placeName || '').toLowerCase();
    
    // Middle days must end with hotel return
    if (!isLastDay && dayNum !== 1) {
      const hasHotelReturn = 
        lastActivityText.includes('return to hotel') ||
        lastActivityText.includes('hotel return') ||
        lastActivityText.includes('back to hotel');
      
      if (!hasHotelReturn) {
        errors.push(`Day ${dayNum}: Missing "Return to hotel" activity at end of day`);
      }
    }
    
    // Day 1 must have check-in
    if (dayNum === 1) {
      const hasCheckin = activities.some(activity => {
        const text = typeof activity === 'string' 
          ? activity.toLowerCase() 
          : (activity?.placeName || '').toLowerCase();
        return text.includes('check-in') || text.includes('check in');
      });
      
      if (!hasCheckin) {
        errors.push('Day 1: Missing hotel check-in activity');
      }
    }
    
    // Last day must have check-out
    if (isLastDay) {
      const hasCheckout = activities.some(activity => {
        const text = typeof activity === 'string' 
          ? activity.toLowerCase() 
          : (activity?.placeName || '').toLowerCase();
        return text.includes('check-out') || text.includes('check out') || text.includes('checkout');
      });
      
      if (!hasCheckout) {
        errors.push(`Day ${totalDays} (Last Day): Missing hotel check-out activity`);
      }
    }
  });

  // Validation 2: Airport Logistics
  const needsNearestAirport = CITIES_WITHOUT_AIRPORTS.some(city => 
    destination.includes(city)
  );
  
  if (needsNearestAirport && itinerary.length > 0) {
    const matchingCity = CITIES_WITHOUT_AIRPORTS.find(city => destination.includes(city));
    const airportInfo = NEAREST_AIRPORT_INFO[matchingCity];
    
    // Check Day 1 for direct flight mention
    const day1 = itinerary[0];
    const day1Text = JSON.stringify(day1).toLowerCase();
    
    if (day1Text.includes('arrive at') && day1Text.includes('via flight') && 
        day1Text.includes(matchingCity)) {
      errors.push(
        `Airport Error: ${formData?.location} has no direct airport. ` +
        `Should use ${airportInfo?.airport} with ${airportInfo?.transfer} ground transfer (${airportInfo?.cost}).`
      );
    }
    
    // Check if ground transfer is mentioned
    const hasGroundTransfer = 
      day1Text.includes('bus') || 
      day1Text.includes('van') || 
      day1Text.includes('ferry') ||
      day1Text.includes('transfer');
    
    if (!hasGroundTransfer && !day1Text.includes(matchingCity + ' airport')) {
      warnings.push(
        `Day 1 should mention ground transfer from ${airportInfo?.airport} ` +
        `(${airportInfo?.transfer}, ${airportInfo?.cost})`
      );
    }
  }

  // Validation 3: Activity Timing
  itinerary.forEach((day, index) => {
    const dayNum = day.day || index + 1;
    const activities = Array.isArray(day.plan) ? day.plan : [];
    
    activities.forEach((activity, actIndex) => {
      if (typeof activity === 'object' && activity.time) {
        const time = activity.time.toLowerCase();
        const hour = parseInt(time.match(/(\d+)/)?.[1] || 0);
        const isPM = time.includes('pm');
        const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
        
        // Activities shouldn't extend too late without hotel return
        if (hour24 >= 22 && actIndex === activities.length - 1) { // 10 PM or later
          const isReturnToHotel = (activity.placeName || '').toLowerCase().includes('return to hotel');
          if (!isReturnToHotel) {
            warnings.push(`Day ${dayNum}: Last activity at ${activity.time} is very late. Should end with hotel return by 9 PM.`);
          }
        }
      }
    });
  });

  // Validation 4: Hotel Information
  if (!tripData?.hotels || tripData.hotels.length === 0) {
    warnings.push('No hotel information provided in itinerary');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasAirportIssue: errors.some(e => e.includes('Airport Error')),
    needsHotelReturn: errors.some(e => e.includes('Return to hotel')),
  };
};

/**
 * Get helpful suggestion for fixing validation errors
 * @param {Object} validationResult
 * @returns {string} Human-readable suggestion
 */
export const getValidationSuggestion = (validationResult) => {
  if (validationResult.isValid) {
    return '✅ Itinerary looks good!';
  }

  const suggestions = [];

  if (validationResult.hasAirportIssue) {
    suggestions.push('🛫 Update Day 1 to use the nearest airport with ground transfer details');
  }

  if (validationResult.needsHotelReturn) {
    suggestions.push('🏨 Add "Return to hotel" activities at the end of each day (except last day)');
  }

  if (validationResult.errors.some(e => e.includes('check-in'))) {
    suggestions.push('🔑 Add hotel check-in activity on Day 1 (around 2:00 PM)');
  }

  if (validationResult.errors.some(e => e.includes('check-out'))) {
    suggestions.push('🚪 Add hotel check-out activity on last day (around 11:00 AM)');
  }

  return suggestions.length > 0 
    ? suggestions.join('\n') 
    : '⚠️ Please review the itinerary for completeness';
};

/**
 * Get nearest airport recommendation for a destination
 * @param {string} destination
 * @returns {Object|null} Airport info or null
 */
export const getNearestAirportInfo = (destination) => {
  const destLower = destination.toLowerCase();
  const matchingCity = CITIES_WITHOUT_AIRPORTS.find(city => destLower.includes(city));
  
  return matchingCity ? NEAREST_AIRPORT_INFO[matchingCity] : null;
};

export default {
  validateItinerary,
  validateActivityCount,
  getValidationSuggestion,
  getNearestAirportInfo,
  CITIES_WITHOUT_AIRPORTS,
  NEAREST_AIRPORT_INFO,
};
