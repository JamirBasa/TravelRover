/**
 * TravelRover Validation Utilities
 * 
 * Centralized validation functions for form inputs and data
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date is not in the past
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if date is today or future
 */
export const isValidFutureDate = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

/**
 * Validate date range (start before end)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {boolean} - True if start is before end
 */
export const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

/**
 * Validate number of travelers
 * @param {number} count - Number of travelers
 * @returns {boolean} - True if valid count (1-20)
 */
export const isValidTravelerCount = (count) => {
  return Number.isInteger(count) && count >= 1 && count <= 20;
};

/**
 * Validate budget value
 * @param {string} budget - Budget option
 * @returns {boolean} - True if valid budget option
 */
export const isValidBudget = (budget) => {
  const validBudgets = ['Cheap', 'Moderate', 'Luxury'];
  return validBudgets.includes(budget);
};

/**
 * Validate trip form data
 * @param {object} formData - Trip creation form data
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateTripForm = (formData) => {
  const errors = [];

  if (!formData.destination) {
    errors.push('Destination is required');
  }

  if (!formData.noOfDays || formData.noOfDays < 1) {
    errors.push('Number of days must be at least 1');
  }

  if (!isValidBudget(formData.budget)) {
    errors.push('Invalid budget option');
  }

  if (!isValidTravelerCount(formData.traveler)) {
    errors.push('Number of travelers must be between 1 and 20');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};