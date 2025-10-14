/**
 * TravelRover Application Constants
 * 
 * Application-wide constants for API, storage, and system configuration.
 * UI-specific constants (budget options, traveler types, etc.) are in src/constants/options.jsx
 */

// ==========================================
// API Configuration
// ==========================================
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
};

// ==========================================
// Storage Keys (LocalStorage/SessionStorage)
// ==========================================
export const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  DRAFT_TRIP: 'draftTrip',
  AUTH_TOKEN: 'authToken',
  USER_PREFERENCES: 'userPreferences',
  TRIP_CACHE: 'tripCache',
  LAST_SEARCH: 'lastSearch'
};

// ==========================================
// System Error Messages
// ==========================================
export const SYSTEM_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'Please sign in to continue.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Resource not found.',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  MAINTENANCE: 'System is under maintenance. Please try again later.'
};

// ==========================================
// System Success Messages
// ==========================================
export const SYSTEM_SUCCESS = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  DATA_SYNCED: 'Data synchronized successfully!',
  CACHE_CLEARED: 'Cache cleared successfully!'
};

// ==========================================
// Trip Status Enums
// ==========================================
export const TRIP_STATUS = {
  DRAFT: 'draft',
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// ==========================================
// Request Status
// ==========================================
export const REQUEST_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// ==========================================
// Date/Time Constants
// ==========================================
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY_SHORT: 'MMM DD, YYYY',
  DISPLAY_LONG: 'MMMM DD, YYYY',
  TIME_12H: 'hh:mm A',
  TIME_24H: 'HH:mm',
  FULL_DATETIME: 'MMMM DD, YYYY hh:mm A'
};

// ==========================================
// System Limits
// ==========================================
export const SYSTEM_LIMITS = {
  MAX_FILE_SIZE_MB: 5,
  MAX_IMAGES_PER_TRIP: 10,
  SESSION_TIMEOUT_MINUTES: 30,
  CACHE_EXPIRY_HOURS: 24,
  MAX_SEARCH_RESULTS: 50
};

// ==========================================
// Feature Flags
// ==========================================
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_BETA_FEATURES: false
};

// ==========================================
// HTTP Status Codes
// ==========================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ==========================================
// Animation Durations (ms)
// ==========================================
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  PAGE_TRANSITION: 400
};

// ==========================================
// Breakpoints (match Tailwind defaults)
// ==========================================
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
};

// ==========================================
// Trip Generation Constants
// ==========================================
export const INSPIRING_QUOTES = Object.freeze([
  { text: "The world is a book, and those who do not travel read only one page.", author: "Saint Augustine" },
  { text: "Travel makes one modest. You see what a tiny place you occupy in the world.", author: "Gustave Flaubert" },
  { text: "Adventure is worthwhile in itself.", author: "Amelia Earhart" },
  { text: "To travel is to live.", author: "Hans Christian Andersen" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "Travel far enough, you meet yourself.", author: "David Mitchell" },
  { text: "Life is short and the world is wide.", author: "Simon Raven" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "We travel, initially, to lose ourselves; and we travel, next, to find ourselves.", author: "Pico Iyer" },
  { text: "The journey not the arrival matters.", author: "T.S. Eliot" },
  { text: "Travel is the only thing you buy that makes you richer.", author: "Anonymous" },
  { text: "Collect moments, not things.", author: "Anonymous" },
  { text: "Adventure awaits, go find it.", author: "Anonymous" },
  { text: "Every destination has a story. Every journey writes a new chapter.", author: "Anonymous" },
  { text: "Travel opens your heart, broadens your mind, and fills your life with stories to tell.", author: "Anonymous" },
  { text: "The best education you will ever get is traveling. Nothing teaches you more than exploring the world.", author: "Mark Twain" },
  { text: "Wanderlust: a strong desire to travel and explore the world.", author: "Anonymous" },
  { text: "Life begins at the end of your comfort zone.", author: "Neale Donald Walsch" },
]);

// Note: STEP_DEFS contains React components (icons) so it stays in the component file
export const TRIP_GENERATION_STEPS = [
  { id: "start", label: "Initializing trip generation" },
  { id: "langgraph", label: "Analyzing your preferences (AI)" },
  { id: "flights", label: "Searching flight options" },
  { id: "hotels", label: "Finding accommodations" },
  { id: "itinerary", label: "Building itinerary" },
  { id: "finalize", label: "Finalizing plan" },
];

export const TRIP_GENERATION_CONFIG = {
  QUOTE_ROTATION_INTERVAL: 5000, // 5 seconds
  ESTIMATED_TIMES: {
    LANGGRAPH: "≈30–45s",
    FLIGHTS_HOTELS: "≈15–30s", 
    ITINERARY: "≈10–20s",
    DEFAULT: "Almost done"
  }
};

// ==========================================
// Toast/Notification Design System
// ==========================================
export const TOAST_CONFIG = {
  position: "top-right",
  richColors: false, // We'll use custom colors
  expand: true,
  duration: 4500,
  gap: 16,
  visibleToasts: 4,
  toastOptions: {
    unstyled: false,
    className: "group",
    style: {
      padding: "16px 20px",
      minHeight: "68px",
      fontSize: "15px",
      fontWeight: "500",
      borderRadius: "16px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(12px)",
      background: "rgba(255, 255, 255, 0.95)",
    },
    classNames: {
      toast: "backdrop-blur-xl shadow-2xl border-opacity-80 animate-in slide-in-from-top-5 fade-in duration-300",
      title: "text-[15px] font-semibold leading-tight text-gray-900",
      description: "text-[13px] text-gray-600 mt-1.5 leading-relaxed",
      actionButton: "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105",
      cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-all duration-200",
      closeButton: "hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition-all duration-200 hover:rotate-90",
      success: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300 shadow-emerald-100/50",
      error: "bg-gradient-to-br from-red-50 to-rose-50 border-red-300 shadow-red-100/50",
      warning: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-amber-100/50",
      info: "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-300 shadow-sky-100/50",
      loading: "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-300 shadow-sky-100/50",
    }
  }
};

// Toast Icons Configuration (JSX will be created in the component)
export const TOAST_ICON_STYLES = {
  success: {
    className: "w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 animate-in zoom-in duration-300",
    symbol: "✓",
    textSize: "text-xl"
  },
  error: {
    className: "w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200 animate-in zoom-in duration-300",
    symbol: "✕",
    textSize: "text-xl"
  },
  warning: {
    className: "w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 animate-in zoom-in duration-300",
    symbol: "!",
    textSize: "text-xl font-bold"
  },
  info: {
    className: "w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-200 animate-in zoom-in duration-300",
    symbol: "i",
    textSize: "text-lg font-bold"
  },
  loading: {
    className: "w-10 h-10 relative flex items-center justify-center",
    innerClassName: "w-8 h-8 border-[3px] border-sky-200 border-t-sky-600 rounded-full animate-spin"
  }
};