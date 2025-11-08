/**
 * Axios Configuration with Interceptors
 * Centralized HTTP client with timeout, retry logic, and error handling
 */
import axios from 'axios';
import { API_CONFIG, getTimeout, isRetryableError, getErrorMessage } from './apiConfig';
import { exponentialBackoff } from '../utils/exponentialBackoff';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: getTimeout('medium'),
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to track request duration
    config.metadata = { startTime: Date.now() };
    
    // Log request in development
    if (import.meta.env.MODE !== 'production') {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - response.config.metadata.startTime;
    
    // Log response in development
    if (import.meta.env.MODE !== 'production') {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`
      );
    }
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`⚠️ Slow API Request: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Calculate request duration if metadata exists
    const duration = originalRequest?.metadata?.startTime 
      ? Date.now() - originalRequest.metadata.startTime 
      : null;
    
    // Log error
    console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
      status: error.response?.status,
      message: error.message,
      duration: duration ? `${duration}ms` : 'unknown',
    });
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - please try again';
    }
    
    if (error.response?.status === 401) {
      // Handle authentication errors
      localStorage.removeItem('authToken');
      // You could redirect to login here if needed
    }
    
    if (error.response?.status === 429) {
      // Handle rate limiting
      const retryAfter = error.response.headers['retry-after'];
      error.message = retryAfter 
        ? `Rate limited. Please try again after ${retryAfter} seconds.`
        : 'Too many requests. Please wait a moment.';
    }
    
    return Promise.reject(error);
  }
);

/**
 * Make an API request with automatic retry on failure
 * @param {Object} config - Axios request config
 * @param {Object} options - Additional options
 * @returns {Promise} Response data
 */
export const apiRequest = async (config, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = getTimeout('medium'),
    onRetry = null,
  } = options;
  
  // Set timeout
  config.timeout = timeout;
  
  // Use exponential backoff for retries
  return exponentialBackoff(
    () => apiClient(config),
    {
      maxRetries,
      initialDelay: retryDelay,
      shouldRetry: (error) => {
        // Don't retry client errors (4xx except 429)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (error.response?.status === 429 || error.response?.status === 408) {
            return true; // Retry rate limits and timeouts
          }
          return false;
        }
        
        return isRetryableError(error);
      },
      onRetry: (error, attempt, delay) => {
        console.warn(
          `⚠️ Retrying request (${attempt}/${maxRetries}) after ${Math.round(delay / 1000)}s:`,
          config.url
        );
        if (onRetry) {
          onRetry(error, attempt, delay);
        }
      },
    }
  );
};

/**
 * GET request
 */
export const get = (url, config = {}, options = {}) => {
  return apiRequest({ method: 'GET', url, ...config }, options);
};

/**
 * POST request
 */
export const post = (url, data, config = {}, options = {}) => {
  return apiRequest({ method: 'POST', url, data, ...config }, options);
};

/**
 * PUT request
 */
export const put = (url, data, config = {}, options = {}) => {
  return apiRequest({ method: 'PUT', url, data, ...config }, options);
};

/**
 * PATCH request
 */
export const patch = (url, data, config = {}, options = {}) => {
  return apiRequest({ method: 'PATCH', url, data, ...config }, options);
};

/**
 * DELETE request
 */
export const del = (url, config = {}, options = {}) => {
  return apiRequest({ method: 'DELETE', url, ...config }, options);
};

// Export configured axios instance and methods
export default {
  client: apiClient,
  request: apiRequest,
  get,
  post,
  put,
  patch,
  delete: del,
};
