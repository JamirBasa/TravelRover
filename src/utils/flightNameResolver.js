/**
 * Flight Name Resolution Utility
 * Ensures all flight-related activities use actual flight details
 * instead of generic references like "Flight to Manila" or "Departure Flight"
 */

/**
 * Extract flight information from trip data
 * @param {Object} trip - The FULL trip object (not trip.tripData)
 * @returns {Object} - { outbound: {...}, return: {...} } or null
 */
export function extractFlightDetails(trip) {
  if (!trip) {
    console.warn("⚠️ No trip data provided to extractFlightDetails");
    return null;
  }

  console.log("🔍 Flight Extraction Debug - Full Structure:", {
    topLevelKeys: Object.keys(trip),
    hasRealFlightData: !!trip.realFlightData,
    hasFlightResults: !!trip.flightResults,
    hasFlights: !!trip.flights,
    hasFlightData: !!trip.flightData,
    hasFlightPreferences: !!trip.flightPreferences,
    includeFlights: trip.flightPreferences?.includeFlights,
  });

  // Log the actual realFlightData structure
  if (trip.realFlightData) {
    console.log("🔍 realFlightData structure:", {
      type: typeof trip.realFlightData,
      keys: typeof trip.realFlightData === 'object' ? Object.keys(trip.realFlightData) : 'N/A',
      hasFlights: !!trip.realFlightData.flights,
      flightsType: typeof trip.realFlightData.flights,
      flightsLength: Array.isArray(trip.realFlightData.flights) ? trip.realFlightData.flights.length : 'not an array',
      firstFlight: Array.isArray(trip.realFlightData.flights) ? trip.realFlightData.flights[0] : null,
    });
  } else if (trip.flightPreferences?.includeFlights) {
    console.log("ℹ️ Flight inclusion enabled but no realFlightData found (might be inactive airport like Baguio)");
  }

  // Try multiple possible paths for flight data
  const possiblePaths = [
    // ✅ Check root-level flight data first (where it actually lives)
    { path: trip?.realFlightData?.flights, name: 'realFlightData.flights' },
    { path: trip?.realFlightData, name: 'realFlightData' },
    { path: trip?.flightResults?.flights, name: 'flightResults.flights' },
    { path: trip?.flightResults, name: 'flightResults' },
    { path: trip?.flights, name: 'flights' },
    { path: trip?.flightData?.flights, name: 'flightData.flights' },
    { path: trip?.flightData, name: 'flightData' },
    // Also check nested tripData (fallback for legacy data)
    { path: trip?.tripData?.flights, name: 'tripData.flights' },
    { path: trip?.tripData?.flightResults, name: 'tripData.flightResults' },
  ];

  for (const { path, name } of possiblePaths) {
    if (path) {
      console.log(`🔍 Checking path: ${name}`, {
        type: typeof path,
        isArray: Array.isArray(path),
        hasFlights: path?.flights ? true : false,
      });

      let flights = [];

      // Parse if it's a string
      if (typeof path === "string") {
        try {
          flights = JSON.parse(path);
          console.log(`✅ Parsed flights from string (${name}):`, flights.length);
        } catch {
          console.warn(`❌ Failed to parse flights data from ${name}`);
          continue;
        }
      } else if (Array.isArray(path)) {
        flights = path;
        console.log(`✅ Found flights array at ${name}:`, flights.length);
      } else if (typeof path === "object" && path !== null) {
        // Check if this object has a flights array
        if (Array.isArray(path.flights)) {
          flights = path.flights;
          console.log(`✅ Found nested flights array at ${name}.flights:`, flights.length);
        } else {
          // Single flight object
          flights = [path];
          console.log(`✅ Treating ${name} as single flight object`);
        }
      }

      // Separate outbound and return flights
      if (flights.length > 0) {
        console.log(`📝 Processing ${flights.length} flights from ${name}`);
        
        const outbound = flights.find((f) => 
          f?.type === "outbound" || 
          f?.flightType === "outbound" ||
          f?.direction === "outbound" ||
          !f?.type // First flight is usually outbound
        ) || flights[0];

        const returnFlight = flights.find((f) => 
          f?.type === "return" || 
          f?.flightType === "return" ||
          f?.direction === "return" ||
          f?.isReturn === true
        ) || flights[1]; // Second flight is usually return

        console.log("✅ Extracted flight details:", {
          source: name,
          outbound: {
            airline: outbound?.airline || outbound?.carrier,
            flightNumber: outbound?.flightNumber,
            from: outbound?.departure || outbound?.from || outbound?.origin,
            to: outbound?.arrival || outbound?.to || outbound?.destination,
          },
          return: returnFlight ? {
            airline: returnFlight?.airline || returnFlight?.carrier,
            flightNumber: returnFlight?.flightNumber,
            from: returnFlight?.departure || returnFlight?.from || returnFlight?.origin,
            to: returnFlight?.arrival || returnFlight?.to || returnFlight?.destination,
          } : null,
          totalFlights: flights.length,
        });

        return {
          outbound: outbound || null,
          return: returnFlight || null,
        };
      } else {
        console.log(`⚠️ Path ${name} had no flights after processing`);
      }
    }
  }

  // Check if this is expected (inactive airport with flight inclusion)
  if (trip.flightPreferences?.includeFlights && !trip.realFlightData) {
    console.log("ℹ️ No flight data for trip with flights enabled - likely inactive airport (e.g., Baguio)");
  } else {
    console.warn("⚠️ No flight details found in trip data after checking all paths");
  }
  
  return null;
}

