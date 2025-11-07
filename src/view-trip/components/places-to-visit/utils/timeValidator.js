/**
 * Time Validation Utility
 * Validates if activities in a day are realistically achievable
 * based on time constraints, travel time, and activity duration
 * 
 * INTELLIGENT TRAVEL TIME ESTIMATION STRATEGY:
 * ============================================
 * This validator uses a 6-tier priority system to estimate travel time between activities:
 * 
 * Priority 1: Logistics Activities (0 minutes)
 *   - Activities like "Taxi to hotel", "Return to hotel", "Check-in", "Departure"
 *   - These ARE the travel itself, so no buffer needed before them
 * 
 * Priority 2: Same Location Detection (0 minutes)
 *   - Exact name match: "Hotel ABC" → "Hotel ABC"
 *   - Smart extraction: "Check-in at Hotel ABC" → "Return to Hotel ABC"
 *   - Uses venue name extraction and contains-matching
 * 
 * Priority 3: Metadata Extraction (varies)
 *   - Reads activity.travelFromPrevious field if available
 *   - Parses activity names: "30 min drive to Beach"
 *   - Scans descriptions for travel time mentions
 * 
 * Priority 4: Proximity Detection (10 minutes)
 *   - Keyword similarity analysis (40% threshold)
 *   - "Rizal Park" + "National Museum in Rizal Park" = nearby
 *   - Substring containment for compound names
 * 
 * Priority 5: Category-Based Estimation (8-12 minutes)
 *   - Tourist attractions → Tourist attractions = 12 min (clustered zones)
 *   - Attraction → Restaurant = 10 min (eateries near attractions)
 *   - Uses activity.category field when available
 * 
 * Priority 6: Time Gap Analysis (8-30 minutes)
 *   - Large gap (>2 hours) = 30 min travel expected
 *   - Tight schedule (<30 min) = 8 min minimal travel
 *   - Infers user's travel planning from schedule patterns
 * 
 * Default Fallback: 15 minutes (conservative buffer)
 * 
 * This multi-layered approach works for ALL Philippine destinations without
 * hardcoding specific locations, making it scalable and maintainable.
 */

/**
 * Parse time string (e.g., "09:00 AM") to minutes since midnight
 */
export function parseTimeToMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") return null;

  try {
    const [time, period] = timeString.trim().split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    // Convert to 24-hour format
    if (period && period.toUpperCase() === "PM" && hours < 12) {
      hours += 12;
    } else if (period && period.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  } catch (error) {
    console.error("Error parsing time:", timeString, error);
    return null;
  }
}

/**
 * Parse duration string (e.g., "2 hours", "30 mins", "1-2 hours") to minutes
 */
export function parseDurationToMinutes(durationString) {
  if (!durationString || typeof durationString !== "string") return 60; // Default 1 hour

  const normalized = durationString.toLowerCase().trim();

  // Handle ranges (e.g., "1-2 hours", "30-45 mins")
  if (normalized.includes("-")) {
    const parts = normalized.split("-");
    const min = parseSingleDuration(parts[0].trim());
    const max = parseSingleDuration(parts[1].trim());
    return Math.round((min + max) / 2); // Use average
  }

  return parseSingleDuration(normalized);
}

function parseSingleDuration(durationString) {
  const normalized = durationString.toLowerCase().trim();

  // Match patterns like "2 hours", "30 mins", "1.5 hours"
  const hourMatch = normalized.match(/([\d.]+)\s*(hour|hr|h)/);
  const minMatch = normalized.match(/([\d.]+)\s*(minute|min|m)/);

  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  } else if (minMatch) {
    return Math.round(parseFloat(minMatch[1]));
  }

  // Default fallback
  return 60; // 1 hour default
}

/**
 * Check if an activity is a logistics/travel type that doesn't need travel time before it
 */
function isLogisticsActivity(activity) {
  if (!activity?.placeName) return false;
  
  const logisticsKeywords = [
    'taxi', 'drive', 'bus', 'transport', 'transfer', 'travel',
    'return', 'departure', 'arrival', 'check-in', 'check-out',
    'ride', 'uber', 'grab', 'shuttle', 'flight', 'train'
  ];
  
  const placeName = activity.placeName.toLowerCase();
  return logisticsKeywords.some(keyword => placeName.includes(keyword));
}

