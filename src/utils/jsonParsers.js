/**
 * Robust JSON parsing utilities for TravelRover
 * Handles malformed JSON from AI responses and user data
 */

/**
 * Clean malformed JSON string - fixes common AI generation issues
 * @param {string} jsonStr - JSON string to clean
 * @returns {string} Cleaned JSON string
 */
function cleanJSON(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') return '{}';
  
  let cleaned = jsonStr.trim();
  
  // Remove control characters and non-printable chars
  cleaned = cleaned.replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
  
  // Fix trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing quotes around property names
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix single quotes to double quotes
  cleaned = cleaned.replace(/'/g, '"');
  
  // Remove trailing commas at the end of objects/arrays
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Ensure proper closing of incomplete objects/arrays
  let openBraces = (cleaned.match(/{/g) || []).length;
  let closeBraces = (cleaned.match(/}/g) || []).length;
  let openBrackets = (cleaned.match(/\[/g) || []).length;
  let closeBrackets = (cleaned.match(/]/g) || []).length;
  
  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    cleaned += '}';
  }
  
  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    cleaned += ']';
  }
  
  return cleaned;
}

/**
 * Aggressive JSON cleaning for severely malformed strings
 * @param {string} jsonStr - JSON string to clean aggressively
 * @returns {string} Heavily cleaned JSON string
 */
// Special function to fix planText JSON issues with pipes and quotes
function fixPlanTextJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  console.log('🔧 Attempting planText fix...');

  // Step 1: Fix planText fields that contain unescaped quotes and special chars
  let fixed = jsonString.replace(
    /"planText"\s*:\s*"([^"]*(?:[^\\]"[^"]*)*)"(?=\s*[,}])/g,
    (match, content) => {
      // Fix unescaped quotes within the planText content
      const escapedContent = content
        .replace(/\\"/g, '___TEMP_ESCAPED___') // Temporarily mark already escaped quotes
        .replace(/"/g, '\\"') // Escape all remaining quotes
        .replace(/___TEMP_ESCAPED___/g, '\\"'); // Restore escaped quotes
      
      return `"planText":"${escapedContent}"`;
    }
  );

  // Step 2: Wrap as array if multiple objects detected
  if (fixed.includes('}, {') && !fixed.trim().startsWith('[')) {
    fixed = `[${fixed}]`;
  }

  console.log('🔧 PlanText fix applied');
  return fixed;
}

function aggressiveJSONClean(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') return null;
  
  let cleaned = jsonStr.trim();
  
  // Handle standalone commas, ellipsis, or purely invalid content
  if (cleaned === "," || cleaned === ",..." || /^,+\s*$/.test(cleaned) || cleaned.length < 3) {
    console.log("🗑️ Detected invalid content - skipping:", cleaned);
    return null;
  }
  
  // Remove everything after last valid closing brace if there's garbage
  const lastValidBrace = Math.max(
    cleaned.lastIndexOf('}'),
    cleaned.lastIndexOf(']')
  );
  
  if (lastValidBrace > 0 && lastValidBrace < cleaned.length - 1) {
    const afterBrace = cleaned.substring(lastValidBrace + 1).trim();
    // If there's non-whitespace content after the last brace, it might be garbage
    if (afterBrace && !afterBrace.match(/^[,\s]*$/)) {
      cleaned = cleaned.substring(0, lastValidBrace + 1);
    }
  }
  
  // Check if we still have basic JSON structure
  if (!cleaned.includes("{") || !cleaned.includes("}")) {
    console.log("🗑️ No valid JSON structure found after initial cleaning");
    return null;
  }
  
  // Apply standard cleaning
  cleaned = cleanJSON(cleaned);
  
  // Final check - if cleaning resulted in empty or minimal content
  if (!cleaned || cleaned === '{}' || cleaned.length < 5) {
    return null;
  }
  
  return cleaned;
}

/**
 * Safely parse potentially malformed JSON data into arrays
 * @param {any} data - Data to parse (string, array, object, etc.)
 * @param {string} fieldName - Field name for error logging
 * @returns {Array} Parsed array or empty array on failure
 */
