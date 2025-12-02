import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, fetchPlacePhoto } from "@/config/GlobalApi";

// ✅ Import production logging
import { logDebug, logError } from "@/utils/productionLogger";

import { validateHotelBooking } from "../../../utils/hotelBookingDiagnostics";

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
              error:
                photoError?.message ||
                photoError?.toString() ||
                "Unknown error",
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
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:shadow-lg dark:hover:shadow-sky-500/20 transition-all duration-300 group-hover:border-sky-300 dark:group-hover:border-sky-600 relative overflow-hidden">
        <div className="flex gap-0 min-h-40 items-stretch">
          {/* Hotel Image - Left Sidebar (Full Height, No Gaps) */}
          <div className="w-32 sm:w-40 self-stretch flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800">
            {isLoading ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-sky-300 dark:border-sky-700 border-t-sky-600 dark:border-t-sky-400 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <img
                  src={photoUrl || "/placeholder.png"}
                  alt={hotel?.name || "Hotel"}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  onError={(e) => {
                    if (e.target.src.includes("placeholder.png")) {
                      e.target.src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300";
                    } else {
                      e.target.src = "/placeholder.png";
                    }
                  }}
                />
                {error && (
                  <div className="absolute inset-0 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-2xl opacity-50">🏨</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hotel Info - Right Content (Proper spacing structure) */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 min-w-0 gap-2">
            {/* Top Section: Name, Rating, Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 text-sm line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-200 leading-snug mb-0.5">
                  {hotel?.ai_hotel_name || hotel?.name || hotel?.hotelName}
                </h4>
                {hotel?.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                    📍 {hotel.address}
                  </p>
                )}
              </div>

              {/* Premium Rating Badge - Top Right */}
              {hotel?.rating && (
                <div className="flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col items-center whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-sm">⭐</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {hotel.rating.toFixed(1)}
                      </span>
                    </div>
                    {((hotel?.user_ratings_total || 0) > 0 ||
                      (hotel?.reviews_count || 0) > 0) && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                        {(
                          hotel.user_ratings_total ||
                          hotel.reviews_count ||
                          0
                        ).toLocaleString()}{" "}
                        <span className="text-xs">reviews</span>
                      </span>
                    )}
                    {(hotel?.user_ratings_total || 0) === 0 &&
                      (hotel?.reviews_count || 0) === 0 &&
                      hotel?.rating && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-tight mt-0.5">
                          AI
                        </span>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Middle Section: Badges + Amenities */}
            <div className="flex flex-col gap-2">
              {/* Badges Row - Enhanced with Quality Tier Status */}
              {(hotel?.badges?.isCheapest ||
                hotel?.badges?.isTopRated ||
                (hotel?.rating >= 4.5 &&
                  (hotel?.user_ratings_total || hotel?.reviews_count || 0) >=
                    50) ||
                hotel?.isDefaultHotel ||
                hotel?.verified !== undefined ||
                hotel?.qualityTier !== undefined) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* ✅ NEW: Quality Tier Badge - User-Friendly Design */}
                  {hotel?.qualityTier === 1 && (
                    <span
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-shadow cursor-help"
                      title="✓ Fully Verified Hotel - This hotel has been confirmed in our database and can be directly booked on Agoda with confidence."
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Verified</span>
                    </span>
                  )}
                  {hotel?.qualityTier === 2 && (
                    <span
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-sky-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-shadow cursor-help"
                      title={`✓ Trusted Match - ${
                        hotel.userExplanation ||
                        "This hotel has been verified and closely matches our database records."
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Trusted</span>
                    </span>
                  )}
                  {hotel?.qualityTier === 3 && (
                    <span
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-shadow cursor-help"
                      title={`~ Confirmed Hotel - ${
                        hotel.userExplanation ||
                        "This hotel has been matched with our database. We recommend verifying details on the booking site."
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Confirmed</span>
                    </span>
                  )}
                  {/* Fallback: Old verification badge for hotels without quality tier */}
                  {!hotel?.qualityTier &&
                    hotel?.verified === true &&
                    hotel?.hotel_id && (
                      <span
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-sky-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
                        title={`Verified Hotel (${
                          hotel.matchMethod || "Database Match"
                        }) - Can be directly booked on Agoda`}
                      >
                        <span>✓</span>
                        <span>Verified</span>
                      </span>
                    )}
                  {hotel?.verified === false && !hotel?.hotel_id && (
                    <span
                      className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
                      title="Unverified - Booking will search similar hotels on Agoda"
                    >
                      <span>⚠️</span>
                      <span>Search Only</span>
                    </span>
                  )}
                  {hotel?.verified === true &&
                    hotel?.matchScore &&
                    hotel.matchScore < 0.75 && (
                      <span
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
                        title={`Low match confidence (${(
                          hotel.matchScore * 100
                        ).toFixed(0)}%) - Please verify hotel details`}
                      >
                        <span>!</span>
                        <span>
                          {(hotel.matchScore * 100).toFixed(0)}% Match
                        </span>
                      </span>
                    )}

                  {hotel?.badges?.isCheapest && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                      <span>💰</span>
                      <span>Best Price</span>
                    </span>
                  )}
                  {(hotel?.badges?.isTopRated ||
                    (hotel?.rating >= 4.5 &&
                      (hotel?.user_ratings_total ||
                        hotel?.reviews_count ||
                        0) >= 50)) && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                      <span>⭐</span>
                      <span>Top Rated</span>
                    </span>
                  )}
                  {hotel?.isDefaultHotel && (
                    <span
                      className="inline-flex items-center gap-1.5 bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 px-2.5 py-1 rounded-md text-xs font-medium border border-sky-200 dark:border-sky-800 cursor-help"
                      title="This is your accommodation for this trip."
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Your Stay</span>
                    </span>
                  )}
                </div>
              )}

              {/* Amenities Row - Separate Line */}
              {hotel?.amenities && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(Array.isArray(hotel.amenities)
                    ? hotel.amenities
                    : typeof hotel.amenities === "string"
                    ? hotel.amenities.split(", ")
                    : []
                  )
                    .filter((a) => a && a.trim())
                    .slice(0, 3)
                    .map((amenity, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-medium"
                        title={amenity}
                      >
                        <span className="text-sky-600 dark:text-sky-400">
                          •
                        </span>
                        <span className="truncate max-w-[100px]">
                          {amenity}
                        </span>
                      </span>
                    ))}
                  {(Array.isArray(hotel.amenities)
                    ? hotel.amenities.length
                    : typeof hotel.amenities === "string"
                    ? hotel.amenities.split(", ").filter((a) => a && a.trim())
                        .length
                    : 0) > 3 && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-md bg-sky-100 dark:bg-sky-950 text-xs text-sky-700 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800"
                      title={`${
                        (Array.isArray(hotel.amenities)
                          ? hotel.amenities.length
                          : hotel.amenities
                              .split(", ")
                              .filter((a) => a && a.trim()).length) - 3
                      } more amenities`}
                    >
                      +
                      {(Array.isArray(hotel.amenities)
                        ? hotel.amenities.length
                        : hotel.amenities
                            .split(", ")
                            .filter((a) => a && a.trim()).length) - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Section: Price + Button (Always Visible) */}
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-800 pt-1.5">
              {/* Premium Price Display */}
              <div className="flex flex-col justify-center min-w-0">
                {(hotel?.priceDisplay ||
                  hotel?.pricePerNight ||
                  hotel?.priceNumeric ||
                  hotel?.priceRange ||
                  hotel?.price_range) && (
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-green-600 dark:text-green-400 font-bold text-lg leading-tight">
                        {hotel?.priceDisplay ||
                          hotel?.pricePerNight ||
                          (hotel?.priceNumeric
                            ? `₱${hotel.priceNumeric.toLocaleString()}`
                            : null) ||
                          hotel?.priceRange ||
                          hotel?.price_range}
                      </span>
                      {(hotel?.pricePerNight ||
                        hotel?.priceNumeric ||
                        (hotel?.priceDisplay?.includes("₱") &&
                          !hotel?.priceDisplay?.includes("-"))) && (
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                          /night
                        </span>
                      )}
                    </div>
                    {/* Show price source badge */}
                    {hotel?.priceSource === "google_priceLevel" && (
                      <span className="text-xs text-sky-600 dark:text-sky-400 mt-0.5 font-medium">
                        Google estimate
                      </span>
                    )}
                    {/* Show tier label if no exact price and not from Google */}
                    {!hotel?.pricePerNight &&
                      !hotel?.priceNumeric &&
                      !hotel?.priceDisplay &&
                      hotel?.budgetCompliance?.tierLabel && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {hotel.budgetCompliance.tierLabel}
                        </span>
                      )}
                  </div>
                )}
                {!hotel?.priceDisplay &&
                  !hotel?.pricePerNight &&
                  !hotel?.priceNumeric &&
                  !hotel?.priceRange &&
                  !hotel?.price_range && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      Check booking
                    </div>
                  )}
              </div>

              {/* Premium Book Button - Enhanced with Status-Based Text */}
              {onBookHotel && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBookHotel(hotel);
                  }}
                  className={`${(() => {
                    // ✅ ENHANCED: Use validateHotelBooking for accurate booking capability
                    const validation = validateHotelBooking(hotel);
                    return validation.canBook
                      ? "bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600 border-sky-700 dark:border-sky-600"
                      : "bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700 border-orange-600 dark:border-orange-700";
                  })()} active:opacity-80 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg active:shadow-inner flex-shrink-0 whitespace-nowrap border`}
                  title={(() => {
                    const validation = validateHotelBooking(hotel);
                    const matchScore = hotel?.matchScore || 0;
                    const qualityTier = hotel?.qualityTier || 6;
                    const isLowConfidenceTrusted =
                      qualityTier === 2 && matchScore < 0.95;

                    if (validation.canBook) {
                      // ✅ Google Hotels for uncertain Trusted matches
                      if (isLowConfidenceTrusted) {
                        return "View prices and reviews on Google Hotels (safer for uncertain matches)";
                      }
                      // ✅ Agoda direct booking
                      return "Book this hotel directly on Agoda";
                    } else {
                      return hotel?.verified || qualityTier <= 2
                        ? `Trusted hotel - ${validation.reason}. We'll search for similar hotels on Agoda.`
                        : "Search similar hotels on Agoda (direct booking unavailable)";
                    }
                  })()}
                >
                  {(() => {
                    const validation = validateHotelBooking(hotel);

                    // ✅ Determine booking platform based on smart hybrid logic
                    const matchScore = hotel?.matchScore || 0;
                    const qualityTier = hotel?.qualityTier || 6;
                    const isLowConfidenceTrusted =
                      qualityTier === 2 && matchScore < 0.95;

                    if (validation.canBook) {
                      // ✅ Google Hotels for uncertain Trusted matches
                      if (isLowConfidenceTrusted) {
                        return (
                          <>
                            <span>View on Google</span>
                            <span>🔍</span>
                          </>
                        );
                      }

                      // ✅ Agoda direct booking for verified/high-confidence
                      return (
                        <>
                          <span>Book Now</span>
                          <span>→</span>
                        </>
                      );
                    } else {
                      // ✅ Show different text for Trusted (Tier 2) vs lower quality
                      const isTrustedOrVerified =
                        hotel?.verified || qualityTier <= 2;
                      return (
                        <>
                          <span>
                            {isTrustedOrVerified
                              ? "Find on Agoda"
                              : "Search Agoda"}
                          </span>
                          <span>🔍</span>
                        </>
                      );
                    }
                  })()}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default HotelCardItem;
