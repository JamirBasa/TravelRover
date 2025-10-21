import { MdFlight } from "react-icons/md";

import {
  FaUser,
  FaUsers,
  FaUserFriends,
  FaHeart,
  FaMapMarkerAlt,
  FaCog,
  FaPlane,
  FaHotel,
  FaCheck,
  FaUtensils,
  FaShieldAlt,
  FaLanguage,
  FaMosque,
  FaClock, // Add this line
} from "react-icons/fa";

// ===============================
// CENTRALIZED CONSTANTS
// ===============================

// API Configuration
export const API_CONFIG = {
  BASE_URL: "http://localhost:8000/api",
  TIMEOUT: 120000, // 120 seconds (2 minutes) for GA-First workflow
  RETRY_ATTEMPTS: 3,
};

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  DEFAULT_PAGE_SIZE: 10,
  MAX_DISPLAY_ITEMS: 2,
};

// Date Configuration
export const DATE_CONFIG = {
  MIN_TRIP_DAYS: 1,
  MAX_TRIP_DAYS: 30,
  DEFAULT_TRIP_DAYS: 3,
  DATE_FORMAT: "en-US",
  DATE_OPTIONS: {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  },
};

// Flight Configuration
export const FLIGHT_CONFIG = {
  DEFAULT_DEPARTURE: {
    city: "Manila",
    region: "National Capital Region",
    regionCode: "NCR",
    country: "Philippines",
    countryCode: "PH",
  },
  SEARCH_TIMEOUT: 30000,
  MAX_RESULTS: 20,
};

// Validation Rules
export const VALIDATION_RULES = {
  MIN_BUDGET: 1000,
  MAX_BUDGET: 1000000,
  MIN_TRAVELERS: 1,
  MAX_TRAVELERS: 20,
  REQUIRED_FIELDS: {
    TRIP: ["location", "startDate", "endDate", "travelers", "budget"],
    PROFILE: ["firstName", "lastName", "email"],
    FLIGHT: ["departureCity", "departureRegionCode"],
    AI_RESPONSE: [
      "tripName",
      "destination",
      "hotels",
      "itinerary",
      "placesToVisit",
    ],
  },
  JSON_PARSING: {
    MIN_RESPONSE_LENGTH: 100,
    MAX_RETRY_ATTEMPTS: 3,
    REQUIRED_PROPERTIES: ["tripName", "destination"],
    COORDINATE_BOUNDS: {
      MIN_LAT: -90,
      MAX_LAT: 90,
      MIN_LNG: -180,
      MAX_LNG: 180,
    },
  },
};

// Messages
export const MESSAGES = {
  ERROR: {
    NETWORK_ERROR: "Network error. Please check your connection.",
    INVALID_DATE: "Please select valid travel dates.",
    INVALID_BUDGET: "Please enter a valid budget amount.",
    PROFILE_REQUIRED: "Please complete your profile first.",
    TRIP_NOT_FOUND: "Trip not found.",
    UNAUTHORIZED: "You don't have permission to access this trip.",
    GENERIC_ERROR: "Something went wrong. Please try again.",
    JSON_PARSE_ERROR:
      "Unable to process AI response. Please try generating again.",
    AI_RESPONSE_ERROR: "AI generated incomplete data. Please try again.",
    COORDINATE_ERROR: "Invalid location coordinates received.",
    VALIDATION_ERROR: "Trip data validation failed. Please check your inputs.",
  },
  SUCCESS: {
    TRIP_CREATED: "Trip created successfully!",
    PROFILE_SAVED: "Profile saved successfully!",
    TRIP_SHARED: "Trip shared successfully!",
    DATA_LOADED: "Data loaded successfully!",
  },
  LOADING: {
    CHECKING_PROFILE: "Checking your profile...",
    LOADING_TRIPS: "Loading your trips...",
    GENERATING_TRIP: "Generating your trip...",
    SEARCHING_FLIGHTS: "Searching flights...",
    SAVING_DATA: "Saving your data...",
  },
};

