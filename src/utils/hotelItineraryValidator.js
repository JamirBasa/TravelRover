/**
 * Hotel-Itinerary Consistency Validator with Auto-Fix
 * Ensures ALL hotel references in the itinerary use specific hotel names (not generic references)
 */

import { extractRecommendedHotelName } from "./hotelNameResolver";

/**
 * Generic hotel reference patterns to detect
 */
const GENERIC_HOTEL_PATTERNS = [
  /\bhotel check-in\b/gi,
  /\bcheck-in at hotel\b/gi,
  /\bhotel check in\b/gi,
  /\bcheck in at hotel\b/gi,
  /\breturn to hotel\b/gi,
  /\bback to hotel\b/gi,
  /\bhotel breakfast\b/gi,
  /\bbreakfast at hotel\b/gi,
  /\blunch at hotel\b/gi,
  /\bdinner at hotel\b/gi,
  /\bhotel lunch\b/gi,
  /\bhotel dinner\b/gi,
  /\bhotel pool\b/gi,
  /\bhotel amenities\b/gi,
  /\bhotel facilities\b/gi,
  /\brelax at hotel\b/gi,
  /\brest at hotel\b/gi,
  /\bhotel rest\b/gi,
  /\bhotel relaxation\b/gi,
  /\bhotel check-out\b/gi,
  /\bcheck-out from hotel\b/gi,
  /\bcheck out from hotel\b/gi,
  /\bhotel checkout\b/gi,
];

/**
 * Replace generic hotel references with specific hotel name
 * @param {string} text - Text to fix
 * @param {string} hotelName - Specific hotel name to use
 * @returns {string} - Fixed text
 */
function replaceGenericReferences(text, hotelName) {
  if (!text || typeof text !== "string" || !hotelName) return text;

  let fixed = text;

  // Replace patterns with specific hotel name
  fixed = fixed.replace(/\bhotel check-in\b/gi, `Check-in at ${hotelName}`);
  fixed = fixed.replace(/\bcheck-in at hotel\b/gi, `Check-in at ${hotelName}`);
  fixed = fixed.replace(/\bhotel check in\b/gi, `Check-in at ${hotelName}`);
  fixed = fixed.replace(/\bcheck in at hotel\b/gi, `Check-in at ${hotelName}`);
  
  fixed = fixed.replace(/\breturn to hotel\b/gi, `Return to ${hotelName}`);
  fixed = fixed.replace(/\bback to hotel\b/gi, `Back to ${hotelName}`);
  
  fixed = fixed.replace(/\bhotel breakfast\b/gi, `Breakfast at ${hotelName}`);
  fixed = fixed.replace(/\bbreakfast at hotel\b/gi, `Breakfast at ${hotelName}`);
  fixed = fixed.replace(/\blunch at hotel\b/gi, `Lunch at ${hotelName}`);
  fixed = fixed.replace(/\bdinner at hotel\b/gi, `Dinner at ${hotelName}`);
  fixed = fixed.replace(/\bhotel lunch\b/gi, `Lunch at ${hotelName}`);
  fixed = fixed.replace(/\bhotel dinner\b/gi, `Dinner at ${hotelName}`);
  
  fixed = fixed.replace(/\bhotel pool\b/gi, `${hotelName} pool`);
  fixed = fixed.replace(/\bhotel amenities\b/gi, `${hotelName} amenities`);
  fixed = fixed.replace(/\bhotel facilities\b/gi, `${hotelName} facilities`);
  
  fixed = fixed.replace(/\brelax at hotel\b/gi, `Relax at ${hotelName}`);
  fixed = fixed.replace(/\brest at hotel\b/gi, `Rest at ${hotelName}`);
  fixed = fixed.replace(/\bhotel rest\b/gi, `Rest at ${hotelName}`);
  fixed = fixed.replace(/\bhotel relaxation\b/gi, `Relaxation at ${hotelName}`);
  
  fixed = fixed.replace(/\bhotel check-out\b/gi, `Check-out from ${hotelName}`);
  fixed = fixed.replace(/\bcheck-out from hotel\b/gi, `Check-out from ${hotelName}`);
  fixed = fixed.replace(/\bcheck out from hotel\b/gi, `Check-out from ${hotelName}`);
  fixed = fixed.replace(/\bhotel checkout\b/gi, `Check-out from ${hotelName}`);

  return fixed;
}

