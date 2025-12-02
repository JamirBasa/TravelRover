/**
 * Trip Duration Configuration
 * Optimized for Philippine travel patterns and AI generation efficiency
 * 
 * @module tripDurationLimits
 */

/**
 * Core trip duration limits and configuration
 */
export const TRIP_DURATION = {
  // Core limits
  MIN: 1,           // Minimum 1 day (day trip)
  MAX: 7,           // Maximum 7 days (optimized for best planning & budget)
  OPTIMAL_MIN: 3,   // Recommended minimum for full experience
  OPTIMAL_MAX: 7,   // Sweet spot for planning & budget
  
  // Duration categories
  // Using universally supported emojis (Emoji 1.0 - 2015+) for cross-platform compatibility
  CATEGORIES: {
    DAY_TRIP: { 
      min: 1, 
      max: 1, 
      label: 'Day Trip', 
      emoji: '☀️',          // Sun with rays - widely supported
      icon: '☀',           // Fallback without variation selector
      shortLabel: 'Day'
    },
    WEEKEND: { 
      min: 2, 
      max: 3, 
      label: 'Weekend Getaway', 
      emoji: '🎒',         // Backpack - widely supported
      icon: '🎒',
      shortLabel: 'Weekend'
    },
    SHORT: { 
      min: 4, 
      max: 7, 
      label: 'Short Trip', 
      emoji: '✈️',          // Airplane - universally supported
      icon: '✈',           // Fallback without variation selector
      shortLabel: 'Short'
    }
  },
  
  // AI generation timeouts by duration (in seconds)
  // Optimized for 1-7 day trips
  GENERATION_TIMEOUT: {
    1: 60,    // 1 minute (day trip - simple)
    2: 80,    // 1.3 minutes
    3: 100,   // 1.7 minutes
    4: 110,   // 1.8 minutes
    5: 120,   // 2 minutes
    6: 130,   // 2.2 minutes
    7: 140    // 2.3 minutes (maximum)
  },
  
  // Budget multipliers (per day/person in PHP)
  BUDGET_PER_DAY: {
    MIN: 1000,      // ₱1,000/day minimum (bare essentials)
    BUDGET: 1500,   // ₱1,500/day for budget trips
    MODERATE: 3000, // ₱3,000/day for moderate comfort
    LUXURY: 6000    // ₱6,000/day for luxury experience
  }
};

/**
 * Get duration category information
 * @param {number} days - Number of days
 * @returns {Object|null} Category object or null if invalid
 */
export const getDurationCategory = (days) => {
  const numDays = parseInt(days);
  
  for (const [key, category] of Object.entries(TRIP_DURATION.CATEGORIES)) {
    if (numDays >= category.min && numDays <= category.max) {
      return { key, ...category };
    }
  }
  
  return null;
};

/**
 * Get optimal generation timeout for duration
 * @param {number} days - Number of days
 * @returns {number} Timeout in seconds
 */
export const getTimeoutForDuration = (days) => {
  // Clamp to valid range
  const clampedDays = Math.max(TRIP_DURATION.MIN, Math.min(days, TRIP_DURATION.MAX));
  return TRIP_DURATION.GENERATION_TIMEOUT[clampedDays] || 180; // Default 3 minutes
};

/**
 * Validate duration and return detailed feedback
 * @param {number} days - Number of days to validate
 * @returns {Object} Validation result with error/suggestion if invalid
 */
export const validateDuration = (days) => {
  // Check if duration is a valid number
  if (!days || isNaN(days) || days < 0) {
    return {
      valid: false,
      error: 'Please enter a valid trip duration.',
      suggestion: `Try ${TRIP_DURATION.OPTIMAL_MIN}-${TRIP_DURATION.OPTIMAL_MAX} days for the best experience.`
    };
  }

  // Check minimum
  if (days < TRIP_DURATION.MIN) {
    return {
      valid: false,
      error: `Trip must be at least ${TRIP_DURATION.MIN} day${TRIP_DURATION.MIN > 1 ? 's' : ''}.`,
      suggestion: `Try a ${TRIP_DURATION.OPTIMAL_MIN}-day trip for a more complete experience.`
    };
  }
  
  // Check maximum
  if (days > TRIP_DURATION.MAX) {
    return {
      valid: false,
      error: `Trip duration limited to ${TRIP_DURATION.MAX} days for optimal planning and budget management.`,
      suggestion: `Consider breaking your ${days}-day trip into multiple shorter trips of ${Math.ceil(days / 2)} days each.`
    };
  }
  
  return { valid: true };
};

/**
 * Get recommended duration message (helpful tips)
 * @param {number} days - Number of days
 * @returns {string|null} Recommendation message or null
 */
export const getDurationRecommendation = (days) => {
  if (days === 1) {
    return `💡 Day trips are great for nearby destinations. Consider 2-3 days for overnight stays.`;
  }
  
  if (days < TRIP_DURATION.OPTIMAL_MIN) {
    return `💡 Consider ${TRIP_DURATION.OPTIMAL_MIN}-${TRIP_DURATION.OPTIMAL_MAX} days for a more relaxed pace and better value.`;
  }
  
  if (days > TRIP_DURATION.OPTIMAL_MAX && days <= TRIP_DURATION.MAX) {
    return `💡 Longer trips require higher budgets. Most travelers prefer ${TRIP_DURATION.OPTIMAL_MAX} days for optimal cost-efficiency.`;
  }
  
  return null;
};

/**
 * Get estimated minimum budget for duration
 * @param {number} days - Number of days
 * @param {number} travelers - Number of travelers
 * @param {string} budgetLevel - 'MIN' | 'BUDGET' | 'MODERATE' | 'LUXURY'
 * @returns {number} Estimated budget in PHP
 */
export const getEstimatedBudget = (days, travelers = 1, budgetLevel = 'MIN') => {
  const dailyRate = TRIP_DURATION.BUDGET_PER_DAY[budgetLevel] || TRIP_DURATION.BUDGET_PER_DAY.MIN;
  return dailyRate * days * travelers;
};

/**
 * Get duration helper text for UI
 * @returns {string} Helper text
 */
export const getDurationHelperText = () => {
  return `Choose ${TRIP_DURATION.MIN}-${TRIP_DURATION.MAX} days. We recommend ${TRIP_DURATION.OPTIMAL_MIN}-${TRIP_DURATION.OPTIMAL_MAX} days for the best experience.`;
};

/**
 * Check if duration is in optimal range
 * @param {number} days - Number of days
 * @returns {boolean} True if in optimal range
 */
export const isOptimalDuration = (days) => {
  return days >= TRIP_DURATION.OPTIMAL_MIN && days <= TRIP_DURATION.OPTIMAL_MAX;
};

export default TRIP_DURATION;
