/**
 * Hotel Name Resolution Utility
 * Ensures all hotel-related activities use the actual recommended hotel name
 * instead of generic references like "Hotel Check-in" or "Lunch at hotel"
 */

/**
 * Extract the primary recommended hotel name from trip data
 * @param {Object} tripData - The trip data object
 * @returns {string|null} - The hotel name or null
 */
export function extractRecommendedHotelName(tripData) {
  if (!tripData) return null;

  // ✅ PRIORITY 1: Check for explicitly marked recommended_hotel (from LangGraph backend)
  if (tripData?.recommended_hotel) {
    const hotelName = 
      tripData.recommended_hotel.name || 
      tripData.recommended_hotel.hotelName ||
      tripData.recommended_hotel.hotel_name;
    
    if (hotelName && hotelName.trim().length > 3) {
      console.log("✅ Extracted recommended hotel (priority):", hotelName);
      return hotelName.trim();
    }
  }

  // ✅ PRIORITY 2: Try multiple possible paths for hotel data
  const possiblePaths = [
    tripData?.hotels,
    tripData?.accommodations,
    tripData?.tripData?.hotels,
    tripData?.tripData?.accommodations,
    tripData?.tripData?.recommended_hotel,
  ];

  for (const path of possiblePaths) {
    if (path) {
      let hotels = [];

      // Parse if it's a string
      if (typeof path === "string") {
        try {
          hotels = JSON.parse(path);
        } catch {
          console.warn("Failed to parse hotels data");
          continue;
        }
      } else if (Array.isArray(path)) {
        hotels = path;
      } else if (typeof path === "object") {
        hotels = [path];
      }

      // ✅ PRIORITY 3: Look for hotel marked as primary check-in
      const primaryHotel = hotels.find(h => h?.is_primary_checkin === true);
      if (primaryHotel) {
        const hotelName =
          primaryHotel.name ||
          primaryHotel.hotelName ||
          primaryHotel.hotel_name ||
          primaryHotel.hotelAddress?.split(",")[0];

        if (hotelName && hotelName.trim().length > 3) {
          console.log("✅ Extracted primary check-in hotel:", hotelName);
          return hotelName.trim();
        }
      }

      // ✅ PRIORITY 4: Get first hotel name (primary recommendation)
      if (hotels.length > 0) {
        const firstHotel = hotels[0];
        const hotelName =
          firstHotel?.name ||
          firstHotel?.hotelName ||
          firstHotel?.hotel_name ||
          firstHotel?.hotelAddress?.split(",")[0]; // Fallback to address

        if (hotelName && hotelName.trim().length > 3) {
          console.log("✅ Extracted recommended hotel:", hotelName);
          return hotelName.trim();
        }
      }
    }
  }

  console.warn("⚠️ No recommended hotel found in trip data");
  return null;
}

/**
 * Check if a place name is a generic hotel reference
 * @param {string} placeName - The place name to check
 * @returns {boolean} - True if it's a generic hotel reference
 */
export function isGenericHotelReference(placeName) {
  if (!placeName || typeof placeName !== "string") return false;

  const genericPatterns = [
    /^hotel\s*check[-\s]?in$/i,
    /^check[-\s]?in\s+at\s+hotel$/i,
    /^hotel\s*check[-\s]?out$/i,
    /^check[-\s]?out\s+from\s+hotel$/i,
    /^return\s+to\s+hotel$/i,
    /^back\s+to\s+hotel$/i,
    /^hotel\s+return$/i,
    /^lunch\s+at\s+hotel$/i,
    /^dinner\s+at\s+hotel$/i,
    /^breakfast\s+at\s+hotel$/i,
    /^rest\s+at\s+hotel$/i,
    /^hotel\s+rest$/i,
    /^hotel\s+break$/i,
    /^hotel$/i,
    /^accommodation$/i,
  ];

  return genericPatterns.some((pattern) => pattern.test(placeName.trim()));
}

/**
 * Check if a place name references a hotel (generic or specific)
 * @param {string} placeName - The place name to check
 * @returns {Object} - { isHotelReference: boolean, type: string }
 */
