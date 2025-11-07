/**
 * Enhanced Airport Distance Calculator with Dynamic Geocoding
 * Handles ANY Philippine location, not just hardcoded cities
 * 
 * Features:
 * - Hardcoded coordinates for 70+ major cities (fast, no API calls)
 * - Dynamic geocoding for 1,600+ municipalities (Google Geocoding API)
 * - Intelligent caching to minimize API calls
 * - Region detection from geocoded results
 * - Terrain estimation based on province patterns
 */

// ✅ Philippine Airport Coordinates (same as original calculator)
const AIRPORT_COORDINATES = {
  // Luzon
  'MNL': { lat: 14.5086, lng: 121.0194, city: 'Manila', region: 'ncr' },
  'CRK': { lat: 15.1859, lng: 120.5600, city: 'Clark', region: 'r03' },
  'LAO': { lat: 18.1781, lng: 120.5314, city: 'Laoag', region: 'r01' },
  'TUG': { lat: 17.6433, lng: 121.7331, city: 'Tuguegarao', region: 'r02' },
  'LGP': { lat: 13.1575, lng: 123.7350, city: 'Legazpi', region: 'r05' },
  'WNP': { lat: 13.5848, lng: 123.2705, city: 'Naga', region: 'r05' },
  'SJI': { lat: 13.4170, lng: 121.0473, city: 'San Jose (Mindoro)', region: 'r04b' },
  
  // Visayas
  'CEB': { lat: 10.3075, lng: 123.9794, city: 'Cebu', region: 'r07' },
  'ILO': { lat: 10.8330, lng: 122.4933, city: 'Iloilo', region: 'r06' },
  'BCD': { lat: 10.6425, lng: 122.9283, city: 'Bacolod', region: 'r06' },
  'TAG': { lat: 9.6641, lng: 123.8531, city: 'Tagbilaran (Bohol)', region: 'r07' },
  'DGT': { lat: 9.3339, lng: 123.3004, city: 'Dumaguete', region: 'r07' },
  'TAC': { lat: 11.2280, lng: 125.0278, city: 'Tacloban', region: 'r08' },
  'KLO': { lat: 11.6794, lng: 122.3758, city: 'Kalibo', region: 'r06' },
  'MPH': { lat: 11.9245, lng: 121.9540, city: 'Caticlan (Boracay)', region: 'r06' },
  'RXS': { lat: 12.5787, lng: 121.7539, city: 'Roxas (Panay)', region: 'r06' },
  
  // Mindanao
  'DVO': { lat: 7.1253, lng: 125.6458, city: 'Davao', region: 'r11' },
  'CGY': { lat: 8.4156, lng: 124.6111, city: 'Cagayan de Oro', region: 'r10' },
  'ZAM': { lat: 6.9222, lng: 122.0600, city: 'Zamboanga', region: 'r09' },
  'GES': { lat: 6.0580, lng: 125.0961, city: 'General Santos', region: 'r12' },
  'BXU': { lat: 8.9515, lng: 125.4789, city: 'Butuan', region: 'r13' },
  'IAO': { lat: 9.8591, lng: 126.0139, city: 'Siargao', region: 'r13' },
  'CGM': { lat: 9.2536, lng: 124.7069, city: 'Camiguin', region: 'r10' },
  'DPL': { lat: 6.0644, lng: 125.6058, city: 'Dipolog', region: 'r09' },
  'PAG': { lat: 6.0574, lng: 121.0119, city: 'Pagadian', region: 'r09' },
  
  // Palawan
  'PPS': { lat: 9.7421, lng: 118.7594, city: 'Puerto Princesa', region: 'r04b' },
  'USU': { lat: 12.1215, lng: 120.0998, city: 'Coron (Busuanga)', region: 'r04b' },
  
  // Inactive/Limited Service Airports (for reference)
  'BAG': { lat: 16.3751, lng: 120.6200, city: 'Baguio', region: 'car', inactive: true },
  'ENI': { lat: 11.2025, lng: 119.4172, city: 'El Nido', region: 'r04b', inactive: true },
};

