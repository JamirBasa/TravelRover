// src/config/userProfile.js

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export class UserProfileConfig {
  /**
   * Load user profile from Firebase
   * @param {string} userEmail - User's email address
   * @returns {Promise<Object|null>} User profile data or null if not found
   */
  static async loadUserProfile(userEmail) {
    if (!userEmail) {
      console.warn("⚠️ No user email provided to loadUserProfile");
      return null;
    }

    try {
      console.log("🔄 Loading user profile for:", userEmail);
      
      const docRef = doc(db, "UserProfiles", userEmail);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data();
        console.log("✅ User profile loaded successfully:", {
          hasProfile: true,
          isComplete: profileData.isProfileComplete,
          fullAddress: profileData.address,
          city: profileData.address?.city,
          region: profileData.address?.region,
          regionCode: profileData.address?.regionCode
        });
        
        return profileData;
      } else {
        console.log("📝 No profile found for user:", userEmail);
        return null;
      }
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
      return null;
    }
  }

  /**
   * Get current user from localStorage
   * @returns {Object|null} Current user object or null
   */
  static getCurrentUser() {
    try {
      const userString = localStorage.getItem("user");
      if (!userString) return null;
      
      const user = JSON.parse(userString);
      return user?.email ? user : null;
    } catch (error) {
      console.error("❌ Error parsing user from localStorage:", error);
      return null;
    }
  }

  /**
   * Load current user's profile
   * @returns {Promise<Object|null>} Current user's profile or null
   */
  static async loadCurrentUserProfile() {
    const user = this.getCurrentUser();
    if (!user?.email) {
      console.log("👤 No current user found");
      return null;
    }

    return await this.loadUserProfile(user.email);
  }

  /**
   * Extract flight departure info from user profile with better region handling
   * @param {Object} userProfile - User profile object
   * @returns {Object} Departure information
   */
  static extractDepartureInfo(userProfile) {
    // Import centralized default values
    const { FLIGHT_CONFIG } = require("../constants/options");
    const defaultInfo = FLIGHT_CONFIG.DEFAULT_DEPARTURE;

    if (!userProfile?.address) {
      console.log("🏠 No address in user profile, using defaults");
      return defaultInfo;
    }

    // Handle both data structures: regionCode field or region field containing the code
    const profileRegionCode = userProfile.address.regionCode || userProfile.address.region;
    
    // Import getRegionName to get the proper region name from code
    let regionName = defaultInfo.region;
    if (profileRegionCode) {
      try {
        // This would need to be imported or we need a different approach
        // For now, we'll create a simple mapping
        const regionMapping = {
          'NCR': 'National Capital Region',
          'R01': 'Ilocos Region',
          'R02': 'Cagayan Valley',
          'R03': 'Central Luzon',
          'R04A': 'CALABARZON',
          'R04B': 'MIMAROPA',
          'R05': 'Bicol Region',
          'R06': 'Western Visayas',
          'R07': 'Central Visayas',
          'R08': 'Eastern Visayas',
          'R09': 'Zamboanga Peninsula',
          'R10': 'Northern Mindanao',
          'R11': 'Davao Region',
          'R12': 'SOCCSKSARGEN',
          'R13': 'Caraga',
          'BARMM': 'Bangsamoro Autonomous Region in Muslim Mindanao'
        };
        regionName = regionMapping[profileRegionCode] || profileRegionCode;
      } catch (error) {
        console.log("Could not get region name, using code as name");
        regionName = profileRegionCode;
      }
    }

    const departureInfo = {
      city: userProfile.address.city || defaultInfo.city,
      region: regionName,
      regionCode: profileRegionCode || defaultInfo.regionCode,
      country: userProfile.address.country || defaultInfo.country,
      countryCode: userProfile.address.countryCode || defaultInfo.countryCode
    };

    console.log("🏠 Extracted departure info from profile:", {
      originalAddress: userProfile.address,
      extractedInfo: departureInfo
    });
    return departureInfo;
  }

  /**
   * Check if user profile is complete and has required flight info
   * @param {Object} userProfile - User profile object
   * @returns {boolean} True if profile has flight info
   */
  static hasFlightInfo(userProfile) {
    // Check for region code in either field
    const profileRegionCode = userProfile?.address?.regionCode || userProfile?.address?.region;
    
    const hasInfo = !!(
      userProfile?.isProfileComplete &&
      userProfile?.address?.city &&
      profileRegionCode
    );
    
    console.log("🔍 Profile flight info check:", {
      isComplete: userProfile?.isProfileComplete,
      hasCity: !!userProfile?.address?.city,
      hasRegionCode: !!userProfile?.address?.regionCode,
      hasRegionInRegionField: !!userProfile?.address?.region,
      profileRegionCode: profileRegionCode,
      result: hasInfo
    });
    
    return hasInfo;
  }

  /**
   * Auto-populate flight data from user profile
   * @param {Object} userProfile - User profile object
   * @param {Object} currentFlightData - Current flight data state
   * @returns {Object} Updated flight data or current data if no changes needed
   */
  static autoPopulateFlightData(userProfile, currentFlightData) {
    if (!this.hasFlightInfo(userProfile)) {
      console.log("⚠️ Insufficient profile data for flight auto-population");
      return currentFlightData;
    }

    // Only auto-populate if flight data is empty
    if (currentFlightData.departureCity || currentFlightData.departureRegionCode) {
      console.log("✋ Flight data already populated, skipping auto-population");
      return currentFlightData;
    }

    const departureInfo = this.extractDepartureInfo(userProfile);
    
    console.log("🔄 Auto-populating flight data:", {
      from: currentFlightData,
      to: {
        departureCity: departureInfo.city,
        departureRegion: departureInfo.region,
        departureRegionCode: departureInfo.regionCode,
      }
    });

    return {
      ...currentFlightData,
      departureCity: departureInfo.city,
      departureRegion: departureInfo.region,
      departureRegionCode: departureInfo.regionCode,
    };
  }
}

export default UserProfileConfig;