/**
 * Check if two activities are at the same location
 */
function isSameLocation(activity1, activity2) {
  if (!activity1?.placeName || !activity2?.placeName) return false;
  
  // Exact match
  if (activity1.placeName === activity2.placeName) return true;
  
  // Check if both contain the same hotel/venue name
  const extractVenueName = (name) => {
    // Extract main venue name (e.g., "Check-in at Hotel ABC" -> "hotel abc")
    const cleaned = name.toLowerCase()
      .replace(/check-in at|check-out from|return to|departure from|arrival at/gi, '')
      .trim();
    return cleaned;
  };
  
  const venue1 = extractVenueName(activity1.placeName);
  const venue2 = extractVenueName(activity2.placeName);
  
  // If one venue name contains the other (e.g., "Hotel ABC" and "ABC")
  if (venue1.includes(venue2) || venue2.includes(venue1)) {
    return true;
  }
  
  return false;
}

/**
 * Extract actual travel time from activity metadata
 */
function extractTravelTimeFromActivity(activity) {
  // Check for explicit travel time field
  if (activity.travelFromPrevious) {
    return parseDurationToMinutes(activity.travelFromPrevious);
  }
  
  // Check for travel time in activity name (e.g., "30 min drive to...")
  if (activity.placeName) {
    const travelMatch = activity.placeName.match(/(\d+)\s*(min|minute|minutes|mins)/i);
    if (travelMatch) {
      return parseInt(travelMatch[1]);
    }
  }
  
  // Check description field if available
  if (activity.placeDetails) {
    const travelMatch = activity.placeDetails.match(/(\d+)\s*(min|minute|minutes|mins)\s*(drive|travel|away)/i);
    if (travelMatch) {
      return parseInt(travelMatch[1]);
    }
  }
  
  return null;
}

/**
 * Detect if activities share common location keywords (nearby attractions)
 * Uses intelligent pattern matching instead of hardcoded locations
 */
function detectNearbyActivities(activity1, activity2) {
  if (!activity1?.placeName || !activity2?.placeName) return false;
  
  const place1 = activity1.placeName.toLowerCase();
  const place2 = activity2.placeName.toLowerCase();
  
  // Extract significant location keywords (nouns that likely indicate places)
  const extractLocationKeywords = (placeName) => {
    // Remove common prefixes/suffixes
    const cleaned = placeName
      .replace(/visit|explore|tour|walk around|see|view|at|in|the|a|an/gi, '')
      .trim();
    
    // Split into words and filter out common words
    const words = cleaned.split(/[\s,\-()]+/).filter(word => 
      word.length > 3 && // Meaningful words
      !['hotel', 'restaurant', 'cafe', 'shop', 'store', 'market'].includes(word) // Exclude generic terms
    );
    
    return words;
  };
  
  const keywords1 = extractLocationKeywords(place1);
  const keywords2 = extractLocationKeywords(place2);
  
  // Check if they share significant keywords (likely same area)
  const sharedKeywords = keywords1.filter(k => keywords2.includes(k));
  
  // If they share 40% or more keywords, they're likely in the same area
  if (sharedKeywords.length > 0) {
    const similarity = sharedKeywords.length / Math.max(keywords1.length, keywords2.length);
    if (similarity >= 0.4) {
      return true;
    }
  }
  
  // Check if one place name is contained in the other (e.g., "Intramuros" and "Fort Santiago in Intramuros")
  const shorterName = place1.length < place2.length ? place1 : place2;
  const longerName = place1.length < place2.length ? place2 : place1;
  
  if (longerName.includes(shorterName) && shorterName.length > 5) {
    return true;
  }
  
  return false;
}

/**
 * Estimate travel time between two activities (in minutes)
 * Now with intelligent activity type detection and metadata extraction
 */