/**
 * Format flight details into readable string
 * @param {Object} flight - Flight object
 * @param {string} type - 'outbound' or 'return'
 * @returns {string} - Formatted flight details
 */
export function formatFlightDetails(flight, type = "outbound") {
  if (!flight) return null;

  const airline = flight.airline || flight.carrier || flight.airlineName || "Flight";
  const flightNumber = flight.flightNumber || flight.flight_number || flight.number;
  const from = flight.departure || flight.from || flight.origin || flight.departureCity;
  const to = flight.arrival || flight.to || flight.destination || flight.arrivalCity;
  const time = flight.departureTime || flight.departure_time || flight.time;

  // Format: "Philippine Airlines (PR123) Manila → Cebu"
  let formatted = airline;
  
  if (flightNumber) {
    formatted += ` (${flightNumber})`;
  }
  
  if (from && to) {
    formatted += ` ${from} → ${to}`;
  } else if (to) {
    formatted += ` to ${to}`;
  } else if (from) {
    formatted += ` from ${from}`;
  }

  if (time && type === "outbound") {
    formatted += ` at ${time}`;
  }

  return formatted;
}

/**
 * Check if a place name is a generic flight reference
 * @param {string} placeName - The place name to check
 * @returns {boolean} - True if it's a generic flight reference
 */
export function isGenericFlightReference(placeName) {
  if (!placeName || typeof placeName !== "string") return false;

  const genericPatterns = [
    /^flight\s+to\s+\w+$/i,
    /^flight\s+from\s+\w+$/i,
    /^departure\s+flight$/i,
    /^return\s+flight$/i,
    /^outbound\s+flight$/i,
    /^inbound\s+flight$/i,
    /^flight\s+departure$/i,
    /^flight\s+arrival$/i,
    /^catch\s+flight$/i,
    /^board\s+flight$/i,
    /^flight\s+check[-\s]?in$/i,
    /^airport\s+departure$/i,
    /^airport\s+arrival$/i,
    /^fly\s+to\s+\w+$/i,
    /^fly\s+back$/i,
    /^depart\s+for\s+\w+$/i,
    /^return\s+to\s+\w+$/i,
  ];

  return genericPatterns.some((pattern) => pattern.test(placeName.trim()));
}

/**
 * Analyze if a place name references a flight
 * @param {string} placeName - The place name to check
 * @returns {Object} - { isFlightReference: boolean, type: 'outbound'|'return'|null }
 */
export function analyzeFlightReference(placeName) {
  if (!placeName || typeof placeName !== "string") {
    return { isFlightReference: false, type: null };
  }

  const normalized = placeName.toLowerCase().trim();

  // Check for generic flight references
  if (isGenericFlightReference(placeName)) {
    // Determine if it's outbound or return
    const returnPatterns = [
      /return.*flight/i,
      /flight.*return/i,
      /fly.*back/i,
      /return.*to/i,
      /inbound/i,
    ];

    const isReturn = returnPatterns.some((pattern) => pattern.test(normalized));

    return {
      isFlightReference: true,
      type: isReturn ? "return" : "outbound",
      isGeneric: true,
    };
  }

  // Check for flight-related activities
  const flightPatterns = [
    /flight\s+to/i,
    /flight\s+from/i,
    /departure/i,
    /arrival/i,
    /catch.*flight/i,
    /board.*flight/i,
    /check[-\s]?in.*flight/i,
    /airport.*departure/i,
    /airport.*arrival/i,
  ];

  if (flightPatterns.some((pattern) => pattern.test(normalized))) {
    // Check if it has specific airline/flight number
    const hasSpecificDetails =
      /[A-Z]{2}\d{2,4}/.test(placeName) || // Flight number pattern (e.g., PR123)
      /(philippine|cebu|airasia|pal)/i.test(placeName); // Airline names

    const returnPatterns = [
      /return/i,
      /back/i,
      /inbound/i,
    ];

    const isReturn = returnPatterns.some((pattern) => pattern.test(normalized));

    return {
      isFlightReference: true,
      type: isReturn ? "return" : "outbound",
      isGeneric: !hasSpecificDetails,
    };
  }

  return { isFlightReference: false, type: null, isGeneric: false };
}

