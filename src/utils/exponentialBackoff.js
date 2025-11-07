/**
 * Exponential Backoff Utility
 * Implements retry logic with exponential delay for resilient API calls
 * 
 * Use this for any external API calls that may fail temporarily
 */

/**
 * Execute a function with exponential backoff retry logic
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error is retryable
 * @param {Function} options.onRetry - Callback executed before each retry
 * @returns {Promise} Result of the function execution
 */
export const exponentialBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
    onRetry = () => {},
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute the function
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if this is the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Check if error is retryable
      if (!shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay; // ±30% jitter
      const finalDelay = delay + jitter;
      
      // Call retry callback
      onRetry(error, attempt + 1, finalDelay);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  throw lastError;
};

/**
 * Check if HTTP error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} True if error should be retried
 */
export const isRetryableError = (error) => {
  // Network errors
  if (!error.response) {
    return true;
  }
  
  // 5xx server errors are retryable
  if (error.response.status >= 500) {
    return true;
  }
  
  // 429 Too Many Requests (rate limit)
  if (error.response.status === 429) {
    return true;
  }
  
  // 408 Request Timeout
  if (error.response.status === 408) {
    return true;
  }
  
  // 4xx client errors are NOT retryable (except 429, 408)
  if (error.response.status >= 400 && error.response.status < 500) {
    return false;
  }
  
  return false;
};

/**
 * Wrapper for API calls with automatic retry
 * @param {Function} apiCall - Async function that makes API call
 * @param {Object} options - Retry options
 * @returns {Promise} API response
 */
export const retryableApiCall = async (apiCall, options = {}) => {
  return exponentialBackoff(apiCall, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    shouldRetry: isRetryableError,
    ...options,
  });
};

/**
 * Enhanced retry for critical operations (like trip generation)
 * @param {Function} apiCall - Async function that makes API call
 * @param {Function} onRetry - Callback for retry events
 * @returns {Promise} API response
 */
export const criticalApiCall = async (apiCall, onRetry) => {
  return exponentialBackoff(apiCall, {
    maxRetries: 5, // More retries for critical operations
    initialDelay: 2000,
    maxDelay: 30000,
    shouldRetry: (error, attempt) => {
      // Always retry network errors
      if (!error.response) return true;
      
      // Retry server errors
      if (error.response.status >= 500) return true;
      
      // Retry rate limits
      if (error.response.status === 429) return true;
      
      // Don't retry validation errors
      if (error.response.data?.error_type === 'validation') return false;
      
      return false;
    },
    onRetry,
  });
};

/**
 * Simple retry with fixed delay (useful for testing)
 * @param {Function} fn - Function to execute
 * @param {number} maxRetries - Maximum retries
 * @param {number} delay - Fixed delay between retries
 * @returns {Promise} Result
 */
export const simpleRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default {
  exponentialBackoff,
  isRetryableError,
  retryableApiCall,
  criticalApiCall,
  simpleRetry,
};
