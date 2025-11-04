/**
 * Philippine Time (PHT) Utilities
 * Ensures all dates use Asia/Manila timezone (UTC+8)
 * 
 * @module philippineTime
 */

const PHT_TIMEZONE = 'Asia/Manila';

/**
 * Get current time in PHT
 * @returns {Date} Current PHT date
 */
export const getPHTNow = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: PHT_TIMEZONE }));
};

/**
 * Convert any date to PHT
 * @param {string|Date} date - Input date
 * @returns {Date|null} Date in PHT or null if invalid
 */
export const toPHT = (date) => {
  if (!date) return null;
  const inputDate = new Date(date);
  if (isNaN(inputDate.getTime())) return null;
  return new Date(inputDate.toLocaleString('en-US', { timeZone: PHT_TIMEZONE }));
};

/**
 * Format date as YYYY-MM-DD in PHT
 * @param {string|Date} date - Input date
 * @returns {string} Formatted date string
 */
export const formatPHTDate = (date) => {
  const phtDate = toPHT(date);
  if (!phtDate) return '';
  
  const year = phtDate.getFullYear();
  const month = String(phtDate.getMonth() + 1).padStart(2, '0');
  const day = String(phtDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Get PHT date with time set to midnight
 * @param {string|Date} date - Input date
 * @returns {Date|null} PHT date at 00:00:00
 */
export const getPHTMidnight = (date) => {
  const phtDate = toPHT(date);
  if (!phtDate) return null;
  phtDate.setHours(0, 0, 0, 0);
  return phtDate;
};

/**
 * Calculate days between two dates in PHT (inclusive)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days (inclusive)
 */
export const calculatePHTDays = (startDate, endDate) => {
  const start = getPHTMidnight(startDate);
  const end = getPHTMidnight(endDate);
  
  if (!start || !end) return 0;
  
  const diffTime = end - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays + 1 : 0;
};

/**
 * Check if date is in the past (PHT)
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is before today (PHT)
 */
export const isPastDatePHT = (date) => {
  const inputDate = getPHTMidnight(date);
  const today = getPHTMidnight(getPHTNow());
  
  if (!inputDate || !today) return false;
  return inputDate < today;
};

/**
 * Get minimum date for date picker (tomorrow in PHT)
 * @returns {string} YYYY-MM-DD format
 */
export const getMinDatePHT = () => {
  const tomorrow = getPHTNow();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatPHTDate(tomorrow);
};

/**
 * Add days to a date (PHT)
 * @param {string|Date} date - Input date
 * @param {number} days - Number of days to add
 * @returns {Date|null} New date
 */
export const addDaysPHT = (date, days) => {
  const phtDate = toPHT(date);
  if (!phtDate) return null;
  phtDate.setDate(phtDate.getDate() + days);
  return phtDate;
};

/**
 * Format date for display (e.g., "Dec 25, 2024")
 * @param {string|Date} date - Input date
 * @param {string} format - 'short' | 'long' | 'full'
 * @returns {string} Formatted date string
 */
export const formatPHTDisplay = (date, format = 'short') => {
  const phtDate = toPHT(date);
  if (!phtDate) return '';
  
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  return phtDate.toLocaleDateString('en-US', {
    ...options[format],
    timeZone: PHT_TIMEZONE
  });
};

/**
 * Parse time string and convert to PHT ISO format
 * @param {string} timeString - Time string (e.g., "9:00 AM")
 * @param {string|Date} baseDate - Optional base date
 * @returns {string} ISO time string in PHT
 */
export const parseTimeToPHT = (timeString, baseDate = null) => {
  if (!timeString || typeof timeString !== 'string') return '';
  
  const date = baseDate ? toPHT(baseDate) : getPHTNow();
  if (!date) return '';
  
  const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '';
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3]?.toUpperCase();
  
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

/**
 * Get PHT timezone info
 * @returns {Object} Timezone information
 */
export const getPHTInfo = () => ({
  timezone: PHT_TIMEZONE,
  offset: '+08:00',
  name: 'Philippine Time',
  abbreviation: 'PHT'
});

export default {
  getPHTNow,
  toPHT,
  formatPHTDate,
  getPHTMidnight,
  calculatePHTDays,
  isPastDatePHT,
  getMinDatePHT,
  addDaysPHT,
  formatPHTDisplay,
  parseTimeToPHT,
  getPHTInfo,
  PHT_TIMEZONE
};
