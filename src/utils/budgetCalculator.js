/**
 * Budget Calculator Utility
 * Calculates total estimated budget from trip data including activities, hotels, and flights
 * 
 * 🔄 MIGRATION NOTE (2025-11-07):
 * - Removed local formatCurrency() - now re-exported from formatters.js
 * - Using centralized formatPHP() for consistency
 * - Replaced console.log with logDebug for production cleanup (2025-11-07)
 * 
 * 🔧 ENHANCED (2025-11-28):
 * - Added comprehensive validation and sanity checks
 * - Improved flight cost calculation with priority checks
 * - Added hotel per-person vs per-room detection
 * - Added budget sanity warnings for debugging
 */

// Import robust JSON parser
import { parseDataArray } from './jsonParsers';
// Import production logger for debug logging
import { logDebug } from './productionLogger';

/**
 * Parse price string to number (handles ₱, commas, "Free", ranges, etc.)
 */
export const parsePrice = (priceString) => {
  if (!priceString) return 0;
  if (typeof priceString === 'number') return priceString;
  
  const stringPrice = String(priceString).toLowerCase();
  
  // Handle "Free" or "N/A"
  if (stringPrice.includes('free') || stringPrice.includes('n/a')) {
    return 0;
  }
  
  // Check for price ranges (e.g., "₱100 - ₱500" or "₱100-₱500")
  const rangeMatch = stringPrice.match(/[₱$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*[-–to]\s*[₱$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  
  if (rangeMatch) {
    // Extract min and max from range
    const min = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const max = parseFloat(rangeMatch[2].replace(/,/g, ''));
    
    // Return average of range for more accurate budget estimation
    if (!isNaN(min) && !isNaN(max)) {
      return (min + max) / 2;
    }
  }
  
  // Single price value - remove currency symbols, commas, and spaces
  const numericString = stringPrice
    .replace(/[₱$,\s]/g, '')
    .replace(/[-–to].*/i, '') // Remove anything after dash (in case of partial match)
    .trim();
  
  const parsed = parseFloat(numericString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate total cost from itinerary activities
 */
export const calculateActivitiesCost = (itinerary) => {
  if (!Array.isArray(itinerary)) {
    return 0;
  }
  
  let total = 0;
  
  itinerary.forEach((day) => {
    // Handle both 'plan' array and 'planText' string formats
    if (Array.isArray(day?.plan)) {
      day.plan.forEach((activity) => {
        const price = parsePrice(activity?.ticketPricing);
        total += price;
      });
    } else if (day?.planText) {
      // Parse planText format if needed (fallback)
      const activities = day.planText.split(' | ');
      activities.forEach(activityText => {
        // Extract price from text (e.g., "₱150" or "Free")
        const priceMatch = activityText.match(/₱[\d,]+|Free/i);
        if (priceMatch) {
          const price = parsePrice(priceMatch[0]);
          total += price;
        }
      });
    }
  });
  
  return total;
};

/**
 * Calculate total cost from hotels
 * Note: Hotels array typically contains OPTIONS, not all selected hotels
 * We use the first/recommended hotel or calculate average for estimation
 */
export const calculateHotelsCost = (hotels, numNights = 1) => {
  if (!Array.isArray(hotels) || hotels.length === 0) {
    return 0;
  }
  
  // Strategy: Use the first hotel (usually the recommended/selected one)
  // The AI typically puts the best match or selected hotel first
  const selectedHotel = hotels[0];
  
  // 🆕 FIXED: Check multiple field variations for hotel pricing
  // Real hotel data can have: pricePerNight, priceRange, price_range, priceNumeric
  const priceField = 
    selectedHotel?.pricePerNight || 
    selectedHotel?.priceRange || 
    selectedHotel?.price_range ||
    selectedHotel?.priceNumeric;
  
  const pricePerNight = parsePrice(priceField);
  const hotelTotal = pricePerNight * numNights;
  
  // 🔍 Validate pricing metadata
  const isPricingPerRoom = selectedHotel?.pricing_type === 'per_room' || 
                           selectedHotel?.is_per_room === true ||
                           !selectedHotel?.pricing_type; // Default assumption
  
  logDebug('BudgetCalculator', 'Hotel cost calculation', {
    totalHotelsInArray: hotels.length,
    usingHotel: selectedHotel?.hotelName || selectedHotel?.name || 'Unknown',
    priceField: priceField || 'No price field found',
    pricePerNight,
    numNights,
    total: hotelTotal,
    isPricingPerRoom,
    pricingType: selectedHotel?.pricing_type || 'assumed per-room',
    availableFields: Object.keys(selectedHotel || {}),
    note: 'Using first hotel from array (recommended/selected)',
    warning: !isPricingPerRoom ? 'Price may be per-person - verify calculation' : undefined
  });
  
  // Warn if pricing seems ambiguous
  if (!isPricingPerRoom && pricePerNight > 0) {
    console.warn(`⚠️ Hotel "${selectedHotel?.hotelName || 'Unknown'}" may use per-person pricing (₱${pricePerNight}/night). Verify calculation.`);
  }
  
  return hotelTotal;
};

/**
 * Calculate total cost from flights
 * 
 * 🆕 ENHANCED: Comprehensive validation with sanity checks to prevent double-multiplication
 * Prioritizes backend pricing metadata and validates against expected domestic flight costs
 * 
 * @param {Array} flights - Array of flight objects
 * @param {number} travelers - Number of travelers (default: 1)
 * @param {boolean} priceIsPerPerson - Whether API price is already per-person (default: true for SerpAPI)
 * @returns {number} - Total flight cost for ALL travelers
 */
export const calculateFlightsCost = (flights, travelers = 1, priceIsPerPerson = true) => {
  if (!Array.isArray(flights) || flights.length === 0) {
    return 0;
  }
  
  let total = 0;
  const travelersNum = Number(travelers) || 1;
  
  // 🔍 SANITY CHECK THRESHOLDS (Philippine domestic flights)
  const DOMESTIC_MAX_PER_PERSON = 20000;  // ₱20k per person (high-end domestic)
  const DOMESTIC_MIN_PER_PERSON = 1000;    // ₱1k per person (promo rates)
  const INTERNATIONAL_THRESHOLD = 30000;   // Above this suggests international
  
  flights.forEach((flight, index) => {
    let flightTotal = 0;
    let calculationMethod = 'unknown';
    let perPersonEstimate = 0;
    
    // 🆕 PRIORITY 1: Check if backend provided numeric total_for_group (MOST ACCURATE)
    if (flight.total_for_group_numeric !== undefined && flight.total_for_group_numeric !== null) {
      flightTotal = flight.total_for_group_numeric;
      calculationMethod = 'total_for_group_numeric (trusted)';
      perPersonEstimate = flightTotal / (flight.travelers || travelersNum);
      
      // 🔍 DOUBLE-CHECK: Detect if backend still double-multiplied (>₱60k per person for domestic)
      if (perPersonEstimate > 60000) {
        // Backend bug: multiplied an already-total price
        flightTotal = flightTotal / (flight.travelers || travelersNum);
        perPersonEstimate = flightTotal / (flight.travelers || travelersNum);
        calculationMethod = 'total_for_group_numeric (corrected for double-multiplication)';
        
        console.error('🔧 CORRECTED BACKEND DOUBLE-MULTIPLICATION:', {
          flightIndex: index,
          airline: flight?.name || 'Unknown',
          route: `${flight?.departure_airport?.id || '?'} → ${flight?.arrival_airport?.id || '?'}`,
          originalTotal: flight.total_for_group_numeric,
          correctedTotal: flightTotal,
          originalPerPerson: Math.round(flight.total_for_group_numeric / (flight.travelers || travelersNum)),
          correctedPerPerson: Math.round(perPersonEstimate),
          correction: `Divided by ${flight.travelers || travelersNum} to remove double-multiplication`
        });
      } else {
        logDebug('BudgetCalculator', '✅ Using backend-calculated group total', {
          flightIndex: index,
          airline: flight?.name || 'Unknown',
          route: `${flight?.departure_airport?.id || '?'} → ${flight?.arrival_airport?.id || '?'}`,
          total: flightTotal,
          travelers: flight.travelers || travelersNum,
          perPerson: Math.round(perPersonEstimate),
          source: 'total_for_group_numeric',
          method: calculationMethod
        });
      }
    }
    // PRIORITY 2: Fallback to string parsing if numeric not available
    else if (flight.total_for_group !== undefined && flight.total_for_group !== null) {
      flightTotal = parsePrice(flight.total_for_group);
      calculationMethod = 'total_for_group (parsed string)';
      perPersonEstimate = flightTotal / (flight.travelers || travelersNum);
      
      // 🔍 DOUBLE-CHECK: Detect double-multiplication
      if (perPersonEstimate > 60000) {
        flightTotal = flightTotal / (flight.travelers || travelersNum);
        perPersonEstimate = flightTotal / (flight.travelers || travelersNum);
        calculationMethod = 'total_for_group (corrected for double-multiplication)';
        
        console.error('🔧 CORRECTED BACKEND DOUBLE-MULTIPLICATION:', {
          flightIndex: index,
          airline: flight?.name || 'Unknown',
          originalTotal: parsePrice(flight.total_for_group),
          correctedTotal: flightTotal,
          correction: 'Divided by travelers to remove double-multiplication'
        });
      } else {
        logDebug('BudgetCalculator', '✅ Using parsed group total', {
          flightIndex: index,
          airline: flight?.name || 'Unknown',
          total: flightTotal,
          travelers: flight.travelers || travelersNum,
          perPerson: Math.round(perPersonEstimate),
          source: 'total_for_group',
          method: calculationMethod
        });
      }
    }
    // PRIORITY 3: Check if backend provided per-person price metadata
    // This is per-person, so multiply by number of travelers
    else if (flight.price_per_person && flight.travelers) {
      const pricePerPerson = parsePrice(flight.price_per_person);
      flightTotal = pricePerPerson * flight.travelers;
      calculationMethod = 'price_per_person × travelers';
      perPersonEstimate = pricePerPerson;
      
      logDebug('BudgetCalculator', 'Calculated from per-person metadata', {
        flightIndex: index,
        airline: flight?.name || 'Unknown',
        pricePerPerson,
        travelers: flight.travelers,
        total: flightTotal,
        source: 'price_per_person',
        method: calculationMethod
      });
    }
    // PRIORITY 3: Check if backend provided numeric_price (per-person numeric value)
    // ⚠️ WARNING: This should rarely execute if backend provides total_for_group
    else if (flight.numeric_price && flight.travelers) {
      const pricePerPerson = flight.numeric_price;
      flightTotal = pricePerPerson * flight.travelers;
      calculationMethod = 'numeric_price × travelers';
      perPersonEstimate = pricePerPerson;
      
      logDebug('BudgetCalculator', '⚠️ Using numeric_price (per-person) - FALLBACK', {
        flightIndex: index,
        airline: flight?.name || 'Unknown',
        pricePerPerson,
        travelers: flight.travelers,
        total: flightTotal,
        source: 'numeric_price',
        rawValue: flight.numeric_price,
        warning: 'total_for_group should be preferred if available',
        method: calculationMethod
      });
    }
    // FALLBACK: Use legacy calculation (avoid if possible)
    else {
      const pricePerFlight = parsePrice(flight?.price);
      
      // 🔍 HEURISTIC: If price > ₱15k and travelers > 1, might already be group total
      const isLikelyGroupTotal = pricePerFlight > 15000 && travelersNum > 1;
      
      if (isLikelyGroupTotal) {
        flightTotal = pricePerFlight;
        calculationMethod = 'legacy (assumed group total)';
        perPersonEstimate = pricePerFlight / travelersNum;
        
        logDebug('BudgetCalculator', '🔍 Price appears to be group total already', {
          flightIndex: index,
          airline: flight?.name || 'Unknown',
          price: pricePerFlight,
          travelers: travelersNum,
          perPerson: Math.round(perPersonEstimate),
          assumption: 'Price > ₱15k suggests group total',
          method: calculationMethod
        });
      } else {
        flightTotal = priceIsPerPerson ? pricePerFlight * travelersNum : pricePerFlight;
        calculationMethod = priceIsPerPerson ? 'legacy (per-person × travelers)' : 'legacy (group total)';
        perPersonEstimate = priceIsPerPerson ? pricePerFlight : pricePerFlight / travelersNum;
        
        logDebug('BudgetCalculator', 'Legacy calculation', {
          flightIndex: index,
          airline: flight?.name || 'Unknown',
          pricePerFlight,
          travelers: travelersNum,
          priceIsPerPerson,
          flightTotal,
          perPerson: Math.round(perPersonEstimate),
          source: 'legacy fallback',
          method: calculationMethod
        });
      }
    }
    
    // 🚨 SANITY CHECK: Validate per-person cost
    if (perPersonEstimate > DOMESTIC_MAX_PER_PERSON && perPersonEstimate < INTERNATIONAL_THRESHOLD) {
      console.warn('⚠️ FLIGHT PRICING WARNING:', {
        flightIndex: index,
        airline: flight?.name || 'Unknown',
        route: `${flight?.departure_airport?.id || '?'} → ${flight?.arrival_airport?.id || '?'}`,
        perPerson: Math.round(perPersonEstimate),
        threshold: DOMESTIC_MAX_PER_PERSON,
        message: 'Per-person cost exceeds typical domestic range (₱1k-20k)',
        recommendation: 'Verify this is correct or check if international route',
        method: calculationMethod
      });
    }
    
    if (perPersonEstimate >= INTERNATIONAL_THRESHOLD) {
      console.warn('🌏 INTERNATIONAL FLIGHT DETECTED:', {
        flightIndex: index,
        airline: flight?.name || 'Unknown',
        route: `${flight?.departure_airport?.id || '?'} → ${flight?.arrival_airport?.id || '?'}`,
        perPerson: Math.round(perPersonEstimate),
        message: 'Cost suggests international flight (>₱30k/person)',
        method: calculationMethod
      });
    }
    
    if (perPersonEstimate < DOMESTIC_MIN_PER_PERSON && perPersonEstimate > 0) {
      console.warn('💰 UNUSUALLY LOW FLIGHT COST:', {
        flightIndex: index,
        airline: flight?.name || 'Unknown',
        perPerson: Math.round(perPersonEstimate),
        message: 'Cost below typical minimum (₱1k/person) - verify promo or error',
        method: calculationMethod
      });
    }
    
    total += flightTotal;
  });
  
  // 🚨 FINAL VALIDATION: Check if total seems unreasonable
  const totalPerPerson = total / travelersNum;
  
  if (total > 50000 && travelersNum <= 4 && totalPerPerson > DOMESTIC_MAX_PER_PERSON) {
    console.error('❌ FLIGHT COST ANOMALY DETECTED:', {
      total: Math.round(total),
      travelers: travelersNum,
      perPerson: Math.round(totalPerPerson),
      expected: `₱${DOMESTIC_MIN_PER_PERSON.toLocaleString()}-${DOMESTIC_MAX_PER_PERSON.toLocaleString()} per person for domestic`,
      overage: `₱${Math.round(totalPerPerson - DOMESTIC_MAX_PER_PERSON).toLocaleString()} over expected maximum`,
      possibleCauses: [
        'Double-multiplication of per-person prices',
        'International route instead of domestic',
        'Multiple flight segments incorrectly summed',
        'Incorrect traveler count in calculation'
      ],
      recommendation: 'Review flight data source and calculation method'
    });
  }
  
  logDebug('BudgetCalculator', '✈️ Total flights cost calculated', { 
    total: Math.round(total),
    travelers: travelersNum,
    perPerson: Math.round(totalPerPerson),
    flightCount: flights.length,
    validation: totalPerPerson <= DOMESTIC_MAX_PER_PERSON ? '✅ Within expected range' : '⚠️ Exceeds typical domestic cost'
  });
  
  return total;
};

/**
 * Get user's allocated budget (what they set during trip creation)
 * This is the budget they WANT to spend, not the calculated cost
 * 
 * @param {Object} trip - Trip object from Firebase
 * @returns {number|null} - User's budget amount or null if not set
 */
export const getUserBudget = (trip) => {
  let budget = null;
  let source = null;
  
  // Priority 1: Use budgetAmount (numeric field - most reliable)
  if (trip?.userSelection?.budgetAmount) {
    budget = trip.userSelection.budgetAmount;
    source = 'budgetAmount';
  }
  // Priority 2: Parse customBudget string
  else if (trip?.userSelection?.customBudget && trip.userSelection.customBudget.trim() !== "") {
    const amount = parseInt(trip.userSelection.customBudget);
    if (!isNaN(amount) && amount > 0) {
      budget = amount;
      source = 'customBudget (parsed)';
    }
  }
  
  // Validate budget value
  if (budget !== null) {
    logDebug('BudgetCalculator', '✅ User budget retrieved', { budget, source });
    
    // Sanity check: budget seems unrealistically low
    if (budget < 1000) {
      console.warn(`⚠️ User budget (₱${budget}) seems very low - verify this is correct`);
    }
  } else {
    logDebug('BudgetCalculator', '⚠️ No user budget set', {
      hasBudgetAmount: !!trip?.userSelection?.budgetAmount,
      hasCustomBudget: !!trip?.userSelection?.customBudget
    });
  }
  
  return budget;
};

/**
 * Calculate total estimated budget for the entire trip
 * 
 * @param {Object} trip - Trip object from Firebase
 * @returns {Object} - { total, breakdown: { activities, hotels, flights } }
 */
export const calculateTotalBudget = (trip) => {
  logDebug('BudgetCalculator', 'Starting calculation', { tripId: trip?.id });
  
  const breakdown = {
    activities: 0,
    hotels: 0,
    flights: 0,
    groundTransport: 0
  };
  
  // Extract trip data
  let tripData = trip?.tripData;
  logDebug('BudgetCalculator', 'Raw tripData type', { type: typeof tripData });
  
  // Parse if it's a string
  if (typeof tripData === 'string') {
    try {
      tripData = JSON.parse(tripData);
      logDebug('BudgetCalculator', 'Successfully parsed tripData from string');
    } catch (e) {
      logDebug('BudgetCalculator', 'Failed to parse tripData', { error: e.message });
      return { total: 0, breakdown };
    }
  }
  
  // Check if we have GA-First workflow total_cost (most accurate)
  if (tripData?.total_cost && typeof tripData.total_cost === 'number') {
    breakdown.activities = tripData.total_cost;
    logDebug('BudgetCalculator', 'Using GA-First total_cost', { cost: breakdown.activities });
  } else {
    // Calculate from itinerary
    let itinerary = tripData?.itinerary_data || tripData?.itinerary || [];
    
    // Parse if itinerary is a string
    if (typeof itinerary === 'string') {
      logDebug('BudgetCalculator', 'Parsing itinerary string with robust parser');
      itinerary = parseDataArray(itinerary, 'itinerary');
      logDebug('BudgetCalculator', 'Successfully parsed itinerary', { length: itinerary?.length });
    }
    
    logDebug('BudgetCalculator', 'Itinerary data', {
      source: tripData?.itinerary_data ? 'itinerary_data' : 'itinerary',
      length: itinerary?.length,
      isArray: Array.isArray(itinerary)
    });
    breakdown.activities = calculateActivitiesCost(itinerary);
    logDebug('BudgetCalculator', 'Calculated activities cost', { cost: breakdown.activities });
  }
  
  // Calculate hotels cost
  // 🆕 FIXED: Prioritize real hotel data over AI-generated estimates
  let hotels = [];
  
  // Check for real hotel data first (from LangGraph/Google Places API)
  if (trip?.realHotelData?.hotels && Array.isArray(trip.realHotelData.hotels)) {
    hotels = trip.realHotelData.hotels;
    logDebug('BudgetCalculator', 'Using real hotel data', { 
      count: hotels.length,
      source: 'trip.realHotelData.hotels'
    });
  } 
  // Fallback to AI-generated hotels (estimates)
  else if (tripData?.hotels) {
    hotels = tripData.hotels;
    logDebug('BudgetCalculator', 'Using AI-generated hotels (fallback)', { 
      source: 'tripData.hotels'
    });
    
    // Parse if hotels is a string
    if (typeof hotels === 'string') {
      logDebug('BudgetCalculator', 'Parsing hotels string with robust parser');
      hotels = parseDataArray(hotels, 'hotels');
      logDebug('BudgetCalculator', 'Successfully parsed hotels', { length: hotels?.length });
    }
  } else {
    logDebug('BudgetCalculator', 'No hotel data found', {
      hasRealHotels: !!trip?.realHotelData,
      hasTripDataHotels: !!tripData?.hotels
    });
  }
  
  const duration = trip?.userSelection?.duration || trip?.userSelection?.noOfDays || 1;
  const numNights = Math.max(1, duration - 1); // Usually nights = days - 1
  logDebug('BudgetCalculator', 'Hotels data', {
    count: hotels?.length,
    isArray: Array.isArray(hotels),
    numNights,
    duration
  });
  breakdown.hotels = calculateHotelsCost(hotels, numNights);
  logDebug('BudgetCalculator', 'Calculated hotels cost', { cost: breakdown.hotels });
  
  // Calculate flights cost
  // 🆕 FIXED: Prioritize real flight data over AI-generated estimates
  let flights = [];
  
  // Check for real flight data first (from LangGraph/SerpAPI)
  if (trip?.realFlightData?.flights && Array.isArray(trip.realFlightData.flights)) {
    flights = trip.realFlightData.flights;
    logDebug('BudgetCalculator', 'Using real flight data', { 
      count: flights.length,
      source: 'trip.realFlightData.flights'
    });
  } 
  // Fallback to AI-generated flights (estimates)
  else if (tripData?.flights) {
    flights = tripData.flights;
    logDebug('BudgetCalculator', 'Using AI-generated flights (fallback)', { 
      source: 'tripData.flights'
    });
    
    // Parse if flights is a string
    if (typeof flights === 'string') {
      logDebug('BudgetCalculator', 'Parsing flights string with robust parser');
      flights = parseDataArray(flights, 'flights');
      logDebug('BudgetCalculator', 'Successfully parsed flights', { length: flights?.length });
    }
  } else {
    logDebug('BudgetCalculator', 'No flight data found', {
      hasRealFlights: !!trip?.realFlightData,
      hasTripDataFlights: !!tripData?.flights
    });
  }
  
  // 🆕 FIXED: Extract travelers count for proper flight cost calculation
  const travelers = trip?.userSelection?.travelers || 1;
  const travelersNum = typeof travelers === 'number' ? travelers : 
                       typeof travelers === 'string' ? parseInt(travelers) || 1 : 1;
  
  logDebug('BudgetCalculator', 'Flights data', { 
    count: flights?.length,
    isArray: Array.isArray(flights),
    travelers: travelersNum,
    note: 'Prices will be multiplied by travelers count'
  });
  
  // Pass travelers count to flight cost calculator
  breakdown.flights = calculateFlightsCost(flights, travelersNum, true);
  logDebug('BudgetCalculator', 'Calculated flights cost', { 
    cost: breakdown.flights,
    travelers: travelersNum,
    perPerson: Math.round(breakdown.flights / travelersNum)
  });
  
  // ✅ NEW: Calculate ground transport cost from costBreakdown or transportMode
  if (tripData?.costBreakdown?.ground_transport) {
    breakdown.groundTransport = tripData.costBreakdown.ground_transport;
    logDebug('BudgetCalculator', 'Using costBreakdown.ground_transport', { cost: breakdown.groundTransport });
  } else if (trip?.costBreakdown?.ground_transport) {
    breakdown.groundTransport = trip.costBreakdown.ground_transport;
    logDebug('BudgetCalculator', 'Using trip.costBreakdown.ground_transport', { cost: breakdown.groundTransport });
  } else if (trip?.transportMode?.ground_transport?.cost) {
    // Calculate average of min/max
    const groundCost = trip.transportMode.ground_transport.cost;
    breakdown.groundTransport = Math.round((groundCost.min + groundCost.max) / 2);
    logDebug('BudgetCalculator', 'Calculated from transportMode cost range', { cost: breakdown.groundTransport });
  }
  
  // Calculate total - ensure all values are numbers to avoid NaN
  const total = 
    Number(breakdown.activities || 0) + 
    Number(breakdown.hotels || 0) + 
    Number(breakdown.flights || 0) + 
    Number(breakdown.groundTransport || 0);
  
  logDebug('BudgetCalculator', 'Final breakdown', {
    activities: breakdown.activities,
    activitiesType: typeof breakdown.activities,
    hotels: breakdown.hotels,
    hotelsType: typeof breakdown.hotels,
    flights: breakdown.flights,
    flightsType: typeof breakdown.flights,
    groundTransport: breakdown.groundTransport,
    total,
    totalType: typeof total
  });
  
  // 🔍 SANITY CHECKS: Validate budget calculations for potential issues
  const userBudget = getUserBudget(trip);
  const warnings = [];
  
  // Check 1: Total cost exceeds user budget by >50%
  if (userBudget && total > userBudget * 1.5) {
    const overBudgetPercent = ((total - userBudget) / userBudget * 100).toFixed(1);
    warnings.push(`⚠️ Estimated cost exceeds budget by ${overBudgetPercent}% (₱${(total - userBudget).toLocaleString()})`);
  }
  
  // Check 2: Flight cost per person seems unusually high for domestic travel
  if (breakdown.flights > 0 && travelersNum > 0) {
    const flightPerPerson = breakdown.flights / travelersNum;
    if (flightPerPerson > 20000) {
      warnings.push(`⚠️ Flight cost per person (₱${Math.round(flightPerPerson).toLocaleString()}) seems high for domestic travel - verify pricing`);
    }
  }
  
  // Check 3: Hotel cost per night seems excessive
  if (breakdown.hotels > 0 && numNights > 0) {
    const hotelPerNight = breakdown.hotels / numNights;
    if (hotelPerNight > 10000) {
      warnings.push(`⚠️ Hotel cost per night (₱${Math.round(hotelPerNight).toLocaleString()}) is very high - verify pricing`);
    }
  }
  
  // Check 4: Zero costs where data exists
  if (flights && flights.length > 0 && breakdown.flights === 0) {
    warnings.push('⚠️ Flight data exists but cost is ₱0 - check pricing fields');
  }
  if (hotels && hotels.length > 0 && breakdown.hotels === 0) {
    warnings.push('⚠️ Hotel data exists but cost is ₱0 - check pricing fields');
  }
  
  if (warnings.length > 0) {
    logDebug('BudgetCalculator', '⚠️ SANITY CHECK WARNINGS', { warnings });
    console.warn('💰 Budget Calculation Warnings:', warnings);
  }
  
  return {
    total,
    breakdown,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * ✅ REMOVED (2025-11-07): Duplicate export causing conflict
 * 
 * Previously exported formatCurrency as alias for formatPHP
 * Now consumers should import formatCurrency from '@/utils' (resolves to formatters.js)
 * or import formatPHP directly from '@/utils/formatters'
 * 
 * This fixes: "conflicting star exports for name 'formatCurrency'" error
 */

/**
 * Get budget category based on total amount
 */
export const getBudgetCategory = (totalAmount) => {
  if (totalAmount < 5000) return 'Budget-Friendly';
  if (totalAmount < 15000) return 'Moderate';
  return 'Luxury';
};
