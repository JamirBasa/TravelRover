/**
 * Philippine Direct Flight Routes Database
 * Based on major domestic airlines: Philippine Airlines, Cebu Pacific, AirAsia Philippines
 * 
 * This database helps determine if direct flights are available between cities,
 * enabling smarter transport mode recommendations (direct flight > ground transport > connecting flight)
 * 
 * Last Updated: November 2025
 */

/**
 * Direct flight route data structure:
 * - routes: Array of destination airport codes with direct service
 * - frequency: Typical daily flights
 * - airlines: Operating carriers
 * - notes: Special considerations (seasonal, limited, etc.)
 */

export const DIRECT_FLIGHT_ROUTES = {
  // ==========================================
  // MAJOR HUBS (High connectivity)
  // ==========================================
  
  'MNL': { // Manila (Primary hub)
    routes: [
      // LUZON
      'CRK', 'LAO', 'TUG', 'LGP', 'WNP',
      // VISAYAS
      'CEB', 'ILO', 'BCD', 'TAG', 'DGT', 'TAC', 'KLO', 'RXS',
      // MINDANAO
      'DVO', 'CGY', 'ZAM', 'BXU', 'GES', 'CBO', 'DPL', 'OZC', // Removed PAG - no direct flights
      // PALAWAN
      'PPS'
    ],
    frequency: 'multiple daily',
    airlines: ['PAL', 'CebuPacific', 'AirAsia'],
    notes: 'Primary hub - direct flights to all major cities'
  },

  'CRK': { // Clark (Secondary hub)
    routes: [
      'MNL',
      // VISAYAS
      'CEB', 'ILO', 'BCD', 'KLO',
      // MINDANAO
      'DVO', 'CGY', 'ZAM', 'GES',
      // PALAWAN
      'PPS'
    ],
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific', 'AirAsia'],
    notes: 'Alternative Manila hub with international flights'
  },

  'CEB': { // Cebu (Major Visayas hub)
    routes: [
      // LUZON
      'MNL', 'CRK',
      // VISAYAS
      'ILO', 'BCD', 'TAG', 'DGT', 'TAC', 'KLO',
      // MINDANAO
      'DVO', 'CGY', 'ZAM', 'BXU', 'GES', 'CBO', 'DPL', 'OZC', // Removed PAG - no direct flights
      // PALAWAN
      'PPS'
    ],
    frequency: 'multiple daily',
    airlines: ['PAL', 'CebuPacific', 'AirAsia'],
    notes: 'Visayas hub - excellent connectivity to Mindanao'
  },

  'DVO': { // Davao (Major Mindanao hub)
    routes: [
      // LUZON
      'MNL', 'CRK',
      // VISAYAS
      'CEB', 'ILO', 'BCD',
      // MINDANAO
      'CGY', 'ZAM', 'GES', 'CBO',
      // PALAWAN
      'PPS'
    ],
    frequency: 'multiple daily',
    airlines: ['PAL', 'CebuPacific', 'AirAsia'],
    notes: 'Mindanao hub - gateway to southern Philippines'
  },

  // ==========================================
  // REGIONAL AIRPORTS (Moderate connectivity)
  // ==========================================

  'CGY': { // Cagayan de Oro
    routes: ['MNL', 'CRK', 'CEB', 'DVO', 'ILO'], // Removed ZAM - requires connections
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific', 'AirAsia'],
    notes: 'Northern Mindanao hub'
  },

  'ZAM': { // Zamboanga
    routes: ['MNL', 'CRK', 'CEB', 'DVO', 'ILO', 'OZC'], // Removed CGY - requires connections
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Western Mindanao hub'
  },

  'ILO': { // Iloilo
    routes: ['MNL', 'CRK', 'CEB', 'DVO', 'CGY', 'ZAM', 'BCD', 'PPS'],
    frequency: 'multiple daily',
    airlines: ['PAL', 'CebuPacific', 'AirAsia'],
    notes: 'Western Visayas hub'
  },

  'BCD': { // Bacolod
    routes: ['MNL', 'CRK', 'CEB', 'DVO', 'ILO'],
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Negros Occidental hub'
  },

  'PPS': { // Puerto Princesa (Palawan)
    routes: ['MNL', 'CRK', 'CEB', 'ILO', 'DVO'],
    frequency: 'multiple daily',
    airlines: ['PAL', 'CebuPacific', 'AirAsia'],
    notes: 'Palawan tourism hub'
  },

  'GES': { // General Santos
    routes: ['MNL', 'CRK', 'CEB', 'DVO'],
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Southern Mindanao'
  },

  'TAG': { // Bohol-Panglao (Tagbilaran)
    routes: ['MNL', 'CEB', 'DVO'],
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Bohol tourism hub, new international airport'
  },

  'KLO': { // Kalibo (Boracay gateway)
    routes: ['MNL', 'CRK', 'CEB'],
    frequency: 'multiple daily',
    airlines: ['PAL', 'CebuPacific', 'AirAsia'],
    notes: 'Boracay access, high tourist traffic'
  },

  // ==========================================
  // SMALLER AIRPORTS (Limited connectivity)
  // ==========================================

  'LAO': { // Laoag
    routes: ['MNL'],
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Ilocos Norte - Manila only'
  },

  'TUG': { // Tuguegarao
    routes: ['MNL'],
    frequency: 'few per week',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Cagayan Valley - limited service'
  },

  'LGP': { // Legazpi
    routes: ['MNL'],
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Bicol region - Manila only'
  },

  'WNP': { // Naga
    routes: ['MNL'],
    frequency: 'few per week',
    airlines: ['CebuPacific'],
    notes: 'Bicol region - limited service'
  },

  'DGT': { // Dumaguete
    routes: ['MNL', 'CEB'],
    frequency: 'daily',
    airlines: ['CebuPacific'],
    notes: 'Negros Oriental - limited routes'
  },

  'TAC': { // Tacloban
    routes: ['MNL', 'CEB'],
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Eastern Visayas'
  },

  'RXS': { // Roxas
    routes: ['MNL', 'CEB'],
    frequency: 'few per week',
    airlines: ['CebuPacific'],
    notes: 'Capiz - limited service'
  },

  'BXU': { // Butuan
    routes: ['MNL', 'CEB'],
    frequency: 'daily',
    airlines: ['PAL', 'CebuPacific'],
    notes: 'Caraga region'
  },

  'CBO': { // Cotabato
    routes: ['MNL', 'CEB', 'DVO'],
    frequency: 'few per week',
    airlines: ['PAL'],
    notes: 'BARMM region - limited service'
  },

  'DPL': { // Dipolog
    routes: ['MNL', 'CEB'],
    frequency: 'few per week',
    airlines: ['CebuPacific'],
    notes: 'Zamboanga del Norte - limited service'
  },

  'OZC': { // Ozamiz
    routes: ['MNL', 'CEB', 'ZAM'],
    frequency: 'few per week',
    airlines: ['CebuPacific'],
    notes: 'Misamis Occidental - limited service'
  },

  'PAG': { // Pagadian
    routes: [], // No direct flights - airport has limited/no commercial service
    frequency: 'none',
    airlines: [],
    notes: 'Zamboanga del Sur - No direct flights. Use Zamboanga (ZAM) + 3hr ground transport.'
  },

  // ==========================================
  // VERY LIMITED / SEASONAL AIRPORTS
  // ==========================================

  'MBL': { // Malaybalay
    routes: [],
    frequency: 'none',
    airlines: [],
    notes: 'No regular commercial service - fly to CGY instead'
  },

  'SUG': { // Surigao
    routes: ['CEB'],
    frequency: 'seasonal',
    airlines: ['CebuPacific'],
    notes: 'Very limited seasonal service'
  },
};

