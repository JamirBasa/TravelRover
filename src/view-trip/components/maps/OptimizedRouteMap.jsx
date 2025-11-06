import React, { useState, useEffect, useMemo, useCallback } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GeocodingLoadingOverlay,
  MapMarkers,
  LocationInfoWindow,
  DayFilterDropdown,
  LocationSequenceList,
} from "./route-components";
import {
  extractRecommendedHotelName,
  resolveAllHotelReferences,
  isGenericHotelReference,
} from "@/utils/hotelNameResolver";
import {
  extractFlightDetails,
  resolveAllFlightReferences,
} from "@/utils/flightNameResolver";
import { getLimitedServiceInfo } from "@/utils/flightRecommendations";

// ✅ PERSISTENT GEOCODING CACHE
const GEOCODE_CACHE_KEY = "travelrover_geocode_cache_v1";
const CACHE_EXPIRY_DAYS = 30;

const loadGeocodeCache = () => {
  try {
    const cached = localStorage.getItem(GEOCODE_CACHE_KEY);
    if (!cached) return {};

    const { data, timestamp } = JSON.parse(cached);
    const ageInDays = (Date.now() - timestamp) / (24 * 60 * 60 * 1000);

    if (ageInDays > CACHE_EXPIRY_DAYS) {
      console.log("🗑️ Geocode cache expired, clearing...");
      localStorage.removeItem(GEOCODE_CACHE_KEY);
      return {};
    }

    console.log(`✅ Loaded ${Object.keys(data).length} cached geocode entries`);
    return data;
  } catch (error) {
    console.warn("Failed to load geocode cache:", error);
    return {};
  }
};

const saveGeocodeCache = (cache) => {
  try {
    const cacheSize = Object.keys(cache).length;

    // Limit cache size to prevent localStorage overflow
    if (cacheSize > 500) {
      console.warn("⚠️ Geocode cache too large, trimming...");
      const entries = Object.entries(cache);
      const trimmed = Object.fromEntries(entries.slice(-400)); // Keep newest 400
      cache = trimmed;
    }

    localStorage.setItem(
      GEOCODE_CACHE_KEY,
      JSON.stringify({
        data: cache,
        timestamp: Date.now(),
      })
    );

    console.log(`💾 Saved ${cacheSize} geocode entries to cache`);
  } catch (error) {
    console.warn("Failed to save geocode cache:", error);
    // If localStorage is full, try clearing old cache
    try {
      localStorage.removeItem(GEOCODE_CACHE_KEY);
    } catch {
      // Ignore cleanup errors
    }
  }
};

