/**
 * Time Validation Utility
 * Validates if activities in a day are realistically achievable
 * based on time constraints, travel time, and activity duration
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
 * Estimate travel time between two activities (in minutes)
 * This is a simplified estimation - in production, you'd use Google Maps Distance Matrix API
 */
export function estimateTravelTime(activity1, activity2) {
  // Default travel time assumptions
  const DEFAULT_TRAVEL_TIME = 30; // 30 minutes average
  const MIN_TRAVEL_TIME = 10; // Minimum buffer between activities
  const MAX_TRAVEL_TIME = 90; // Maximum realistic travel time within a day

  // If we have actual coordinates, we could calculate distance
  // For now, use intelligent defaults based on activity types
  
  // Check if activities are likely in the same location
  if (
    activity1?.placeName &&
    activity2?.placeName &&
    activity1.placeName === activity2.placeName
  ) {
    return 0; // Same location, no travel time
  }

  // If we have location names, we can make educated guesses
  // For now, return a reasonable default
  return DEFAULT_TRAVEL_TIME;
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
      if (activityTime < minimumTime) {
        const diff = minimumTime - activityTime;
        warnings.push({
          type: "timing",
          severity: "high",
          activityIndex: index,
          message: `Activity "${activity.placeName}" starts at ${activity.time}, but you need at least ${Math.round(diff)} more minutes to travel from the previous activity.`,
          suggestion: `Consider moving this activity to ${formatMinutesToTime(minimumTime)} or later.`,
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
