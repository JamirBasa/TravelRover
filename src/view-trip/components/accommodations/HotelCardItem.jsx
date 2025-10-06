import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";

function HotelCardItem({ hotel, onBookHotel }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug hotel data structure
  useEffect(() => {
    console.log("🏨 HotelCardItem received hotel data:", {
      hotelObject: hotel,
      name: hotel?.name,
      hotelName: hotel?.hotelName,
      title: hotel?.title,
      hasBookingFunction: typeof onBookHotel === "function",
    });
  }, [hotel, onBookHotel]);

  useEffect(() => {
    // Check for hotel name from your API structure (hotelName field)
    const hotelName = hotel?.hotelName || hotel?.name;
    if (hotelName) {
      GetPlacePhoto();
    }
  }, [hotel?.hotelName, hotel?.name]); // Check both possible fields

  const GetPlacePhoto = async () => {
    // Get hotel name from your API structure
    const hotelName = hotel?.hotelName || hotel?.name;
    if (!hotelName) {
      console.warn("🏨 No hotel name provided for photo search");
      return;
    }

    console.log(
      "🏨 HotelCardItem - Fetching Google Places photo for:",
      hotelName
    );

    // Always use Google Places API for accurate, real photos
    // Skip the existing imageUrl and get actual place photos
    setIsLoading(true);
    setError(null);

    try {
      // ✅ Add random delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

      // Create search query with location context (like PlaceCardItem)
      let searchQuery = hotelName;

      // Add Manila, Philippines context for better location accuracy if not already included
      if (
        !searchQuery.toLowerCase().includes("manila") &&
        !searchQuery.toLowerCase().includes("philippines")
      ) {
        searchQuery += ", Manila, Philippines";
      }

      console.log("🏨 HotelCardItem - Search query:", searchQuery);

      const data = {
        textQuery: searchQuery,
      };

      const response = await GetPlaceDetails(data);

      if (!response.data.places || response.data.places.length === 0) {
        throw new Error("No hotels found for this search");
      }

      const hotelData = response.data.places[0];

      if (!hotelData.photos || hotelData.photos.length === 0) {
        console.warn("🏨 No photos available for this hotel");
        setPhotoUrl(""); // Use placeholder
        return;
      }

      const photoReference = hotelData.photos[0]?.name;

      if (photoReference) {
        const photoUrl = PHOTO_REF_URL.replace("{NAME}", photoReference);
        console.log("🏨 HotelCardItem - Google Places photo URL:", photoUrl);
        setPhotoUrl(photoUrl);
      } else {
        console.warn("🏨 HotelCardItem - No photo reference found");
        setPhotoUrl(""); // Will use placeholder
      }
    } catch (error) {
      console.error("🏨 HotelCardItem - Error fetching hotel photo:", error);
      console.log(
        "🏨 HotelCardItem - Falling back to existing imageUrl:",
        hotel?.imageUrl
      );

      // Fallback to existing image from hotel data only if Google Places fails
      if (hotel?.imageUrl) {
        setPhotoUrl(hotel.imageUrl);
        setError(null); // Clear error since we have fallback
      } else {
        setError(error.message);
        setPhotoUrl(""); // Use placeholder
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Google Maps URL with proper place query for directions
  const generateMapsURL = () => {
    const hotelName = hotel?.name || hotel?.hotelName || "";
    const address = hotel?.address || "";

    // Create comprehensive search query including name and address for better accuracy
    let searchQuery = hotelName;
    if (address) {
      searchQuery += ` ${address}`;
    }

    // Use Google Maps search with place query for better results and directions option
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      searchQuery
    )}&query_place_id=${encodeURIComponent(hotelName)}`;
  };

  return (
    <Link to={generateMapsURL()} target="_blank" className="block group">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-all duration-300 group-hover:border-purple-200 group-hover:shadow-purple-100/50 relative overflow-hidden">
        {/* Subtle gradient overlay on hover */}
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
                    console.log(
                      "Hotel image failed to load, trying fallbacks..."
                    );

                    // Try different placeholder paths
                    if (e.target.src.includes("placeholder.png")) {
                      e.target.src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";
                    } else {
                      e.target.src = "/placeholder.png";
                    }
                  }}
                  onLoad={() => {
                    if (photoUrl) {
                      console.log(
                        "✅ Hotel image loaded successfully:",
                        photoUrl
                      );
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

              <div className="flex items-center gap-2">
                {onBookHotel && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      console.log("🔘 Book Now clicked for hotel:", {
                        hotelName: hotel?.name || hotel?.hotelName,
                        hotelObject: hotel,
                      });

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
