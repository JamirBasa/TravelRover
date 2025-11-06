/**
 * TravelRover - Budget Constants
 * 
 * Centralized pricing constants for trip budget calculations.
 * This consolidates budget data from:
 * - src/utils/budgetCompliance.js (FILIPINO_PRICE_RANGES)
 * - src/utils/budgetEstimator.js (price ranges scattered throughout)
 * 
 * All prices are in Philippine Pesos (₱) and reflect 2025 market rates.
 * 
 * @created 2025-11-06 - Code Consolidation Phase 3
 */

// ==========================================
// ACCOMMODATION PRICE RANGES (per night)
// ==========================================
export const ACCOMMODATION_RANGES = {
  // Budget-Friendly: Hostels, guesthouses, budget hotels
  BUDGET: {
    min: 800,
    max: 1500,
    average: 1150,
    label: 'Budget-Friendly',
    description: 'Hostels, guesthouses, budget hotels',
  },

  // Budget-Friendly (legacy naming for backward compatibility)
  BUDGET_FRIENDLY: {
    min: 800,
    max: 1500,
    average: 1150,
    label: 'Budget-Friendly',
    description: 'Hostels, guesthouses, budget hotels',
  },

  // Mid-Range: 3-star hotels, decent amenities
  MODERATE: {
    min: 1500,
    max: 3000,
    average: 2250,
    label: 'Moderate',
    description: 'Mid-range hotels (3-star)',
  },

  // Mid-Range (legacy naming)
  MID_RANGE: {
    min: 1500,
    max: 3000,
    average: 2250,
    label: 'Moderate',
    description: 'Mid-range hotels (3-star)',
  },

  // Upscale: 4-star hotels, premium amenities
  UPSCALE: {
    min: 3000,
    max: 5000,
    average: 4000,
    label: 'Upscale',
    description: 'Upscale hotels (4-star)',
  },

  // Luxury: 5-star hotels, premium resorts
  LUXURY: {
    min: 5000,
    max: 15000,
    average: 10000,
    label: 'Luxury',
    description: 'Luxury hotels (5-star)',
  },
};

// ==========================================
// MEAL COST RANGES (per person, per meal)
// ==========================================
export const MEAL_COSTS = {
  // Street food and local eateries (carinderia)
  STREET_FOOD: {
    min: 50,
    max: 120,
    average: 85,
    label: 'Street Food',
    description: 'Carinderia, street vendors, local eateries',
  },

  // Fast food chains (Jollibee, McDonald's, etc.)
  FAST_FOOD: {
    min: 150,
    max: 250,
    average: 200,
    label: 'Fast Food',
    description: 'Fast food chains (Jollibee, McDonald\'s)',
  },

  // Casual dining restaurants
  CASUAL: {
    min: 250,
    max: 500,
    average: 375,
    label: 'Casual Dining',
    description: 'Casual restaurants, local cuisine',
  },

  // Mid-range restaurants
  MID_RANGE: {
    min: 400,
    max: 800,
    average: 600,
    label: 'Mid-Range',
    description: 'Mid-range restaurants, international cuisine',
  },

  // Fine dining
  FINE_DINING: {
    min: 800,
    max: 2000,
    average: 1400,
    label: 'Fine Dining',
    description: 'High-end restaurants, gourmet cuisine',
  },
};

// ==========================================
// TRANSPORT COST RANGES
// ==========================================
export const TRANSPORT_COSTS = {
  // Jeepney (iconic Philippine public transport)
  JEEPNEY: {
    min: 13,
    max: 25,
    average: 19,
    label: 'Jeepney',
    description: 'Traditional jeepney within city',
  },

  // City bus
  BUS_CITY: {
    min: 15,
    max: 25,
    average: 20,
    label: 'City Bus',
    description: 'Air-conditioned city bus',
  },

  // Provincial bus (per 100km)
  BUS_PROVINCIAL_PER_100KM: {
    min: 150,
    max: 300,
    average: 225,
    label: 'Provincial Bus',
    description: 'Long-distance bus per 100km',
  },

  // Tricycle (short distance)
  TRICYCLE: {
    min: 20,
    max: 50,
    average: 35,
    label: 'Tricycle',
    description: 'Motorized tricycle for short trips',
  },

  // Taxi
  TAXI: {
    base: 40,
    perKm: 13.5,
    average: 150,
    label: 'Taxi',
    description: 'Metered taxi',
  },

  // Grab/Taxi (airport to city)
  GRAB_AIRPORT: {
    min: 200,
    max: 500,
    average: 350,
    label: 'Airport Transfer',
    description: 'Grab/taxi from airport to city center',
  },
};

