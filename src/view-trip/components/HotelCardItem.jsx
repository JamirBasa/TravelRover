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
    <div>
      <Link
        to={
          "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(hotel?.name || "")
        }
        target="_blank"
      >
        <div className="border rounded-lg shadow p-3 hover:scale-105 transition-all cursor-pointer">
          {/* ✅ Better loading state */}
          {isLoading ? (
            <div className="w-full h-40 bg-gray-200 rounded animate-pulse flex items-center justify-center">
              <span className="text-gray-500 text-sm">Loading...</span>
            </div>
          ) : (
            <img
              src={photoUrl || "../placeholder.png"}
              alt={hotel?.name || "Hotel"}
              className="w-full h-40 object-cover rounded cursor-pointer"
              onError={(e) => {
                console.log("Hotel image failed to load, using placeholder");
                e.target.src = "../placeholder.png";
              }}
            />
          )}

          <h3 className="font-semibold mt-2">{hotel?.name}</h3>
          <p className="text-sm text-gray-600">{hotel?.address}</p>
          <p className="text-sm text-gray-800">
            {hotel?.pricePerNight || hotel?.priceRange}
          </p>
          <p className="text-yellow-500 text-sm">⭐ {hotel?.rating}</p>

          {/* ✅ Show error state */}
          {error && (
            <p className="text-red-500 text-xs mt-1">Failed to load photo</p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default HotelCardItem;
