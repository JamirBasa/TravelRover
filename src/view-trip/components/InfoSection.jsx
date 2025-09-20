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
    <div>
      {/* ✅ Better loading and error states */}
      {isLoading ? (
        <div className="w-full h-[300px] bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
          <span>Loading photo...</span>
        </div>
      ) : (
        <img
          src={photoUrl || "../placeholder.png"}
          alt={`${trip?.userSelection?.location || "Trip"} photo`}
          className="w-full h-[300px] object-cover rounded-lg mb-4"
          onError={(e) => {
            console.log("Image failed to load, using placeholder");
            e.target.src = "../placeholder.png";
          }}
        />
      )}

      {error && (
        <div className="text-red-500 text-sm mb-2">
          Failed to load location photo: {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="my-5 flex flex-col gap-2">
          <h2 className="font-bold text-2xl">
            {trip?.userSelection?.location}
          </h2>
          <div className="flex items-center gap-2">
            <span className="p-1 px-3 bg-gray-200 rounded-full text-gray-500 text-xs md:text-md">
              📅 {trip?.userSelection?.duration} days
            </span>
            <span className="p-1 px-3 bg-gray-200 rounded-full text-gray-500 text-xs md:text-md">
              🧑 No of Travelers: {trip?.userSelection?.travelers}
            </span>
            <span className="p-1 px-3 bg-gray-200 rounded-full text-gray-500 text-xs md:text-md">
              💲 {trip?.userSelection?.budget}
            </span>
          </div>
        </div>
        <Button>
          <Share2 />
        </Button>
      </div>
    </div>
  );
}

export default InfoSection;