/**
 * Check if direct flight exists between two airports
 * @param {string} origin - Origin airport code (e.g., 'MNL')
 * @param {string} destination - Destination airport code (e.g., 'CEB')
 * @returns {Object|null} Flight info or null if no direct flight
 */
export function hasDirectFlight(origin, destination) {
  if (!origin || !destination) return null;
  
  const originUpper = origin.toUpperCase();
  const destUpper = destination.toUpperCase();
  
  // Same airport
  if (originUpper === destUpper) {
    return {
      direct: false,
      reason: 'Same city - no flight needed'
    };
  }
  
  // Check if origin airport has routes
  const originRoutes = DIRECT_FLIGHT_ROUTES[originUpper];
  if (!originRoutes) {
    return {
      direct: false,
      reason: 'Origin airport not in database'
    };
  }
  
  // Check if destination is in origin's route list
  const hasDirect = originRoutes.routes.includes(destUpper);
  
  if (hasDirect) {
    return {
      direct: true,
      frequency: originRoutes.frequency,
      airlines: originRoutes.airlines,
      notes: originRoutes.notes,
      route: `${originUpper} → ${destUpper}`
    };
  }
  
  // Check reverse (bidirectional routes)
  const destRoutes = DIRECT_FLIGHT_ROUTES[destUpper];
  if (destRoutes && destRoutes.routes.includes(originUpper)) {
    return {
      direct: true,
      frequency: destRoutes.frequency,
      airlines: destRoutes.airlines,
      notes: destRoutes.notes,
      route: `${originUpper} ← ${destUpper}`,
      bidirectional: true
    };
  }
  
  return {
    direct: false,
    reason: 'No direct flights - connecting flight required',
    suggestedHubs: findBestConnectingHub(originUpper, destUpper)
  };
}

/**
 * Find best connecting hub for routes without direct flights
 * @param {string} origin - Origin airport code
 * @param {string} destination - Destination airport code
 * @returns {Array} Suggested hub airports
 */
function findBestConnectingHub(origin, destination) {
  const hubs = ['MNL', 'CEB', 'DVO', 'CRK', 'ILO'];
  const suggestions = [];
  
  for (const hub of hubs) {
    const originRoutes = DIRECT_FLIGHT_ROUTES[origin];
    const hubRoutes = DIRECT_FLIGHT_ROUTES[hub];
    
    if (originRoutes && hubRoutes) {
      const hasOriginToHub = originRoutes.routes.includes(hub);
      const hasHubToDest = hubRoutes.routes.includes(destination);
      
      if (hasOriginToHub && hasHubToDest) {
        suggestions.push({
          hub,
          route: `${origin} → ${hub} → ${destination}`
        });
      }
    }
  }
  
  return suggestions;
}

/**
 * Get flight frequency category
 * @param {string} frequency - Frequency string
 * @returns {string} Category (high/medium/low)
 */
export function getFlightFrequencyCategory(frequency) {
  if (!frequency) return 'unknown';
  
  const freq = frequency.toLowerCase();
  
  if (freq.includes('multiple daily')) return 'high';
  if (freq.includes('daily')) return 'medium';
  if (freq.includes('few') || freq.includes('seasonal')) return 'low';
  if (freq.includes('none')) return 'none';
  
  return 'unknown';
}

export default {
  DIRECT_FLIGHT_ROUTES,
  hasDirectFlight,
  getFlightFrequencyCategory,
};
