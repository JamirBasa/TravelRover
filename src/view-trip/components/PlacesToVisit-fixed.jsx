import React from "react";
import PlaceCardItem from "./PlaceCardItem";

function PlacesToVisit({ trip }) {
  console.log("🔍 PlacesToVisit - Full trip data:", trip);
  console.log("🔍 PlacesToVisit - tripData:", trip?.tripData);

  // Helper function to safely parse data
  const parseDataArray = (data, fieldName) => {
    if (Array.isArray(data)) {
      console.log(`✅ ${fieldName} is already an array:`, data.length, "items");
      return data;
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        const result = Array.isArray(parsed) ? parsed : [];
        console.log(
          `✅ Parsed ${fieldName} from string:`,
          result.length,
          "items"
        );
        return result;
      } catch (error) {
        console.error(`❌ Error parsing ${fieldName}:`, error);
        return [];
      }
    }

    console.log(`⚠️ ${fieldName} is not array or string:`, typeof data);
    return [];
  };

  // Get itinerary data
  const itinerary = parseDataArray(trip?.tripData?.itinerary, "itinerary");

  // Get places to visit data
  const placesToVisit = parseDataArray(
    trip?.tripData?.placesToVisit,
    "placesToVisit"
  );

  // If no data available, show empty state
  if (itinerary.length === 0 && placesToVisit.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-2">📅</div>
        <p className="text-gray-500 text-sm">No itinerary available</p>
        <p className="text-xs text-gray-400 mt-2">
          This might be due to data parsing issues. Try regenerating your trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Places to Visit Section */}
      {placesToVisit.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 text-lg">📍</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Places to Visit
              </h2>
              <p className="text-sm text-gray-600">
                {placesToVisit.length} amazing destinations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {placesToVisit.map((place, index) => (
              <PlaceCardItem key={place?.placeName || index} place={place} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Itinerary Section */}
      {itinerary.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">📅</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Daily Itinerary
              </h2>
              <p className="text-sm text-gray-600">
                {itinerary.length} day schedule
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {itinerary.map((dayItem, dayIndex) => (
              <div key={dayItem?.day || dayIndex} className="relative">
                {/* Day Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">
                      {dayItem?.day || dayIndex + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Day {dayItem?.day || dayIndex + 1}
                    </h3>
                    <p className="text-blue-600 font-medium">
                      {dayItem?.theme || "Daily Activities"}
                    </p>
                  </div>
                </div>

                {/* Day Activities */}
                <div className="ml-6 pl-6 border-l-2 border-gray-200 relative">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Handle both planText (legacy) and plan (new format) */}
                      {dayItem?.plan && Array.isArray(dayItem.plan) ? (
                        // New format: array of activity objects
                        dayItem.plan.map((activity, activityIndex) => (
                          <div
                            key={activityIndex}
                            className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100"
                          >
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1">
                              {activity?.time && (
                                <div className="text-xs font-semibold text-blue-600 mb-1">
                                  🕐 {activity.time}
                                </div>
                              )}
                              <div className="text-sm font-medium text-gray-800 mb-1">
                                📍 {activity?.placeName || "Activity"}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                {activity?.placeDetails ||
                                  "No description available"}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {activity?.ticketPricing && (
                                  <span>💰 {activity.ticketPricing}</span>
                                )}
                                {activity?.timeTravel && (
                                  <span>⏱️ {activity.timeTravel}</span>
                                )}
                                {activity?.rating && (
                                  <span>⭐ {activity.rating}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : dayItem?.planText ? (
                        // Legacy format: text string
                        dayItem.planText
                          .split(" | ")
                          .map((activity, activityIndex) => {
                            const timeMatch = activity.match(
                              /^(\d{1,2}:\d{2} [AP]M)/
                            );
                            const time = timeMatch ? timeMatch[1] : "";
                            const content = time
                              ? activity.replace(time + " - ", "")
                              : activity;

                            return (
                              <div
                                key={activityIndex}
                                className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100"
                              >
                                <div className="flex-shrink-0">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                </div>
                                <div className="flex-1">
                                  {time && (
                                    <div className="text-xs font-semibold text-blue-600 mb-1">
                                      🕐 {time}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-700 leading-relaxed">
                                    {content}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">
                            No activities planned for this day
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlacesToVisit;