export const parseDataArray = (data, fieldName = "data") => {
  // Already an array - return as is
  if (Array.isArray(data)) {
    return data;
  }

  // Handle string data
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.warn(`Initial JSON parse failed for ${fieldName}:`, error.message);
      
      // Smart parsing for malformed JSON (common with AI responses)
      try {
        let cleanedData = data.trim();
        
        // Apply special planText fix for itinerary data
        if (fieldName === 'itinerary' && cleanedData.includes('planText')) {
          cleanedData = fixPlanTextJSON(cleanedData);
        } else {
          cleanedData = cleanJSON(cleanedData);
        }

        // Handle multiple objects concatenated without array brackets
        if ((cleanedData.startsWith("{") && !cleanedData.startsWith("[")) || 
            (cleanedData.startsWith("[") && cleanedData.includes('"planText"'))) {
          
          // For array-wrapped data that might still have issues, try direct parsing first
          if (cleanedData.startsWith("[")) {
            try {
              const directArrayParsed = JSON.parse(cleanedData);
              if (Array.isArray(directArrayParsed) && directArrayParsed.length > 0) {
                console.log(`✅ Successfully parsed ${directArrayParsed.length} objects from array`);
                return directArrayParsed;
              }
            } catch (directError) {
              console.log('Direct array parsing failed:', directError.message);
            }
          }
          
          // Strategy 1: Try simple array wrapping first (most efficient)
          if (cleanedData.includes("}, {")) {
            try {
              const arrayWrapped = cleanedData.startsWith("[") ? cleanedData : `[${cleanedData}]`;
              const arrayParsed = JSON.parse(arrayWrapped);
              if (Array.isArray(arrayParsed) && arrayParsed.length > 0) {
                console.log(`✅ Successfully parsed ${arrayParsed.length} objects using array wrapping`);
                return arrayParsed;
              }
            } catch (wrapError) {
              console.log(`Array wrapping failed, falling back to manual parsing`);
            }
          }

          // Strategy 2: Manual object boundary detection
          const parts = [];
          let currentObject = "";
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;

          for (let i = 0; i < cleanedData.length; i++) {
            const char = cleanedData[i];

            if (escapeNext) {
              currentObject += char;
              escapeNext = false;
              continue;
            }

            if (char === "\\") {
              escapeNext = true;
              currentObject += char;
              continue;
            }

            if (char === '"' && !escapeNext) {
              inString = !inString;
            }

            if (!inString) {
              if (char === "{") {
                braceCount++;
              } else if (char === "}") {
                braceCount--;
              }
            }

            currentObject += char;

            // Complete object found
            if (!inString && braceCount === 0 && currentObject.trim()) {
              // Skip comma-only parts
              const trimmedObject = currentObject.trim();
              if (trimmedObject !== "," && trimmedObject.length > 2) {
                parts.push(trimmedObject);
              }
              currentObject = "";
              
              // Skip commas and whitespace after object
              while (i + 1 < cleanedData.length && 
                     (cleanedData[i + 1] === "," || cleanedData[i + 1] === " " || cleanedData[i + 1] === "\n")) {
                i++;
              }
            }
          }

          // Add any remaining object
          const remainingObject = currentObject.trim();
          if (remainingObject && remainingObject !== "," && remainingObject.length > 2) {
            parts.push(remainingObject);
          }

          // Parse each object part with enhanced cleaning
          const parsedObjects = [];
          
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            try {
              const cleanPart = cleanJSON(part);
              const parsed = JSON.parse(cleanPart);
              if (parsed && typeof parsed === 'object') {
                parsedObjects.push(parsed);
              }
            } catch (firstError) {
              console.warn(`Failed to parse object part ${i + 1}: ${part.substring(0, 50)}...`);
              
              // Try aggressive cleaning
              try {
                const aggressivePart = aggressiveJSONClean(part);
                if (aggressivePart && aggressivePart !== '{}') {
                  const parsed = JSON.parse(aggressivePart);
                  if (parsed && typeof parsed === 'object') {
                    parsedObjects.push(parsed);
                    console.log(`✅ Recovered object ${i + 1} with aggressive cleaning`);
                  }
                }
              } catch (secondError) {
                console.error(`Complete parsing failure for object ${i + 1}:`, {
                  firstError: firstError.message,
                  secondError: secondError.message,
                  partPreview: part.substring(0, 100)
                });
              }
            }
          }

          if (parsedObjects.length > 0) {
            console.log(`✅ Successfully parsed ${parsedObjects.length}/${parts.length} objects`);
            return parsedObjects;
          }
        }

        // Try wrapping in array brackets with cleaning
        try {
          const fallbackParsed = JSON.parse(`[${cleanedData}]`);
          return Array.isArray(fallbackParsed) ? fallbackParsed : [fallbackParsed];
        } catch {
          // Last resort: aggressive cleaning
          const superCleaned = aggressiveJSONClean(data);
          if (superCleaned) {
            const finalParsed = JSON.parse(`[${superCleaned}]`);
            return Array.isArray(finalParsed) ? finalParsed : [finalParsed];
          }
        }
        
      } catch (fallbackError) {
        console.error(`All parsing methods failed for ${fieldName}:`, {
          originalError: error.message,
          fallbackError: fallbackError.message,
          dataPreview: data.substring(0, 100) + "..."
        });
        return [];
      }
    }
  }

  // Handle object data - convert to single-item array
  if (data && typeof data === "object") {
    return [data];
  }

  // Default fallback
  return [];
};

