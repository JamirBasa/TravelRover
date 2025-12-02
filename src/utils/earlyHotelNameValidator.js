/**
 * EARLY HOTEL NAME VALIDATION
 * Runs immediately after AI JSON parsing to catch hallucinated hotel names
 * 
 * This validator:
 * 1. Extracts all hotel name mentions from itinerary
 * 2. Checks if they match hotels in the hotels array
 * 3. Replaces mismatched names with the PRIMARY hotel
 * 4. Runs BEFORE autoFix, location validation, etc.
 * 
 * Why Early Validation?
 * - AI sometimes hallucinates hotel names despite correct prompt
 * - Catching wrong names early prevents cascade failures
 * - Later validators (hotelItineraryValidator) assume hotel name is correct
 */

/**
 * Extract hotel name from common hotel-related activity patterns
 * ENHANCED: Catches more variations to prevent partial fixes
 * @param {string} text - Activity text (placeName or placeDetails)
 * @returns {string|null} - Extracted hotel name or null
 */
function extractHotelNameFromActivity(text) {
  if (!text) return null;
  
  const patterns = [
    // Check-in patterns (HIGHEST PRIORITY)
    /check-in\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /check\s+in\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /check-in\s+to\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /check\s+in\s+to\s+(.+?)(?:\s*\(|\s*-|$)/i,
    
    // Meals at hotel
    /breakfast\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /dinner\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /lunch\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    
    // Return to hotel
    /return\s+to\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /back\s+to\s+(.+?)(?:\s*\(|\s*-|$)/i,
    
    // Rest at hotel
    /rest\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /relax\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    
    // Stay patterns
    /stay\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /staying\s+at\s+(.+?)(?:\s*\(|\s*-|$)/i,
    
    // Visit patterns
    /visit\s+(.+?)\s+(?:hotel|inn|resort|lodge)/i,
    
    // "at the [Hotel]" pattern
    /at\s+the\s+(.+?)(?:\s*\(|\s*-|$)/i,
    
    // Standalone hotel names with business suffix (captures full name)
    /\b([A-Z][a-zA-Z\s&'-]+?)\s+(?:Hotel|Inn|Resort|Lodge|Guesthouse|Guest House|Homestay|View|Hostel)(?:\s|$)/,
    
    // ✅ NEW: Aggressive pattern for check-in with ANY capitalized words (catches "Banaue Grand View Hotel")
    /check-in\s+at\s+([A-Z][a-zA-Z\s&'-]+?)(?:\s*\(|\s*-|$)/,
    /check\s+in\s+at\s+([A-Z][a-zA-Z\s&'-]+?)(?:\s*\(|\s*-|$)/,
    
    // Check-out patterns
    /check-out\s+from\s+(.+?)(?:\s*\(|\s*-|$)/i,
    /checkout\s+from\s+(.+?)(?:\s*\(|\s*-|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Normalize hotel name for fuzzy matching
 * ENHANCED: Matches AccommodationVerification.js normalization logic
 * 
 * Handles:
 * - Plural/Singular (greenfields → greenfield)
 * - Business suffixes (inn, hotel, resort, restaurant)
 * - And/& variations
 * - Case and punctuation
 * 
 * @param {string} name - Hotel name
 * @returns {string} - Normalized name
 */
function normalizeHotelName(name) {
  if (!name) return '';
  
  let normalized = name
    .toLowerCase()
    .trim();
  
  // ✅ First handle multi-word business types (before removing 'and')
  // Convert both "bed and breakfast" and "bed & breakfast" to standard form
  normalized = normalized
    .replace(/\bbed\s+and\s+breakfast\b/gi, 'bnb')
    .replace(/\bbed\s*&\s*breakfast\b/gi, 'bnb')
    .replace(/\bb\s*&\s*b\b/gi, 'bnb');
  
  // ✅ Remove common business type suffixes
  const businessSuffixes = [
    '\\bhotel\\b', '\\binn\\b', '\\bresort\\b', '\\blodge\\b',
    '\\bguesthouse\\b', '\\bguest house\\b', '\\bhostel\\b', '\\bmotel\\b',
    '\\brestaurant\\b', '\\bresto\\b', '\\bcafe\\b', '\\bbar\\b',
    '\\bsuites\\b', '\\bsuite\\b', '\\bapartment\\b', '\\bapt\\b',
    '\\bcondo\\b', '\\bcondominium\\b', '\\bvilla\\b', '\\bvillas\\b',
    '\\bvillage\\b', '\\bbnb\\b'
  ];
  
  for (const suffix of businessSuffixes) {
    normalized = normalized.replace(new RegExp(suffix, 'gi'), '');
  }
  
  // ✅ Normalize "and" vs "&"
  normalized = normalized
    .replace(/\s+and\s+/gi, ' ')  // Remove "and"
    .replace(/\s*&\s*/g, ' ');     // Remove "&"
  
  // ✅ Remove "the" prefix
  normalized = normalized.replace(/^the\s+/i, '');
  
  // ✅ Handle plural forms (greenfields → greenfield)
  normalized = normalized.replace(/s\b/g, '');
  
  // ✅ Remove punctuation and special characters
  normalized = normalized.replace(/[^\w\s]/g, '');
  
  // ✅ Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Calculate similarity score between two strings (Levenshtein-like)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Count matching characters
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  
  return matches / longer.length;
}

/**
 * Check if extracted hotel name matches any hotel in the hotels array
 * ENHANCED: Better fuzzy matching with location awareness
 * @param {string} extractedName - Name extracted from itinerary
 * @param {Array} hotels - Hotels array
 * @returns {Object|null} - Matching hotel object or null
 */
function findMatchingHotel(extractedName, hotels) {
  if (!extractedName || !hotels || hotels.length === 0) return null;
  
  const normalizedExtracted = normalizeHotelName(extractedName);
  const extractedLower = extractedName.toLowerCase();
  
  console.log(`🔍 Matching "${extractedName}" (normalized: "${normalizedExtracted}")`);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const hotel of hotels) {
    const hotelName = hotel.name || hotel.hotelName || hotel.hotel_name || '';
    const normalizedHotel = normalizeHotelName(hotelName);
    const hotelLower = hotelName.toLowerCase();
    
    // 1. EXACT MATCH (score: 1.0)
    if (normalizedHotel === normalizedExtracted) {
      console.log(`   ✅ Exact match: "${hotelName}"`);
      return hotel;
    }
    
    // 2. FULL SUBSTRING MATCH (score: 0.9)
    if (normalizedExtracted.includes(normalizedHotel) || normalizedHotel.includes(normalizedExtracted)) {
      console.log(`   ✅ Substring match: "${hotelName}"`);
      return hotel;
    }
    
    // 3. LOCATION-BASED MATCHING (e.g., both have "Banaue" in name)
    const extractedWords = normalizedExtracted.split(/\s+/).filter(w => w.length > 3);
    const hotelWords = normalizedHotel.split(/\s+/).filter(w => w.length > 3);
    const commonWords = extractedWords.filter(word => hotelWords.includes(word));
    
    if (commonWords.length > 0) {
      const locationScore = commonWords.length / Math.max(extractedWords.length, hotelWords.length);
      if (locationScore > bestScore) {
        bestScore = locationScore;
        bestMatch = hotel;
        console.log(`   🎯 Location match (${(locationScore * 100).toFixed(0)}%): "${hotelName}" (common: ${commonWords.join(', ')})`);
      }
    }
    
    // 4. SIMILARITY SCORING (relaxed threshold: 0.4)
    const similarity = calculateSimilarity(normalizedExtracted, normalizedHotel);
    if (similarity > 0.4 && similarity > bestScore) {
      bestScore = similarity;
      bestMatch = hotel;
      console.log(`   🔍 Similarity match (${(similarity * 100).toFixed(0)}%): "${hotelName}"`);
    }
  }
  
  if (bestMatch && bestScore > 0.3) {
    console.log(`   ⚠️ Best fuzzy match (score: ${(bestScore * 100).toFixed(0)}%): "${bestMatch.name || bestMatch.hotelName || bestMatch.hotel_name}"`);
    console.log(`   ⚠️ This is likely NOT the same hotel - will replace with primary hotel`);
    // Return null to trigger replacement - fuzzy match not confident enough
    return null;
  }
  
  console.log(`   ❌ No match found for "${extractedName}"`);
  return null;
}

/**
 * Replace hotel name in activity text
 * @param {string} text - Original text
 * @param {string} oldName - Name to replace
 * @param {string} newName - Replacement name
 * @returns {string} - Updated text
 */
function replaceHotelNameInText(text, oldName, newName) {
  if (!text || !oldName || !newName) return text;
  
  // Create regex that matches the hotel name with word boundaries
  const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedOldName, 'gi');
  
  return text.replace(regex, newName);
}

/**
 * Validate and fix hotel names in itinerary (EARLY VALIDATION)
 * This runs RIGHT AFTER JSON.parse() to catch AI hallucinations early
 * 
 * @param {Object} tripData - Parsed trip data
 * @returns {Object} - Validation result with fixes
 */
export function validateAndFixHotelNames(tripData) {
  const result = {
    isValid: true,
    fixes: [],
    fixedData: null,
    totalMismatches: 0,
  };
  
  try {
    // Get hotels array and PRIMARY hotel
    const hotels = tripData?.hotels || [];
    const itinerary = tripData?.itinerary || [];
    
    if (hotels.length === 0) {
      console.log('🏨 No hotels in trip data - skipping early hotel name validation');
      return result;
    }
    
    const primaryHotel = hotels[0];
    const primaryHotelName = primaryHotel?.name || primaryHotel?.hotelName || primaryHotel?.hotel_name;
    
    if (!primaryHotelName) {
      console.warn('⚠️ PRIMARY hotel has no name - cannot validate hotel references');
      return result;
    }
    
    console.log(`🏨 Early hotel validation: PRIMARY hotel is "${primaryHotelName}"`);
    console.log(`🏨 Checking against ${hotels.length} hotel(s) in recommendations`);
    console.log(`🏨 Hotels available:`, hotels.map(h => h.name || h.hotelName || h.hotel_name));
    
    // Create a deep copy for modifications
    const correctedItinerary = JSON.parse(JSON.stringify(itinerary));
    let hasChanges = false;
    
    // ✅ AGGRESSIVE FIX: Ensure Day 1 check-in always uses primary hotel
    if (itinerary.length > 0 && itinerary[0].plan && Array.isArray(itinerary[0].plan)) {
      const day1Plan = itinerary[0].plan;
      const checkInActivity = day1Plan.find((activity, idx) => {
        const placeName = (activity?.placeName || '').toLowerCase();
        const isCheckIn = placeName.includes('check') && (placeName.includes('in') || placeName.includes('into'));
        if (isCheckIn) {
          console.log(`🏨 Found Day 1 check-in activity (index ${idx}): "${activity.placeName}"`);
        }
        return isCheckIn;
      });
      
      if (checkInActivity) {
        const activityIndex = day1Plan.indexOf(checkInActivity);
        const currentName = checkInActivity.placeName;
        
        // Check if it contains the primary hotel name
        const normalizedCurrent = normalizeHotelName(currentName);
        const normalizedPrimary = normalizeHotelName(primaryHotelName);
        
        if (!normalizedCurrent.includes(normalizedPrimary) && !normalizedPrimary.includes(normalizedCurrent)) {
          console.warn(`🚨 Day 1 check-in hotel mismatch detected!`);
          console.warn(`   Current: "${currentName}"`);
          console.warn(`   Expected: "${primaryHotelName}"`);
          console.warn(`   Force-replacing to ensure consistency...`);
          
          // Extract time if present
          const timeMatch = currentName.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
          const timePrefix = timeMatch ? `${timeMatch[1]} - ` : '';
          
          const fixedName = `${timePrefix}Check-in at ${primaryHotelName}`;
          correctedItinerary[0].plan[activityIndex].placeName = fixedName;
          
          result.isValid = false;
          hasChanges = true;
          result.totalMismatches++;
          
          result.fixes.push({
            day: 1,
            activity: activityIndex + 1,
            type: 'DAY1_CHECKIN_FORCED_FIX',
            wrongName: currentName,
            correctName: primaryHotelName,
            originalPlaceName: currentName,
            fixedPlaceName: fixedName,
          });
        } else {
          console.log(`✅ Day 1 check-in correctly uses primary hotel: "${primaryHotelName}"`);
        }
      }
    }
    
    // Scan all days and activities
    itinerary.forEach((day, dayIndex) => {
      if (!day.plan || !Array.isArray(day.plan)) return;
      
      day.plan.forEach((activity, actIndex) => {
        const placeName = activity?.placeName || '';
        const placeDetails = activity?.placeDetails || '';
        
        // PRIMARY SCAN: Extract hotel name using patterns
        const extractedName = extractHotelNameFromActivity(placeName);
        
        if (extractedName) {
          // Check if this hotel name matches any hotel in the array
          const matchingHotel = findMatchingHotel(extractedName, hotels);
          
          if (!matchingHotel) {
            // ❌ MISMATCH: Extracted name doesn't match any hotel in recommendations
            console.warn(`⚠️ Day ${dayIndex + 1}, Activity ${actIndex + 1}: Found wrong hotel name "${extractedName}"`);
            console.warn(`   Original text: "${placeName}"`);
            console.warn(`   Expected one of: ${hotels.map(h => h.name || h.hotelName || h.hotel_name).join(', ')}`);
            console.warn(`   Normalized extracted: "${normalizeHotelName(extractedName)}"`);
            console.warn(`   Normalized primary: "${normalizeHotelName(primaryHotelName)}"`);
            console.warn(`   Replacing with PRIMARY hotel: "${primaryHotelName}"`);
            
            result.isValid = false;
            hasChanges = true;
            result.totalMismatches++;
            
            // Fix placeName
            const fixedPlaceName = replaceHotelNameInText(placeName, extractedName, primaryHotelName);
            correctedItinerary[dayIndex].plan[actIndex].placeName = fixedPlaceName;
            console.log(`   ✅ Fixed: "${fixedPlaceName}"`);
            
            // Fix placeDetails if it also contains the wrong name
            if (placeDetails && placeDetails.toLowerCase().includes(extractedName.toLowerCase())) {
              const fixedPlaceDetails = replaceHotelNameInText(placeDetails, extractedName, primaryHotelName);
              correctedItinerary[dayIndex].plan[actIndex].placeDetails = fixedPlaceDetails;
            }
            
            result.fixes.push({
              day: dayIndex + 1,
              activity: actIndex + 1,
              type: 'HOTEL_NAME_MISMATCH',
              wrongName: extractedName,
              correctName: primaryHotelName,
              originalPlaceName: placeName,
              fixedPlaceName: fixedPlaceName,
            });
          } else {
            // ✅ Valid hotel name found
            console.log(`✅ Day ${dayIndex + 1}, Activity ${actIndex + 1}: Hotel name "${extractedName}" is valid`);
          }
        }
        
        // SECONDARY SCAN: Check for ANY hotel reference keywords that weren't caught
        const hotelKeywords = ['hotel', 'inn', 'resort', 'lodge', 'guesthouse', 'guest house', 'hostel', 'bnb', 'bed and breakfast', 'motel', 'villa', 'suite'];
        const textToCheck = `${placeName} ${placeDetails}`.toLowerCase();
        
        const hasHotelKeyword = hotelKeywords.some(keyword => textToCheck.includes(keyword));
        
        if (hasHotelKeyword && !extractedName) {
          // Found hotel keyword but pattern didn't extract it - possible new format
          console.warn(`🔍 Day ${dayIndex + 1}, Activity ${actIndex + 1}: Found hotel keyword but no pattern match`);
          console.warn(`   Text: "${placeName}"`);
          console.warn(`   This might be a new hotel mention format - checking for mismatches...`);
          
          // Check if this text contains any hotel name from recommendations
          const containsValidHotel = hotels.some(hotel => {
            const hotelName = hotel.name || hotel.hotelName || hotel.hotel_name || '';
            const normalized = normalizeHotelName(hotelName);
            return textToCheck.includes(normalized.toLowerCase());
          });
          
          if (!containsValidHotel) {
            // Contains hotel keyword but NOT any valid hotel name - likely hallucination
            console.warn(`   ⚠️ SECONDARY SCAN CAUGHT: Hotel keyword found but no valid hotel name!`);
            console.warn(`   Replacing entire text with: "Activity at ${primaryHotelName}"`);
            
            result.isValid = false;
            hasChanges = true;
            result.totalMismatches++;
            
            // Conservative fix: Replace with generic activity at correct hotel
            correctedItinerary[dayIndex].plan[actIndex].placeName = `Activity at ${primaryHotelName}`;
            
            result.fixes.push({
              day: dayIndex + 1,
              activity: actIndex + 1,
              type: 'HOTEL_KEYWORD_MISMATCH',
              wrongName: 'Unknown hotel reference',
              correctName: primaryHotelName,
              originalPlaceName: placeName,
              fixedPlaceName: `Activity at ${primaryHotelName}`,
            });
          }
        }
      });
    });
    
    if (hasChanges) {
      result.fixedData = {
        ...tripData,
        itinerary: correctedItinerary,
      };
      console.log(`🔧 Early validation: Fixed ${result.totalMismatches} hotel name mismatch(es)`);
    } else {
      console.log('✅ Early validation: All hotel names are correct!');
    }
    
  } catch (error) {
    console.error('❌ Early hotel name validation failed:', error);
    result.error = error.message;
  }
  
  return result;
}

/**
 * Get human-readable summary of validation results
 * @param {Object} validationResult - Result from validateAndFixHotelNames
 * @returns {string} - Summary text
 */
export function getValidationSummary(validationResult) {
  if (validationResult.isValid) {
    return '✅ All hotel names in itinerary match the recommended hotels';
  }
  
  const fixes = validationResult.fixes || [];
  const summary = [`⚠️ Found ${validationResult.totalMismatches} hotel name mismatch(es):`];
  
  fixes.forEach(fix => {
    summary.push(`  Day ${fix.day}, Activity ${fix.activity}: "${fix.wrongName}" → "${fix.correctName}"`);
  });
  
  return summary.join('\n');
}

/**
 * Report validation results to console
 * @param {Object} validationResult - Result from validateAndFixHotelNames
 */
export function reportEarlyValidation(validationResult) {
  if (validationResult.isValid) {
    console.log('✅ EARLY HOTEL VALIDATION: All hotel names are correct');
    return;
  }
  
  console.log('🔧 EARLY HOTEL VALIDATION: Auto-fixed hotel name mismatches');
  console.log(getValidationSummary(validationResult));
}
