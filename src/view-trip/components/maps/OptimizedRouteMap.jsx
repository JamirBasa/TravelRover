import React, { useState, useEffect, useMemo, useCallback } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { MapPin, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GeocodingLoadingOverlay,
  MapMarkers,
  LocationInfoWindow,
  DayFilterDropdown,
  LocationSequenceList,
} from "./route-components";

/**
 * OptimizedRouteMap Component
 *
 * Features:
 * - 📍 Visual markers for all locations
 * - 🛣️ Optimized route display
 * - ⏱️ Distance and travel time
 * - 🗺️ Interactive navigation
 * - 🎯 Auto-center and bounds fitting
 */
function OptimizedRouteMap({ itinerary, destination, trip }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom] = useState(13);
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [selectedDay, setSelectedDay] = useState("all");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({
    current: 0,
    total: 0,
  });

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapContainerRef = React.useRef(null);

  // Extract recommended hotel name from trip data
  const recommendedHotelName = useMemo(() => {
    if (!trip?.tripData) return null;

    // Try multiple possible paths for hotel data
    const possiblePaths = [
      trip?.tripData?.hotels,
      trip?.tripData?.accommodations,
      trip?.tripData?.tripData?.hotels,
      trip?.tripData?.tripData?.accommodations,
    ];

    for (const path of possiblePaths) {
      if (path) {
        let hotels = [];

        // Parse if it's a string
        if (typeof path === "string") {
          try {
            hotels = JSON.parse(path);
          } catch {
            console.warn("Failed to parse hotels data");
            continue;
          }
        } else if (Array.isArray(path)) {
          hotels = path;
        } else if (typeof path === "object") {
          hotels = [path];
        }

        // Get first hotel name
        if (hotels.length > 0) {
          const firstHotel = hotels[0];
          const hotelName =
            firstHotel?.name || firstHotel?.hotelName || firstHotel?.hotel_name;

          if (hotelName) {
            console.log("🏨 Extracted recommended hotel:", hotelName);
            return hotelName;
          }
        }
      }
    }

    console.log("⚠️ No recommended hotel found in trip data");
    return null;
  }, [trip]);

  // Helper to parse itinerary - handles multiple formats
  const parseItinerary = (data) => {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        try {
          const fixedData = data.replace(/\}\s*,\s*\{/g, "},{");
          const wrappedData = fixedData.startsWith("[")
            ? fixedData
            : `[${fixedData}]`;
          return JSON.parse(wrappedData);
        } catch {
          console.error("Failed to parse itinerary");
          console.log("Raw itinerary data:", data.substring(0, 500));
          return [];
        }
      }
    }
    return Array.isArray(data) ? data : [];
  };

  // Parse planText format
  const parsePlanText = (planText) => {
    if (!planText || typeof planText !== "string") return [];

    const activities = planText.split("|").map((activity) => activity.trim());
    return activities
      .map((activityText) => {
        const parenthesesMatch = activityText.match(/\(([^)]+)\)$/);
        let price = "N/A";
        let duration = "Varies";
        let rating = null;

        if (parenthesesMatch) {
          const innerContent = parenthesesMatch[1];
          const parts = [];
          let currentPart = "";

          for (let i = 0; i < innerContent.length; i++) {
            const char = innerContent[i];
            const prevChars = innerContent.substring(Math.max(0, i - 3), i);
            const nextChars = innerContent.substring(
              i + 1,
              Math.min(innerContent.length, i + 5)
            );

            if (
              char === "," &&
              (prevChars.includes("₱") ||
                nextChars.includes("₱") ||
                prevChars.includes("-") ||
                /^\d/.test(nextChars))
            ) {
              currentPart += char;
            } else if (char === ",") {
              parts.push(currentPart.trim());
              currentPart = "";
            } else {
              currentPart += char;
            }
          }
          if (currentPart) parts.push(currentPart.trim());

          parts.forEach((part) => {
            if (part.toLowerCase().includes("rating:")) {
              rating = part.replace(/rating:\s*/i, "").trim();
            } else if (
              part.match(/^\d+(\.\d+)?\s*(minutes?|hours?|min|mins|hr|hrs|h)/i)
            ) {
              duration = part;
            } else if (part.match(/^(₱|PHP|free|varies)/i)) {
              price = part;
            }
          });

          activityText = activityText.replace(/\s*\([^)]+\)$/, "").trim();
        }

        const mainParts = activityText.split("-").map((p) => p.trim());

        if (mainParts.length >= 2) {
          const parsed = {
            time: mainParts[0] || "All Day",
            placeName: mainParts[1] || "Activity",
            placeDetails: mainParts.slice(2).join(" - ") || "",
            ticketPricing: price,
            timeTravel: duration,
            rating: rating,
          };

          return parsed;
        }

        return null;
      })
      .filter(Boolean);
  };

  // Extract all locations from itinerary
  const allLocations = useMemo(() => {
    const parsedItinerary = parseItinerary(itinerary);
    if (!parsedItinerary || parsedItinerary.length === 0) {
      console.log("📍 No itinerary data available for map");
      return [];
    }

    const locations = [];
    parsedItinerary.forEach((day, dayIndex) => {
      let activities = [];

      if (day.planText) {
        activities = parsePlanText(day.planText);
      } else if (typeof day.plan === "string") {
        try {
          activities = JSON.parse(day.plan);
        } catch {
          activities = parsePlanText(day.plan);
        }
      } else {
        activities = Array.isArray(day.plan) ? day.plan : [];
      }

      activities.forEach((activity, activityIndex) => {
        let placeName =
          activity.placeName || activity.place || activity.location;

        // Check if this is a "return to hotel" activity
        const isReturnToHotel =
          placeName &&
          (/return.*hotel/i.test(placeName) ||
            /back.*hotel/i.test(placeName) ||
            /hotel.*return/i.test(placeName));

        // If it's a return to hotel, replace with actual hotel name
        if (isReturnToHotel && recommendedHotelName) {
          console.log(
            `🏨 Found "return to hotel" activity, replacing with: ${recommendedHotelName}`
          );
          placeName = recommendedHotelName;
          // Update the activity details to show it's a return
          activity.placeDetails = `Return to hotel - ${
            activity.placeDetails || "End of day activities"
          }`;
        }

        const excludePatterns = [
          /^Activity$/i,
          /^Hotel Check/i,
          /^Last\s*$/i,
          /^Halal (Lunch|Dinner|Breakfast)$/i,
          /^Spa & Relaxation/i,
          /^Shopping$/i,
        ];

        const shouldExclude =
          !isReturnToHotel &&
          excludePatterns.some(
            (pattern) => placeName && pattern.test(placeName.trim())
          );

        if (placeName && !shouldExclude && placeName.length > 3) {
          locations.push({
            id: `day${dayIndex}-activity${activityIndex}`,
            name: placeName,
            details: activity.placeDetails || activity.details || "",
            time: activity.time || "All Day",
            day: dayIndex + 1,
            dayTheme: day.theme || `Day ${dayIndex + 1}`,
            activityIndex: activityIndex,
            pricing: activity.ticketPricing || activity.price || "N/A",
            duration: activity.timeTravel || activity.duration || "Varies",
            coordinates:
              activity.geoCoordinates || activity.coordinates || null,
            isReturnToHotel: isReturnToHotel,
          });
        }
      });
    });

    console.log(
      `📍 Extracted ${locations.length} locations from itinerary`,
      locations.slice(0, 3)
    );
    return locations;
  }, [itinerary, recommendedHotelName]);

  // Get unique days from itinerary
  const uniqueDays = useMemo(() => {
    const days = [...new Set(allLocations.map((loc) => loc.day))].sort(
      (a, b) => a - b
    );
    return days;
  }, [allLocations]);

  // Filter locations by selected day
  const filteredLocations = useMemo(() => {
    if (selectedDay === "all") {
      return geocodedLocations;
    }
    return geocodedLocations.filter((loc) => loc.day === parseInt(selectedDay));
  }, [geocodedLocations, selectedDay]);

  // Get day theme for display
  const getDayTheme = (day) => {
    const dayData = parseItinerary(itinerary).find(
      (d) => parseItinerary(itinerary).indexOf(d) + 1 === day
    );
    return dayData?.theme || `Day ${day}`;
  };

  // Geocode a location name to get coordinates
  const geocodeLocation = async (locationName) => {
    try {
      const searchQuery = `${locationName}, Philippines`;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchQuery
      )}&key=${apiKey}`;

      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log(
          `✅ Geocoded: ${locationName} → ${location.lat}, ${location.lng}`
        );
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      } else {
        console.warn(`⚠️ No geocode results for: ${locationName}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Geocoding error for ${locationName}:`, error);
      return null;
    }
  };

  // Geocode all locations without coordinates
  useEffect(() => {
    const geocodeLocations = async () => {
      if (allLocations.length === 0) return;

      console.log(`🔍 Geocoding ${allLocations.length} locations...`);

      const locationsToGeocode = allLocations.filter((loc) => !loc.coordinates);

      if (locationsToGeocode.length === 0) {
        console.log("✅ All locations already have coordinates");
        setGeocodedLocations(allLocations);
        setIsGeocoding(false);
        return;
      }

      setIsGeocoding(true);
      setGeocodingProgress({ current: 0, total: locationsToGeocode.length });

      const updatedLocations = [...allLocations];

      for (let i = 0; i < locationsToGeocode.length; i++) {
        const location = locationsToGeocode[i];

        setGeocodingProgress({
          current: i + 1,
          total: locationsToGeocode.length,
        });

        const coords = await geocodeLocation(location.name);

        if (coords) {
          const index = updatedLocations.findIndex((l) => l.id === location.id);
          if (index !== -1) {
            updatedLocations[index] = {
              ...updatedLocations[index],
              coordinates: coords,
            };
          }
        }

        if (i < locationsToGeocode.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      const successCount = updatedLocations.filter((l) => l.coordinates).length;
      console.log(
        `✅ Geocoding complete! ${successCount}/${allLocations.length} locations have coordinates`
      );

      setGeocodedLocations(updatedLocations);
      setIsGeocoding(false);
    };

    geocodeLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLocations.length, apiKey]);

  // Calculate center of all locations
  const calculateCenter = useCallback(async () => {
    if (allLocations.length === 0) {
      return { lat: 14.5995, lng: 120.9842 };
    }

    const locationsWithCoords = allLocations.filter(
      (loc) => loc.coordinates?.latitude && loc.coordinates?.longitude
    );

    if (locationsWithCoords.length > 0) {
      const avgLat =
        locationsWithCoords.reduce(
          (sum, loc) => sum + loc.coordinates.latitude,
          0
        ) / locationsWithCoords.length;
      const avgLng =
        locationsWithCoords.reduce(
          (sum, loc) => sum + loc.coordinates.longitude,
          0
        ) / locationsWithCoords.length;

      return { lat: avgLat, lng: avgLng };
    }

    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        destination
      )}&key=${apiKey}`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }

    return { lat: 14.5995, lng: 120.9842 };
  }, [allLocations, destination, apiKey]);

  // Note: We no longer fetch Google Maps travel data
  // Instead, we use the travel time provided by Gemini AI in the itinerary

  // Initialize map center
  useEffect(() => {
    const initCenter = async () => {
      const center = await calculateCenter();
      setMapCenter(center);
    };

    initCenter();
  }, [calculateCenter]);

  // Get travel info from Gemini's itinerary data (between consecutive locations)
  const getTravelInfo = useCallback(
    (fromIndex, toIndex) => {
      // Get both locations to check if they're on the same day
      const fromLocation = filteredLocations[fromIndex];
      const toLocation = filteredLocations[toIndex];

      // 🚫 Don't show travel time if locations are on different days
      if (!fromLocation || !toLocation || fromLocation.day !== toLocation.day) {
        return null;
      }

      if (!toLocation || !toLocation.duration) {
        return null;
      }

      // Gemini's timeTravel field contains descriptive travel information
      // Real formats from Gemini:
      // - "15 minutes by taxi from city center"
      // - "Walking distance from Burnham Park"
      // - "30 minutes by jeepney from city center"
      const durationText = toLocation.duration;

      // Pattern 1: Extract time with transport mode (e.g., "15 minutes by taxi")
      const timeWithTransport = durationText.match(
        /(\d+)\s*(minutes?|hours?|min|mins|hr|hrs|h)\s*by\s*(\w+)/i
      );

      if (timeWithTransport) {
        const value = parseInt(timeWithTransport[1]);
        const unit = timeWithTransport[2].toLowerCase();
        const transport = timeWithTransport[3].toLowerCase();

        let displayDuration;
        if (unit.startsWith("h")) {
          displayDuration = value === 1 ? "1 hour" : `${value} hours`;
        } else {
          displayDuration = value === 1 ? "1 minute" : `${value} minutes`;
        }

        // Map transport modes to emojis
        const transportIcons = {
          taxi: "🚕",
          jeepney: "🚌",
          bus: "🚌",
          car: "🚗",
          van: "🚐",
          tricycle: "🛺",
          walking: "🚶",
          walk: "🚶",
        };

        return {
          duration: displayDuration,
          transport: transport,
          transportIcon: transportIcons[transport] || "🚗",
          rawText: durationText,
          source: "AI recommendation",
        };
      }

      // Pattern 2: Walking distance (e.g., "Walking distance from Burnham Park")
      const walkingDistance = durationText.match(/walking\s+distance/i);
      if (walkingDistance) {
        return {
          duration: "Walking distance",
          transport: "walking",
          transportIcon: "🚶",
          rawText: durationText,
          source: "AI recommendation",
        };
      }

      // Pattern 3: Just time without transport (e.g., "30 minutes from city center")
      const timeOnly = durationText.match(
        /(\d+)\s*(minutes?|hours?|min|mins|hr|hrs|h)/i
      );
      if (timeOnly) {
        const value = parseInt(timeOnly[1]);
        const unit = timeOnly[2].toLowerCase();

        let displayDuration;
        if (unit.startsWith("h")) {
          displayDuration = value === 1 ? "1 hour" : `${value} hours`;
        } else {
          displayDuration = value === 1 ? "1 minute" : `${value} minutes`;
        }

        return {
          duration: displayDuration,
          transport: "various",
          transportIcon: "🚶",
          rawText: durationText,
          source: "AI recommendation",
        };
      }

      // Pattern 4: Old format compatibility "30 minutes travel + 2 hours visit"
      const oldFormat = durationText.match(
        /(\d+)\s*(minutes?|hours?|min|mins|hr|hrs|h)\s*travel/i
      );
      if (oldFormat) {
        const value = parseInt(oldFormat[1]);
        const unit = oldFormat[2].toLowerCase();

        let displayDuration;
        if (unit.startsWith("h")) {
          displayDuration = value === 1 ? "1 hour" : `${value} hours`;
        } else {
          displayDuration = value === 1 ? "1 minute" : `${value} minutes`;
        }

        return {
          duration: displayDuration,
          transport: "various",
          transportIcon: "🚗",
          rawText: durationText,
          source: "AI recommendation",
        };
      }

      // If no pattern matches but there's duration text, show it as-is
      if (durationText && durationText.trim().length > 0) {
        return {
          duration: durationText,
          transport: "various",
          transportIcon: "🚶",
          rawText: durationText,
          source: "AI recommendation",
        };
      }

      // If no travel info, don't show connector
      return null;
    },
    [filteredLocations]
  );

  // Get marker color based on day
  const getMarkerColor = (day) => {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
    ];
    return colors[(day - 1) % colors.length];
  };

  // Handle location click from list
  const handleLocationClick = (location) => {
    handleMarkerClick(location);

    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });

      setTimeout(() => {
        console.log(`🔍 Focused on: ${location.name}`);
      }, 500);
    }
  };

  // Handle marker click
  const handleMarkerClick = useCallback((location) => {
    setSelectedLocation(location);
  }, []);

  if (!apiKey) {
    return (
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                Map Unavailable
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Google Maps API key is not configured. Contact administrator to
                enable map features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapCenter) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600 dark:border-sky-500"></div>
            <span>Loading map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Disclaimer Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-sm mb-1">
              AI-Generated Routes & Locations
            </h4>
            <p className="text-amber-800 dark:text-amber-400 text-xs leading-relaxed">
              These routes and locations are AI-generated suggestions. While we
              strive for accuracy,
              <strong className="font-semibold">
                {" "}
                please verify details
              </strong>{" "}
              like addresses, opening hours, and directions before visiting.
              Travel times are estimates and may vary based on traffic and
              conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <Card ref={mapContainerRef} className="overflow-hidden">
        <APIProvider
          apiKey={apiKey}
          libraries={["places", "geometry", "routes"]}
        >
          <div className="relative w-full h-[600px]">
            {/* Geocoding Loading Overlay */}
            <GeocodingLoadingOverlay
              isGeocoding={isGeocoding}
              geocodingProgress={geocodingProgress}
            />

            <Map
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: "100%", height: "100%" }}
            >
              {/* Render markers for filtered locations */}
              <MapMarkers
                filteredLocations={filteredLocations}
                onMarkerClick={handleLocationClick}
                getMarkerColor={getMarkerColor}
              />

              {/* Info Window for selected location */}
              <LocationInfoWindow
                selectedLocation={selectedLocation}
                onClose={() => setSelectedLocation(null)}
              />
            </Map>
          </div>
        </APIProvider>
      </Card>

      {/* Location List with Travel Times */}
      <Card>
        <CardContent className="p-4">
          {/* Header with Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-sky-600 dark:text-sky-500" />
              <h4 className="font-bold text-gray-900 dark:text-gray-100">
                Location Sequence
              </h4>
              <Badge variant="secondary" className="ml-1">
                {filteredLocations.length}{" "}
                {filteredLocations.length === 1 ? "stop" : "stops"}
              </Badge>
            </div>

            {/* Day Filter Dropdown */}
            <DayFilterDropdown
              selectedDay={selectedDay}
              uniqueDays={uniqueDays}
              onDayChange={setSelectedDay}
              getDayTheme={getDayTheme}
            />
          </div>

          {isGeocoding ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <LocationSequenceList
              filteredLocations={filteredLocations}
              onLocationClick={handleLocationClick}
              getMarkerColor={getMarkerColor}
              getTravelInfo={getTravelInfo}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OptimizedRouteMap;
