import React, { useState, useMemo, useEffect } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import {
  FaMapMarkerAlt,
  FaHotel,
  FaUtensils,
  FaCamera,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import { Button } from "../../../components/ui/button";
import {
  parseDataArray,
  parseTripData,
  validateCoordinates,
  generateRandomCoordinates,
  extractActivityTime,
  extractActivityPlaceName,
  enhanceActivityCoordinates,
  areCoordinatesFake,
} from "../../../utils";
import { googlePlacesService } from "../../../services/GooglePlacesService";
import GoogleMapsErrorBoundary from "../../../components/common/GoogleMapsErrorBoundary";

// Helper function to determine activity type from text content
const determineActivityType = (placeName, description = "") => {
  const text = `${placeName} ${description}`.toLowerCase();

  // Restaurant keywords
  if (
    text.match(
      /(restaurant|cafe|coffee|food|eat|dine|meal|lunch|dinner|breakfast|bistro|bar|pub)/
    )
  ) {
    return "restaurant";
  }
  // Hotel keywords
  if (text.match(/(hotel|resort|accommodation|stay|lodge|inn|hostel)/)) {
    return "hotel";
  }
  // Shopping keywords
  if (text.match(/(shop|mall|market|store|boutique|shopping|buy|souvenir)/)) {
    return "shopping";
  }
  // Transportation keywords
  if (
    text.match(
      /(airport|station|transport|bus|train|taxi|car|flight|arrival|departure)/
    )
  ) {
    return "transport";
  }
  // Attraction keywords
  if (
    text.match(
      /(museum|temple|church|park|beach|monument|landmark|tourist|attraction|visit|tour|sightseeing)/
    )
  ) {
    return "attraction";
  }

  return "activity"; // Default for general activities
};

// Helper function to get activity icon based on category
const getActivityIcon = (category) => {
  const iconMap = {
    restaurant: "🍽️",
    hotel: "🏨",
    attraction: "🎯",
    activity: "⭐",
    shopping: "🛍️",
    transport: "🚗",
    destination: "📍",
    default: "📍",
  };
  return iconMap[category] || iconMap.default;
};

const TripMap = ({ trip, selectedDay = null, onPlaceSelect }) => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [enhancedPlaces, setEnhancedPlaces] = useState([]);

  // Extract all places from trip data with real coordinate enhancement
  const mapData = useMemo(() => {
    if (!trip?.tripData) return { places: [], center: null };

    const places = [];
    const tripData = parseTripData(trip.tripData);
    const tripLocation = trip.userSelection?.location;

    // Add destination as main marker with real coordinates
    if (tripLocation) {
      places.push({
        id: "destination",
        name: tripLocation,
        type: "destination",
        coordinates: validateCoordinates({ lat: 10.3157, lng: 123.8854 }), // Will be enhanced below
        icon: "destination",
        needsRealCoordinates: true,
      });
    }

    // Extract places from itinerary using robust parsing
    if (tripData?.itinerary) {
      const parsedItinerary = parseDataArray(tripData.itinerary, "itinerary");

      // Now safely iterate over parsed itinerary
      if (Array.isArray(parsedItinerary)) {
        parsedItinerary.forEach((day, dayIndex) => {
          if (selectedDay && dayIndex + 1 !== selectedDay) return;

          // Handle multiple activity formats with enhanced location extraction
          let activities = [];

          // Priority 1: Use existing plan array if it has data
          if (day?.plan && Array.isArray(day.plan) && day.plan.length > 0) {
            activities = day.plan;
          }
          // Priority 2: Parse from planText if plan is empty
          else if (day?.planText && typeof day.planText === "string") {
            activities = day.planText.split(" | ").map((activity, actIndex) => {
              const timeMatch = activity.match(/^(\d{1,2}:\d{2} [AP]M)/);
              const time = timeMatch ? timeMatch[1] : "";
              const content = time
                ? activity.replace(time + " - ", "")
                : activity;

              return {
                time: time || "All Day",
                placeName:
                  content.split(" - ")[0] ||
                  content.split(",")[0] ||
                  "Activity",
                placeDetails: content,
                location:
                  content.split(" - ")[0] ||
                  content.split(",")[0] ||
                  "Activity",
                activity: content,
              };
            });
          }
          // Priority 3: Check for activities array
          else if (day?.activities && Array.isArray(day.activities)) {
            activities = day.activities;
          }
          // Priority 4: Extract from raw activity text
          else if (day?.activity && typeof day.activity === "string") {
            activities = [
              {
                placeName:
                  day.activity.split(" - ")[0] ||
                  day.activity.split(",")[0] ||
                  "Activity",
                placeDetails: day.activity,
                location:
                  day.activity.split(" - ")[0] ||
                  day.activity.split(",")[0] ||
                  "Activity",
                activity: day.activity,
                time: "All Day",
              },
            ];
          }

          // Enhanced location extraction - add ALL activities with locations to places array
          activities.forEach((activity, actIndex) => {
            // Use enhanced extraction utilities
            const extractedTime = extractActivityTime(activity);
            const cleanPlaceName = extractActivityPlaceName(activity);

            if (
              cleanPlaceName &&
              cleanPlaceName.trim() &&
              cleanPlaceName !== "Activity"
            ) {
              // Enhanced location detection - look for location patterns
              const locationText =
                activity.placeDetails ||
                activity.details ||
                activity.description ||
                cleanPlaceName;
              const activityType = determineActivityType(
                cleanPlaceName,
                locationText
              );

              // Extract more detailed information
              const rating =
                activity.rating || (Math.random() * 2 + 3).toFixed(1); // Random rating 3-5
              const ticketPricing =
                activity.ticketPricing || activity.price || "Free";

              // Determine if we need real coordinates
              const hasRealCoords = activity.geoCoordinates && !areCoordinatesFake(activity.geoCoordinates);
              const coords = hasRealCoords 
                ? validateCoordinates(activity.geoCoordinates)
                : generateRandomCoordinates({ lat: 10.3157, lng: 123.8854 }, 0.2);

              const newPlace = {
                id: `day-${dayIndex + 1}-activity-${actIndex}`,
                name: cleanPlaceName.trim(),
                description: locationText,
                day: dayIndex + 1,
                time: extractedTime,
                type: activityType,
                coordinates: coords,
                rating: rating,
                price: ticketPricing,
                imageUrl: activity.imageUrl || "",
                needsRealCoordinates: !hasRealCoords,
                originalActivity: activity, // Keep reference for real coordinate fetching
                icon: getActivityIcon(activityType),
              };

              places.push(newPlace);
              console.log(
                `🗺️ Added place for Day ${dayIndex + 1}:`,
                newPlace.name,
                `(${activityType})`
              );
            }
          });
        });
      }
    }

    // Extract places from placesToVisit (with enhanced data parsing)
    if (tripData?.placesToVisit) {
      // Parse placesToVisit data - it might be a string, array, or other format
      let parsedPlacesToVisit;

      if (Array.isArray(tripData.placesToVisit)) {
        parsedPlacesToVisit = tripData.placesToVisit;
      } else if (typeof tripData.placesToVisit === "string") {
        try {
          // Use the same robust parsing logic as PlacesToVisit component
          parsedPlacesToVisit = parseDataArray(
            tripData.placesToVisit,
            "placesToVisit"
          );
        } catch (error) {
          console.warn("Failed to parse placesToVisit string:", error);
          // Fallback: try to extract meaningful data from the string
          try {
            // Handle case where string might be malformed but still contains useful data
            const cleanString = tripData.placesToVisit
              .replace(/[\u0000-\u001f\u007f-\u009f]/g, "") // Remove control characters
              .replace(/,\s*}/g, "}") // Fix trailing commas
              .trim();

            if (cleanString.startsWith("[") || cleanString.startsWith("{")) {
              const parsed = JSON.parse(cleanString);
              parsedPlacesToVisit = Array.isArray(parsed) ? parsed : [parsed];
            } else {
              parsedPlacesToVisit = [];
            }
          } catch (fallbackError) {
            console.warn("Fallback parsing also failed:", fallbackError);
            parsedPlacesToVisit = [];
          }
        }
      } else {
        // Handle other formats or convert single object to array
        parsedPlacesToVisit = tripData.placesToVisit
          ? [tripData.placesToVisit]
          : [];
      }

      // Now safely iterate over parsed places
      if (Array.isArray(parsedPlacesToVisit)) {
        parsedPlacesToVisit.forEach((place, index) => {
          if (place && (place.placeName || place.name)) {
            places.push({
              id: `place-${index}`,
              name: place.placeName || place.name,
              description: place.placeDetails || place.description,
              type: "attraction",
              coordinates: place.geoCoordinates
                ? validateCoordinates(place.geoCoordinates)
                : generateRandomCoordinates(
                    { lat: 10.3157, lng: 123.8854 },
                    0.1
                  ),
              rating: place.rating,
              ticketPricing: place.ticketPricing,
              timeTravel: place.timeTravel,
              icon: "attraction",
            });
          }
        });
      }
    }

    // Add hotels if available
    if (trip?.hotelResults?.hotels?.length > 0) {
      trip.hotelResults.hotels.forEach((hotel, index) => {
        places.push({
          id: `hotel-${index}`,
          name: hotel.name,
          description: hotel.address,
          type: "hotel",
          coordinates: generateRandomCoordinates(
            { lat: 10.3157, lng: 123.8854 },
            0.05
          ),
          rating: hotel.rating,
          price: hotel.price_range,
          icon: "hotel",
        });
      });
    }

    // Calculate center point with coordinate validation
    const validCoords = places
      .filter((p) => p.coordinates)
      .map((p) => validateCoordinates(p.coordinates))
      .filter((coord) => coord.lat !== undefined && coord.lng !== undefined);

    const center =
      validCoords.length > 0
        ? validateCoordinates({
            lat:
              validCoords.reduce((sum, coord) => sum + coord.lat, 0) /
              validCoords.length,
            lng:
              validCoords.reduce((sum, coord) => sum + coord.lng, 0) /
              validCoords.length,
          })
        : validateCoordinates({ lat: 10.3157, lng: 123.8854 }); // Default to Philippines

    // Final validation - ensure all places have valid coordinates
    const validPlaces = places.filter((place) => {
      const validCoords = validateCoordinates(place.coordinates);
      if (
        validCoords.lat !== place.coordinates?.lat ||
        validCoords.lng !== place.coordinates?.lng
      ) {
        console.warn(
          `Invalid coordinates detected for place: ${place.name}`,
          place.coordinates,
          "Using:",
          validCoords
        );
        place.coordinates = validCoords;
      }
      return true; // Keep all places after validation
    });

    return { places: validPlaces, center };
  }, [trip, selectedDay]);

  // Effect to enhance places with real Google Places coordinates
  useEffect(() => {
    const enhanceCoordinates = async () => {
      if (!mapData.places.length) return;

      const tripLocation = trip?.userSelection?.location;
      if (!tripLocation) return;

      const placesToEnhance = mapData.places.filter(place => place.needsRealCoordinates);
      
      if (placesToEnhance.length === 0) {
        setEnhancedPlaces(mapData.places);
        return;
      }

      console.log(`🔍 Enhancing ${placesToEnhance.length} places with real coordinates...`);

      const enhancedPlacePromises = mapData.places.map(async (place) => {
        if (!place.needsRealCoordinates) {
          return place; // Already has real coordinates
        }

        try {
          const realCoords = await googlePlacesService.getPlaceCoordinates(
            place.name, 
            tripLocation
          );

          if (realCoords && realCoords.lat && realCoords.lng) {
            console.log(`✅ Real coordinates for ${place.name}:`, realCoords);
            return {
              ...place,
              coordinates: validateCoordinates({
                lat: realCoords.lat,
                lng: realCoords.lng
              }),
              needsRealCoordinates: false,
              coordinateSource: realCoords.source,
              place_id: realCoords.place_id
            };
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get real coordinates for ${place.name}:`, error);
        }

        return place; // Return original if enhancement failed
      });

      const enhanced = await Promise.all(enhancedPlacePromises);
      setEnhancedPlaces(enhanced);
    };

    enhanceCoordinates();
  }, [mapData, trip?.userSelection?.location]);

  const getMarkerColor = (type, day) => {
    const colors = {
      destination: "#0ea5e9", // brand-sky
      hotel: "#f59e0b", // amber
      restaurant: "#ef4444", // red
      attraction: "#10b981", // emerald
      shopping: "#8b5cf6", // violet
      activity: "#6b7280", // gray
    };
    return colors[type] || `hsl(${(day * 60) % 360}, 70%, 50%)`;
  };

  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
    onPlaceSelect?.(place);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Check for API key
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return (
      <div className="brand-card p-6 text-center">
        <FaMapMarkerAlt className="mx-auto text-4xl text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Map Not Available
        </h3>
        <p className="text-gray-500 mb-4">
          Google Maps API key required for interactive maps
        </p>
        <div className="text-xs text-gray-400">
          Add VITE_GOOGLE_PLACES_API_KEY to your .env file
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${
        isFullScreen
          ? "fixed inset-0 z-50 bg-white"
          : "h-96 rounded-xl overflow-hidden"
      }`}
    >
      {/* Google Maps UI-Safe Controls - Following Design Guidelines */}

      {/* Top-left: Map Info & Legend (Safe positioning) */}
      <div className="absolute top-4 left-4 z-10 max-w-xs">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-sky-200/50 travelrover-map-control">
          <div className="flex items-center gap-3 mb-2">
            <div className="brand-gradient p-2 rounded-full shadow-sm">
              <FaMapMarkerAlt className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">
                {trip.userSelection?.location}
              </h3>
              <p className="text-xs text-gray-600">
                {selectedDay ? `Day ${selectedDay}` : "All Days"} •{" "}
                {(enhancedPlaces.length > 0 ? enhancedPlaces : mapData.places).length} locations
                {enhancedPlaces.length > 0 && enhancedPlaces.some(p => !p.needsRealCoordinates) && (
                  <span className="ml-1 text-green-600 text-xs">📍</span>
                )}
              </p>
            </div>
          </div>

          {/* Day Filter Integration */}
          {mapData.places.some((p) => p.day) && (
            <select
              value={selectedDay || "all"}
              onChange={(e) => {
                const value =
                  e.target.value === "all" ? null : parseInt(e.target.value);
                // Day selection logic can be enhanced here
              }}
              className="w-full px-3 py-2 text-sm bg-white/80 border border-sky-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Filter by day"
            >
              <option value="all">All Days</option>
              {Array.from(
                new Set(mapData.places.map((p) => p.day).filter(Boolean))
              )
                .sort()
                .map((day) => (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Top-right: Action Controls (Positioned away from Google Maps controls) */}
      <div className="absolute top-4 right-20 z-10">
        {" "}
        {/* right-20 avoids Google's controls */}
        <div className="flex gap-2">
          <Button
            onClick={toggleFullScreen}
            variant="outline"
            size="sm"
            className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg border border-sky-200/50 travelrover-map-control min-h-[44px] min-w-[44px] hover:border-sky-300"
            aria-label={
              isFullScreen ? "Exit fullscreen view" : "Enter fullscreen view"
            }
          >
            {isFullScreen ? (
              <FaCompress className="w-4 h-4" />
            ) : (
              <FaExpand className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Map Header (Full Screen Only) */}
      {isFullScreen && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold brand-gradient-text">
              {trip.userSelection?.location} Trip Map
            </h2>
            <p className="text-gray-600">
              {selectedDay ? `Day ${selectedDay}` : "All Days"} •{" "}
              {mapData.places.length} locations
            </p>
          </div>
          <Button onClick={toggleFullScreen} variant="outline">
            Close Map
          </Button>
        </div>
      )}

      {/* Google Map */}
      <GoogleMapsErrorBoundary>
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={validateCoordinates(mapData.center)}
            defaultZoom={12}
            className={isFullScreen ? "h-[calc(100vh-80px)]" : "h-full"}
            mapId="travelrover-trip-map"
          >
          {/* Render Markers */}
          {(enhancedPlaces.length > 0 ? enhancedPlaces : mapData.places).map((place) => {
            const validPosition = validateCoordinates(place.coordinates);
            return (
              <Marker
                key={place.id}
                position={validPosition}
                onClick={() => handleMarkerClick(place)}
                title={place.name}
              />
            );
          })}            {/* Info Window */}
            {selectedPlace && (
              <InfoWindow
                position={validateCoordinates(selectedPlace.coordinates)}
                onCloseClick={() => setSelectedPlace(null)}
              >
                <div className="p-3 max-w-xs">
                  <div className="flex items-start gap-3">
                    <div className="brand-gradient p-2 rounded-full flex-shrink-0">
                      {selectedPlace.icon === "hotel" && (
                        <FaHotel className="w-4 h-4 text-white" />
                      )}
                      {selectedPlace.icon === "restaurant" && (
                        <FaUtensils className="w-4 h-4 text-white" />
                      )}
                      {selectedPlace.icon === "attraction" && (
                        <FaCamera className="w-4 h-4 text-white" />
                      )}
                      {!["hotel", "restaurant", "attraction"].includes(
                        selectedPlace.icon
                      ) && <FaMapMarkerAlt className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {selectedPlace.name}
                      </h4>
                      {selectedPlace.day && (
                        <p className="text-xs text-sky-600 font-medium mb-1">
                          Day {selectedPlace.day}{" "}
                          {selectedPlace.time && `• ${selectedPlace.time}`}
                        </p>
                      )}
                      {selectedPlace.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                          {selectedPlace.description}
                        </p>
                      )}
                      {selectedPlace.rating && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-yellow-500">
                            ★ {selectedPlace.rating}
                          </span>
                          {selectedPlace.price && (
                            <span className="text-green-600">
                              {selectedPlace.price}
                            </span>
                          )}
                        </div>
                      )}
                      {selectedPlace.ticketPricing && (
                        <div className="text-xs text-gray-600 mt-1">
                          💰 {selectedPlace.ticketPricing}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </GoogleMapsErrorBoundary>

      {/* Enhanced Map Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-gray-200/50 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">📍</span>
            </div>
            <h4 className="text-sm font-bold text-gray-800">Legend</h4>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 shadow-sm"></div>
              <span>Destinations</span>
              <span className="text-xs text-gray-500 ml-auto">
                {mapData.places.filter((p) => p.type === "destination").length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm"></div>
              <span>Attractions</span>
              <span className="text-xs text-gray-500 ml-auto">
                {mapData.places.filter((p) => p.type === "attraction").length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 shadow-sm"></div>
              <span>Hotels</span>
              <span className="text-xs text-gray-500 ml-auto">
                {mapData.places.filter((p) => p.type === "hotel").length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-pink-600 shadow-sm"></div>
              <span>Restaurants</span>
              <span className="text-xs text-gray-500 ml-auto">
                {mapData.places.filter((p) => p.type === "restaurant").length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 shadow-sm"></div>
              <span>Activities</span>
              <span className="text-xs text-gray-500 ml-auto">
                {
                  mapData.places.filter(
                    (p) =>
                      ![
                        "destination",
                        "attraction",
                        "hotel",
                        "restaurant",
                      ].includes(p.type)
                  ).length
                }
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Total Locations</span>
              <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-full">
                {mapData.places.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Place Count Badge */}
      {!isFullScreen && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
          <span className="text-sm font-medium text-gray-700">
            {mapData.places.length} locations
          </span>
        </div>
      )}
    </div>
  );
};

export { TripMap };
