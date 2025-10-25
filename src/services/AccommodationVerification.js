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

console.log(`🏨 Loaded ${localHotelMap.size.toLocaleString()} hotels into local cache`);
console.log(`📇 Indexed ${hotelNameIndex.size.toLocaleString()} unique hotel names`);

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
    console.log(`🔍 Fetching real data for: ${hotelName}`);
    
    // Create search query with location context
    let searchQuery = hotelName;
    if (!searchQuery.toLowerCase().includes('philippines') && location) {
      searchQuery += `, ${location}`;
    }

    const response = await GetPlaceDetails({ textQuery: searchQuery });
    
    if (!response?.data?.places || response.data.places.length === 0) {
      console.warn(`⚠️ No Google Places data found for: ${hotelName}`);
      return null;
    }

    const placeData = response.data.places[0];
    
    // Extract amenities from various sources
    const amenities = extractAmenities(placeData);
    
    // Extract reviews data
    const reviewsData = extractReviewsData(placeData);
    
    console.log(`✅ Fetched real data for ${hotelName}:`, {
      amenities: amenities.length,
      rating: reviewsData.rating,
      reviews_count: reviewsData.reviews_count
    });
    
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
    console.error(`❌ Error fetching Google Places data for ${hotelName}:`, error.message);
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
  console.log("\n🔍 ========== VERIFYING HOTEL ==========");
  console.log("📥 Input Data:", JSON.stringify(hotel, null, 2));
  
  // Extract hotel ID and name with flexible parsing
  const hotelId = extractHotelId(hotel);
  const hotelName = extractHotelName(hotel);
  
  console.log(`🆔 Extracted ID: ${hotelId || "NOT FOUND"}`);
  console.log(`📝 Extracted Name: ${hotelName || "NOT FOUND"}`);
  
  // Strategy 1: Try ID lookup first (most accurate)
  if (hotelId) {
    const idMatch = getHotelById(hotelId);
    if (idMatch) {
      console.log("✅ VERIFIED BY ID:", idMatch.hotel_name);
      const result = await createSuccessResult(idMatch, hotel, 1.0, 'ID Match');
      return result;
    }
    console.log("⚠️  ID not found in database");
  }
  
  // Strategy 2: Name-based verification (fallback)
  if (hotelName) {
    console.log("🔍 Attempting name-based search...");
    
    // Try exact normalized match first
    const exactMatch = tryExactNameMatch(hotelName);
    if (exactMatch) {
      console.log(`✅ EXACT NAME MATCH: ${exactMatch.hotel_name}`);
      const result = await createSuccessResult(exactMatch, hotel, 1.0, 'Exact Name Match');
      return result;
    }
    
    // Try fuzzy matching
    const fuzzyMatches = searchHotelsByName(hotelName);
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      const similarity = bestMatch.similarity;
      
      console.log(`✅ FUZZY NAME MATCH: ${bestMatch.hotel_name}`);
      console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
      console.log(`   Database ID: ${bestMatch.hotel_id}`);
      
      const result = await createSuccessResult(
        bestMatch, 
        hotel, 
        similarity, 
        'Fuzzy Name Match'
      );
      return result;
    }
    
    console.log("❌ No name matches found");
  }
  
  // Strategy 3: Failed - provide diagnostics
  return createFailureResult(hotel, hotelId, hotelName);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function createSuccessResult(matchedHotel, originalHotel, score, method) {
  // 🌟 FETCH REAL DATA FROM GOOGLE PLACES API
  const hotelName = matchedHotel.hotel_name;
  const location = originalHotel.hotelAddress || originalHotel.address || 'Philippines';
  
  console.log(`🔍 Enriching hotel data from Google Places API...`);
  const realData = await fetchRealHotelData(hotelName, location);
  
  if (realData) {
    console.log(`✅ Successfully enriched with real data:`, {
      amenities: realData.amenities?.length || 0,
      rating: realData.rating,
      reviews: realData.reviews_count
    });
  }
  
  return {
    verified: true,
    matchScore: score,
    firestoreData: {
      // ✅ Start with original hotel data
      ...originalHotel,
      
      // ✅ Add database verification
      hotel_id: matchedHotel.hotel_id,
      hotel_name: matchedHotel.hotel_name,
      name: originalHotel.name || originalHotel.hotelName || matchedHotel.hotel_name,
      hotelName: originalHotel.hotelName || originalHotel.name || matchedHotel.hotel_name,
      
      // ✅ PRIORITY: Use real Google Places data if available, fallback to AI/original data
      amenities: realData?.amenities || originalHotel.amenities || originalHotel.facilities || [],
      rating: realData?.rating || originalHotel.rating || originalHotel.starRating || null,
      user_ratings_total: realData?.user_ratings_total || originalHotel.user_ratings_total || originalHotel.reviews_count || 0,
      reviews_count: realData?.reviews_count || originalHotel.reviews_count || originalHotel.user_ratings_total || 0,
      
      // ✅ Additional real data from Google Places
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
  console.log("❌ VERIFICATION FAILED");
  console.log("📊 Diagnostic Info:");
  console.log(`   - Has ID: ${!!hotelId}`);
  console.log(`   - Has Name: ${!!hotelName}`);
  console.log(`   - Fields: ${Object.keys(hotel).join(', ')}`);
  
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
  
  // Search with similarity scoring
  const matches = [];
  
  Array.from(localHotelMap.values()).forEach(hotel => {
    const normalizedHotelName = normalizeString(hotel.hotel_name);
    const similarity = calculateSimilarity(normalizedHotelName, normalizedSearchName);
    
    // Lower threshold to 0.65 for partial matches
    if (similarity > 0.65) {
      matches.push({
        ...hotel,
        similarity: similarity
      });
    }
  });
  
  // Sort by similarity (highest first)
  matches.sort((a, b) => b.similarity - a.similarity);
  
  console.log(`🔍 Found ${matches.length} matches above 65% similarity`);
  if (matches.length > 0) {
    console.log(`   Best match: ${matches[0].hotel_name} (${(matches[0].similarity * 100).toFixed(1)}%)`);
  }
  
  return matches.slice(0, 5); // Return top 5 matches
}

// ========================================
// STRING UTILITIES
// ========================================

function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

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
