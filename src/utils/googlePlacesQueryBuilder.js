/**
 * Google Places Query Builder Utility
 * 
 * PROBLEM SOLVED:
 * Activities like "Eat at a local eatery" return poor Google Places results
 * because they lack specific location context.
 * 
 * SOLUTION:
 * Intelligently combine activity description with destination to create
 * optimal search queries: "local eatery in Basey, Samar"
 * 
 * BENEFITS:
 * ✅ More accurate place suggestions
 * ✅ Better photos from Google Places API
 * ✅ Improved map markers
 * ✅ Enhanced traveler experience
 */

import { logDebug } from "./productionLogger";

/**
 * Extracts the core place/activity type from a verbose activity description
 * Example: "Breakfast at Hotel Manila" → "Hotel Manila"
 * Example: "Visit Chocolate Hills" → "Chocolate Hills"
 * Example: "Eat at a local eatery" → "local eatery"
 */
export function extractActivityType(activityDescription) {
  if (!activityDescription || typeof activityDescription !== "string") {
    return "";
  }

  // Remove common activity prefixes to get the actual place
  const cleaned = activityDescription
    .replace(
      /^(Breakfast|Lunch|Dinner|Snack|Meal|Eat|Dine|Visit|Explore|Tour|Check-in|Check out|Checkout|Shopping|Shop|Relax|Rest|Return|Go to|Head to|Travel to|Departure|Arrival)\s+(at|to|in|from)?\s*/gi,
      ""
    )
    .replace(/^(and)\s+/gi, "")
    .trim();

  // If the cleaned result is too short, return original
  if (cleaned.length < 3) {
    return activityDescription;
  }

  return cleaned;
}

/**
 * Extracts specific location mentions from activity description
 * Example: "Visit Chocolate Hills in Bohol" → "Bohol"
 * Example: "Eat at Jollibee near SM Manila" → "SM Manila"
 */
