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
  
  // Initialize travelInfo with default values (for cases without flights)
  let travelInfo = {
    needsBufferDay: false,
    isDomesticShort: false,
    isInternational: false,
    estimatedFlightHours: 0,
    recommendation: "Self-arranged transport",
    travelType: "self-transport",
  };

  // If flights are included, we need to adjust for travel time
  if (includeFlights && departureCity && destination) {
    travelInfo = estimateTravelTime(departureCity, destination);

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
 * Estimate travel time and requirements between Philippine locations
 * Philippines-only travel planning system
 * @param {string} origin - Departure city (Philippine location)
 * @param {string} destination - Destination city (Philippine location)
 * @returns {Object} Travel information and recommendations
 */
export const estimateTravelTime = (origin, destination) => {
  // Normalize inputs
  const from = origin.toLowerCase();
  const to = destination.toLowerCase();

  // ✅ PHILIPPINES ONLY: Domestic routing within the Philippines
  const domesticShortFlights = {
    // From Manila (National Capital Region)
    manila: [
      "cebu", "boracay", "caticlan", "kalibo", "palawan", "puerto princesa", 
      "el nido", "bohol", "tagbilaran", "siargao", "davao", "iloilo", 
      "bacolod", "dumaguete", "cagayan de oro", "clark", "subic", "baguio"
    ],
    // From Cebu (Visayas hub)
    cebu: [
      "manila", "bohol", "tagbilaran", "siargao", "palawan", "puerto princesa",
      "davao", "cagayan de oro", "iloilo", "bacolod", "dumaguete", "boracay",
      "caticlan", "ormoc", "tacloban"
    ],
    // From Davao (Mindanao hub)
    davao: [
      "manila", "cebu", "siargao", "general santos", "zamboanga", 
      "cagayan de oro", "palawan", "tagbilaran", "iloilo"
    ],
    // From Clark (Luzon alternative)
    clark: [
      "manila", "cebu", "boracay", "palawan", "davao", "iloilo", "bacolod", "baguio"
    ],
    // From Iloilo (Western Visayas)
    iloilo: [
      "manila", "cebu", "boracay", "caticlan", "davao", "puerto princesa", "palawan"
    ],
    // From Palawan
    palawan: ["manila", "cebu", "el nido", "puerto princesa", "coron", "davao"],
    "puerto princesa": ["manila", "cebu", "el nido", "coron", "iloilo"],
    // From Bacolod
    bacolod: ["manila", "cebu", "davao", "iloilo"],
    // From Cagayan de Oro
    "cagayan de oro": ["manila", "cebu", "davao"],
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

  // Far domestic flights within Philippines (3+ hours) or remote destinations
  const farDomesticDestinations = [
    "batanes", // Northernmost Philippines
    "itbayat", // Batanes islands
    "general santos", // Southern Mindanao
    "zamboanga", // Western Mindanao
    "sulu", // Far south
    "tawi-tawi", // Southernmost Philippines
    "jolo", // Sulu archipelago
    "cotabato", // BARMM region
    "marawi", // Lanao del Sur
    "pagadian", // Zamboanga del Sur
    "dipolog", // Zamboanga del Norte
    "surigao", // Northeastern Mindanao
    "tandag", // Surigao del Sur
    "camiguin", // Island province
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
      recommendation: "Remote Philippine destination - early departure or buffer day recommended",
      travelType: "domestic-far",
    };
  }

  // Same region / land travel possible within Philippines
  // For nearby destinations where bus, van, or ferry is common
  return {
    needsBufferDay: false,
    isDomesticShort: false,
    isInternational: false,
    estimatedFlightHours: 0,
    recommendation: "Land or sea travel within Philippines - convenient transport options available",
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
 * Get user-friendly date explanation for the UI (Philippines travel)
 * @param {Object} dateInfo - Result from calculateTravelDates
 * @returns {string} Human-readable explanation
 */
export const getDateExplanation = (dateInfo) => {
  if (!dateInfo.includesArrivalDay) {
    return `Your trip runs ${dateInfo.tripStartDate} to ${dateInfo.tripEndDate}. ${
      dateInfo.travelInfo.isDomesticShort
        ? "Morning flight recommended - arrive by noon and start exploring the Philippines!"
        : "You'll handle your own transport within the Philippines (bus, ferry, or private vehicle)."
    }`;
  }

  return `Your Philippine adventure is ${dateInfo.tripStartDate} to ${dateInfo.tripEndDate}. ${
    dateInfo.travelInfo.travelType === "domestic-far"
      ? `We recommend flying out on ${dateInfo.flightDepartureDate} (day before) for remote destinations like Batanes or Zamboanga, so you arrive fresh and ready to explore.`
      : `We recommend an early morning domestic flight on ${dateInfo.flightDepartureDate} to maximize your time exploring.`
  } Return flight on ${dateInfo.flightReturnDate}.`;
};

/**
 * Get activity planning guidance based on dates
 * @param {Object} dateInfo - Result from calculateTravelDates
 * @returns {Array} Day-by-day activity recommendations
 */
export const getActivityGuidance = (dateInfo) => {
  const guidance = [];
  const { activitiesStartDate, activitiesEndDate, totalNights, travelInfo } = dateInfo;

  const startDate = new Date(activitiesStartDate);
  const endDate = new Date(activitiesEndDate);
  
  // Calculate actual activity days (not including checkout day)
  const activityDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

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
  for (let i = 2; i < activityDays; i++) {
    guidance.push({
      day: i,
      timing: "Full Day",
      note: "Full day of activities",
      recommendedPace: "active",
    });
  }

  // Last day guidance (final activity day, not checkout day)
  if (activityDays > 1) {
    guidance.push({
      day: activityDays,
      timing: "Full Day",
      note: "Final day of activities - hotel checkout is tomorrow morning",
      recommendedPace: "active",
    });
  }

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

  // Trip length warnings for Philippine travel
  if (dayCount < 2 && includeFlights) {
    warnings.push(
      "Very short trip with domestic flights - consider adding more days to fully enjoy your Philippine destination"
    );
  }

  if (dayCount === 1 && includeFlights) {
    const travelInfo = estimateTravelTime(departureCity, destination);
    if (travelInfo.travelType === "domestic-far") {
      errors.push(
        "1-day trip to remote Philippine destinations (Batanes, Zamboanga, etc.) is not feasible - add at least 2 more days"
      );
    } else if (!travelInfo.isDomesticShort) {
      warnings.push(
        "1-day trip with travel time within Philippines - very rushed. Consider adding 1-2 days."
      );
    }
  }

  // Advance booking recommendations for Philippine domestic travel
  const daysUntilTrip = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

  if (daysUntilTrip < 7 && includeFlights) {
    warnings.push(
      "Booking less than a week in advance - Philippine domestic flight prices may be higher, especially for popular routes"
    );
  }

  if (daysUntilTrip < 3 && includeFlights) {
    warnings.push(
      "Last-minute booking - limited seat availability for Philippine flights. Book now!"
    );
  }

  if (daysUntilTrip > 365) {
    warnings.push(
      "Booking more than a year in advance - Philippine airline prices may not be available yet"
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
