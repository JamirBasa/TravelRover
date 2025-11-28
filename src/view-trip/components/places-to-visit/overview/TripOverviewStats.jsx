import React from "react";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  COMPOSED_STYLES,
} from "../constants/designSystem";
import { calculateTotalBudget, formatCurrency } from "@/utils";

function TripOverviewStats({
  currentItinerary,
  placesToVisit,
  totalActivities,
  totalDays,
  trip,
}) {
  // Calculate total estimated budget from trip costs
  const budgetInfo = calculateTotalBudget(trip);
  
  // ✅ Get user's allocated budget (what they set during trip creation)
  const getUserBudget = () => {
    // Priority 1: Use budgetAmount (numeric field)
    if (trip?.userSelection?.budgetAmount) {
      return trip.userSelection.budgetAmount;
    }
    
    // Priority 2: Parse customBudget string
    if (trip?.userSelection?.customBudget && trip.userSelection.customBudget.trim() !== "") {
      const amount = parseInt(trip.userSelection.customBudget);
      return !isNaN(amount) ? amount : null;
    }
    
    // Priority 3: Use grandTotal from tripData (AI-generated budget)
    if (trip?.tripData) {
      const tripData = typeof trip.tripData === 'string' ? JSON.parse(trip.tripData) : trip.tripData;
      if (tripData?.grandTotal && tripData.grandTotal > 0) {
        return tripData.grandTotal;
      }
    }
    
    // Priority 4: Use calculated trip cost
    if (budgetInfo.total > 0) {
      return budgetInfo.total;
    }
    
    return null;
  };
  
  const userBudget = getUserBudget();
  
  // Safe defaults for undefined/null values with comprehensive checks
  const itineraryLength =
    (Array.isArray(currentItinerary) ? currentItinerary.length : 0) ||
    totalDays ||
    0;

  const placesToVisitLength =
    (Array.isArray(placesToVisit) ? placesToVisit.length : 0) || 0;

  const activitiesCount =
    (typeof totalActivities === "number" ? totalActivities : 0) || 0;

  // Only hide component if we have no meaningful data to show
  if (
    itineraryLength === 0 &&
    placesToVisitLength === 0 &&
    activitiesCount === 0
  ) {
    return null;
  }

  return (
    <div
      className={`${COMPOSED_STYLES.primarySection} dark:bg-gradient-to-br dark:from-sky-900 dark:via-blue-900 dark:to-indigo-950 rounded-xl shadow-xl overflow-hidden`}
    >
      {/* Subtle Background Pattern */}
      <div className={PATTERNS.sectionHeader.decoration}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-white/10 opacity-5 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white dark:bg-white/10 opacity-5 rounded-full translate-y-4 -translate-x-4"></div>
      </div>

      <div
        className={`${PATTERNS.sectionHeader.content} px-4 sm:px-6 py-5 sm:py-6`}
      >
        <div className="text-center mb-6">
          <h3
            className={`text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight`}
          >
            ✨ Your Adventure at a Glance
          </h3>
          <p
            className={`text-sm sm:text-base text-blue-100 dark:text-blue-200 max-w-2xl mx-auto`}
          >
            AI-optimized itinerary with real-time data
          </p>
        </div>

        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`}>
          <div className="text-center group cursor-default">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/25 dark:bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-white/35 group-hover:scale-110 shadow-lg">
              <span className="text-2xl sm:text-3xl">📅</span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-bold text-white mb-1 transition-all duration-300 group-hover:scale-105`}
            >
              {itineraryLength}
            </div>
            <div
              className={`text-sm sm:text-base font-semibold text-white dark:text-blue-100 leading-tight`}
            >
              {itineraryLength === 1 ? "Day" : "Days"}
            </div>
          </div>

          <div className="text-center group cursor-default">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/25 dark:bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-white/35 group-hover:scale-110 shadow-lg">
              <span className="text-2xl sm:text-3xl">📍</span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-bold text-white mb-1 transition-all duration-300 group-hover:scale-105`}
            >
              {placesToVisitLength}
            </div>
            <div
              className={`text-sm sm:text-base font-semibold text-white dark:text-blue-100 leading-tight`}
            >
              Featured {placesToVisitLength === 1 ? "Place" : "Places"}
            </div>
          </div>

          <div className="text-center group cursor-default">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/25 dark:bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-white/35 group-hover:scale-110 shadow-lg">
              <span className="text-2xl sm:text-3xl">⚡</span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-bold text-white mb-1 transition-all duration-300 group-hover:scale-105`}
            >
              {activitiesCount}
            </div>
            <div
              className={`text-sm sm:text-base font-semibold text-white dark:text-blue-100 leading-tight`}
            >
              {activitiesCount === 1 ? "Activity" : "Activities"}
            </div>
          </div>

          <div className="text-center group cursor-default">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/25 dark:bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-white/35 group-hover:scale-110 shadow-lg">
              <span className="text-2xl sm:text-3xl">💰</span>
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold text-white mb-1 transition-all duration-300 group-hover:scale-105`}
            >
              {userBudget ? formatCurrency(userBudget) : "Budget not set"}
            </div>
            <div
              className={`text-sm sm:text-base font-semibold text-white dark:text-blue-100 leading-tight`}
            >
              {userBudget ? "Your Budget" : "No Budget Set"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripOverviewStats;
