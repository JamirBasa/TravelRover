/**
 * Budget Calculator Utility
 * Calculates total estimated budget from trip data including activities, hotels, and flights
 */

/**
 * Parse price string to number (handles ₱, commas, "Free", etc.)
 */
export const parsePrice = (priceString) => {
  if (!priceString) return 0;
  if (typeof priceString === 'number') return priceString;
  
  const stringPrice = String(priceString).toLowerCase();
  
  // Handle "Free" or "N/A"
  if (stringPrice.includes('free') || stringPrice.includes('n/a')) {
    return 0;
  }
  
  // Remove currency symbols, commas, and spaces
  const numericString = stringPrice
    .replace(/[₱$,\s]/g, '')
    .trim();
  
  const parsed = parseFloat(numericString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate total cost from itinerary activities
 */
export const calculateActivitiesCost = (itinerary) => {
  if (!Array.isArray(itinerary)) return 0;
  
  let total = 0;
  
  itinerary.forEach(day => {
    // Handle both 'plan' array and 'planText' string formats
    if (Array.isArray(day?.plan)) {
      day.plan.forEach(activity => {
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
          total += parsePrice(priceMatch[0]);
        }
      });
    }
  });
  
  return total;
};

/**
 * Calculate total cost from hotels
 */
export const calculateHotelsCost = (hotels, numNights = 1) => {
  if (!Array.isArray(hotels)) return 0;
  
  let total = 0;
  
  hotels.forEach(hotel => {
    const pricePerNight = parsePrice(hotel?.pricePerNight);
    total += pricePerNight * numNights;
  });
  
  return total;
};

/**
 * Calculate total cost from flights
 */
export const calculateFlightsCost = (flights) => {
  if (!Array.isArray(flights)) return 0;
  
  let total = 0;
  
  flights.forEach(flight => {
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
  const breakdown = {
    activities: 0,
    hotels: 0,
    flights: 0
  };
  
  // Extract trip data
  let tripData = trip?.tripData;
  
  // Parse if it's a string
  if (typeof tripData === 'string') {
    try {
      tripData = JSON.parse(tripData);
    } catch (e) {
      console.error('Failed to parse tripData:', e);
      return { total: 0, breakdown };
    }
  }
  
  // Check if we have GA-First workflow total_cost (most accurate)
  if (tripData?.total_cost && typeof tripData.total_cost === 'number') {
    breakdown.activities = tripData.total_cost;
  } else {
    // Calculate from itinerary
    const itinerary = tripData?.itinerary_data || tripData?.itinerary || [];
    breakdown.activities = calculateActivitiesCost(itinerary);
  }
  
  // Calculate hotels cost
  const hotels = tripData?.hotels || [];
  const duration = trip?.userSelection?.duration || trip?.userSelection?.noOfDays || 1;
  const numNights = Math.max(1, duration - 1); // Usually nights = days - 1
  breakdown.hotels = calculateHotelsCost(hotels, numNights);
  
  // Calculate flights cost
  const flights = tripData?.flights || [];
  breakdown.flights = calculateFlightsCost(flights);
  
  // Calculate total
  const total = breakdown.activities + breakdown.hotels + breakdown.flights;
  
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
