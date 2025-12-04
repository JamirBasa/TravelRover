import React, { useEffect, useState } from "react";
import { fetchPlacePhoto } from "@/config/GlobalApi";
import { usePlaceSearch } from "@/hooks/usePlaces";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Info as InfoIcon,
} from "lucide-react";

// ✅ Import production logging
import { logDebug, logError } from "@/utils/productionLogger";

/**
 * InfoSection Component
 * Comprehensive destination overview with professional design
 * Focus: Destination highlights, AI insights, and travel information
 */
function InfoSection({ trip }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoError, setPhotoError] = useState(false);

  // React Query hook for place search
  const searchQuery = trip?.userSelection?.location
    ? `${trip.userSelection.location}, Philippines`
    : "";

  const {
    data: placeData,
    isLoading: isSearching,
    error,
  } = usePlaceSearch(searchQuery, {
    enabled: !!searchQuery,
  });

  // ✅ Extract stable value from placeData for dependency tracking
  const placePhotoRef = React.useMemo(() => {
    const places = placeData?.data?.places || placeData?.places;
    return places?.[0]?.photos?.[0]?.name || null;
  }, [placeData]);

  useEffect(() => {
    let isMounted = true;
    let currentPhotoUrl = null;

    const processPlacePhoto = async () => {
      if (!placeData || !isMounted) {
        console.log("InfoSection: Skipping photo processing", {
          hasPlaceData: !!placeData,
          isMounted,
        });
        return;
      }

      console.log("InfoSection: Starting photo processing", {
        placeData: placeData ? Object.keys(placeData) : [],
        location: trip?.userSelection?.location,
      });

      try {
        logDebug("InfoSection", "Place search response received", {
          hasData: !!placeData?.data,
          placeDataStructure: placeData ? Object.keys(placeData) : [],
        });

        // ✅ Handle both response formats (cached vs fresh)
        const places = placeData?.data?.places || placeData?.places;

        if (!places || places.length === 0) {
          logDebug("InfoSection", "No places found in response", {
            placeData: placeData
              ? JSON.stringify(placeData).substring(0, 200)
              : null,
          });
          if (isMounted) {
            setPhotoError(true);
            setPhotoUrl("");
          }
          return;
        }

        const place = places[0];
        logDebug("InfoSection", "Place data retrieved", {
          displayName: place.displayName?.text || place.displayName,
          hasPhotos: !!place.photos,
          photosLength: place.photos?.length || 0,
        });

        if (!place.photos || place.photos.length === 0) {
          logDebug("InfoSection", "No photos available for location", {
            location: trip.userSelection.location,
          });
          if (isMounted) {
            setPhotoError(true);
            setPhotoUrl("");
          }
          return;
        }

        const photoReference = place.photos[0]?.name;
        logDebug("InfoSection", "Photo reference extracted", {
          hasPhotoRef: !!photoReference,
          photoRefLength: photoReference?.length || 0,
        });

        if (photoReference) {
          try {
            logDebug("InfoSection", "Starting photo fetch with retry logic");

            // ✅ Fetch photo with retry logic
            // ✅ SSL disabled in dev = much faster loading (2-3s instead of 10-15s)
            const fetchWithRetry = async (ref, maxRetries = 2) => {
              // ✅ Reduced retries to 2
              for (let attempt = 1; attempt <= maxRetries; attempt++) {
                if (!isMounted) {
                  logDebug(
                    "InfoSection",
                    "Component unmounted, aborting retry"
                  );
                  return null; // ✅ Check mount status before retry
                }

                try {
                  logDebug(
                    "InfoSection",
                    `Photo fetch attempt ${attempt}/${maxRetries}`,
                    {
                      photoRefPreview: ref?.substring(0, 50),
                    }
                  );

                  // ✅ No Promise.race timeout needed - fetchPlacePhoto already has 20s timeout
                  const blobUrl = await fetchPlacePhoto(ref);

                  logDebug(
                    "InfoSection",
                    `Fetch attempt ${attempt} completed`,
                    {
                      blobUrlPreview: blobUrl?.substring(0, 50),
                    }
                  );
                  return blobUrl;
                } catch (err) {
                  logError(
                    "InfoSection",
                    `Photo fetch attempt ${attempt} failed`,
                    {
                      error: err.message,
                      errorType: err.name,
                      attempt,
                      maxRetries,
                    }
                  );

                  if (attempt === maxRetries) {
                    logError(
                      "InfoSection",
                      `Max retries (${maxRetries}) reached`,
                      {
                        error: err.message,
                      }
                    );
                    throw err;
                  }

                  logDebug(
                    "InfoSection",
                    `Retrying photo fetch in 1s (attempt ${attempt}/${maxRetries})`
                  );
                  await new Promise((resolve) => setTimeout(resolve, 1000)); // ✅ Reduced to 1s between retries
                }
              }
            };

            logDebug("InfoSection", "Calling fetchWithRetry");
            const blobUrl = await fetchWithRetry(photoReference);

            if (!isMounted) {
              logDebug(
                "InfoSection",
                "Component unmounted after fetch, cleaning up"
              );
              // Cleanup if unmounted during fetch
              if (blobUrl) URL.revokeObjectURL(blobUrl);
              return;
            }

            if (blobUrl) {
              currentPhotoUrl = blobUrl;
              setPhotoUrl(blobUrl);
              setPhotoError(false);
              logDebug("InfoSection", "Photo loaded successfully", {
                blobUrlPreview: blobUrl.substring(0, 50),
              });
            } else {
              logDebug(
                "InfoSection",
                "blobUrl is null/undefined, setting error state"
              );
              setPhotoError(true);
              setPhotoUrl("");
            }
          } catch (photoError) {
            logError("InfoSection", "All photo fetch attempts failed", {
              error: photoError.message,
              errorName: photoError.name,
              location: trip?.userSelection?.location,
            });

            if (isMounted) {
              setPhotoError(true);
              setPhotoUrl("");
            }
          }
        } else {
          logDebug("InfoSection", "No photo reference found in place data", {
            hasPhotosArray: !!place.photos,
          });
          if (isMounted) {
            setPhotoError(true);
            setPhotoUrl("");
          }
        }
      } catch (error) {
        logError("InfoSection", "Error in processPlacePhoto function", {
          error: error.message,
          errorName: error.name,
          location: trip?.userSelection?.location,
        });
        if (isMounted) {
          setPhotoError(true);
          setPhotoUrl("");
        }
      } finally {
        // Cleanup handled by React Query
      }
    };

    if (trip?.userSelection?.location) {
      processPlacePhoto();
    }

    // ✅ Cleanup function
    return () => {
      isMounted = false;
      if (currentPhotoUrl) {
        console.log("InfoSection: Cleaning up photo blob URL");
        URL.revokeObjectURL(currentPhotoUrl);
      }
    };
  }, [trip?.userSelection?.location, placePhotoRef]); // ✅ Use stable photo reference instead of full placeData object

  return (
    <div className="space-y-6">
      {/* Hero Section - Destination Showcase */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        {/* Background Image */}
        <div className="relative h-[400px] md:h-[480px]">
          {isSearching ? (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-950 dark:to-blue-950 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 brand-gradient rounded-full opacity-20 animate-ping" />
                    <div className="absolute inset-0 brand-gradient rounded-full shadow-xl flex items-center justify-center">
                      <div
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sky-700 dark:text-sky-300 font-semibold text-lg tracking-wide">
                  Loading destination...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ✅ Only render img when photoUrl exists AND is not empty */}
              {photoUrl && photoUrl !== "" ? (
                <img
                  src={photoUrl}
                  alt={`${trip?.userSelection?.location || "Destination"}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    logError("InfoSection", "Image failed to load", {
                      attemptedSrc: e.target.src,
                      photoUrl: photoUrl,
                      hasPhotoError: photoError,
                      location: trip?.userSelection?.location,
                    });
                    // Set error state to trigger fallback
                    setPhotoError(true);
                    setPhotoUrl("");
                  }}
                />
              ) : (
                // ✅ Fallback gradient background
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600">
                  {/* Pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <MapPin className="h-16 w-16 mx-auto mb-3 opacity-90" />
                      <p className="text-xl font-semibold opacity-90">
                        {trip?.userSelection?.location}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Gradient Overlay - only show with actual photo */}
              {photoUrl && photoUrl !== "" && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              )}
            </>
          )}

          {/* Floating Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            {/* Destination Title */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 
                         drop-shadow-2xl leading-tight break-words"
            >
              {trip?.userSelection?.location}
            </h1>

            {/* Trip Duration & Dates */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-white/40 dark:border-slate-700">
                <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {trip?.userSelection?.duration}{" "}
                  {trip?.userSelection?.duration === 1 ? "Day" : "Days"}
                </span>
              </div>

              {trip?.userSelection?.startDate &&
                trip?.userSelection?.endDate && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-white/40 dark:border-slate-700">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(
                        trip.userSelection.startDate
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" - "}
                      {new Date(trip.userSelection.endDate).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Special Preferences - Compact Version */}
      {trip?.userSelection?.specificRequests && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💬</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 text-sm mb-1.5">
                Your Preferences
              </h3>
              <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                {trip.userSelection.specificRequests}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoSection;
