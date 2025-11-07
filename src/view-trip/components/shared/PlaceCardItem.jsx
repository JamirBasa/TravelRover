import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { GetPlaceDetails, fetchPlacePhoto } from "@/config/GlobalApi";

function PlaceCardItem({ place }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const GetPlacePhoto = useCallback(async () => {
    const placeName = place?.placeName || place?.activity;
    if (!placeName) {
      console.warn("No place name provided for photo search");
      return;
    }

    // ✅ Extract actual place name from activity description
    const extractPlaceName = (activityName) => {
      if (!activityName) return null;

      // Remove common activity prefixes
      const cleaned = activityName
        .replace(
          /^(Breakfast|Lunch|Dinner|Snack|Check-in|Check out|Visit|Explore|Tour|Shopping|Relax)\s+(at|to)?\s+/i,
          ""
        )
        .replace(/^(and check in|and check-in|for the day)\s*/i, "")
        .trim();

      // If too short or generic, return original
      if (cleaned.length < 3) return activityName;

      // Skip generic activities and just use original
      const skipTerms = [
        "hotel",
        "rest",
        "return",
        "end of day",
        "free time",
        "leisure",
        "accommodation",
      ];
      if (skipTerms.some((term) => cleaned.toLowerCase() === term)) {
        return null; // Will skip photo search for generic activities
      }

      return cleaned;
    };

    const cleanedPlaceName = extractPlaceName(placeName);

    if (!cleanedPlaceName) {
      console.log("⏭️ Skipping photo search for generic activity:", placeName);
      setPhotoUrl(""); // Use placeholder for generic activities
      return;
    }

    console.log(
      "🔍 PlaceCardItem - Fetching Google Places photo for:",
      cleanedPlaceName
    );

    // Always use Google Places API for accurate, real photos
    // Skip the AI-generated imageUrl and get actual place photos
    setIsLoading(true);

    try {
      // Create more specific search query by adding location context
      let searchQuery = cleanedPlaceName;

      // Add Manila, Philippines context for better location accuracy
      if (
        !searchQuery.toLowerCase().includes("manila") &&
        !searchQuery.toLowerCase().includes("philippines") &&
        !searchQuery.toLowerCase().includes("cebu") &&
        !searchQuery.toLowerCase().includes("davao") &&
        !searchQuery.toLowerCase().includes("baguio")
      ) {
        searchQuery += ", Philippines";
      }

      console.log("🔍 PlaceCardItem - Search query:", searchQuery);

      const data = {
        textQuery: searchQuery,
      };

      const response = await GetPlaceDetails(data);

      // ✅ Graceful handling - don't throw errors, just use fallback
      if (!response?.data?.places || response.data.places.length === 0) {
        console.warn("⚠️ PlaceCardItem - No places found, using fallback image");
        setPhotoUrl(place?.imageUrl || "");
        return;
      }

      const placeData = response.data.places[0];

      if (!placeData.photos || placeData.photos.length === 0) {
        console.warn("📸 PlaceCardItem - No photos available, using fallback");
        setPhotoUrl(place?.imageUrl || "");
        return;
      }

      const photoReference = placeData.photos[0]?.name;
      console.log("📸 PlaceCardItem - Got photo reference:", photoReference?.substring(0, 50));

      if (photoReference) {
        try {
          // ✅ Add retry logic with timeout
          const fetchWithRetry = async (ref, maxRetries = 2) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                console.log(`📸 PlaceCardItem - Fetch attempt ${attempt}/${maxRetries}`);
                const blobUrl = await Promise.race([
                  fetchPlacePhoto(ref),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Photo fetch timeout')), 10000)
                  )
                ]);
                return blobUrl;
              } catch (err) {
                if (attempt === maxRetries) throw err;
                console.warn(`⚠️ PlaceCardItem - Attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
              }
            }
          };

          const blobUrl = await fetchWithRetry(photoReference);
          console.log("✅ PlaceCardItem - Photo loaded successfully");
          setPhotoUrl(blobUrl);
        } catch (photoError) {
          console.warn(
            "📸 PlaceCardItem - All photo fetch attempts failed:",
            photoError.message
          );
          // Fallback to AI-generated image
          setPhotoUrl(place?.imageUrl || "");
        }
      } else {
        console.warn("📸 PlaceCardItem - No photo reference found");
        setPhotoUrl(place?.imageUrl || "");
      }
    } catch (error) {
      console.error("🔍 PlaceCardItem - Error fetching place photo:", error);
      console.log(
        "🔍 PlaceCardItem - Falling back to AI imageUrl:",
        place?.imageUrl
      );

      // Fallback to AI-generated image only if Google Places fails
      if (place?.imageUrl) {
        setPhotoUrl(place.imageUrl);
      } else {
        setPhotoUrl(""); // Use placeholder
      }
    } finally {
      setIsLoading(false);
    }
  }, [place?.placeName, place?.activity, place?.imageUrl]);

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
    <Link to={generateMapsURL()} target="_blank" className="block group">
      <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-300 relative">
        <div className="flex gap-4">
          {/* Place Image */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : photoUrl ? (
              <img
                src={photoUrl}
                className="w-24 h-24 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105 shadow-sm"
                alt={placeName}
                onError={(e) => {
                  e.target.src = "/placeholder.png";
                }}
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-slate-600">
                <span className="text-gray-400 dark:text-gray-500 text-3xl">
                  📍
                </span>
              </div>
            )}
          </div>

          {/* Place Details */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Title */}
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
              {placeName}
            </h3>

            {/* Description */}
            {placeDetails && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {placeDetails}
              </p>
            )}

            {/* Info Badges - Only show if data exists */}
            <div className="flex flex-wrap gap-2">
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

            {/* Action Indicator */}
            <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 font-semibold pt-1">
              <span>View on Maps</span>
              <span className="transform group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PlaceCardItem;
