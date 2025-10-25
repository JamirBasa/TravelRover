/**
 * Auto-fix itinerary validation issues
 * This ensures itineraries meet activity count constraints even if AI doesn't follow perfectly
 */

import { classifyActivities, getActivityConstraints } from './activityClassifier';

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

  console.log("🔧 Auto-fixing Day 1 activity count...");

  // Use unified activity classification
  const { activities, logistics, activityCount } = classifyActivities(day1.plan);
  
  console.log(`📊 Day 1 Analysis - Activities: ${activityCount}, Logistics: ${logistics.length}`);

  // Get constraints for arrival day
  const constraints = getActivityConstraints(true, false, 2);

  // If more than max allowed activities, reduce to max
  if (activityCount > constraints.max) {
    console.log(`⚠️ Day 1 has ${activityCount} activities, reducing to ${constraints.max}`);
    
    const keptActivities = activities.slice(0, constraints.max);
    const removedActivities = activities.slice(constraints.max);
    
    console.log("✅ Kept activities:", keptActivities.map(a => a.placeName).join(", "));
    console.log("❌ Removed activities:", removedActivities.map(a => a.placeName).join(", "));

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

    console.log(`✅ Day 1 auto-fixed: Reduced to ${constraints.max} activities`);
  } else {
    console.log(`✅ Day 1 already compliant: ${activityCount} activities`);
  }

  return tripData;
}

/**
 * Auto-fix entire itinerary activity counts
 * @param {Object} tripData - The parsed trip data
 * @param {Object} formData - Form data with activity preferences
 * @returns {Object} - Fixed trip data
 */
export function autoFixItinerary(tripData, formData) {
  console.log("🔧 Starting auto-fix for itinerary...");
  console.log("📊 Input data:", {
    hasItinerary: !!tripData?.itinerary,
    itineraryLength: tripData?.itinerary?.length || 0,
    hasFormData: !!formData
  });

  if (!tripData?.itinerary || !formData) {
    console.warn("⚠️ Cannot auto-fix: Missing trip data or form data");
    return tripData;
  }

  if (tripData.itinerary.length === 0) {
    console.warn("⚠️ Cannot auto-fix: Itinerary is empty");
    return tripData;
  }

  // Fix Day 1 (max 2 activities)
  tripData = autoFixDay1Activities(tripData);

  // Fix all middle days based on activity preference
  tripData = autoFixMiddleDays(tripData, formData);

  console.log("✅ Auto-fix completed");
  return tripData;
}

/**
 * Auto-fix middle days to match activity preference
 * @param {Object} tripData - The parsed trip data
 * @param {Object} formData - Form data with activity preferences
 * @returns {Object} - Fixed trip data
 */
function autoFixMiddleDays(tripData, formData) {
  if (!tripData?.itinerary || tripData.itinerary.length <= 2) {
    return tripData; // Only Day 1 and last day, no middle days
  }

  // Get activity preference (1=Light, 2=Moderate, 3=Packed)
  const activityPreference = formData.activityPreference || 2;
  const constraints = getActivityConstraints(false, false, activityPreference);

  console.log(`🔧 Auto-fixing middle days (max ${constraints.max} activities per day)...`);

  // Process middle days (skip first and last day)
  for (let i = 1; i < tripData.itinerary.length - 1; i++) {
    const day = tripData.itinerary[i];
    if (!day?.plan || day.plan.length === 0) continue;

    // Use unified activity classification
    const { activities, logistics, activityCount } = classifyActivities(day.plan);

    // If more than max activities, keep only allowed number
    if (activityCount > constraints.max) {
      console.log(`⚠️ Day ${i + 1} has ${activityCount} activities, reducing to ${constraints.max}`);
      
      const keptActivities = activities.slice(0, constraints.max);
      const removedActivities = activities.slice(constraints.max);
      
      console.log(`  ✅ Kept: ${keptActivities.map(a => a.placeName).join(", ")}`);
      console.log(`  ❌ Removed: ${removedActivities.map(a => a.placeName).join(", ")}`);

      // Reconstruct day plan
      const newPlan = [...logistics, ...keptActivities].sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });

      tripData.itinerary[i] = {
        ...day,
        plan: newPlan
      };
    } else {
      console.log(`  ✅ Day ${i + 1} compliant: ${activityCount} activities`);
    }
  }

  return tripData;
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