/**
 * Resolve a place name to use specific flight details if needed
 * @param {string} placeName - The original place name
 * @param {Object} flightDetails - { outbound: {...}, return: {...} }
 * @returns {string} - Resolved place name
 */
export function resolveFlightName(placeName, flightDetails) {
  if (!placeName || !flightDetails) return placeName;

  const analysis = analyzeFlightReference(placeName);

  // If it's not a flight reference, return as-is
  if (!analysis.isFlightReference) {
    return placeName;
  }

  // If it's already specific (has airline/flight number), return as-is
  if (!analysis.isGeneric) {
    return placeName;
  }

  // Determine which flight to use
  const flight = analysis.type === "return" 
    ? flightDetails.return 
    : flightDetails.outbound;

  if (!flight) {
    console.warn(`⚠️ No ${analysis.type} flight data available`);
    return placeName;
  }

  const formattedFlight = formatFlightDetails(flight, analysis.type);
  if (!formattedFlight) return placeName;

  // Pattern matching and replacement
  const replacements = [
    {
      pattern: /^flight\s+to\s+(\w+)$/i,
      replacement: () => formattedFlight,
    },
    {
      pattern: /^departure\s+flight$/i,
      replacement: `Departure: ${formattedFlight}`,
    },
    {
      pattern: /^return\s+flight$/i,
      replacement: `Return: ${formattedFlight}`,
    },
    {
      pattern: /^outbound\s+flight$/i,
      replacement: `Outbound: ${formattedFlight}`,
    },
    {
      pattern: /^catch\s+flight$/i,
      replacement: `Catch ${formattedFlight}`,
    },
    {
      pattern: /^board\s+flight$/i,
      replacement: `Board ${formattedFlight}`,
    },
    {
      pattern: /^flight\s+departure$/i,
      replacement: `Departure: ${formattedFlight}`,
    },
    {
      pattern: /^fly\s+to\s+(\w+)$/i,
      replacement: formattedFlight,
    },
    {
      pattern: /^fly\s+back$/i,
      replacement: `Return: ${formattedFlight}`,
    },
    {
      pattern: /^depart\s+for\s+(\w+)$/i,
      replacement: formattedFlight,
    },
  ];

  // Apply first matching replacement
  for (const { pattern, replacement } of replacements) {
    if (pattern.test(placeName)) {
      const resolved = typeof replacement === "function"
        ? placeName.replace(pattern, replacement)
        : replacement;
      
      console.log(`✈️ Resolved: "${placeName}" → "${resolved}"`);
      return resolved;
    }
  }

  // If no pattern matched but it's a generic reference, do a simple replacement
  const resolved = `${analysis.type === "return" ? "Return" : "Departure"}: ${formattedFlight}`;
  console.log(`✈️ Generic replacement: "${placeName}" → "${resolved}"`);
  return resolved;
}

/**
 * Batch resolve all flight references in an itinerary
 * @param {Array} locations - Array of location objects
 * @param {Object} flightDetails - { outbound: {...}, return: {...} }
 * @returns {Array} - Array of resolved location objects
 */
export function resolveAllFlightReferences(locations, flightDetails) {
  if (!Array.isArray(locations) || !flightDetails) {
    return locations;
  }

  console.log(
    `✈️ Resolving flight references for ${locations.length} locations...`
  );

  return locations.map((location) => {
    const resolvedName = resolveFlightName(location.name, flightDetails);

    return {
      ...location,
      name: resolvedName,
      originalName: location.originalName || location.name, // Preserve original
      wasResolved: location.wasResolved || resolvedName !== location.name,
    };
  });
}

/**
 * Combined resolver for both hotels and flights
 * @param {Array} locations - Array of location objects
 * @param {string} recommendedHotelName - The recommended hotel name
 * @param {Object} flightDetails - { outbound: {...}, return: {...} }
 * @returns {Array} - Array of fully resolved location objects
 */
export function resolveAllTravelReferences(locations, recommendedHotelName, flightDetails) {
  if (!Array.isArray(locations)) {
    return locations;
  }

  let resolvedLocations = locations;

  // First resolve hotel references
  if (recommendedHotelName) {
    // Import dynamically to avoid circular dependencies
    import('./hotelNameResolver').then(({ resolveAllHotelReferences }) => {
      resolvedLocations = resolveAllHotelReferences(resolvedLocations, recommendedHotelName);
    });
  }

  // Then resolve flight references
  if (flightDetails) {
    resolvedLocations = resolveAllFlightReferences(resolvedLocations, flightDetails);
  }

  return resolvedLocations;
}