// Default Values
export const DEFAULT_VALUES = {
  PROFILE: {
    country: "Philippines",
    countryCode: "PH",
    region: "",
    regionCode: "",
    city: "",
  },
  TRIP: {
    duration: 3,
    travelers: "1-2 People",
    budget: "Moderate",
  },
  FLIGHT: {
    includeFlights: false,
    departureCity: "",
    departureRegion: "",
    departureRegionCode: "",
  },
};

// Step Configurations (unified for reuse)
export const STEP_CONFIGS = {
  CREATE_TRIP: [
    {
      id: 1,
      title: "Destination & Dates",
      description: "Where, when, and special requests for your trip",
      icon: FaMapMarkerAlt,
    },
    {
      id: 2,
      title: "Travel Preferences",
      description: "Budget and group size preferences",
      icon: FaCog,
    },
    {
      id: 3,
      title: "Activity Pace",
      description: "Choose your daily activity level",
      icon: FaClock,
    },
    {
      id: 4,
      title: "Flight Options",
      description: "Include flights in your itinerary",
      icon: FaPlane,
    },
    {
      id: 5,
      title: "Hotel Options",
      description: "Include hotel recommendations",
      icon: FaHotel,
    },
    {
      id: 6,
      title: "Review & Generate",
      description: "Confirm details and create your trip",
      icon: FaCheck,
    },
  ],
  USER_PROFILE: [
    {
      id: 1,
      title: "Personal Information",
      description: "Your name and contact details",
      icon: FaUser,
    },
    {
      id: 2,
      title: "Your Location",
      description: "Where you're currently based",
      icon: FaMapMarkerAlt,
    },
    {
      id: 3,
      title: "Travel Preferences",
      description: "Your travel style and interests",
      icon: FaHeart,
    },
    {
      id: 4,
      title: "Dietary & Cultural",
      description: "Food and cultural preferences",
      icon: FaMosque,
    },
    {
      id: 5,
      title: "Languages",
      description: "Languages you speak",
      icon: FaLanguage,
    },
    {
      id: 6,
      title: "Additional Details",
      description: "Emergency contacts and experience",
      icon: FaShieldAlt,
    },
    {
      id: 7,
      title: "Review Profile",
      description: "Review and confirm your profile",
      icon: FaCheck,
    },
  ],
};

// Utility Functions
export const formatCurrency = (amount) =>
  `₱${parseInt(amount).toLocaleString()}`;

export const calculateProgress = (currentStep, totalSteps) =>
  (currentStep / totalSteps) * 100;

export const getMinDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

export const getMinEndDate = (startDate) => {
  if (!startDate) return getMinDate();
  const nextDay = new Date(startDate);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString().split("T")[0];
};

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Form Validation Helpers
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
};

export const validateBudget = (budget) => {
  const numBudget = parseInt(budget);
  if (isNaN(numBudget) || numBudget < VALIDATION_RULES.MIN_BUDGET) {
    return `Budget must be at least ₱${VALIDATION_RULES.MIN_BUDGET.toLocaleString()}`;
  }
  if (numBudget > VALIDATION_RULES.MAX_BUDGET) {
    return `Budget cannot exceed ₱${VALIDATION_RULES.MAX_BUDGET.toLocaleString()}`;
  }
  return null;
};

// JSON Validation Helpers
export const validateAIResponse = (response) => {
  if (!response || typeof response !== "object") {
    return MESSAGES.ERROR.AI_RESPONSE_ERROR;
  }

  const missing = VALIDATION_RULES.REQUIRED_FIELDS.AI_RESPONSE.filter(
    (field) => !response[field]
  );

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  return null;
};

export const validateCoordinates = (lat, lng) => {
  const { MIN_LAT, MAX_LAT, MIN_LNG, MAX_LNG } =
    VALIDATION_RULES.JSON_PARSING.COORDINATE_BOUNDS;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return "Coordinates must be numbers";
  }

  if (lat < MIN_LAT || lat > MAX_LAT) {
    return `Latitude must be between ${MIN_LAT} and ${MAX_LAT}`;
  }

  if (lng < MIN_LNG || lng > MAX_LNG) {
    return `Longitude must be between ${MIN_LNG} and ${MAX_LNG}`;
  }

  return null;
};

