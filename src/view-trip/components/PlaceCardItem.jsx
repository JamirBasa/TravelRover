import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";

function PlaceCardItem({ place }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (place?.activity) {
      GetPlacePhoto();
    }
  }, [place?.activity]);

  const GetPlacePhoto = async () => {
    if (!place?.activity) {
      console.warn("No activity provided for photo search");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = {
        textQuery: place.activity,
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
        setPhotoUrl(photoUrl);
      }
    } catch (error) {
      console.error("Error fetching place photo:", error);
      setError(error.message);
      setPhotoUrl(""); // Fallback to placeholder
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      to={
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(place?.location || place?.activity)
      }
      target="_blank"
      className="block group"
    >
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group-hover:border-gray-300">
        <div className="flex gap-4">
          {/* Activity Image */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <img
                src={photoUrl || "/placeholder.png"}
                className="w-20 h-20 rounded-lg object-cover"
                alt={place?.activity}
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

          {/* Activity Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 line-clamp-2">
              {place?.activity}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-3 mb-2">
              {place?.description}
            </p>
            {place?.location && (
              <p className="text-xs text-gray-500">📍 {place.location}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PlaceCardItem;
