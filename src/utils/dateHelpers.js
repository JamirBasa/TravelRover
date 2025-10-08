/**
 * TravelRover Date Helper Utilities
 * 
 * Functions for date calculations and manipulations
 */

/**
 * Calculate number of days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} - Number of days
 */
export const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Add days to a date
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get date range array
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Array<Date>} - Array of dates in range
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  return checkDate < today;
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = then - now;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMins) < 60) {
    return diffMins === 0 ? 'just now' : 
           diffMins > 0 ? `in ${diffMins} minutes` : `${Math.abs(diffMins)} minutes ago`;
  }
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
  }
  if (Math.abs(diffDays) < 7) {
    return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
  }
  
  return then.toLocaleDateString();
};

/**
 * Convert date to ISO string for API
 * @param {string|Date} date - Date to convert
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
export const toISODate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};