/**
 * Safely parse JSON with enhanced error handling and fallbacks
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @param {string} context - Context for error logging
 * @returns {any} Parsed data or fallback
 */
export const safeJsonParse = (jsonString, fallback = null, context = "unknown") => {
  if (!jsonString || typeof jsonString !== "string") {
    return fallback;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn(`JSON parse failed in ${context}:`, error.message);
    
    // Try standard cleaning
    try {
      const cleaned = cleanJSON(jsonString);
      return JSON.parse(cleaned);
    } catch (cleanError) {
      // Try aggressive cleaning
      try {
        const aggressiveCleaned = aggressiveJSONClean(jsonString);
        return JSON.parse(aggressiveCleaned);
      } catch (aggressiveError) {
        console.error(`All JSON parsing attempts failed in ${context}:`, {
          originalError: error.message,
          cleanError: cleanError.message,
          aggressiveError: aggressiveError.message,
          preview: jsonString.substring(0, 100) + "...",
          ending: jsonString.substring(Math.max(0, jsonString.length - 50))
        });
        return fallback;
      }
    }
  }
};

/**
 * Parse trip data with comprehensive error handling
 * @param {any} tripData - Trip data to parse
 * @returns {Object} Parsed trip data
 */
export const parseTripData = (tripData) => {
  if (!tripData) return {};
  
  if (typeof tripData === "string") {
    return safeJsonParse(tripData, {}, "tripData");
  }
  
  return tripData;
};

/**
 * Validate and format time strings for ISO 8601 conversion
 * @param {string} timeString - Time string to validate
 * @returns {string} ISO 8601 formatted time or empty string
 */
