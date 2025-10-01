import React from "react";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  COMPOSED_STYLES,
} from "../constants/designSystem";

function TripOverviewStats({
  currentItinerary,
  placesToVisit,
  totalActivities,
  totalDays,
  trip,
}) {
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
        className={`${PATTERNS.sectionHeader.content} ${SPACING.padding.medium}`}
      >
        <div className="text-center mb-4">
          <h3 className={`${TYPOGRAPHY.heading.h3} text-white mb-1`}>
            ✨ Your Adventure at a Glance
          </h3>
          <p className={`${TYPOGRAPHY.body.medium} text-blue-100`}>
            Everything you need to know about your amazing journey
          </p>
        </div>

        <div
          className={`grid grid-cols-2 lg:grid-cols-4 ${SPACING.gap.medium}`}
        >
          <div className="text-center group">
            <div className={`${PATTERNS.iconContainer.large} mx-auto mb-2`}>
              <span className="text-3xl">📅</span>
            </div>
            <div className={`text-2xl font-bold text-white mb-1`}>
              {itineraryLength}
            </div>
            <div className={`text-base text-white font-semibold`}>
              Days of Adventure
            </div>
          </div>

          <div className="text-center group">
            <div className={`${PATTERNS.iconContainer.large} mx-auto mb-2`}>
              <span className="text-3xl">🎯</span>
            </div>
            <div className={`text-2xl font-bold text-white mb-1`}>
              {placesToVisitLength}
            </div>
            <div className={`text-base text-white font-semibold`}>
              Must-See Places
            </div>
          </div>

          <div className="text-center group">
            <div className={`${PATTERNS.iconContainer.large} mx-auto mb-2`}>
              <span className="text-3xl">⚡</span>
            </div>
            <div className={`text-2xl font-bold text-white mb-1`}>
              {activitiesCount}
            </div>
            <div className={`text-base text-white font-semibold`}>
              Exciting Activities
            </div>
          </div>

          <div className="text-center group">
            <div className={`${PATTERNS.iconContainer.large} mx-auto mb-2`}>
              <span className="text-3xl">⏱️</span>
            </div>
            <div className={`text-2xl font-bold text-white mb-1`}>
              {trip?.userSelection?.duration ||
                trip?.tripData?.duration ||
                "N/A"}
            </div>
            <div className={`text-base text-white font-semibold`}>
              Days Total
            </div>
          </div>
        </div>

        {/* Compact Trip Highlights */}
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-2 bg-white/90 text-gray-800 rounded-full px-4 py-2 text-base font-semibold">
              <span className="text-lg">🌟</span>
              <span>AI-Optimized</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 text-gray-800 rounded-full px-4 py-2 text-base font-semibold">
              <span className="text-lg">💰</span>
              <span>Budget-Friendly</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 text-gray-800 rounded-full px-4 py-2 text-base font-semibold">
              <span className="text-lg">📍</span>
              <span>Local Insights</span>
            </div>
            {trip?.hasRealFlights && (
              <div className="flex items-center gap-2 bg-white/90 text-gray-800 rounded-full px-4 py-2 text-base font-semibold">
                <span className="text-lg">✈️</span>
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
