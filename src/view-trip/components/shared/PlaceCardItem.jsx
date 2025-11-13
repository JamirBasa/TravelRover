import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, fetchPlacePhoto } from "@/config/GlobalApi";

// ✅ Import production logging
import { logDebug, logError } from "@/utils/productionLogger";

// ✅ Import optimized Google Places query builder
import { buildGooglePlacesQuery } from "@/utils/googlePlacesQueryBuilder";

function PlaceCardItem({ place, trip }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const GetPlacePhoto = useCallback(async () => {
    const placeName = place?.placeName || place?.activity;
    if (!placeName) {
      logDebug("PlaceCardItem", "No place name provided for photo search");
      return;
    }

    // ✅ USE NEW QUERY BUILDER for optimized Google Places searches
    const searchQuery = buildGooglePlacesQuery(place, trip);

    if (!searchQuery) {
      logDebug(
        "PlaceCardItem",
        "Skipping photo search - query builder returned empty",
        {
          placeName,
        }
      );
      setPhotoUrl(""); // Use placeholder for generic activities
      return;
    }

    logDebug(
      "PlaceCardItem",
      "Fetching Google Places photo with optimized query",
      {
        original: placeName,
        optimized: searchQuery,
      }
    );

    // Always use Google Places API for accurate, real photos
    // Skip the AI-generated imageUrl and get actual place photos
    setIsLoading(true);

    try {
      const data = {
        textQuery: searchQuery,
      };

      const response = await GetPlaceDetails(data);

      // ✅ Graceful handling - don't throw errors, just use fallback
      if (!response?.data?.places || response.data.places.length === 0) {
        logDebug("PlaceCardItem", "No places found, using fallback image", {
          hasImageUrl: !!place?.imageUrl,
        });
        setPhotoUrl(place?.imageUrl || "");
        return;
      }

      const placeData = response.data.places[0];

      if (!placeData.photos || placeData.photos.length === 0) {
        logDebug("PlaceCardItem", "No photos available, using fallback");
        setPhotoUrl(place?.imageUrl || "");
        return;
      }

      const photoReference = placeData.photos[0]?.name;
      logDebug("PlaceCardItem", "Got photo reference", {
        photoRefPreview: photoReference?.substring(0, 50),
      });

      if (photoReference) {
        try {
          // ✅ Simplified retry logic - fetchPlacePhoto already has 20s timeout
          // ✅ With SSL disabled in dev, photos load in 1-2 seconds
          const fetchWithRetry = async (ref, maxRetries = 2) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                logDebug(
                  "PlaceCardItem",
                  `Fetch attempt ${attempt}/${maxRetries}`
                );
                // ✅ No Promise.race needed - fetchPlacePhoto has built-in timeout
                const blobUrl = await fetchPlacePhoto(ref);
                return blobUrl;
              } catch (err) {
                if (attempt === maxRetries) throw err;
                logDebug(
                  "PlaceCardItem",
                  `Attempt ${attempt} failed, retrying`,
                  {
                    error: err.message,
                  }
                );
                await new Promise((resolve) => setTimeout(resolve, 500)); // ✅ Reduced to 500ms
              }
            }
          };

          const blobUrl = await fetchWithRetry(photoReference);
          logDebug("PlaceCardItem", "Photo loaded successfully");
          setPhotoUrl(blobUrl);
        } catch (photoError) {
          logDebug("PlaceCardItem", "All photo fetch attempts failed", {
            error: photoError.message,
            fallbackAvailable: !!place?.imageUrl,
          });
          // Fallback to AI-generated image
          setPhotoUrl(place?.imageUrl || "");
        }
      } else {
        logDebug("PlaceCardItem", "No photo reference found");
        setPhotoUrl(place?.imageUrl || "");
      }
    } catch (error) {
      logError("PlaceCardItem", "Error fetching place photo", {
        error: error.message,
        fallbackImageUrl: place?.imageUrl,
      });

      // Fallback to AI-generated image only if Google Places fails
      if (place?.imageUrl) {
        setPhotoUrl(place.imageUrl);
      } else {
        setPhotoUrl(""); // Use placeholder
      }
    } finally {
      setIsLoading(false);
    }
  }, [place, trip]);

  useEffect(() => {
    // Check for both possible property names
    const placeName = place?.placeName || place?.activity;
    if (placeName) {
      GetPlacePhoto();
    }
  }, [GetPlacePhoto, place?.placeName, place?.activity]);

  // Get the correct property names from the data
  const placeName = place?.placeName || place?.activity || "Unknown Place";
  const placeDetails = place?.placeDetails || place?.description || "";
  // Generate Google Maps URL with proper place query for directions
  const generateMapsURL = () => {
    const coordinates = place?.geoCoordinates;
    const address = place?.address || place?.location || "";

    // Prioritize coordinates for most accurate directions
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${
        coordinates.latitude
      },${coordinates.longitude}&destination_place_id=${encodeURIComponent(
        placeName
      )}`;
    }

    // Fallback to comprehensive search query including name and address
    let searchQuery = placeName;
    if (address) {
      searchQuery += ` ${address}`;
    }

    // Use Google Maps search with place query for better results and directions option
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      searchQuery
    )}&query_place_id=${encodeURIComponent(placeName)}`;
  };

  return (
    <Link to={generateMapsURL()} target="_blank" className="block group h-full">
      <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-xl hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-300 h-full flex flex-col">
        {/* Place Image - Full width at top */}
        <div className="w-full h-48 flex-shrink-0 overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : photoUrl ? (
            <img
              src={photoUrl}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              alt={placeName}
              onError={(e) => {
                e.target.src = "/placeholder.png";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border-b border-gray-200 dark:border-slate-600">
              <span className="text-gray-400 dark:text-gray-500 text-4xl font-light">
                �️
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 mb-3">
            {placeName}
          </h3>

          {/* Description */}
          {placeDetails && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4">
              {placeDetails}
            </p>
          )}

          {/* Info Badges - Only show if data exists */}
          <div className="flex flex-wrap gap-2 mb-4">
            {place?.ticketPricing && (
              <span className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-md text-xs font-semibold border border-green-200 dark:border-green-800">
                <span>💰</span>
                <span>{place.ticketPricing}</span>
              </span>
            )}

            {place?.timeTravel && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-md text-xs font-semibold border border-orange-200 dark:border-orange-800">
                <span>⏰</span>
                <span>{place.timeTravel}</span>
              </span>
            )}

            {place?.rating && (
              <span className="inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-md text-xs font-semibold border border-yellow-200 dark:border-yellow-800">
                <span>⭐</span>
                <span>{place.rating}/5</span>
              </span>
            )}
          </div>

          {/* Action Indicator - Push to bottom */}
          <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 font-semibold mt-auto">
            <span>View on Maps</span>
            <span className="transform group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PlaceCardItem;
