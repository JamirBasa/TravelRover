/**
 * Travelers Format Utilities
 * Centralized parsing and formatting for consistency across numeric migration
 */

/**
 * Parse travelers input to numeric value
 * @param {number|string} travelers - Input in various formats
 * @returns {number} Numeric travelers count
 */
export const parseTravelersToNumber = (travelers) => {
  // Already numeric (new standard)
  if (typeof travelers === 'number') {
    return Math.max(1, Math.min(20, travelers));
  }
  
  // String formats
  if (typeof travelers === 'string') {
    // Direct numeric string "2"
    if (/^\d+$/.test(travelers.trim())) {
      const count = parseInt(travelers.trim(), 10);
      return Math.max(1, Math.min(20, count));
    }
    
    // Extract from "2 People", "3 to 5 People"
    const match = travelers.match(/(\d+)/);
    if (match) {
      const count = parseInt(match[1], 10);
      return Math.max(1, Math.min(20, count));
    }
    
    // ✅ Legacy preset mappings (updated with "Duo")
    const legacyMap = {
      'Just Me': 1,
      'Solo Traveler': 1,
      'A Couple': 2,  // Old format
      'Couple': 2,     // Old format
      'Couple Getaway': 2, // Old format
      'Duo': 2,        // ✅ NEW: Universal format
      'Small Group': 4,
      'Family': 5,
      'Large Group': 8,
      'Friends': 4,
      'Group Tour': 6,
    };
    
    const normalized = travelers.trim();
    if (legacyMap[normalized]) {
      return legacyMap[normalized];
    }
    
    // Case-insensitive lookup
    const lowerInput = travelers.toLowerCase();
    for (const [key, value] of Object.entries(legacyMap)) {
      if (key.toLowerCase() === lowerInput) {
        return value;
      }
    }
  }
  
  // Fallback
  console.warn(`Could not parse travelers input: ${travelers}, defaulting to 1`);
  return 1;
};

/**
 * Format travelers count for display
 * @param {number|string} travelers - Travelers count
 * @returns {string} Formatted display string
 */
export const formatTravelersDisplay = (travelers) => {
  const count = parseTravelersToNumber(travelers);
  return `${count} ${count === 1 ? 'Person' : 'People'}`;
};

/**
 * Validate travelers count
 * @param {number|string} travelers - Travelers input
 * @returns {Object} { isValid: boolean, error?: string, value: number }
 */
export const validateTravelers = (travelers) => {
  try {
    const count = parseTravelersToNumber(travelers);
    
    if (isNaN(count)) {
      return {
        isValid: false,
        error: 'Invalid travelers count',
        value: 1
      };
    }
    
    if (count < 1) {
      return {
        isValid: false,
        error: 'At least 1 traveler required',
        value: 1
      };
    }
    
    if (count > 20) {
      return {
        isValid: false,
        error: 'Maximum 20 travelers allowed',
        value: 20
      };
    }
    
    return {
      isValid: true,
      value: count
    };
  } catch {
    return {
      isValid: false,
      error: 'Failed to parse travelers count',
      value: 1
    };
  }
};

/**
 * Format travelers count for display in UI
 * Handles all possible formats: number, string, parser object
 * @param {number|string|object} travelers - Travelers value in any format
 * @returns {string} - Human-readable string like "2 People"
 */
export function formatTravelersForDisplay(travelers) {
  // Handle null/undefined
  if (!travelers) {
    return "Not specified";
  }

  // Handle direct number: 2
  if (typeof travelers === "number") {
    return `${travelers} ${travelers === 1 ? "Person" : "People"}`;
  }

  // Handle parser object: {matched: "2 People", original: "2"}
  if (typeof travelers === "object" && travelers.matched) {
    return travelers.matched;
  }

  // Handle string: "2 People" or "2"
  if (typeof travelers === "string") {
    // If already formatted (contains "People" or "Person"), return as-is
    if (travelers.includes("People") || travelers.includes("Person")) {
      return travelers;
    }
    
    // If just a number string, format it
    const count = parseInt(travelers, 10);
    if (!isNaN(count)) {
      return `${count} ${count === 1 ? "Person" : "People"}`;
    }
    
    // Fallback: return the string as-is
    return travelers;
  }

  // Fallback for unexpected types
  console.warn("Unexpected travelers format:", travelers);
  return "Not specified";
}

/**
 * Extract numeric count from travelers value
 * @param {number|string|object} travelers - Travelers value in any format
 * @returns {number} - Numeric count (default: 0)
 */
export function getTravelersCount(travelers) {
  if (!travelers) return 0;

  // Direct number
  if (typeof travelers === "number") {
    return travelers;
  }

  // Parser object
  if (typeof travelers === "object" && travelers.matched) {
    const match = String(travelers.matched).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // String
  if (typeof travelers === "string") {
    const match = String(travelers).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  return 0;
}

/**
 * Validate travelers data structure
 * @param {any} travelers - Travelers value to validate
 * @returns {object} - Validation result
 */
export function validateTravelersFormat(travelers) {
  const result = {
    isValid: true,
    format: null,
    count: 0,
    warning: null,
  };

  if (!travelers) {
    result.isValid = false;
    result.warning = "Travelers is null/undefined";
    return result;
  }

  if (typeof travelers === "number") {
    result.format = "number";
    result.count = travelers;
    result.isValid = travelers >= 1 && travelers <= 50;
    return result;
  }

  if (typeof travelers === "object" && travelers.matched) {
    result.format = "parser_object";
    result.count = getTravelersCount(travelers);
    result.warning = "⚠️ Travelers stored as object - should be integer";
    result.isValid = false; // Object format not recommended
    return result;
  }

  if (typeof travelers === "string") {
    result.format = "string";
    result.count = getTravelersCount(travelers);
    result.warning = "⚠️ Travelers stored as string - should be integer";
    result.isValid = false; // String format not recommended
    return result;
  }

  result.isValid = false;
  result.warning = `Unknown format: ${typeof travelers}`;
  return result;
}

export default {
  parseTravelersToNumber,
  formatTravelersDisplay,
  formatTravelersForDisplay,
  getTravelersCount,
  validateTravelers,
  validateTravelersFormat
};
