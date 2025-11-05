/**
 * Budget Estimation Utility
 * Estimates trip budgets based on destination, duration, travelers, and preferences
 * Tailored for Philippines destinations with accurate regional pricing
 * Includes nearest airport recommendations for cities without direct airports
 * NOW INCLUDES: Smart flight pricing based on booking timing
 */

import { 
  getDaysUntilDeparture, 
  getTimingPriceMultiplier,
  calculateTimingAdjustedFlightCost 
} from './flightPricingAnalyzer';

import { 
  findNearestAirportByDistance,
  validateAirportRecommendation 
} from './airportDistanceCalculator';

import { getLimitedServiceInfo } from './flightRecommendations';

// ========================================
// MAJOR AIRPORTS IN PHILIPPINES
// ========================================
const PHILIPPINE_AIRPORTS = {
  // Luzon - Major Airports
  'MNL': { name: 'Ninoy Aquino International Airport', city: 'Manila', region: 'ncr', type: 'international' },
  'CRK': { name: 'Clark International Airport', city: 'Angeles', region: 'r03', type: 'international' },
  'LAO': { name: 'Laoag International Airport', city: 'Laoag', region: 'r01', type: 'international' }, // ✅ FIXED: Changed to international
  // ❌ REMOVED BAG - No commercial service as of Oct 2025
  'LGP': { name: 'Legazpi Airport', city: 'Legazpi', region: 'r05', type: 'domestic' },
  'WNP': { name: 'Naga Airport', city: 'Naga', region: 'r05', type: 'domestic' }, // ✅ CORRECT: Has 2x daily to MNL
  
  // Visayas - Major Airports
  'CEB': { name: 'Mactan-Cebu International Airport', city: 'Cebu', region: 'r07', type: 'international' },
  'ILO': { name: 'Iloilo International Airport', city: 'Iloilo', region: 'r06', type: 'international' },
  'KLO': { name: 'Kalibo International Airport', city: 'Kalibo', region: 'r06', type: 'international' },
  'MPH': { name: 'Godofredo P. Ramos Airport (Caticlan)', city: 'Caticlan', region: 'r06', type: 'domestic' },
  'BCD': { name: 'Bacolod-Silay Airport', city: 'Bacolod', region: 'r06', type: 'domestic' },
  'TAG': { name: 'Tagbilaran Airport', city: 'Tagbilaran', region: 'r07', type: 'domestic' },
  'DGT': { name: 'Sibulan Airport', city: 'Dumaguete', region: 'r07', type: 'domestic' },
  'TAC': { name: 'Daniel Z. Romualdez Airport', city: 'Tacloban', region: 'r08', type: 'domestic' },
  
  // Mindanao - Major Airports
  'DVO': { name: 'Francisco Bangoy International Airport', city: 'Davao', region: 'r11', type: 'international' },
  'GES': { name: 'General Santos International Airport', city: 'General Santos', region: 'r12', type: 'domestic' },
  'CGY': { name: 'Laguindingan Airport', city: 'Cagayan de Oro', region: 'r10', type: 'domestic' },
  'ZAM': { name: 'Zamboanga International Airport', city: 'Zamboanga', region: 'r09', type: 'domestic' },
  'BXU': { name: 'Bancasi Airport', city: 'Butuan', region: 'r13', type: 'domestic' },
  'IAO': { name: 'Sayak Airport', city: 'Siargao', region: 'r13', type: 'domestic' },
  'CGM': { name: 'Camiguin Airport', city: 'Camiguin', region: 'r10', type: 'domestic' },
  
  // Palawan
  'PPS': { name: 'Puerto Princesa International Airport', city: 'Puerto Princesa', region: 'r04b', type: 'international' },
  'USU': { name: 'Francisco B. Reyes Airport', city: 'Coron', region: 'r04b', type: 'domestic' },
  'ENI': { name: 'El Nido Airport', city: 'El Nido', region: 'r04b', type: 'domestic' },
};

