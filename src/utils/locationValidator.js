/**
 * Location Validation Utility
 * Validates that generated places actually belong to the selected destination
 */

import { validatePlaceLocation, getRegionData } from '../data/philippineRegions';

/**
 * Validate an entire trip itinerary for location consistency
 * @param {object} tripData - The generated trip data from AI
 * @param {string} destination - The user's selected destination
 * @returns {object} Validation results with warnings and errors
 */
export function validateTripLocations(tripData, destination) {
  const results = {
    isValid: true,
    warnings: [],
    errors: [],
    suspiciousPlaces: [],
    stats: {
      totalPlaces: 0,
      validatedPlaces: 0,
      suspiciousPlaces: 0,
      unknownPlaces: 0
    }
  };

  if (!tripData || !destination) {
    results.errors.push("Missing trip data or destination");
    results.isValid = false;
    return results;
  }

  const regionData = getRegionData(destination);
  if (!regionData) {
    results.warnings.push(`No validation data available for "${destination}". Validation skipped.`);
    return results;
  }

  // Validate hotels
  if (tripData.hotels && Array.isArray(tripData.hotels)) {
    tripData.hotels.forEach((hotel, index) => {
      results.stats.totalPlaces++;
      const validation = validatePlaceLocation(hotel.hotelName, destination);
      
      if (!validation.valid && validation.confidence === "high") {
        results.errors.push({
          type: 'hotel',
          index,
          name: hotel.hotelName,
          reason: validation.reason,
          suggestion: `This hotel may not be in ${destination}`
        });
        results.suspiciousPlaces.push({
          placeName: hotel.hotelName,
          placeType: 'hotel',
          confidence: validation.confidence,
          reason: validation.reason
        });
        results.stats.suspiciousPlaces++;
      } else if (validation.confidence === "high") {
        results.stats.validatedPlaces++;
      } else {
        results.stats.unknownPlaces++;
      }
    });
  }

  // Validate itinerary places
  if (tripData.itinerary && Array.isArray(tripData.itinerary)) {
    tripData.itinerary.forEach((day, dayIndex) => {
      if (day.plan && Array.isArray(day.plan)) {
        day.plan.forEach((activity, activityIndex) => {
          results.stats.totalPlaces++;
          const validation = validatePlaceLocation(activity.placeName, destination);
          
          if (!validation.valid && validation.confidence === "high") {
            results.errors.push({
              type: 'itinerary',
              day: day.day,
              activity: activityIndex,
              name: activity.placeName,
              reason: validation.reason,
              suggestion: `This place may not be in ${destination}`
            });
            results.suspiciousPlaces.push({
              placeName: activity.placeName,
              placeType: 'itinerary',
              day: day.day,
              confidence: validation.confidence,
              reason: validation.reason
            });
            results.stats.suspiciousPlaces++;
          } else if (validation.confidence === "high") {
            results.stats.validatedPlaces++;
          } else {
            results.stats.unknownPlaces++;
          }
        });
      }
    });
  }

  // Validate places to visit
  if (tripData.placesToVisit && Array.isArray(tripData.placesToVisit)) {
    tripData.placesToVisit.forEach((place, index) => {
      results.stats.totalPlaces++;
      const validation = validatePlaceLocation(place.placeName, destination);
      
      if (!validation.valid && validation.confidence === "high") {
        results.errors.push({
          type: 'attraction',
          index,
          name: place.placeName,
          reason: validation.reason,
          suggestion: `This attraction may not be in ${destination}`
        });
        results.suspiciousPlaces.push({
          placeName: place.placeName,
          placeType: 'attraction',
          confidence: validation.confidence,
          reason: validation.reason
        });
        results.stats.suspiciousPlaces++;
      } else if (validation.confidence === "high") {
        results.stats.validatedPlaces++;
      } else {
        results.stats.unknownPlaces++;
      }
    });
  }

  // Add warnings if many places couldn't be validated
  if (results.stats.unknownPlaces > results.stats.totalPlaces * 0.5) {
    results.warnings.push(
      `${results.stats.unknownPlaces} out of ${results.stats.totalPlaces} places couldn't be confidently validated. ` +
      `This may indicate generic place names or places not in our database.`
    );
  }

  // Set overall validity
  if (results.errors.length > 0) {
    results.isValid = false;
  }

  return results;
}

/**
 * Check if a single place name is valid for the destination
 * @param {string} placeName - Name of the place to check
 * @param {string} destination - The destination to validate against
 * @returns {object} Validation result
 */
export function isValidPlaceForDestination(placeName, destination) {
  return validatePlaceLocation(placeName, destination);
}

/**
 * Get a human-readable validation summary
 * @param {object} validationResults - Results from validateTripLocations
 * @returns {string} Formatted summary
 */
export function getValidationSummary(validationResults) {
  if (!validationResults) return "No validation results available";

  const { stats, errors, warnings, isValid } = validationResults;
  
  let summary = `Location Validation Summary:\n`;
  summary += `✓ Total places checked: ${stats.totalPlaces}\n`;
  summary += `✓ Validated (high confidence): ${stats.validatedPlaces}\n`;
  summary += `⚠ Suspicious places: ${stats.suspiciousPlaces}\n`;
  summary += `? Unknown confidence: ${stats.unknownPlaces}\n\n`;

  if (isValid && errors.length === 0) {
    summary += `✅ All places appear to be in the correct destination!\n`;
  } else {
    summary += `❌ Found ${errors.length} location mismatch(es):\n`;
    errors.forEach((error, index) => {
      summary += `${index + 1}. ${error.name} - ${error.suggestion}\n`;
    });
  }

  if (warnings.length > 0) {
    summary += `\n⚠ Warnings:\n`;
    warnings.forEach((warning, index) => {
      summary += `${index + 1}. ${warning}\n`;
    });
  }

  return summary;
}

/**
 * Filter out suspicious places from trip data (optional cleanup)
 * @param {object} tripData - The trip data
 * @param {object} validationResults - Validation results
 * @returns {object} Cleaned trip data
 */
export function filterSuspiciousPlaces(tripData, validationResults) {
  if (!validationResults || validationResults.errors.length === 0) {
    return tripData; // No changes needed
  }

  const cleanedData = { ...tripData };
  const suspiciousNames = new Set(
    validationResults.errors.map(error => error.name.toLowerCase())
  );

  // Filter hotels
  if (cleanedData.hotels) {
    cleanedData.hotels = cleanedData.hotels.filter(
      hotel => !suspiciousNames.has(hotel.hotelName.toLowerCase())
    );
  }

  // Filter itinerary
  if (cleanedData.itinerary) {
    cleanedData.itinerary = cleanedData.itinerary.map(day => ({
      ...day,
      plan: day.plan ? day.plan.filter(
        activity => !suspiciousNames.has(activity.placeName.toLowerCase())
      ) : []
    }));
  }

  // Filter places to visit
  if (cleanedData.placesToVisit) {
    cleanedData.placesToVisit = cleanedData.placesToVisit.filter(
      place => !suspiciousNames.has(place.placeName.toLowerCase())
    );
  }

  return cleanedData;
}

export default {
  validateTripLocations,
  isValidPlaceForDestination,
  getValidationSummary,
  filterSuspiciousPlaces
};
