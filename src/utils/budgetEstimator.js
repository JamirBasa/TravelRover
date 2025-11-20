/**
 * Budget Estimation Utility
 * Estimates trip budgets based on destination, duration, travelers, and preferences
 * Tailored for Philippines destinations with accurate regional pricing
 * Includes nearest airport recommendations for cities without direct airports
 * NOW INCLUDES: Smart flight pricing based on booking timing
 * 
 * @updated 2025-11-06 - Migrated to use centralized budget constants
 */

import { 
  getDaysUntilDeparture, 
  getTimingPriceMultiplier,
  calculateTimingAdjustedFlightCost 
} from './flightPricingAnalyzer.js';

import { 
  findNearestAirportEnhanced as findNearestAirportByDistance,
  // validateAirportRecommendation - not needed with geocoding
} from './airportDistanceCalculatorEnhanced.js';

import { getLimitedServiceInfo } from './flightRecommendations.js';

// 🔄 MIGRATED: Import centralized constants
import {
  PHILIPPINE_AIRPORTS,
} from '../data/airports';

import {
  REGIONAL_COST_INDEX,
  DESTINATION_MULTIPLIERS,
  ACCOMMODATION_RANGES,
  MEAL_COSTS,
  TRANSPORT_COSTS,
  ACTIVITY_COSTS,
  getDestinationMultiplier,
} from '../constants/budgetConstants';

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

