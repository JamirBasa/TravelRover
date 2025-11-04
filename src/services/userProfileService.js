/**
 * Centralized User Profile Service
 * Eliminates redundancy and provides consistent user profile data access
 */

import { UserProfileConfig } from "../config/userProfile";
import { getRegionName } from "../data/locationData";

export class UserProfileService {
  /**
   * Get user profile with standardized error handling
   * @returns {Promise<Object|null>} User profile or null
   */
  static async getCurrentUserProfile() {
    try {
      const profile = await UserProfileConfig.loadCurrentUserProfile();
      if (!profile) {
        console.log("📝 No user profile found");
        return null;
      }

      if (!profile.isProfileComplete) {
        console.log("🔄 User profile incomplete");
        return { ...profile, needsCompletion: true };
      }

      console.log("✅ User profile loaded successfully");
      return profile;
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
      return null;
    }
  }

  /**
   * Centralized departure location extraction with consistent region handling
   * @param {Object} userProfile - User profile object
   * @returns {Object} Standardized departure info
   */
  static extractDepartureLocation(userProfile) {
    const defaults = {
      city: "Manila",
      region: "National Capital Region",
      regionCode: "NCR",
      country: "Philippines",
      countryCode: "PH",
    };

    if (!userProfile?.address) {
      return defaults;
    }

    // Handle both regionCode and region fields consistently
    const profileRegionCode = 
      userProfile.address.regionCode || userProfile.address.region;
    
    let regionName = defaults.region;
    if (profileRegionCode) {
      try {
        regionName = getRegionName("PH", profileRegionCode) || profileRegionCode;
      } catch (error) {
        console.warn("Could not resolve region name:", error);
        regionName = profileRegionCode;
      }
    }

    return {
      city: userProfile.address.city || defaults.city,
      region: regionName,
      regionCode: profileRegionCode || defaults.regionCode,
      country: userProfile.address.country || defaults.country,
      countryCode: userProfile.address.countryCode || defaults.countryCode,
    };
  }

  /**
   * Check if profile has complete location data for flights
   * @param {Object} userProfile - User profile object
   * @returns {boolean} True if has complete location data
   */
  static hasCompleteLocationData(userProfile) {
    if (!userProfile?.isProfileComplete || !userProfile?.address) {
      return false;
    }

    const profileRegionCode = 
      userProfile.address.regionCode || userProfile.address.region;
    
    return !!(userProfile.address.city && profileRegionCode);
  }

  /**
   * Auto-populate flight preferences from user profile
   * @param {Object} userProfile - User profile object
   * @param {Object} currentFlightData - Current flight data state
   * @returns {Object} Updated flight data
   */
  static autoPopulateFlightData(userProfile, currentFlightData) {
    // Don't override existing data
    if (currentFlightData.departureCity || currentFlightData.departureRegionCode) {
      return currentFlightData;
    }

    if (!this.hasCompleteLocationData(userProfile)) {
      return currentFlightData;
    }

    const location = this.extractDepartureLocation(userProfile);
    
    return {
      ...currentFlightData,
      departureCity: location.city,
      departureRegion: location.region,
      departureRegionCode: location.regionCode,
    };
  }

  /**
   * Auto-populate hotel preferences from user profile
   * @param {Object} userProfile - User profile object
   * @param {Object} currentHotelData - Current hotel data state
   * @returns {Object} Updated hotel data
   */
  static autoPopulateHotelData(userProfile, currentHotelData) {
    // Don't override existing preferences
    if (currentHotelData.preferredType || currentHotelData.budgetLevel) {
      return currentHotelData;
    }

    if (!userProfile?.isProfileComplete) {
      return currentHotelData;
    }

    const budgetMapping = {
      'budget': 1,
      'budget-friendly': 1,
      'Budget-Friendly': 1,
      'moderate': 2,
      'Moderate': 2,
      'luxury': 3,
      'Luxury': 3,
      'flexible': 2, // Map flexible to moderate (level 2)
    };

    return {
      ...currentHotelData,
      ...(userProfile.accommodationPreference && {
        preferredType: userProfile.accommodationPreference,
      }),
      ...(userProfile.budgetRange && {
        budgetLevel: budgetMapping[userProfile.budgetRange?.toLowerCase()] || 2,
      }),
    };
  }

