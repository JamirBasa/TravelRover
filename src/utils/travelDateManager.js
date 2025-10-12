/**
 * Travel Date Manager
 * Handles date calculations for trips including flight buffers and realistic travel timing
 */

/**
 * Calculate recommended flight and hotel dates based on trip preferences
 * @param {Object} params - Trip parameters
 * @returns {Object} Adjusted dates for flights, hotels, and activities
 */
export const calculateTravelDates = ({
  startDate,
  endDate,
  includeFlights = false,
  departureCity = "",
  destination = "",
  travelers = "",
}) => {
  const tripStartDate = new Date(startDate);
  const tripEndDate = new Date(endDate);

  // Default: User wants to BE at destination during these dates
  let flightDepartureDate = tripStartDate;
  let flightReturnDate = tripEndDate;
  let hotelCheckInDate = tripStartDate;
  let hotelCheckOutDate = tripEndDate;
  let activitiesStartDate = tripStartDate;
  let activitiesEndDate = tripEndDate;

  // If flights are included, we need to adjust for travel time
  if (includeFlights && departureCity && destination) {
    const travelInfo = estimateTravelTime(departureCity, destination);

    // Morning departure scenario (most common)
    if (travelInfo.needsBufferDay) {
      // For distant destinations (international or far domestic)
      // Depart day before to arrive by start date
      flightDepartureDate = new Date(tripStartDate);
      flightDepartureDate.setDate(flightDepartureDate.getDate() - 1);

      // Return flight on last day (depart evening)
      flightReturnDate = tripEndDate;

      // Hotel: Check in on arrival (start date), check out after last night
      hotelCheckInDate = tripStartDate;
      const hotelCheckOut = new Date(tripEndDate);
      hotelCheckOut.setDate(hotelCheckOut.getDate() + 1);
      hotelCheckOutDate = hotelCheckOut;

      // Activities: Start date (arrive refreshed) to end date
      activitiesStartDate = tripStartDate;
      activitiesEndDate = tripEndDate;
    } else if (travelInfo.isDomesticShort) {
      // For nearby domestic (1-2 hours flight)
      // Depart morning of start date, arrive by noon
      flightDepartureDate = tripStartDate;
      flightReturnDate = tripEndDate;

      // Hotel: Check in start date afternoon, check out end date
      hotelCheckInDate = tripStartDate;
      const hotelCheckOut = new Date(tripEndDate);
      hotelCheckOut.setDate(hotelCheckOut.getDate() + 1);
      hotelCheckOutDate = hotelCheckOut;

      // Activities: Start afternoon of day 1, full days until departure
      activitiesStartDate = tripStartDate;
      activitiesEndDate = tripEndDate;
    } else {
      // For same-region travel (land transport alternative)
      // User likely handling own transport
      flightDepartureDate = tripStartDate;
      flightReturnDate = tripEndDate;
      hotelCheckInDate = tripStartDate;
      const hotelCheckOut = new Date(tripEndDate);
      hotelCheckOut.setDate(hotelCheckOut.getDate() + 1);
      hotelCheckOutDate = hotelCheckOut;
      activitiesStartDate = tripStartDate;
      activitiesEndDate = tripEndDate;
    }
  } else {
    // No flights - user handles their own transport
    // Hotel: standard check-in to check-out
    const hotelCheckOut = new Date(tripEndDate);
    hotelCheckOut.setDate(hotelCheckOut.getDate() + 1);
    hotelCheckOutDate = hotelCheckOut;
  }

  return {
    // Original trip dates (user's intended "in destination" dates)
    tripStartDate: formatDateForAPI(tripStartDate),
    tripEndDate: formatDateForAPI(tripEndDate),

    // Flight search dates
    flightDepartureDate: formatDateForAPI(flightDepartureDate),
    flightReturnDate: formatDateForAPI(flightReturnDate),
    flightDepartureTime: "morning", // Preference for morning flights

    // Hotel search dates
    hotelCheckInDate: formatDateForAPI(hotelCheckInDate),
    hotelCheckOutDate: formatDateForAPI(hotelCheckOutDate),

    // Activity planning dates
    activitiesStartDate: formatDateForAPI(activitiesStartDate),
    activitiesEndDate: formatDateForAPI(activitiesEndDate),

    // Metadata
    includesArrivalDay: flightDepartureDate < tripStartDate,
    includesDepartureDay: true,
    totalNights: Math.ceil(
      (new Date(hotelCheckOutDate) - new Date(hotelCheckInDate)) /
        (1000 * 60 * 60 * 24)
    ),
    totalDays: Math.ceil(
      (tripEndDate - tripStartDate) / (1000 * 60 * 60 * 24)
    ) + 1,
    travelInfo,
  };
};

/**
 * Estimate travel time and requirements between locations
 * @param {string} origin - Departure city
 * @param {string} destination - Destination city
 * @returns {Object} Travel information and recommendations
 */