// ✅ Major Philippine Cities Without Direct Airports
const CITY_COORDINATES = {
  // Metro Manila (NCR)
  'manila': { lat: 14.5995, lng: 120.9842, region: 'ncr', terrain: 'highway' },
  'quezon': { lat: 14.6760, lng: 121.0437, region: 'ncr', terrain: 'highway' },
  'makati': { lat: 14.5547, lng: 121.0244, region: 'ncr', terrain: 'highway' },
  'taguig': { lat: 14.5176, lng: 121.0509, region: 'ncr', terrain: 'highway' },
  'pasig': { lat: 14.5764, lng: 121.0851, region: 'ncr', terrain: 'highway' },
  'mandaluyong': { lat: 14.5794, lng: 121.0359, region: 'ncr', terrain: 'highway' },
  
  // Luzon
  'baguio': { lat: 16.4023, lng: 120.5960, region: 'car', terrain: 'mountainous' },
  'sagada': { lat: 17.0833, lng: 120.9000, region: 'car', terrain: 'mountainous' },
  'banaue': { lat: 16.9267, lng: 121.0578, region: 'r02', terrain: 'mountainous' },
  'vigan': { lat: 17.5747, lng: 120.3869, region: 'r01', terrain: 'normal' },
  'tagaytay': { lat: 14.1158, lng: 120.9621, region: 'r04a', terrain: 'highway' },
  'batangas city': { lat: 13.7565, lng: 121.0583, region: 'r04a', terrain: 'highway' },
  'subic': { lat: 14.8823, lng: 120.2728, region: 'r03', terrain: 'highway' },
  'baler': { lat: 15.7592, lng: 121.5611, region: 'r03', terrain: 'mountainous' },
  
  // Visayas
  'boracay': { lat: 11.9674, lng: 121.9248, region: 'r06', terrain: 'island' },
  'caticlan': { lat: 11.9167, lng: 121.9500, region: 'r06', terrain: 'normal' },
  'kalibo': { lat: 11.7072, lng: 122.3681, region: 'r06', terrain: 'normal' },
  'iloilo': { lat: 10.7202, lng: 122.5621, region: 'r06', terrain: 'normal' },
  'bacolod': { lat: 10.6761, lng: 122.9503, region: 'r06', terrain: 'normal' },
  'siquijor': { lat: 9.2000, lng: 123.5500, region: 'r07', terrain: 'island' },
  'ormoc': { lat: 11.0059, lng: 124.6074, region: 'r08', terrain: 'normal' },
  
  // Cebu nearby attractions (Region VII)
  'oslob': { lat: 9.4833, lng: 123.3833, region: 'r07', terrain: 'normal' },
  'moalboal': { lat: 9.9333, lng: 123.3833, region: 'r07', terrain: 'normal' },
  'badian': { lat: 9.8667, lng: 123.4000, region: 'r07', terrain: 'normal' },
  'malapascua': { lat: 11.3333, lng: 124.1167, region: 'r07', terrain: 'island' },
  'bantayan': { lat: 11.1687, lng: 123.7191, region: 'r07', terrain: 'island' },
  
  // Bohol (Region VII)
  'anda': { lat: 9.7333, lng: 124.5667, region: 'r07', terrain: 'island' },
  'buenavista': { lat: 10.0833, lng: 124.1128, region: 'r07', terrain: 'normal' },
  'carmen': { lat: 9.8500, lng: 124.1833, region: 'r07', terrain: 'normal' },
  'cortes': { lat: 9.6333, lng: 123.8833, region: 'r07', terrain: 'normal' },
  'dauis': { lat: 9.6333, lng: 123.8500, region: 'r07', terrain: 'normal' },
  'loboc': { lat: 9.6333, lng: 124.0333, region: 'r07', terrain: 'island' },
  'panglao': { lat: 9.5833, lng: 123.7500, region: 'r07', terrain: 'island' },
  'tagbilaran': { lat: 9.6472, lng: 123.8531, region: 'r07', terrain: 'normal' },
  'tubigon': { lat: 10.0500, lng: 124.0167, region: 'r07', terrain: 'normal' },
  
  // Palawan
  'elnido': { lat: 11.1949, lng: 119.4038, region: 'r04b', terrain: 'normal' },
  'el nido': { lat: 11.1949, lng: 119.4038, region: 'r04b', terrain: 'normal' },
  'coron': { lat: 11.9975, lng: 120.2067, region: 'r04b', terrain: 'island' },
  'coron town': { lat: 11.9975, lng: 120.2067, region: 'r04b', terrain: 'island' },
  'puertoprincess': { lat: 9.7392, lng: 118.7353, region: 'r04b', terrain: 'normal' },
  'puerto princesa': { lat: 9.7392, lng: 118.7353, region: 'r04b', terrain: 'normal' },
  'port barton': { lat: 10.4833, lng: 119.2333, region: 'r04b', terrain: 'normal' },
  'san vicente': { lat: 10.5275, lng: 119.2772, region: 'r04b', terrain: 'normal' },
  
  // Mindanao
  'cagayan de oro': { lat: 8.4542, lng: 124.6319, region: 'r10', terrain: 'normal' },
  'camiguin': { lat: 9.2000, lng: 124.7000, region: 'r10', terrain: 'island' },
  'camiguin town': { lat: 9.2000, lng: 124.7000, region: 'r10', terrain: 'island' },
  'dapa': { lat: 9.7500, lng: 126.0500, region: 'r13', terrain: 'island' },
  'general luna': { lat: 9.7833, lng: 126.1500, region: 'r13', terrain: 'island' },
  'mambajao': { lat: 9.2500, lng: 124.7167, region: 'r10', terrain: 'island' },
  'siargao': { lat: 9.8667, lng: 126.0500, region: 'r13', terrain: 'island' },
  'siargao town': { lat: 9.8667, lng: 126.0500, region: 'r13', terrain: 'island' },
  'zamboanga': { lat: 6.9214, lng: 122.0790, region: 'r09', terrain: 'normal' },
};