/**
 * Detect generic hotel references in a text string
 * @param {string} text - Text to analyze
 * @returns {Array<Object>} - Array of detected issues
 */
function detectGenericReferences(text) {
  if (!text || typeof text !== "string") return [];

  const issues = [];
  GENERIC_HOTEL_PATTERNS.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      issues.push({
        pattern: pattern.source,
        matched: match[0],
        position: match.index,
      });
    }
  });

  return issues;
}

/**
 * Validates that Day 1 check-in hotel matches the first hotel in recommendations
 * Enhanced to validate ALL hotel references across all days
 * ✅ NEW: Also validates that hotel names in itinerary match hotels in the hotels array
 * @param {Object} tripData - The complete trip data object
 * @returns {Object} Validation result with auto-fixes
 */
export function validateHotelItineraryConsistency(tripData) {
  const result = {
    isValid: true,
    issues: [],
    fixes: [],
    correctedData: null,
    totalIssues: 0,
    issuesByDay: [],
  };

  try {
    // Extract recommended hotel name
    const hotelName = extractRecommendedHotelName(tripData);
    
    if (!hotelName) {
      result.issues.push('No hotels found in trip data');
      return result;
    }

    // ✅ NEW: Extract all valid hotel names from hotels array
    const validHotelNames = (tripData?.hotels || []).map(h => h.name?.toLowerCase().trim()).filter(Boolean);
    console.log('🏨 Valid hotel names:', validHotelNames);

    // Extract itinerary
    const itinerary = tripData?.itinerary || [];
    if (!itinerary || itinerary.length === 0) {
      result.issues.push('No itinerary found');
      return result;
    }

    // Validate each day
    const correctedItinerary = JSON.parse(JSON.stringify(itinerary));
    let hasChanges = false;

    itinerary.forEach((day, dayIndex) => {
      if (!day.plan || !Array.isArray(day.plan)) return;

      const dayIssues = [];

      day.plan.forEach((activity, actIndex) => {
        const placeName = activity?.placeName || '';
        const placeDetails = activity?.placeDetails || '';

        // Check placeName for generic references
        const placeNameIssues = detectGenericReferences(placeName);
        const placeDetailsIssues = detectGenericReferences(placeDetails);

        // ✅ NEW: Check if placeName contains hotel check-in but uses wrong hotel name
        const isCheckIn = /check-in\s+at\s+(.+?)(?:\s|$)/i.test(placeName);
        let hasWrongHotelName = false;
        
        if (isCheckIn && dayIndex === 0) { // Day 1 check-in
          const match = placeName.match(/check-in\s+at\s+(.+?)(?:\s*\(|$)/i);
          if (match) {
            const itineraryHotelName = match[1].trim().toLowerCase();
            // Check if this hotel name is in the valid hotels list
            const isValidHotel = validHotelNames.some(validName => 
              validName === itineraryHotelName || 
              itineraryHotelName.includes(validName) ||
              validName.includes(itineraryHotelName)
            );
            
            if (!isValidHotel) {
              hasWrongHotelName = true;
              console.warn(`⚠️ Day ${dayIndex + 1}: Found wrong hotel name "${match[1]}" (expected "${hotelName}")`);
            }
          }
        }

        if (placeNameIssues.length > 0 || placeDetailsIssues.length > 0 || hasWrongHotelName) {
          result.isValid = false;
          hasChanges = true;

          const originalPlaceName = placeName;
          const originalPlaceDetails = placeDetails;

          // Auto-fix
          let fixedPlaceName = replaceGenericReferences(placeName, hotelName);
          
          // ✅ NEW: Fix wrong hotel name in check-in activity
          if (hasWrongHotelName) {
            fixedPlaceName = fixedPlaceName.replace(/check-in\s+at\s+.+?(?=\s*\(|$)/i, `Check-in at ${hotelName}`);
          }
          
          correctedItinerary[dayIndex].plan[actIndex].placeName = fixedPlaceName;
          correctedItinerary[dayIndex].plan[actIndex].placeDetails = 
            replaceGenericReferences(placeDetails, hotelName);

          const issue = {
            activityIndex: actIndex,
            originalPlaceName,
            correctedPlaceName: correctedItinerary[dayIndex].plan[actIndex].placeName,
            originalPlaceDetails,
            correctedPlaceDetails: correctedItinerary[dayIndex].plan[actIndex].placeDetails,
            wrongHotelName: hasWrongHotelName,
          };

          dayIssues.push(issue);
          result.totalIssues++;

          const fixType = hasWrongHotelName ? 'FIX_WRONG_HOTEL_NAME' : 'FIX_GENERIC_HOTEL_REFERENCE';
          result.fixes.push({
            type: fixType,
            day: dayIndex + 1,
            activity: actIndex + 1,
            message: `Updated "${originalPlaceName}" to "${correctedItinerary[dayIndex].plan[actIndex].placeName}"`,
            oldValue: originalPlaceName,
            newValue: correctedItinerary[dayIndex].plan[actIndex].placeName,
          });
        }
      });

      if (dayIssues.length > 0) {
        result.issuesByDay.push({
          day: dayIndex + 1,
          dayTitle: day.day || `Day ${dayIndex + 1}`,
          issueCount: dayIssues.length,
          issues: dayIssues,
        });
      }
    });

    if (hasChanges) {
      result.correctedData = {
        ...tripData,
        itinerary: correctedItinerary,
      };
    }

    return result;

  } catch (error) {
    result.isValid = false;
    result.issues.push(`Validation error: ${error.message}`);
    return result;
  }
}

/**
 * Auto-fix hotel-itinerary inconsistencies
 * @param {Object} tripData - The trip data to fix
 * @returns {Object} Fixed trip data with details
 */
export function autoFixHotelItineraryConsistency(tripData) {
  const validation = validateHotelItineraryConsistency(tripData);
  
  if (!validation.isValid && validation.correctedData) {
    console.log(`🔧 Auto-fixing ${validation.totalIssues} hotel-itinerary consistency issue(s) across ${validation.issuesByDay.length} day(s)`);
    validation.fixes.forEach(fix => {
      console.log(`  ✓ Day ${fix.day}, Activity ${fix.activity}: ${fix.message}`);
    });
    
    return {
      fixed: true,
      totalIssues: validation.totalIssues,
      issues: validation.issues,
      issuesByDay: validation.issuesByDay,
      fixes: validation.fixes,
      data: validation.correctedData
    };
  }

  return {
    fixed: false,
    totalIssues: 0,
    issues: validation.issues,
    data: tripData
  };
}

/**
 * Quick check: Returns boolean only (no auto-fix)
 * @param {Object} tripData - Trip data to validate
 * @returns {boolean} - True if valid
 */
export function isHotelItineraryValid(tripData) {
  const validation = validateHotelItineraryConsistency(tripData);
  return validation.isValid;
}

/**
 * Auto-fix and return corrected data only
 * @param {Object} tripData - Trip data to fix
 * @returns {Object} - Corrected trip data
 */
export function autoFixHotelReferences(tripData) {
  const result = autoFixHotelItineraryConsistency(tripData);
  return result.data;
}

/**
 * Report validation results to console
 * @param {Object} validation - Validation result from validateHotelItineraryConsistency
 */
export function reportHotelItineraryValidation(validation) {
  if (validation.isValid) {
    console.log('✅ Hotel-itinerary consistency check passed - all hotel references are specific');
    return;
  }

  console.warn(`⚠️ Hotel-itinerary consistency issues found: ${validation.totalIssues} generic reference(s) across ${validation.issuesByDay.length} day(s)`);
  
  validation.issuesByDay.forEach(dayInfo => {
    console.warn(`  Day ${dayInfo.day}: ${dayInfo.issueCount} issue(s)`);
    dayInfo.issues.forEach(issue => {
      console.warn(`    - Activity ${issue.activityIndex + 1}: "${issue.originalPlaceName}" → "${issue.correctedPlaceName}"`);
    });
  });

  if (validation.fixes.length > 0) {
    console.log(`🔧 ${validation.fixes.length} auto-fix(es) available - use autoFixHotelItineraryConsistency() to apply`);
  }
}

export default {
  validateHotelItineraryConsistency,
  autoFixHotelItineraryConsistency,
  isHotelItineraryValid,
  autoFixHotelReferences,
  reportHotelItineraryValidation,
};

