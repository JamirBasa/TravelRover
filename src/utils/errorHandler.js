/**
 * Centralized Error Handler
 * Unified error handling with user-friendly messages, logging, and categorization
 * 
 * Features:
 * - Typed error classes for different scenarios
 * - User-friendly error messages
 * - Automatic toast notifications
 * - Error logging and tracking
 * - Integration-ready for Sentry/monitoring
 */

import { toast } from "sonner";
import { logApiError, logValidationError, logAuthError, logFirebaseError, logNetworkError } from "./productionLogger";

/**
 * Error Categories
 */
export const ErrorCategory = {
  API: 'api',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  FIREBASE: 'firebase',
  NETWORK: 'network',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
};

/**
 * Error Severity
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  constructor(message, category = ErrorCategory.UNKNOWN, details = {}) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userMessage = details.userMessage || message;
  }
}

/**
 * Centralized Error Handler
 */
export class ErrorHandler {
  /**
   * Handle API errors
   */
  static handleAPIError(error, context = {}) {
    console.error('❌ API Error:', error);

    const { endpoint, method = 'GET' } = context;
    
    // Log to production logger
    logApiError(error, endpoint, method);

    // Determine error type
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return this.handleTimeoutError(error, context);
    }

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return this.handleValidationError(data, context);
        case 401:
          return this.handleAuthError(error, context);
        case 403:
          return this.handleForbiddenError(error, context);
        case 404:
          return this.handleNotFoundError(error, context);
        case 408:
          return this.handleTimeoutError(error, context);
        case 429:
          return this.handleRateLimitError(error, context);
        case 500:
        case 502:
        case 503:
        case 504:
          return this.handleServerError(error, context);
        default:
          return this.handleUnknownError(error, context);
      }
    }

    // Network error (no response)
    return this.handleNetworkError(error, context);
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error, context = {}) {
    const message = error.message || error.error || 'Validation failed';
    
    logValidationError(
      new Error(message),
      context.field || 'unknown',
      context.value
    );

    toast.error('Invalid Input', {
      description: message,
      duration: 5000,
    });

    return new AppError(message, ErrorCategory.VALIDATION, {
      ...context,
      userMessage: message,
    });
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error, context = {}) {
    const message = 'Please log in to continue';
    
    logAuthError(error, context.action || 'unknown');

    toast.error('Authentication Required', {
      description: message,
      duration: 5000,
    });

    // Clear invalid session
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');

    return new AppError(message, ErrorCategory.AUTHENTICATION, {
      ...context,
      userMessage: message,
      requiresLogin: true,
    });
  }

  /**
   * Handle forbidden errors
   */
  static handleForbiddenError(error, context = {}) {
    const message = 'You do not have permission to access this resource';

    toast.error('Access Denied', {
      description: message,
      duration: 5000,
    });

    return new AppError(message, ErrorCategory.AUTHENTICATION, {
      ...context,
      userMessage: message,
    });
  }

  /**
   * Handle not found errors
   */
  static handleNotFoundError(error, context = {}) {
    const message = error.response?.data?.error || 'Resource not found';

    toast.error('Not Found', {
      description: message,
      duration: 5000,
    });

    return new AppError(message, ErrorCategory.API, {
      ...context,
      userMessage: message,
    });
  }

  /**
   * Handle timeout errors
   */
  static handleTimeoutError(error, context = {}) {
    const message = 'Request timed out. The server may be busy or your connection is slow.';

    toast.error('Request Timeout', {
      description: message,
      action: {
        label: 'Retry',
        onClick: context.onRetry || (() => {}),
      },
      duration: 8000,
    });

    return new AppError(message, ErrorCategory.TIMEOUT, {
      ...context,
      userMessage: message,
      retryable: true,
    });
  }

  /**
   * Handle rate limit errors
   */
  static handleRateLimitError(error, context = {}) {
    const retryAfter = error.response?.headers?.['retry-after'] || '60';
    const message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;

    toast.error('Rate Limit Exceeded', {
      description: message,
      duration: 10000,
    });

    return new AppError(message, ErrorCategory.RATE_LIMIT, {
      ...context,
      userMessage: message,
      retryAfter: parseInt(retryAfter, 10),
      retryable: true,
    });
  }

  /**
   * Handle server errors
   */
  static handleServerError(error, context = {}) {
    const message = 'Server error. Our team has been notified. Please try again later.';

    toast.error('Server Error', {
      description: message,
      action: {
        label: 'Retry',
        onClick: context.onRetry || (() => {}),
      },
      duration: 8000,
    });

    return new AppError(message, ErrorCategory.API, {
      ...context,
      userMessage: message,
      serverError: true,
      retryable: true,
    });
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error, context = {}) {
    const message = 'Network error. Please check your internet connection.';

    logNetworkError(error, context.endpoint);

    toast.error('Connection Error', {
      description: message,
      action: {
        label: 'Retry',
        onClick: context.onRetry || (() => {}),
      },
      duration: 8000,
    });

    return new AppError(message, ErrorCategory.NETWORK, {
      ...context,
      userMessage: message,
      retryable: true,
    });
  }

  /**
   * Handle unknown errors
   */
  static handleUnknownError(error, context = {}) {
    const message = error.message || 'An unexpected error occurred';

    toast.error('Unexpected Error', {
      description: message,
      duration: 6000,
    });

    return new AppError(message, ErrorCategory.UNKNOWN, {
      ...context,
      userMessage: message,
    });
  }

  /**
   * Handle Firebase errors
   */
  static handleFirebaseError(error, operation = 'unknown', collection = 'unknown') {
    console.error('❌ Firebase Error:', error);

    logFirebaseError(error, operation, collection);

    let message = 'Database error. Please try again.';
    
    // Parse Firebase error codes
    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          message = 'You do not have permission to access this data';
          break;
        case 'not-found':
          message = 'The requested data was not found';
          break;
        case 'already-exists':
          message = 'This data already exists';
          break;
        case 'resource-exhausted':
          message = 'Database quota exceeded. Please try again later.';
          break;
        case 'unavailable':
          message = 'Database temporarily unavailable. Please try again.';
          break;
        default:
          message = error.message || message;
      }
    }

    toast.error('Database Error', {
      description: message,
      duration: 6000,
    });

    return new AppError(message, ErrorCategory.FIREBASE, {
      operation,
      collection,
      firebaseCode: error.code,
      userMessage: message,
    });
  }

  /**
   * Handle with automatic retry
   */
  static async handleWithRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      onRetry = () => {},
    } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          return this.handleAPIError(error, options.context);
        }

        const appError = this.handleAPIError(error, options.context);
        
        if (!appError.details.retryable) {
          throw appError;
        }

        console.log(`⚠️ Retry attempt ${attempt}/${maxRetries}...`);
        onRetry(attempt, error);
        
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
}

// Convenience export
export const handleError = ErrorHandler.handleAPIError.bind(ErrorHandler);

export default ErrorHandler;
