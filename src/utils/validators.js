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
 * Validate Philippine phone number
 * Accepts formats: +639XX-XXX-XXXX or 09XX-XXX-XXXX
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid Philippine mobile number
 */
export const isValidPhilippinePhone = (phone) => {
  if (!phone) return false;
  
  // Remove all non-digits and check if it's valid
  const digits = phone.replace(/\D/g, "");

  // Check for +639XX format (12 digits) or 09XX format (11 digits)
  if (digits.length === 12 && digits.startsWith("63")) {
    return true; // +639XX-XXX-XXXX
  }
  if (digits.length === 11 && digits.startsWith("09")) {
    return true; // 09XX-XXX-XXXX
  }

  return false;
};

/**
 * Format Philippine phone number for display
 * Converts +639XX to 09XX-XXX-XXXX format
 * @param {string} phone - Phone number (can be +639XX or 09XX format)
 * @returns {string} - Formatted phone number (09XX-XXX-XXXX)
 */
export const formatPhilippinePhone = (phone) => {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");

  // If stored as +639XX, convert to 09XX for display
  if (digits.startsWith("63") && digits.length === 12) {
    const localNumber = "0" + digits.slice(2);
    // Format as 09XX-XXX-XXXX
    if (localNumber.length <= 4) {
      return localNumber;
    } else if (localNumber.length <= 7) {
      return localNumber.slice(0, 4) + "-" + localNumber.slice(4);
    } else {
      return (
        localNumber.slice(0, 4) +
        "-" +
        localNumber.slice(4, 7) +
        "-" +
        localNumber.slice(7)
      );
    }
  }

  // Already in display format or needs formatting
  if (digits.length === 11 && digits.startsWith("09")) {
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 7) {
      return digits.slice(0, 4) + "-" + digits.slice(4);
    } else {
      return (
        digits.slice(0, 4) +
        "-" +
        digits.slice(4, 7) +
        "-" +
        digits.slice(7)
      );
    }
  }

  return phone;
};

/**
 * Normalize Philippine phone number to storage format
 * Converts 09XX to +639XX format
 * @param {string} phone - Phone number in any format
 * @returns {string} - Normalized phone number (+639XX format)
 */
export const normalizePhilippinePhone = (phone) => {
  if (!phone) return "";
  
  const digits = phone.replace(/\D/g, "");
  
  // Convert 09XX to +639XX
  if (digits.length === 11 && digits.startsWith("09")) {
    return "+63" + digits.slice(1);
  }
  
  // Already in +639XX format
  if (digits.length === 12 && digits.startsWith("63")) {
    return "+" + digits;
  }
  
  return phone;
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