// ✅ CENTRALIZED: Get inactive airport data from single source
// Helper to check if a city/airport code is inactive
const checkInactiveAirport = (cityOrCode) => {
  const commonCodes = [
    "BAG", "VIG", "SAG", "BAN", "PAG", "HUN",  // Northern Luzon
    "SFE", "ANC",  // Central Luzon
    "LGZ", "DAR", "CAL", "DON", "MSB",  // Bicol
    "SJO", "PUG",  // Mindoro
    "ELN", "COR", "SAB", "BAL",  // Palawan
    "BOR", "GIM", "ANT",  // Panay
    "DUM", "SIQ", "DAU",  // Negros
    "PAN", "CHO", "AMO",  // Bohol
    "BANT", "MAL", "OSL", "MOA",  // Cebu
    "TUB", "SOH", "KAL",  // Leyte/Samar
    "CAM", "BUK", "ILG",  // Mindanao North
    "GLE", "BUR", "BIS", "BRI",  // Caraga
    "SAM", "MAT", "TBL",  // Davao
    "SAN", "BAS",  // Zamboanga
    "TAW", "SIT"  // Sulu/Tawi-Tawi
  ];
  
  const searchTerm = cityOrCode.toLowerCase();
  
  for (const code of commonCodes) {
    const info = getLimitedServiceInfo(code);
    if (info && (
      searchTerm.includes(info.name.toLowerCase()) ||
      searchTerm === code.toLowerCase()
    )) {
      return {
        code,
        city: info.name,
        status: 'No commercial service',
        nearestAlternative: info.alternatives[0],
        alternativeName: info.alternativeNames[0],
        travelTime: info.travelTime
      };
    }
  }
  
  return null;
};

// Regional cost of living indexes for Philippines (relative to Manila = 100)
const REGIONAL_COST_INDEX = {
  'ncr': 100,           // National Capital Region (Manila, Quezon City, Makati, BGC, Taguig)
  'r01': 85,            // Ilocos Region (Vigan, Laoag, La Union)
  'r02': 80,            // Cagayan Valley
  'r03': 90,            // Central Luzon (Pampanga, Zambales, Subic, Bataan)
  'r04a': 95,           // CALABARZON (Batangas, Tagaytay, Cavite, Laguna)
  'r04b': 75,           // MIMAROPA (Palawan, Marinduque, Romblon)
  'r05': 80,            // Bicol Region (Albay, Camarines, Sorsogon)
  'r06': 85,            // Western Visayas (Iloilo, Bacolod, Boracay, Aklan)
  'r07': 95,            // Central Visayas (Cebu, Bohol, Negros Oriental, Siquijor)
  'r08': 75,            // Eastern Visayas (Leyte, Samar, Biliran)
  'r09': 80,            // Zamboanga Peninsula
  'r10': 85,            // Northern Mindanao (Camiguin, Cagayan de Oro)
  'r11': 90,            // Davao Region (Davao City, Samal Island)
  'r12': 80,            // SOCCSKSARGEN
  'r13': 70,            // Caraga (Siargao, Surigao)
  'barmm': 70,          // BARMM
  'car': 85,            // Cordillera (Baguio, Sagada, Benguet)
};

// Popular tourist destinations with cost multipliers (1.0 = average, higher = more expensive)
const DESTINATION_MULTIPLIERS = {
  // Premium island destinations (higher costs due to tourism)
  'boracay': 1.4,
  'palawan': 1.3,
  'el nido': 1.35,
  'coron': 1.3,
  'siargao': 1.25,
  'amanpulo': 2.0,
  
  // Major cities (higher costs, more options)
  'manila': 1.1,
  'makati': 1.2,
  'bgc': 1.25,
  'bonifacio global city': 1.25,
  'taguig': 1.15,
  'quezon city': 1.05,
  'cebu': 1.15,
  'cebu city': 1.15,
  'davao': 1.0,
  'davao city': 1.0,
  'baguio': 1.1,
  
  // Mid-range tourist destinations
  'bohol': 1.0,
  'panglao': 1.1,
  'tagbilaran': 0.95,
  'iloilo': 0.95,
  'iloilo city': 0.95,
  'puerto princesa': 1.1,
  'tagaytay': 1.05,
  'batangas': 0.95,
  'nasugbu': 0.9,
  'zambales': 0.9,
  'la union': 0.95,
  'san juan': 0.95,
  'hundred islands': 0.85,
  
  // Budget-friendly destinations
  'vigan': 0.85,
  'sagada': 0.85,
  'dumaguete': 0.9,
  'camiguin': 0.85,
  'siquijor': 0.8,
  'banaue': 0.85,
  'pagudpud': 0.9,
  'albay': 0.85,
  'legazpi': 0.85,
  'donsol': 0.8,
};

