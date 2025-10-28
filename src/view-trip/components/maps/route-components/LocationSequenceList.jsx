import React from "react";
import { MapPin, Clock, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isValidDuration, isValidPricing } from "./locationDataValidator";

/**
 * LocationSequenceList Component
 * Displays the ordered list of locations with travel time between them
 */
export function LocationSequenceList({
  filteredLocations,
  onLocationClick,
  getMarkerColor,
  getTravelInfo,
}) {
  if (filteredLocations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
        <p>No locations found for selected day</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredLocations.map((location, index) => {
        // Check if this is the start of a new day (for "All Days" view)
        const isNewDay =
          index === 0 || filteredLocations[index - 1].day !== location.day;
        const showDaySeparator = isNewDay && index > 0;

        return (
          <div key={location.id}>
            {/* Day Separator (only show in "All Days" view when day changes) */}
            {showDaySeparator && (
              <div className="flex items-center gap-3 my-4 px-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                <Badge
                  variant="outline"
                  className="text-sm font-semibold px-3 py-1 bg-white dark:bg-slate-900 border-2"
                  style={{ borderColor: getMarkerColor(location.day) }}
                >
                  Day {location.day}
                </Badge>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
              </div>
            )}

            {/* Location Card */}
            <div className="group transition-all duration-200 hover:scale-[1.01]">
              <div
                className="relative flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-700
                       bg-white dark:bg-slate-900 hover:shadow-md hover:border-sky-300 dark:hover:border-sky-600 cursor-pointer 
                       transition-all duration-200"
                onClick={() => onLocationClick(location)}
              >
                {/* Number Badge */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center 
                         text-white font-bold text-sm flex-shrink-0 shadow-md
                         ring-4 ring-white dark:ring-slate-800 ring-opacity-50 transition-transform
                         group-hover:scale-110"
                  style={{ backgroundColor: getMarkerColor(location.day) }}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight">
                        {location.name}
                      </h5>
                      {location.isReturnToHotel && (
                        <Badge
                          variant="outline"
                          className="text-xs py-0 px-2 h-5 bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                        >
                          🏨 Return
                        </Badge>
                      )}
                    </div>
                    <MapPin
                      className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 
                                   group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors"
                    />
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border-2"
                      style={{
                        borderColor: getMarkerColor(location.day),
                        color: getMarkerColor(location.day),
                      }}
                    >
                      Day {location.day}
                    </Badge>

                    {location.time && (
                      <div
                        className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400
                                  bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md"
                      >
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{location.time}</span>
                      </div>
                    )}

                    {isValidDuration(location.duration) && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span>⏱️ {location.duration}</span>
                      </div>
                    )}

                    {isValidPricing(location.pricing) && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span>💰 {location.pricing}</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  {location.details && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {location.details}
                    </p>
                  )}
                </div>

                {/* Hover Indicator */}
                <div
                  className="absolute inset-0 rounded-xl border-2 border-sky-500 dark:border-sky-600
                            opacity-0 group-hover:opacity-100 transition-opacity 
                            pointer-events-none"
                />
              </div>
            </div>

            {/* Travel Time Connector */}
            {index < filteredLocations.length - 1 &&
              getTravelInfo(index, index + 1) && (
                <TravelTimeConnector
                  travelInfo={getTravelInfo(index, index + 1)}
                />
              )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * TravelTimeConnector Component
 * Shows AI-recommended travel time between consecutive locations
 */
function TravelTimeConnector({ travelInfo }) {
  // Use the transport icon from parsed data, or default to walking
  const icon = travelInfo.transportIcon || "🚶";

  return (
    <div className="flex items-center gap-3 my-2 ml-5">
      {/* Animated connector line with transport icon */}
      <div className="flex flex-col items-center gap-1 py-2">
        <div
          className="w-px h-3 bg-gradient-to-b from-transparent 
                      via-sky-300 to-sky-400 dark:via-sky-600 dark:to-sky-700"
        ></div>
        <div className="text-base leading-none">{icon}</div>
        <div
          className="w-px h-3 bg-gradient-to-b from-sky-400 
                      via-sky-300 to-transparent dark:from-sky-700 dark:via-sky-600"
        ></div>
      </div>

      {/* Travel info card */}
      <div className="flex-1 flex flex-col gap-1.5 py-2 px-3 rounded-lg border bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-800">
        {/* Main travel info */}
        <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-300">
          <ArrowDown className="h-3.5 w-3.5 text-sky-600 dark:text-sky-500" />

          {travelInfo.duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500" />
              <span className="font-medium">{travelInfo.duration}</span>
            </div>
          )}

          {/* Transport mode badge (if not 'various') */}
          {travelInfo.transport && travelInfo.transport !== "various" && (
            <Badge variant="outline" className="text-xs py-0 px-2 h-5 gap-1">
              {icon} {travelInfo.transport}
            </Badge>
          )}
        </div>

        {/* Full description if available */}
        {travelInfo.rawText && travelInfo.rawText !== travelInfo.duration && (
          <div className="text-xs text-gray-600 dark:text-gray-400 italic">
            {travelInfo.rawText}
          </div>
        )}

        {/* AI source indicator */}
        {travelInfo.source && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <span>📍 {travelInfo.source}</span>
          </div>
        )}
      </div>
    </div>
  );
}
