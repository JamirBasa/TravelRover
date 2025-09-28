// src/config/formatUserPreferences.jsx

// Trip Types mapping - matches TravelPreferences component
const TRIP_TYPES = {
  adventure: "Adventure & Outdoor activities",
  beach: "Beach & Island getaways",
  cultural: "Cultural & Historical sites",
  nature: "Nature & Wildlife experiences",
  photography: "Photography & Scenic tours",
  wellness: "Wellness & Spa retreats",
  food: "Food & Culinary experiences",
  romantic: "Romantic getaways",
};

// Travel Style mapping
const TRAVEL_STYLES = {
  solo: "Solo Explorer",
  couple: "Couple Travel",
  family: "Family Trips",
  group: "Group Adventures",
  business: "Business Travel",
};

// Budget Range mapping
const BUDGET_RANGES = {
  budget: "Budget-friendly (₱2,000 - ₱8,000)",
  moderate: "Moderate (₱8,000 - ₱20,000)",
  luxury: "Luxury (₱20,000+)",
  flexible: "Flexible Budget",
};

// Accommodation mapping
const ACCOMMODATION_TYPES = {
  hotel: "Hotels",
  resort: "Resorts",
  hostel: "Hostels",
  airbnb: "Airbnb/Vacation Rentals",
  guesthouse: "Guesthouses",
  boutique: "Boutique Hotels",
};

/**
 * User Preferences Formatter Configuration
 * Centralized utility for formatting user profile data consistently across the app
 */
export class UserPreferencesConfig {
  /**
   * Format trip types for display
   * @param {string[]} tripTypes - Array of trip type IDs
   * @param {number} maxDisplay - Maximum number to show before "+X more"
   * @returns {string} Formatted trip types string
   */
  static formatTripTypes(tripTypes, maxDisplay = 2) {
    if (!tripTypes || !Array.isArray(tripTypes) || tripTypes.length === 0) {
      return "No preferences set";
    }

    const formattedTypes = tripTypes
      .map((type) => TRIP_TYPES[type] || type)
      .filter(Boolean);

    if (formattedTypes.length <= maxDisplay) {
      return formattedTypes.join(", ");
    }

    const displayed = formattedTypes.slice(0, maxDisplay);
    const remaining = formattedTypes.length - maxDisplay;

    return `${displayed.join(", ")} +${remaining} more`;
  }

  /**
   * Format travel style for display
   * @param {string} travelStyle - Travel style ID
   * @returns {string} Formatted travel style
   */
  static formatTravelStyle(travelStyle) {
    if (!travelStyle) return "Not specified";
    return TRAVEL_STYLES[travelStyle] || travelStyle;
  }

  /**
   * Format budget range for display
   * @param {string} budgetRange - Budget range ID
   * @returns {string} Formatted budget range
   */
  static formatBudgetRange(budgetRange) {
    if (!budgetRange) return "Not specified";
    return BUDGET_RANGES[budgetRange] || budgetRange;
  }

  /**
   * Format accommodation preference for display
   * @param {string} accommodation - Accommodation type ID
   * @returns {string} Formatted accommodation preference
   */
  static formatAccommodation(accommodation) {
    if (!accommodation) return "Not specified";
    return ACCOMMODATION_TYPES[accommodation] || accommodation;
  }

  /**
   * Get user's primary interests as a concise summary
   * @param {Object} userProfile - User profile object
   * @returns {string} Formatted summary of user interests
   */
  static getUserInterestSummary(userProfile) {
    if (!userProfile)
      return "Complete your profile to see personalized recommendations";

    const interests = [];

    // Add primary trip type
    if (
      userProfile.preferredTripTypes &&
      userProfile.preferredTripTypes.length > 0
    ) {
      const primaryType = TRIP_TYPES[userProfile.preferredTripTypes[0]];
      if (primaryType) {
        interests.push(primaryType.split(" & ")[0]); // Get first part for brevity
      }
    }

    // Add travel style
    if (userProfile.travelStyle) {
      const style = TRAVEL_STYLES[userProfile.travelStyle];
      if (
        style &&
        !interests.some((interest) =>
          interest.toLowerCase().includes(style.toLowerCase().split(" ")[0])
        )
      ) {
        interests.push(style);
      }
    }

    // Add budget preference
    if (userProfile.budgetRange) {
      const budget = BUDGET_RANGES[userProfile.budgetRange];
      if (budget) {
        interests.push(budget.split(" ")[0]); // Just "Budget", "Moderate", "Luxury", etc.
      }
    }

    if (interests.length === 0) {
      return "Personalized recommendations";
    }

    return interests.slice(0, 3).join(" • ");
  }

