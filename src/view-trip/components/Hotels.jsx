import React from "react";
import HotelCardItem from "./HotelCardItem";

function Hotels({ trip }) {
  // Clean data parsing utility (same as PlacesToVisit for consistency)
  const parseDataArray = (data, fieldName) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        // Smart parsing for malformed JSON
        try {
          const cleanedData = data.trim();

          if (cleanedData.startsWith("{") && !cleanedData.startsWith("[")) {
            const parts = [];
            let currentObject = "";
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = 0; i < cleanedData.length; i++) {
              const char = cleanedData[i];

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
                !inString &&
                braceCount === 0 &&
                currentObject.trim().endsWith("}")
              ) {
                const nextNonWhitespace = cleanedData
                  .substring(i + 1)
                  .match(/^\s*,\s*/);
                if (nextNonWhitespace) {
                  parts.push(currentObject.trim());
                  currentObject = "";
                  i += nextNonWhitespace[0].length;
                }
              }
            }

            if (currentObject.trim()) {
              parts.push(currentObject.trim());
            }

            const parsedObjects = [];
            parts.forEach((part) => {
              try {
                const obj = JSON.parse(part);
                parsedObjects.push(obj);
              } catch (e) {
                // Skip malformed objects silently
              }
            });

            if (parsedObjects.length > 0) {
              return parsedObjects;
            }
          }
        } catch (regexError) {
          // Fall through to final fallback
        }

        // Final cleanup attempt
        try {
          const cleaned = data
            .replace(/^\"+|\"+$/g, "")
            .replace(/\n|\r/g, "")
            .replace(/\\/g, "")
            .trim();

          const cleanedParsed = JSON.parse(cleaned);
          return Array.isArray(cleanedParsed) ? cleanedParsed : [cleanedParsed];
        } catch (cleanError) {
          return [];
        }
      }
    }

    if (typeof data === "object" && data !== null) {
      return [data];
    }

    return [];
  };

  // Parse hotel data from multiple possible paths
  const hotelsRaw =
    trip?.tripData?.hotels ||
    trip?.tripData?.accommodations ||
    trip?.tripData?.tripData?.hotels ||
    trip?.tripData?.tripData?.accommodations ||
    [];

  const hotels = parseDataArray(hotelsRaw, "hotels");

  // Calculate average price if available
  const avgPrice =
    hotels.length > 0
      ? hotels.reduce((sum, hotel) => {
          const price = hotel?.pricePerNight || hotel?.priceRange || "0";
          const numPrice = parseFloat(price.replace(/[₱$€£,]/g, ""));
          return sum + (isNaN(numPrice) ? 0 : numPrice);
        }, 0) /
        hotels.filter((hotel) => {
          const price = hotel?.pricePerNight || hotel?.priceRange || "0";
          const numPrice = parseFloat(price.replace(/[₱$€£,]/g, ""));
          return !isNaN(numPrice);
        }).length
      : 0;

  // Empty state - High Contrast Design
  if (!hotels || hotels.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <span className="text-2xl text-purple-600">🏨</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          No Hotels Found
        </h3>
        <p className="text-gray-600 text-sm max-w-md mx-auto font-medium">
          We're still finding the perfect accommodations for your trip. Please
          check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Enhanced Header Section - High Contrast Design */}
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 px-8 py-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-5 rounded-full translate-y-4 -translate-x-4"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                <span className="text-white text-2xl drop-shadow-md">🏨</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 [text-shadow:_0_2px_4px_rgb(0_0_0_/_0.3)]">
                  Premium Accommodations
                </h2>
                <p className="text-white text-sm flex items-center gap-2 [text-shadow:_0_1px_3px_rgb(0_0_0_/_0.2)]">
                  <span>🌟</span>
                  <span className="font-medium">
                    {hotels.length} handpicked hotels for your stay
                  </span>
                  <span>•</span>
                  <span className="font-medium">🎯 AI-recommended</span>
                </p>
              </div>
            </div>

            {avgPrice > 0 && (
              <div className="hidden md:block text-right bg-white/15 backdrop-blur-md rounded-xl px-4 py-3 border border-white/25 shadow-lg">
                <div className="text-white text-sm font-medium [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.2)]">
                  Average Rate
                </div>
                <div className="text-white text-2xl font-bold [text-shadow:_0_2px_4px_rgb(0_0_0_/_0.3)]">
                  ₱{Math.round(avgPrice).toLocaleString()}
                </div>
                <div className="text-white text-xs font-medium [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.2)]">
                  per night
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hotels List */}
      <div className="p-6">
        <div className="grid gap-6">
          {hotels.map((hotel, index) => (
            <div
              key={
                hotel?.id || hotel?.hotelName || hotel?.name || `hotel-${index}`
              }
              className="group"
            >
              <HotelCardItem hotel={hotel} />
              {/* Add separator except for last item */}
              {index < hotels.length - 1 && (
                <div className="mt-6 border-b border-gray-100"></div>
              )}
            </div>
          ))}
        </div>

        {/* Hotel Selection Tips - Enhanced Contrast */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <span className="text-blue-600 text-base">💡</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-900 mb-2 text-base">
                Booking Tips
              </h4>
              <ul className="text-sm text-blue-800 space-y-2 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    Click on any hotel to view location on Google Maps
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Compare prices and amenities before booking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    Check cancellation policies for flexible travel plans
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Book early for better rates and availability</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hotels;
