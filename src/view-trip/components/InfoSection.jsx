import React, { useEffect, useState } from "react";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 text-lg">📍</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Trip Overview</h2>
          <p className="text-sm text-gray-600">Your destination at a glance</p>
        </div>
      </div>

      {/* Location Image */}
      <div className="relative mb-6">
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
              e.target.src = "../placeholder.png";
            }}
          />
        )}

        {error && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-4xl text-gray-400 mb-2">📷</p>
              <p className="text-sm text-gray-500">Photo unavailable</p>
            </div>
          </div>
        )}
      </div>

      {/* Special Requests */}
      {trip?.userSelection?.specificRequests && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Special Requests</h4>
          <p className="text-blue-800 text-sm">
            {trip.userSelection.specificRequests}
          </p>
        </div>
      )}
    </div>
  );
}

export default InfoSection;
