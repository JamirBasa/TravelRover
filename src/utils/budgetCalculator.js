/**
 * Budget Calculator Utility
 * Calculates total estimated budget from trip data including activities, hotels, and flights
 */

// Import robust JSON parser
import { parseDataArray } from './jsonParsers';

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
  
  const pricePerNight = parsePrice(selectedHotel?.pricePerNight);
  const hotelTotal = pricePerNight * numNights;
  
  console.log('🏨 [Budget Calculator] Hotel cost calculation:', {
    totalHotelsInArray: hotels.length,
    usingHotel: selectedHotel?.hotelName || 'Unknown',
    pricePerNight,
    numNights,
    total: hotelTotal,
    note: 'Using first hotel from array (recommended/selected)'
  });
  
  return hotelTotal;
};

/**
 * Calculate total cost from flights
 */
export const calculateFlightsCost = (flights) => {
  if (!Array.isArray(flights)) {
    return 0;
  }
  
  let total = 0;
  
  flights.forEach((flight) => {
    const price = parsePrice(flight?.price);
    total += price;
  });
  
  return total;
};

/**
 * Calculate total estimated budget for the entire trip
 * 
 * @param {Object} trip - Trip object from Firebase
 * @returns {Object} - { total, breakdown: { activities, hotels, flights } }
 */
export const calculateTotalBudget = (trip) => {
  console.log('💰 [Budget Calculator] Starting calculation for trip:', trip?.id);
  
  const breakdown = {
    activities: 0,
    hotels: 0,
    flights: 0
  };
  
  // Extract trip data
  let tripData = trip?.tripData;
  console.log('💰 [Budget Calculator] Raw tripData type:', typeof tripData);
  
  // Parse if it's a string
  if (typeof tripData === 'string') {
    try {
      tripData = JSON.parse(tripData);
      console.log('💰 [Budget Calculator] Successfully parsed tripData from string');
    } catch (e) {
      console.error('❌ [Budget Calculator] Failed to parse tripData:', e);
      return { total: 0, breakdown };
    }
  }
  
  // Check if we have GA-First workflow total_cost (most accurate)
  if (tripData?.total_cost && typeof tripData.total_cost === 'number') {
    breakdown.activities = tripData.total_cost;
    console.log('💰 [Budget Calculator] Using GA-First total_cost:', breakdown.activities);
  } else {
    // Calculate from itinerary
    let itinerary = tripData?.itinerary_data || tripData?.itinerary || [];
    
    // Parse if itinerary is a string
    if (typeof itinerary === 'string') {
      console.log('🔄 [Budget Calculator] Parsing itinerary string with robust parser...');
      itinerary = parseDataArray(itinerary, 'itinerary');
      console.log('✅ [Budget Calculator] Successfully parsed itinerary, length:', itinerary?.length);
    }
    
    console.log('�💰 [Budget Calculator] Itinerary data:', {
      source: tripData?.itinerary_data ? 'itinerary_data' : 'itinerary',
      length: itinerary?.length,
      isArray: Array.isArray(itinerary),
      sample: itinerary?.[0]
    });
    breakdown.activities = calculateActivitiesCost(itinerary);
    console.log('💰 [Budget Calculator] Calculated activities cost:', breakdown.activities);
  }
  
  // Calculate hotels cost
  let hotels = tripData?.hotels || [];
  
  // Parse if hotels is a string
  if (typeof hotels === 'string') {
    console.log('🔄 [Budget Calculator] Parsing hotels string with robust parser...');
    hotels = parseDataArray(hotels, 'hotels');
    console.log('✅ [Budget Calculator] Successfully parsed hotels, length:', hotels?.length);
  }
  
  const duration = trip?.userSelection?.duration || trip?.userSelection?.noOfDays || 1;
  const numNights = Math.max(1, duration - 1); // Usually nights = days - 1
  console.log('💰 [Budget Calculator] Hotels:', {
    count: hotels?.length,
    isArray: Array.isArray(hotels),
    numNights,
    duration
  });
  breakdown.hotels = calculateHotelsCost(hotels, numNights);
  console.log('💰 [Budget Calculator] Calculated hotels cost:', breakdown.hotels);
  
  // Calculate flights cost
  let flights = tripData?.flights || [];
  
  // Parse if flights is a string
  if (typeof flights === 'string') {
    console.log('🔄 [Budget Calculator] Parsing flights string with robust parser...');
    flights = parseDataArray(flights, 'flights');
    console.log('✅ [Budget Calculator] Successfully parsed flights, length:', flights?.length);
  }
  
  console.log('💰 [Budget Calculator] Flights:', { 
    count: flights?.length,
    isArray: Array.isArray(flights)
  });
  breakdown.flights = calculateFlightsCost(flights);
  console.log('💰 [Budget Calculator] Calculated flights cost:', breakdown.flights);
  
  // Calculate total
  const total = breakdown.activities + breakdown.hotels + breakdown.flights;
  
  console.log('💰 [Budget Calculator] Final breakdown:', {
    activities: breakdown.activities,
    hotels: breakdown.hotels,
    flights: breakdown.flights,
    total
  });
  
  return {
    total,
    breakdown
  };
};

/**
 * Format currency for display (Philippine Peso)
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₱0';
  }
  
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

/**
 * Get budget category based on total amount
 */
export const getBudgetCategory = (totalAmount) => {
  if (totalAmount < 5000) return 'Budget';
  if (totalAmount < 15000) return 'Moderate';
  return 'Luxury';
};