export function estimateTravelTime(activity1, activity2) {
  // Priority 1: If current activity IS a logistics/travel activity, no travel time needed before it
  if (isLogisticsActivity(activity2)) {
    return 0;
  }
  
  // Priority 2: If both activities are at the exact same location
  if (isSameLocation(activity1, activity2)) {
    return 0;
  }
  
  // Priority 3: Try to extract actual travel time from activity metadata
  const extractedTime = extractTravelTimeFromActivity(activity2);
  if (extractedTime !== null) {
    return extractedTime;
  }
  
  // Priority 4: Intelligent proximity detection
  if (detectNearbyActivities(activity1, activity2)) {
    return 10; // Nearby attractions within walking distance
  }
  
  // Priority 5: Category-based estimation
  const category1 = activity1?.category?.toLowerCase() || '';
  const category2 = activity2?.category?.toLowerCase() || '';
  
  // If both are tourist attractions, likely in the same tourist zone
  if ((category1.includes('attraction') || category1.includes('landmark')) &&
      (category2.includes('attraction') || category2.includes('landmark'))) {
    return 12; // Tourist spots often clustered
  }
  
  // If going from attraction to restaurant/cafe (likely nearby)
  if ((category1.includes('attraction') || category1.includes('landmark')) &&
      (category2.includes('restaurant') || category2.includes('food'))) {
    return 10; // Restaurants near attractions
  }
  
  // Priority 6: Time-based patterns
  const time1 = parseTimeToMinutes(activity1.time);
  const time2 = parseTimeToMinutes(activity2.time);
  
  if (time1 && time2) {
    const gap = time2 - time1 - parseDurationToMinutes(activity1.timeTravel || "1 hour");
    
    // If there's a large gap (>2 hours), user probably planned for longer travel
    if (gap > 120) {
      return 30; // Significant travel time expected
    }
    
    // If tight schedule (<30 min gap), assume nearby
    if (gap < 30 && gap > 0) {
      return 8; // Minimal travel time
    }
  }
  
  // Default: Conservative 15-minute buffer for unknown distances
  return 15;
}

/**
 * Validate if activities can realistically fit within a day
 * Returns validation result with warnings and suggestions
 */
