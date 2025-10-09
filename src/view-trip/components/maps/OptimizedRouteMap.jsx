import React, { useState, useEffect, useMemo, useCallback } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { MapPin, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { googleMapsTravelService } from "@/services/GoogleMapsTravelService";
import {
  RouteStatistics,
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
function OptimizedRouteMap({ itinerary, destination }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [travelData, setTravelData] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [geocodedLocations, setGeocodedLocations] = useState([]); // Track geocoded locations
  const [selectedDay, setSelectedDay] = useState("all"); // Filter by day
  const [isGeocoding, setIsGeocoding] = useState(false); // Loading state for geocoding
  const [geocodingProgress, setGeocodingProgress] = useState({
    current: 0,
    total: 0,
  }); // Progress tracking

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapContainerRef = React.useRef(null); // Reference to map container for scrolling

  // Helper to parse itinerary - handles multiple formats
  const parseItinerary = (data) => {
    if (typeof data === "string") {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // If JSON parsing fails, try to split multiple JSON objects
        try {
          // Handle case where multiple JSON objects are concatenated: }{
          const fixedData = data.replace(/\}\s*,\s*\{/g, "},{");
          // Wrap in array brackets if not already
          const wrappedData = fixedData.startsWith("[")
            ? fixedData
            : `[${fixedData}]`;
          return JSON.parse(wrappedData);
        } catch (e2) {
          console.error("Failed to parse itinerary:", e2);
          console.log("Raw itinerary data:", data.substring(0, 500));
          return [];
        }
      }
    }
    return Array.isArray(data) ? data : [];
  };

  // Parse planText format: "9:00 AM - Fort Santiago - Description (Price, Duration, Rating)"
  const parsePlanText = (planText) => {
    if (!planText || typeof planText !== "string") return [];

    const activities = planText.split("|").map((activity) => activity.trim());
    return activities
      .map((activityText, index) => {
        // Enhanced parsing with better regex to handle complex data
        // Format: "TIME - PLACE NAME - DESCRIPTION (PRICE, DURATION, Rating: X)"

        // First, try to extract the content in parentheses
        const parenthesesMatch = activityText.match(/\(([^)]+)\)$/);
        let price = "N/A";
        let duration = "Varies";
        let rating = null;

        if (parenthesesMatch) {
          const innerContent = parenthesesMatch[1];

          // Smart split: Don't split commas inside price ranges
          // Match patterns: "₱800 - ₱1,500" should stay together
          const parts = [];
          let currentPart = "";
          let inPriceRange = false;

          for (let i = 0; i < innerContent.length; i++) {
            const char = innerContent[i];
            const prevChars = innerContent.substring(Math.max(0, i - 3), i);
            const nextChars = innerContent.substring(
              i + 1,
              Math.min(innerContent.length, i + 5)
            );

            // Detect if we're in a price range (has ₱ or dash before/after)
            if (
              char === "," &&
              (prevChars.includes("₱") ||
                nextChars.includes("₱") ||
                prevChars.includes("-") ||
                /^\d/.test(nextChars))
            ) {
              // Keep comma if it's part of a number (₱1,500) or price range
              currentPart += char;
            } else if (char === ",") {
              // This comma is a separator
              parts.push(currentPart.trim());
              currentPart = "";
            } else {
              currentPart += char;
            }
          }
          if (currentPart) parts.push(currentPart.trim());

          // Extract based on patterns
          parts.forEach((part) => {
            if (part.toLowerCase().includes("rating:")) {
              rating = part.replace(/rating:\s*/i, "").trim();
            } else if (
              part.match(/^\d+(\.\d+)?\s*(minutes?|hours?|min|mins|hr|hrs|h)/i)
            ) {
              // Duration pattern: "30 minutes", "2 hours", "2.5 hours"
              duration = part;
            } else if (part.match(/^(₱|PHP|free|varies)/i)) {
              // Price pattern: "₱500", "₱1,500", "₱800 - ₱1,500", "Free", "Varies"
              price = part;
            }
          });

          // Debug logging for validation
          if (index === 0) {
            console.log("📊 Parsed activity example:", {
              price,
              duration,
              rating,
              parts,
            });
          }

          // Remove the parentheses part from the activity text
          activityText = activityText.replace(/\s*\([^)]+\)$/, "").trim();
        }

        // Now parse the main parts: TIME - PLACE - DESCRIPTION
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
      // Handle different plan formats
      let activities = [];

      if (day.planText) {
        // New format: planText with pipe-separated activities
        activities = parsePlanText(day.planText);
      } else if (typeof day.plan === "string") {
        try {
          activities = JSON.parse(day.plan);
        } catch (e) {
          activities = parsePlanText(day.plan);
        }
      } else {
        activities = Array.isArray(day.plan) ? day.plan : [];
      }

      activities.forEach((activity, activityIndex) => {
        const placeName =
          activity.placeName || activity.place || activity.location;

        // Filter out non-place activities (check-ins, meals without specific venue, etc.)
        const excludePatterns = [
          /^Activity$/i,
          /^Hotel Check/i,
          /^Last\s*$/i,
          /^Halal (Lunch|Dinner|Breakfast)$/i, // Generic meals without venue
          /^Spa & Relaxation/i, // Generic activities
          /^Shopping$/i,
        ];

        const shouldExclude = excludePatterns.some(
          (pattern) => placeName && pattern.test(placeName.trim())
        );

        // Only include if it's a specific place name
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
            // Add coordinates if available from route optimization
            coordinates:
              activity.geoCoordinates || activity.coordinates || null,
          });
        }
      });
    });

    console.log(
      `📍 Extracted ${locations.length} locations from itinerary`,
      locations.slice(0, 3)
    );
    return locations;
  }, [itinerary]);

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
      // Add Philippines context to improve accuracy
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

      // Find locations without coordinates
      const locationsToGeocode = allLocations.filter((loc) => !loc.coordinates);

      if (locationsToGeocode.length === 0) {
        console.log("✅ All locations already have coordinates");
        setGeocodedLocations(allLocations);
        setIsGeocoding(false);
        return;
      }

      // Start loading state
      setIsGeocoding(true);
      setGeocodingProgress({ current: 0, total: locationsToGeocode.length });

      // Create a copy of locations to update
      const updatedLocations = [...allLocations];

      // Geocode each location with delay to avoid rate limiting
      for (let i = 0; i < locationsToGeocode.length; i++) {
        const location = locationsToGeocode[i];

        // Update progress
        setGeocodingProgress({
          current: i + 1,
          total: locationsToGeocode.length,
        });

        const coords = await geocodeLocation(location.name);

        if (coords) {
          // Find and update this location in the array
          const index = updatedLocations.findIndex((l) => l.id === location.id);
          if (index !== -1) {
            updatedLocations[index] = {
              ...updatedLocations[index],
              coordinates: coords,
            };
          }
        }

        // Delay to avoid rate limiting (10 requests per second limit)
        if (i < locationsToGeocode.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      const successCount = updatedLocations.filter((l) => l.coordinates).length;
      console.log(
        `✅ Geocoding complete! ${successCount}/${allLocations.length} locations have coordinates`
      );

      // Update state to trigger re-render with markers
      setGeocodedLocations(updatedLocations);
      setIsGeocoding(false);
    };

    geocodeLocations();
  }, [allLocations.length, apiKey]); // Only run when locations count changes

  // Calculate center of all locations
  const calculateCenter = useCallback(async () => {
    if (allLocations.length === 0) {
      // Default to destination or Philippines center
      return { lat: 14.5995, lng: 120.9842 }; // Manila default
    }

    // If we have coordinates from route optimization, use them
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

    // Otherwise, geocode the destination
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

    return { lat: 14.5995, lng: 120.9842 }; // Fallback to Manila
  }, [allLocations, destination, apiKey]);

  // Fetch travel data and optimize route
  useEffect(() => {
    const fetchTravelData = async () => {
      if (allLocations.length < 2) return;

      setIsLoadingRoutes(true);

      try {
        // Wait for Google Maps API to load (with timeout)
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds max

        while (!window.google?.maps && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }

        if (window.google?.maps) {
          console.log("✅ Google Maps API loaded for travel calculations");
        } else {
          console.warn(
            "⚠️ Google Maps API not loaded, using fallback estimations"
          );
        }

        // Calculate travel times between consecutive locations
        const locationNames = allLocations.map((loc) => loc.name);
        const travelTimes = await googleMapsTravelService.getTravelTimes(
          locationNames,
          "DRIVING"
        );

        setTravelData(travelTimes);

        // Try to get optimized route directions
        const routeData = await googleMapsTravelService.getRouteDirections(
          locationNames,
          "DRIVING"
        );

        if (routeData) {
          setRoutePolyline(routeData.polyline);
        }
      } catch (error) {
        console.error("Error fetching travel data:", error);
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    fetchTravelData();
  }, [allLocations]);

  // Initialize map center
  useEffect(() => {
    const initCenter = async () => {
      const center = await calculateCenter();
      setMapCenter(center);
    };

    initCenter();
  }, [calculateCenter]);

  // Calculate total travel time and distance
  const totalStats = useMemo(() => {
    if (travelData.length === 0) {
      return { totalTime: 0, totalDistance: 0, timeText: "Calculating..." };
    }

    const totalMinutes = travelData.reduce(
      (sum, travel) => sum + travel.durationValue / 60,
      0
    );
    const totalMeters = travelData.reduce(
      (sum, travel) => sum + travel.distanceValue,
      0
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;
    const distanceText = `${(totalMeters / 1000).toFixed(1)} km`;

    return {
      totalTime: totalMinutes,
      totalDistance: totalMeters,
      timeText,
      distanceText,
    };
  }, [travelData]);

  // Get marker color based on day
  const getMarkerColor = (day) => {
    const colors = [
      "#3B82F6", // blue
      "#10B981", // green
      "#F59E0B", // amber
      "#EF4444", // red
      "#8B5CF6", // purple
      "#EC4899", // pink
      "#14B8A6", // teal
    ];
    return colors[(day - 1) % colors.length];
  };

  // Handle location click from list - scroll to map and show marker
  const handleLocationClick = (location) => {
    // Set selected location to show info window
    handleMarkerClick(location);

    // Smooth scroll to map container
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });

      // Add a small delay to ensure scroll completes, then highlight
      setTimeout(() => {
        // Optional: You could add a subtle zoom or animation here
        console.log(`📍 Focused on: ${location.name}`);
      }, 500);
    }
  };

  // Handle marker click
  const handleMarkerClick = useCallback((location) => {
    setSelectedLocation(location);
  }, []);

  // Get travel info between two locations
  const getTravelInfo = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex < 0 || toIndex >= travelData.length) return null;
      return travelData[fromIndex];
    },
    [travelData]
  );

  if (!apiKey) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-900 mb-1">
                Map Unavailable
              </h4>
              <p className="text-sm text-orange-700">
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
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Loading map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route Statistics */}
      <RouteStatistics
        filteredLocations={filteredLocations}
        geocodedLocations={geocodedLocations}
        selectedDay={selectedDay}
        totalStats={totalStats}
        isLoadingRoutes={isLoadingRoutes}
      />

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
              <MapPin className="h-5 w-5 text-blue-600" />
              <h4 className="font-bold text-gray-900">Location Sequence</h4>
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
            // Loading Skeleton
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