// Base daily costs per person (in PHP) - realistic Philippines pricing
const BASE_DAILY_COSTS = {
  'budget-friendly': {
    accommodation: 800,      // Budget-friendly hotels/hostels (₱600-1000/night)
    food: 600,              // Local eateries, street food (₱150-250 per meal)
    activities: 400,        // Basic entrance fees, local tours
    transport: 300,         // Jeepney, tricycle, local buses
    miscellaneous: 200,     // Snacks, tips, small purchases
  },
  moderate: {
    accommodation: 2500,    // Mid-range hotels (₱2000-3000/night)
    food: 1200,            // Mix of local and tourist restaurants (₱300-500 per meal)
    activities: 800,       // Popular attractions, island hopping, guided tours
    transport: 500,        // Taxis, Grab, van rentals
    miscellaneous: 500,    // Shopping, extras, tips
  },
  luxury: {
    accommodation: 6000,    // High-end hotels/resorts (₱5000-8000+/night)
    food: 2500,            // Fine dining, resort restaurants (₱600-1000+ per meal)
    activities: 1500,      // Premium experiences, private tours, water sports
    transport: 1000,       // Private car/van, premium services
    miscellaneous: 1000,   // Shopping, spa, premium services
  },
};

/**
 * Get region code from location string
 * Maps cities/provinces to their Philippine regions
 */
export const getRegionCode = (location) => {
  if (!location) return 'ncr';
  
  const locationLower = location.toLowerCase();
  
  // Comprehensive mapping of cities/provinces to regions
  const regionMapping = {
    // NCR
    'manila': 'ncr', 'quezon city': 'ncr', 'makati': 'ncr', 'bgc': 'ncr',
    'bonifacio global city': 'ncr', 'taguig': 'ncr', 'pasig': 'ncr', 
    'mandaluyong': 'ncr', 'pasay': 'ncr', 'paranaque': 'ncr', 'las pinas': 'ncr',
    'muntinlupa': 'ncr', 'marikina': 'ncr', 'valenzuela': 'ncr', 'caloocan': 'ncr',
    'navotas': 'ncr', 'malabon': 'ncr', 'san juan': 'ncr',
    
    // Central Visayas (R07)
    'cebu': 'r07', 'cebu city': 'r07', 'bohol': 'r07', 'panglao': 'r07',
    'tagbilaran': 'r07', 'negros oriental': 'r07', 'dumaguete': 'r07',
    'siquijor': 'r07', 'lapu-lapu': 'r07', 'mactan': 'r07', 'moalboal': 'r07',
    
    // Western Visayas (R06)
    'boracay': 'r06', 'iloilo': 'r06', 'iloilo city': 'r06', 'aklan': 'r06',
    'kalibo': 'r06', 'bacolod': 'r06', 'negros occidental': 'r06',
    'roxas': 'r06', 'capiz': 'r06', 'antique': 'r06', 'guimaras': 'r06',
    
    // MIMAROPA (R04B)
    'palawan': 'r04b', 'puerto princesa': 'r04b', 'el nido': 'r04b', 
    'coron': 'r04b', 'marinduque': 'r04b', 'romblon': 'r04b',
    'occidental mindoro': 'r04b', 'oriental mindoro': 'r04b',
    
    // Davao Region (R11)
    'davao': 'r11', 'davao city': 'r11', 'samal': 'r11', 'samal island': 'r11',
    'davao del norte': 'r11', 'davao del sur': 'r11', 'davao oriental': 'r11',
    
    // CAR (Cordillera)
    'baguio': 'car', 'sagada': 'car', 'benguet': 'car', 'banaue': 'car',
    'ifugao': 'car', 'kalinga': 'car', 'mountain province': 'car',
    
    // Caraga (R13)
    'siargao': 'r13', 'surigao': 'r13', 'surigao del norte': 'r13',
    'surigao del sur': 'r13', 'agusan del norte': 'r13', 'agusan del sur': 'r13',
    'dinagat islands': 'r13',
    
    // Ilocos Region (R01)
    'vigan': 'r01', 'laoag': 'r01', 'pagudpud': 'r01', 'ilocos norte': 'r01',
    'ilocos sur': 'r01', 'la union': 'r01', 'san juan la union': 'r01',
    'pangasinan': 'r01', 'hundred islands': 'r01',
    
    // CALABARZON (R04A)
    'batangas': 'r04a', 'tagaytay': 'r04a', 'cavite': 'r04a', 'laguna': 'r04a',
    'quezon': 'r04a', 'rizal': 'r04a', 'lucena': 'r04a', 'nasugbu': 'r04a',
    'taal': 'r04a', 'tanay': 'r04a',
    
    // Central Luzon (R03)
    'zambales': 'r03', 'pampanga': 'r03', 'subic': 'r03', 'olongapo': 'r03',
    'angeles': 'r03', 'clark': 'r03', 'bataan': 'r03', 'tarlac': 'r03',
    'nueva ecija': 'r03', 'bulacan': 'r03', 'aurora': 'r03',
    
    // Northern Mindanao (R10)
    'camiguin': 'r10', 'cagayan de oro': 'r10', 'iligan': 'r10',
    'bukidnon': 'r10', 'misamis occidental': 'r10', 'misamis oriental': 'r10',
    
    // Bicol Region (R05)
    'albay': 'r05', 'legazpi': 'r05', 'mayon': 'r05', 'camarines sur': 'r05',
    'camarines norte': 'r05', 'sorsogon': 'r05', 'donsol': 'r05',
    'catanduanes': 'r05', 'masbate': 'r05', 'naga': 'r05',
  };
  
  // Check for matches
  for (const [keyword, region] of Object.entries(regionMapping)) {
    if (locationLower.includes(keyword)) {
      return region;
    }
  }
  
  return 'ncr'; // Default to NCR if no match
};

