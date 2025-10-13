import React from "react";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  COMPOSED_STYLES,
} from "../constants/designSystem";
import { calculateTotalBudget, formatCurrency } from "@/utils/budgetCalculator";

function TripOverviewStats({
  currentItinerary,
  placesToVisit,
  totalActivities,
  totalDays,
  trip,
}) {
  // Calculate total estimated budget
  const budgetInfo = calculateTotalBudget(trip);
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
    <div className={`${COMPOSED_STYLES.primarySection}`}>
      {/* Subtle Background Pattern */}
      <div className={PATTERNS.sectionHeader.decoration}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-4 translate-x-4"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-2 -translate-x-2"></div>
      </div>

      <div
        className={`${PATTERNS.sectionHeader.content} ${SPACING.padding.large}`}
      >
        <div className="text-center mb-6">
          <h3 className={`text-2xl sm:text-3xl font-bold text-white mb-2`}>
            ✨ Your Adventure at a Glance
          </h3>
          <p className={`text-base sm:text-lg text-blue-100 leading-relaxed`}>
            Everything you need to know about your amazing journey
          </p>
        </div>

        <div
          className={`grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8`}
        >
          <div className="text-center group">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300`}
            >
              <span className="text-3xl sm:text-4xl">📅</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold text-white mb-2`}>
              {itineraryLength}
            </div>
            <div
              className={`text-base sm:text-lg text-white font-semibold leading-tight`}
            >
              Days of Adventure
            </div>
          </div>

          <div className="text-center group">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300`}
            >
              <span className="text-3xl sm:text-4xl">🎯</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold text-white mb-2`}>
              {placesToVisitLength}
            </div>
            <div
              className={`text-base sm:text-lg text-white font-semibold leading-tight`}
            >
              Must-See Places
            </div>
          </div>

          <div className="text-center group">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300`}
            >
              <span className="text-3xl sm:text-4xl">⚡</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold text-white mb-2`}>
              {activitiesCount}
            </div>
            <div
              className={`text-base sm:text-lg text-white font-semibold leading-tight`}
            >
              Exciting Activities
            </div>
          </div>

          <div className="text-center group">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300`}
            >
              <span className="text-3xl sm:text-4xl">⏱️</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold text-white mb-2`}>
              {trip?.userSelection?.duration ||
                trip?.tripData?.duration ||
                "N/A"}
            </div>
            <div
              className={`text-base sm:text-lg text-white font-semibold leading-tight`}
            >
              Days Total
            </div>
          </div>

          {budgetInfo.total > 0 && (
            <div className="text-center group">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300`}
                title={`Activities: ${formatCurrency(
                  budgetInfo.breakdown.activities
                )} | Hotels: ${formatCurrency(
                  budgetInfo.breakdown.hotels
                )} | Flights: ${formatCurrency(budgetInfo.breakdown.flights)}`}
              >
                <span className="text-3xl sm:text-4xl">💰</span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold text-white mb-2`}>
                {formatCurrency(budgetInfo.total)}
              </div>
              <div
                className={`text-base sm:text-lg text-white font-semibold leading-tight`}
              >
                Total Cost
              </div>
            </div>
          )}
        </div>

        {/* Trip Highlights */}
        <div className="mt-6 pt-6 border-t border-white border-opacity-20">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 bg-white/95 text-gray-800 rounded-full px-5 py-2.5 text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white">
              <span className="text-lg sm:text-xl">🌟</span>
              <span>AI-Optimized</span>
            </div>
            {budgetInfo.total > 0 && (
              <div
                className="flex items-center gap-2.5 bg-white/95 text-gray-800 rounded-full px-5 py-2.5 text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white"
                title={`Activities: ${formatCurrency(
                  budgetInfo.breakdown.activities
                )} | Hotels: ${formatCurrency(
                  budgetInfo.breakdown.hotels
                )} | Flights: ${formatCurrency(budgetInfo.breakdown.flights)}`}
              >
                <span className="text-lg sm:text-xl">💰</span>
                <span>Estimated Cost</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 bg-white/95 text-gray-800 rounded-full px-5 py-2.5 text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white">
              <span className="text-lg sm:text-xl">📍</span>
              <span>Local Insights</span>
            </div>
            {trip?.hasRealFlights && (
              <div className="flex items-center gap-2.5 bg-white/95 text-gray-800 rounded-full px-5 py-2.5 text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white">
                <span className="text-lg sm:text-xl">✈️</span>
                <span>Live Flights</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripOverviewStats;
