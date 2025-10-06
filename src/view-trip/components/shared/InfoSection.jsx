import React, { useEffect, useState } from "react";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, Clock, Plane } from "lucide-react";

function InfoSection({ trip }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (trip?.userSelection?.location) {
      GetPlacePhoto();
    }
  }, [trip?.userSelection?.location]);

  const GetPlacePhoto = async () => {
    if (!trip?.userSelection?.location) {
      console.warn("No location provided for photo search");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = { textQuery: trip.userSelection.location };
      const response = await GetPlaceDetails(data);

      if (!response.data.places || response.data.places.length === 0) {
        throw new Error("No places found for this location");
      }

      const place = response.data.places[0];

      if (!place.photos || place.photos.length === 0) {
        console.warn("No photos available for this place");
        setPhotoUrl("");
        return;
      }

      const photoReference = place.photos[0]?.name;
      if (photoReference) {
        const photoUrl = PHOTO_REF_URL.replace("{NAME}", photoReference);
        setPhotoUrl(photoUrl);
      }
    } catch (error) {
      console.error("Error fetching place photo:", error);
      setError(error.message);
      setPhotoUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Consistent Trip Overview Header */}
      <div className="brand-gradient rounded-lg p-6 text-white shadow-lg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-4 translate-x-4"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-2 -translate-x-2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span
                className="text-white text-lg"
                role="img"
                aria-label="Location"
              >
                📍
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1 text-white drop-shadow-lg break-words">
                {trip?.userSelection?.location}
              </h2>
              <p className="text-blue-100 drop-shadow-md text-sm">
                Your personalized travel adventure awaits
              </p>
            </div>
          </div>

          {/* Compact Trip Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 text-center border border-white/60 shadow-md transition-all duration-300">
              <Calendar className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <div className="text-lg font-bold text-gray-900">
                {trip?.userSelection?.duration}
              </div>
              <div className="text-gray-700 text-xs font-semibold">Days</div>
            </div>
            <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 text-center border border-white/60 shadow-md transition-all duration-300">
              <Users className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <div className="text-lg font-bold text-gray-900">
                {trip?.userSelection?.travelers}
              </div>
              <div className="text-gray-700 text-xs font-semibold">
                Travelers
              </div>
            </div>
            <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 text-center border border-white/60 shadow-md transition-all duration-300">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <div className="text-lg font-bold text-gray-900">
                {trip?.userSelection?.customBudget
                  ? `₱${trip.userSelection.customBudget.toLocaleString()}`
                  : trip?.userSelection?.budget}
              </div>
              <div className="text-gray-700 text-xs font-semibold">Budget</div>
            </div>
            <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 text-center border border-white/60 shadow-md transition-all duration-300">
              <Clock className="h-5 w-5 mx-auto mb-2 text-orange-600" />
              <div className="text-lg font-bold text-gray-900">
                {new Date(trip?.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="text-gray-700 text-xs font-semibold">Created</div>
            </div>
          </div>

          {/* Compact Trip Features */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/90 text-gray-800 border-gray-200 text-xs font-medium">
              <span className="mr-1">🤖</span>
              AI-Optimized
            </Badge>
            <Badge className="bg-white/90 text-gray-800 border-gray-200 text-xs font-medium">
              <span className="mr-1">💰</span>
              Budget-Friendly
            </Badge>
            <Badge className="bg-white/90 text-gray-800 border-gray-200 text-xs font-medium">
              <span className="mr-1">📍</span>
              Local Insights
            </Badge>
            {trip?.hasRealFlights && (
              <Badge className="bg-emerald-100/90 text-emerald-800 border-emerald-200 text-xs font-medium">
                <Plane className="h-3 w-3 mr-1" />
                Live Flight Data
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Consistent Location Showcase */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="relative">
          {isLoading ? (
            <div className="w-full h-80 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                <p className="mt-4 text-blue-700 font-medium">
                  Loading destination photo...
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={photoUrl || "../placeholder.png"}
                alt={`${trip?.userSelection?.location || "Trip"} photo`}
                className="w-full h-80 object-cover"
                onError={(e) => {
                  e.target.src = "../placeholder.png";
                }}
              />
              {/* Image overlay with location info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent">
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2 drop-shadow-lg break-words">
                    <span
                      className="text-lg flex-shrink-0"
                      role="img"
                      aria-label="Location"
                    >
                      📍
                    </span>
                    <span className="break-words">
                      {trip?.userSelection?.location}
                    </span>
                  </h3>
                  <p className="text-white drop-shadow-md text-sm">
                    Discover the beauty and culture of this amazing destination
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="w-full h-80 bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-red-500">📷</span>
                </div>
                <p className="text-red-700 font-medium">Photo unavailable</p>
                <p className="text-red-600 text-sm mt-1">
                  Unable to load destination image
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Trip Details Section */}
        <div className="p-4 sm:p-6">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Trip Preferences */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-base">
                <span className="text-blue-600">⚙️</span>
                Your Preferences
              </h4>
              <div className="space-y-3">
                {trip?.userSelection?.budget && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Budget Range</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {trip.userSelection.customBudget
                        ? `₱${trip.userSelection.customBudget.toLocaleString()}`
                        : trip.userSelection.budget}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Travel Duration</span>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    {trip?.userSelection?.duration} days
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Group Size</span>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800"
                  >
                    {trip?.userSelection?.travelers} travelers
                  </Badge>
                </div>
              </div>
            </div>

            {/* Trip Status */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-base">
                <span className="text-green-600">✅</span>
                Trip Status
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Itinerary</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Ready
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Hotels</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Available
                  </Badge>
                </div>
                {trip?.hasRealFlights && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Flights</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      <Plane className="h-3 w-3 mr-1" />
                      Live Data
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Created</span>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800"
                  >
                    {new Date(trip?.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Requests Section */}
      {trip?.userSelection?.specificRequests && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 text-sm">📝</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-900 mb-3 text-base">
                Special Requests & Preferences
              </h4>
              <div className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-amber-800 leading-relaxed text-sm break-words">
                  {trip.userSelection.specificRequests}
                </p>
              </div>
              <p className="text-amber-700 text-xs mt-2">
                Our AI has incorporated these preferences into your personalized
                itinerary.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoSection;
