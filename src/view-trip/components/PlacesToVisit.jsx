import React from "react";
import PlaceCardItem from "./PlaceCardItem";

function PlacesToVisit({ trip }) {
  // Debug logging to see the actual data structure
  console.log("🔍 PlacesToVisit - Full trip data:", trip);
  console.log("🔍 PlacesToVisit - tripData:", trip?.tripData);

  // Parse the itinerary from JSON string
  let parsedItinerary = [];
  try {
    const itineraryString = trip?.tripData?.itinerary;
    if (itineraryString && typeof itineraryString === "string") {
      console.log(
        "🔍 PlacesToVisit - Raw itinerary string length:",
        itineraryString.length
      );
      console.log(
        "🔍 PlacesToVisit - Character at position 785-790:",
        itineraryString.substring(780, 790)
      );

      // More robust approach: Use regex to find individual JSON objects
      const jsonObjectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      const matches = itineraryString.match(jsonObjectRegex);

      if (matches && matches.length > 0) {
        console.log("🔍 PlacesToVisit - Found", matches.length, "JSON objects");
        parsedItinerary = matches
          .map((match, index) => {
            try {
              return JSON.parse(match);
            } catch (parseError) {
              console.error(
                `🔍 PlacesToVisit - Error parsing object ${index}:`,
                parseError
              );
              console.log(`🔍 PlacesToVisit - Problematic JSON:`, match);
              return null;
            }
          })
          .filter(Boolean); // Remove null entries

        console.log(
          "🔍 PlacesToVisit - Successfully parsed",
          parsedItinerary.length,
          "objects"
        );
      } else {
        // Fallback: try the simple bracket approach
        let jsonToParse = itineraryString.trim();
        if (!jsonToParse.startsWith("[") && jsonToParse.includes("},{")) {
          jsonToParse = "[" + jsonToParse + "]";
        }
        parsedItinerary = JSON.parse(jsonToParse);
      }

      console.log(
        "🔍 PlacesToVisit - Final parsed itinerary:",
        parsedItinerary
      );
    }
  } catch (error) {
    console.error("🔍 PlacesToVisit - Error parsing itinerary:", error);

    // Last resort: manual parsing with character-by-character approach
    try {
      const itineraryString = trip?.tripData?.itinerary;
      if (itineraryString) {
        // Find all day objects manually
        const dayObjects = [];
        let currentObject = "";
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < itineraryString.length; i++) {
          const char = itineraryString[i];

          if (escapeNext) {
            currentObject += char;
            escapeNext = false;
            continue;
          }

          if (char === "\\") {
            escapeNext = true;
            currentObject += char;
            continue;
          }

          if (char === '"' && !escapeNext) {
            inString = !inString;
          }

          if (!inString) {
            if (char === "{") {
              braceCount++;
            } else if (char === "}") {
              braceCount--;
            }
          }

          currentObject += char;

          if (
            braceCount === 0 &&
            currentObject.trim() &&
            currentObject.includes('"day"')
          ) {
            try {
              const parsed = JSON.parse(currentObject.trim());
              dayObjects.push(parsed);
              currentObject = "";
            } catch (e) {
              console.log("Failed to parse object:", currentObject.trim());
            }
          }
        }

        parsedItinerary = dayObjects;
        console.log(
          "🔍 PlacesToVisit - Manual parsing result:",
          parsedItinerary
        );
      }
    } catch (manualError) {
      console.error(
        "🔍 PlacesToVisit - Manual parsing also failed:",
        manualError
      );
    }
  }

  // Ensure it's an array
  const itinerary = Array.isArray(parsedItinerary) ? parsedItinerary : [];

  // Parse places to visit data
  let placesToVisit = [];
  try {
    const placesToVisitString = trip?.tripData?.placesToVisit;
    if (placesToVisitString && typeof placesToVisitString === "string") {
      // Same approach as itinerary - it might be multiple JSON objects
      const jsonObjectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      const matches = placesToVisitString.match(jsonObjectRegex);

      if (matches && matches.length > 0) {
        placesToVisit = matches
          .map((match, index) => {
            try {
              return JSON.parse(match);
            } catch (parseError) {
              console.error(`Error parsing place ${index}:`, parseError);
              return null;
            }
          })
          .filter(Boolean);
      } else {
        // Fallback: try adding array brackets
        let jsonToParse = placesToVisitString.trim();
        if (!jsonToParse.startsWith("[") && jsonToParse.includes("},{")) {
          jsonToParse = "[" + jsonToParse + "]";
        }
        placesToVisit = JSON.parse(jsonToParse);
      }
      console.log("🔍 PlacesToVisit - Parsed places:", placesToVisit);
    }
  } catch (error) {
    console.error("🔍 PlacesToVisit - Error parsing places:", error);
  }

  // If no data available, show empty state
  if (
    (!itinerary || itinerary.length === 0) &&
    (!placesToVisit || placesToVisit.length === 0)
  ) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📅</div>
        <p className="text-gray-500 text-sm">No itinerary available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Places to Visit Section */}
      {placesToVisit && placesToVisit.length > 0 && (
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
              <PlaceCardItem key={index} place={place} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Itinerary Section */}
      {itinerary && itinerary.length > 0 && (
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
              <div key={dayIndex} className="relative">
                {/* Day Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">
                      {dayItem.day || dayIndex + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Day {dayItem.day || dayIndex + 1}
                    </h3>
                    <p className="text-blue-600 font-medium">{dayItem.theme}</p>
                  </div>
                </div>

                {/* Day Activities */}
                <div className="ml-6 pl-6 border-l-2 border-gray-200 relative">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {dayItem.planText &&
                        dayItem.planText
                          .split(" | ")
                          .map((activity, activityIndex) => {
                            // Parse each activity (format: "Time - Place - Description (Cost, Duration, Rating)")
                            const activityParts = activity.trim();
                            const timeMatch = activityParts.match(
                              /^(\d{1,2}:\d{2} [AP]M)/
                            );
                            const time = timeMatch ? timeMatch[1] : "";
                            const content = time
                              ? activityParts.replace(time + " - ", "")
                              : activityParts;

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
                          })}
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