  /**
   * Get form defaults from user profile
   * @param {Object} userProfile - User profile object
   * @returns {Object} Form default values
   */
  static getFormDefaults(userProfile) {
    if (!userProfile?.isProfileComplete) {
      return {};
    }

    // Helper to determine default travelers
    const getDefaultTravelers = (profile) => {
      if (profile.preferredTripTypes?.includes("Romantic")) return "Just Me & Partner";
      if (profile.preferredTripTypes?.includes("Family")) return "Family (3-5 people)";
      if (profile.preferredTripTypes?.includes("Group")) return "Large Group (6+ people)";
      return "Just Me";
    };

    // Helper to normalize budget value to match SelectBudgetOptions
    const normalizeBudget = (budgetRange) => {
      if (!budgetRange) return undefined;
      
      // Handle legacy lowercase values and map to SelectBudgetOptions format
      const budgetMap = {
        'budget': 'Budget-Friendly',
        'budget-friendly': 'Budget-Friendly',
        'Budget-Friendly': 'Budget-Friendly',
        'moderate': 'Moderate',
        'Moderate': 'Moderate',
        'luxury': 'Luxury',
        'Luxury': 'Luxury',
        'flexible': 'Moderate', // Map flexible to moderate as fallback
      };
      
      const key = budgetRange.toLowerCase().trim();
      return budgetMap[key] || budgetMap[budgetRange] || undefined;
    };

    return {
      budget: normalizeBudget(userProfile.budgetRange),
      travelers: getDefaultTravelers(userProfile) || undefined,
    };
  }

  /**
   * Get profile display summary for UI
   * @param {Object} userProfile - User profile object
   * @returns {Object} Profile summary for display
   */
  static getProfileDisplaySummary(userProfile) {
    if (!userProfile) return null;

    const location = this.extractDepartureLocation(userProfile);
    
    const tripTypeLabels = {
      adventure: "Adventure & Outdoor",
      beach: "Beach & Island", 
      cultural: "Cultural & Historical",
      nature: "Nature & Wildlife",
      photography: "Photography & Scenic",
      wellness: "Wellness & Spa",
      food: "Food & Culinary",
      romantic: "Romantic Getaways",
    };

    // Handle both fullName and firstName/lastName formats
    const displayName = userProfile.fullName || 
      [userProfile.firstName, userProfile.middleName, userProfile.lastName]
        .filter(Boolean)
        .join(" ") || 
      "User";

    return {
      name: displayName,
      location: `${location.city}, ${location.region}`,
      preferredTripTypes: userProfile.preferredTripTypes?.map(
        type => tripTypeLabels[type] || type
      ) || [],
      travelStyle: userProfile.travelStyle,
      budgetRange: userProfile.budgetRange,
      accommodationPreference: userProfile.accommodationPreference,
      hasLocationData: this.hasCompleteLocationData(userProfile),
    };
  }

  /**
   * Check if flight data should be auto-populated when enabling flights
   * @param {Object} userProfile - User profile object
   * @param {Object} flightData - Current flight data
   * @returns {boolean} True if should auto-populate
   */
  static shouldAutoPopulateFlights(userProfile, flightData) {
    return (
      flightData.includeFlights &&
      this.hasCompleteLocationData(userProfile) &&
      !flightData.departureCity &&
      !flightData.departureRegionCode
    );
  }

  /**
   * Check if hotel data should be auto-populated when enabling hotels
   * @param {Object} userProfile - User profile object  
   * @param {Object} hotelData - Current hotel data
   * @returns {boolean} True if should auto-populate
   */
  static shouldAutoPopulateHotels(userProfile, hotelData) {
    return (
      hotelData.includeHotels &&
      userProfile?.isProfileComplete &&
      userProfile?.accommodationPreference &&
      !hotelData.preferredType
    );
  }
}