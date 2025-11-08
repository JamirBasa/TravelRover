/**
 * TravelRover Formatting Utilities
 * 
 * Functions for formatting data display
 * 
 * 🔄 MIGRATION NOTE (2025-11-07):
 * - formatCurrency() renamed to formatCurrencyGeneric() to avoid conflicts
 * - Added formatPHP() for Philippine Peso formatting (primary use case)
 * - budgetCalculator.js has its own formatCurrency() for PHP (₱) - now being phased out
 * - Use formatPHP() for all budget/price displays in the app
 */

/**
 * Format Philippine Peso (₱) for display
 * Primary currency formatter for TravelRover (Philippines-focused app)
 * 
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted PHP string (e.g., "₱15,000")
 * 
 * @example
 * formatPHP(15000) // "₱15,000"
 * formatPHP(0) // "₱0"
 * formatPHP(null) // "₱0"
 */
export const formatPHP = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₱0';
  }
  
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

/**
 * Format currency value (generic, multi-currency)
 * Use formatPHP() for Philippine Peso in most cases
 * 
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted currency string
 * 
 * @example
 * formatCurrencyGeneric(1000, 'USD') // "$1,000"
 * formatCurrencyGeneric(1000, 'EUR') // "€1,000"
 * formatCurrencyGeneric(1000, 'PHP') // "₱1,000"
 */
export const formatCurrencyGeneric = (amount, currency = 'USD') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(0);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * @deprecated Use formatPHP() instead for Philippine Peso
 * Kept for backward compatibility during migration
 */
export const formatCurrency = formatPHP;

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'full')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  const dateObj = new Date(date);
  
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };

  return dateObj.toLocaleDateString('en-US', options[format]);
};

/**
 * Format time duration
 * @param {number} minutes - Duration in minutes
 * @returns {string} - Formatted duration (e.g., "2h 30m")
 */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
};

/**
 * Format location string
 * @param {object} location - Location object with city, state, country
 * @returns {string} - Formatted location string
 */
export const formatLocation = (location) => {
  if (typeof location === 'string') return location;
  
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.country) parts.push(location.country);
  
  return parts.join(', ');
};