import React from "react";

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
    <div className="relative overflow-hidden brand-gradient rounded-lg shadow-md">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-4 translate-x-4"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-2 -translate-x-2"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-white mb-1">
            ✨ Your Adventure at a Glance
          </h3>
          <p className="text-blue-100 text-sm">
            Everything you need to know about your amazing journey
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center group">
            <div className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-white/35 transition-all duration-300">
              <span className="text-lg">📅</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {itineraryLength}
            </div>
            <div className="text-white text-xs font-medium">
              Days of Adventure
            </div>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-white/35 transition-all duration-300">
              <span className="text-lg">🎯</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {placesToVisitLength}
            </div>
            <div className="text-white text-xs font-medium">
              Must-See Places
            </div>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-white/35 transition-all duration-300">
              <span className="text-lg">⚡</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {activitiesCount}
            </div>
            <div className="text-white text-xs font-medium">
              Exciting Activities
            </div>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-white/35 transition-all duration-300">
              <span className="text-lg">⏱️</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {trip?.userSelection?.duration ||
                trip?.tripData?.duration ||
                "N/A"}
            </div>
            <div className="text-white text-xs font-medium">Days Total</div>
          </div>
        </div>

        {/* Compact Trip Highlights */}
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1 bg-white/90 text-gray-800 rounded-full px-3 py-1 text-xs font-medium">
              <span>🌟</span>
              <span>AI-Optimized</span>
            </div>
            <div className="flex items-center gap-1 bg-white/90 text-gray-800 rounded-full px-3 py-1 text-xs font-medium">
              <span>💰</span>
              <span>Budget-Friendly</span>
            </div>
            <div className="flex items-center gap-1 bg-white/90 text-gray-800 rounded-full px-3 py-1 text-xs font-medium">
              <span>📍</span>
              <span>Local Insights</span>
            </div>
            {trip?.hasRealFlights && (
              <div className="flex items-center gap-1 bg-white/90 text-gray-800 rounded-full px-3 py-1 text-xs font-medium">
                <span>✈️</span>
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
