/**
 * Accommodation Type Display Helpers
 * Centralized utilities for consistent accommodation type display across the app
 * 
 * These helpers ensure that accommodation types are always displayed with
 * proper labels and icons matching the ACCOMMODATION_TYPES constant.
 */

import { ACCOMMODATION_TYPES } from "../constants/options";

/**
 * Get accommodation display label with icon
 * @param {string} value - Accommodation type value (e.g., "aparthotel")
 * @returns {string} Formatted display (e.g., "🏢 Aparthotels")
 * 
 * @example
 * getAccommodationDisplay("aparthotel") // Returns: "🏢 Aparthotels"
 * getAccommodationDisplay("boutique")   // Returns: "✨ Boutique Hotels"
 * getAccommodationDisplay(null)         // Returns: "Standard Hotels"
 */
export const getAccommodationDisplay = (value) => {
  if (!value) return "Standard Hotels";
  
  const type = ACCOMMODATION_TYPES.find(t => t.value === value);
  if (type) {
    return `${type.icon} ${type.label}`;
  }
  
  // Fallback: capitalize first letter if type not found
  return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 * Get accommodation icon only
 * @param {string} value - Accommodation type value
 * @returns {string} Icon emoji (e.g., "🏢")
 * 
 * @example
 * getAccommodationIcon("hotel")  // Returns: "🏨"
 * getAccommodationIcon("resort") // Returns: "🏖️"
 */
export const getAccommodationIcon = (value) => {
  if (!value) return "🏨";
  
  const type = ACCOMMODATION_TYPES.find(t => t.value === value);
  return type?.icon || "🏨";
};

/**
 * Get accommodation label only (without icon)
 * @param {string} value - Accommodation type value
 * @returns {string} Display label (e.g., "Aparthotels")
 * 
 * @example
 * getAccommodationLabel("guesthouse") // Returns: "Vacation Homes"
 * getAccommodationLabel("boutique")   // Returns: "Boutique Hotels"
 */
export const getAccommodationLabel = (value) => {
  if (!value) return "Standard Hotels";
  
  const type = ACCOMMODATION_TYPES.find(t => t.value === value);
  if (type) {
    return type.label;
  }
  
  // Fallback: capitalize first letter
  return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 * Validate if a value is a valid accommodation type
 * @param {string} value - Accommodation type value to validate
 * @returns {boolean} True if valid accommodation type
 * 
 * @example
 * isValidAccommodationType("hotel")     // Returns: true
 * isValidAccommodationType("invalid")   // Returns: false
 */
export const isValidAccommodationType = (value) => {
  if (!value) return false;
  return ACCOMMODATION_TYPES.some(t => t.value === value);
};

/**
 * Get all valid accommodation type values
 * @returns {string[]} Array of valid values
 * 
 * @example
 * getValidAccommodationTypes() 
 * // Returns: ["hotel", "resort", "hostel", "guesthouse", "aparthotel", "boutique"]
 */
export const getValidAccommodationTypes = () => {
  return ACCOMMODATION_TYPES.map(t => t.value);
};
