/**
 * Production Error Logger
 * Centralized error logging with environment-aware behavior
 * 
 * Features:
 * - Structured error logging
 * - Environment detection (development vs production)
 * - Error categorization and severity levels
 * - Integration ready for error tracking services (Sentry, Rollbar, etc.)
 */

const IS_PRODUCTION = import.meta.env.MODE === 'production';
const IS_DEVELOPMENT = import.meta.env.MODE === 'development';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Error categories
 */
export const ErrorCategory = {
  API: 'api',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  FIREBASE: 'firebase',
  NETWORK: 'network',
  UI: 'ui',
  BUSINESS_LOGIC: 'business_logic',
  UNKNOWN: 'unknown',
};

/**
 * Structured error object
 */
class StructuredError {
  constructor(error, context = {}) {
    this.timestamp = new Date().toISOString();
    
    // ✅ IMPROVED: Handle various error object structures (Firebase, Axios, native)
    this.message = this.extractErrorMessage(error);
    this.name = error.name || error.constructor?.name || 'Error';
    this.stack = error.stack;
    this.code = error.code; // Preserve Firebase error codes
    this.category = context.category || ErrorCategory.UNKNOWN;
    this.severity = context.severity || ErrorSeverity.MEDIUM;
    this.user = this.getUserContext();
    this.context = context;
    this.environment = import.meta.env.MODE;
  }

  /**
   * Extract error message from various error object types
   */
  extractErrorMessage(error) {
    // Handle null/undefined
    if (!error) return 'Unknown error occurred';
    
    // Handle string errors
    if (typeof error === 'string') return error;
    
    // Try standard message property
    if (error.message) return error.message;
    
    // ✅ Firebase errors: code + message pattern
    if (error.code) {
      const firebaseMessages = {
        'unavailable': 'Firebase service temporarily unavailable. Please check your connection.',
        'permission-denied': 'You don\'t have permission to access this data.',
        'not-found': 'The requested data was not found.',
        'already-exists': 'This data already exists.',
        'resource-exhausted': 'Service quota exceeded. Please try again later.',
        'unauthenticated': 'Please sign in to continue.',
        'failed-precondition': 'Operation cannot be executed in the current state.',
        'cancelled': 'Operation was cancelled.',
        'deadline-exceeded': 'Operation timed out. Please check your connection.',
        'internal': 'An internal error occurred. Please try again.',
      };
      
      return firebaseMessages[error.code] || `Firebase error: ${error.code}`;
    }
    
    // Axios errors
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.statusText) return error.response.statusText;
    
    // Network errors
    if (error.request && !error.response) {
      return 'Network error - please check your internet connection';
    }
    
    // Fallback: Try to stringify
    try {
      const str = error.toString();
      if (str !== '[object Object]') return str;
    } catch (e) {
      // Ignore
    }
    
    return 'An unexpected error occurred';
  }

  getUserContext() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          email: user.email || user.user?.email,
          uid: user.uid || user.user?.uid,
        };
      }
    } catch {
      // Ignore parsing errors
    }
    return { email: 'anonymous', uid: null };
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      message: this.message,
      name: this.name,
      category: this.category,
      severity: this.severity,
      user: this.user,
      context: this.context,
      environment: this.environment,
      stack: this.stack,
    };
  }
}

/**
 * Production Logger Class
 */
class ProductionLogger {
  constructor() {
    this.errors = [];
    this.maxStoredErrors = 50;
  }

  /**
   * Log an error with context
   */
  logError(error, context = {}) {
    const structuredError = new StructuredError(error, context);
    
    // Store in memory (for debugging)
    this.errors.push(structuredError);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift();
    }

    // Console logging based on environment
    if (IS_DEVELOPMENT) {
      console.group(`❌ ${context.category?.toUpperCase() || 'ERROR'} [${context.severity?.toUpperCase()}]`);
      console.error('Message:', structuredError.message);
      console.error('Context:', structuredError.context);
      console.error('Stack:', structuredError.stack);
      console.groupEnd();
    } else if (IS_PRODUCTION) {
      // In production, log minimal info to console
      console.error(
        `[${structuredError.severity}] ${structuredError.category}: ${structuredError.message}`
      );
    }