/**
 * Get destination-specific cost multiplier
 */
export const getDestinationMultiplier = (destination) => {
  if (!destination) return 1.0;
  
  const destLower = destination.toLowerCase();
  
  // Check for exact or partial matches
  for (const [keyword, multiplier] of Object.entries(DESTINATION_MULTIPLIERS)) {
    if (destLower.includes(keyword)) {
      return multiplier;
    }
  }
  
  return 1.0; // Default multiplier (average cost)
};

/**
 * Estimate flight costs based on route
 * Realistic pricing for domestic Philippines flights (round-trip per person)
 * NOW INCLUDES: Dynamic pricing based on booking timing
 */
export const estimateFlightCost = (departureLocation, destination, startDate = null) => {
  if (!departureLocation || !destination) return 0;
  
  const depLower = departureLocation.toLowerCase();
  const destLower = destination.toLowerCase();
  
  // Same location - no flight needed
  if (depLower === destLower) return 0;
  
  const depRegion = getRegionCode(departureLocation);
  const destRegion = getRegionCode(destination);
  
  // Same region - usually no flight needed (land travel)
  if (depRegion === destRegion) {
    // Exception: Some destinations within same region still need flights
    const needsFlightInRegion = ['siargao', 'camiguin', 'siquijor', 'marinduque'].some(
      place => destLower.includes(place)
    );
    if (!needsFlightInRegion) return 0;
  }
  
  // Realistic flight costs based on popular routes (round-trip per person)
  const flightCosts = {
    // Manila to Major Destinations
    'ncr-r07': 4000,      // Manila-Cebu (₱1,500-2,500 one-way)
    'ncr-r11': 5000,      // Manila-Davao (₱2,000-3,000 one-way)
    'ncr-r04b': 6000,     // Manila-Palawan (₱2,500-3,500 one-way)
    'ncr-r06': 4500,      // Manila-Boracay/Iloilo (₱2,000-2,500 one-way)
    'ncr-r13': 5500,      // Manila-Siargao (₱2,500-3,000 one-way)
    'ncr-r10': 5000,      // Manila-Cagayan de Oro (₱2,000-3,000 one-way)
    'ncr-r05': 3500,      // Manila-Legazpi (₱1,500-2,000 one-way)
    'ncr-r01': 0,         // Manila-Ilocos (land travel)
    'ncr-car': 0,         // Manila-Baguio (land travel) ✅ CORRECT: No flights to Baguio
    'ncr-r03': 0,         // Manila-Central Luzon (land travel)
    'ncr-r04a': 0,        // Manila-CALABARZON (land travel)
    
    // Inter-regional flights
    'r07-r11': 3000,      // Cebu-Davao
    'r07-r04b': 4000,     // Cebu-Palawan
    'r07-r06': 3500,      // Cebu-Iloilo
    'r07-r13': 4000,      // Cebu-Siargao
    'r11-r13': 3500,      // Davao-Siargao
    'r06-r04b': 5000,     // Boracay-Palawan
  };
  
  // Try direct route
  const routeKey = `${depRegion}-${destRegion}`;
  const reverseKey = `${destRegion}-${depRegion}`;
  
  let baseCost = flightCosts[routeKey] || flightCosts[reverseKey] || 5000;
  
  // Apply timing multiplier if startDate is provided
  if (startDate) {
    const daysUntil = getDaysUntilDeparture(startDate);
    if (daysUntil !== null) {
      baseCost = calculateTimingAdjustedFlightCost(baseCost, daysUntil);
    }
  }
  
  return baseCost;
};