// ==========================================
// ACTIVITY/ATTRACTION COST RANGES
// ==========================================
export const ACTIVITY_COSTS = {
  // Free attractions (parks, beaches, churches)
  FREE: {
    min: 0,
    max: 0,
    average: 0,
    label: 'Free',
    description: 'Public beaches, parks, heritage sites',
  },

  // Government museums and sites
  GOVERNMENT: {
    min: 50,
    max: 150,
    average: 100,
    label: 'Museums/Sites',
    description: 'Government museums and historical sites',
  },

  // Theme parks
  THEME_PARK: {
    min: 800,
    max: 1200,
    average: 1000,
    label: 'Theme Parks',
    description: 'Enchanted Kingdom, Manila Ocean Park, etc.',
  },

  // Island hopping tours
  ISLAND_TOUR: {
    min: 800,
    max: 2500,
    average: 1650,
    label: 'Island Tours',
    description: 'Island hopping, boat tours',
  },

  // Scuba diving
  DIVING: {
    min: 2500,
    max: 4500,
    average: 3500,
    label: 'Scuba Diving',
    description: 'Scuba diving with equipment',
  },

  // General activities
  STANDARD_ACTIVITY: {
    min: 300,
    max: 800,
    average: 550,
    label: 'Standard Activity',
    description: 'Typical tourist activities',
  },
};

// ==========================================
// REGIONAL COST MULTIPLIERS
// ==========================================
// Cost of living index relative to Manila (1.0 = Manila baseline)
export const REGIONAL_COST_INDEX = {
  // Metro Manila
  ncr: 1.0,
  'metro-manila': 1.0,
  'national-capital-region': 1.0,

  // Luzon regions
  'r01': 0.85,              // Ilocos Region
  ilocos: 0.85,
  'r02': 0.80,              // Cagayan Valley
  'cagayan-valley': 0.80,
  'r03': 0.90,              // Central Luzon
  'central-luzon': 0.90,
  'r04a': 0.95,             // CALABARZON
  calabarzon: 0.95,
  'r04b': 0.75,             // MIMAROPA (Palawan)
  mimaropa: 0.75,
  'r05': 0.80,              // Bicol
  bicol: 0.80,
  car: 0.85,                // Cordillera (Baguio)
  cordillera: 0.85,

  // Visayas regions
  'r06': 0.85,              // Western Visayas (Iloilo, Bacolod)
  'western-visayas': 0.85,
  'r07': 0.95,              // Central Visayas (Cebu, Bohol)
  'central-visayas': 0.95,
  'r08': 0.75,              // Eastern Visayas (Leyte, Samar)
  'eastern-visayas': 0.75,

  // Mindanao regions
  'r09': 0.80,              // Zamboanga Peninsula
  zamboanga: 0.80,
  'r10': 0.85,              // Northern Mindanao
  'northern-mindanao': 0.85,
  'r11': 0.90,              // Davao Region
  davao: 0.90,
  'r12': 0.80,              // SOCCSKSARGEN
  soccsksargen: 0.80,
  'r13': 0.70,              // Caraga (Siargao)
  caraga: 0.70,
  barmm: 0.70,              // BARMM
};

