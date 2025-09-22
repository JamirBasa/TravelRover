import React, { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";

function InfoSection({ trip }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ Better condition check
    if (trip?.userSelection?.location) {
      GetPlacePhoto();
    }
  }, [trip?.userSelection?.location]); // ✅ More specific dependency

  const GetPlacePhoto = async () => {
    // ✅ Early return if no location
    if (!trip?.userSelection?.location) {
      console.warn("No location provided for photo search");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = {
        textQuery: trip.userSelection.location,
      };

      console.log("Searching for photos of:", data.textQuery); // Debug log

      const response = await GetPlaceDetails(data);

      console.log("API Response:", response.data); // ✅ See full response structure

      // ✅ Better error checking
      if (!response.data.places || response.data.places.length === 0) {
        throw new Error("No places found for this location");
      }

      const place = response.data.places[0];

      if (!place.photos || place.photos.length === 0) {
        console.warn("No photos available for this place");
        setPhotoUrl(""); // Use placeholder
        return;
      }

      // ✅ Safer photo access
      const photoReference = place.photos[0]?.name; // Use first photo, not [3]

      if (photoReference) {
        const photoUrl = PHOTO_REF_URL.replace("{NAME}", photoReference);
        setPhotoUrl(photoUrl);
        console.log("Photo URL generated:", photoUrl);
      }
    } catch (error) {
      console.error("Error fetching place photo:", error);

      // ✅ Handle different error types
      if (error.response?.status === 400) {
        console.error(
          "Bad request - check your request format:",
          error.response.data
        );
      } else if (error.response?.status === 403) {
        console.error("API key invalid or quota exceeded");
      }

      setError(error.message);
      setPhotoUrl(""); // Fallback to placeholder
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Image */}
      <div className="relative">
        {isLoading ? (
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading photo...</p>
            </div>
          </div>
        ) : (
          <img
            src={photoUrl || "../placeholder.png"}
            alt={`${trip?.userSelection?.location || "Trip"} photo`}
            className="w-full h-64 object-cover rounded-lg"
            onError={(e) => {
              console.log("Image failed to load, using placeholder");
              e.target.src = "../placeholder.png";
            }}
          />
        )}

        {error && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-sm text-gray-500">📷</p>
              <p className="text-xs text-gray-400 mt-1">Photo unavailable</p>
            </div>
          </div>
        )}
      </div>

      {/* Trip Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Trip Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-sm font-medium text-gray-900">Duration</div>
            <div className="text-xs text-gray-600">
              {trip?.userSelection?.duration} days
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm font-medium text-gray-900">Travelers</div>
            <div className="text-xs text-gray-600">
              {trip?.userSelection?.travelers}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-sm font-medium text-gray-900">Budget</div>
            <div className="text-xs text-gray-600">
              {trip?.userSelection?.customBudget
                ? `₱${trip?.userSelection?.customBudget}`
                : trip?.userSelection?.budget}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoSection;
