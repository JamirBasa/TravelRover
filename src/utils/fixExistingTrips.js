/**
 * UTILITY: Fix Hotel Name Mismatches in Existing Trips
 * 
 * This utility runs the early hotel name validator on trips that were created
 * before the validation fix was implemented. It updates the itinerary in Firestore
 * to ensure hotel names are consistent.
 * 
 * Usage:
 * 1. Import in browser console or create a settings page button
 * 2. Call fixSingleTrip(tripId) for one trip
 * 3. Call fixAllUserTrips(userId) to fix all trips for a user
 */

import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { validateAndFixHotelNames } from "./earlyHotelNameValidator";

/**
 * Fix hotel name mismatches in a single trip
 * @param {string} tripId - Trip document ID
 * @returns {Promise<Object>} - Result of the fix operation
 */
export async function fixSingleTrip(tripId) {
  try {
    console.log(`🔧 Fixing hotel names for trip: ${tripId}`);
    
    // Fetch trip from Firestore
    const tripRef = doc(db, "AITrips", tripId);
    const tripSnap = await getDoc(tripRef);
    
    if (!tripSnap.exists()) {
      console.error(`❌ Trip not found: ${tripId}`);
      return { success: false, error: "Trip not found" };
    }
    
    const tripData = tripSnap.data();
    
    // Check if trip has the necessary data
    if (!tripData.tripData?.itinerary || !tripData.tripData?.hotels) {
      console.log(`ℹ️ Trip ${tripId} has no itinerary or hotels - skipping`);
      return { success: true, skipped: true, reason: "No itinerary or hotels" };
    }
    
    // Run validation
    const validation = validateAndFixHotelNames(tripData.tripData);
    
    if (validation.isValid) {
      console.log(`✅ Trip ${tripId} already has correct hotel names - no changes needed`);
      return { success: true, skipped: true, reason: "Already correct" };
    }
    
    if (!validation.fixedData) {
      console.warn(`⚠️ Trip ${tripId} has issues but no fixes were generated`);
      return { success: false, error: "No fixes generated" };
    }
    
    // Update Firestore with corrected itinerary
    await updateDoc(tripRef, {
      "tripData.itinerary": validation.fixedData.itinerary,
      "tripData.lastHotelNameValidation": new Date().toISOString(),
    });
    
    console.log(`✅ Successfully fixed ${validation.totalMismatches} hotel name mismatch(es) in trip ${tripId}`);
    
    return {
      success: true,
      tripId,
      fixesApplied: validation.totalMismatches,
      fixes: validation.fixes,
    };
    
  } catch (error) {
    console.error(`❌ Error fixing trip ${tripId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Fix hotel name mismatches in all trips for a user
 * @param {string} userEmail - User email address
 * @returns {Promise<Object>} - Summary of fixes applied
 */
export async function fixAllUserTrips(userEmail) {
  try {
    console.log(`🔧 Fixing hotel names for all trips by: ${userEmail}`);
    
    // Query all trips by this user
    const tripsQuery = query(
      collection(db, "AITrips"),
      where("userEmail", "==", userEmail)
    );
    
    const tripsSnapshot = await getDocs(tripsQuery);
    
    if (tripsSnapshot.empty) {
      console.log(`ℹ️ No trips found for user: ${userEmail}`);
      return { success: true, totalTrips: 0, fixed: 0, skipped: 0, errors: [] };
    }
    
    const results = {
      success: true,
      totalTrips: tripsSnapshot.size,
      fixed: 0,
      skipped: 0,
      errors: [],
      details: [],
    };
    
    console.log(`📊 Found ${tripsSnapshot.size} trip(s) to process...`);
    
    // Process each trip
    for (const tripDoc of tripsSnapshot.docs) {
      const result = await fixSingleTrip(tripDoc.id);
      
      if (result.success && !result.skipped) {
        results.fixed++;
        results.details.push({
          tripId: tripDoc.id,
          destination: tripDoc.data().userSelection?.location,
          fixesApplied: result.fixesApplied,
        });
      } else if (result.skipped) {
        results.skipped++;
      } else {
        results.errors.push({
          tripId: tripDoc.id,
          error: result.error,
        });
      }
    }
    
    console.log(`✅ Completed! Fixed: ${results.fixed}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);
    
    return results;
    
  } catch (error) {
    console.error(`❌ Error fixing trips for user ${userEmail}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Check a trip for hotel name mismatches without fixing
 * @param {string} tripId - Trip document ID
 * @returns {Promise<Object>} - Validation result
 */
export async function checkTripForMismatches(tripId) {
  try {
    console.log(`🔍 Checking trip for hotel name mismatches: ${tripId}`);
    
    const tripRef = doc(db, "AITrips", tripId);
    const tripSnap = await getDoc(tripRef);
    
    if (!tripSnap.exists()) {
      return { success: false, error: "Trip not found" };
    }
    
    const tripData = tripSnap.data();
    
    if (!tripData.tripData?.itinerary || !tripData.tripData?.hotels) {
      return { success: true, hasMismatches: false, reason: "No itinerary or hotels" };
    }
    
    const validation = validateAndFixHotelNames(tripData.tripData);
    
    if (validation.isValid) {
      console.log(`✅ No mismatches found in trip ${tripId}`);
      return { success: true, hasMismatches: false };
    }
    
    console.log(`⚠️ Found ${validation.totalMismatches} mismatch(es) in trip ${tripId}`);
    
    return {
      success: true,
      hasMismatches: true,
      totalMismatches: validation.totalMismatches,
      fixes: validation.fixes,
      destination: tripData.userSelection?.location,
    };
    
  } catch (error) {
    console.error(`❌ Error checking trip ${tripId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Browser console helper - fix current trip
 * Usage: Open trip page, then in console: window.fixCurrentTrip()
 */
if (typeof window !== 'undefined') {
  window.fixCurrentTrip = async () => {
    const tripId = window.location.pathname.match(/\/view-trip\/([^\/]+)/)?.[1];
    if (!tripId) {
      console.error("❌ Not on a trip page. Navigate to a trip first.");
      return;
    }
    return await fixSingleTrip(tripId);
  };
  
  window.checkCurrentTrip = async () => {
    const tripId = window.location.pathname.match(/\/view-trip\/([^\/]+)/)?.[1];
    if (!tripId) {
      console.error("❌ Not on a trip page. Navigate to a trip first.");
      return;
    }
    return await checkTripForMismatches(tripId);
  };
  
  console.log("✅ Hotel name fix utilities loaded!");
  console.log("   Use window.checkCurrentTrip() to check for mismatches");
  console.log("   Use window.fixCurrentTrip() to fix the current trip");
}