/**
 * OptimizedRouteMap Component
 *
 * Features:
 * - 📍 Visual markers for all locations WITH SPECIFIC HOTEL & FLIGHT NAMES
 * - 🛣️ Optimized route display
 * - ⏱️ Distance and travel time from AI
 * - 🗺️ Interactive navigation
 * - 🎯 Auto-center and bounds fitting
 * - 🏨 Automatic hotel name resolution
 * - ✈️ Automatic flight details resolution
 * - 💾 Persistent geocoding cache (30-day expiry)
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
  const [isUpdating, setIsUpdating] = useState(false);
  // ✅ Initialize with persistent cache
  const [geocodeCache, setGeocodeCache] = useState(() => loadGeocodeCache());
  const [lastItineraryHash, setLastItineraryHash] = useState("");

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapContainerRef = React.useRef(null);
  const geocodingAbortController = React.useRef(null);

  // ✅ Auto-save cache to localStorage when it updates
  useEffect(() => {
    if (Object.keys(geocodeCache).length > 0) {
      saveGeocodeCache(geocodeCache);
    }
  }, [geocodeCache]);

  // ✅ Extract recommended hotel name using new utility
  const recommendedHotelName = useMemo(() => {
    return extractRecommendedHotelName(trip?.tripData);
  }, [trip?.tripData]);

  // ✅ Extract flight details using new utility (pass full trip, not trip.tripData)
  const flightDetails = useMemo(() => {
    return extractFlightDetails(trip); // ← Changed from trip?.tripData to trip
  }, [trip]); // ← Changed dependency from trip?.tripData to trip

  console.log("🏨 Recommended Hotel Name:", recommendedHotelName);
  console.log(
    "✈️ Flight Details:",
    flightDetails ||
      "(No flight data - see Flights tab for inactive airport info)"
  );

  // ✅ Check if destination is an inactive airport (no commercial flights)
  // Now using centralized data from flightRecommendations.js
  const isInactiveAirport = useMemo(() => {
    const destination = trip?.userSelection?.location;
    if (!destination) return null;

    const destLower = destination.toLowerCase();

    // Check common airport codes that might be in the destination name
    const commonCodes = [
      "BAG",
      "VIG",
      "SAG",
      "BAN",
      "PAG",
      "ELN",
      "COR",
      "BOR",
      "SIQ",
      "CAM",
      "MAL",
      "OSL",
      "TAW",
      "SIT",
    ];

    for (const code of commonCodes) {
      const info = getLimitedServiceInfo(code);
      if (
        info &&
        (destLower.includes(info.name.toLowerCase()) ||
          destLower.includes(code.toLowerCase()))
      ) {
        return {
          code,
          name: info.name,
          alternatives: info.alternativeNames || info.alternatives,
        };
      }
    }

    return null;
  }, [trip?.userSelection?.location]);

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

        // Smart parsing: Handle hyphens in place names
        // Format: "2:00 PM - Check-in at El Cielito Hotel - Description"
        // We need to find the first " - " (space-hyphen-space) for time separation

        const timeMatch = activityText.match(/^([^-]+?)\s+-\s+(.+)$/);

        if (timeMatch) {
          const timeStr = timeMatch[1].trim();
          const restOfText = timeMatch[2].trim();

          // Now check if there's another " - " for description separation
          // But we need to be careful with hyphens in names like "Check-in"
          // Strategy: Look for " - " (with spaces) which is more likely to be a separator
          const descriptionMatch = restOfText.match(/^(.+?)\s+-\s+(.+)$/);

          let placeName, placeDetails;

          if (descriptionMatch) {
            // Has description: "Check-in at Hotel - Settle into your room"
            placeName = descriptionMatch[1].trim();
            placeDetails = descriptionMatch[2].trim();
          } else {
            // No description separator, entire rest is place name
            // "Check-in at El Cielito Hotel Baguio"
            placeName = restOfText;
            placeDetails = "";
          }

          const parsed = {
            time: timeStr || "All Day",
            placeName: placeName || "Activity",
            placeDetails: placeDetails,
            ticketPricing: price,
            timeTravel: duration,
            rating: rating,
          };

          return parsed;
        }

        // Fallback: Original simple split (for backwards compatibility)
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

  // ✅ Extract all locations from itinerary WITH HOTEL NAME RESOLUTION
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

        // ✅ Skip truly generic entries that should never appear on map
        const excludePatterns = [
          /^Activity$/i,
          /^Last\s*$/i,
          /^Halal (Lunch|Dinner|Breakfast)$/i,
          /^Spa & Relaxation$/i,
          /^Shopping$/i,
        ];

        const shouldExclude = excludePatterns.some(
          (pattern) => placeName && pattern.test(placeName.trim())
        );

        if (shouldExclude) {
          console.log(`⏭️ Skipping excluded activity: ${placeName}`);
          return; // Skip this activity
        }

        // ✅ Check if this is a generic hotel reference (will be resolved later)
        const isGenericHotel = isGenericHotelReference(placeName);

        if (placeName && placeName.length > 3) {
          locations.push({
            id: `day${dayIndex}-activity${activityIndex}`,
            name: placeName, // Keep original for now, will resolve in batch
            details: activity.placeDetails || activity.details || "",
            time: activity.time || "All Day",
            day: dayIndex + 1,
            dayTheme: day.theme || `Day ${dayIndex + 1}`,
            activityIndex: activityIndex,
            pricing: activity.ticketPricing || activity.price || "N/A",
            duration: activity.timeTravel || activity.duration || "Varies",
            coordinates:
              activity.geoCoordinates || activity.coordinates || null,
            isGenericHotel: isGenericHotel, // Flag for UI display
          });
        }
      });
    });

    console.log(
      `📍 Extracted ${locations.length} locations from itinerary (before resolution)`
    );

    // ✅ Step 1: Batch resolve all hotel references to specific hotel names
    let resolvedLocations = resolveAllHotelReferences(
      locations,
      recommendedHotelName
    );

    // ✅ Step 2: Batch resolve all flight references to specific flight details
    resolvedLocations = resolveAllFlightReferences(
      resolvedLocations,
      flightDetails
    );

    console.log(`✅ Fully resolved locations:`, resolvedLocations.slice(0, 3));

    return resolvedLocations;
  }, [itinerary, recommendedHotelName, flightDetails]);

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

  // Generate hash of itinerary to detect changes
  const generateItineraryHash = useCallback((locations) => {
    return locations.map((loc) => `${loc.id}:${loc.name}`).join("|");
  }, []);

  // ✅ Extract place name from activity description
  const extractPlaceName = (activityName) => {
    if (!activityName) return null;

    // Remove common activity prefixes (Breakfast at, Lunch at, Dinner at, Visit, etc.)
    const cleaned = activityName
      .replace(
        /^(Breakfast|Lunch|Dinner|Snack|Check-in|Check out|Visit|Explore|Tour|Shopping|Relax)\s+(at|to)?\s+/i,
        ""
      )
      .replace(/^(and check in|and check-in|for the day)\s*/i, "")
      .trim();

    // If it's too short or still has common words, return null
    if (cleaned.length < 3) return null;

    // Skip generic activities
    const skipTerms = [
      "hotel",
      "rest",
      "return",
      "end of day",
      "free time",
      "leisure",
    ];
    if (skipTerms.some((term) => cleaned.toLowerCase() === term)) {
      return null;
    }

    return cleaned;
  };

  // Enhanced geocode with caching and place name extraction
  // Enhanced geocode with caching and place name extraction
  const geocodeLocation = async (locationName, signal) => {
    try {
      // ✅ Extract actual place name from activity description
      const placeName = extractPlaceName(locationName);

      if (!placeName) {
        console.log(`⏭️ Skipping generic activity: "${locationName}"`);
        return null;
      }

      // Check cache first (use original name as key)
      if (geocodeCache[locationName]) {
        console.log(`✅ Using cached coordinates for: "${locationName}"`);
        return geocodeCache[locationName];
      }

      // ✅ Validate place name before geocoding
      if (placeName.trim().length < 3) {
        console.warn(
          `⚠️ Skipping geocoding for invalid location: "${locationName}"`
        );
        return null;
      }

      // ✅ Use Django backend proxy for geocoding (secure, no API key exposure)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const geocodeUrl = `${apiBaseUrl}/langgraph/geocoding/`;
      const searchQuery = `${placeName}, Philippines`;

      const response = await fetch(geocodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: searchQuery,
          components: 'country:PH' // Restrict to Philippines for accuracy
        }),
        signal
      });

      const result = await response.json();

      if (!result.success) {
        console.error(
          "❌ Geocoding proxy error:",
          result.error || "Unknown error"
        );
        return null;
      }

      if (result.data?.results && result.data.results.length > 0) {
        const location = result.data.results[0].geometry.location;
        const coords = {
          latitude: location.lat,
          longitude: location.lng,
        };

        // Cache the result
        setGeocodeCache((prev) => ({
          ...prev,
          [locationName]: coords,
        }));

        console.log(
          `✅ Geocoded: "${locationName}" → ${location.lat}, ${location.lng}`
        );
        return coords;
      } else {
        console.warn(
          `⚠️ No geocode results for: "${locationName}"`,
          result.data?.status
        );
        return null;
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(`🛑 Geocoding aborted for: "${locationName}"`);
        return null;
      }
      console.error(`❌ Geocoding error for "${locationName}":`, error);
      return null;
    }
  };

  // ✅ Smart geocoding with change detection and abort support
  useEffect(() => {
    const geocodeLocations = async () => {
      if (allLocations.length === 0) {
        setGeocodedLocations([]);
        return;
      }

      // Check if itinerary actually changed
      const currentHash = generateItineraryHash(allLocations);
      if (currentHash === lastItineraryHash && geocodedLocations.length > 0) {
        console.log("✅ Itinerary unchanged, skipping geocoding");
        return;
      }

      console.log(
        `🔍 Starting smart geocoding for ${allLocations.length} locations...`
      );

      setIsUpdating(true);
      setLastItineraryHash(currentHash);

      // Abort any ongoing geocoding
      if (geocodingAbortController.current) {
        geocodingAbortController.current.abort();
      }
      geocodingAbortController.current = new AbortController();

      // ✅ Filter locations that need geocoding (not in cache and no coordinates)
      const locationsToGeocode = allLocations.filter(
        (loc) => !loc.coordinates && !geocodeCache[loc.name]
      );

      if (locationsToGeocode.length === 0) {
        console.log("✅ All locations cached or have coordinates");

        // Apply cached coordinates
        const updatedLocations = allLocations.map((loc) => {
          if (!loc.coordinates && geocodeCache[loc.name]) {
            return { ...loc, coordinates: geocodeCache[loc.name] };
          }
          return loc;
        });

        setGeocodedLocations(updatedLocations);
        setIsUpdating(false);
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

        console.log(
          `🔍 Geocoding (${i + 1}/${locationsToGeocode.length}): "${
            location.name
          }"${
            location.wasResolved
              ? ` (resolved from "${location.originalName}")`
              : ""
          }`
        );

        const coords = await geocodeLocation(
          location.name,
          geocodingAbortController.current.signal
        );

        if (coords) {
          const index = updatedLocations.findIndex((l) => l.id === location.id);
          if (index !== -1) {
            updatedLocations[index] = {
              ...updatedLocations[index],
              coordinates: coords,
            };
          }
        }

        // ✅ Rate limiting: 150ms delay between requests
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
      setIsUpdating(false);
    };

    geocodeLocations();

    // Cleanup on unmount
    return () => {
      if (geocodingAbortController.current) {
        geocodingAbortController.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLocations, apiKey, generateItineraryHash, lastItineraryHash]);

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
      // ✅ Use Django backend proxy for geocoding
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const geocodeUrl = `${apiBaseUrl}/langgraph/geocoding/`;
      
      const response = await fetch(geocodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: destination,
          components: 'country:PH'
        })
      });

      const result = await response.json();

      if (result.success && result.data?.results && result.data.results.length > 0) {
        const location = result.data.results[0].geometry.location;
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
        };
      }

      // Pattern 2: Walking distance with or without time
      // Matches: "Walking distance", "10 minutes walking distance", "5 min walking distance (free)"
      const walkingWithTime = durationText.match(
        /(\d+)\s*(minutes?|hours?|min|mins|hr|hrs|h)?\s*walking\s+distance/i
      );
      if (walkingWithTime) {
        if (walkingWithTime[1]) {
          // Has time: "10 minutes walking distance"
          const value = parseInt(walkingWithTime[1]);
          const unit = walkingWithTime[2]
            ? walkingWithTime[2].toLowerCase()
            : "minutes";

          let displayDuration;
          if (unit.startsWith("h")) {
            displayDuration = value === 1 ? "1 hour" : `${value} hours`;
          } else {
            displayDuration = value === 1 ? "1 minute" : `${value} minutes`;
          }

          return {
            duration: `${displayDuration} walk`,
            transport: "walking",
            transportIcon: "🚶",
            rawText: durationText,
          };
        } else {
          // Just "walking distance"
          return {
            duration: "Walking distance",
            transport: "walking",
            transportIcon: "🚶",
            rawText: durationText,
          };
        }
      }

      // Pattern 2b: Just "Walking distance" (original pattern as fallback)
      const walkingDistance = durationText.match(/walking\s+distance/i);
      if (walkingDistance) {
        return {
          duration: "Walking distance",
          transport: "walking",
          transportIcon: "🚶",
          rawText: durationText,
        };
      }

      // Pattern 3: Just time without transport (e.g., "30 minutes from city center")
      // This should match clean time values and extract them even if there's extra text
      const timeOnly = durationText.match(
        /(\d+)\s*(minutes?|hours?|min|mins|hr|hrs|h)(?:\s|$)/i
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

        // Detect if it mentions walking in the text
        const hasWalking = /walk/i.test(durationText);

        return {
          duration: displayDuration,
          transport: hasWalking ? "walking" : "various",
          transportIcon: hasWalking ? "🚶" : "🚗",
          rawText: durationText,
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
        };
      }

      // Final fallback: Extract any time value from messy text
      // This handles cases like "10 minutes walking distance (free)" that didn't match above
      const anyTimeValue = durationText.match(
        /(\d+)\s*(minutes?|hours?|min|mins|hr|hrs|h)/i
      );
      if (anyTimeValue) {
        const value = parseInt(anyTimeValue[1]);
        const unit = anyTimeValue[2].toLowerCase();

        let displayDuration;
        if (unit.startsWith("h")) {
          displayDuration = value === 1 ? "1 hour" : `${value} hours`;
        } else {
          displayDuration = value === 1 ? "1 minute" : `${value} minutes`;
        }

        // Smart transport detection from text
        const lowerText = durationText.toLowerCase();
        let transport = "various";
        let icon = "🚗";

        if (/walk/i.test(lowerText)) {
          transport = "walking";
          icon = "🚶";
        } else if (/taxi|cab/i.test(lowerText)) {
          transport = "taxi";
          icon = "🚕";
        } else if (/jeepney/i.test(lowerText)) {
          transport = "jeepney";
          icon = "🚌";
        } else if (/tricycle/i.test(lowerText)) {
          transport = "tricycle";
          icon = "🛺";
        }

        return {
          duration: displayDuration,
          transport: transport,
          transportIcon: icon,
          rawText: durationText,
        };
      }

      // If absolutely no time value found, hide the connector
      // (This prevents "Varies" from showing)
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

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    console.log("🔄 Manual refresh requested");
    setLastItineraryHash(""); // Force re-geocoding
    setGeocodeCache({}); // Clear cache
  }, []);

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

      {/* ✅ Hotel Name Display */}
      {recommendedHotelName && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-sky-600 dark:text-sky-400 text-sm">🏨</span>
            <span className="text-sky-900 dark:text-sky-300 text-sm font-medium">
              Your hotel: {recommendedHotelName}
            </span>
          </div>
        </div>
      )}

      {/* ✅ Flight Details Display */}
      {flightDetails && (flightDetails.outbound || flightDetails.return) ? (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
          <div className="space-y-2">
            {flightDetails.outbound && (
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 text-sm">
                  ✈️
                </span>
                <span className="text-indigo-900 dark:text-indigo-300 text-sm">
                  <span className="font-medium">Outbound:</span>{" "}
                  {flightDetails.outbound.airline ||
                    flightDetails.outbound.carrier}
                  {flightDetails.outbound.flightNumber &&
                    ` (${flightDetails.outbound.flightNumber})`}
                  {flightDetails.outbound.departure &&
                    flightDetails.outbound.arrival &&
                    ` ${flightDetails.outbound.departure} → ${flightDetails.outbound.arrival}`}
                </span>
              </div>
            )}
            {flightDetails.return && (
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 text-sm">
                  🛬
                </span>
                <span className="text-indigo-900 dark:text-indigo-300 text-sm">
                  <span className="font-medium">Return:</span>{" "}
                  {flightDetails.return.airline || flightDetails.return.carrier}
                  {flightDetails.return.flightNumber &&
                    ` (${flightDetails.return.flightNumber})`}
                  {flightDetails.return.departure &&
                    flightDetails.return.arrival &&
                    ` ${flightDetails.return.departure} → ${flightDetails.return.arrival}`}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ✅ Show helpful message for trips with "Include Flights" but no flight data (inactive airports) */
        trip?.flightPreferences?.includeFlights &&
        isInactiveAirport && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400 text-sm mt-0.5">
                ℹ️
              </span>
              <div className="flex-1 text-sm text-orange-900 dark:text-orange-300">
                <span className="font-medium">{isInactiveAirport.name}</span>{" "}
                has no commercial airport. Fly to{" "}
                {isInactiveAirport.alternatives.join(" or ")}, then travel by
                bus (3-4 hours).
                <span className="block mt-1 text-xs text-orange-700 dark:text-orange-400">
                  💡 Check the{" "}
                  <span className="font-semibold">Flights tab</span> for booking
                  alternatives.
                </span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Map Container */}
      <Card ref={mapContainerRef} className="overflow-hidden">
        <APIProvider
          apiKey={apiKey}
          libraries={["places", "geometry", "routes"]}
        >
          <div className="relative w-full h-[600px]">
            {/* Updating Indicator */}
            {isUpdating && !isGeocoding && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-sky-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Updating map...</span>
              </div>
            )}

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
          {/* Header with Filter and Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <MapPin className="h-5 w-5 text-sky-600 dark:text-sky-500" />
              <h4 className="font-bold text-gray-900 dark:text-gray-100">
                Location Sequence
              </h4>
              <Badge variant="secondary" className="ml-1">
                {filteredLocations.length}{" "}
                {filteredLocations.length === 1 ? "stop" : "stops"}
              </Badge>
              {isUpdating && (
                <Badge
                  variant="outline"
                  className="ml-2 gap-1.5 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700"
                >
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Updating
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Manual Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isGeocoding}
                className="gap-2 h-9 text-sm"
                title="Refresh map locations"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isGeocoding ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              {/* Day Filter Dropdown */}
              <DayFilterDropdown
                selectedDay={selectedDay}
                uniqueDays={uniqueDays}
                onDayChange={setSelectedDay}
                getDayTheme={getDayTheme}
              />
            </div>
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
