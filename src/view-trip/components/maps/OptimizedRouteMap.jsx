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
  const [daySpecificTravelData, setDaySpecificTravelData] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [selectedDay, setSelectedDay] = useState("all");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({
    current: 0,
    total: 0,
  });

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapContainerRef = React.useRef(null);

  // Helper to parse itinerary - handles multiple formats
  const parseItinerary = (data) => {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        try {
          const fixedData = data.replace(/\}\s*,\s*\{/g, "},{");
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

  // Parse planText format
  const parsePlanText = (planText) => {
    if (!planText || typeof planText !== "string") return [];

    const activities = planText.split("|").map((activity) => activity.trim());
    return activities
      .map((activityText, index) => {
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
    const transportSegments = [];
    parsedItinerary.forEach((day, dayIndex) => {
      let activities = [];

      if (day.planText) {
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

        const excludePatterns = [
          /^Activity$/i,
          /^Hotel Check/i,
          /^Last\s*$/i,
          /^Halal (Lunch|Dinner|Breakfast)$/i,
          /^Spa & Relaxation/i,
          /^Shopping$/i,
        ];

        const shouldExclude = excludePatterns.some(
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

  // Fetch travel data and optimize route
  useEffect(() => {
    const fetchTravelData = async () => {
      if (allLocations.length < 2) return;

      setIsLoadingRoutes(true);

      try {
        console.log("🚗 Fetching travel data using TravelRouteService...");

        const locationNames = allLocations.map((loc) => loc.name);
        console.log("📍 Location names:", locationNames);

        const travelTimes = await googleMapsTravelService.getTravelTimes(
          locationNames,
          "AUTO"
        );

        console.log("✅ Travel times received:", travelTimes);
        setTravelData(travelTimes);

        const routeData = await googleMapsTravelService.getRouteDirections(
          locationNames,
          "AUTO"
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

  // Fetch day-specific travel data when filtering
  useEffect(() => {
    const fetchDayTravelData = async () => {
      if (selectedDay === "all" || filteredLocations.length < 2) {
        setDaySpecificTravelData(null);
        return;
      }

      setIsLoadingRoutes(true);

      try {
        const locationNames = filteredLocations.map((loc) => loc.name);
        console.log(
          `📅 Fetching day-specific travel data for Day ${selectedDay}:`,
          locationNames
        );

        const dayTravelTimes = await googleMapsTravelService.getTravelTimes(
          locationNames,
          "AUTO"
        );

        console.log(
          `✅ Fetched travel times for Day ${selectedDay}:`,
          dayTravelTimes
        );
        setDaySpecificTravelData(dayTravelTimes);
      } catch (error) {
        console.error("Error fetching day travel data:", error);
        setDaySpecificTravelData(null);
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    fetchDayTravelData();
  }, [selectedDay, filteredLocations]);

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
    const dataToUse =
      selectedDay === "all" ? travelData : daySpecificTravelData || [];

    if (dataToUse.length === 0) {
      return {
        totalTime: 0,
        totalDistance: 0,
        timeText: "Calculating...",
        distanceText: "0 km",
        avgSpeed: "N/A",
      };
    }

    // Filter out very short travel segments (less than 5km) as they represent
    // local movement within the same area, not actual travel between locations
    const meaningfulTravelSegments = dataToUse.filter(
      (travel) => travel.distanceValue >= 5000 // 5km minimum
    );

    if (meaningfulTravelSegments.length === 0) {
      return {
        totalTime: 0,
        totalDistance: 0,
        timeText: "No significant travel",
        distanceText: "Local area only",
        avgSpeed: "N/A",
      };
    }

    const totalMinutes = meaningfulTravelSegments.reduce(
      (sum, travel) => sum + travel.durationValue / 60,
      0
    );
    const totalMeters = meaningfulTravelSegments.reduce(
      (sum, travel) => sum + travel.distanceValue,
      0
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;
    const distanceText = `${(totalMeters / 1000).toFixed(1)} km`;

    const totalHours = totalMinutes / 60;
    const totalKm = totalMeters / 1000;
    const avgSpeedValue = totalHours > 0 ? totalKm / totalHours : 0;
    const avgSpeed =
      avgSpeedValue > 0 ? `${avgSpeedValue.toFixed(1)} km/h` : "N/A";

    return {
      totalTime: totalMinutes,
      totalDistance: totalMeters,
      timeText,
      distanceText,
      avgSpeed,
    };
  }, [travelData, daySpecificTravelData, selectedDay]);

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

  const getTravelInfo = useCallback(
    (fromIndex, toIndex) => {
      const dataToUse =
        selectedDay === "all"
          ? travelData
          : daySpecificTravelData || travelData;

      if (fromIndex < 0 || toIndex >= dataToUse.length) return null;

      const rawInfo = dataToUse[fromIndex];

      if (!rawInfo) return null;

      // ✅ AFTER: Only filter very local movements
      if (rawInfo.distanceValue < 1000) {
        // 1km instead of 2km
        return null;
      }

      // Use the travel data from TravelRouteService directly
      // The service already provides accurate data from bus routes or Google Directions API
      return {
        ...rawInfo,
        transport:
          rawInfo.travelMode === "BUS" ? "bus" : rawInfo.transport || "driving",
        isEstimated: false,
        isAdjusted: false,
        operators: rawInfo.operators,
        fare: rawInfo.fare,
        frequency: rawInfo.frequency,
        service: rawInfo.service,
        notes: rawInfo.notes,
        source: rawInfo.source,
      };
    },
    [travelData, daySpecificTravelData, selectedDay]
  );

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
      {/* Route Statistics */}
      <RouteStatistics
        filteredLocations={filteredLocations}
        geocodedLocations={geocodedLocations}
        selectedDay={selectedDay}
        totalStats={totalStats}
        isLoadingRoutes={isLoadingRoutes}
      />

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
