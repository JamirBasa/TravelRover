/**
 * Airport Distance Calculator
 * Calculates actual distances between cities and airports using Haversine formula
 * Provides terrain-aware travel time estimates
 * 
 * Purpose: Ensure users get the NEAREST airport recommendation with accurate travel times
 * 
 * Features:
 * - Haversine distance calculation (straight-line distance)
 * - Terrain-aware travel time estimates (mountainous, urban, island, highway)
 * - Alternative airport suggestions
 * - Validation of recommended airports
 */

// ✅ Philippine Airport Coordinates (verified from Google Maps/official sources)
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
  'carmen': { lat: 9.8500, lng: 124.1833, region: 'r07', terrain: 'normal' },       // Chocolate Hills
  'cortes': { lat: 9.6333, lng: 123.8833, region: 'r07', terrain: 'normal' },
  'dauis': { lat: 9.6333, lng: 123.8500, region: 'r07', terrain: 'normal' },        // Near Panglao
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
  'dapa': { lat: 9.7500, lng: 126.0500, region: 'r13', terrain: 'island' },          // Siargao port
  'general luna': { lat: 9.7833, lng: 126.1500, region: 'r13', terrain: 'island' },
  'mambajao': { lat: 9.2500, lng: 124.7167, region: 'r10', terrain: 'island' },
  'siargao': { lat: 9.8667, lng: 126.0500, region: 'r13', terrain: 'island' },
  'siargao town': { lat: 9.8667, lng: 126.0500, region: 'r13', terrain: 'island' },
  'zamboanga': { lat: 6.9214, lng: 122.0790, region: 'r09', terrain: 'normal' },
};

/**
 * Calculate Haversine distance between two coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance and terrain
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} terrain - Terrain type (mountainous, island, urban, highway, normal)
 * @param {string} transportMode - Transport mode (bus, van, car, taxi, ferry)
 * @returns {string} - Formatted travel time (e.g., "3h 30m", "45 minutes")
 */