// ==========================================
// DESTINATION-SPECIFIC MULTIPLIERS
// ==========================================
// Popular tourist destinations with premium pricing
export const DESTINATION_MULTIPLIERS = {
  // Premium island destinations
  boracay: 1.4,
  'boracay island': 1.4,
  palawan: 1.3,
  'el nido': 1.35,
  coron: 1.3,
  siargao: 1.25,
  amanpulo: 2.0,

  // Major cities (business centers)
  manila: 1.1,
  makati: 1.2,
  bgc: 1.25,
  'bonifacio global city': 1.25,
  taguig: 1.15,
  'quezon city': 1.05,
  cebu: 1.15,
  'cebu city': 1.15,
  davao: 1.0,
  'davao city': 1.0,
  baguio: 1.1,

  // Mid-range tourist destinations
  bohol: 1.0,
  panglao: 1.1,
  tagbilaran: 0.95,
  iloilo: 0.95,
  'iloilo city': 0.95,
  bacolod: 0.95,
  vigan: 0.90,
  batangas: 0.85,
  tagaytay: 0.95,

  // Budget-friendly destinations
  sagada: 0.80,
  banaue: 0.75,
  camiguin: 0.85,
  siquijor: 0.80,
  'puerto princesa': 0.90,
  dumaguete: 0.85,
  'general santos': 0.80,
  'cagayan de oro': 0.85,
};

// ==========================================
// CITY-SPECIFIC MULTIPLIERS (within regions)
// ==========================================
export const CITY_MULTIPLIERS = {
  // Metro Manila cities
  'Manila': 1.0,
  'Makati': 1.4,             // Business district
  'BGC': 1.5,                // Bonifacio Global City
  'Quezon City': 1.1,
  'Pasay': 1.0,
  'Mandaluyong': 1.2,

  // Cordillera cities
  'Baguio': 0.8,
  'Sagada': 0.6,

  // Calabarzon cities
  'Tagaytay': 0.9,
  'Batangas City': 0.7,

  // Ilocos cities
  'Vigan': 0.8,
  'Laoag': 0.7,

  // Central Visayas cities
  'Cebu City': 1.1,
  'Mactan': 1.0,
  'Bohol': 0.7,

  // Davao cities
  'Davao City': 0.9,

  // Palawan cities
  'El Nido': 1.2,
  'Coron': 1.1,
  'Puerto Princesa': 0.8,

  // Boracay
  'White Beach': 1.3,
};