    // Send to error tracking service in production
    if (IS_PRODUCTION) {
      this.sendToErrorTracking(structuredError);
    }

    return structuredError;
  }

  /**
   * Log API error
   */
  logApiError(error, endpoint, method = 'GET') {
    return this.logError(error, {
      category: ErrorCategory.API,
      severity: ErrorSeverity.HIGH,
      endpoint,
      method,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
  }

  /**
   * Log validation error
   */
  logValidationError(error, field, value) {
    return this.logError(error, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      field,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
    });
  }

  /**
   * Log authentication error
   */
  logAuthError(error, action) {
    return this.logError(error, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      action,
    });
  }

  /**
   * Log Firebase error
   */
  logFirebaseError(error, operation, collection) {
    return this.logError(error, {
      category: ErrorCategory.FIREBASE,
      severity: ErrorSeverity.HIGH,
      operation,
      collection,
    });
  }

  /**
   * Log network error
   */
  logNetworkError(error, url) {
    return this.logError(error, {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      url,
    });
  }

  /**
   * Log UI error
   */
  logUIError(error, component) {
    return this.logError(error, {
      category: ErrorCategory.UI,
      severity: ErrorSeverity.LOW,
      component,
    });
  }

  /**
   * Log business logic error
   */
  logBusinessError(error, operation) {
    return this.logError(error, {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      operation,
    });
  }

  /**
   * Send error to tracking service (Sentry, Rollbar, etc.)
   * Override this method to integrate with your error tracking service
   */
  sendToErrorTracking(structuredError) {
    // Example: Send to Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(structuredError.message), {
    //     tags: {
    //       category: structuredError.category,
    //       severity: structuredError.severity,
    //     },
    //     extra: structuredError.context,
    //   });
    // }

    // For now, just prepare the payload
    const payload = structuredError.toJSON();
    
    // You could send this to your own logging endpoint:
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // }).catch(() => {
    //   // Fail silently to prevent infinite error loops
    // });

    // Placeholder: Log to console in production for now
    if (IS_PRODUCTION) {
      console.log('📊 Error tracked:', {
        message: payload.message,
        category: payload.category,
        severity: payload.severity,
      });
    }
  }

  /**
   * Get all logged errors
   */
  getErrors(filter = {}) {
    let filtered = this.errors;

    if (filter.category) {
      filtered = filtered.filter(e => e.category === filter.category);
    }

    if (filter.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }

    return filtered;
  }

  /**
   * Clear all stored errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getStats() {
    const stats = {
      total: this.errors.length,
      byCategory: {},
      bySeverity: {},
    };

    this.errors.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
const logger = new ProductionLogger();

/**
 * Development-only debug logging
 * Automatically disabled in production
 * 
 * @param {string} component - Component or module name
 * @param {string} message - Debug message
 * @param {any} data - Optional data to log
 * 
 * @example
 * logDebug('Hotels', 'Full trip object', trip);
 * logDebug('BudgetCalculator', 'Calculating costs', { activities, hotels });
 */
export const logDebug = (component, message, data = null) => {
  // Only log in development
  if (!IS_DEVELOPMENT) return;
  
  const prefix = `🔍 [${component}]`;
  
  if (data !== null && data !== undefined) {
    console.log(`${prefix} ${message}:`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
};

// Export convenience methods
export const logError = (error, context) => logger.logError(error, context);
export const logApiError = (error, endpoint, method) => logger.logApiError(error, endpoint, method);
export const logValidationError = (error, field, value) => logger.logValidationError(error, field, value);
export const logAuthError = (error, action) => logger.logAuthError(error, action);
export const logFirebaseError = (error, operation, collection) => logger.logFirebaseError(error, operation, collection);
export const logNetworkError = (error, url) => logger.logNetworkError(error, url);
export const logUIError = (error, component) => logger.logUIError(error, component);
export const logBusinessError = (error, operation) => logger.logBusinessError(error, operation);

// Export logger instance and classes
export { logger, ProductionLogger, StructuredError };

export default logger;
