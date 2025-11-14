import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, fetchPlacePhoto } from "@/config/GlobalApi";

// ✅ Import production logging
import { logDebug, logError } from "@/utils/productionLogger";

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
        logDebug("HotelCardItem", "No hotel name provided for photo search");
        return;
      }

      logDebug("HotelCardItem", "Fetching photo for hotel", { hotelName });

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

        logDebug("HotelCardItem", "Search query constructed", { searchQuery });

        const data = { textQuery: searchQuery };
        const response = await GetPlaceDetails(data);

        // Check if component is still mounted
        if (!isMounted) return;

        if (!response.data?.places || response.data.places.length === 0) {
          throw new Error("No hotels found for this search");
        }

        const hotelData = response.data.places[0];

        if (!hotelData.photos || hotelData.photos.length === 0) {
          logDebug("HotelCardItem", "No photos available for this hotel");
          setPhotoUrl("");
          return;
        }

        const photoReference = hotelData.photos[0]?.name;

        if (photoReference) {
          // ✅ Optimized: fetchPlacePhoto has built-in 20s timeout
          // ✅ With SSL disabled in dev, photos load in 1-2 seconds
          try {
            const fetchWithRetry = async (ref, maxRetries = 2) => {
              for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                  logDebug(
                    "HotelCardItem",
                    `Fetch attempt ${attempt}/${maxRetries}`
                  );
                  // ✅ No Promise.race needed - fetchPlacePhoto has built-in timeout
                  const blobUrl = await fetchPlacePhoto(ref);
                  return blobUrl;
                } catch (err) {
                  if (attempt === maxRetries) throw err;
                  logDebug(
                    "HotelCardItem",
                    `Attempt ${attempt} failed, retrying`,
                    {
                      error: err?.message || err?.toString() || "Unknown error",
                      errorType: typeof err,
                    }
                  );
                  // ✅ Reduced retry delay from 1s to 500ms (faster with SSL disabled)
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              }
            };

            const blobUrl = await fetchWithRetry(photoReference);

            if (!isMounted) {
              // Component unmounted, cleanup immediately
              URL.revokeObjectURL(blobUrl);
              return;
            }

            currentPhotoUrl = blobUrl;
            setPhotoUrl(blobUrl);
            logDebug("HotelCardItem", "Hotel photo loaded successfully");
          } catch (photoError) {
            logDebug("HotelCardItem", "All hotel photo fetch attempts failed", {
              error: photoError?.message || photoError?.toString() || "Unknown error",
              fallbackAvailable: !!hotel?.imageUrl,
              errorType: typeof photoError,
            });
            setPhotoUrl(hotel?.imageUrl || "");
          }
        } else {
          logDebug("HotelCardItem", "No photo reference found");
          setPhotoUrl(hotel?.imageUrl || "");
        }
      } catch (error) {
        logError("HotelCardItem", "Error fetching hotel photo", {
          error: error?.message || error?.toString() || "Unknown error",
          hasFallback: !!hotel?.imageUrl,
          errorType: typeof error,
          errorDetails: error,
        });

        if (!isMounted) return;

        // Fallback to existing imageUrl
        if (hotel?.imageUrl) {
          setPhotoUrl(hotel.imageUrl);
          setError(null);
        } else {
          setError(error?.message || "Failed to load photo");
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
      if (currentPhotoUrl && currentPhotoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentPhotoUrl);
        logDebug("HotelCardItem", "Cleaned up blob URL", {
          hotelName: hotel?.name,
        });
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
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 sm:p-5 hover:shadow-md dark:hover:shadow-sky-500/10 transition-all duration-300 group-hover:border-sky-300 dark:group-hover:border-sky-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-blue-50/0 dark:from-sky-950/0 dark:to-blue-950/0 group-hover:from-sky-50/30 group-hover:to-blue-50/20 dark:group-hover:from-sky-950/30 dark:group-hover:to-blue-950/20 transition-all duration-300 pointer-events-none"></div>

        <div className="relative">
          {/* Hotel Image */}
          <div className="relative mb-4">
            {isLoading ? (
              <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-150 dark:from-slate-800 dark:to-slate-750 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="inline-block rounded-full h-6 w-6 border-2 border-sky-300 dark:border-sky-700 border-t-sky-600 dark:border-t-sky-400"
                    style={{ animation: 'spin 1s linear infinite' }}
                  ></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
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
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-750 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-600">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🏨</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Photo unavailable
                  </p>
                </div>
              </div>
            )}

            {/* Rating Badge */}
            {hotel?.rating && (
              <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-sm">⭐</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {hotel.rating}
                    </span>
                  </div>
                  {/* Show review count if > 0 */}
                  {((hotel?.user_ratings_total || 0) > 0 || (hotel?.reviews_count || 0) > 0) && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(
                        hotel.user_ratings_total || hotel.reviews_count || 0
                      ).toLocaleString()}{" "}
                      reviews
                    </span>
                  )}
                  {/* Show AI-Generated Warning if 0 reviews but has rating */}
                  {((hotel?.user_ratings_total || 0) === 0 && (hotel?.reviews_count || 0) === 0) && hotel?.rating && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5 mt-0.5">
                      <span>⚠️</span>
                      <span>AI Estimate</span>
                    </span>
                  )}
                  {/* Google Places Data Badge - Only show if REAL reviews exist */}
                  {hotel?.dataSource === "google_places_api" && ((hotel?.user_ratings_total || 0) > 0 || (hotel?.reviews_count || 0) > 0) && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5 mt-0.5">
                      <span>✓</span>
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hotel Info */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-200 leading-tight">
                {hotel?.name || hotel?.hotelName}
              </h4>

              {hotel?.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1 flex items-start gap-1">
                  <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                    📍
                  </span>
                  <span>{hotel.address}</span>
                </p>
              )}
            </div>

            {/* Amenities Section - Enhanced Display */}
            {hotel?.amenities && hotel.amenities.length > 0 && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700">
                <div className="flex items-start gap-2">
                  <span className="text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5">
                    ✨
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Amenities
                      </h5>
                      {/* Data Source Badge */}
                      {hotel?.dataSource === "google_places_api" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                          <span className="text-xs">✓</span>
                          <span>Real Data</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(hotel.amenities)
                        ? hotel.amenities
                        : hotel.amenities.split(", ")
                      )
                        .slice(0, 6)
                        .map((amenity, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600"
                          >
                            {amenity}
                          </span>
                        ))}
                      {(Array.isArray(hotel.amenities)
                        ? hotel.amenities.length
                        : hotel.amenities.split(", ").length) > 6 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-sky-600 dark:text-sky-400">
                          +
                          {(Array.isArray(hotel.amenities)
                            ? hotel.amenities.length
                            : hotel.amenities.split(", ").length) - 6}{" "}
                          more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description - Show only if no amenities */}
            {!hotel?.amenities && hotel?.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="line-clamp-2">{hotel.description}</p>
              </div>
            )}

            {/* Fallback message */}
            {!hotel?.amenities && !hotel?.description && (
              <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                Contact hotel for amenity details
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
              {/* Left side - Price and View Map */}
              <div className="flex items-center gap-3">
                {/* Show prices for both real and AI-generated hotels */}
                {(hotel?.pricePerNight ||
                  hotel?.priceRange ||
                  hotel?.price_range) && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 dark:text-green-500 font-semibold text-base">
                      {hotel?.pricePerNight ||
                        hotel?.priceRange ||
                        hotel?.price_range}
                    </span>
                    {hotel?.pricePerNight && (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        /night
                      </span>
                    )}
                  </div>
                )}
                {/* Show check prices message if no price data */}
                {!hotel?.pricePerNight &&
                  !hotel?.priceRange &&
                  !hotel?.price_range && (
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                      <span>💡</span>
                      <span className="italic">
                        Check booking sites for current prices
                      </span>
                    </div>
                  )}

                <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium text-sm group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors duration-200">
                  <span>View on Map</span>
                  <span className="transform group-hover:translate-x-0.5 transition-transform duration-200">
                    →
                  </span>
                </div>
              </div>

              {/* Right side - Book Now button */}
              <div className="flex items-center gap-2">
                {/* Always show Book Now when onBookHotel is provided (hotel search enabled) */}
                {onBookHotel && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onBookHotel(hotel);
                    }}
                    className="bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <span>Book Now</span>
                    <span className="text-sm">🎫</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default HotelCardItem;
