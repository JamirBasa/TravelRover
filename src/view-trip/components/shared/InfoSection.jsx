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
        console.warn("No location provided for photo search");
        return;
      }

      setIsLoading(true);
      setPhotoError(false); // ✅ Reset error state

      try {
        const searchQuery = `${trip.userSelection.location}, Philippines`;
        console.log("🔍 InfoSection - Starting photo fetch...");
        console.log("🔍 InfoSection - Location:", trip.userSelection.location);
        console.log("🔍 InfoSection - Search query:", searchQuery);

        const data = { textQuery: searchQuery };
        console.log("🔍 InfoSection - Calling GetPlaceDetails with:", data);
        
        const response = await GetPlaceDetails(data);

        if (!isMounted) return; // ✅ Component unmounted, stop processing

        console.log("🔍 InfoSection - GetPlaceDetails response received");
        console.log("🔍 InfoSection - Response type:", typeof response);
        console.log("🔍 InfoSection - Response keys:", Object.keys(response || {}));
        console.log("🔍 InfoSection - response.data:", response?.data);
        console.log("🔍 InfoSection - response.data type:", typeof response?.data);

        // ✅ FIXED: Handle both transformed and untransformed responses
        // Backend returns: { success: true, data: { places: [...] } }
        // Axios wraps it: response.data = { success: true, data: { places: [...] } }
        // GlobalApi should transform to: { data: { places: [...] } }
        // But if cached or axios response, access via: response.data.data.places OR response.data.places
        const places = response.data?.data?.places || response.data?.places;
        console.log("🔍 InfoSection - places array:", places);
        console.log("🔍 InfoSection - places length:", places?.length);
        console.log("🔍 InfoSection - First place:", places?.[0]);

        if (!places || places.length === 0) {
          console.warn("⚠️ InfoSection - No places found in response");
          console.warn("⚠️ InfoSection - Response structure:", response);
          if (isMounted) {
            setPhotoError(true);
            setPhotoUrl("");
          }
          return;
        }

        const place = places[0];
        console.log("📍 InfoSection - Place data:", {
          displayName: place.displayName,
          hasPhotos: !!place.photos,
          photosLength: place.photos?.length || 0,
          firstPhoto: place.photos?.[0],
        });

        if (!place.photos || place.photos.length === 0) {
          console.warn(
            "📸 InfoSection - No photos available for:",
            trip.userSelection.location
          );
          console.warn("📸 InfoSection - Place object:", place);
          if (isMounted) {
            setPhotoError(true);
            setPhotoUrl("");
          }
          return;
        }

        const photoReference = place.photos[0]?.name;
        console.log("📸 InfoSection - Photo reference found:", !!photoReference);
        console.log("📸 InfoSection - Photo reference:", photoReference);
        console.log("📸 InfoSection - Photo reference length:", photoReference?.length);
        console.log("📸 InfoSection - Full photo object:", place.photos[0]);

        if (photoReference) {
          try {
            console.log("📸 InfoSection - Starting photo fetch with retry logic...");
            
            // ✅ Fetch photo with retry logic
            // ✅ SSL disabled in dev = much faster loading (2-3s instead of 10-15s)
            const fetchWithRetry = async (ref, maxRetries = 2) => { // ✅ Reduced retries to 2
              for (let attempt = 1; attempt <= maxRetries; attempt++) {
                if (!isMounted) {
                  console.log("📸 InfoSection - Component unmounted, aborting retry");
                  return null; // ✅ Check mount status before retry
                }

                try {
                  console.log(
                    `📸 InfoSection - Fetch attempt ${attempt}/${maxRetries} starting...`
                  );
                  console.log(`📸 InfoSection - Calling fetchPlacePhoto with:`, ref?.substring(0, 50));
                  
                  // ✅ No Promise.race timeout needed - fetchPlacePhoto already has 20s timeout
                  const blobUrl = await fetchPlacePhoto(ref);
                  
                  console.log(`📸 InfoSection - Fetch attempt ${attempt} completed!`);
                  console.log(`📸 InfoSection - BlobUrl received:`, blobUrl?.substring(0, 50));
                  return blobUrl;
                } catch (err) {
                  console.error(`❌ InfoSection - Attempt ${attempt} failed:`, err.message);
                  console.error(`❌ InfoSection - Error type:`, err.name);
                  console.error(`❌ InfoSection - Full error:`, err);
                  
                  if (attempt === maxRetries) {
                    console.error(`❌ InfoSection - Max retries (${maxRetries}) reached, throwing error`);
                    throw err;
                  }
                  
                  console.warn(
                    `⚠️ InfoSection - Attempt ${attempt}/${maxRetries} failed, retrying in 1s...`
                  );
                  await new Promise((resolve) => setTimeout(resolve, 1000)); // ✅ Reduced to 1s between retries
                }
              }
            };

            console.log("📸 InfoSection - Calling fetchWithRetry...");
            const blobUrl = await fetchWithRetry(photoReference);
            console.log("📸 InfoSection - fetchWithRetry completed, blobUrl:", !!blobUrl);
            
            if (!isMounted) {
              console.log("📸 InfoSection - Component unmounted after fetch, cleaning up");
              // Cleanup if unmounted during fetch
              if (blobUrl) URL.revokeObjectURL(blobUrl);
              return;
            }

            if (blobUrl) {
              currentPhotoUrl = blobUrl;
              setPhotoUrl(blobUrl);
              setPhotoError(false);
              console.log(
                "✅ InfoSection - Photo loaded successfully!",
                blobUrl.substring(0, 50) + "..."
              );
            } else {
              console.warn("⚠️ InfoSection - blobUrl is null/undefined, setting error state");
              setPhotoError(true);
              setPhotoUrl("");
            }
          } catch (photoError) {
            console.error("❌ InfoSection - All photo fetch attempts failed!");
            console.error("❌ InfoSection - Error message:", photoError.message);
            console.error("❌ InfoSection - Error name:", photoError.name);
            console.error("❌ InfoSection - Full error:", photoError);
            
            if (isMounted) {
              setPhotoError(true);
              setPhotoUrl("");
            }
          }
        } else {
          console.warn("⚠️ InfoSection - No photo reference found in place data");
          console.warn("⚠️ InfoSection - Place photos array:", place.photos);
          if (isMounted) {
            setPhotoError(true);
            setPhotoUrl("");
          }
        }
      } catch (error) {
        console.error("❌ InfoSection - Error in GetPlacePhoto function!");
        console.error("❌ InfoSection - Error message:", error.message);
        console.error("❌ InfoSection - Error name:", error.name);
        console.error("❌ InfoSection - Error stack:", error.stack);
        console.error("❌ InfoSection - Trip location:", trip?.userSelection?.location);
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
                  console.error("🖼️ InfoSection - Image failed to load:", {
                    attempted: e.target.src,
                    photoUrl: photoUrl,
                    photoError: photoError,
                    location: trip?.userSelection?.location
                  });
                  e.target.src = "/placeholder.png";
                }}
              />
              {/* ✅ Show detailed debug info when using placeholder */}
              {(photoError || !photoUrl) && !isLoading && (
                <div className="absolute top-4 right-4 bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white font-medium">
                  📸 Using placeholder image
                </div>
              )}
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
            <p className="text-lg md:text-xl text-white/95 font-medium drop-shadow-lg mb-6 max-w-2xl">
              Your personalized {trip?.userSelection?.duration}-day adventure
              awaits
            </p>

            {/* Quick Features */}
            <div className="flex flex-wrap gap-2">
              <Badge
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md 
                             border border-white/40 dark:border-slate-700 
                             text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm font-semibold shadow-lg"
              >
                <Sparkles className="h-4 w-4 mr-1.5 text-yellow-500" />
                AI-Optimized
              </Badge>
              <Badge
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md 
                             border border-white/40 dark:border-slate-700 
                             text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm font-semibold shadow-lg"
              >
                <TrendingUp className="h-4 w-4 mr-1.5 text-emerald-500" />
                Budget-Friendly
              </Badge>
              <Badge
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md 
                             border border-white/40 dark:border-slate-700 
                             text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm font-semibold shadow-lg"
              >
                <Shield className="h-4 w-4 mr-1.5 text-blue-500" />
                Local Insights
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Insights Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Smart Itinerary Card */}
        <div
          className="bg-gradient-to-br from-blue-50 to-indigo-50 
                     dark:from-blue-950/30 dark:to-indigo-950/30 
                     rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800 
                     hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-lg 
                         flex items-center justify-center shadow-md"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-blue-900 dark:text-blue-300 text-base">
              Smart Planning
            </h3>
          </div>
          <p className="text-blue-800 dark:text-blue-300/90 text-sm leading-relaxed">
            AI-optimized itinerary with perfect timing, balanced activities, and
            realistic travel duration between locations.
          </p>
        </div>

        {/* Budget Optimization Card */}
        <div
          className="bg-gradient-to-br from-emerald-50 to-green-50 
                     dark:from-emerald-950/30 dark:to-green-950/30 
                     rounded-xl p-5 border-2 border-emerald-200 dark:border-emerald-800 
                     hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 bg-emerald-500 dark:bg-emerald-600 rounded-lg 
                         flex items-center justify-center shadow-md"
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-base">
              Budget Smart
            </h3>
          </div>
          <p className="text-emerald-800 dark:text-emerald-300/90 text-sm leading-relaxed">
            Maximized value with strategic spending allocation across
            activities, accommodations, and travel based on your budget.
          </p>
        </div>

        {/* Local Knowledge Card */}
        <div
          className="bg-gradient-to-br from-amber-50 to-orange-50 
                     dark:from-amber-950/30 dark:to-orange-950/30 
                     rounded-xl p-5 border-2 border-amber-200 dark:border-amber-800 
                     hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 bg-amber-500 dark:bg-amber-600 rounded-lg 
                         flex items-center justify-center shadow-md"
            >
              <InfoIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-amber-900 dark:text-amber-300 text-base">
              Local Expertise
            </h3>
          </div>
          <p className="text-amber-800 dark:text-amber-300/90 text-sm leading-relaxed">
            Curated recommendations based on authentic local insights, seasonal
            considerations, and traveler reviews.
          </p>
        </div>
      </div>

      {/* Special Requests Section (if applicable) */}
      {trip?.userSelection?.specificRequests && (
        <div
          className="bg-gradient-to-br from-purple-50 to-pink-50 
                     dark:from-purple-950/30 dark:to-pink-950/30 
                     rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800 shadow-md"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-xl 
                         flex items-center justify-center shadow-lg flex-shrink-0"
            >
              <span className="text-2xl">💬</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-purple-900 dark:text-purple-300 text-lg mb-2">
                Your Special Preferences
              </h3>
              <div
                className="bg-white dark:bg-slate-900 rounded-lg p-4 
                           border border-purple-200 dark:border-purple-800 shadow-sm"
              >
                <p
                  className="text-purple-900 dark:text-purple-200 leading-relaxed 
                           text-sm break-words whitespace-pre-line"
                >
                  {trip.userSelection.specificRequests}
                </p>
              </div>
              <p
                className="text-purple-700 dark:text-purple-400 text-xs mt-3 
                         flex items-center gap-2"
              >
                <Clock className="h-3.5 w-3.5" />
                Our AI has tailored your itinerary to match these preferences
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Travel Readiness Checklist */}
      <div
        className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 
                   border-gray-200 dark:border-slate-700 shadow-md"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center shadow-md">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
              Trip Readiness
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Everything you need is prepared
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Itinerary Status */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg 
                       bg-emerald-50 dark:bg-emerald-950/30 
                       border border-emerald-200 dark:border-emerald-800"
          >
            <div
              className="w-8 h-8 bg-emerald-500 dark:bg-emerald-600 rounded-full 
                         flex items-center justify-center flex-shrink-0"
            >
              <span className="text-white text-lg">✓</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm">
                Itinerary
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 text-xs">
                Generated
              </p>
            </div>
          </div>

          {/* Hotels Status */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg 
                       bg-blue-50 dark:bg-blue-950/30 
                       border border-blue-200 dark:border-blue-800"
          >
            <div
              className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full 
                         flex items-center justify-center flex-shrink-0"
            >
              <span className="text-white text-lg">✓</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                Hotels
              </p>
              <p className="text-blue-700 dark:text-blue-400 text-xs">
                Verified
              </p>
            </div>
          </div>

          {/* Flights Status (if applicable) */}
          {trip?.hasRealFlights ? (
            <div
              className="flex items-center gap-3 p-3 rounded-lg 
                         bg-sky-50 dark:bg-sky-950/30 
                         border border-sky-200 dark:border-sky-800"
            >
              <div
                className="w-8 h-8 bg-sky-500 dark:bg-sky-600 rounded-full 
                           flex items-center justify-center flex-shrink-0"
              >
                <span className="text-white text-lg">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sky-900 dark:text-sky-300 text-sm">
                  Flights
                </p>
                <p className="text-sky-700 dark:text-sky-400 text-xs">
                  Live Data
                </p>
              </div>
            </div>
          ) : null}

          {/* Route Status */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg 
                       bg-purple-50 dark:bg-purple-950/30 
                       border border-purple-200 dark:border-purple-800"
          >
            <div
              className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full 
                         flex items-center justify-center flex-shrink-0"
            >
              <span className="text-white text-lg">✓</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-purple-900 dark:text-purple-300 text-sm">
                Routes
              </p>
              <p className="text-purple-700 dark:text-purple-400 text-xs">
                Optimized
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoSection;
