/**
 * Data Validation Utilities for Location Information
 * Ensures data consistency and filters out invalid values
 */

/**
 * Validates if a duration string is valid
 * @param {string} duration - Duration string to validate
 * @returns {boolean} - True if valid duration format
 */
export function isValidDuration(duration) {
  if (!duration || duration === "Varies" || duration === "N/A") return false;
  
  // Check if it matches common duration patterns
  // Supports: "30 minutes", "2 hours", "2.5 hours", "1.5 hrs", "45 min"
  const durationPattern = /^\d+(\.\d+)?\s*(minutes?|hours?|min|mins|hr|hrs|h)$/i;
  return durationPattern.test(duration.trim());
}

/**
 * Validates if a pricing string is valid
 * @param {string} pricing - Pricing string to validate
 * @returns {boolean} - True if valid pricing format
 */
export function isValidPricing(pricing) {
  if (!pricing || pricing === "N/A" || pricing === "₱0") return false;
  
  // Handle "Free" or "Varies" case
  if (/^(free|varies)$/i.test(pricing.trim())) {
    return pricing.toLowerCase() === "free"; // Only "Free" is valid, not "Varies"
  }
  
  // Check if it matches common pricing patterns
  // Valid: "₱500", "₱1,500", "₱800 - ₱1,000", "Free"
  // Invalid: "₱800, 30 minutes" (comma followed by non-number = parsing error)
  
  // First check if comma is followed by a space and text (indicates parsing error)
  if (/,\s+[a-zA-Z]/.test(pricing)) return false;
  
  // Allow commas in numbers (₱1,500) but match proper pricing format
  const pricingPattern = /^(₱|PHP|P)?\s*[\d,]+(\s*-\s*(₱|PHP|P)?\s*[\d,]+)?$/;
  return pricingPattern.test(pricing.trim());
}

/**
 * Validates if a rating string is valid
 * @param {string} rating - Rating string to validate
 * @returns {boolean} - True if valid rating format
 */
export function isValidRating(rating) {
  if (!rating) return false;
  
  // Check if it's a valid number or number/number format
  const ratingPattern = /^\d+(\.\d+)?(\s*\/\s*\d+)?$/;
  return ratingPattern.test(rating.trim());
}

/**
 * Cleans and formats duration string
 * @param {string} duration - Duration string to clean
 * @returns {string} - Cleaned duration or null if invalid
 */
export function cleanDuration(duration) {
  if (!isValidDuration(duration)) return null;
  
  const cleaned = duration.trim();
  
  // Normalize abbreviations and format nicely
  let result = cleaned
    .replace(/\bmins?\b/i, "minutes")
    .replace(/\bhrs?\b/i, "hours")
    .replace(/\bh\b(?!\w)/i, "hours")
    .replace(/\bm\b(?!\w)/i, "minutes")
    .replace(/\s+/g, " ");
  
  // Make it more readable: "2.5 hours" stays as is, but "1 hour" instead of "1 hours"
  result = result.replace(/^1\s+hours$/i, "1 hour");
  result = result.replace(/^1\s+minutes$/i, "1 minute");
  
  return result;
}

/**
 * Cleans and formats pricing string
 * @param {string} pricing - Pricing string to clean
 * @returns {string} - Cleaned pricing or null if invalid
 */
export function cleanPricing(pricing) {
  if (!isValidPricing(pricing)) return null;
  
  const cleaned = pricing.trim();
  
  // Handle "Free" case
  if (/^free/i.test(cleaned)) {
    return "Free";
  }
  
  // Ensure ₱ symbol is present
  if (!cleaned.startsWith("₱") && !cleaned.startsWith("PHP") && !cleaned.startsWith("P")) {
    return `₱${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Cleans and formats rating string
 * @param {string} rating - Rating string to clean
 * @returns {string} - Cleaned rating or null if invalid
 */
export function cleanRating(rating) {
  if (!isValidRating(rating)) return null;
  
  const cleaned = rating.trim();
  
  // If it's just a number, assume it's out of 5
  if (/^\d+(\.\d+)?$/.test(cleaned)) {
    return `${cleaned}/5`;
  }
  
  return cleaned;
}

/**
 * Validates and cleans all location data
 * @param {object} location - Location object to validate
 * @returns {object} - Cleaned location object
 */
export function validateLocationData(location) {
  return {
    ...location,
    duration: cleanDuration(location.duration),
    pricing: cleanPricing(location.pricing),
    rating: cleanRating(location.rating),
    // Clean up empty or placeholder details
    details: location.details && location.details.length > 3 ? location.details : null,
    time: location.time === "All Day" ? null : location.time,
  };
}

/**
 * Checks if location has any valid metadata to display
 * @param {object} location - Location object to check
 * @returns {boolean} - True if has displayable metadata
 */
export function hasValidMetadata(location) {
  return Boolean(
    isValidDuration(location.duration) ||
    isValidPricing(location.pricing) ||
    isValidRating(location.rating) ||
    (location.time && location.time !== "All Day")
  );
}