export function extractLocationFromActivity(activityDescription) {
  if (!activityDescription || typeof activityDescription !== "string") {
    return null;
  }

  // Match "in [Location]", "at [Location]", "near [Location]"
  const patterns = [
    /\bin\s+([A-Z][A-Za-z\s,]+(?:City|Province|Municipality|Barangay)?)/,
    /\bnear\s+([A-Z][A-Za-z\s,]+)/,
    /,\s*([A-Z][A-Za-z\s]+(?:City|Province|Municipality)?)\s*$/,
  ];

  for (const pattern of patterns) {
    const match = activityDescription.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Determines the primary destination for a trip
 * Priority: tripData.destination > tripData.location > userSelectedLocation
 */
export function getTripDestination(trip) {
  if (!trip) return null;

  // Priority 1: tripData.destination
  if (trip.tripData?.destination) {
    return trip.tripData.destination;
  }

  // Priority 2: tripData.location
  if (trip.tripData?.location) {
    return trip.tripData.location;
  }

  // Priority 3: userSelection.location
  if (trip.userSelection?.location) {
    return trip.userSelection.location;
  }

  // Priority 4: Extract from trip name (e.g., "5 Days in Cebu")
  if (trip.tripData?.tripName) {
    const nameMatch = trip.tripData.tripName.match(/in\s+([A-Z][A-Za-z\s]+)/);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
  }

  return null;
}

/**
 * Extracts city/municipality from full destination
 * Example: "Basey, Samar" → "Basey"
 * Example: "Cebu City, Cebu Province" → "Cebu City"
 */
export function extractCity(destination) {
  if (!destination) return null;

  // Handle comma-separated format: "City, Province"
  if (destination.includes(",")) {
    return destination.split(",")[0].trim();
  }

  // Handle "City Province" format
  const cityMatch = destination.match(/^([A-Za-z\s]+?)\s+(City|Province|Municipality)/);
  if (cityMatch) {
    return cityMatch[1].trim();
  }

  // Return as-is if no pattern matches
  return destination;
}

/**
 * MAIN FUNCTION: Build optimized Google Places API query
 * 
 * Strategy:
 * 1. Extract activity type from description
 * 2. Check if activity already contains location context
 * 3. Append trip destination if missing
 * 4. Add "Philippines" for international API accuracy
 * 
 * @param {Object} activity - Activity object with placeName, placeDetails, etc.
 * @param {Object} trip - Trip object containing destination info
 * @returns {string} - Optimized search query for Google Places API
 */
export function buildGooglePlacesQuery(activity, trip) {
  logDebug("googlePlacesQueryBuilder", "Building query", {
    activityName: activity?.placeName || activity?.name,
    tripDestination: getTripDestination(trip),
  });

  // Extract the activity name/place
  const activityName = 
    activity?.placeName || 
    activity?.name || 
    activity?.activity || 
    activity?.place || 
    "";

  if (!activityName) {
    logDebug("googlePlacesQueryBuilder", "No activity name found, returning empty query");
    return "";
  }

  // Extract clean activity type
  const activityType = extractActivityType(activityName);

  // Check if activity already has location context
  const activityHasLocation = 
    activityName.match(/,\s*[A-Z][A-Za-z\s]+/) || // "Place, City"
    activityName.match(/\bin\s+[A-Z][A-Za-z\s]+/) || // "Place in City"
    activityName.match(/\bnear\s+[A-Z][A-Za-z\s]+/) || // "Place near City"
    extractLocationFromActivity(activityName);

  let query = activityType;

  // If activity doesn't have location, add trip destination
  if (!activityHasLocation) {
    const tripDestination = getTripDestination(trip);
    
    if (tripDestination) {
      // Use city/municipality for more precise results
      const city = extractCity(tripDestination);
      query = `${activityType} in ${city || tripDestination}`;
      
      logDebug("googlePlacesQueryBuilder", "Added destination to query", {
        original: activityType,
        enhanced: query,
      });
    }
  }

  // Add Philippines context if not already present (for international API accuracy)
  if (
    !query.toLowerCase().includes("philippines") &&
    !query.toLowerCase().includes("manila") &&
    !query.toLowerCase().includes("cebu") &&
    !query.toLowerCase().includes("davao") &&
    !query.toLowerCase().includes("baguio") &&
    !query.toLowerCase().includes("palawan") &&
    !query.toLowerCase().includes("boracay")
  ) {
    query += ", Philippines";
  }

  logDebug("googlePlacesQueryBuilder", "Final query built", {
    original: activityName,
    final: query,
  });

  return query;
}

/**
 * SPECIALIZED: Build query for accommodation/hotels
 * More specific handling for hotel searches
 */
export function buildHotelQuery(hotelName, destination) {
  if (!hotelName) return "";

  let query = hotelName;

  // Add destination if not already in name
  if (destination && !hotelName.toLowerCase().includes(destination.toLowerCase())) {
    const city = extractCity(destination);
    query = `${hotelName} hotel in ${city || destination}`;
  } else if (!hotelName.toLowerCase().includes("hotel")) {
    query = `${hotelName} hotel`;
  }

  // Add Philippines context
  if (!query.toLowerCase().includes("philippines")) {
    query += ", Philippines";
  }

  return query;
}

/**
 * SPECIALIZED: Build query for restaurants/dining
 * Enhanced handling for food-related activities
 */
export function buildDiningQuery(restaurantInfo, destination, mealType = null) {
  let query = "";

  // Extract restaurant name or type
  if (typeof restaurantInfo === "string") {
    query = extractActivityType(restaurantInfo);
  } else if (restaurantInfo?.placeName) {
    query = extractActivityType(restaurantInfo.placeName);
  }

  // Add meal type context if provided
  if (mealType && !query.toLowerCase().includes(mealType.toLowerCase())) {
    query = `${mealType} ${query}`;
  }

  // Add destination
  if (destination && !query.match(/,\s*[A-Z][A-Za-z\s]+/)) {
    const city = extractCity(destination);
    query = `${query} in ${city || destination}`;
  }

  // Add Philippines context
  if (!query.toLowerCase().includes("philippines")) {
    query += ", Philippines";
  }

  return query;
}

/**
 * Batch builder for multiple activities
 * Useful for pre-processing entire itineraries
 */
export function buildQueriesForItinerary(itinerary, trip) {
  if (!itinerary || !Array.isArray(itinerary)) {
    return [];
  }

  const queries = [];

  itinerary.forEach((day, dayIndex) => {
    const activities = day.plan || [];
    
    activities.forEach((activity, actIndex) => {
      const query = buildGooglePlacesQuery(activity, trip, {
        dayIndex,
        activityIndex: actIndex,
      });

      if (query) {
        queries.push({
          dayIndex,
          activityIndex: actIndex,
          activity: activity.placeName || activity.name,
          query,
        });
      }
    });
  });

  return queries;
}

/**
 * Validation helper: Check if query is specific enough
 * Returns true if query is likely to return accurate results
 */
export function isQuerySpecific(query) {
  if (!query || query.length < 5) return false;

  // Check for location context
  const hasLocation = 
    query.includes(" in ") ||
    query.includes(",") ||
    query.toLowerCase().includes("philippines") ||
    query.toLowerCase().includes("manila") ||
    query.toLowerCase().includes("cebu");

  // Check for generic terms that need more context
  const isGeneric = 
    query.toLowerCase() === "hotel" ||
    query.toLowerCase() === "restaurant" ||
    query.toLowerCase() === "eatery" ||
    query.toLowerCase() === "activity";

  return hasLocation && !isGeneric;
}

// Export all utilities
export default {
  buildGooglePlacesQuery,
  buildHotelQuery,
  buildDiningQuery,
  buildQueriesForItinerary,
  extractActivityType,
  extractLocationFromActivity,
  getTripDestination,
  extractCity,
  isQuerySpecific,
};
