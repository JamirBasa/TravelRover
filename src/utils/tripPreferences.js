/**
 * Utility functions for handling trip preferences (flights, hotels)
 * Ensures consistent behavior across components
 */

/**
 * Check if flights should be included in trip generation
 * @param {Object} flightData - Flight preferences object
 * @returns {boolean} - Whether flights should be included
 */
export const shouldIncludeFlights = (flightData) => {
  return Boolean(
    flightData?.includeFlights && 
    flightData?.departureCity && 
    flightData?.departureRegionCode
  );
};

/**
 * Check if hotels should be included in trip generation
 * @param {Object} hotelData - Hotel preferences object
 * @returns {boolean} - Whether hotels should be included
 */
export const shouldIncludeHotels = (hotelData) => {
  return Boolean(
    hotelData?.includeHotels && 
    hotelData?.preferredType
  );
};

/**
 * Validate flight data completeness
 * @param {Object} flightData - Flight preferences object
 * @returns {Object} - Validation result with errors if any
 */
export const validateFlightData = (flightData) => {
  const errors = [];
  
  if (!flightData?.includeFlights) {
    return { isValid: true, errors: [] }; // Not required if not selected
  }
  
  if (!flightData.departureCity) {
    errors.push("Departure city is required for flight search");
  }
  
  if (!flightData.departureRegionCode) {
    errors.push("Departure region is required for flight search");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate hotel data completeness
 * @param {Object} hotelData - Hotel preferences object
 * @returns {Object} - Validation result with errors if any
 */
export const validateHotelData = (hotelData) => {
  const errors = [];
  
  if (!hotelData?.includeHotels) {
    return { isValid: true, errors: [] }; // Not required if not selected
  }
  
  if (!hotelData.preferredType) {
    errors.push("Accommodation type is required for hotel search");
  }
  
  if (!hotelData.budgetLevel || hotelData.budgetLevel < 1 || hotelData.budgetLevel > 4) {
    errors.push("Valid budget level is required for hotel search");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get active services based on user preferences
 * @param {Object} flightData - Flight preferences
 * @param {Object} hotelData - Hotel preferences
 * @returns {Object} - Object indicating which services are active
 */
export const getActiveServices = (flightData, hotelData) => {
  return {
    flights: shouldIncludeFlights(flightData),
    hotels: shouldIncludeHotels(hotelData),
    hasAnyAgent: shouldIncludeFlights(flightData) || shouldIncludeHotels(hotelData)
  };
};

/**
 * Generate service-specific messages for user feedback
 * @param {Object} flightData - Flight preferences
 * @param {Object} hotelData - Hotel preferences
 * @returns {Array} - Array of service descriptions
 */
export const getServiceDescriptions = (flightData, hotelData) => {
  const services = [];
  
  if (shouldIncludeFlights(flightData)) {
    services.push(`✈️ Flight search from ${flightData.departureCity}`);
  }
  
  if (shouldIncludeHotels(hotelData)) {
    services.push(`🏨 ${hotelData.preferredType} accommodations (${hotelData.priceRange || 'Budget level ' + hotelData.budgetLevel})`);
  }
  
  if (services.length === 0) {
    services.push("📝 AI-generated itinerary only");
  }
  
  return services;
};

/**
 * Check if trip has complete booking information
 * @param {Object} trip - Trip object from database
 * @returns {Object} - Object indicating availability of booking data
 */
export const getTripBookingStatus = (trip) => {
  return {
    hasFlights: Boolean(
      trip?.flightResults?.success && 
      trip?.flightResults?.flights?.length > 0
    ),
    hasHotels: Boolean(
      trip?.hotelResults?.success && 
      trip?.hotelResults?.hotels?.length > 0
    ),
    hasLangGraphData: Boolean(
      trip?.langGraphResults?.success &&
      trip?.langGraphResults?.optimized_plan
    ),
    // Legacy support
    hasRealFlights: Boolean(trip?.hasRealFlights),
    hasRealHotels: Boolean(trip?.hasRealHotels)
  };
};

/**
 * Sanitize trip preferences for database storage
 * @param {Object} flightData - Flight preferences
 * @param {Object} hotelData - Hotel preferences
 * @returns {Object} - Sanitized preferences object
 */
export const sanitizeTripPreferences = (flightData, hotelData) => {
  const preferences = {
    flights: {
      included: shouldIncludeFlights(flightData),
      ...(shouldIncludeFlights(flightData) && {
        departureCity: flightData.departureCity,
        departureRegion: flightData.departureRegion,
        departureRegionCode: flightData.departureRegionCode
      })
    },
    hotels: {
      included: shouldIncludeHotels(hotelData),
      ...(shouldIncludeHotels(hotelData) && {
        preferredType: hotelData.preferredType,
        budgetLevel: hotelData.budgetLevel,
        priceRange: hotelData.priceRange
      })
    }
  };
  
  return preferences;
};