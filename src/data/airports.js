/**
 * TravelRover - Philippine Airports Database
 * 
 * Centralized source of truth for all Philippine airport data.
 * This consolidates airport information from:
 * - src/config/flightAgent.jsx
 * - src/view-trip/components/travel-bookings/FlightBooking.jsx
 * - travel-backend/langgraph_agents/agents/coordinator.py
 * 
 * @created 2025-11-06 - Code Consolidation Phase 2
 */

// ==========================================
// AIRPORT STATUS ENUMS
// ==========================================
export const AIRPORT_STATUS = {
  ACTIVE: 'active',               // Full commercial service
  LIMITED: 'limited',             // Reduced/seasonal service
  INACTIVE: 'inactive',           // No commercial service
  MILITARY: 'military',           // Military use only
  PRIVATE: 'private',             // Private/charter only
};

// ==========================================
// MAIN AIRPORT DATABASE
// ==========================================
export const PHILIPPINE_AIRPORTS = {
  // === LUZON - METRO MANILA ===
  'MNL': {
    code: 'MNL',
    name: 'Ninoy Aquino International Airport',
    city: 'Manila',
    region: 'Metro Manila',
    regionCode: 'ncr',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 14.5086, lng: 121.0194 },
    aliases: ['Manila', 'Metro Manila', 'Manila City', 'Quezon', 'Quezon City', 
              'Pasay', 'Makati', 'Taguig', 'San Juan', 'Las Piñas', 'Caloocan', 'Parañaque']
  },

  // === LUZON - CENTRAL ===
  'CRK': {
    code: 'CRK',
    name: 'Clark International Airport',
    city: 'Angeles City',
    region: 'Pampanga',
    regionCode: 'central-luzon',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 15.1859, lng: 120.5600 },
    aliases: ['Pampanga', 'Angeles', 'Angeles City', 'Clark', 'Tarlac', 
              'Nueva Ecija', 'Cabanatuan', 'San Fernando (La Union)', 'Dagupan']
  },

  'SFS': {
    code: 'SFS',
    name: 'Subic Bay International Airport',
    city: 'Subic',
    region: 'Zambales',
    regionCode: 'central-luzon',
    status: AIRPORT_STATUS.LIMITED,
    type: 'domestic',
    coordinates: { lat: 14.7944, lng: 120.2711 },
    aliases: ['Subic']
  },

  // === LUZON - NORTH (CORDILLERA) ===
  'BAG': {
    code: 'BAG',
    name: 'Loakan Airport',
    city: 'Baguio',
    region: 'Benguet',
    regionCode: 'car',
    status: AIRPORT_STATUS.INACTIVE,
    type: 'domestic',
    coordinates: { lat: 16.3751, lng: 120.6200 },
    aliases: ['Baguio', 'Baguio City', 'La Trinidad', 'Benguet'],
    alternatives: ['CRK'],
    alternativeNames: ['Clark International Airport'],
    transport: 'Bus from Clark (4-5 hours) or Manila (6-7 hours)',
    travelTime: '4-7 hours',
    recommendation: 'Fly to Clark (CRK) then take bus to Baguio.',
    notes: 'Loakan Airport is inactive. Best route: Fly to Clark → Bus to Baguio.'
  },

  'TUG': {
    code: 'TUG',
    name: 'Tuguegarao Airport',
    city: 'Tuguegarao',
    region: 'Cagayan',
    regionCode: 'cagayan-valley',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 17.6433, lng: 121.7331 },
    aliases: ['Tuguegarao', 'Cagayan', 'Mountain Province', 'Ifugao']
  },

  // === LUZON - ILOCOS ===
  'LAO': {
    code: 'LAO',
    name: 'Laoag International Airport',
    city: 'Laoag',
    region: 'Ilocos Norte',
    regionCode: 'ilocos',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 18.1781, lng: 120.5319 },
    aliases: ['Laoag', 'Ilocos Norte', 'Ilocos Sur', 'Vigan', 'Abra']
  },

  // === LUZON - SOUTH ===
  'BSO': {
    code: 'BSO',
    name: 'Basa Air Base',
    city: 'Batangas',
    region: 'Batangas',
    regionCode: 'calabarzon',
    status: AIRPORT_STATUS.LIMITED,
    type: 'military',
    coordinates: { lat: 14.5747, lng: 120.4923 },
    aliases: ['Batangas', 'Batangas City']
  },

  'WNP': {
    code: 'WNP',
    name: 'Naga Airport',
    city: 'Naga',
    region: 'Camarines Sur',
    regionCode: 'bicol',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 13.5849, lng: 123.2704 },
    aliases: ['Naga', 'Naga City'],
    notes: 'Active service (2x daily to Manila)'
  },

  'LGP': {
    code: 'LGP',
    name: 'Legazpi Airport',
    city: 'Legazpi',
    region: 'Albay',
    regionCode: 'bicol',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 13.1575, lng: 123.7350 },
    aliases: ['Legazpi', 'Legazpi City']
  },

  'DRP': {
    code: 'DRP',
    name: 'Sorsogon Airport',
    city: 'Sorsogon',
    region: 'Sorsogon',
    regionCode: 'bicol',
    status: AIRPORT_STATUS.LIMITED,
    type: 'domestic',
    coordinates: { lat: 12.9686, lng: 124.0069 },
    aliases: ['Sorsogon']
  },

  // === VISAYAS - CEBU ===
  'CEB': {
    code: 'CEB',
    name: 'Mactan-Cebu International Airport',
    city: 'Cebu',
    region: 'Cebu',
    regionCode: 'central-visayas',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 10.3075, lng: 123.9792 },
    aliases: ['Cebu', 'Cebu City', 'Mactan']
  },

  // === VISAYAS - NEGROS ===
  'DGT': {
    code: 'DGT',
    name: 'Sibulan Airport',
    city: 'Dumaguete',
    region: 'Negros Oriental',
    regionCode: 'central-visayas',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 9.3337, lng: 123.3004 },
    aliases: ['Dumaguete', 'Dumaguete City']
  },

  'BCD': {
    code: 'BCD',
    name: 'Bacolod-Silay Airport',
    city: 'Bacolod',
    region: 'Negros Occidental',
    regionCode: 'western-visayas',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 10.7764, lng: 123.0147 },
    aliases: ['Bacolod', 'Bacolod City']
  },

  // === VISAYAS - ILOILO ===
  'ILO': {
    code: 'ILO',
    name: 'Iloilo International Airport',
    city: 'Iloilo',
    region: 'Iloilo',
    regionCode: 'western-visayas',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 10.8331, lng: 122.4933 },
    aliases: ['Iloilo', 'Iloilo City']
  },

  // === VISAYAS - BOHOL ===
  'TAG': {
    code: 'TAG',
    name: 'Bohol-Panglao International Airport',
    city: 'Tagbilaran',
    region: 'Bohol',
    regionCode: 'central-visayas',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 9.5907, lng: 123.8531 },
    aliases: ['Bohol', 'Tagbilaran', 'Tagbilaran City', 'Panglao']
  },

  // === VISAYAS - AKLAN ===
  'KLO': {
    code: 'KLO',
    name: 'Kalibo International Airport',
    city: 'Kalibo',
    region: 'Aklan',
    regionCode: 'western-visayas',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 11.6794, lng: 122.3761 },
    aliases: ['Kalibo', 'Boracay', 'Aklan']
  },

  'MPH': {
    code: 'MPH',
    name: 'Caticlan Airport (Godofredo P. Ramos)',
    city: 'Caticlan',
    region: 'Aklan',
    regionCode: 'western-visayas',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 11.9244, lng: 121.9539 },
    aliases: ['Caticlan', 'Boracay', 'Malay']
  },

  // === VISAYAS - CAPIZ ===
  'RXS': {
    code: 'RXS',
    name: 'Roxas Airport',
    city: 'Roxas',
    region: 'Capiz',
    regionCode: 'western-visayas',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 11.5977, lng: 122.7519 },
    aliases: ['Roxas', 'Roxas City']
  },

  // === MINDANAO - DAVAO ===
  'DVO': {
    code: 'DVO',
    name: 'Francisco Bangoy International Airport',
    city: 'Davao',
    region: 'Davao del Sur',
    regionCode: 'davao',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 7.1255, lng: 125.6456 },
    aliases: ['Davao', 'Davao City', 'City of Mati']
  },

  // === MINDANAO - CAGAYAN DE ORO ===
  'CGY': {
    code: 'CGY',
    name: 'Laguindingan Airport',
    city: 'Cagayan de Oro',
    region: 'Misamis Oriental',
    regionCode: 'northern-mindanao',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 8.6017, lng: 124.4567 },
    aliases: ['Cagayan', 'Cagayan de Oro']
  },

  // === MINDANAO - CARAGA ===
  'BXU': {
    code: 'BXU',
    name: 'Bancasi Airport',
    city: 'Butuan',
    region: 'Agusan del Norte',
    regionCode: 'caraga',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 8.9515, lng: 125.4789 },
    aliases: ['Butuan']
  },

  'SUG': {
    code: 'SUG',
    name: 'Surigao Airport',
    city: 'Surigao',
    region: 'Surigao del Norte',
    regionCode: 'caraga',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 9.7558, lng: 125.4811 },
    aliases: ['Surigao']
  },

  // === MINDANAO - ZAMBOANGA ===
  'ZAM': {
    code: 'ZAM',
    name: 'Zamboanga International Airport',
    city: 'Zamboanga',
    region: 'Zamboanga del Sur',
    regionCode: 'zamboanga',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 6.9224, lng: 122.0596 },
    aliases: ['Zamboanga', 'Zamboanga City']
  },

  // === MINDANAO - COTABATO ===
  'CBO': {
    code: 'CBO',
    name: 'Cotabato Airport (Awang)',
    city: 'Cotabato',
    region: 'Maguindanao',
    regionCode: 'soccsksargen',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'domestic',
    coordinates: { lat: 7.1653, lng: 124.2097 },
    aliases: ['Cotabato']
  },

  // === MINDANAO - GENERAL SANTOS ===
  'GES': {
    code: 'GES',
    name: 'General Santos International Airport',
    city: 'General Santos',
    region: 'South Cotabato',
    regionCode: 'soccsksargen',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 6.0580, lng: 125.0961 },
    aliases: ['GenSan', 'General Santos']
  },

  // === PALAWAN ===
  'PPS': {
    code: 'PPS',
    name: 'Puerto Princesa International Airport',
    city: 'Puerto Princesa',
    region: 'Palawan',
    regionCode: 'mimaropa',
    status: AIRPORT_STATUS.ACTIVE,
    type: 'international',
    coordinates: { lat: 9.7421, lng: 118.7588 },
    aliases: ['Puerto Princesa', 'Palawan']
  },
};

