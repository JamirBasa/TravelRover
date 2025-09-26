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
  const coordinates = place?.geoCoordinates;
  const location = coordinates
    ? `${coordinates.latitude},${coordinates.longitude}`
    : placeName;

  return (
    <Link
      to={
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(placeName)
      }
      target="_blank"
      className="block group"
    >
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group-hover:border-gray-300">
        <div className="flex gap-4">
          {/* Place Image */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <img
                src={photoUrl || "/placeholder.png"}
                className="w-20 h-20 rounded-lg object-cover"
                alt={placeName}
                onError={(e) => {
                  e.target.src = "/placeholder.png";
                }}
              />
            )}

            {error && (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-lg">📍</span>
              </div>
            )}
          </div>

          {/* Place Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 line-clamp-2">
              {placeName}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-3 mb-2">
              {placeDetails}
            </p>

            {/* Additional Info */}
            <div className="space-y-1">
              {place?.ticketPricing && (
                <p className="text-xs text-green-600 font-medium">
                  💰 {place.ticketPricing}
                </p>
              )}
              {place?.timeTravel && (
                <p className="text-xs text-blue-600">⏰ {place.timeTravel}</p>
              )}
              {place?.rating && (
                <p className="text-xs text-yellow-600">⭐ {place.rating}/5</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PlaceCardItem;