export const sanitizeJSONString = (jsonString) => {
  if (!jsonString) return null;

  try {
    // Remove markdown code blocks
    let cleaned = jsonString
      .replace(/```json\s*/g, "")
      .replace(/```\s*$/g, "")
      .trim();

    // Find JSON boundaries
    const startIndex = cleaned.indexOf("{");
    const endIndex = cleaned.lastIndexOf("}");

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }

    return cleaned;
  } catch (error) {
    console.error("JSON sanitization error:", error);
    return null;
  }
};

// ===============================
// EXISTING OPTIONS DATA
// ===============================

export const SelectTravelList = [
  {
    id: 1,
    title: "Just Me",
    desc: "A solo travels in exploring the beauty of the Philippines.",
    icon: <FaUser style={{ color: "#3498db" }} />,
    people: "1",
  },
  {
    id: 2,
    title: "Couple Getaway",
    desc: "A romantic escape for couples to enjoy the beauty of the Philippines.",
    icon: <FaHeart style={{ color: "#e74c3c" }} />,
    people: "2 People",
  },

  {
    id: 3,
    title: "Group Tour",
    desc: "Explore the Philippines with friends and make unforgettable memories.",
    icon: <FaUserFriends style={{ color: "#f39c12" }} />,
    people: "5 to 10 People",
  },
  {
    id: 4,
    title: "Family Trip",
    desc: "A fun-filled adventure for the whole family.",
    icon: <FaUsers style={{ color: "#27ae60" }} />,
    people: "3 to 5 People",
  },
];

export const SelectBudgetOptions = [
  {
    id: 1,
    title: "Budget",
    desc: "Hostels, local food, basic activities - Perfect for backpackers",
    icon: "💰",
    value: "Budget",
  },
  {
    id: 2,
    title: "Moderate",
    desc: "Mid-range hotels, mix of dining options, popular attractions",
    icon: "💳",
    value: "Moderate",
  },
  {
    id: 3,
    title: "Luxury",
    desc: "High-end resorts, fine dining, premium experiences",
    icon: "💎",
    value: "Luxury",
  },
];

