// src/services/AccommodationVerification.js

import hotelsData from '../data/accommodations.json';
import { GetPlaceDetails } from '../config/GlobalApi';

// Create in-memory Map for instant lookups
const localHotelMap = new Map(
  hotelsData.map(hotel => [hotel.hotel_id.toString(), hotel])
);

// Build secondary index for name-based searches
const hotelNameIndex = new Map();
hotelsData.forEach(hotel => {
  const normalizedName = normalizeString(hotel.hotel_name);
  if (!hotelNameIndex.has(normalizedName)) {
    hotelNameIndex.set(normalizedName, []);
  }
  hotelNameIndex.get(normalizedName).push(hotel);
});

// ========================================
// FETCH REAL HOTEL DATA FROM GOOGLE PLACES
// ========================================

/**
 * Enriches hotel data with real amenities, reviews, and ratings from Google Places API
 * @param {string} hotelName - Name of the hotel
 * @param {string} location - Optional location context (e.g., "Manila, Philippines")
 * @returns {Promise<Object>} - Enriched hotel data
 */
async function fetchRealHotelData(hotelName, location = "Philippines") {
  try {
    // console.log(`🔍 Fetching real data for: ${hotelName}`);
    
    // Create search query with location context
    let searchQuery = hotelName;
    if (!searchQuery.toLowerCase().includes('philippines') && location) {
      searchQuery += `, ${location}`;
    }

    const response = await GetPlaceDetails({ textQuery: searchQuery });
    
    if (!response?.data?.places || response.data.places.length === 0) {
      // console.warn(`⚠️ No Google Places data found for: ${hotelName}`);
      return null;
    }

    const placeData = response.data.places[0];
    
    // Extract amenities from various sources
    const amenities = extractAmenities(placeData);
    
    // Extract reviews data
    const reviewsData = extractReviewsData(placeData);
    
    // console.log(`✅ Fetched real data for ${hotelName}:`, {
    //   amenities: amenities.length,
    //   rating: reviewsData.rating,
    //   reviews_count: reviewsData.reviews_count
    // });
    
    return {
      amenities,
      rating: reviewsData.rating,
      user_ratings_total: reviewsData.reviews_count,
      reviews_count: reviewsData.reviews_count,
      google_place_id: placeData.id,
      address: placeData.formattedAddress || placeData.shortFormattedAddress,
      photos: placeData.photos?.slice(0, 5) || [],
      editorialSummary: placeData.editorialSummary?.text,
      priceLevel: placeData.priceLevel,
      websiteUri: placeData.websiteUri,
      phoneNumber: placeData.nationalPhoneNumber || placeData.internationalPhoneNumber,
    };
  } catch (error) {
    // console.error(`❌ Error fetching Google Places data for ${hotelName}:`, error.message);
    return null;
  }
}

/**
 * Extract amenities from Google Places data
 */
function extractAmenities(placeData) {
  const amenities = new Set();
  
  // From types (accommodation features)
  const typeAmenityMap = {
    'lodging': 'Accommodation',
    'restaurant': 'Restaurant',
    'bar': 'Bar',
    'parking': 'Parking',
    'gym': 'Fitness Center',
    'spa': 'Spa',
    'swimming_pool': 'Swimming Pool',
    'wifi': 'WiFi',
  };
  
  if (placeData.types) {
    placeData.types.forEach(type => {
      if (typeAmenityMap[type]) {
        amenities.add(typeAmenityMap[type]);
      }
    });
  }
  
  // From editorialSummary and reviews (keyword extraction)
  const text = [
    placeData.editorialSummary?.text || '',
    ...(placeData.reviews || []).map(r => r.text?.text || '')
  ].join(' ').toLowerCase();
  
  const amenityKeywords = {
    'pool': 'Swimming Pool',
    'swimming': 'Swimming Pool',
    'gym': 'Fitness Center',
    'fitness': 'Fitness Center',
    'wifi': 'Free WiFi',
    'wi-fi': 'Free WiFi',
    'parking': 'Free Parking',
    'restaurant': 'On-site Restaurant',
    'breakfast': 'Breakfast Included',
    'spa': 'Spa Services',
    'air condition': 'Air Conditioning',
    'ac ': 'Air Conditioning',
    'room service': 'Room Service',
    '24 hour': '24-Hour Front Desk',
    'conference': 'Conference Rooms',
    'business center': 'Business Center',
    'laundry': 'Laundry Service',
    'concierge': 'Concierge Service',
    'bar': 'Bar/Lounge',
    'shuttle': 'Airport Shuttle',
    'balcony': 'Balconies',
    'view': 'City/Mountain View',
  };
  
  Object.entries(amenityKeywords).forEach(([keyword, amenity]) => {
    if (text.includes(keyword)) {
      amenities.add(amenity);
    }
  });
  
  // Always add these standard hotel amenities
  if (amenities.size > 0) {
    amenities.add('WiFi');
    amenities.add('24-Hour Front Desk');
  }
  
  return Array.from(amenities).slice(0, 10); // Limit to 10 amenities
}