export function analyzeHotelReference(placeName) {
  if (!placeName || typeof placeName !== "string") {
    return { isHotelReference: false, type: null };
  }

  const normalized = placeName.toLowerCase().trim();

  // Check for generic hotel references
  if (isGenericHotelReference(placeName)) {
    return { isHotelReference: true, type: "generic" };
  }

  // Check for hotel-related activities with generic references
  const activityPatterns = [
    /hotel\s*check[-\s]?in/i,
    /check[-\s]?in.*hotel/i,
    /hotel\s*check[-\s]?out/i,
    /check[-\s]?out.*hotel/i,
    /return.*hotel/i,
    /back.*hotel/i,
    /lunch.*hotel/i,
    /dinner.*hotel/i,
    /breakfast.*hotel/i,
  ];

  if (activityPatterns.some((pattern) => pattern.test(normalized))) {
    // Check if it has a specific hotel name (contains more than just "hotel" keyword)
    const hasSpecificName =
      normalized.split(/\s+/).length > 3 && // More than 3 words
      !isGenericHotelReference(placeName); // Not matching generic patterns

    return {
      isHotelReference: true,
      type: hasSpecificName ? "specific" : "generic",
    };
  }

  return { isHotelReference: false, type: null };
}

/**
 * Resolve a place name to use specific hotel name if needed
 * @param {string} placeName - The original place name
 * @param {string} recommendedHotelName - The recommended hotel name
 * @returns {string} - Resolved place name
 */
export function resolveHotelName(placeName, recommendedHotelName) {
  if (!placeName || !recommendedHotelName) return placeName;

  const analysis = analyzeHotelReference(placeName);

  // If it's not a hotel reference, return as-is
  if (!analysis.isHotelReference) {
    return placeName;
  }

  // If it's already specific, return as-is
  if (analysis.type === "specific") {
    return placeName;
  }

  // If it's generic, replace with specific hotel name
  const normalized = placeName.toLowerCase().trim();

  // Pattern matching and replacement
  const replacements = [
    {
      pattern: /^hotel\s*check[-\s]?in$/i,
      replacement: `Check-in at ${recommendedHotelName}`,
    },
    {
      pattern: /^check[-\s]?in\s+at\s+hotel$/i,
      replacement: `Check-in at ${recommendedHotelName}`,
    },
    {
      pattern: /^hotel\s*check[-\s]?out$/i,
      replacement: `Check-out from ${recommendedHotelName}`,
    },
    {
      pattern: /^check[-\s]?out\s+from\s+hotel$/i,
      replacement: `Check-out from ${recommendedHotelName}`,
    },
    {
      pattern: /^return\s+to\s+hotel$/i,
      replacement: `Return to ${recommendedHotelName}`,
    },
    {
      pattern: /^back\s+to\s+hotel$/i,
      replacement: `Return to ${recommendedHotelName}`,
    },
    {
      pattern: /^lunch\s+at\s+hotel$/i,
      replacement: `Lunch at ${recommendedHotelName}`,
    },
    {
      pattern: /^dinner\s+at\s+hotel$/i,
      replacement: `Dinner at ${recommendedHotelName}`,
    },
    {
      pattern: /^breakfast\s+at\s+hotel$/i,
      replacement: `Breakfast at ${recommendedHotelName}`,
    },
    { pattern: /^hotel$/i, replacement: recommendedHotelName },
  ];

  // Apply first matching replacement
  for (const { pattern, replacement } of replacements) {
    if (pattern.test(normalized)) {
      console.log(`🔄 Resolved: "${placeName}" → "${replacement}"`);
      return replacement;
    }
  }

  // If no pattern matched but it's a generic reference, do a simple replacement
  const resolved = placeName.replace(/\bhotel\b/gi, recommendedHotelName);
  console.log(`🔄 Generic replacement: "${placeName}" → "${resolved}"`);
  return resolved;
}

/**
 * Batch resolve all location names in an itinerary
 * @param {Array} locations - Array of location objects
 * @param {string} recommendedHotelName - The recommended hotel name
 * @returns {Array} - Array of resolved location objects
 */
export function resolveAllHotelReferences(locations, recommendedHotelName) {
  if (!Array.isArray(locations) || !recommendedHotelName) {
    return locations;
  }

  console.log(
    `🔄 Resolving hotel references for ${locations.length} locations...`
  );

  return locations.map((location) => {
    const resolvedName = resolveHotelName(location.name, recommendedHotelName);

    return {
      ...location,
      name: resolvedName,
      originalName: location.name, // Preserve original for reference
      wasResolved: resolvedName !== location.name,
    };
  });
}
