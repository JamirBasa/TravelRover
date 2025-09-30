import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";

function PlaceCardItem({ place }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for both possible property names
    const placeName = place?.placeName || place?.activity;
    if (placeName) {
      GetPlacePhoto();
    }
  }, [place?.placeName, place?.activity]);

  const GetPlacePhoto = async () => {
    const placeName = place?.placeName || place?.activity;
    if (!placeName) {
      console.warn("No place name provided for photo search");
      return;
    }

    console.log(
      "🔍 PlaceCardItem - Fetching Google Places photo for:",
      placeName
    );

    // Always use Google Places API for accurate, real photos
    // Skip the AI-generated imageUrl and get actual place photos
    setIsLoading(true);
    setError(null);

    try {
      // Create more specific search query by adding location context
      let searchQuery = placeName;

      // Add Manila, Philippines context for better location accuracy
      if (
        !searchQuery.toLowerCase().includes("manila") &&
        !searchQuery.toLowerCase().includes("philippines")
      ) {
        searchQuery += ", Manila, Philippines";
      }

      console.log("🔍 PlaceCardItem - Search query:", searchQuery);

      const data = {
        textQuery: searchQuery,
      };

      const response = await GetPlaceDetails(data);

      if (!response.data.places || response.data.places.length === 0) {
        throw new Error("No places found for this activity");
      }

      const placeData = response.data.places[0];

      if (!placeData.photos || placeData.photos.length === 0) {
        console.warn("No photos available for this activity");
        setPhotoUrl(""); // Use placeholder
        return;
      }

      const photoReference = placeData.photos[0]?.name;

      if (photoReference) {
        const photoUrl = PHOTO_REF_URL.replace("{NAME}", photoReference);
        console.log("🔍 PlaceCardItem - Google Places photo URL:", photoUrl);
        setPhotoUrl(photoUrl);
      } else {
        console.warn("🔍 PlaceCardItem - No photo reference found");
        setPhotoUrl(""); // Will use placeholder
      }
    } catch (error) {
      console.error("🔍 PlaceCardItem - Error fetching place photo:", error);
      console.log(
        "🔍 PlaceCardItem - Falling back to AI imageUrl:",
        place?.imageUrl
      );

      // Fallback to AI-generated image only if Google Places fails
      if (place?.imageUrl) {
        setPhotoUrl(place.imageUrl);
        setError(null); // Clear error since we have fallback
      } else {
        setError(error.message);
        setPhotoUrl(""); // Use placeholder
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get the correct property names from the data
  const placeName = place?.placeName || place?.activity || "Unknown Place";
  const placeDetails = place?.placeDetails || place?.description || "";
  // Generate Google Maps URL with proper place query for directions
  const generateMapsURL = () => {
    const coordinates = place?.geoCoordinates;
    const address = place?.address || place?.location || "";

    // Prioritize coordinates for most accurate directions
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${
        coordinates.latitude
      },${coordinates.longitude}&destination_place_id=${encodeURIComponent(
        placeName
      )}`;
    }

    // Fallback to comprehensive search query including name and address
    let searchQuery = placeName;
    if (address) {
      searchQuery += ` ${address}`;
    }

    // Use Google Maps search with place query for better results and directions option
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      searchQuery
    )}&query_place_id=${encodeURIComponent(placeName)}`;
  };

  return (
    <Link to={generateMapsURL()} target="_blank" className="block group">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-blue-200/20 relative overflow-hidden">
        {/* Enhanced gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-indigo-50/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:via-indigo-50/20 group-hover:to-purple-50/10 transition-all duration-300 pointer-events-none"></div>

        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/0 to-indigo-200/0 group-hover:from-blue-100/20 group-hover:to-indigo-200/30 rounded-bl-3xl transition-all duration-500"></div>

        <div className="relative">
          <div className="flex gap-4">
            {/* Place Image */}
            <div className="flex-shrink-0">
              {isLoading ? (
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-150 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600"></div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-lg group-hover:shadow-sm transition-shadow duration-300">
                  <img
                    src={photoUrl || "/placeholder.png"}
                    className="w-20 h-20 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={placeName}
                    onError={(e) => {
                      e.target.src = "/placeholder.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              )}

              {error && (
                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                  <span className="text-gray-400 text-2xl">📍</span>
                </div>
              )}
            </div>

            {/* Place Details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-600 line-clamp-2 leading-tight transition-colors duration-300 flex-1">
                    {placeName}
                  </h3>
                  <div className="ml-2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300 flex-shrink-0">
                    <span className="text-blue-600 text-xs">📍</span>
                  </div>
                </div>
                {placeDetails && (
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-1">
                    {placeDetails}
                  </p>
                )}

                {/* Location type indicator */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                    <span>🎯</span>
                    <span>Tourist Attraction</span>
                  </span>
                  {place?.category && (
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                      <span>📂</span>
                      <span>{place.category}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Badges Container */}
              <div className="flex flex-wrap gap-2">
                {place?.ticketPricing && (
                  <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    <span className="text-green-600">💰</span>
                    <span>{place.ticketPricing}</span>
                  </div>
                )}

                {place?.timeTravel && (
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                    <span className="text-blue-600">⏰</span>
                    <span>{place.timeTravel}</span>
                  </div>
                )}

                {place?.rating && (
                  <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                    <span className="text-yellow-600">⭐</span>
                    <span>{place.rating}/5</span>
                  </div>
                )}
              </div>

              {/* Enhanced Action indicator */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-blue-500">🌐</span>
                  <span>Interactive map view</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-semibold text-xs group-hover:text-blue-700 transition-all duration-200">
                  <span>Open Maps</span>
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                    <span className="text-blue-600 text-xs transform group-hover:translate-x-0.5 transition-transform duration-200">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PlaceCardItem;
