import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, fetchPlacePhoto } from "@/config/GlobalApi";

function HotelCardItem({ hotel, onBookHotel }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let currentPhotoUrl = null;
    let isMounted = true; // Track mount status

    const GetPlacePhoto = async () => {
      const hotelName = hotel?.hotelName || hotel?.name;
      if (!hotelName) {
        console.warn("🏨 No hotel name provided for photo search");
        return;
      }

      console.log("🏨 HotelCardItem - Fetching photo for:", hotelName);

      setIsLoading(true);
      setError(null);

      try {
        // Random delay to prevent rate limiting
        await new Promise((resolve) => 
          setTimeout(resolve, Math.random() * 1000)
        );

        // Create search query with location context
        let searchQuery = hotelName;
        if (
          !searchQuery.toLowerCase().includes("manila") &&
          !searchQuery.toLowerCase().includes("philippines")
        ) {
          searchQuery += ", Manila, Philippines";
        }

        console.log("🏨 Search query:", searchQuery);

        const data = { textQuery: searchQuery };
        const response = await GetPlaceDetails(data);

        // Check if component is still mounted
        if (!isMounted) return;

        if (!response.data?.places || response.data.places.length === 0) {
          throw new Error("No hotels found for this search");
        }

        const hotelData = response.data.places[0];

        if (!hotelData.photos || hotelData.photos.length === 0) {
          console.warn("🏨 No photos available for this hotel");
          setPhotoUrl("");
          return;
        }

        const photoReference = hotelData.photos[0]?.name;

        if (photoReference) {
          // ✅ SECURE: Use fetchPlacePhoto with header authentication
          try {
            const blobUrl = await fetchPlacePhoto(photoReference);
            
            if (!isMounted) {
              // Component unmounted, cleanup immediately
              URL.revokeObjectURL(blobUrl);
              return;
            }

            currentPhotoUrl = blobUrl;
            setPhotoUrl(blobUrl);
            console.log("✅ Secure hotel photo loaded");
          } catch (photoError) {
            console.warn("🏨 Failed to fetch secure photo:", photoError.message);
            setPhotoUrl("");
          }
        } else {
          console.warn("🏨 No photo reference found");
          setPhotoUrl("");
        }
      } catch (error) {
        console.error("🏨 Error fetching hotel photo:", error);

        if (!isMounted) return;

        // Fallback to existing imageUrl
        if (hotel?.imageUrl) {
          setPhotoUrl(hotel.imageUrl);
          setError(null);
        } else {
          setError(error.message);
          setPhotoUrl("");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const hotelName = hotel?.hotelName || hotel?.name;
    if (hotelName) {
      GetPlacePhoto();
    }

    // ✅ Cleanup: Revoke blob URL to prevent memory leak
    return () => {
      isMounted = false;
      if (currentPhotoUrl && currentPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentPhotoUrl);
        console.log("🗑️ Cleaned up blob URL for:", hotel?.name);
      }
    };
  }, [hotel?.hotelName, hotel?.name, hotel?.imageUrl]);

  const generateMapsURL = () => {
    const hotelName = hotel?.name || hotel?.hotelName || "";
    const address = hotel?.address || "";

    let searchQuery = hotelName;
    if (address) {
      searchQuery += ` ${address}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      searchQuery
    )}`;
  };

  return (
    <Link to={generateMapsURL()} target="_blank" className="block group">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-all duration-300 group-hover:border-purple-200 group-hover:shadow-purple-100/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 to-purple-100/0 group-hover:from-purple-50/30 group-hover:to-purple-100/20 transition-all duration-300 pointer-events-none"></div>

        <div className="relative">
          {/* Hotel Image */}
          <div className="relative mb-4">
            {isLoading ? (
              <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-150 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-purple-300 border-t-purple-600"></div>
                  <p className="mt-2 text-sm text-gray-500 font-medium">
                    Loading hotel...
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg group-hover:shadow-md transition-shadow duration-300">
                <img
                  src={photoUrl || "/placeholder.png"}
                  alt={hotel?.name || "Hotel"}
                  className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    if (e.target.src.includes("placeholder.png")) {
                      e.target.src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
                    } else {
                      e.target.src = "/placeholder.png";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
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

              <div className="flex items-center gap-2">
                {onBookHotel && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onBookHotel(hotel);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                  >
                    <span>Book Now</span>
                    <span className="text-xs">🔗</span>
                  </button>
                )}
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
      </div>
    </Link>
  );
}

export default HotelCardItem;
