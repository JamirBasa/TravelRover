/**
 * Auto-fix itinerary validation issues
 * This ensures itineraries meet activity count constraints even if AI doesn't follow perfectly
 * ✅ ENHANCED: Now includes duplicate removal to prevent multiple "Return to hotel" entries
 */

import { classifyActivities, getActivityConstraints } from './activityClassifier';
import { cleanItinerary } from './itineraryDeduplicator';

/**
 * Auto-fix Day 1 to have maximum 2 activities
 * @param {Object} tripData - The parsed trip data
 * @returns {Object} - Fixed trip data
 */
export function autoFixDay1Activities(tripData) {
  if (!tripData?.itinerary || tripData.itinerary.length === 0) {
    return tripData;
  }

  const day1 = tripData.itinerary[0];
  if (!day1?.plan || day1.plan.length === 0) {
    return tripData;
  }

  // Use unified activity classification
  const { activities, logistics, activityCount } = classifyActivities(day1.plan);

  // Get constraints for arrival day
  const constraints = getActivityConstraints(true, false, 2);

  console.log(`🔧 Auto-fix Day 1 (Arrival):`, {
    totalItems: day1.plan.length,
    activityCount,
    logisticsCount: logistics.length,
    targetMax: constraints.max,
    needsFix: activityCount > constraints.max
  });

  // If more than max allowed activities, reduce to max
  if (activityCount > constraints.max) {
    const keptActivities = activities.slice(0, constraints.max);
    const removedCount = activityCount - constraints.max;
    
    console.log(`  ✂️ Removing ${removedCount} excess activities from Day 1:`, 
      activities.slice(constraints.max).map(a => a.placeName || a)
    );
    
    // Reconstruct Day 1 plan with logistics + max allowed activities
    // Sort by time to maintain chronological order
    const newPlan = [...logistics, ...keptActivities].sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });

    // Update Day 1
    tripData.itinerary[0] = {
      ...day1,
      plan: newPlan
    };
    
    console.log(`  ✅ Fixed Day 1: ${activityCount} → ${constraints.max} activities`);
  }
  
  return tripData;
}

/**
 * Auto-fix missing "Return to hotel" activities at end of middle days
 * @param {Object} tripData - The parsed trip data
 * @returns {Object} - { tripData, modificationsCount }
 */
function autoFixHotelReturns(tripData) {
  let modificationsCount = 0;
  
  if (!tripData?.itinerary || tripData.itinerary.length <= 2) {
    return { tripData, modificationsCount };
  }

  // Process middle days only (skip Day 1 and last day)
  for (let i = 1; i < tripData.itinerary.length - 1; i++) {
    const day = tripData.itinerary[i];
    if (!day?.plan || day.plan.length === 0) continue;

    // ✅ CRITICAL FIX: Check if day has ANY hotel return activity (not just last)
    // This prevents duplicates when auto-fix runs multiple times (regular + aggressive)
    const hasHotelReturn = day.plan.some(activity => {
      const activityText = (activity.placeName || '').toLowerCase();
      return activityText.includes('return to hotel') ||
             activityText.includes('hotel return') ||
             activityText.includes('back to hotel') ||
             activityText.includes('rest at hotel') ||
             activityText.includes('evening at hotel');
    });

    // ✅ CONSERVATIVE: Skip packed days (5+ activities already)
    const activityCount = day.plan.length;
    const isDayPacked = activityCount >= 5;

    if (!hasHotelReturn && !isDayPacked) {
      // Add "Return to hotel" activity at end of day
      day.plan.push({
        time: "8:00 PM", // ✅ Changed from "20:00" to match AI's 12-hour format
        placeName: "Return to hotel",
        placeDetails: "End of day - rest and prepare for tomorrow's activities",
        ticketPricing: "Free",
        travelTime: "15-30 minutes",
      });
      modificationsCount++;
    }
  }
  return { tripData, modificationsCount };
}

/**
 * Auto-fix entire itinerary activity counts and structure
 * @param {Object} tripData - The parsed trip data
 * @param {Object} formData - Form data with activity preferences
 * @returns {Object} - Fixed trip data with modifications summary
 */
