// src/services/AccommodationVerification.js

import hotelsData from '../data/accommodations.json';

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
// ENHANCED VERIFICATION
// ========================================

export function verifySingleHotel(hotel) {
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
      return createSuccessResult(idMatch, hotel, 1.0, 'ID Match');
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
      return createSuccessResult(exactMatch, hotel, 1.0, 'Exact Name Match');
    }
    
    // Try fuzzy matching
    const fuzzyMatches = searchHotelsByName(hotelName);
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      const similarity = bestMatch.similarity;
      
      console.log(`✅ FUZZY NAME MATCH: ${bestMatch.hotel_name}`);
      console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
      console.log(`   Database ID: ${bestMatch.hotel_id}`);
      
      return createSuccessResult(
        bestMatch, 
        hotel, 
        similarity, 
        'Fuzzy Name Match'
      );
    }
    
    console.log("❌ No name matches found");
  }
  
  // Strategy 3: Failed - provide diagnostics
  return createFailureResult(hotel, hotelId, hotelName);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function createSuccessResult(matchedHotel, originalHotel, score, method) {
  return {
    verified: true,
    matchScore: score,
    firestoreData: {
      hotel_id: matchedHotel.hotel_id,
      hotel_name: matchedHotel.hotel_name,
      source: 'local'
    },
    originalData: originalHotel,
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