// ==========================================
// AIRPORT CATEGORIES
// ==========================================

// Major international airports (primary hubs)
export const INTERNATIONAL_AIRPORTS = ['MNL', 'CEB', 'CRK', 'DVO', 'ILO', 'KLO', 'LAO', 'ZAM', 'GES', 'PPS', 'TAG'];

// Active domestic airports with regular service
export const ACTIVE_DOMESTIC_AIRPORTS = ['TUG', 'WNP', 'LGP', 'DGT', 'BCD', 'RXS', 'CGY', 'BXU', 'SUG', 'CBO', 'MPH'];

// Airports with limited/seasonal service
export const LIMITED_SERVICE_AIRPORTS = ['BAG', 'SFS', 'DRP', 'BSO'];

// Inactive airports (no commercial service)
export const INACTIVE_AIRPORTS = ['BAG'];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get airport by code
 * @param {string} code - 3-letter airport code (e.g., 'MNL')
 * @returns {Object|null} Airport object or null if not found
 */
export function getAirportByCode(code) {
  if (!code) return null;
  const upperCode = code.toUpperCase().trim();
  return PHILIPPINE_AIRPORTS[upperCode] || null;
}

/**
 * Get airport code from city/location name
 * @param {string} location - City or location name
 * @returns {string} Airport code (defaults to 'MNL' if not found)
 */