/**
 * Extract reviews data from Google Places
 */
function extractReviewsData(placeData) {
  return {
    rating: placeData.rating || null,
    reviews_count: placeData.userRatingCount || placeData.user_ratings_total || 0,
    reviews: (placeData.reviews || []).slice(0, 3).map(review => ({
      author: review.authorAttribution?.displayName || 'Anonymous',
      rating: review.rating,
      text: review.text?.text || '',
      time: review.publishTime,
      relativeTime: review.relativePublishTimeDescription,
    }))
  };
}

// ========================================
// ENHANCED VERIFICATION
// ========================================

export async function verifySingleHotel(hotel) {
  // console.log("\n🔍 ========== VERIFYING HOTEL ==========");
  // console.log("📥 Input Data:", JSON.stringify(hotel, null, 2));
  
  // Extract hotel ID and name with flexible parsing
  const hotelId = extractHotelId(hotel);
  const hotelName = extractHotelName(hotel);
  
  // console.log(`🆔 Extracted ID: ${hotelId || "NOT FOUND"}`);
  // console.log(`📝 Extracted Name: ${hotelName || "NOT FOUND"}`);
  
  // Strategy 1: Try ID lookup first (most accurate)
  if (hotelId) {
    const idMatch = getHotelById(hotelId);
    if (idMatch) {
      // console.log("✅ VERIFIED BY ID:", idMatch.hotel_name);
      const result = await createSuccessResult(idMatch, hotel, 1.0, 'ID Match');
      return result;
    }
    // console.log("⚠️  ID not found in database");
  }
  
  // Strategy 2: Name-based verification (fallback)
  if (hotelName) {
    // console.log("🔍 Attempting name-based search...");
    
    // Try exact normalized match first
    const exactMatch = tryExactNameMatch(hotelName);
    if (exactMatch) {
      // console.log(`✅ EXACT NAME MATCH: ${exactMatch.hotel_name}`);
      const result = await createSuccessResult(exactMatch, hotel, 1.0, 'Exact Name Match');
      return result;
    }
    
    // Try fuzzy matching
    const fuzzyMatches = searchHotelsByName(hotelName);
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      const similarity = bestMatch.similarity;
      
      // ✅ ENHANCED: Log match quality for diagnostics
      console.log(`🔍 Fuzzy match: "${hotelName}" → "${bestMatch.hotel_name}" (${(similarity * 100).toFixed(1)}% similarity, ID: ${bestMatch.hotel_id})`);
      
      // ⚠️ Warning for low-confidence matches
      if (similarity < 0.75) {
        console.warn(`⚠️ Low confidence match detected (<75%):`, {
          searchName: hotelName,
          matchedName: bestMatch.hotel_name,
          similarity: `${(similarity * 100).toFixed(1)}%`,
          hotel_id: bestMatch.hotel_id,
          recommendation: 'Manual verification recommended'
        });
      }
      
      const result = await createSuccessResult(
        bestMatch, 
        hotel, 
        similarity, 
        'Fuzzy Name Match'
      );
      return result;
    }
    
    // ❌ Enhanced logging for failed matches
    console.error(`❌ No match found for hotel: "${hotelName}"`, {
      searchedName: hotelName,
      attemptedId: hotelId || 'none',
      suggestion: 'Hotel may not exist in database or name mismatch is too large'
    });
  }
  
  // Strategy 3: Failed - provide diagnostics
  return createFailureResult(hotel, hotelId, hotelName);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function createSuccessResult(matchedHotel, originalHotel, score, method) {
  // const hotelName = matchedHotel.hotel_name;
  // const location = originalHotel.hotelAddress || originalHotel.address || 'Philippines';
  // console.log(`🔍 Enriching hotel data from Google Places API...`);
  const realData = await fetchRealHotelData(matchedHotel.hotel_name, originalHotel.hotelAddress || originalHotel.address || 'Philippines');
  // if (realData) {
  //   console.log(`✅ Successfully enriched with real data:`, {
  //     amenities: realData.amenities?.length || 0,
  //     rating: realData.rating,
  //     reviews: realData.reviews_count
  //   });
  // }
  // ✅ Log successful verification with hotel_id
  console.log(`✅ Verified hotel: ${matchedHotel.hotel_name} (ID: ${matchedHotel.hotel_id})`);
  
  return {
    verified: true,
    matchScore: score,
    firestoreData: {
      // ✅ Start with original hotel data (but exclude conflicting id fields)
      ...originalHotel,
      
      // ✅ CRITICAL: Preserve BOTH names to prevent STAY→Star confusion
      ai_hotel_name: originalHotel.name || originalHotel.hotelName || originalHotel.hotel_name, // Original AI name for display
      database_hotel_name: matchedHotel.hotel_name, // Database name for reference
      
      // ✅ CRITICAL: Set the correct Agoda hotel_id from database
      // This MUST come after spread to override any id/hotel_id from originalHotel
      hotel_id: matchedHotel.hotel_id,
      hotel_name: matchedHotel.hotel_name, // Database name (might differ from AI name)
      hotelId: matchedHotel.hotel_id, // ✅ Also set camelCase version for compatibility
      
      // ✅ IMPORTANT: Keep original AI name for display (don't override with database name)
      name: originalHotel.name || originalHotel.hotelName || matchedHotel.hotel_name,
      hotelName: originalHotel.hotelName || originalHotel.name || matchedHotel.hotel_name,
      
      // ✅ IMPORTANT: Don't let 'id' field be the Google Place ID
      // Remove any generic 'id' that might conflict with hotel_id
      id: matchedHotel.hotel_id, // ✅ Set to Agoda hotel_id, not Google Place ID
      
      // ✅ PRIORITY: Use real Google Places data if available, fallback to AI/original data
      amenities: realData?.amenities || originalHotel.amenities || originalHotel.facilities || [],
      rating: realData?.rating || originalHotel.rating || originalHotel.starRating || null,
      user_ratings_total: realData?.user_ratings_total || originalHotel.user_ratings_total || originalHotel.reviews_count || 0,
      reviews_count: realData?.reviews_count || originalHotel.reviews_count || originalHotel.user_ratings_total || 0,
      
      // ✅ Additional real data from Google Places (stored separately, not as 'id')
      google_place_id: realData?.google_place_id,
      address: realData?.address || originalHotel.hotelAddress || originalHotel.address,
      editorialSummary: realData?.editorialSummary,
      priceLevel: realData?.priceLevel,
      websiteUri: realData?.websiteUri,
      phoneNumber: realData?.phoneNumber,
      photos: realData?.photos || [],
      
      // ✅ Preserve original pricing data
      description: originalHotel.description || originalHotel.hotelDetails || realData?.editorialSummary,
      pricePerNight: originalHotel.pricePerNight || originalHotel.price,
      priceRange: originalHotel.priceRange || originalHotel.price_range,
      
      // ✅ Mark source and verification status
      source: 'verified',
      verified: true,
      dataSource: realData ? 'google_places_api' : 'ai_generated',
    },
    originalData: originalHotel,
    realGoogleData: realData,
    source: 'local',
    verificationMethod: method,
    issues: [],
    warnings: score < 0.95 ? [
      `Matched by ${method} (${(score * 100).toFixed(1)}% similarity)`,
      `Database hotel_id: ${matchedHotel.hotel_id}`,
      `Database name: ${matchedHotel.hotel_name}`
    ] : []
  };
}