export function autoFixItinerary(tripData, formData) {
  if (!tripData?.itinerary || !formData) {
    console.warn("Cannot auto-fix: Missing trip data or form data");
    return { tripData, modificationsCount: 0 };
  }

  if (tripData.itinerary.length === 0) {
    console.warn("Cannot auto-fix: Itinerary is empty");
    return { tripData, modificationsCount: 0 };
  }

  let modificationsCount = 0;

  // Fix Day 1 (max 2 activities)
  const originalDay1Count = countDayActivities(tripData.itinerary[0]);
  tripData = autoFixDay1Activities(tripData);
  const newDay1Count = countDayActivities(tripData.itinerary[0]);
  if (originalDay1Count !== newDay1Count) modificationsCount++;

  // Fix all middle days based on activity preference
  const middleDaysResult = autoFixMiddleDays(tripData, formData);
  tripData = middleDaysResult.tripData;
  modificationsCount += middleDaysResult.modificationsCount;

  // Fix missing hotel returns
  const hotelReturnResult = autoFixHotelReturns(tripData);
  tripData = hotelReturnResult.tripData;
  modificationsCount += hotelReturnResult.modificationsCount;

  // ✅ LAYER 2 DEFENSE: Deduplicate after all fixes to catch any duplicates
  // This is critical because auto-fix can run multiple times (regular + aggressive)
  console.log('🧹 Running post-auto-fix deduplication...');
  tripData.itinerary = cleanItinerary(tripData.itinerary);
  console.log('✅ Post-auto-fix deduplication complete');

  return { tripData, modificationsCount };
}

/**
 * Auto-fix middle days to match activity preference
 * @param {Object} tripData - The parsed trip data
 * @param {Object} formData - Form data with activity preferences
 * @returns {Object} - { tripData, modificationsCount }
 */
function autoFixMiddleDays(tripData, formData) {
  let modificationsCount = 0;
  
  if (!tripData?.itinerary || tripData.itinerary.length <= 2) {
    return { tripData, modificationsCount }; // Only Day 1 and last day, no middle days
  }

  // Get activity preference (1=Light, 2=Moderate, 3=Packed)
  const activityPreference = formData.activityPreference || 2;
  const constraints = getActivityConstraints(false, false, activityPreference);

  // Process middle days (skip first and last day)
  for (let i = 1; i < tripData.itinerary.length - 1; i++) {
    const day = tripData.itinerary[i];
    if (!day?.plan || day.plan.length === 0) continue;

    // Use unified activity classification
    const { activities, logistics, activityCount } = classifyActivities(day.plan);

    console.log(`🔧 Auto-fix Day ${i + 1} (Middle Day):`, {
      totalItems: day.plan.length,
      activityCount,
      logisticsCount: logistics.length,
      targetMax: constraints.max,
      needsFix: activityCount > constraints.max
    });

    // If more than max activities, keep only allowed number
    if (activityCount > constraints.max) {
      // Keep only the first N activities (they're usually in chronological order)
      const keptActivities = activities.slice(0, constraints.max);
      const removedCount = activityCount - constraints.max;
      
      console.log(`  ✂️ Removing ${removedCount} excess activities:`, 
        activities.slice(constraints.max).map(a => a.placeName || a)
      );
      
      // Reconstruct day plan: logistics + limited activities, sorted by time
      const newPlan = [...logistics, ...keptActivities].sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });

      tripData.itinerary[i] = {
        ...day,
        plan: newPlan
      };
      modificationsCount++;
      
      console.log(`  ✅ Fixed Day ${i + 1}: ${activityCount} → ${constraints.max} activities`);
    }
  }
  
  return { tripData, modificationsCount };
}

/**
 * Get activity count for a day
 * @param {Object} day - Day object from itinerary
 * @returns {number} - Number of activities
 */
export function countDayActivities(day) {
  if (!day?.plan) return 0;

  const nonActivityKeywords = [
    'arrival',
    'check-in',
    'check in',
    'rest',
    'freshen',
    'breakfast',
    'lunch',
    'dinner',
    'meal',
    'hotel',
    'airport',
    'departure',
    'checkout',
    'check-out'
  ];

  return day.plan.filter((item) => {
    const combined = ((item.placeName || '') + ' ' + (item.placeDetails || '')).toLowerCase();
    return !nonActivityKeywords.some(keyword => combined.includes(keyword));
  }).length;
}