export const estimateTravelTime = (origin, destination) => {
  // Normalize inputs
  const from = origin.toLowerCase();
  const to = destination.toLowerCase();

  // International destinations always need buffer
  const internationalDestinations = [
    "japan",
    "korea",
    "singapore",
    "thailand",
    "malaysia",
    "vietnam",
    "taiwan",
    "hongkong",
    "hong kong",
    "usa",
    "dubai",
    "bali",
    "indonesia",
  ];

  const isInternational = internationalDestinations.some(
    (country) => to.includes(country)
  );

  if (isInternational) {
    return {
      needsBufferDay: true,
      isDomesticShort: false,
      isInternational: true,
      estimatedFlightHours: 3,
      recommendation:
        "International flight - depart day before to arrive refreshed",
      travelType: "international",
    };
  }

  // Domestic Philippines routing
  const domesticShortFlights = {
    // From Manila
    manila: ["cebu", "boracay", "palawan", "bohol", "siargao", "davao"],
    // From Cebu
    cebu: ["manila", "bohol", "siargao", "palawan"],
    // From Davao
    davao: ["manila", "cebu"],
  };

  // Check if it's a short domestic flight (1-2 hours)
  const originKey = Object.keys(domesticShortFlights).find((city) =>
    from.includes(city)
  );
  const isShortDomestic =
    originKey &&
    domesticShortFlights[originKey].some((dest) => to.includes(dest));

  if (isShortDomestic) {
    return {
      needsBufferDay: false,
      isDomesticShort: true,
      isInternational: false,
      estimatedFlightHours: 1.5,
      recommendation: "Short domestic flight - morning departure recommended",
      travelType: "domestic-short",
    };
  }

  // Far domestic flights (3+ hours) or multiple connections
  const farDomesticDestinations = [
    "batanes",
    "mindanao",
    "general santos",
    "zamboanga",
  ];
  const isFarDomestic = farDomesticDestinations.some((dest) =>
    to.includes(dest)
  );

  if (isFarDomestic) {
    return {
      needsBufferDay: true,
      isDomesticShort: false,
      isInternational: false,
      estimatedFlightHours: 3,
      recommendation: "Remote destination - early departure or buffer day",
      travelType: "domestic-far",
    };
  }

  // Same region / land travel possible
  return {
    needsBufferDay: false,
    isDomesticShort: false,
    isInternational: false,
    estimatedFlightHours: 0,
    recommendation: "Land travel may be more convenient",
    travelType: "local",
  };
};

/**
 * Format date for API consumption (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
const formatDateForAPI = (date) => {
  return date.toISOString().split("T")[0];
};

/**
 * Get user-friendly date explanation for the UI
 * @param {Object} dateInfo - Result from calculateTravelDates
 * @returns {string} Human-readable explanation
 */
export const getDateExplanation = (dateInfo) => {
  if (!dateInfo.includesArrivalDay) {
    return `Your trip runs ${dateInfo.tripStartDate} to ${dateInfo.tripEndDate}. ${
      dateInfo.travelInfo.isDomesticShort
        ? "Morning flight on departure day - arrive by noon and start exploring!"
        : "You'll handle your own transport to the destination."
    }`;
  }

  return `Your trip is ${dateInfo.tripStartDate} to ${dateInfo.tripEndDate}. ${
    dateInfo.travelInfo.isInternational
      ? `We recommend flying out on ${dateInfo.flightDepartureDate} (day before) for international travel, so you arrive fresh and ready to explore.`
      : `We recommend an early morning flight on ${dateInfo.flightDepartureDate} to maximize your time.`
  } Return flight on ${dateInfo.flightReturnDate}.`;
};

/**
 * Get activity planning guidance based on dates
 * @param {Object} dateInfo - Result from calculateTravelDates
 * @returns {Array} Day-by-day activity recommendations
 */
export const getActivityGuidance = (dateInfo) => {
  const guidance = [];
  const { activitiesStartDate, activitiesEndDate, travelInfo } = dateInfo;

  const startDate = new Date(activitiesStartDate);
  const endDate = new Date(activitiesEndDate);
  const dayCount =
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Day 1 guidance
  if (travelInfo.isDomesticShort) {
    guidance.push({
      day: 1,
      timing: "Afternoon/Evening",
      note: "Arrive by noon - plan light activities for first afternoon",
      recommendedPace: "relaxed",
    });
  } else if (travelInfo.isInternational || travelInfo.needsBufferDay) {
    guidance.push({
      day: 1,
      timing: "Full Day",
      note: "Full day of activities - you arrived yesterday",
      recommendedPace: "active",
    });
  } else {
    guidance.push({
      day: 1,
      timing: "Full Day",
      note: "Full day of activities",
      recommendedPace: "active",
    });
  }

  // Middle days - full activities
  for (let i = 2; i < dayCount; i++) {
    guidance.push({
      day: i,
      timing: "Full Day",
      note: "Full day of activities",
      recommendedPace: "active",
    });
  }

  // Last day guidance
  guidance.push({
    day: dayCount,
    timing: "Morning/Afternoon",
    note: "Check out and depart - plan morning activities only",
    recommendedPace: "relaxed",
  });

  return guidance;
};

/**
 * Validate if selected dates make sense for the trip
 * @param {Object} params - Trip parameters
 * @returns {Object} Validation result
 */
export const validateTravelDates = ({
  startDate,
  endDate,
  includeFlights,
  departureCity,
  destination,
}) => {
  const errors = [];
  const warnings = [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Basic validations
  if (start < today) {
    errors.push("Start date cannot be in the past");
  }

  if (end <= start) {
    errors.push("End date must be after start date");
  }

  const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Trip length warnings
  if (dayCount < 2 && includeFlights) {
    warnings.push(
      "Very short trip with flights - consider adding more days to enjoy your destination"
    );
  }

  if (dayCount === 1 && includeFlights) {
    const travelInfo = estimateTravelTime(departureCity, destination);
    if (travelInfo.isInternational) {
      errors.push(
        "1-day international trip is not feasible - add at least 2 more days"
      );
    } else if (!travelInfo.isDomesticShort) {
      warnings.push(
        "1-day trip with travel time - very rushed. Consider adding 1-2 days."
      );
    }
  }

  // Advance booking recommendations
  const daysUntilTrip = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

  if (daysUntilTrip < 7 && includeFlights) {
    warnings.push(
      "Booking less than a week in advance - flight prices may be higher"
    );
  }

  if (daysUntilTrip > 365) {
    warnings.push(
      "Booking more than a year in advance - prices may not be available yet"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    dayCount,
    daysUntilTrip,
  };
};
