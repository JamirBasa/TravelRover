import React from "react";
import PlaceCardItem from "../../shared/PlaceCardItem";

function PlacesToVisitSection({ placesToVisit }) {
  // ✅ Safety check: Handle undefined, null, or empty array
  if (
    !placesToVisit ||
    !Array.isArray(placesToVisit) ||
    placesToVisit.length === 0
  ) {
    return null;
  }

  // ✅ Filter out any null/undefined items from the array
  const validPlaces = placesToVisit.filter(
    (place) => place !== null && place !== undefined
  );

  if (validPlaces.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Simplified Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 px-6 sm:px-8 py-6 relative overflow-hidden">
        {/* Single subtle background accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
        
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-3xl">🎯</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight">
              Must-Visit Attractions
            </h2>
            <p className="text-emerald-50 text-sm sm:text-base font-medium">
              {validPlaces.length} {validPlaces.length === 1 ? "place" : "places"} to explore
            </p>
          </div>
        </div>
      </div>

      {/* Clean Content Area */}
      <div className="p-6 sm:p-8">
        {/* Place Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {validPlaces.map((place, index) => (
            <PlaceCardItem key={place?.placeName || index} place={place} />
          ))}
        </div>

        {/* Subtle Helpful Tip */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
            <span className="font-semibold">Tip:</span> Click any attraction to view on Google Maps and get directions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PlacesToVisitSection;