  /**
   * Format complete user profile summary
   * @param {Object} userProfile - User profile object
   * @returns {Object} Formatted profile summary
   */
  static formatUserProfileSummary(userProfile) {
    if (!userProfile) {
      return {
        name: "Guest",
        summary: "Complete your profile for personalized recommendations",
        tripTypes: "No preferences set",
        travelStyle: "Not specified",
        budgetRange: "Not specified",
        accommodation: "Not specified",
      };
    }

    return {
      name: userProfile.firstName || userProfile.fullName || "Traveler",
      summary: this.getUserInterestSummary(userProfile),
      tripTypes: this.formatTripTypes(userProfile.preferredTripTypes, 2),
      travelStyle: this.formatTravelStyle(userProfile.travelStyle),
      budgetRange: this.formatBudgetRange(userProfile.budgetRange),
      accommodation: this.formatAccommodation(
        userProfile.accommodationPreference
      ),
    };
  }

  /**
   * Get all trip types for reference
   * @returns {Object} Trip types mapping
   */
  static getTripTypes() {
    return { ...TRIP_TYPES };
  }

  /**
   * Get all travel styles for reference
   * @returns {Object} Travel styles mapping
   */
  static getTravelStyles() {
    return { ...TRAVEL_STYLES };
  }

  /**
   * Get all budget ranges for reference
   * @returns {Object} Budget ranges mapping
   */
  static getBudgetRanges() {
    return { ...BUDGET_RANGES };
  }

  /**
   * Get all accommodation types for reference
   * @returns {Object} Accommodation types mapping
   */
  static getAccommodationTypes() {
    return { ...ACCOMMODATION_TYPES };
  }

  /**
   * Validate trip type
   * @param {string} tripType - Trip type to validate
   * @returns {boolean} True if valid trip type
   */
  static isValidTripType(tripType) {
    return tripType && TRIP_TYPES.hasOwnProperty(tripType);
  }

  /**
   * Validate travel style
   * @param {string} travelStyle - Travel style to validate
   * @returns {boolean} True if valid travel style
   */
  static isValidTravelStyle(travelStyle) {
    return travelStyle && TRAVEL_STYLES.hasOwnProperty(travelStyle);
  }

  /**
   * Validate budget range
   * @param {string} budgetRange - Budget range to validate
   * @returns {boolean} True if valid budget range
   */
  static isValidBudgetRange(budgetRange) {
    return budgetRange && BUDGET_RANGES.hasOwnProperty(budgetRange);
  }
}

// Export individual functions for backward compatibility
export const formatTripTypes = (tripTypes, maxDisplay = 2) =>
  UserPreferencesConfig.formatTripTypes(tripTypes, maxDisplay);

export const formatTravelStyle = (travelStyle) =>
  UserPreferencesConfig.formatTravelStyle(travelStyle);

export const formatBudgetRange = (budgetRange) =>
  UserPreferencesConfig.formatBudgetRange(budgetRange);

export const formatAccommodation = (accommodation) =>
  UserPreferencesConfig.formatAccommodation(accommodation);

export const getUserInterestSummary = (userProfile) =>
  UserPreferencesConfig.getUserInterestSummary(userProfile);

export const formatUserProfileSummary = (userProfile) =>
  UserPreferencesConfig.formatUserProfileSummary(userProfile);

export const getTripTypes = () => UserPreferencesConfig.getTripTypes();

export const getTravelStyles = () => UserPreferencesConfig.getTravelStyles();

export const getBudgetRanges = () => UserPreferencesConfig.getBudgetRanges();

export const getAccommodationTypes = () =>
  UserPreferencesConfig.getAccommodationTypes();

export const isValidTripType = (tripType) =>
  UserPreferencesConfig.isValidTripType(tripType);

export const isValidTravelStyle = (travelStyle) =>
  UserPreferencesConfig.isValidTravelStyle(travelStyle);

export const isValidBudgetRange = (budgetRange) =>
  UserPreferencesConfig.isValidBudgetRange(budgetRange);

export default UserPreferencesConfig;
