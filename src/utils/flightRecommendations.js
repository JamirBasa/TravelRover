/**
 * Flight Recommendations Utility
 * Smart logic for flight suggestions based on user context
 */

/**
 * Check if user is in the same city/region as destination
 * @param {string} departureCity - User's departure city
 * @param {string} destination - Trip destination
 * @returns {boolean} True if same city/region
 */
export function isSameCity(departureCity, destination) {
  if (!departureCity || !destination) return false;

  const normalizeName = (name) =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/city|province|metro/gi, "")
      .trim();

  const departure = normalizeName(departureCity);
  const dest = normalizeName(destination);

  // Direct match
  if (departure === dest) return true;

  // Check if one contains the other (e.g., "Manila" in "Manila, Metro Manila")
  if (dest.includes(departure) || departure.includes(dest)) return true;

  // Check for common metro area matches
  const metroMatches = {
    manila: ["quezon city", "makati", "taguig", "pasig", "mandaluyong"],
    cebu: ["cebu city", "lapu-lapu", "mandaue"],
    davao: ["davao city"],
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

/**
 * Remote destinations that require flying out the day before
 */
const REMOTE_DESTINATIONS = [
  "batanes",
  "basco",
  "itbayat",
  "zamboanga",
  "basilan",
  "sulu",
  "tawi-tawi",
  "palawan",
  "puerto princesa",
  "el nido",
  "coron",
  "siargao",
  "surigao",
  "camiguin",
  "siquijor",
];

/**
 * Check if destination is remote and requires early departure
 * @param {string} destination - Trip destination
 * @returns {boolean} True if remote destination
 */
export function isRemoteDestination(destination) {
  if (!destination) return false;

  const normalized = destination.toLowerCase();
  return REMOTE_DESTINATIONS.some((remote) => normalized.includes(remote));
}

/**
 * Calculate recommended flight dates
 * @param {string} startDate - Trip start date (YYYY-MM-DD)
 * @param {string} endDate - Trip end date (YYYY-MM-DD)
 * @param {string} destination - Trip destination
 * @returns {Object} Flight date recommendations
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

  const start = new Date(startDate);
  const end = new Date(endDate);
  const isRemote = isRemoteDestination(destination);

  // For remote destinations, recommend flying out the day before
  if (isRemote) {
    const dayBefore = new Date(start);
    dayBefore.setDate(dayBefore.getDate() - 1);

    return {
      outboundDate: dayBefore.toISOString().split("T")[0],
      returnDate: endDate,
      flyOutEarly: true,
      reason: `${destination || "This destination"} is remote. We recommend flying out the day before (${dayBefore.toISOString().split("T")[0]}) to arrive fresh and maximize your ${Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1} days.`,
    };
  }

  // For regular destinations, same-day departure
  return {
    outboundDate: startDate,
    returnDate: endDate,
    flyOutEarly: false,
    reason: `Fly out on ${startDate} and return on ${endDate}.`,
  };
}

/**
 * Generate flight recommendation message
 * @param {Object} params - Flight parameters
 * @returns {string} Recommendation message
 */
export function getFlightRecommendationMessage({
  departureCity,
  destination,
  startDate,
  endDate,
  includeFlights,
}) {
  // If flights not included, return null
  if (!includeFlights) return null;

  // Check if same city
  if (isSameCity(departureCity, destination)) {
    return {
      type: "same-city",
      message: `✈️ You're already in ${destination}! No flights needed - you can start exploring right away. Consider disabling flight search to focus on local transportation.`,
      recommendation: "disable-flights",
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

  return {
    type: "standard",
    message: `✈️ ${flightDates.reason}`,
    recommendation: "standard-flight",
    outboundDate: flightDates.outboundDate,
    returnDate: flightDates.returnDate,
  };
}

/**
 * Format date for display (e.g., "2025-11-01" → "November 1, 2025")
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
export function formatFlightDate(dateStr) {
  if (!dateStr) return "";

  const date = new Date(dateStr + "T00:00:00"); // Add time to avoid timezone issues
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get contextual flight tips for the UI
 * @param {Object} context - Flight context
 * @returns {Array<string>} Array of tips
 */
export function getFlightContextTips({
  departureCity,
  destination,
  startDate,
  endDate,
  duration,
}) {
  const tips = [];

  // Same city tip
  if (isSameCity(departureCity, destination)) {
    tips.push(
      "💡 You're already in the destination city - consider local transportation instead"
    );
    return tips;
  }

  // Remote destination tip
  if (isRemoteDestination(destination)) {
    tips.push(
      "🏝️ Remote destination detected - flying out early is recommended"
    );
  }

  // Date tips
  if (startDate && endDate) {
    const flightDates = calculateFlightDates(startDate, endDate, destination);
    tips.push(
      `📅 Recommended departure: ${formatFlightDate(flightDates.outboundDate)}`
    );
    tips.push(`📅 Return flight: ${formatFlightDate(flightDates.returnDate)}`);
  }

  // Duration tip
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
};
