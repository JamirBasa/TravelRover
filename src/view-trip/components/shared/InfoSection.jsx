import React, { useEffect, useState } from "react";
import { GetPlaceDetails, fetchPlacePhoto } from "@/config/GlobalApi";
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
  const [isLoading, setIsLoading] = useState(false);
  const [photoError, setPhotoError] = useState(false); // ✅ NEW: Track photo errors

  useEffect(() => {
    let currentPhotoUrl = null;
    let isMounted = true; // ✅ NEW: Prevent state updates after unmount

    const GetPlacePhoto = async () => {
      if (!trip?.userSelection?.location) {
        logDebug("InfoSection", "No location provided for photo search");
        return;
      }

      setIsLoading(true);
      setPhotoError(false); // ✅ Reset error state

      try {
        const searchQuery = `${trip.userSelection.location}, Philippines`;
        logDebug("InfoSection", "Starting photo fetch", {
          location: trip.userSelection.location,
          searchQuery,
        });

        const data = { textQuery: searchQuery };
        const response = await GetPlaceDetails(data);

        if (!isMounted) return; // ✅ Component unmounted, stop processing

        logDebug("InfoSection", "GetPlaceDetails response received", {
          responseType: typeof response,
          hasData: !!response?.data,
          dataType: typeof response?.data,
        });

        // ✅ FIXED: Handle both transformed and untransformed responses
        // Backend returns: { success: true, data: { places: [...] } }
        // Axios wraps it: response.data = { success: true, data: { places: [...] } }
        // GlobalApi should transform to: { data: { places: [...] } }
        // But if cached or axios response, access via: response.data.data.places OR response.data.places
        const places = response.data?.data?.places || response.data?.places;
        logDebug("InfoSection", "Parsed places from response", {
          placesCount: places?.length || 0,
          hasFirstPlace: !!places?.[0],
        });

        if (!places || places.length === 0) {
          logDebug("InfoSection", "No places found in response", {
            responseStructure: Object.keys(response || {}),
          });
          if (isMounted) {
            setPhotoError(true);
            setPhotoUrl("");
          }
          return;
        }

        const place = places[0];
        logDebug("InfoSection", "Place data retrieved", {
          displayName: place.displayName,
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
        logError("InfoSection", "Error in GetPlacePhoto function", {
          error: error.message,
          errorName: error.name,
          location: trip?.userSelection?.location,
        });
        if (isMounted) {
          setPhotoError(true);
          setPhotoUrl("");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (trip?.userSelection?.location) {
      GetPlacePhoto();
    }

    // ✅ Cleanup function
    return () => {
      isMounted = false;
      if (currentPhotoUrl) {
        URL.revokeObjectURL(currentPhotoUrl);
      }
    };
  }, [trip?.userSelection?.location]);

  return (
    <div className="space-y-6">
      {/* Hero Section - Destination Showcase */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        {/* Background Image */}
        <div className="relative h-[400px] md:h-[480px]">
          {isLoading ? (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-950 dark:to-blue-950 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 brand-gradient rounded-full opacity-20 animate-ping" />
                    <div className="absolute inset-0 brand-gradient rounded-full shadow-xl flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <img
                src={photoUrl || "/placeholder.png"}
                alt={`${trip?.userSelection?.location || "Destination"}`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  logError("InfoSection", "Image failed to load", {
                    attemptedSrc: e.target.src,
                    photoUrl: photoUrl,
                    hasPhotoError: photoError,
                    location: trip?.userSelection?.location,
                  });
                  e.target.src = "/placeholder.png";
                }}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </>
          )}

          {/* Floating Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            {/* Location Badge */}
            <div className="inline-flex items-center gap-2 mb-4 w-fit">
              <div
                className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md 
                           px-4 py-2 rounded-full shadow-lg border border-white/40 dark:border-slate-700"
              >
                <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Philippines
                </span>
              </div>
            </div>

            {/* Destination Title */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 
                         drop-shadow-2xl leading-tight break-words"
            >
              {trip?.userSelection?.location}
            </h1>

            {/* Tagline */}
            <p className="text-lg md:text-xl text-white/95 font-medium drop-shadow-lg mb-4 max-w-2xl">
              Your personalized {trip?.userSelection?.duration}-day adventure
              awaits
            </p>

            {/* Travel Dates - Key Information */}
            {trip?.userSelection?.startDate && trip?.userSelection?.endDate && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-white/40 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
                <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(trip.userSelection.startDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}
                  {" - "}
                  {new Date(trip.userSelection.endDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Your Trip Dates - Detailed Information */}
      {trip?.userSelection?.startDate && trip?.userSelection?.endDate && (
        <div
          className="bg-gradient-to-r from-sky-50 via-blue-50 to-sky-50 
                     dark:from-sky-950/30 dark:via-blue-950/30 dark:to-sky-950/30 
                     rounded-xl p-5 border-2 border-sky-200 dark:border-sky-800 shadow-md hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center shadow-md">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                Your Travel Dates
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Mark your calendar for this adventure
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800">
            <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
              {new Date(trip.userSelection.startDate).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )}
              <span className="mx-3 text-sky-500 text-xl">→</span>
              {new Date(trip.userSelection.endDate).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </p>
          </div>
        </div>
      )}

      {/* What's Included - Brand-Unified Design */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Personalized Itinerary */}
        <div
          className="bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 
                     dark:from-sky-950/30 dark:via-blue-950/30 dark:to-sky-950/30 
                     rounded-xl p-5 border-2 border-sky-200 dark:border-sky-800 
                     shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 brand-gradient rounded-lg 
                         flex items-center justify-center shadow-md"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-sky-900 dark:text-sky-300 text-base">
              Personalized Itinerary
            </h3>
          </div>
          <p className="text-sky-800 dark:text-sky-300/90 text-sm leading-relaxed">
            Every day planned with perfect timing, balanced activities, and
            realistic travel between locations.
          </p>
        </div>

        {/* Smart Budget & Local Tips */}
        <div
          className="bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 
                     dark:from-sky-950/30 dark:via-blue-950/30 dark:to-sky-950/30 
                     rounded-xl p-5 border-2 border-sky-200 dark:border-sky-800 
                     shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 brand-gradient rounded-lg 
                         flex items-center justify-center shadow-md"
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-sky-900 dark:text-sky-300 text-base">
              Smart Budget & Local Tips
            </h3>
          </div>
          <p className="text-sky-800 dark:text-sky-300/90 text-sm leading-relaxed">
            Get the most value from your budget with insider tips and authentic
            local recommendations.
          </p>
        </div>
      </div>

      {/* Special Preferences - Warm Attention Accent */}
      {trip?.userSelection?.specificRequests && (
        <div
          className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 
                     dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 
                     rounded-xl p-6 border-2 border-amber-200 dark:border-amber-800 
                     shadow-md hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 
                         dark:from-amber-600 dark:to-orange-600 rounded-xl 
                         flex items-center justify-center shadow-lg flex-shrink-0"
            >
              <span className="text-2xl">💬</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-lg mb-2">
                Your Special Preferences
              </h3>
              <div
                className="bg-white dark:bg-slate-900 rounded-lg p-4 
                           border border-amber-200 dark:border-amber-800 shadow-sm"
              >
                <p
                  className="text-amber-900 dark:text-amber-200 leading-relaxed 
                           text-sm break-words whitespace-pre-line"
                >
                  {trip.userSelection.specificRequests}
                </p>
              </div>
              <p
                className="text-amber-700 dark:text-amber-400 text-xs mt-3 
                         flex items-center gap-2"
              >
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Your itinerary reflects these preferences
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoSection;