function createFailureResult(hotel, hotelId, hotelName) {
  // console.log("❌ VERIFICATION FAILED");
  // console.log("📊 Diagnostic Info:");
  // console.log(`   - Has ID: ${!!hotelId}`);
  // console.log(`   - Has Name: ${!!hotelName}`);
  // console.log(`   - Fields: ${Object.keys(hotel).join(', ')}`);
  return {
    verified: false,
    reason: 'Hotel not found in database',
    // ✅ IMPORTANT: Still return the original hotel data with all fields
    firestoreData: {
      ...hotel,
      verified: false,
      source: 'unverified',
      // Normalize field names
      name: hotel.name || hotel.hotelName,
      hotelName: hotel.hotelName || hotel.name,
    },
    originalData: hotel,
    matchScore: 0,
    verificationMethod: 'Failed',
    diagnostic: {
      hasId: !!hotelId,
      hasName: !!hotelName,
      extractedId: hotelId,
      extractedName: hotelName,
      availableFields: Object.keys(hotel),
      suggestion: hotelName 
        ? `Try searching manually: "${hotelName}"` 
        : "Missing both ID and name fields"
    }
  };
}

function tryExactNameMatch(hotelName) {
  const normalized = normalizeString(hotelName);
  const matches = hotelNameIndex.get(normalized);
  return matches && matches.length > 0 ? matches[0] : null;
}