export function validateDaySchedule(activities, startTime = "08:00 AM", endTime = "10:00 PM") {
  if (!activities || activities.length === 0) {
    return {
      isValid: true,
      warnings: [],
      totalTime: 0,
      availableTime: 0,
    };
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const availableMinutes = endMinutes - startMinutes;

  const warnings = [];
  const timeline = [];
  let currentTime = startMinutes;
  let previousActivity = null;

  // Analyze each activity
  activities.forEach((activity, index) => {
    const activityTime = parseTimeToMinutes(activity.time);
    const duration = parseDurationToMinutes(activity.timeTravel || "1 hour");
    const travelTime = previousActivity
      ? estimateTravelTime(previousActivity, activity)
      : 0;

    // Check if scheduled time is realistic based on previous activity
    if (previousActivity && activityTime) {
      const minimumTime = currentTime + travelTime;
      
      // Only warn if there's actual travel time needed and activity starts too early
      if (travelTime > 0 && activityTime < minimumTime) {
        const diff = minimumTime - activityTime;
        
        // Get context for better warning messages
        const isLogistics = isLogisticsActivity(activity);
        const isSameLoc = isSameLocation(previousActivity, activity);
        
        // Build contextual warning message
        let warningMsg = `Activity "${activity.placeName}" starts at ${activity.time}, but you need at least ${Math.round(diff)} more minutes`;
        
        if (isLogistics) {
          warningMsg += ` (Note: This is a travel/logistics activity - consider if travel time is already accounted for)`;
        } else if (isSameLoc) {
          warningMsg += ` (Note: This appears to be at the same location as the previous activity)`;
        } else {
          warningMsg += ` to travel from the previous activity`;
        }
        
        warnings.push({
          type: "timing",
          severity: travelTime > 0 ? "high" : "medium",
          activityIndex: index,
          message: warningMsg,
          suggestion: `Consider moving this activity to ${formatMinutesToTime(minimumTime)} or later, or adjust the previous activity's duration.`,
          context: {
            requiredTravelTime: travelTime,
            timeDifference: diff,
            isLogisticsActivity: isLogistics,
            isSameLocation: isSameLoc
          }
        });
      }
    }

    // Check if activity extends beyond end time
    const activityEndTime = (activityTime || currentTime) + duration;
    if (activityEndTime > endMinutes) {
      warnings.push({
        type: "overtime",
        severity: "high",
        activityIndex: index,
        message: `Activity "${activity.placeName}" extends beyond ${endTime}.`,
        suggestion: `Consider moving this to the next day or reducing the time spent.`,
      });
    }

    // Check for unrealistically long activities
    if (duration > 240) {
      // More than 4 hours
      warnings.push({
        type: "duration",
        severity: "medium",
        activityIndex: index,
        message: `Activity "${activity.placeName}" is scheduled for ${activity.timeTravel || "a very long time"}.`,
        suggestion: `Consider breaking this into multiple activities or verifying the duration.`,
      });
    }

    // Check for overlapping activities
    if (previousActivity && activityTime) {
      const previousEnd = timeline[timeline.length - 1]?.endTime || 0;
      if (activityTime < previousEnd) {
        warnings.push({
          type: "overlap",
          severity: "critical",
          activityIndex: index,
          message: `Activity "${activity.placeName}" overlaps with the previous activity.`,
          suggestion: `Reschedule to ${formatMinutesToTime(previousEnd)} or later.`,
        });
      }
    }

    timeline.push({
      activityIndex: index,
      name: activity.placeName,
      startTime: activityTime || currentTime,
      duration,
      travelTime,
      endTime: (activityTime || currentTime) + duration,
    });

    currentTime = (activityTime || currentTime) + duration + travelTime;
    previousActivity = activity;
  });

  // Calculate total time needed
  const totalTimeNeeded = currentTime - startMinutes;
  const timeOverage = totalTimeNeeded - availableMinutes;

  // Add overall schedule warning if over time
  if (timeOverage > 60) {
    // More than 1 hour over
    warnings.push({
      type: "schedule",
      severity: "critical",
      activityIndex: -1,
      message: `This day's schedule requires approximately ${Math.round(totalTimeNeeded / 60)} hours, but only ${Math.round(availableMinutes / 60)} hours are available.`,
      suggestion: `Consider removing ${Math.ceil(timeOverage / 120)} activities or spreading them across multiple days.`,
    });
  } else if (timeOverage > 30) {
    warnings.push({
      type: "schedule",
      severity: "medium",
      activityIndex: -1,
      message: `This schedule is tight. You're about ${Math.round(timeOverage)} minutes over the comfortable limit.`,
      suggestion: `Consider adding buffer time or removing one activity.`,
    });
  }

  // Check for rushed schedule (too many activities)
  if (activities.length > 8) {
    warnings.push({
      type: "density",
      severity: "medium",
      activityIndex: -1,
      message: `You have ${activities.length} activities planned. This might be too rushed to enjoy fully.`,
      suggestion: `Consider focusing on fewer activities for a more relaxed experience.`,
    });
  }

  return {
    isValid: warnings.filter((w) => w.severity === "critical").length === 0,
    warnings,
    totalTime: totalTimeNeeded,
    availableTime: availableMinutes,
    timeline,
    utilizationPercent: Math.round((totalTimeNeeded / availableMinutes) * 100),
  };
}

/**
 * Format minutes since midnight to time string (e.g., 540 -> "09:00 AM")
 */
export function formatMinutesToTime(minutes) {
  let hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${hours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Get severity color class for UI display
 */
export function getSeverityColor(severity) {
  switch (severity) {
    case "critical":
      return "text-red-600 bg-red-50 border-red-200";
    case "high":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium":
      return "text-amber-600 bg-amber-50 border-amber-200";
    default:
      return "text-blue-600 bg-blue-50 border-blue-200";
  }
}

/**
 * Get severity icon for UI display
 */
export function getSeverityIcon(severity) {
  switch (severity) {
    case "critical":
      return "🚫";
    case "high":
      return "⚠️";
    case "medium":
      return "⚡";
    default:
      return "ℹ️";
  }
}