// ==========================================
// BUDGET TIER MAPPINGS
// ==========================================
export const BUDGET_TIERS = {
  BUDGET: {
    accommodation: ACCOMMODATION_RANGES.BUDGET,
    meals: MEAL_COSTS.CASUAL,
    activities: ACTIVITY_COSTS.STANDARD_ACTIVITY,
    transport: TRANSPORT_COSTS.JEEPNEY,
    dailyMin: 2000,
    dailyMax: 3500,
    label: 'Budget-Friendly',
  },

  MODERATE: {
    accommodation: ACCOMMODATION_RANGES.MODERATE,
    meals: MEAL_COSTS.MID_RANGE,
    activities: ACTIVITY_COSTS.ISLAND_TOUR,
    transport: TRANSPORT_COSTS.GRAB_AIRPORT,
    dailyMin: 3500,
    dailyMax: 6000,
    label: 'Moderate',
  },

  LUXURY: {
    accommodation: ACCOMMODATION_RANGES.LUXURY,
    meals: MEAL_COSTS.FINE_DINING,
    activities: ACTIVITY_COSTS.DIVING,
    transport: TRANSPORT_COSTS.TAXI,
    dailyMin: 8000,
    dailyMax: 20000,
    label: 'Luxury',
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get accommodation range by budget tier
 * @param {string} tier - 'budget', 'moderate', or 'luxury'
 * @returns {Object} Accommodation price range
 */
export function getAccommodationRange(tier) {
  const normalizedTier = tier?.toLowerCase().replace(/[-_\s]/g, '');
  
  const tierMap = {
    budget: ACCOMMODATION_RANGES.BUDGET,
    budgetfriendly: ACCOMMODATION_RANGES.BUDGET,
    moderate: ACCOMMODATION_RANGES.MODERATE,
    midrange: ACCOMMODATION_RANGES.MODERATE,
    luxury: ACCOMMODATION_RANGES.LUXURY,
    upscale: ACCOMMODATION_RANGES.UPSCALE,
  };

  return tierMap[normalizedTier] || ACCOMMODATION_RANGES.MODERATE;
}

/**
 * Get meal cost range by budget tier
 * @param {string} tier - 'budget', 'moderate', or 'luxury'
 * @returns {Object} Meal cost range
 */
export function getMealCostRange(tier) {
  const normalizedTier = tier?.toLowerCase().replace(/[-_\s]/g, '');

  const tierMap = {
    budget: MEAL_COSTS.CASUAL,
    budgetfriendly: MEAL_COSTS.CASUAL,
    moderate: MEAL_COSTS.MID_RANGE,
    midrange: MEAL_COSTS.MID_RANGE,
    luxury: MEAL_COSTS.FINE_DINING,
  };

  return tierMap[normalizedTier] || MEAL_COSTS.MID_RANGE;
}

/**
 * Get activity cost range by budget tier
 * @param {string} tier - 'budget', 'moderate', or 'luxury'
 * @returns {Object} Activity cost range
 */
export function getActivityCostRange(tier) {
  const normalizedTier = tier?.toLowerCase().replace(/[-_\s]/g, '');

  const tierMap = {
    budget: ACTIVITY_COSTS.STANDARD_ACTIVITY,
    budgetfriendly: ACTIVITY_COSTS.STANDARD_ACTIVITY,
    moderate: ACTIVITY_COSTS.ISLAND_TOUR,
    midrange: ACTIVITY_COSTS.ISLAND_TOUR,
    luxury: ACTIVITY_COSTS.DIVING,
  };

  return tierMap[normalizedTier] || ACTIVITY_COSTS.STANDARD_ACTIVITY;
}

/**
 * Get regional cost multiplier
 * @param {string} region - Region name or code
 * @returns {number} Cost multiplier (default: 1.0)
 */
export function getRegionalMultiplier(region) {
  if (!region) return 1.0;
  
  const normalized = region.toLowerCase().replace(/[-_\s]/g, '');
  return REGIONAL_COST_INDEX[normalized] || REGIONAL_COST_INDEX[region.toLowerCase()] || 1.0;
}

/**
 * Get destination-specific multiplier
 * @param {string} destination - City or destination name
 * @returns {number} Cost multiplier (default: 1.0)
 */
export function getDestinationMultiplier(destination) {
  if (!destination) return 1.0;

  const normalized = destination.toLowerCase().trim();
  
  // Check destination multipliers first
  if (DESTINATION_MULTIPLIERS[normalized]) {
    return DESTINATION_MULTIPLIERS[normalized];
  }

  // Check city multipliers
  if (CITY_MULTIPLIERS[destination]) {
    return CITY_MULTIPLIERS[destination];
  }

  return 1.0;
}

/**
 * Calculate adjusted price based on region and destination
 * @param {number} basePrice - Base price in PHP
 * @param {string} region - Region code
 * @param {string} destination - Destination name
 * @returns {number} Adjusted price
 */
export function calculateAdjustedPrice(basePrice, region, destination) {
  const regionalMultiplier = getRegionalMultiplier(region);
  const destinationMultiplier = getDestinationMultiplier(destination);
  
  return Math.round(basePrice * regionalMultiplier * destinationMultiplier);
}

// ==========================================
// EXPORTS
// ==========================================
export default {
  ACCOMMODATION_RANGES,
  MEAL_COSTS,
  TRANSPORT_COSTS,
  ACTIVITY_COSTS,
  REGIONAL_COST_INDEX,
  DESTINATION_MULTIPLIERS,
  CITY_MULTIPLIERS,
  BUDGET_TIERS,
  getAccommodationRange,
  getMealCostRange,
  getActivityCostRange,
  getRegionalMultiplier,
  getDestinationMultiplier,
  calculateAdjustedPrice,
};
