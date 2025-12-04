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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl border border-gray-100 dark:border-slate-800 group">
      <div className="flex flex-col sm:flex-row gap-0 min-h-0 sm:min-h-[180px] items-stretch">
        {/* Hotel Image - Top on mobile, Left on desktop */}
        <div className="w-full h-48 sm:w-36 md:w-44 sm:h-auto sm:self-stretch flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800">
          {isLoading ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              <div className="w-5 h-5 border-3 border-sky-300 dark:border-sky-700 border-t-sky-600 dark:border-t-sky-400 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <img
                src={photoUrl || "/placeholder.png"}
                alt={hotel?.name || "Hotel"}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
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

        {/* Hotel Info - Modern Layout */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 min-w-0">
          {/* Hotel Name with Inline Rating */}
          <div className="flex items-start gap-2 sm:gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight mb-1.5">
                {hotel?.ai_hotel_name || hotel?.name || hotel?.hotelName}
              </h4>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {hotel?.rating && (
                  <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md">
                    <span className="text-amber-500 text-sm">⭐</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {hotel.rating.toFixed(1)}
                    </span>
                    {((hotel?.user_ratings_total || 0) > 0 ||
                      (hotel?.reviews_count || 0) > 0) && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (
                        {(
                          hotel.user_ratings_total ||
                          hotel.reviews_count ||
                          0
                        ).toLocaleString()}
                        )
                      </span>
                    )}
                  </div>
                )}
              </div>
              {hotel?.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 flex items-center gap-1">
                  <span className="text-gray-400">📍</span>
                  {hotel.address}
                </p>
              )}
            </div>
          </div>

          {/* Minimal Badges - Only Verified & Best Price */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-3 sm:mb-4">
            {hotel?.qualityTier === 1 && (
              <span
                className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-200 dark:border-emerald-800"
                title="100% verified hotel"
              >
                <span>✓</span>
                <span>Verified</span>
              </span>
            )}

            {hotel?.badges?.isCheapest && (
              <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-md text-xs font-semibold border border-green-200 dark:border-green-800">
                <span>💰</span>
                <span>Best Price</span>
              </span>
            )}
          </div>

          {/* Price + Button - Cleaner Layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-auto pt-3 sm:pt-4 border-t border-gray-100 dark:border-slate-800">
            {/* Simplified Price */}
            <div className="flex flex-col">
              {hotel?.priceDisplay ||
              hotel?.pricePerNight ||
              hotel?.priceNumeric ||
              hotel?.priceRange ||
              hotel?.price_range ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
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
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /night
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Price on booking site
                </span>
              )}
            </div>

            {/* Modern CTA Button */}
            {onBookHotel && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBookHotel(hotel);
                }}
                className={`${(() => {
                  const hasAgodaId =
                    hotel?.hotel_id && /^\d+$/.test(String(hotel.hotel_id));
                  const matchScore = hotel?.matchScore || 0;
                  const qualityTier = hotel?.qualityTier || 6;
                  const isGoogleVerified =
                    hotel?.verificationSource === "google_places";
                  const isPerfectMatch =
                    (matchScore === 1.0 || qualityTier === 1) &&
                    !isGoogleVerified;

                  if (hasAgodaId && isPerfectMatch) {
                    return "bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600";
                  }
                  return "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600";
                })()} text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer w-full sm:w-auto min-w-[140px]`}
                title={(() => {
                  const hasAgodaId =
                    hotel?.hotel_id && /^\d+$/.test(String(hotel.hotel_id));
                  const matchScore = hotel?.matchScore || 0;
                  const qualityTier = hotel?.qualityTier || 6;
                  const isGoogleVerified =
                    hotel?.verificationSource === "google_places";
                  const isPerfectMatch =
                    (matchScore === 1.0 || qualityTier === 1) &&
                    !isGoogleVerified;

                  // Only 100% verified hotels get direct booking
                  if (hasAgodaId && isPerfectMatch) {
                    return "Book this 100% verified hotel on Agoda";
                  }

                  // All other cases route to Google Maps
                  return "View hotel details, photos, reviews, and booking options";
                })()}
              >
                {(() => {
                  // ✅ Strict booking button - ONLY 100% verified hotels
                  const hasAgodaId =
                    hotel?.hotel_id && /^\d+$/.test(String(hotel.hotel_id));
                  const matchScore = hotel?.matchScore || 0;
                  const qualityTier = hotel?.qualityTier || 6;
                  const isGoogleVerified =
                    hotel?.verificationSource === "google_places";

                  // ONLY Tier 1 (Perfect Match - 100% verified) gets "Book on Agoda"
                  const isPerfectMatch =
                    (matchScore === 1.0 || qualityTier === 1) &&
                    !isGoogleVerified;

                  if (hasAgodaId && isPerfectMatch) {
                    return (
                      <>
                        <span>Book on Agoda</span>
                        <span>→</span>
                      </>
                    );
                  }

                  // ALL other cases → Google Maps (includes Tier 2, 3, etc.)
                  return (
                    <>
                      <span>View on Google</span>
                      <span>📍</span>
                    </>
                  );
                })()}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotelCardItem;