export const AI_PROMPT = `Create travel itinerary JSON for {location}, {duration}, {travelers}, {budget}.

🗺️ GEOGRAPHIC VALIDATION - ABSOLUTELY CRITICAL:
⚠️ DESTINATION: {location} (Philippines)

STRICT LOCATION REQUIREMENTS:
✅ ALL places MUST be physically located IN {location}
✅ Verify each place name includes the correct city/province identifier
✅ Only suggest attractions that are WITHIN or IMMEDIATELY ADJACENT to {location}
✅ Hotel addresses MUST explicitly mention {location} or its districts

❌ FORBIDDEN - DO NOT INCLUDE:
- Places with the same name in different Philippine regions
- Hotels/attractions that are in OTHER cities/provinces
- Places that require leaving {location} to visit
- Generic Philippine attractions not in {location}

VALIDATION EXAMPLES:
- If destination is "Manila": 
  ✅ CORRECT: "Intramuros, Manila", "Manila Ocean Park", "SM Mall of Asia, Pasay"
  ❌ WRONG: "Chocolate Hills" (Bohol), "Mayon Volcano" (Albay), "White Beach" (Boracay)
  
- If destination is "Cebu":
  ✅ CORRECT: "Magellan's Cross, Cebu City", "Kawasan Falls, Badian", "Oslob Whale Sharks"
  ❌ WRONG: "Rizal Park" (Manila), "Taal Volcano" (Batangas), "Burnham Park" (Baguio)
  
- If destination is "Palawan":
  ✅ CORRECT: "El Nido Lagoons", "Puerto Princesa Underground River", "Coron Island"
  ❌ WRONG: "Boracay Beach" (Aklan), "Panglao Island" (Bohol), "Siargao Cloud 9"

NAMING FORMAT FOR PLACES:
- Always include location qualifier: "Place Name, City/District"
- Example: "Fort Santiago, Intramuros, Manila" NOT just "Fort Santiago"
- Example: "Tops Lookout, Busay, Cebu" NOT just "Tops Lookout"
- This prevents confusion with places of the same name elsewhere

🚨 ARRIVAL & DEPARTURE LOGISTICS - CRITICAL:

📍 DAY 1 (ARRIVAL DAY):
✅ Assume traveler arrives morning/afternoon (9 AM - 3 PM typical)
✅ MANDATORY buffer time:
   - Airport/station → Hotel: 45-90 min (traffic dependent)
   - Check-in process: 15-30 min
   - Freshen up/rest: 30-60 min
   - TOTAL: 2-3 hours before first activity
✅ First activity timing:
   - If arrival 10 AM → First activity 1:00 PM earliest
   - If arrival 2 PM → First activity 5:00 PM earliest
✅ Day 1 schedule: LIGHT (2-3 activities max, 4-5 hours total)
✅ Choose nearby attractions (walking distance or 15-min ride from hotel)
✅ Example Day 1 structure:
   - "2:00 PM - Hotel check-in and rest"
   - "4:30 PM - Welcome walk at [nearby attraction]"
   - "7:00 PM - Dinner at local restaurant"

📍 LAST DAY (DEPARTURE DAY):
✅ Assume departure afternoon/evening (2 PM - 8 PM typical)
✅ MANDATORY buffer time:
   - Hotel check-out: 12:00 PM (standard)
   - Pre-checkout packing: 60 min before
   - Hotel → Airport: 45-90 min (traffic)
   - Airport early arrival: 2-3 hrs domestic, 3-4 hrs international
   - TOTAL: Plan last activity END 4-5 hours before departure
✅ Last day schedule: VERY LIGHT (1-2 activities max, 3 hours total)
✅ Morning-only activities near hotel
✅ Example Last Day structure:
   - "7:30 AM - Breakfast at hotel cafe"
   - "9:00 AM - Quick souvenir shopping nearby"
   - "11:00 AM - Return to hotel, pack and check-out"
   - "12:30 PM - Departure transfer to airport"

🕐 TRAVEL TIME BETWEEN ACTIVITIES (ALL DAYS):

REALISTIC TRAVEL TIME RULES:
✅ Same neighborhood/district: 15-30 minutes
✅ Across city zones: 30-60 minutes
✅ City center ↔ Suburbs: 60-120 minutes
✅ Major city traffic multiplier: +30-50% (Manila, Cebu, Davao)
✅ Peak hours (7-9 AM, 5-7 PM): +50-100% travel time

ACTIVITY SPACING:
✅ Activity duration + Travel time + Buffer = Gap between activities
✅ Example: 1-hour activity + 30-min travel + 15-min buffer = 1.75 hours minimum gap
✅ DON'T schedule back-to-back without accounting for transit
✅ Sample realistic schedule:
   - "9:00 AM - Museum (2 hours)"
   - "12:00 PM - Lunch (1 hour)" [30-min travel included]
   - "2:30 PM - Park (1.5 hours)" [30-min travel, 30-min rest included]
   - "5:30 PM - Return to hotel" [30-min travel]

TIMETRAVEL FIELD FORMAT:
✅ Always include both transit and visit duration:
   - "30 minutes travel from hotel + 2 hours visit"
   - "15 minutes walking distance + 1.5 hours activity"
   - "45 minutes drive + 3 hours exploration"
✅ Be specific about transportation mode when relevant:
   - "20 minutes by taxi + 1 hour dining"
   - "10 minutes walking + 2 hours sightseeing"

GEOGRAPHIC CLUSTERING:
✅ Group nearby attractions on same day to minimize transit
✅ Avoid zigzagging across city - cluster by neighborhood
✅ Example good clustering:
   - Day 2: All Intramuros area attractions
   - Day 3: All Makati/BGC area attractions
   - Day 4: Bay area attractions (MOA, Bay Walk, etc.)

DAILY SCHEDULE REALISM:
✅ Include mandatory breaks:
   - Breakfast: 7:00-9:00 AM (30-60 min)
   - Lunch: 12:00-2:00 PM (60-90 min)
   - Dinner: 6:00-8:00 PM (60-90 min)
   - Rest periods: 30-60 min between intense activities
✅ Active hours per day (excluding meals/rest):
   - Day 1 (Arrival): 3-4 hours
   - Middle days: 6-8 hours

🎯 ACTIVITY PACE - USER PREFERENCE:
The traveler has selected: {activityPreference} activities per day

ACTIVITY COUNT RULES:
✅ MIDDLE DAYS (Day 2 to Day N-1): Generate EXACTLY {activityPreference} main activities per day
✅ DAY 1 (Arrival): 1-2 activities maximum (regardless of user preference)
✅ LAST DAY (Departure): 0-1 activities maximum (regardless of user preference)
✅ Meals (breakfast, lunch, dinner) DON'T count toward activity limit
✅ "Return to hotel" or transit DON'T count toward activity limit

PACING BY ACTIVITY COUNT:
- 1 activity/day: Relaxed pace, more downtime, longer at each place (elderly, families with kids)
- 2 activities/day: Balanced pace, comfortable exploration (first-timers, balanced schedules)
- 3 activities/day: Active pace, efficient use of time (experienced travelers)
- 4 activities/day: Intensive pace, maximize experiences (short trips, energetic travelers)

EXAMPLES:
If user selected 2 activities/day for a 3-day trip:
- Day 1 (Arrival): 1-2 activities (max)
- Day 2 (Middle): EXACTLY 2 activities
- Day 3 (Departure): 0-1 activities (max)

If user selected 4 activities/day for a 5-day trip:
- Day 1 (Arrival): 1-2 activities (max)
- Days 2-4 (Middle): EXACTLY 4 activities each
- Day 5 (Departure): 0-1 activities (max)
   - Last day (Departure): 2-3 hours
✅ Don't exceed 10 hours total scheduled time per day

PLACE DETAILS ENHANCEMENTS:
✅ Always mention distance/time from hotel or previous location:
   - "15-minute taxi ride from hotel"
   - "Walking distance from previous location"
   - "1-hour scenic drive along coast"
✅ Include accessibility notes:
   - "Accessible by jeepney (₱15, 25 mins)"
   - "Best reached by Grab/taxi (₱200, 30 mins)"
   - "Walking distance through pedestrian mall"

CRITICAL JSON REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no extra text, no code blocks
- NO trailing commas before } or ]
- Complete all objects and arrays properly
- Use real coordinates and PHP pricing
- 3-4 hotels, 2-4 activities/day, 5-8 attractions
- Budget levels: Budget ₱2-8K, Moderate ₱8-20K, Luxury ₱20K+
- Descriptions under 80 chars
- Must include: tripName, destination, hotels, itinerary, placesToVisit
- Response must be parseable by JSON.parse()
- End with proper closing brace }

FORBIDDEN:
- Trailing commas like "value",}
- Incomplete objects like {...
- Extra text after JSON
- Missing closing braces
- Activities immediately after arrival (no transit buffer)
- Activities too close to departure time
- Back-to-back schedules without travel time
- Unrealistic cross-city travel times
- Ignoring traffic conditions
- Scheduling during typical check-in/check-out times

REQUESTS: {specificRequests}

Generate complete, valid JSON that passes JSON.parse() validation with REALISTIC travel logistics.`;

export const HOTEL_CONFIG = {
  GOOGLE_PLACES_API_KEY: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
  SEARCH_RADIUS: 50000, // 50km radius
  HOTEL_TYPES: ["lodging", "hotel", "resort"],
  MAX_RESULTS: 20,
  PRICE_LEVELS: {
    1: "Budget (₱500-1,500)",
    2: "Economy (₱1,500-3,500)",
    3: "Moderate (₱3,500-8,000)",
    4: "Upscale (₱8,000-15,000)",
    5: "Luxury (₱15,000-30,000)",
    6: "Ultra-Luxury (₱30,000+)",
  },
  PRICE_DESCRIPTIONS: {
    1: "Basic hostels, backpacker inns, fan rooms, shared facilities",
    2: "Budget hotels, air-con rooms, private bath, basic amenities",
    3: "Mid-range hotels, good comfort, swimming pool, restaurant",
    4: "Quality hotels, excellent service, full amenities, business facilities",
    5: "Premium resorts, luxury suites, spa, multiple dining options",
    6: "5-star resorts, exclusive villas, private beaches, world-class service",
  },
  DEFAULT_CHECKIN_DAYS: 7, // Days from now
  DEFAULT_CHECKOUT_DAYS: 10, // Days from now
};