export function getAirportCode(location) {
  if (!location) return 'MNL';

  // If already a 3-letter code, return it
  const trimmed = location.trim();
  if (/^[A-Z]{3}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Normalize location for matching
  const locationLower = location.toLowerCase();
  const city = location.split(',')[0].trim().toLowerCase();

  // Search through all airports
  for (const [code, airport] of Object.entries(PHILIPPINE_AIRPORTS)) {
    const cityLower = airport.city.toLowerCase();
    const regionLower = airport.region.toLowerCase();

    // Exact city match
    if (city === cityLower || locationLower === cityLower) {
      return code;
    }

    // Exact region match
    if (city === regionLower || locationLower === regionLower) {
      return code;
    }

    // Check aliases
    if (airport.aliases) {
      for (const alias of airport.aliases) {
        const aliasLower = alias.toLowerCase();
        if (city === aliasLower || locationLower.includes(aliasLower)) {
          return code;
        }
      }
    }

    // Partial matching
    if (city.includes(cityLower) || cityLower.includes(city)) {
      return code;
    }
  }

  // Default to Manila
  console.warn(`⚠️ No airport code found for "${location}", defaulting to MNL`);
  return 'MNL';
}

/**
 * Get airports by region
 * @param {string} regionCode - Region code (e.g., 'ncr', 'central-visayas')
 * @returns {Array} Array of airport objects
 */
export function getAirportsByRegion(regionCode) {
  return Object.values(PHILIPPINE_AIRPORTS).filter(
    airport => airport.regionCode === regionCode
  );
}

/**
 * Get nearest major airport to a location
 * @param {string} location - City or location name
 * @returns {Object|null} Nearest major airport object
 */
export function getNearestMajorAirport(location) {
  const code = getAirportCode(location);
  const airport = getAirportByCode(code);

  if (!airport) return getAirportByCode('MNL');

  // If it's already a major airport, return it
  if (INTERNATIONAL_AIRPORTS.includes(code) || ACTIVE_DOMESTIC_AIRPORTS.includes(code)) {
    return airport;
  }

  // If it has alternatives (inactive/limited service), return first alternative
  if (airport.alternatives && airport.alternatives.length > 0) {
    return getAirportByCode(airport.alternatives[0]);
  }

  // Return itself if active but not major
  return airport;
}

/**
 * Check if airport is active for commercial flights
 * @param {string} code - Airport code
 * @returns {boolean} True if airport has active commercial service
 */
export function isAirportActive(code) {
  const airport = getAirportByCode(code);
  if (!airport) return false;

  return airport.status === AIRPORT_STATUS.ACTIVE;
}

/**
 * Get airport status information
 * @param {string} code - Airport code
 * @returns {Object} Status information with message and recommendations
 */
export function getAirportStatusInfo(code) {
  const airport = getAirportByCode(code);
  
  if (!airport) {
    return {
      status: 'unknown',
      message: 'Airport not found',
      alternatives: ['MNL'],
    };
  }

  if (airport.status === AIRPORT_STATUS.ACTIVE) {
    return {
      status: 'active',
      message: `${airport.name} has regular commercial flights`,
    };
  }

  if (airport.status === AIRPORT_STATUS.LIMITED) {
    return {
      status: 'limited',
      message: `${airport.name} has limited or seasonal service`,
      notes: airport.notes,
    };
  }

  if (airport.status === AIRPORT_STATUS.INACTIVE) {
    return {
      status: 'inactive',
      message: airport.recommendation || `${airport.name} has no commercial flights`,
      alternatives: airport.alternatives || ['MNL'],
      alternativeNames: airport.alternativeNames || [],
      transport: airport.transport || 'Alternative transport required',
      travelTime: airport.travelTime || 'Varies',
      notes: airport.notes,
    };
  }

  return {
    status: airport.status,
    message: `${airport.name} - ${airport.status}`,
  };
}

/**
 * Get all airports with their codes for dropdown/autocomplete
 * @param {boolean} activeOnly - If true, only return active airports
 * @returns {Array} Array of {code, name, city} objects
 */
export function getAirportList(activeOnly = false) {
  return Object.values(PHILIPPINE_AIRPORTS)
    .filter(airport => !activeOnly || airport.status === AIRPORT_STATUS.ACTIVE)
    .map(airport => ({
      code: airport.code,
      name: airport.name,
      city: airport.city,
      region: airport.region,
      type: airport.type,
      status: airport.status,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ==========================================
// EXPORTS
// ==========================================
export default {
  PHILIPPINE_AIRPORTS,
  AIRPORT_STATUS,
  INTERNATIONAL_AIRPORTS,
  ACTIVE_DOMESTIC_AIRPORTS,
  LIMITED_SERVICE_AIRPORTS,
  INACTIVE_AIRPORTS,
  getAirportByCode,
  getAirportCode,
  getAirportsByRegion,
  getNearestMajorAirport,
  isAirportActive,
  getAirportStatusInfo,
  getAirportList,
};
