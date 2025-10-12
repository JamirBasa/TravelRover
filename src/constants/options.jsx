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
      title: "Flight Options",
      description: "Include flights in your itinerary",
      icon: FaPlane,
    },
    {
      id: 4,
      title: "Hotel Options",
      description: "Include hotel recommendations",
      icon: FaHotel,
    },
    {
      id: 5,
      title: "Review & Generate",
      description: "Confirm details and create your trip",
      icon: FaCheck,
    },
  ],
  USER_PROFILE: [
    {
      id: 1,
      title: "Personal Info",
      description: "Basic information about you",
      icon: FaUser,
    },
    {
      id: 2,
      title: "Travel Style",
      description: "Your travel preferences and interests",
      icon: FaHeart,
    },
    {
      id: 3,
      title: "Food & Culture",
      description: "Dietary needs and cultural preferences",
      icon: FaUtensils,
    },
    {
      id: 4,
      title: "Budget & Safety",
      description: "Budget range and emergency contacts",
      icon: FaShieldAlt,
    },
    {
      id: 5,
      title: "Review",
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
    title: "Family Trip",
    desc: "A fun-filled adventure for the whole family.",
    icon: <FaUsers style={{ color: "#27ae60" }} />,
    people: "3 to 5 People",
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
    title: "Couple Getaway",
    desc: "A romantic escape for couples to enjoy the beauty of the Philippines.",
    icon: <FaHeart style={{ color: "#e74c3c" }} />,
    people: "2 People",
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

export const AI_PROMPT = `Create travel itinerary JSON for {location}, {duration} days, {travelers}, {budget}.

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

REQUESTS: {specificRequests}

Generate complete, valid JSON that passes JSON.parse() validation.`;

export const HOTEL_CONFIG = {
  GOOGLE_PLACES_API_KEY: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
  SEARCH_RADIUS: 50000, // 50km radius
  HOTEL_TYPES: ["lodging", "hotel", "resort"],
  MAX_RESULTS: 20,
  PRICE_LEVELS: {
    1: "Budget (₱1,000-2,500)",
    2: "Mid-range (₱2,500-5,000)",
    3: "Upscale (₱5,000-10,000)",
    4: "Luxury (₱10,000+)",
  },
  DEFAULT_CHECKIN_DAYS: 7, // Days from now
  DEFAULT_CHECKOUT_DAYS: 10, // Days from now
};
