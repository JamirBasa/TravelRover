/**
 * Flight Recommendations Utility
 * Smart logic for flight suggestions based on user context
 */

// Complete list of Philippine airports with regular commercial flights (October 2025)
const AIRPORTS_WITH_COMMERCIAL_FLIGHTS = [
  // International Airports (8)
  "MNL", "CRK", "CEB", "DVO", "ILO", "KLO", "PPS",
  
  // Principal Class 1 Airports with scheduled service
  "BCD", "TAG", "BXU", "CYZ", "CBO", "TAC", "DPL", "DGT", 
  "GES", "MPH", "OZC", "CGY", "WNP", "PAG", "RXS", "TWT", 
  "SJI", "SFS", "TUG", "ZAM", "DRP",
  
  // Principal Class 2 Airports with scheduled service
  "BSO", "CYP", "CGM", "CRM", "CYU", "EUQ", "USU", "JOL", 
  "MBT", "OMC", "SWL", "IAO", "SUG", "TDG", "TBH", "VRC", "LGP"
];

// Special cases: Airports with limited or no regular commercial service
const LIMITED_SERVICE_AIRPORTS = {
  "BAG": {
    name: "Baguio",
    alternatives: ["CRK", "MNL"],
    transport: "bus",
    travelTime: "4-6 hours",
    notes: "Loakan Airport suspended commercial flights in July 2024"
  }
};

// Airport code to city name mapping
const AIRPORT_CITIES = {
  "MNL": "Manila",
  "CRK": "Clark",
  "CEB": "Cebu",
  "DVO": "Davao",
  "ILO": "Iloilo",
  "BAG": "Baguio",
  "ZAM": "Zamboanga",
  "BCD": "Bacolod",
  "TAG": "Bohol",
  "CGY": "Cagayan de Oro",
  "PPS": "Puerto Princesa",
  "KLO": "Kalibo",
  "TAC": "Tacloban",
  "DGT": "Siargao",
  "GES": "General Santos",
  "TUG": "Tuguegarao"
};

// Helper to get city name from airport code
function getAirportCity(code) {
  return AIRPORT_CITIES[code] || code;
}

// Helper to check if airport has commercial flights
function hasCommercialFlights(airportCode) {
  if (!airportCode) return false;
  return AIRPORTS_WITH_COMMERCIAL_FLIGHTS.includes(airportCode.toUpperCase());
}

// Helper to check if airport has limited service
function hasLimitedService(airportCode) {
  if (!airportCode) return false;
  return LIMITED_SERVICE_AIRPORTS.hasOwnProperty(airportCode.toUpperCase());
}

/**
 * Check if user is in the same city/region as destination
 */
export function isSameCity(departureCity, destination) {
  if (!departureCity || !destination) return false;

  const normalizeName = (name) =>
    name
      .toLowerCase()
      .normalize("NFD") // Handle accented characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b(city|province|metro)\b/gi, "")
      .trim();

  const departure = normalizeName(departureCity);
  const dest = normalizeName(destination);

  if (departure === dest) return true;
  if (dest.includes(departure) || departure.includes(dest)) return true;

  // Metro area matching
  const metroMatches = {
    manila: ["quezon city", "makati", "taguig", "pasig", "mandaluyong", "pasay", "paranaque"],
    cebu: ["cebu city", "lapu-lapu", "mandaue"],
    davao: ["davao city"],
    bacolod: ["silay"],
    iloilo: ["cabatuan"]
  };

  for (const [metro, cities] of Object.entries(metroMatches)) {
    if (
      (departure.includes(metro) || cities.some((c) => departure.includes(c))) &&
      (dest.includes(metro) || cities.some((c) => dest.includes(c)))
    ) {
      return true;
    }
  }

  return false;
}

// Remote destinations requiring early departure
const REMOTE_DESTINATIONS = [
  // Northern Luzon
  "batanes", "basco", "itbayat", "baguio", "sagada", "banaue",
  
  // Mindanao
  "zamboanga", "basilan", "sulu", "tawi-tawi", "siquijor",
  
  // Palawan
  "palawan", "puerto princesa", "el nido", "coron", "busuanga",
  
  // Island destinations
  "siargao", "surigao", "camiguin", "catanduanes", "masbate"
];

export function isRemoteDestination(destination) {
  if (!destination) return false;
  const normalized = destination.toLowerCase();
  return REMOTE_DESTINATIONS.some((remote) => normalized.includes(remote));
}

/**
 * Calculate flight dates with timezone-safe date handling
 */
export function calculateFlightDates(startDate, endDate, destination) {
  if (!startDate || !endDate) {
    return {
      outboundDate: null,
      returnDate: null,
      flyOutEarly: false,
      reason: null,
    };
  }

  // Fix timezone issues by forcing local midnight
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const isRemote = isRemoteDestination(destination);

  if (isRemote) {
    const dayBefore = new Date(start);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayBeforeStr = dayBefore.toISOString().split("T")[0];

    return {
      outboundDate: dayBeforeStr,
      returnDate: endDate,
      flyOutEarly: true,
      reason: `${destination || "This destination"} is remote. We recommend flying out the day before (${dayBeforeStr}) to arrive fresh and maximize your ${Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1} days.`,
    };
  }

  return {
    outboundDate: startDate,
    returnDate: endDate,
    flyOutEarly: false,
    reason: null,
  };
}

