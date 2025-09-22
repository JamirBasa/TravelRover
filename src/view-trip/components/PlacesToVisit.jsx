import React from "react";
import PlaceCardItem from "./PlaceCardItem";

function PlacesToVisit({ trip }) {
  const itinerary = trip?.tripData?.tripData?.itinerary || [];

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📅</div>
        <p className="text-gray-500 text-sm">No itinerary available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {itinerary.map((dayItem, dayIndex) => (
        <div key={dayIndex} className="relative">
          {/* Day Header */}
          <div className="sticky top-0 bg-white z-10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-semibold">
                  {dayIndex + 1}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Day {dayIndex + 1}
                </h3>
                <p className="text-sm text-gray-500">{dayItem.date}</p>
              </div>
            </div>
          </div>

          {/* Activities Timeline */}
          <div className="ml-4 border-l-2 border-gray-200 pl-6 space-y-4">
            {dayItem.activities?.map((activity, activityIndex) => (
              <div key={activityIndex} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-8 top-3 w-3 h-3 bg-white border-2 border-blue-600 rounded-full"></div>

                {/* Activity Time */}
                {activity?.time && (
                  <div className="text-xs font-medium text-blue-600 mb-2">
                    🕐 {activity.time}
                  </div>
                )}

                {/* Activity Card */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <PlaceCardItem place={activity} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlacesToVisit;