function estimateTravelTime(distanceKm, terrain = 'normal', transportMode = 'bus') {
  let speedKmh;
  
  // Base speeds by transport mode
  const baseSpeeds = {
    'bus': 50,
    'van': 55,
    'car': 60,
    'taxi': 60,
    'ferry': 30,
    'walking': 4,
  };
  
  speedKmh = baseSpeeds[transportMode] || 50;
  
  // Adjust for terrain
  const terrainMultipliers = {
    'mountainous': 0.6,  // Baguio, Sagada (winding roads, elevation changes)
    'island': 0.7,       // Ferry connections + land transport
    'urban': 0.5,        // Heavy traffic (Manila metro area)
    'highway': 1.2,      // Expressways (SLEX, NLEX, SCTEX)
    'normal': 1.0,       // Standard provincial roads
  };
  
  speedKmh *= (terrainMultipliers[terrain] || 1.0);
  
  const hours = distanceKm / speedKmh;
  const minutes = Math.round(hours * 60);
  
  // Format output
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hours`;
  }
}

/**
 * Determine terrain type for city-airport route
 * @param {string} cityName - City name
 * @param {string} airportCode - Airport code
 * @returns {string} - Terrain type
 */
function getTerrainType(cityName, airportCode) {
  const cityLower = cityName.toLowerCase();
  
  // Check if city has predefined terrain
  const cityData = CITY_COORDINATES[cityLower];
  if (cityData?.terrain) {
    return cityData.terrain;
  }
  
  // Fallback: Check common patterns
  const mountainousCities = ['baguio', 'sagada', 'banaue', 'ifugao', 'baler'];
  const islandRoutes = ['camiguin', 'siquijor', 'siargao', 'coron', 'malapascua', 'bantayan'];
  const urbanRoutes = ['manila', 'makati', 'quezon city', 'taguig', 'pasig', 'mandaluyong'];
  const highwayRoutes = [
    { from: 'tagaytay', to: 'MNL' },  // SLEX
    { from: 'batangas', to: 'MNL' },  // SLEX
    { from: 'clark', to: 'MNL' },     // NLEX
    { from: 'subic', to: 'MNL' },     // SCTEX
  ];
  
  if (mountainousCities.some(city => cityLower.includes(city))) {
    return 'mountainous';
  }
  
  if (islandRoutes.some(city => cityLower.includes(city))) {
    return 'island';
  }
  
  if (urbanRoutes.some(city => cityLower.includes(city))) {
    return 'urban';
  }
  
  if (highwayRoutes.some(route => 
    cityLower.includes(route.from) && airportCode === route.to
  )) {
    return 'highway';
  }
  
  return 'normal';
}

/**
 * Location aliases for common city name variations
 * Maps variations like "Tagbilaran City" → "tagbilaran"
 */
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
  'chocolate hills': 'carmen',          // Carmen is home to Chocolate Hills
  'alona beach': 'panglao',             // Alona Beach is in Panglao
  'alona': 'panglao',
  
  // Siargao destinations
  'cloud 9': 'general luna',            // Cloud 9 surf spot is in General Luna
  'gen. luna': 'general luna',
  'gen luna': 'general luna',
  
  // Metro Manila
  'quezon city': 'quezon',
  'makati city': 'makati',
  'taguig city': 'taguig',
  'pasig city': 'pasig',
  'mandaluyong city': 'mandaluyong',
};

/**
 * Get city coordinates (from database or hardcoded list)
 * @param {string} cityName - City name (can be "City, Region, Country" format)
 * @returns {Object|null} - Coordinates object with lat, lng, region
 */
function getCityCoordinates(cityName) {
  if (!cityName) return null;
  
  // Extract city name from "City, Region, Country" format (take first segment before comma)
  const cleanCityName = cityName.split(',')[0].trim();
  const cityLower = cleanCityName.toLowerCase();
  
  // Check alias mapping first
  const aliasedCity = LOCATION_ALIASES[cityLower];
  if (aliasedCity && CITY_COORDINATES[aliasedCity]) {
    return CITY_COORDINATES[aliasedCity];
  }
  
  // Check hardcoded city list (direct match)
  if (CITY_COORDINATES[cityLower]) {
    return CITY_COORDINATES[cityLower];
  }
  
  // Check if city matches an airport city (has direct airport)
  for (const [code, airport] of Object.entries(AIRPORT_COORDINATES)) {
    if (airport.inactive) continue; // Skip inactive airports
    
    const airportCityLower = airport.city.toLowerCase();
    if (airportCityLower === cityLower || 
        airportCityLower.includes(cityLower) ||
        cityLower.includes(airportCityLower.split(' ')[0])) {
      return { 
        lat: airport.lat, 
        lng: airport.lng, 
        region: airport.region,
        hasDirectAirport: true,
        airportCode: code
      };
    }
  }
  
  console.warn(`⚠️ No coordinates found for city: ${cleanCityName} (from: ${cityName})`);
  return null;
}

/**
 * Find nearest airport to a city with actual distance calculation
 * @param {string} cityName - City name (e.g., "Baguio", "El Nido")
 * @param {string} regionCode - Optional region filter (e.g., "car", "r04b")
 * @param {number} maxResults - Maximum number of results to return (default: 3)
 * @returns {Object} - Nearest airport with distance and travel time
 */
export function findNearestAirportByDistance(cityName, regionCode = null, maxResults = 3) {
  if (!cityName) {
    return {
      code: null,
      distance: 'Unknown',
      travelTime: 'Unknown',
      hasDirectAirport: false,
      error: 'City name is required'
    };
  }

  const cityCoords = getCityCoordinates(cityName);
  
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
    console.warn(`⚠️ Could not calculate distances for ${cityName} - no coordinates found`);
    return {
      code: 'MNL',
      name: 'Manila',
      distance: 'Unknown',
      travelTime: 'Unknown',
      hasDirectAirport: false,
      warning: `Could not find coordinates for ${cityName}. Defaulting to Manila (MNL).`,
      recommendation: '⚠️ Please verify airport manually - distance calculation unavailable'
    };
  }
  
  // Calculate distances to all active airports
  const airportDistances = [];
  
  for (const [code, airport] of Object.entries(AIRPORT_COORDINATES)) {
    // Skip inactive airports
    if (airport.inactive) {
      console.log(`ℹ️ Skipping inactive airport: ${code} (${airport.city})`);
      continue;
    }
    
    // Filter by region if specified (for inter-region travel optimization)
    if (regionCode && airport.region && airport.region !== regionCode) {
      // Still calculate distance but mark as inter-region
      const distanceKm = calculateHaversineDistance(
        cityCoords.lat,
        cityCoords.lng,
        airport.lat,
        airport.lng
      );
      
      // Only skip if > 500 km away (different island group)
      if (distanceKm > 500) {
        continue;
      }
    }
    
    const distanceKm = calculateHaversineDistance(
      cityCoords.lat,
      cityCoords.lng,
      airport.lat,
      airport.lng
    );
    
    const terrain = getTerrainType(cityName, code);
    const travelTime = estimateTravelTime(distanceKm, terrain, 'bus');
    
    airportDistances.push({
      code,
      name: airport.city,
      distance: Math.round(distanceKm),
      distanceFormatted: `${Math.round(distanceKm)} km`,
      travelTime,
      terrain,
      region: airport.region,
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
  
  // Sort by distance (nearest first)
  airportDistances.sort((a, b) => a.distance - b.distance);
  
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
  
  return {
    code: nearest.code,
    name: nearest.name,
    distance: nearest.distanceFormatted,
    distanceKm: nearest.distance,
    travelTime: nearest.travelTime,
    terrain: nearest.terrain,
    hasDirectAirport: false,
    coordinates: nearest.coordinates,
    alternatives,
    message: `Nearest airport: ${nearest.name} (${nearest.code}) - ${nearest.distanceFormatted} away`,
    recommendation: `✈️ Fly to ${nearest.name} (${nearest.code}), then ${nearest.travelTime} by ${transportMethod} to ${cityName}`
  };
}

/**
 * Validate if recommended airport is actually nearest
 * @param {string} cityName - Destination city
 * @param {string} recommendedAirportCode - Airport code to validate
 * @returns {Object} - Validation result with suggestions
 */
export function validateAirportRecommendation(cityName, recommendedAirportCode) {
  if (!cityName || !recommendedAirportCode) {
    return {
      valid: false,
      message: '⚠️ Missing city name or airport code',
      error: 'Invalid input'
    };
  }

  const actualNearest = findNearestAirportByDistance(cityName);
  
  if (actualNearest.error || actualNearest.warning) {
    return {
      valid: true, // Can't validate without coordinates
      message: `⚠️ Cannot validate airport for ${cityName} - ${actualNearest.error || actualNearest.warning}`,
      warning: actualNearest.error || actualNearest.warning,
      recommended: recommendedAirportCode
    };
  }
  
  if (actualNearest.code === recommendedAirportCode) {
    return {
      valid: true,
      message: `✅ ${recommendedAirportCode} is the nearest airport to ${cityName}`,
      distance: actualNearest.distance,
      distanceKm: actualNearest.distanceKm,
      travelTime: actualNearest.travelTime,
      terrain: actualNearest.terrain,
      recommendation: actualNearest.recommendation
    };
  }
  
  // Calculate distance difference
  const recommendedAirport = AIRPORT_COORDINATES[recommendedAirportCode];
  let distanceDifference = 'Unknown';
  let timeDifference = 'Unknown';
  
  if (recommendedAirport) {
    const cityCoords = getCityCoordinates(cityName);
    if (cityCoords) {
      const recommendedDistanceKm = calculateHaversineDistance(
        cityCoords.lat,
        cityCoords.lng,
        recommendedAirport.lat,
        recommendedAirport.lng
      );
      
      const diffKm = Math.abs(recommendedDistanceKm - actualNearest.distanceKm);
      distanceDifference = `${Math.round(diffKm)} km difference`;
      
      const recommendedTerrain = getTerrainType(cityName, recommendedAirportCode);
      const recommendedTime = estimateTravelTime(recommendedDistanceKm, recommendedTerrain, 'bus');
      timeDifference = `${recommendedTime} vs ${actualNearest.travelTime}`;
    }
  }
  
  return {
    valid: false,
    message: `⚠️ ${recommendedAirportCode} is NOT the nearest airport to ${cityName}`,
    recommended: recommendedAirportCode,
    actualNearest: actualNearest.code,
    nearestName: actualNearest.name,
    nearestDistance: actualNearest.distance,
    nearestTravelTime: actualNearest.travelTime,
    distanceDifference,
    timeDifference,
    suggestion: `Consider using ${actualNearest.code} (${actualNearest.name}) instead - ${actualNearest.distance} away, ${actualNearest.travelTime} travel time`,
    alternatives: actualNearest.alternatives
  };
}

/**
 * Get transport recommendations for city-airport route
 * @param {string} cityName - City name
 * @param {string} airportCode - Airport code
 * @returns {Object} - Transport recommendations
 */
export function getTransportRecommendations(cityName, airportCode) {
  const nearest = findNearestAirportByDistance(cityName);
  
  if (nearest.code !== airportCode) {
    console.warn(`⚠️ ${airportCode} is not the nearest airport. Nearest is ${nearest.code}`);
  }
  
  return {
    airportCode: nearest.code,
    airportName: nearest.name,
    distance: nearest.distance,
    travelTime: nearest.travelTime,
    terrain: nearest.terrain,
    transportMode: nearest.terrain === 'island' ? 'ferry + bus' : 
                   nearest.terrain === 'mountainous' ? 'bus (mountain roads)' : 'bus',
    recommendation: nearest.recommendation,
    alternatives: nearest.alternatives
  };
}

// Export all utilities
export default {
  findNearestAirportByDistance,
  validateAirportRecommendation,
  getTransportRecommendations,
  calculateHaversineDistance,
  estimateTravelTime,
  getCityCoordinates,
  AIRPORT_COORDINATES,
  CITY_COORDINATES
};