// ========================================
// FLEXIBLE DATA EXTRACTION
// ========================================

function extractHotelId(hotel) {
  const possibleIdFields = [
    'hotel_id', 'hotelId', 'id', 'Hotel_ID', 'HOTEL_ID',
    'agoda_id', 'agodaId', 'propertyId', 'property_id'
  ];
  
  for (const field of possibleIdFields) {
    const value = hotel[field];
    if (value !== undefined && value !== null && value !== '') {
      return String(value).trim();
    }
  }
  return null;
}

function extractHotelName(hotel) {
  const possibleNameFields = [
    'hotel_name', 'hotelName', 'name', 'Hotel_Name', 'HOTEL_NAME',
    'title', 'propertyName', 'property_name', 'accommodation_name'
  ];
  
  for (const field of possibleNameFields) {
    const value = hotel[field];
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

// ========================================
// CORE SEARCH FUNCTIONS
// ========================================

export function getHotelById(hotelId) {
  const localHotel = localHotelMap.get(hotelId.toString());
  
  if (localHotel) {
    return {
      hotel_id: localHotel.hotel_id,
      hotel_name: localHotel.hotel_name,
      source: 'local'
    };
  }
  return null;
}

export function searchHotelsByName(hotelName) {
  const normalizedSearchName = normalizeString(hotelName);
  
  console.log(`🔍 Searching hotels for: "${hotelName}"`);
  console.log(`   Normalized to: "${normalizedSearchName}"`);
  
  // Search with similarity scoring
  const matches = [];
  
  Array.from(localHotelMap.values()).forEach(hotel => {
    const normalizedHotelName = normalizeString(hotel.hotel_name);
    const similarity = calculateSimilarity(normalizedHotelName, normalizedSearchName);
    
    // Lower threshold to 0.65 for partial matches
    if (similarity > 0.65) {
      matches.push({
        ...hotel,
        similarity: similarity,
        normalizedName: normalizedHotelName  // ✅ For debugging
      });
    }
  });
  
  // Sort by similarity (highest first)
  matches.sort((a, b) => b.similarity - a.similarity);
  
  if (matches.length > 0) {
    const bestMatch = matches[0];
    console.log(`   ✅ Best match: "${bestMatch.hotel_name}" (${(bestMatch.similarity * 100).toFixed(1)}% similarity)`);
    console.log(`   Normalized match: "${bestMatch.normalizedName}"`);
    
    // ✅ Check if it's now an exact match after normalization
    if (bestMatch.similarity === 1.0) {
      console.log(`   🎯 EXACT MATCH achieved through normalization!`);
    } else if (bestMatch.similarity >= 0.90) {
      console.log(`   ✓ High confidence match (≥90%)`);
    } else if (bestMatch.similarity >= 0.85) {
      console.log(`   ~ Good match (85-89%) - Tier 3 "Confirmed"`);
    } else {
      console.log(`   ⚠️ Moderate match (<85%) - Lower tier`);
    }
  } else {
    console.log(`   ❌ No matches found above 65% similarity`);
  }
  
  return matches.slice(0, 5); // Return top 5 matches
}

// ========================================
// STRING UTILITIES
// ========================================

/**
 * Enhanced normalization to handle common hotel name variations
 * Fixes: "BANAUE GREENFIELDS AND RESTAURANT" vs "Banaue Greenfield Inn and Restaurant"
 * 
 * Handles:
 * - Plural/Singular (greenfields → greenfield)
 * - Business suffixes (inn, hotel, resort, restaurant)
 * - And/& variations
 * - Case and punctuation
 * - Extra whitespace
 */
function normalizeString(str) {
  if (!str) return '';
  
  let normalized = String(str)
    .toLowerCase()
    .trim();
  
  // ✅ First handle multi-word business types (before removing 'and')
  // Convert both "bed and breakfast" and "bed & breakfast" to standard form
  normalized = normalized
    .replace(/\bbed\s+and\s+breakfast\b/gi, 'bnb')
    .replace(/\bbed\s*&\s*breakfast\b/gi, 'bnb')
    .replace(/\bb\s*&\s*b\b/gi, 'bnb');
  
  // ✅ Remove common business type suffixes
  // These are often omitted or added differently in various sources
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
  
  // ✅ Normalize "and" vs "&" (common variation)
  normalized = normalized
    .replace(/\s+and\s+/gi, ' ')  // Remove "and"
    .replace(/\s*&\s*/g, ' ');     // Remove "&"
  
  // ✅ Remove "the" prefix (sometimes added/omitted)
  normalized = normalized.replace(/^the\s+/i, '');
  
  // ✅ Handle plural forms (greenfields → greenfield)
  // Remove trailing 's' after word boundaries
  normalized = normalized.replace(/s\b/g, '');
  
  // ✅ Remove all punctuation and special characters
  normalized = normalized.replace(/[^\w\s]/g, '');
  
  // ✅ Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Example transformations:
// "BANAUE GREENFIELDS AND RESTAURANT" 
// → "banaue greenfields and restaurant"
// → "banaue greenfield restaurant" (removed: "and", "s" from greenfields)
//
// "Banaue Greenfield Inn and Restaurant"
// → "banaue greenfield inn and restaurant"  
// → "banaue greenfield restaurant" (removed: "inn", "and", "restaurant")
//
// Result: Both normalize to "banaue greenfield restaurant" → EXACT MATCH ✓

function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0;
  
  // Check for substring matches (common with hotel names)
  if (str1.includes(str2) || str2.includes(str1)) {
    const longer = Math.max(str1.length, str2.length);
    const shorter = Math.min(str1.length, str2.length);
    return shorter / longer; // Return high score for substring matches
  }
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const lengthDiff = Math.abs(str1.length - str2.length);
  if (lengthDiff / longer.length > 0.5) return 0.3; // Still give partial credit
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// ========================================
// UTILITY EXPORTS
// ========================================

export function getDatabaseStats() {
  return {
    totalHotels: localHotelMap.size,
    uniqueNames: hotelNameIndex.size,
    source: 'local cache only'
  };
}

export { localHotelMap, hotelNameIndex };