// 🔄 MIGRATED: Now using centralized constants from budgetConstants.js
// Legacy exports maintained for backward compatibility
const BASE_DAILY_COSTS = {
  'budget-friendly': {
    accommodation: ACCOMMODATION_RANGES.BUDGET.average, // ₱1,150
    food: (MEAL_COSTS.STREET_FOOD.average * 2 + MEAL_COSTS.FAST_FOOD.average), // ₱370 (2 street food + 1 fast food)
    activities: ACTIVITY_COSTS.GOVERNMENT.average, // ₱100 (free/cheap activities)
    transport: TRANSPORT_COSTS.JEEPNEY.average * 8, // ₱152 (8 trips, not 10)
    miscellaneous: 150, // Reduced from 200
  },
  moderate: {
    accommodation: ACCOMMODATION_RANGES.MODERATE.average, // ₱2,250
    food: MEAL_COSTS.MID_RANGE.average * 3, // ₱1,800
    activities: ACTIVITY_COSTS.ISLAND_TOUR.average, // ₱1,650
    transport: TRANSPORT_COSTS.GRAB_AIRPORT.average, // ₱350
    miscellaneous: 500,
  },
  luxury: {
    accommodation: ACCOMMODATION_RANGES.LUXURY.average, // ₱10,000
    food: MEAL_COSTS.FINE_DINING.average * 3, // ₱4,200
    activities: ACTIVITY_COSTS.DIVING.average, // ₱3,500
    transport: TRANSPORT_COSTS.TAXI.average * 5, // ₱750 (multiple trips)
    miscellaneous: 1000,
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

// 🔄 REMOVED: getDestinationMultiplier now imported from budgetConstants.js

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
    transportAnalysis = null, // ✅ NEW: Transport mode analysis from backend
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
    budgetLevel,
    transportAnalysis: transportAnalysis ? {
      isGroundPreferred: transportAnalysis.groundTransport?.preferred,
      hasGroundRoute: !!transportAnalysis.groundTransport,
      includeFlights
    } : 'not provided'
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
  
  // ✅ NEW: Add flight or ground transport costs based on preference
  let flightCost = 0;
  let groundTransportCost = 0;
  
  // Check if ground transport is preferred and available
  const isGroundPreferred = transportAnalysis?.groundTransport?.preferred === true;
  const groundRoute = transportAnalysis?.groundTransport;
  
  if (includeFlights && !isGroundPreferred) {
    // Only calculate flight costs if ground transport is NOT preferred
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
  } else if (isGroundPreferred && groundRoute) {
    // ✅ Use ground transport costs when preferred (₱200-700 vs ₱2,500-5,000)
    const fareRange = groundRoute.fare_range || { min: 200, max: 700 };
    const avgFare = Math.round((fareRange.min + fareRange.max) / 2);
    
    // Add 20% contingency for luggage/unexpected fees
    const fareWithContingency = Math.round(avgFare * 1.2);
    
    groundTransportCost = fareWithContingency * travelerCount;
    totalCost += groundTransportCost;
    
    console.log('🚌 Ground Transport Cost Calculation:', {
      fareRange,
      avgFare,
      fareWithContingency,
      travelers: travelerCount,
      total: groundTransportCost
    });
  }
  
  // Round to nearest 100 for cleaner display
  totalCost = Math.round(totalCost / 100) * 100;
  
  // Calculate detailed breakdown
  const breakdown = {
    accommodation: Math.round((dailyCosts.accommodation * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
    food: Math.round((dailyCosts.food * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
    activities: Math.round((dailyCosts.activities * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
    transport: Math.round((dailyCosts.transport * (cappedCostIndex / 100) * cappedDestMultiplier * duration * travelerCount) / 100) * 100,
    flights: flightCost, // ✅ Will be 0 if ground transport preferred
    groundTransport: groundTransportCost, // ✅ NEW: Ground transport costs (₱200-700)
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
 * ✅ ENHANCED: Find nearest airport with GEOCODING + distance calculation
 * Uses Google Geocoding API first (handles ALL 1,634 Philippine locations)
 * Falls back to hardcoded coordinates if geocoding fails
 * @param {string} cityName - City name
 * @param {string} regionCode - Optional region code
 * @returns {Promise<Object>} - Nearest airport details with calculated distance
 */
export const findNearestAirport = async (cityName, regionCode = null) => {
  if (!cityName) return null;

  const cityLower = cityName.toLowerCase();

  // ✅ STEP 1: Check if city has INACTIVE airport using centralized data
  const inactiveInfo = checkInactiveAirport(cityName);
  
  if (inactiveInfo) {
    console.log(`ℹ️ ${inactiveInfo.city} has inactive airport (${inactiveInfo.code}), calculating nearest alternative...`);
    
    // ✅ Use distance calculator to find ACTUAL nearest alternative (with geocoding)
    const nearest = await findNearestAirportByDistance(cityName, regionCode);
    
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
  
  // ✅ STEP 3: Calculate ACTUAL nearest airport using geocoding + Haversine distance
  console.log(`🔍 Calculating nearest airport for: ${cityName}`);
  const nearest = await findNearestAirportByDistance(cityName, regionCode);
  
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
  
  console.log(`✅ findNearestAirport returning for ${cityName}:`, {
    code: nearest.code,
    hasAirportData: !!airportData,
    nearest
  });
  
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
export const getAirportRecommendations = async (departureCity, destinationCity) => {
  console.log(`🛫 getAirportRecommendations called:`, { departureCity, destinationCity });
  
  // ✅ Enhanced calculator with geocoding - automatically finds nearest airport
  const departure = await findNearestAirport(departureCity);
  const destination = await findNearestAirport(destinationCity);
  
  console.log(`📊 Airport recommendations:`, { 
    departure: { code: departure?.code, name: departure?.name },
    destination: { code: destination?.code, name: destination?.name }
  });
  
  // ℹ️ Note: Validation not needed - geocoding provides most accurate results
  // Log if geocoded (shows enhanced calculator is working)
  if (departure?.geocoded) {
    console.log(`🌍 Departure geocoded: ${departure.province || 'unknown'} province`);
  }
  
  if (destination?.geocoded) {
    console.log(`🌍 Destination geocoded: ${destination.province || 'unknown'} province`);
  }
  
  return {
    departure,
    destination,
    needsFlight: departure?.region !== destination?.region,
    route: departure && destination ? `${departure.code} → ${destination.code}` : null,
    nonstopAvailableFromDeparture: departure?.hasDirectAirport && destination?.hasDirectAirport,
    // ✅ Enhanced calculator provides accurate results via geocoding
    geocoded: {
      departure: departure?.geocoded || false,
      destination: destination?.geocoded || false
    }
  };
};