// ✅ Location aliases for common city name variations
const LOCATION_ALIASES = {
  // City variations
  'tagbilaran city': 'tagbilaran',
  'cebu city': 'cebu',
  'davao city': 'davao',
  'baguio city': 'baguio',
  'iloilo city': 'iloilo',
  'bacolod city': 'bacolod',
  'cagayan de oro city': 'cagayan de oro',
  'zamboanga city': 'zamboanga',
  
  // Palawan destinations
  'el nido': 'elnido',
  'puerto princesa': 'puertoprincess',
  'puerto princesa city': 'puertoprincess',
  
  // Bohol destinations
  'chocolate hills': 'carmen',
  'alona beach': 'panglao',
  'alona': 'panglao',
  
  // Siargao destinations
  'cloud 9': 'general luna',
  'gen. luna': 'general luna',
  'gen luna': 'general luna',
  
  // Metro Manila
  'quezon city': 'quezon',
  'makati city': 'makati',
  'taguig city': 'taguig',
  'pasig city': 'pasig',
  'mandaluyong city': 'mandaluyong',
};

// ✅ In-memory cache for geocoded locations (persists during session)
const GEOCODE_CACHE = new Map();

// ✅ Province-to-region mapping (for locations without region in geocode)
const PROVINCE_TO_REGION = {
  // NCR
  'metro manila': 'ncr',
  'manila': 'ncr',
  
  // CAR (Cordillera Administrative Region)
  'benguet': 'car',
  'abra': 'car',
  'apayao': 'car',
  'ifugao': 'car',
  'kalinga': 'car',
  'mountain province': 'car',
  
  // Region I (Ilocos)
  'ilocos norte': 'r01',
  'ilocos sur': 'r01',
  'la union': 'r01',
  'pangasinan': 'r01',
  
  // Region II (Cagayan Valley)
  'batanes': 'r02',
  'cagayan': 'r02',
  'isabela': 'r02',
  'nueva vizcaya': 'r02',
  'quirino': 'r02',
  
  // Region III (Central Luzon)
  'aurora': 'r03',
  'bataan': 'r03',
  'bulacan': 'r03',
  'nueva ecija': 'r03',
  'pampanga': 'r03',
  'tarlac': 'r03',
  'zambales': 'r03',
  
  // Region IV-A (CALABARZON)
  'batangas': 'r04a',
  'cavite': 'r04a',
  'laguna': 'r04a',
  'quezon': 'r04a',
  'rizal': 'r04a',
  
  // Region IV-B (MIMAROPA)
  'marinduque': 'r04b',
  'occidental mindoro': 'r04b',
  'oriental mindoro': 'r04b',
  'palawan': 'r04b',
  'romblon': 'r04b',
  
  // Region V (Bicol)
  'albay': 'r05',
  'camarines norte': 'r05',
  'camarines sur': 'r05',
  'catanduanes': 'r05',
  'masbate': 'r05',
  'sorsogon': 'r05',
  
  // Region VI (Western Visayas)
  'aklan': 'r06',
  'antique': 'r06',
  'capiz': 'r06',
  'guimaras': 'r06',
  'iloilo': 'r06',
  'negros occidental': 'r06',
  
  // Region VII (Central Visayas)
  'bohol': 'r07',
  'cebu': 'r07',
  'negros oriental': 'r07',
  'siquijor': 'r07',
  
  // Region VIII (Eastern Visayas)
  'biliran': 'r08',
  'eastern samar': 'r08',
  'leyte': 'r08',
  'northern samar': 'r08',
  'samar': 'r08',
  'southern leyte': 'r08',
  
  // Region IX (Zamboanga Peninsula)
  'zamboanga del norte': 'r09',
  'zamboanga del sur': 'r09',
  'zamboanga sibugay': 'r09',
  
  // Region X (Northern Mindanao)
  'bukidnon': 'r10',
  'camiguin': 'r10',
  'lanao del norte': 'r10',
  'misamis occidental': 'r10',
  'misamis oriental': 'r10',
  
  // Region XI (Davao)
  'davao de oro': 'r11',
  'davao del norte': 'r11',
  'davao del sur': 'r11',
  'davao occidental': 'r11',
  'davao oriental': 'r11',
  
  // Region XII (SOCCSKSARGEN)
  'cotabato': 'r12',
  'sarangani': 'r12',
  'south cotabato': 'r12',
  'sultan kudarat': 'r12',
  
  // Region XIII (Caraga)
  'agusan del norte': 'r13',
  'agusan del sur': 'r13',
  'dinagat islands': 'r13',
  'surigao del norte': 'r13',
  'surigao del sur': 'r13',
};

