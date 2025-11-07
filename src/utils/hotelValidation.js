/**
 * Hotel Preferences Validation Utilities
 * Ensures consistency between UI selections and API requirements
 */

import { HOTEL_CONFIG } from "../constants/options";
import { parseTravelersToNumber, validateTravelers } from "./travelersParsers";

/**
 * Validates hotel data for consistency and completeness
 * @param {object} hotelData - Hotel preferences from form
 * @param {object} formData - Trip form data (dates, travelers, etc.)
 * @returns {object} - Validation result { isValid: boolean, errors: string[] }
 */
export function validateHotelData(hotelData, formData) {
  const errors = [];

  // If hotels not included, skip all validation
  if (!hotelData.includeHotels) {
    return { isValid: true, errors: [], warnings: [] };
  }

  // Validate accommodation type (required)
  if (!hotelData.preferredType || hotelData.preferredType.trim() === "") {
    errors.push("Please select an accommodation type");
  }

  // Validate budget level (required)
  if (
    !hotelData.budgetLevel ||
    hotelData.budgetLevel < 1 ||
    hotelData.budgetLevel > 6
  ) {
    errors.push("Please select a valid budget range");
  }

  // Enhanced date validation with better error messages
  if (!formData?.startDate || !formData?.endDate) {
    errors.push("Trip dates are required for hotel search. Please go back to Step 2 to set your travel dates.");
  } else {
    // Validate date logic only if dates exist
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      errors.push("Check-in date cannot be in the past. Please update your travel dates in Step 2.");
    }

    if (endDate <= startDate) {
      errors.push("Check-out date must be after check-in date. Please update your dates in Step 2.");
    }

    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (nights > 90) {
      errors.push("Hotel stays longer than 90 nights are not supported");
    }
  }

  // Enhanced travelers validation with centralized parser
  const travelersCount = parseTravelersToNumber(formData?.travelers);
  const travelersValidation = validateTravelers(travelersCount);
  
  // Debug logging
  console.log('🔍 validateHotelData - Travelers Debug:', {
    raw: formData?.travelers,
    type: typeof formData?.travelers,
    parsed: travelersCount,
    isValid: travelersValidation.isValid
  });
  
  if (!travelersValidation.isValid) {
    errors.push(travelersValidation.error || "Number of travelers is required for hotel search. Please go back to Step 3 to set the number of guests.");
  }

  const warnings = [];

  // Warn about peak season pricing
  if (formData?.startDate) {
    const month = new Date(formData.startDate).getMonth();
    // December, January, April (holiday seasons in Philippines)
    if ([0, 3, 11].includes(month)) {
      warnings.push(
        "Peak season detected: Hotel prices may be 20-50% higher than usual"
      );
    }
  }

  // Warn about large group bookings (use extracted count)
  if (travelersCount > 4) {
    warnings.push(
      "Large group detected: Consider booking multiple rooms or contacting hotels directly"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Maps UI budget level (1-6) to Google Places API price level (0-4)
 * @param {number} budgetLevel - User-selected budget level (1-6)
 * @returns {number} - Google Places API price level (0-4)
 */
export function mapToGooglePriceLevel(budgetLevel) {
  return HOTEL_CONFIG.GOOGLE_PRICE_LEVEL_MAP[budgetLevel] || 2;
}

/**
 * Maps accommodation type to Google Places API types array
 * @param {string} accommodationType - User-selected type (hotel, resort, etc.)
 * @returns {string[]} - Array of Google Places types to search
 */
export function mapToGooglePlacesTypes(accommodationType) {
  return (
    HOTEL_CONFIG.ACCOMMODATION_TYPE_MAP[accommodationType] || ["lodging"]
  );
}

/**
 * Calculate realistic hotel budget estimate
 * @param {number} budgetLevel - Budget level (1-6)
 * @param {number} nights - Number of nights
 * @param {number|string} travelers - Number of travelers (integer or parseable format)
 * @returns {object} - { min, max, perNight, total, currency }
 */
export function calculateHotelBudget(budgetLevel, nights, travelers = 1) {
  // Use centralized parser to handle any format
  const travelersCount = parseTravelersToNumber(travelers);

  // Base price ranges per night (in PHP)
  const priceRanges = {
    1: { min: 500, max: 1500 },
    2: { min: 1500, max: 3500 },
    3: { min: 3500, max: 8000 },
    4: { min: 8000, max: 15000 },
    5: { min: 15000, max: 30000 },
    6: { min: 30000, max: 50000 },
  };

  const range = priceRanges[budgetLevel] || priceRanges[2];

  // Calculate total cost
  const totalMin = range.min * nights;
  const totalMax = range.max * nights;

  // Room calculation (assuming 2 travelers per room)
  const roomsNeeded = Math.ceil(travelersCount / 2);
  const adjustedMin = totalMin * roomsNeeded;
  const adjustedMax = totalMax * roomsNeeded;

  return {
    perNightMin: range.min,
    perNightMax: range.max,
    totalMin: adjustedMin,
    totalMax: adjustedMax,
    nights,
    travelers: travelersCount,
    roomsNeeded,
    currency: "PHP",
    formatted: {
      perNight: `₱${range.min.toLocaleString()} - ₱${range.max.toLocaleString()}`,
      total: `₱${adjustedMin.toLocaleString()} - ₱${adjustedMax.toLocaleString()}`,
    },
  };
}

/**
 * Get accommodation search parameters for API calls
 * @param {object} hotelData - Hotel preferences
 * @param {object} formData - Trip data
 * @returns {object} - Formatted parameters for hotel search APIs
 */
export function getHotelSearchParams(hotelData, formData) {
  // Parse travelers to ensure it's a number (for backward compatibility)
  const travelersCount = typeof formData.travelers === 'number' 
    ? formData.travelers 
    : parseInt(formData.travelers, 10) || 1;

  return {
    destination: formData.location,
    checkInDate: formData.startDate,
    checkOutDate: formData.endDate,
    guests: travelersCount,
    rooms: Math.ceil(travelersCount / 2),
    priceLevel: mapToGooglePriceLevel(hotelData.budgetLevel),
    types: mapToGooglePlacesTypes(hotelData.preferredType),
    budgetRange: HOTEL_CONFIG.PRICE_LEVELS[hotelData.budgetLevel],
    accommodationType: hotelData.preferredType,
  };
}

/**
 * Format hotel data for display
 * @param {object} hotelData - Hotel preferences
 * @param {object} formData - Trip data
 * @returns {object} - Formatted display data
 */
export function formatHotelDisplay(hotelData, formData) {
  if (!hotelData.includeHotels) {
    return null;
  }

  // Parse travelers to ensure it's a number (for backward compatibility)
  const travelersCount = typeof formData.travelers === 'number' 
    ? formData.travelers 
    : parseInt(formData.travelers, 10) || 1;

  const nights = formData.startDate && formData.endDate
    ? Math.ceil(
        (new Date(formData.endDate) - new Date(formData.startDate)) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const budget = calculateHotelBudget(
    hotelData.budgetLevel,
    nights,
    formData.travelers
  );

  return {
    accommodationType: hotelData.preferredType,
    budgetLevel: HOTEL_CONFIG.PRICE_LEVELS[hotelData.budgetLevel],
    nights,
    checkIn: formData.startDate
      ? new Date(formData.startDate).toLocaleDateString()
      : "Not set",
    checkOut: formData.endDate
      ? new Date(formData.endDate).toLocaleDateString()
      : "Not set",
    guests: travelersCount,
    estimatedCost: budget.formatted.total,
  };
}
