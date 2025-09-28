import {
  FaUser,
  FaUsers,
  FaUserFriends,
  FaHeart,
  FaCoins,
  FaMoneyBillWave,
  FaGem,
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
  TIMEOUT: 30000,
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
    desc: "A budget-friendly option for travelers looking to save money.",
    icon: <FaCoins style={{ color: "#f1c40f" }} />,
    range: "₱2,000 - ₱8,000",
    value: "Budget",
  },
  {
    id: 2,
    title: "Moderate",
    desc: "A comfortable option for travelers who want a balance of cost and quality.",
    icon: <FaMoneyBillWave style={{ color: "#2ecc71" }} />,
    range: "₱8,000 - ₱20,000", // ✅ Added price range
    value: "Moderate", // ✅ Added value
  },
  {
    id: 3,
    title: "Luxury",
    desc: "A high-end option for travelers seeking the best experiences.",
    icon: <FaGem style={{ color: "#9b59b6" }} />,
    range: "₱20,000+",
    value: "Luxury",
  },
];

export const AI_PROMPT = `Generate a comprehensive travel itinerary in valid JSON format for: {location}, {duration} days, {travelers}, {budget} budget.

REQUIRED JSON STRUCTURE:
{
  "tripName": "Trip to [Location]",
  "destination": "[Full destination name]",
  "duration": "[X] days",
  "budget": "[Budget level]",
  "travelers": "[Traveler type]",
  "startDate": "[Start date if provided]",
  "endDate": "[End date if provided]",
  "currency": "PHP",
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Complete address",
      "pricePerNight": "₱X,XXX - ₱X,XXX",
      "imageUrl": "https://images.unsplash.com/photo-xxx",
      "geoCoordinates": {
        "latitude": 0.000,
        "longitude": 0.000
      },
      "rating": 4.5,
      "description": "Hotel description"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "theme": "Day theme",
      "plan": [
        {
          "time": "9:00 AM",
          "placeName": "Place Name",
          "placeDetails": "Description",
          "imageUrl": "https://images.unsplash.com/photo-xxx",
          "geoCoordinates": {
            "latitude": 0.000,
            "longitude": 0.000
          },
          "ticketPricing": "₱XXX or Free",
          "timeTravel": "X hours",
          "rating": 4.0
        }
      ]
    }
  ],
  "placesToVisit": [
    {
      "placeName": "Attraction Name",
      "placeDetails": "Description",
      "imageUrl": "https://images.unsplash.com/photo-xxx",
      "geoCoordinates": {
        "latitude": 0.000,
        "longitude": 0.000
      },
      "ticketPricing": "₱XXX",
      "timeTravel": "X hours",
      "rating": 4.0
    }
  ]
}

REQUIREMENTS:
1. Use real places and accurate coordinates for {location}
2. Provide 3-5 hotel options with realistic Philippine peso pricing
3. Create {duration} days of detailed itinerary
4. Adjust recommendations for {budget} level (Budget: ₱2K-8K, Moderate: ₱8K-20K, Luxury: ₱20K+)
5. Consider {travelers} type for activities and accommodations
6. Use https://images.unsplash.com/ URLs for all images
7. Include realistic pricing in Philippine pesos
8. Ensure valid JSON format with proper commas and brackets

SPECIFIC REQUESTS: {specificRequests}

Generate ONLY valid JSON, no additional text.`;

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
