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
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group-hover:border-purple-200 group-hover:shadow-purple-100/50 relative overflow-hidden">
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 to-purple-100/0 group-hover:from-purple-50/30 group-hover:to-purple-100/20 transition-all duration-300 pointer-events-none"></div>

        <div className="relative">
          {/* Hotel Image */}
          <div className="relative mb-4">
            {isLoading ? (
              <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-150 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-purple-300 border-t-purple-600"></div>
                  <p className="mt-2 text-sm text-gray-500 font-medium">
                    Loading hotel...
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl group-hover:shadow-lg transition-shadow duration-300">
                <img
                  src={photoUrl || "../placeholder.png"}
                  alt={hotel?.name || "Hotel"}
                  className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    console.log(
                      "Hotel image failed to load, using placeholder"
                    );
                    e.target.src = "../placeholder.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🏨</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    Photo unavailable
                  </p>
                </div>
              </div>
            )}

            {/* Rating Badge */}
            {hotel?.rating && (
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-sm">⭐</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {hotel.rating}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Hotel Info */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 text-base line-clamp-2 group-hover:text-purple-600 transition-colors duration-200 leading-tight">
                {hotel?.name || hotel?.hotelName}
              </h4>

              {hotel?.address && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1 flex items-start gap-1">
                  <span className="text-gray-400 flex-shrink-0 mt-0.5">📍</span>
                  <span>{hotel.address}</span>
                </p>
              )}
            </div>

            {/* Amenities or Description */}
            {(hotel?.amenities || hotel?.description) && (
              <div className="text-sm text-gray-600">
                {hotel?.amenities && (
                  <p className="line-clamp-2">
                    <span className="text-gray-500">Amenities:</span>{" "}
                    {Array.isArray(hotel.amenities)
                      ? hotel.amenities.join(", ")
                      : hotel.amenities}
                  </p>
                )}
                {hotel?.description && !hotel?.amenities && (
                  <p className="line-clamp-2">{hotel.description}</p>
                )}
              </div>
            )}

            {/* Price and Action */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                {(hotel?.pricePerNight || hotel?.priceRange) && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-semibold text-base">
                      {hotel?.pricePerNight || hotel?.priceRange}
                    </span>
                    {hotel?.pricePerNight && (
                      <span className="text-gray-500 text-sm">/night</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-purple-600 font-medium text-sm group-hover:text-purple-700 transition-colors duration-200">
                <span>View on Map</span>
                <span className="transform group-hover:translate-x-0.5 transition-transform duration-200">
                  →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default HotelCardItem;
