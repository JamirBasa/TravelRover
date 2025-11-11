/**
 * Transport Convenience Classification System
 * Determines if ground transport (bus/ferry/van) is practical for a route
 * Based on Philippine transport infrastructure and traveler expectations
 */

/**
 * Convenience level thresholds
 * Based on analysis of Philippine transport patterns and tourist preferences
 */
export const TRANSPORT_THRESHOLDS = {
  // Very Convenient: Same-day round trip possible
  VERY_CONVENIENT: {
    maxTravelTime: 2, // hours one-way
    maxDistance: 100, // kilometers
    recommendation: "Highly recommended for day trips",
    userMessage: "Quick and convenient ground travel",
    color: "emerald",
  },

  // Convenient: Comfortable day travel
  CONVENIENT: {
    maxTravelTime: 4, // hours one-way
    maxDistance: 200, // kilometers
    recommendation: "Comfortable ground travel option",
    userMessage: "Manageable travel time, good for multi-day trips",
    color: "green",
  },

  // Acceptable: Requires planning but practical
  ACCEPTABLE: {
    maxTravelTime: 6, // hours one-way
    maxDistance: 300, // kilometers
    recommendation: "Feasible but requires early departure",
    userMessage: "Long but scenic journey - plan for travel day",
    color: "amber",
  },

  // Impractical: Should default to flight
  IMPRACTICAL: {
    minTravelTime: 6, // hours one-way
    minDistance: 300, // kilometers
    recommendation: "Flight strongly recommended",
    userMessage: "Ground travel not recommended - consider flying",
    color: "red",
  },
};

/**
 * Classify transport convenience based on route characteristics
 * @param {Object} routeData - Route information
 * @param {number} routeData.travelTimeHours - Travel time in hours
 * @param {number} routeData.distanceKm - Distance in kilometers
 * @param {boolean} [routeData.hasOvernightOption] - If overnight bus available
 * @param {boolean} [routeData.hasFerry] - If ferry connection required
 * @param {boolean} [routeData.scenic] - If route is scenic
 * @returns {Object} Classification result with level and metadata
 */
export const classifyTransportConvenience = (routeData) => {
  const {
    travelTimeHours,
    distanceKm,
    hasOvernightOption = false,
    hasFerry = false,
    scenic = false,
  } = routeData;

  // Special case: Ferry routes are standard for island tourism
  if (hasFerry) {
    if (travelTimeHours <= 2) {
      return {
        level: "VERY_CONVENIENT",
        reason: "Fast ferry connection - typical for island tourism",
        practical: true,
        preferred: true,
        ...TRANSPORT_THRESHOLDS.VERY_CONVENIENT,
      };
    } else if (travelTimeHours <= 5) {
      return {
        level: "CONVENIENT",
        reason: "Ferry connection available - typical for island travel",
        practical: true,
        preferred: true,
        ...TRANSPORT_THRESHOLDS.CONVENIENT,
      };
    }
  }

  // Very Convenient: Quick trips
  if (
    travelTimeHours <= TRANSPORT_THRESHOLDS.VERY_CONVENIENT.maxTravelTime &&
    distanceKm <= TRANSPORT_THRESHOLDS.VERY_CONVENIENT.maxDistance
  ) {
    return {
      level: "VERY_CONVENIENT",
      practical: true,
      preferred: true, // Prefer ground over flight for very short trips
      ...TRANSPORT_THRESHOLDS.VERY_CONVENIENT,
    };
  }

  // Convenient: Comfortable travel
  if (
    travelTimeHours <= TRANSPORT_THRESHOLDS.CONVENIENT.maxTravelTime &&
    distanceKm <= TRANSPORT_THRESHOLDS.CONVENIENT.maxDistance
  ) {
    return {
      level: "CONVENIENT",
      practical: true,
      preferred: true, // Still prefer ground - good value and convenience
      ...TRANSPORT_THRESHOLDS.CONVENIENT,
    };
  }

  // Acceptable: Manageable with planning
  if (
    travelTimeHours <= TRANSPORT_THRESHOLDS.ACCEPTABLE.maxTravelTime &&
    distanceKm <= TRANSPORT_THRESHOLDS.ACCEPTABLE.maxDistance
  ) {
    return {
      level: "ACCEPTABLE",
      practical: true,
      preferred: false, // Don't prefer, but acceptable option
      warning: "Consider overnight stay at destination",
      additionalNote: scenic ? "Scenic route adds travel value" : null,
      ...TRANSPORT_THRESHOLDS.ACCEPTABLE,
    };
  }

  // Impractical: Flight recommended
  return {
    level: "IMPRACTICAL",
    practical: false,
    preferred: false,
    warning: "Flight or multi-stop itinerary recommended",
    alternativeSuggestion: hasOvernightOption
      ? "Consider overnight bus for budget travel"
      : "Break journey into multiple days",
    ...TRANSPORT_THRESHOLDS.IMPRACTICAL,
  };
};

/**
 * Get user-friendly description of convenience level
 * @param {string} level - Convenience level (VERY_CONVENIENT, CONVENIENT, etc.)
 * @returns {Object} User-facing labels and icons
 */
export const getConvenienceDisplay = (level) => {
  const displays = {
    VERY_CONVENIENT: {
      label: "Very Convenient",
      icon: "✅",
      badge: "Recommended",
      badgeColor: "emerald",
    },
    CONVENIENT: {
      label: "Convenient",
      icon: "👍",
      badge: "Good Option",
      badgeColor: "green",
    },
    ACCEPTABLE: {
      label: "Acceptable",
      icon: "⚠️",
      badge: "Plan Ahead",
      badgeColor: "amber",
    },
    IMPRACTICAL: {
      label: "Not Recommended",
      icon: "❌",
      badge: "Fly Instead",
      badgeColor: "red",
    },
  };

  return displays[level] || displays.IMPRACTICAL;
};

/**
 * Determine if ground transport should be the primary recommendation
 * @param {Object} convenience - Convenience classification result
 * @param {boolean} hasAirport - If destination has airport
 * @returns {boolean} True if ground transport should be preferred
 */
export const shouldPreferGroundTransport = (convenience, hasAirport) => {
  // If no airport, ground is only option
  if (!hasAirport) return true;

  // If marked as preferred, use it
  if (convenience.preferred) return true;

  // Otherwise defer to flight option
  return false;
};

export default {
  TRANSPORT_THRESHOLDS,
  classifyTransportConvenience,
  getConvenienceDisplay,
  shouldPreferGroundTransport,
};