export const parseTimeString = (timeString) => {
  // Handle null, undefined, or empty string
  if (!timeString || typeof timeString !== 'string') {
    return "";
  }
  
  // Handle special cases like "All Day", "Varies", etc.
  const lowerTime = timeString.toLowerCase().trim();
  if (lowerTime.includes('all day') || 
      lowerTime.includes('varies') || 
      lowerTime.includes('flexible') ||
      !timeString.includes(':')) {
    return "";
  }

  try {
    // Expected format: "9:00 AM" or "14:30"
    const timeParts = timeString.trim().split(" ");
    if (timeParts.length < 1) return "";
    
    const time = timeParts[0];
    const period = timeParts[1] || "";
    
    // Ensure time has colon
    if (!time.includes(':')) return "";
    
    const [hoursStr, minutesStr] = time.split(":");
    let hours = parseInt(hoursStr, 10);
    let minutes = parseInt(minutesStr, 10);
    
    // Validate parsed numbers
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return "";
    }
    
    // Convert to 24-hour format if AM/PM is specified
    if (period) {
      const upperPeriod = period.toUpperCase();
      if (upperPeriod === "PM" && hours < 12) {
        hours += 12;
      } else if (upperPeriod === "AM" && hours === 12) {
        hours = 0;
      }
    }

    // Format with leading zeros
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}:00`;
  } catch (error) {
    console.warn("Error parsing time string:", timeString, error.message);
    return "";
  }
};

/**
 * Validate and normalize coordinate objects for Google Maps
 * @param {any} coords - Coordinate object to validate
 * @param {Object} fallback - Default coordinates if validation fails
 * @returns {Object} Valid coordinate object with numeric lat/lng
 */
export const validateCoordinates = (coords, fallback = { lat: 10.3157, lng: 123.8854 }) => {
  if (!coords || typeof coords !== 'object') {
    console.warn('validateCoordinates: Invalid coords object:', coords, '-> Using fallback:', fallback);
    return fallback;
  }

  let lat = coords.lat || coords.latitude;
  let lng = coords.lng || coords.longitude || coords.long;

  // Convert strings to numbers
  if (typeof lat === 'string') {
    lat = parseFloat(lat);
  }
  if (typeof lng === 'string') {
    lng = parseFloat(lng);
  }

  // Validate numeric values and ranges
  const isValidLat = typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
  const isValidLng = typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;

  if (isValidLat && isValidLng) {
    return { lat: Number(lat), lng: Number(lng) };
  }

  console.warn('validateCoordinates: Invalid lat/lng values:', { 
    originalCoords: coords, 
    parsedLat: lat, 
    parsedLng: lng, 
    isValidLat, 
    isValidLng 
  }, '-> Using fallback:', fallback);
  return fallback;
};

/**
 * Generate safe random coordinates around a center point
 * @param {Object} center - Center coordinates
 * @param {number} radius - Radius for randomization (in degrees)
 * @returns {Object} Random coordinates around center
 */
export const generateRandomCoordinates = (center = { lat: 10.3157, lng: 123.8854 }, radius = 0.1) => {
  const validCenter = validateCoordinates(center);
  
  return {
    lat: validCenter.lat + (Math.random() - 0.5) * radius,
    lng: validCenter.lng + (Math.random() - 0.5) * radius,
  };
};

/**
 * Enhanced coordinate enhancement with real Google Places API integration
 * @param {Object} activity - Activity data that may contain coordinates
 * @param {string} tripLocation - Trip destination for context
 * @returns {Promise<Object>} Enhanced coordinates with real data
 */
export const enhanceActivityCoordinates = async (activity, tripLocation) => {
  // Import Google Places service dynamically to avoid circular dependencies
  const { googlePlacesService } = await import('../services/GooglePlacesService');
  
  return await googlePlacesService.validateAndEnhanceCoordinates(activity, tripLocation);
};

/**
 * Detect if coordinates appear to be dummy/fake data
 * @param {Object} coords - Coordinate object to check
 * @returns {boolean} True if coordinates appear fake
 */
export const areCoordinatesFake = (coords) => {
  if (!coords) return true;
  
  const lat = parseFloat(coords.lat || coords.latitude || 0);
  const lng = parseFloat(coords.lng || coords.longitude || 0);
  
  // Default Philippines coordinates used as fallback
  const defaultLat = 10.3157;
  const defaultLng = 123.8854;
  
  // Check if very close to default coordinates (likely fake)
  const latDiff = Math.abs(lat - defaultLat);
  const lngDiff = Math.abs(lng - defaultLng);
  
  // If within 0.3 degrees of default, likely fake
  return latDiff < 0.3 && lngDiff < 0.3;
};

/**
 * Extract actual time from activity data where time might be in different fields
 * @param {Object} activity - Activity object with potential time data
 * @returns {string} Extracted time or "All Day"
 */
export const extractActivityTime = (activity) => {
  if (!activity) return "All Day";

  // Check if time field has actual time (not "All Day")
  if (activity.time && 
      activity.time !== "All Day" && 
      activity.time.includes(':')) {
    return activity.time;
  }

  // Check if placeName contains time (common pattern: "14:00")
  if (activity.placeName && typeof activity.placeName === 'string') {
    const timeMatch = activity.placeName.match(/^(\d{1,2}:\d{2}(?:\s?[AP]M)?)/i);
    if (timeMatch) {
      return timeMatch[1];
    }
  }

  // Check if placeDetails starts with time
  if (activity.placeDetails && typeof activity.placeDetails === 'string') {
    const timeMatch = activity.placeDetails.match(/^(\d{1,2}:\d{2}(?:\s?[AP]M)?)/i);
    if (timeMatch) {
      return timeMatch[1];
    }
  }

  // Default fallback
  return "All Day";
};

/**
 * Extract actual place name from activity data, removing time prefixes
 * @param {Object} activity - Activity object
 * @returns {string} Clean place name
 */
export const extractActivityPlaceName = (activity) => {
  if (!activity) return "Activity";

  let placeName = activity.placeName || activity.location || activity.activity || "Activity";

  // If placeName is just a time (like "14:00"), extract from placeDetails
  if (typeof placeName === 'string' && placeName.match(/^\d{1,2}:\d{2}$/)) {
    if (activity.placeDetails && typeof activity.placeDetails === 'string') {
      // Extract place name after time - format: "14:00 - Hotel Check-in - ..."
      const parts = activity.placeDetails.split(' - ');
      if (parts.length >= 2) {
        placeName = parts[1].trim();
      }
    }
  }

  // Remove time prefix if it exists at the start
  if (typeof placeName === 'string') {
    placeName = placeName.replace(/^\d{1,2}:\d{2}(?:\s?[AP]M)?\s*-?\s*/i, '').trim();
  }

  return placeName || "Activity";
};