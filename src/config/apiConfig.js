/**
 * TravelRover - Unified API Configuration
 * 
 * Single source of truth for all API-related configuration.
 * This consolidates API_CONFIG from:
 * - src/constants/options.jsx
 * - src/utils/constants.js
 * 
 * @created 2025-11-06 - Code Consolidation Phase 1
 */

// ==========================================
// API BASE CONFIGURATION
// ==========================================
export const API_CONFIG = {
  // Base URL - uses environment variable or falls back to localhost
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  
  // Timeout Configuration (in milliseconds)
  TIMEOUT_SHORT: 45000,    // 45 seconds - Simple queries (location validation, quick lookups)
  TIMEOUT_MEDIUM: 90000,   // 90 seconds - Standard requests (flight search, hotel lookup)
  TIMEOUT_LONG: 150000,    // 150 seconds - Complex itineraries (multi-day trip generation)
  TIMEOUT_MAX: 360000,     // 360 seconds (6 minutes) - Maximum for retries with exponential backoff
  
  // Retry Configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000,  // 1 second base delay for exponential backoff
  
  // Request Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// ==========================================
// API ENDPOINTS
// ==========================================
export const API_ENDPOINTS = {
  // LangGraph Agent (Multi-agent AI)
  LANGGRAPH: {
    EXECUTE: '/langgraph/execute/',
    HEALTH: '/langgraph/health/',
    STATUS: '/langgraph/status/',
  },
  
  // Gemini AI Proxy
  GEMINI: {
    GENERATE: '/gemini/generate/',
    STREAM: '/gemini/stream/',
  },
  
  // Flight Services
  FLIGHTS: {
    SEARCH: '/flights/search/',
    RECOMMENDATIONS: '/flights/recommendations/',
  },
  
  // Hotel Services
  HOTELS: {
    SEARCH: '/hotels/search/',
    DETAILS: '/hotels/details/',
    VERIFY: '/hotels/verify/',
  },
  
  // User Profile
  PROFILE: {
    GET: '/profile/',
    UPDATE: '/profile/update/',
    DELETE: '/profile/delete/',
  },
  
  // Trip Management
  TRIPS: {
    LIST: '/trips/',
    CREATE: '/trips/create/',
    GET: '/trips/:id/',
    UPDATE: '/trips/:id/update/',
    DELETE: '/trips/:id/delete/',
  },
};

// ==========================================
// HTTP STATUS CODES
// ==========================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// ==========================================
// ERROR MESSAGES
// ==========================================
export const API_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'Resource not found.',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  MAINTENANCE: 'System is under maintenance. Please try again later.',
  INVALID_RESPONSE: 'Invalid response from server.',
  PARSE_ERROR: 'Failed to parse server response.',
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get the appropriate timeout for a request type
 * @param {string} type - Request type: 'short', 'medium', 'long', or 'max'
 * @returns {number} Timeout in milliseconds
 */
export function getTimeout(type = 'medium') {
  const timeouts = {
    short: API_CONFIG.TIMEOUT_SHORT,
    medium: API_CONFIG.TIMEOUT_MEDIUM,
    long: API_CONFIG.TIMEOUT_LONG,
    max: API_CONFIG.TIMEOUT_MAX,
  };
  
  return timeouts[type] || API_CONFIG.TIMEOUT_MEDIUM;
}

/**
 * Build a full API URL from an endpoint
 * @param {string} endpoint - API endpoint (e.g., '/langgraph/execute/')
 * @returns {string} Full URL
 */
export function buildApiUrl(endpoint) {
  const base = API_CONFIG.BASE_URL;
  // Remove trailing slash from base if present
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${cleanBase}${cleanEndpoint}`;
}

/**
 * Get retry delay with exponential backoff
 * @param {number} attemptNumber - Current retry attempt (1-indexed)
 * @returns {number} Delay in milliseconds
 */
export function getRetryDelay(attemptNumber) {
  return API_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attemptNumber - 1);
}

/**
 * Check if an error is retryable
 * @param {Error|Response} error - Error object or HTTP response
 * @returns {boolean} True if the request should be retried
 */
export function isRetryableError(error) {
  // Network errors are always retryable
  if (error.name === 'TypeError' || error.message?.includes('fetch')) {
    return true;
  }
  
  // Retryable HTTP status codes
  const retryableStatuses = [
    HTTP_STATUS.TIMEOUT,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    HTTP_STATUS.BAD_GATEWAY,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    HTTP_STATUS.GATEWAY_TIMEOUT,
  ];
  
  return retryableStatuses.includes(error.status);
}

/**
 * Get user-friendly error message from error object
 * @param {Error|Response} error - Error object or HTTP response
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  // Check for specific HTTP status codes
  if (error.status) {
    switch (error.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return API_ERRORS.UNAUTHORIZED;
      case HTTP_STATUS.FORBIDDEN:
        return API_ERRORS.FORBIDDEN;
      case HTTP_STATUS.NOT_FOUND:
        return API_ERRORS.NOT_FOUND;
      case HTTP_STATUS.TIMEOUT:
        return API_ERRORS.TIMEOUT_ERROR;
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return API_ERRORS.RATE_LIMIT;
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return API_ERRORS.MAINTENANCE;
      case HTTP_STATUS.SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.GATEWAY_TIMEOUT:
        return API_ERRORS.SERVER_ERROR;
      default:
        return error.message || API_ERRORS.SERVER_ERROR;
    }
  }
  
  // Network errors
  if (error.name === 'TypeError' || error.message?.includes('fetch')) {
    return API_ERRORS.NETWORK_ERROR;
  }
  
  // Default fallback
  return error.message || API_ERRORS.SERVER_ERROR;
}

// ==========================================
// EXPORTS
// ==========================================
export default API_CONFIG;