/**
 * ENHANCED: Calculate estimated budget with accuracy improvements
 * Returns detailed breakdown and total with validation
 */
export const calculateEstimatedBudget = (params) => {
  const {
    destination,
    departureLocation = 'Manila, Philippines',
    duration = 3,
    travelers = 1,
    budgetLevel = 'moderate', // 'budget-friendly', 'moderate', 'luxury'
    includeFlights = false,
    startDate = null, // NEW: For timing-based flight pricing
  } = params;
  
  // Validate inputs
  if (duration < 1 || duration > 30) {
    console.warn('⚠️ Invalid duration, using default:', duration);
  }
  
  // Get cost factors with validation
  const regionCode = getRegionCode(destination);
  const costIndex = REGIONAL_COST_INDEX[regionCode] || 100;
  const destMultiplier = getDestinationMultiplier(destination);
  
  // Cap multipliers to prevent extreme values
  const cappedCostIndex = Math.min(Math.max(costIndex, 60), 140);
  const cappedDestMultiplier = Math.min(Math.max(destMultiplier, 0.7), 1.8);
  
  console.log('💰 Budget Factors:', {
    destination,
    regionCode,
    costIndex: cappedCostIndex,
    destMultiplier: cappedDestMultiplier,
    budgetLevel
  });
  
  // Get base daily costs for budget level
  const budgetLevelLower = String(budgetLevel).toLowerCase();
  const dailyCosts = BASE_DAILY_COSTS[budgetLevelLower] || BASE_DAILY_COSTS.moderate;
  
  // Calculate daily cost per person with regional adjustments
  let dailyCostPerPerson = Object.values(dailyCosts).reduce((sum, cost) => sum + cost, 0);
  dailyCostPerPerson = dailyCostPerPerson * (cappedCostIndex / 100) * cappedDestMultiplier;
  
  // Parse travelers count
  let travelerCount = typeof travelers === 'number' ? travelers : parseInt(travelers, 10) || 1;
  
  // Calculate base total
  let totalCost = dailyCostPerPerson * duration * travelerCount;
  
  // Add flight costs with IMPROVED timing multiplier
  let flightCost = 0;
  if (includeFlights) {
    const baseFlightCost = estimateFlightCost(departureLocation, destination, null); // Get base cost first
    
    if (startDate) {
      const daysUntil = getDaysUntilDeparture(startDate);
      if (daysUntil !== null && daysUntil >= 0) {
        // IMPROVED: Cap timing multiplier to prevent excessive inflation
        const rawMultiplier = getTimingPriceMultiplier(daysUntil);
        const cappedMultiplier = Math.min(rawMultiplier, 2.5); // Max 2.5x instead of 4x
        
        const adjustedFlightCost = Math.round(baseFlightCost * cappedMultiplier);
        flightCost = adjustedFlightCost * travelerCount;
        
        console.log('✈️ Flight Cost Calculation:', {
          baseFlightCost,
          daysUntil,
          rawMultiplier,
          cappedMultiplier,
          perPerson: adjustedFlightCost,
          total: flightCost
        });
      } else {
        flightCost = baseFlightCost * travelerCount;
      }
    } else {
      flightCost = baseFlightCost * travelerCount;
    }
    
    totalCost += flightCost;
  }
  
  // Round to nearest 100 for cleaner display
  totalCost = Math.round(totalCost / 100) * 100;
  
  // Calculate detailed breakdown
  const breakdown = {
    accommodation: Math.round((dailyCosts.accommodation * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
    food: Math.round((dailyCosts.food * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
    activities: Math.round((dailyCosts.activities * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
    transport: Math.round((dailyCosts.transport * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
    flights: flightCost,
    miscellaneous: Math.round((dailyCosts.miscellaneous * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
  };
  
  // Validate breakdown sums to total (within rounding tolerance)
  const breakdownSum = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  if (Math.abs(breakdownSum - totalCost) > 100) {
    console.warn('⚠️ Breakdown sum mismatch:', { breakdownSum, totalCost });
  }
  
  return {
    total: totalCost,
    breakdown,
    perPerson: Math.round(totalCost / travelerCount),
    perDay: Math.round(totalCost / duration),
    factors: {
      destination,
      costIndex: cappedCostIndex,
      destMultiplier: cappedDestMultiplier,
      regionCode,
      budgetLevel: budgetLevelLower,
      includeFlights,
      flightTimingApplied: includeFlights && startDate,
    },
  };
};

/**
 * Get budget recommendations for all three levels (Budget-Friendly, Moderate, Luxury)
 * Returns formatted estimates with descriptions
 */
export const getBudgetRecommendations = (params) => {
  const budgetFriendly = calculateEstimatedBudget({ ...params, budgetLevel: 'budget-friendly' });
  const moderate = calculateEstimatedBudget({ ...params, budgetLevel: 'moderate' });
  const luxury = calculateEstimatedBudget({ ...params, budgetLevel: 'luxury' });
  
  // Parse travelers count for per-person calculation
  let travelerCount = 1;
  if (params.travelers) {
    if (typeof params.travelers === 'string') {
      const match = params.travelers.match(/(\d+)/);
      if (match) travelerCount = parseInt(match[1]);
    } else {
      travelerCount = params.travelers;
    }
  }
  
  // ✅ FIXED: Return object with MULTIPLE KEY ALIASES for compatibility
  const results = {
    // Primary keys (kebab-case)
    'budget-friendly': {
      range: `₱${budgetFriendly.total.toLocaleString()}`,
      perPerson: `₱${Math.round(budgetFriendly.total / travelerCount).toLocaleString()}`,
      perDay: `₱${Math.round(budgetFriendly.total / params.duration).toLocaleString()}`,
      description: 'Budget-friendly hostels, local food, basic activities',
      breakdown: budgetFriendly.breakdown,
      total: budgetFriendly.total,
    },
    moderate: {
      range: `₱${moderate.total.toLocaleString()}`,
      perPerson: `₱${Math.round(moderate.total / travelerCount).toLocaleString()}`,
      perDay: `₱${Math.round(moderate.total / params.duration).toLocaleString()}`,
      description: 'Mid-range hotels, mix of local and tourist dining, popular attractions',
      breakdown: moderate.breakdown,
      total: moderate.total,
    },
    luxury: {
      range: `₱${luxury.total.toLocaleString()}`,
      perPerson: `₱${Math.round(luxury.total / travelerCount).toLocaleString()}`,
      perDay: `₱${Math.round(luxury.total / params.duration).toLocaleString()}`,
      description: 'High-end resorts, fine dining, premium experiences',
      breakdown: luxury.breakdown,
      total: luxury.total,
    },
  };

  // ✅ ADD ALIASES: Support multiple naming conventions
  results['budget'] = results['budget-friendly']; // Alias for "budget"
  results['budgetfriendly'] = results['budget-friendly']; // Alias without hyphen
  results['Budget-Friendly'] = results['budget-friendly']; // Alias with caps
  results['Budget'] = results['budget-friendly']; // Alias with single cap
  
  return results;
};

/**
 * Format currency for display (Philippine Peso)
 */
export const formatBudgetRange = (amount) => {
  return `₱${amount.toLocaleString('en-PH')}`;
};

/**
 * Get destination info for display
 */
export const getDestinationInfo = (destination) => {
  const regionCode = getRegionCode(destination);
  const multiplier = getDestinationMultiplier(destination);
  const costIndex = REGIONAL_COST_INDEX[regionCode] || 100;
  
  let priceLevel = 'Average';
  const totalMultiplier = (costIndex / 100) * multiplier;
  
  if (totalMultiplier < 0.85) priceLevel = 'Very Affordable';
  else if (totalMultiplier < 0.95) priceLevel = 'Affordable';
  else if (totalMultiplier > 1.2) priceLevel = 'Expensive';
  else if (totalMultiplier > 1.1) priceLevel = 'Above Average';
  
  return {
    regionCode,
    costIndex,
    destMultiplier: multiplier,
    priceLevel,
    totalMultiplier,
  };
};

/**
 * Find nearest airport to a city
 * Returns airport details and travel information
 */
/**
 * ✅ ENHANCED: Find nearest airport with ACTUAL distance calculation
 * Now uses Haversine distance formula for accuracy
 * @param {string} cityName - City name
 * @param {string} regionCode - Optional region code
 * @returns {Object} - Nearest airport details with calculated distance
 */
export const findNearestAirport = (cityName, regionCode = null) => {
  if (!cityName) return null;

  const cityLower = cityName.toLowerCase();

  // ✅ STEP 1: Check if city has INACTIVE airport using centralized data
  const inactiveInfo = checkInactiveAirport(cityName);
  
  if (inactiveInfo) {
    console.log(`ℹ️ ${inactiveInfo.city} has inactive airport (${inactiveInfo.code}), calculating nearest alternative...`);
    
    // ✅ Use distance calculator to find ACTUAL nearest alternative
    const nearest = findNearestAirportByDistance(cityName, regionCode);
    
    if (nearest.error || nearest.warning) {
      // Fallback to hardcoded alternative if calculation fails
      const alternative = PHILIPPINE_AIRPORTS[inactiveInfo.nearestAlternative];
      return {
        code: inactiveInfo.nearestAlternative,
        ...alternative,
        distance: 'Via land transit',
        travelTime: inactiveInfo.travelTime,
        hasDirectAirport: false,
        inactiveAirportCode: inactiveInfo.code,
        inactiveAirportStatus: inactiveInfo.status,
        message: `${inactiveInfo.city} airport (${inactiveInfo.code}) has no commercial service`,
        recommendation: `✈️ Fly to ${alternative.city} (${inactiveInfo.nearestAlternative}), then ${inactiveInfo.travelTime}`,
      };
    }
    
    return {
      code: nearest.code,
      name: nearest.name,
      distance: nearest.distance,
      distanceKm: nearest.distanceKm,
      travelTime: nearest.travelTime,
      terrain: nearest.terrain,
      hasDirectAirport: false,
      inactiveAirportCode: inactiveInfo.code,
      inactiveAirportStatus: inactiveInfo.status,
      message: `${inactiveInfo.city} airport (${inactiveInfo.code}) has no commercial service. ${nearest.message}`,
      recommendation: nearest.recommendation,
      alternatives: nearest.alternatives
    };
  }

  // ✅ STEP 2: Check if city has ACTIVE direct airport
  const cityAirport = Object.entries(PHILIPPINE_AIRPORTS).find(([, airport]) => 
    airport.city.toLowerCase() === cityLower || cityLower.includes(airport.city.toLowerCase())
  );

  if (cityAirport) {
    return {
      code: cityAirport[0],
      ...cityAirport[1],
      distance: '0 km',
      distanceKm: 0,
      travelTime: 'In city',
      terrain: 'urban',
      hasDirectAirport: true,
      message: `${cityAirport[1].name} (${cityAirport[0]})`,
      recommendation: `✈️ Direct flights available via ${cityAirport[1].name}`
    };
  }
  
  // ✅ STEP 3: Calculate ACTUAL nearest airport using Haversine distance
  console.log(`🔍 Calculating nearest airport for: ${cityName}`);
  const nearest = findNearestAirportByDistance(cityName, regionCode);
  
  if (nearest.error || nearest.warning) {
    console.warn(`⚠️ Distance calculation unavailable for ${cityName}, using fallback`);
    
    // Fallback: Try to find regional airports
    if (!regionCode) {
      regionCode = getRegionCode(cityName);
    }
    
    const regionalAirports = Object.entries(PHILIPPINE_AIRPORTS)
      .filter(([, airport]) => airport.region === regionCode)
      .map(([code, airport]) => ({ code, ...airport }));
    
    if (regionalAirports.length > 0) {
      const regional = regionalAirports[0];
      return {
        ...regional,
        distance: '50-100 km',
        distanceKm: 75,
        travelTime: '1-2 hours',
        terrain: 'normal',
        hasDirectAirport: false,
        message: `Nearest: ${regional.name} (${regional.code})`,
        recommendation: `✈️ Fly to ${regional.city} then 1-2 hours by land to ${cityName}`,
        warning: 'Distance not calculated - using estimated values'
      };
    }
    
    // Ultimate fallback to Manila
    return {
      code: 'MNL',
      ...PHILIPPINE_AIRPORTS['MNL'],
      distance: 'Via Manila',
      travelTime: 'Connect to nearest airport',
      terrain: 'urban',
      hasDirectAirport: false,
      message: 'Via Manila (MNL)',
      recommendation: `✈️ Fly to Manila then connect to nearest regional airport`,
      warning: 'Distance calculation unavailable'
    };
  }
  
  // ✅ Return calculated nearest airport
  const airportData = PHILIPPINE_AIRPORTS[nearest.code];
  return {
    code: nearest.code,
    ...airportData,
    distance: nearest.distance,
    distanceKm: nearest.distanceKm,
    travelTime: nearest.travelTime,
    terrain: nearest.terrain,
    hasDirectAirport: false,
    coordinates: nearest.coordinates,
    message: nearest.message,
    recommendation: nearest.recommendation,
    alternatives: nearest.alternatives
  };
};

/**
 * Get airport recommendations for departure and destination
 * Used in budget calculations and flight preferences
 * ✅ ENHANCED: Now includes validation of recommended airports
 */
export const getAirportRecommendations = (departureCity, destinationCity) => {
  const departure = findNearestAirport(departureCity);
  const destination = findNearestAirport(destinationCity);
  
  // ✅ NEW: Validate if recommended airports are actually nearest
  const departureValidation = departure ? validateAirportRecommendation(departureCity, departure.code) : null;
  const destinationValidation = destination ? validateAirportRecommendation(destinationCity, destination.code) : null;
  
  // Log validation warnings
  if (departureValidation && !departureValidation.valid) {
    console.warn(`⚠️ Departure airport validation: ${departureValidation.message}`);
    console.log(`   Suggestion: ${departureValidation.suggestion}`);
  }
  
  if (destinationValidation && !destinationValidation.valid) {
    console.warn(`⚠️ Destination airport validation: ${destinationValidation.message}`);
    console.log(`   Suggestion: ${destinationValidation.suggestion}`);
  }
  
  return {
    departure,
    destination,
    needsFlight: departure?.region !== destination?.region,
    route: departure && destination ? `${departure.code} → ${destination.code}` : null,
    nonstopAvailableFromDeparture: departure?.hasDirectAirport && destination?.hasDirectAirport,
    validation: {
      departure: departureValidation,
      destination: destinationValidation,
      bothValid: departureValidation?.valid && destinationValidation?.valid
    }
  };
};
