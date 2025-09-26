import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function TripCard({ trip }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

      const data = {
        textQuery: trip.userSelection.location,
      };

      console.log("Searching for trip photo:", data.textQuery);

      const response = await GetPlaceDetails(data);

      if (!response.data.places || response.data.places.length === 0) {
        throw new Error("No places found for this location");
      }

      const place = response.data.places[0];

      if (!place.photos || place.photos.length === 0) {
        console.warn("No photos available for this trip location");
        setPhotoUrl("");
        return;
      }

      const photoReference = place.photos[0]?.name;

      if (photoReference) {
        const photoUrl = PHOTO_REF_URL.replace("{NAME}", photoReference);
        setPhotoUrl(photoUrl);
        console.log("Trip photo URL generated:", photoUrl);
      }
    } catch (error) {
      console.error("Error fetching trip photo:", error);

      if (error.response?.status === 429) {
        console.warn("Rate limited, will retry...");
        setTimeout(() => GetPlacePhoto(), 2000 + Math.random() * 1000);
        return;
      }

      setError(error.message);
      setPhotoUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get trip highlights with correct data structure
  const getTripHighlights = () => {
    const highlights = [];
    
    // Check accommodations
    if (trip.tripData?.tripData?.accommodations?.length > 0) {
      highlights.push(`${trip.tripData.tripData.accommodations.length} hotel${trip.tripData.tripData.accommodations.length > 1 ? 's' : ''}`);
    }
    
    // Check activities in itinerary
    const totalActivities = trip.tripData?.tripData?.itinerary?.reduce((count, day) => 
      count + (day.activities?.length || 0), 0
    ) || 0;
    
    if (totalActivities > 0) {
      highlights.push(`${totalActivities} activities`);
    }
    
    return highlights.slice(0, 2); // Show max 2 highlights
  };

  const highlights = getTripHighlights();

  return (
    <div
      className="group border rounded-lg overflow-hidden shadow hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-white"
      onClick={() => navigate(`/view-trip/${trip.id}`)}
    >
      {/* Trip Photo with loading state */}
      {isLoading ? (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <img
          src={photoUrl || "/placeholder.png"}
          alt={`${trip.userSelection?.location || "Trip"} photo`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            console.log("Trip image failed to load, using placeholder");
            e.target.src = "/placeholder.png";
          }}
        />
      )}

      {/* Enhanced Trip Summary */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition-colors duration-200 flex items-center gap-2 overflow-hidden">
          <span className="text-base flex-shrink-0">📍</span>
          <span 
            className="truncate"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {trip.userSelection?.location || "Unknown Destination"}
          </span>
        </h3>

        {/* Show AI-generated trip summary if available */}
        {trip.tripData?.trip_summary && (
          <p 
            className="text-gray-600 text-sm mb-3 leading-relaxed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {trip.tripData.trip_summary}
          </p>
        )}

        {/* Trip details */}
        <p className="text-gray-600 text-sm mb-3 leading-relaxed flex items-start gap-2">
          <span className="text-xs mt-0.5 flex-shrink-0">🗓️</span>
          <span>
            {trip.userSelection?.duration || "Multi"} day trip with{" "}
            {trip.userSelection?.budget?.toLowerCase() || "flexible"} budget
            {trip.userSelection?.travelers &&
              trip.userSelection.travelers !== "Just Me" && (
                <span> for {trip.userSelection.travelers.toLowerCase()}</span>
              )}
          </span>
        </p>

        {/* Show trip highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {highlights.map((highlight, index) => (
              <span 
                key={index}
                className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
              >
                {highlight}
              </span>
            ))}
          </div>
        )}

        {/* Show error state */}
        {error && (
          <p className="text-red-500 text-xs mb-3 flex items-center gap-1">
            <span>⚠️</span>
            Failed to load photo
          </p>
        )}

        {/* Clean View Details */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 group-hover:border-gray-200 transition-colors">
          <span className="text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1.5">
            <span className="text-xs">✈️</span>
            View Trip Details
          </span>
          <svg
            className="w-4 h-4 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default TripCard;