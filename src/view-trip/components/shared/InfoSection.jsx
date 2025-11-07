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

  useEffect(() => {
    let currentPhotoUrl = null;

    const GetPlacePhoto = async () => {
      if (!trip?.userSelection?.location) {
        console.warn("No location provided for photo search");
        return;
      }

      setIsLoading(true);

      try {
        const searchQuery = `${trip.userSelection.location}, Philippines`;
        console.log("🔍 InfoSection - Searching for:", searchQuery);

        const data = { textQuery: searchQuery };
        const response = await GetPlaceDetails(data);

        console.log("🔍 InfoSection - GetPlaceDetails response:", response);
        console.log("🔍 InfoSection - response.data:", response.data);
        console.log(
          "🔍 InfoSection - response.data.places:",
          response.data?.places
        );

        if (!response?.data?.places || response.data.places.length === 0) {
          console.warn("⚠️ InfoSection - No places found in response");
          setPhotoUrl("");
          return;
        }

        const place = response.data.places[0];
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
          setPhotoUrl("");
          return;
        }

        const photoReference = place.photos[0]?.name;
        console.log("📸 InfoSection - Photo reference:", photoReference);
        console.log("📸 InfoSection - Full photo object:", place.photos[0]);

        if (photoReference) {
          try {
            // ✅ Fetch photo as blob URL for proper loading
            const blobUrl = await fetchPlacePhoto(photoReference);
            currentPhotoUrl = blobUrl;
            setPhotoUrl(blobUrl);
            console.log(
              "✅ InfoSection - Photo loaded successfully:",
              blobUrl.substring(0, 50)
            );
          } catch (photoError) {
            console.warn(
              "📸 InfoSection - Failed to fetch photo:",
              photoError.message
            );
            setPhotoUrl("");
          }
        } else {
          console.warn("📸 InfoSection - No photo reference found");
          setPhotoUrl("");
        }
      } catch (error) {
        console.error("❌ InfoSection - Error fetching place photo:", error);
        console.error("❌ InfoSection - Error details:", {
          message: error.message,
          response: error.response,
          trip: trip?.userSelection,
        });
        // Don't set error state - just use placeholder
        setPhotoUrl("");
      } finally {
        setIsLoading(false);
      }
    };

    if (trip?.userSelection?.location) {
      GetPlacePhoto();
    }

    // Cleanup blob URL on unmount
    return () => {
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
                src={photoUrl || "../placeholder.png"}
                alt={`${trip?.userSelection?.location || "Destination"}`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "../placeholder.png";
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
