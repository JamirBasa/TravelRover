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
   * Extract dietary restrictions from user profile
   * @param {Object} userProfile - User profile object
   * @returns {Array} Array of dietary restrictions
   */
  static extractDietaryRestrictions(userProfile) {
    if (!userProfile?.dietaryRestrictions || !Array.isArray(userProfile.dietaryRestrictions)) {
      return [];
    }
    return userProfile.dietaryRestrictions.filter(Boolean);
  }

  /**
   * Extract travel preferences from user profile
   * @param {Object} userProfile - User profile object
   * @returns {Object} Extracted preferences
   */
  static extractTravelPreferences(userProfile) {
    return {
      budgetRange: userProfile?.budgetRange || null,
      accommodationPreference: userProfile?.accommodationPreference || null,
      preferredTripTypes: userProfile?.preferredTripTypes || [],
      activityLevel: userProfile?.activityLevel || 'moderate',
      culturalPreferences: userProfile?.culturalPreferences || [],
      languagePreferences: userProfile?.languagePreferences || [],
    };
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
   * NOTE: Only auto-populates budget preference, NOT travelers count
   * Travel style is used for destination recommendations, not traveler count
   * 
   * @param {Object} userProfile - User profile object
   * @returns {Object} Form default values { budget: string }
   */
  static getFormDefaults(userProfile) {
    if (!userProfile?.isProfileComplete) {
      return {};
    }

    // Helper to normalize budget value to match SelectBudgetOptions
    const normalizeBudgetRange = (budgetRange) => {
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

    const defaults = {
      budget: normalizeBudgetRange(userProfile.budgetRange), // ✅ Only auto-populate budget
      // ❌ DO NOT auto-populate travelers - user must explicitly choose
      // Travel style (solo/duo/family/group) affects destination recommendations, not traveler count
    };

    console.log("📋 Profile form defaults generated:", {
      input: {
        budgetRange: userProfile.budgetRange,
        travelStyle: userProfile.travelStyle, // Used for AI recommendations only
      },
      output: defaults,
      note: "Travel style influences destination types, not traveler count",
    });

    return defaults;
  }

  /**
   * Get travel style context for AI recommendations
   * Travel style influences destination/activity types, not traveler count
   * 
   * @param {Object} userProfile - User profile object
   * @returns {Object} Travel style context for prompt generation
   */
  static getTravelStyleContext(userProfile) {
    const travelStyle = userProfile?.travelStyle || "balanced";
    
    // Define how each style affects recommendations
    const styleInfluence = {
      solo: {
        activityFocus: "solo-friendly cafes, co-working spaces, safe areas, walking tours",
        accommodationHint: "hostels, boutique hotels, single-friendly accommodations",
        diningPreference: "cafe culture, street food, communal dining experiences",
        note: "Emphasize safety, walkability, and social opportunities"
      },
      duo: {
        activityFocus: "romantic restaurants, intimate venues, couple activities, scenic spots",
        accommodationHint: "boutique hotels, romantic resorts, private villas",
        diningPreference: "romantic dining, wine bars, rooftop restaurants",
        note: "Emphasize privacy, ambiance, and couple-oriented experiences"
      },
      family: {
        activityFocus: "kid-friendly parks, educational sites, family restaurants, outdoor spaces",
        accommodationHint: "family resorts, apartments with kitchens, connecting rooms",
        diningPreference: "family restaurants, buffets, kid menus available",
        note: "Emphasize safety, accessibility, and age-appropriate activities"
      },
      group: {
        activityFocus: "group activities, party venues, large capacity restaurants, adventure sports",
        accommodationHint: "hotels with group facilities, villas, aparthotels",
        diningPreference: "restaurants with large tables, group dining, food halls",
        note: "Emphasize group capacity, shared experiences, and social venues"
      },
      business: {
        activityFocus: "business districts, meeting venues, efficient transport, quiet workspaces",
        accommodationHint: "business hotels near CBD, co-working spaces, meeting rooms",
        diningPreference: "quick service, business lunch spots, hotel dining",
        note: "Emphasize efficiency, connectivity, and professional amenities"
      }
    };

    return {
      style: travelStyle,
      influence: styleInfluence[travelStyle] || styleInfluence.balanced || {
        activityFocus: "balanced mix of activities",
        accommodationHint: "mid-range accommodations",
        diningPreference: "variety of dining options",
        note: "Standard recommendations"
      },
      forPrompt: `Travel style: ${travelStyle} - Focus on ${styleInfluence[travelStyle]?.activityFocus || "general activities"}`
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