import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";

function HotelCardItem({ hotel }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hotel?.name) {
      GetPlacePhoto();
    }
  }, [hotel?.name]); // ✅ More specific dependency

  const GetPlacePhoto = async () => {
    if (!hotel?.name) {
      console.warn("No hotel name provided for photo search");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ✅ Add random delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

      const data = {
        textQuery: hotel.name,
      };

      console.log("Searching for hotel photos:", data.textQuery);

      const response = await GetPlaceDetails(data);

      // ✅ Better error checking
      if (!response.data.places || response.data.places.length === 0) {
        throw new Error("No places found for this hotel");
      }

      const place = response.data.places[0];

      if (!place.photos || place.photos.length === 0) {
        console.warn("No photos available for this hotel");
        setPhotoUrl(""); // Use placeholder
        return;
      }

      // ✅ Safer photo access
      const photoReference = place.photos[0]?.name;

      if (photoReference) {
        const photoUrl = PHOTO_REF_URL.replace("{NAME}", photoReference);
        setPhotoUrl(photoUrl);
        console.log("Hotel photo URL generated:", photoUrl);
      }
    } catch (error) {
      console.error("Error fetching hotel photo:", error);

      // ✅ Handle rate limiting
      if (error.response?.status === 429) {
        console.warn("Rate limited, will retry...");
        setTimeout(() => GetPlacePhoto(), 2000 + Math.random() * 1000);
        return;
      }

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
        encodeURIComponent(hotel?.name || "")
      }
      target="_blank"
      className="block group"
    >
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group-hover:border-gray-300">
        {/* Hotel Image */}
        <div className="relative mb-3">
          {isLoading ? (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="mt-1 text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          ) : (
            <img
              src={photoUrl || "../placeholder.png"}
              alt={hotel?.name || "Hotel"}
              className="w-full h-32 object-cover rounded-lg"
              onError={(e) => {
                console.log("Hotel image failed to load, using placeholder");
                e.target.src = "../placeholder.png";
              }}
            />
          )}

          {error && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-lg">🏨</p>
                <p className="text-xs text-gray-400">Photo unavailable</p>
              </div>
            </div>
          )}
        </div>

        {/* Hotel Info */}
        <div className="space-y-1">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600">
            {hotel?.name}
          </h4>

          {hotel?.address && (
            <p className="text-xs text-gray-500 line-clamp-2">
              📍 {hotel.address}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            {hotel?.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-xs">⭐</span>
                <span className="text-xs font-medium text-gray-700">
                  {hotel.rating}
                </span>
              </div>
            )}

            {(hotel?.pricePerNight || hotel?.priceRange) && (
              <p className="text-xs font-medium text-green-700">
                {hotel?.pricePerNight || hotel?.priceRange}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default HotelCardItem;