/**
 * Get airport status (for UI to determine what to display)
 */
export function getAirportStatus(airportCode) {
  if (!airportCode) {
    return { exists: false, hasService: false, limited: false };
  }
  
  const code = airportCode.toUpperCase();
  
  if (hasLimitedService(code)) {
    return { 
      exists: true, 
      hasService: false, 
      limited: true,
      info: LIMITED_SERVICE_AIRPORTS[code]
    };
  }
  
  if (hasCommercialFlights(code)) {
    return { exists: true, hasService: true, limited: false };
  }
  
  return { exists: true, hasService: false, limited: false };
}

/**
 * Generate flight recommendation message
 */
export function getFlightRecommendationMessage({
  departureCity,
  destination,
  startDate,
  endDate,
  includeFlights,
  destinationAirportCode,
}) {
  if (!includeFlights) return null;

  // Validate airport code
  if (!destinationAirportCode) {
    return {
      type: "missing-airport",
      message: "⚠️ Unable to determine destination airport. Please verify your destination.",
      recommendation: "verify-destination",
    };
  }

  const airportCode = destinationAirportCode.toUpperCase();

  // Check if same city
  if (isSameCity(departureCity, destination)) {
    return {
      type: "same-city",
      message: `✈️ You're already in ${destination}! No flights needed - you can start exploring right away.`,
      recommendation: "disable-flights",
    };
  }

  // Check for limited service airports (like BAG)
  if (hasLimitedService(airportCode)) {
    const airportInfo = LIMITED_SERVICE_AIRPORTS[airportCode];
    const altCities = airportInfo.alternatives.map(code => getAirportCity(code)).join(" or ");
    
    return {
      type: "limited-service",
      message: `🧭 ${destination} has no regular commercial flights. Fly to ${altCities} and continue by ${airportInfo.transport} (${airportInfo.travelTime}).`,
      recommendation: "connect-via-major-hub",
      alternativeAirports: airportInfo.alternatives,
      groundTransport: airportInfo.transport,
      travelTime: airportInfo.travelTime,
      notes: airportInfo.notes
    };
  }

  // Check for commercial flights to destination airport
  if (!hasCommercialFlights(airportCode)) {
    return {
      type: "no-direct-flights",
      message: `🧭 No regular commercial flights to ${destination}. Consider flying to a nearby major airport and continuing by land.`,
      recommendation: "connect-via-nearby-hub",
      alternativeAirports: ["MNL", "CRK", "CEB"],
    };
  }

  // Get flight date recommendations
  const flightDates = calculateFlightDates(startDate, endDate, destination);

  if (flightDates.flyOutEarly) {
    return {
      type: "remote-destination",
      message: `✈️ ${flightDates.reason}`,
      recommendation: "fly-early",
      outboundDate: flightDates.outboundDate,
      returnDate: flightDates.returnDate,
    };
  }

  // Standard flight recommendation
  if (startDate && endDate) {
    return {
      type: "standard",
      message: `✈️ Recommended flights: Depart ${formatFlightDate(startDate)}, return ${formatFlightDate(endDate)}.`,
      recommendation: "standard-flight",
      outboundDate: startDate,
      returnDate: endDate,
    };
  }

  return null;
}

/**
 * Format flight date
 */
export function formatFlightDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get contextual flight tips
 */
export function getFlightContextTips({
  departureCity,
  destination,
  startDate,
  endDate,
  duration,
  destinationAirportCode,
}) {
  const tips = [];

  if (!destinationAirportCode) return tips;

  const airportCode = destinationAirportCode.toUpperCase();

  if (isSameCity(departureCity, destination)) {
    tips.push(
      "💡 You're already in the destination city - consider local transportation instead"
    );
    return tips;
  }

  if (hasLimitedService(airportCode)) {
    const airportInfo = LIMITED_SERVICE_AIRPORTS[airportCode];
    tips.push(
      `🧭 ${destination} has no regular commercial flights. Fly to ${airportInfo.alternatives.map(c => getAirportCity(c)).join(" or ")} and continue by ${airportInfo.transport}.`
    );
  } else if (!hasCommercialFlights(airportCode)) {
    tips.push(
      "🧭 No direct commercial flights to your destination. Consider flying to a nearby major airport."
    );
  }

  if (isRemoteDestination(destination)) {
    tips.push(
      "🏝️ Remote destination detected - flying out early is recommended"
    );
  }

  if (startDate && endDate) {
    const flightDates = calculateFlightDates(startDate, endDate, destination);
    if (flightDates.outboundDate) {
      tips.push(
        `📅 Recommended departure: ${formatFlightDate(flightDates.outboundDate)}`
      );
    }
    if (flightDates.returnDate) {
      tips.push(`📅 Return flight: ${formatFlightDate(flightDates.returnDate)}`);
    }
  }

  if (duration >= 7) {
    tips.push("⏰ Longer trip - consider flexible flight dates for better prices");
  }

  return tips;
}

export default {
  isSameCity,
  isRemoteDestination,
  calculateFlightDates,
  getFlightRecommendationMessage,
  formatFlightDate,
  getFlightContextTips,
  hasCommercialFlights,
  hasLimitedService,
  getAirportStatus,
  getAirportCity,
};