// ✅ Terrain patterns by province (for geocoded locations)
const PROVINCE_TERRAIN = {
  // Mountainous
  'benguet': 'mountainous',
  'mountain province': 'mountainous',
  'ifugao': 'mountainous',
  'kalinga': 'mountainous',
  'apayao': 'mountainous',
  'abra': 'mountainous',
  
  // Island
  'camiguin': 'island',
  'siquijor': 'island',
  'dinagat islands': 'island',
  'guimaras': 'island',
  'marinduque': 'island',
  'romblon': 'island',
  'batanes': 'island',
  
  // Urban (Metro Manila)
  'metro manila': 'urban',
  'manila': 'urban',
  
  // Rest default to 'normal'
};

/**
 * Calculate Haversine distance between two coordinates
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance and terrain
 */
function estimateTravelTime(distanceKm, terrain = 'normal', transportMode = 'bus') {
  let speedKmh;
  
  const baseSpeeds = {
    'bus': 50,
    'van': 55,
    'car': 60,
    'taxi': 60,
    'ferry': 30,
    'walking': 4,
  };
  
  speedKmh = baseSpeeds[transportMode] || 50;
  
  const terrainMultipliers = {
    'mountainous': 0.6,
    'island': 0.7,
    'urban': 0.5,
    'highway': 1.2,
    'normal': 1.0,
  };
  
  speedKmh *= (terrainMultipliers[terrain] || 1.0);
  
  const hours = distanceKm / speedKmh;
  const minutes = Math.round(hours * 60);
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hours`;
  }
}

/**
 * Geocode a location using Google Geocoding API (via Django proxy)
 * @param {string} locationName - Full location string (e.g., "Garcia Hernandez, Bohol, Philippines")
 * @returns {Promise<Object|null>} - Coordinates object or null
 */
async function geocodeLocation(locationName) {
  // Check cache first
  const cacheKey = locationName.toLowerCase().trim();
  if (GEOCODE_CACHE.has(cacheKey)) {
    console.log(`✅ Using cached coordinates for ${locationName}`);
    return GEOCODE_CACHE.get(cacheKey);
  }
  
  // Call Django proxy endpoint (keeps API key secure)
  // Note: VITE_API_BASE_URL already includes /api in most configs
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const url = `${apiBaseUrl}/langgraph/geocoding/`;
  
  try {
    console.log(`🌍 Geocoding location: ${locationName}`);
    console.log(`🔌 Calling geocoding API: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: locationName,
        components: 'country:PH' // Restrict to Philippines
      })
    });
    
    console.log(`📡 Geocoding response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Geocoding API error details:`, errorText);
      throw new Error(`Geocoding API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`📦 Geocoding API response:`, { success: data.success, hasData: !!data.data, resultsCount: data.data?.results?.length });
    
    if (!data.success || !data.data || !data.data.results || data.data.results.length === 0) {
      console.warn(`⚠️ No geocoding results for ${locationName}`, data);
      return null;
    }
    
    const result = data.data.results[0];
    const location = result.geometry.location;
    
    // Extract province from address components
    let province = null;
    let region = null;
    
    for (const component of result.address_components) {
      if (component.types.includes('administrative_area_level_2')) {
        province = component.long_name.toLowerCase();
      }
    }
    
    // Map province to region
    if (province) {
      region = PROVINCE_TO_REGION[province] || 'unknown';
    }
    
    // Determine terrain from province
    const terrain = PROVINCE_TERRAIN[province] || 'normal';
    
    const coords = {
      lat: location.lat,
      lng: location.lng,
      region: region,
      province: province,
      terrain: terrain,
      geocoded: true,
      source: 'google_geocoding'
    };
    
    // Cache the result
    GEOCODE_CACHE.set(cacheKey, coords);
    
    console.log(`✅ Geocoded ${locationName}:`, coords);
    return coords;
    
  } catch (error) {
    console.error(`❌ Geocoding failed for ${locationName}:`, error);
    console.error(`   API URL was: ${url}`);
    console.error(`   Is Django server running? Test: ${apiBaseUrl}/langgraph/health/`);
    return null;
  }
}

/**
 * Get city coordinates - GEOCODE FIRST, then fallback to hardcoded
 * @param {string} cityName - City name (can be "City, Province, Country" format)
 * @returns {Promise<Object|null>} - Coordinates object with lat, lng, region
 */
export async function getCityCoordinatesEnhanced(cityName) {
  if (!cityName) return null;
  
  // Extract city name from "City, Region, Country" format
  const cleanCityName = cityName.split(',')[0].trim();
  const cityLower = cleanCityName.toLowerCase();
  
  // 1️⃣ PRIORITY: Try Google Geocoding API first (most accurate, handles ALL locations)
  console.log(`🌍 Geocoding location: ${cityName}`);
  const geocoded = await geocodeLocation(cityName);
  
  if (geocoded) {
    console.log(`✅ Successfully geocoded: ${cityName} (${geocoded.province || 'Unknown province'})`);
    return geocoded;
  }
  
  console.log(`⚠️ Geocoding failed for ${cityName}, trying hardcoded database...`);
  
  // 2️⃣ FALLBACK 1: Check alias mapping (instant)
  const aliasedCity = LOCATION_ALIASES[cityLower];
  if (aliasedCity && CITY_COORDINATES[aliasedCity]) {
    console.log(`✅ Found alias in hardcoded list: ${cityName} → ${aliasedCity}`);
    return { ...CITY_COORDINATES[aliasedCity], source: 'hardcoded_alias' };
  }
  
  // 3️⃣ FALLBACK 2: Check hardcoded city list (instant)
  if (CITY_COORDINATES[cityLower]) {
    console.log(`✅ Found in hardcoded list: ${cityName}`);
    return { ...CITY_COORDINATES[cityLower], source: 'hardcoded' };
  }
  
  // 4️⃣ FALLBACK 3: Check if city has direct airport (instant)
  for (const [code, airport] of Object.entries(AIRPORT_COORDINATES)) {
    if (airport.inactive) continue;
    
    const airportCityLower = airport.city.toLowerCase();
    if (airportCityLower === cityLower || 
        airportCityLower.includes(cityLower) ||
        cityLower.includes(airportCityLower.split(' ')[0])) {
      console.log(`✅ Found direct airport: ${cityName} → ${code}`);
      return { 
        lat: airport.lat, 
        lng: airport.lng, 
        region: airport.region,
        hasDirectAirport: true,
        airportCode: code,
        source: 'airport_database'
      };
    }
  }
  
  // 5️⃣ Final fallback: return null (caller will handle default)
  console.warn(`❌ No coordinates found for: ${cityName} (geocoding and hardcoded failed)`);
  return null;
}

/**
 * Find nearest airport with enhanced geocoding support
 * @param {string} cityName - City name (e.g., "Garcia Hernandez, Bohol")
 * @param {string} regionCode - Optional region filter
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Object>} - Nearest airport with distance and travel time
 */
export async function findNearestAirportEnhanced(cityName, regionCode = null, maxResults = 3) {
  if (!cityName) {
    return {
      code: null,
      distance: 'Unknown',
      travelTime: 'Unknown',
      hasDirectAirport: false,
      error: 'City name is required'
    };
  }

  // Use enhanced coordinates function (with geocoding fallback)
  console.log(`🔍 findNearestAirportEnhanced called for: ${cityName}`);
  const cityCoords = await getCityCoordinatesEnhanced(cityName);
  console.log(`📍 City coordinates result:`, cityCoords);
  
  // Check if city has direct airport
  if (cityCoords?.hasDirectAirport) {
    const airport = AIRPORT_COORDINATES[cityCoords.airportCode];
    return {
      code: cityCoords.airportCode,
      name: airport.city,
      distance: '0 km',
      travelTime: 'In city',
      distanceKm: 0,
      hasDirectAirport: true,
      terrain: 'urban',
      coordinates: { lat: airport.lat, lng: airport.lng },
      message: `${cityName} has a direct airport`,
      recommendation: `✈️ Direct flights available to ${cityName} (${cityCoords.airportCode})`
    };
  }
  
  if (!cityCoords) {
    console.warn(`⚠️ Could not calculate distances for ${cityName} - geocoding failed`);
    return {
      code: 'MNL',
      name: 'Manila',
      distance: 'Unknown',
      travelTime: 'Unknown',
      hasDirectAirport: false,
      warning: `Could not find coordinates for ${cityName}. Defaulting to Manila (MNL).`,
      recommendation: '⚠️ Please verify airport manually - geocoding unavailable'
    };
  }
  
  // Calculate distances to all active airports
  const airportDistances = [];
  
  // ✅ Extract province from city name for same-province preference
  const cityProvince = cityCoords.province?.toLowerCase() || 
                       cityName.toLowerCase().split(',')[1]?.trim().toLowerCase();
  
  for (const [code, airport] of Object.entries(AIRPORT_COORDINATES)) {
    if (airport.inactive) continue;
    
    // Filter by region if specified
    if (regionCode && airport.region && airport.region !== regionCode) {
      const distanceKm = calculateHaversineDistance(
        cityCoords.lat,
        cityCoords.lng,
        airport.lat,
        airport.lng
      );
      
      if (distanceKm > 500) continue; // Skip distant islands
    }
    
    const distanceKm = calculateHaversineDistance(
      cityCoords.lat,
      cityCoords.lng,
      airport.lat,
      airport.lng
    );
    
    // ✅ Check if airport is in same province (e.g., Tagbilaran for Bohol cities)
    // Extract province from airport name: "Tagbilaran (Bohol)" → "bohol"
    const airportProvinceMatch = airport.city.toLowerCase().match(/\(([^)]+)\)/);
    const airportProvince = airportProvinceMatch ? airportProvinceMatch[1] : airport.city.toLowerCase();
    
    const isSameProvince = cityProvince && 
                          (airportProvince.includes(cityProvince) || 
                           cityProvince.includes(airportProvince) ||
                           // Explicit mappings for common cases
                           (cityProvince === 'bohol' && code === 'TAG') ||
                           (cityProvince === 'cebu' && code === 'CEB') ||
                           (cityProvince === 'palawan' && (code === 'PPS' || code === 'USU')));
    
    // Use terrain from geocoded data or fallback to city detection
    const terrain = cityCoords.terrain || 'normal';
    const travelTime = estimateTravelTime(distanceKm, terrain, 'bus');
    
    airportDistances.push({
      code,
      name: airport.city,
      distance: Math.round(distanceKm),
      distanceFormatted: `${Math.round(distanceKm)} km`,
      travelTime,
      terrain,
      region: airport.region,
      isSameProvince, // ✅ Flag for priority sorting
      coordinates: { lat: airport.lat, lng: airport.lng }
    });
  }
  
  if (airportDistances.length === 0) {
    console.error(`❌ No airports found for ${cityName}`);
    return {
      code: 'MNL',
      name: 'Manila',
      distance: 'Unknown',
      travelTime: 'Unknown',
      hasDirectAirport: false,
      error: 'No airports found in calculation',
      recommendation: '⚠️ Defaulting to Manila - please verify manually'
    };
  }
  
  // ✅ SMART SORTING: Prioritize same-province airports (unless MUCH farther)
  airportDistances.sort((a, b) => {
    // If one is same province and the other isn't
    if (a.isSameProvince && !b.isSameProvince) {
      // Prefer same-province UNLESS it's >100km farther
      const distanceDiff = a.distance - b.distance; // Positive if 'a' is farther
      return distanceDiff > 100 ? 1 : -1; // If same-province is 100km+ farther, use cross-province
    }
    if (b.isSameProvince && !a.isSameProvince) {
      const distanceDiff = b.distance - a.distance;
      return distanceDiff > 100 ? -1 : 1;
    }
    
    // If both same province or both different, sort by distance
    return a.distance - b.distance;
  });
  
  const nearest = airportDistances[0];
  const alternatives = airportDistances.slice(1, maxResults).map(alt => ({
    code: alt.code,
    name: alt.name,
    distance: alt.distanceFormatted,
    distanceKm: alt.distance,
    travelTime: alt.travelTime,
    terrain: alt.terrain
  }));
  
  // Build transport recommendation
  let transportMethod = 'bus';
  if (nearest.terrain === 'island') {
    transportMethod = 'ferry + bus';
  } else if (nearest.terrain === 'mountainous') {
    transportMethod = 'bus (winding mountain roads)';
  } else if (nearest.terrain === 'highway') {
    transportMethod = 'bus (via expressway)';
  }
  
  const geocodedNote = cityCoords.geocoded ? ' (geocoded)' : '';
  
  const result = {
    code: nearest.code,
    name: nearest.name,
    distance: nearest.distanceFormatted,
    distanceKm: nearest.distance,
    travelTime: nearest.travelTime,
    terrain: nearest.terrain,
    hasDirectAirport: false,
    coordinates: nearest.coordinates,
    alternatives,
    geocoded: cityCoords.geocoded || false,
    province: cityCoords.province || 'Unknown',
    isSameProvince: nearest.isSameProvince || false,
    message: `Nearest airport: ${nearest.name} (${nearest.code}) - ${nearest.distanceFormatted} away${geocodedNote}`,
    recommendation: `✈️ Fly to ${nearest.name} (${nearest.code}), then ${nearest.travelTime} by ${transportMethod} to ${cityName}`
  };
  
  console.log(`✅ findNearestAirportEnhanced result:`, result);
  return result;
}

/**
 * Clear geocoding cache (useful for testing or memory management)
 */
export function clearGeocodeCache() {
  const size = GEOCODE_CACHE.size;
  GEOCODE_CACHE.clear();
  console.log(`🧹 Cleared ${size} cached geocoding results`);
}

/**
 * Get cache statistics
 */
export function getGeocodeStats() {
  return {
    cacheSize: GEOCODE_CACHE.size,
    cachedLocations: Array.from(GEOCODE_CACHE.keys())
  };
}

// Export all utilities
export default {
  findNearestAirportEnhanced,
  getCityCoordinatesEnhanced,
  clearGeocodeCache,
  getGeocodeStats,
  calculateHaversineDistance,
  estimateTravelTime
};
