import React from "react";
import PlaceCardItem from "./PlaceCardItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function PlacesToVisit({ trip }) {
  // Clean data parsing utility (removed console.log for production)
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

  // Parse trip data
  const itinerary = parseDataArray(trip?.tripData?.itinerary, "itinerary");
  const placesToVisit = parseDataArray(
    trip?.tripData?.placesToVisit,
    "placesToVisit"
  );

  // Calculate trip statistics
  const totalActivities = itinerary.reduce((total, day) => {
    if (day?.plan && Array.isArray(day.plan)) {
      return total + day.plan.length;
    } else if (day?.planText) {
      return total + day.planText.split(" | ").length;
    }
    return total;
  }, 0);

  // Empty state
  if (itinerary.length === 0 && placesToVisit.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📅</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Itinerary Available
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Your trip itinerary is being prepared. Please check back soon or try
          regenerating your trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Trip Overview Stats */}
      {(itinerary.length > 0 || placesToVisit.length > 0) && (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none pointer-events-none pointer-events-none pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
              }}
            ></div>
          </div>

          <div className="relative z-10 p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                ✨ Your Adventure at a Glance
              </h3>
              <p className="text-blue-100">
                Everything you need to know about your amazing journey
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1 [text-shadow:_0_2px_4px_rgb(0_0_0_/_0.5)]">
                  {itinerary.length}
                </div>
                <div className="text-white text-sm font-semibold [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.3)]">
                  Days of Adventure
                </div>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1 [text-shadow:_0_2px_4px_rgb(0_0_0_/_0.5)]">
                  {placesToVisit.length}
                </div>
                <div className="text-white text-sm font-semibold [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.3)]">
                  Must-See Places
                </div>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1 [text-shadow:_0_2px_4px_rgb(0_0_0_/_0.5)]">
                  {totalActivities}
                </div>
                <div className="text-white text-sm font-semibold [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.3)]">
                  Exciting Activities
                </div>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/35 transition-all duration-300 shadow-lg">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1 [text-shadow:_0_2px_4px_rgb(0_0_0_/_0.5)]">
                  {trip?.userSelection?.duration ||
                    trip?.tripData?.duration ||
                    "N/A"}
                </div>
                <div className="text-white text-sm font-semibold [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.3)]">
                  Days Total
                </div>
              </div>
            </div>

            {/* Enhanced Trip Highlights Banner with shadcn Badges */}
            <div className="mt-6 pt-6 border-t border-white border-opacity-20">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 rounded-full px-4 py-2 shadow-sm border border-amber-200 hover:shadow-md transition-shadow duration-200">
                  <span className="text-lg">🌟</span>
                  <span className="font-semibold text-sm">
                    AI-Optimized Route
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 rounded-full px-4 py-2 shadow-sm border border-emerald-200 hover:shadow-md transition-shadow duration-200">
                  <span className="text-lg">💰</span>
                  <span className="font-semibold text-sm">Budget-Friendly</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full px-4 py-2 shadow-sm border border-blue-200 hover:shadow-md transition-shadow duration-200">
                  <span className="text-lg">📍</span>
                  <span className="font-semibold text-sm">
                    Local Recommendations
                  </span>
                </div>
                {trip?.hasRealFlights && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full px-4 py-2 shadow-sm border border-purple-200 hover:shadow-md transition-shadow duration-200">
                    <span className="text-lg">✈️</span>
                    <span className="font-semibold text-sm">
                      Live Flight Data
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Places to Visit Section */}
      {placesToVisit.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-8 py-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-5 rounded-full translate-y-4 -translate-x-4"></div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Must-Visit Attractions
                    </h2>
                    <p className="text-emerald-100 text-sm flex items-center gap-2">
                      <span>📍</span>
                      <span>
                        {placesToVisit.length} carefully curated destinations
                      </span>
                      <span>•</span>
                      <span>🤖 AI-recommended</span>
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-3 text-white">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {placesToVisit.length}
                    </div>
                    <div className="text-xs text-emerald-100">Places</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Category breakdown if available */}
            <div className="mb-6 flex flex-wrap gap-2">
              {placesToVisit.some((p) => p.category) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Categories:</span>
                  {[
                    ...new Set(
                      placesToVisit
                        .filter((p) => p.category)
                        .map((p) => p.category)
                    ),
                  ].map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {placesToVisit.map((place, index) => (
                <PlaceCardItem key={place?.placeName || index} place={place} />
              ))}
            </div>

            {/* Helpful tip */}
            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 text-sm">💡</span>
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-800 mb-1">
                    Pro Travel Tip
                  </h4>
                  <p className="text-emerald-700 text-sm">
                    Click on any attraction to view its exact location on Google
                    Maps. Consider visiting nearby places together to save time
                    and transportation costs!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Daily Itinerary Section */}
      {itinerary.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 px-8 py-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -translate-y-16 -translate-x-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-8 translate-x-8"></div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <span className="text-white text-2xl">📅</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Your Daily Adventure Plan
                    </h2>
                    <p className="text-blue-100 text-sm flex items-center gap-2">
                      <span>⚡</span>
                      <span>
                        {itinerary.length} days of exciting experiences
                      </span>
                      <span>•</span>
                      <span>🎯 Optimized timeline</span>
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-4 text-white">
                  <div className="text-center">
                    <div className="text-lg font-bold">{totalActivities}</div>
                    <div className="text-xs text-blue-100">Activities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{itinerary.length}</div>
                    <div className="text-xs text-blue-100">Days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Itinerary Navigation Helper */}
            <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 text-lg">🗺️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-indigo-900 mb-2">
                    How to Use This Itinerary
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-indigo-800">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">✅</span>
                      <span>Times are suggestions - adjust to your pace</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">📍</span>
                      <span>Click place names for Google Maps directions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">💰</span>
                      <span>Check current prices before visiting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">📱</span>
                      <span>Download this itinerary for offline access</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {itinerary.map((dayItem, dayIndex) => (
                <div key={dayItem?.day || dayIndex} className="relative">
                  {/* Enhanced Day Header */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-100">
                    <div className="flex items-start gap-5">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-white text-xl font-bold">
                            {dayItem?.day || dayIndex + 1}
                          </span>
                        </div>
                        {/* Day connector line */}
                        {dayIndex < itinerary.length - 1 && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-blue-300 to-transparent mt-2"></div>
                        )}
                      </div>

                      <div className="flex-1 pt-2">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">
                            Day {dayItem?.day || dayIndex + 1}
                          </h3>
                          {dayItem?.plan && Array.isArray(dayItem.plan) && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              {dayItem.plan.length} activities
                            </Badge>
                          )}
                        </div>

                        <p className="text-blue-700 font-semibold text-lg mb-3">
                          🎯 {dayItem?.theme || "Explore & Discover"}
                        </p>

                        {/* Quick day stats */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {dayItem?.plan && Array.isArray(dayItem.plan) && (
                            <>
                              <div className="flex items-center gap-1 text-gray-600">
                                <span>⏱️</span>
                                <span>Full Day Adventure</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600">
                                <span>📍</span>
                                <span>{dayItem.plan.length} Stops</span>
                              </div>
                              {dayItem.plan.some(
                                (activity) => activity.ticketPricing
                              ) && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <span>💰</span>
                                  <span>Tickets Required</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Day Activities */}
                  <div className="ml-7 pl-7 border-l-2 border-gray-100 relative">
                    <div className="space-y-4">
                      {/* Handle both planText (legacy) and plan (new format) */}
                      {dayItem?.plan && Array.isArray(dayItem.plan) ? (
                        // New format: array of activity objects
                        dayItem.plan.map((activity, activityIndex) => (
                          <div
                            key={activityIndex}
                            className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                          >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 transition-all duration-300 pointer-events-none rounded-xl"></div>

                            <div className="relative">
                              <div className="flex gap-5">
                                <div className="flex-shrink-0 pt-1">
                                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-200"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  {/* Time badge */}
                                  {activity?.time && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200 gap-2 mb-3"
                                    >
                                      <span className="text-blue-600">🕐</span>
                                      <span>{activity.time}</span>
                                    </Badge>
                                  )}

                                  {/* Activity title */}
                                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 flex items-center gap-2">
                                    <span className="text-blue-500">📍</span>
                                    <span className="line-clamp-1">
                                      {activity?.placeName || "Activity"}
                                    </span>
                                  </h4>

                                  {/* Description */}
                                  <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">
                                    {activity?.placeDetails ||
                                      "Discover this amazing location and create unforgettable memories during your visit."}
                                  </p>

                                  {/* Enhanced shadcn badges */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {activity?.ticketPricing && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 gap-1"
                                      >
                                        <span className="text-green-600">
                                          💰
                                        </span>
                                        <span>{activity.ticketPricing}</span>
                                      </Badge>
                                    )}

                                    {activity?.timeTravel && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 gap-1"
                                      >
                                        <span className="text-orange-600">
                                          ⏱️
                                        </span>
                                        <span>{activity.timeTravel}</span>
                                      </Badge>
                                    )}

                                    {activity?.rating && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 hover:from-yellow-200 hover:to-amber-200 gap-1"
                                      >
                                        <span className="text-yellow-600">
                                          ⭐
                                        </span>
                                        <span>{activity.rating}/5 Rating</span>
                                      </Badge>
                                    )}

                                    {/* Activity type indicator */}
                                    <Badge
                                      variant="secondary"
                                      className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 hover:from-purple-200 hover:to-indigo-200 gap-1"
                                    >
                                      <span className="text-purple-600">
                                        🎯
                                      </span>
                                      <span>Must-See</span>
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : dayItem?.planText ? (
                        // Legacy format: text string with enhanced parsing
                        dayItem.planText
                          .split(" | ")
                          .map((activity, activityIndex) => {
                            const timeMatch = activity.match(
                              /^(\d{1,2}:\d{2} [AP]M)/
                            );
                            const time = timeMatch ? timeMatch[1] : "";
                            let content = time
                              ? activity.replace(time + " - ", "")
                              : activity;

                            // Extract pricing and rating information
                            const priceMatch = content.match(
                              /\(([₱$€£][\d,]+[^)]*)\)/
                            );
                            const ratingMatch =
                              content.match(/Rating: ([\d.]+)/);
                            const durationMatch = content.match(
                              /(\d+\s*(?:hour|minute|hr|min)[s]?)/i
                            );

                            const price = priceMatch ? priceMatch[1] : null;
                            const rating = ratingMatch ? ratingMatch[1] : null;
                            const duration = durationMatch
                              ? durationMatch[1]
                              : null;

                            return (
                              <div
                                key={activityIndex}
                                className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200"
                              >
                                <div className="flex gap-4">
                                  <div className="flex-shrink-0">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5"></div>
                                  </div>
                                  <div className="flex-1">
                                    {time && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200 mb-2"
                                      >
                                        🕐 {time}
                                      </Badge>
                                    )}
                                    <div className="text-sm text-gray-700 leading-relaxed mb-3">
                                      {content}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {price && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-green-100 text-green-700 hover:bg-green-200 gap-1"
                                        >
                                          <span>💰</span>
                                          <span>{price}</span>
                                        </Badge>
                                      )}
                                      {duration && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-orange-100 text-orange-700 hover:bg-orange-200 gap-1"
                                        >
                                          <span>⏱️</span>
                                          <span>{duration}</span>
                                        </Badge>
                                      )}
                                      {rating && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 gap-1"
                                        >
                                          <span>⭐</span>
                                          <span>{rating}/5</span>
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                          <div className="text-gray-400 text-3xl mb-2">📝</div>
                          <p className="text-gray-500 text-sm">
                            No activities planned for this day
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add spacing between days except for the last one */}
                  {dayIndex < itinerary.length - 1 && (
                    <div className="mt-8 border-b border-gray-100"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Smart Travel Tips Section */}
            <div className="mt-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Planning Tips */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600">🎯</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-800 mb-2">
                        Smart Planning Tips
                      </h4>
                      <ul className="text-emerald-700 text-sm space-y-1">
                        <li>• Book popular attractions in advance</li>
                        <li>• Allow extra time for transportation</li>
                        <li>• Check weather forecasts daily</li>
                        <li>• Keep backup indoor activities ready</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Budget Tips */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600">💡</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 mb-2">
                        Money-Saving Tips
                      </h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Look for combo tickets and discounts</li>
                        <li>• Visit free attractions during peak hours</li>
                        <li>• Use public transportation when possible</li>
                        <li>• Try local street food for authentic meals</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-purple-600">🚀</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-800">
                        Ready to explore?
                      </h4>
                      <p className="text-purple-700 text-sm">
                        Make the most of your adventure with these quick actions
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                      <span>📥</span> Save Offline
                    </Button>
                    <Button
                      variant="outline"
                      className="border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 gap-2"
                    >
                      <span>📤</span> Share Plan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlacesToVisit;
