/**
 * TravelRover Date Helper Utilities
 * Uses Philippine Time (PHT, UTC+8) for all operations
 * 
 * @module dateHelpers
 */

import { 
  calculatePHTDays, 
  addDaysPHT, 
  isPastDatePHT,
  formatPHTDisplay,
  formatPHTDate,
  getPHTNow,
  toPHT,
  getPHTMidnight
} from './philippineTime';

/**
 * Calculate number of days between two dates (PHT, inclusive)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} - Number of days
 */
export const calculateDaysBetween = (startDate, endDate) => {
  return calculatePHTDays(startDate, endDate);
};

/**
 * Add days to a date (PHT)
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date in PHT
 */
export const addDays = (date, days) => {
  return addDaysPHT(date, days);
};

/**
 * Get date range array (PHT)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Array<Date>} - Array of dates in range
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = toPHT(startDate);
  const end = toPHT(endDate);

  if (!currentDate || !end) return [];

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate = addDaysPHT(currentDate, 1);
  }

  return dates;
};

/**
 * Check if date is today (PHT)
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
  const today = getPHTMidnight(getPHTNow());
  const checkDate = getPHTMidnight(date);
  return checkDate && today && checkDate.getTime() === today.getTime();
};

/**
 * Check if date is in the past (PHT)
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (date) => {
  return isPastDatePHT(date);
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours") - PHT
 * @param {string|Date} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
  const now = getPHTNow();
  const then = toPHT(date);
  
  if (!then) return '';
  
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
  
  return formatPHTDisplay(then);
};

/**
 * Convert date to ISO string for API (PHT)
 * @param {string|Date} date - Date to convert
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
export const toISODate = (date) => {
  return formatPHTDate(date);
};