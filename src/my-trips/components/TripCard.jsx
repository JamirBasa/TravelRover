import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function TripCard({ trip, onDelete }) {
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

  const handleViewTrip = (e) => {
    e.stopPropagation();
    navigate(`/view-trip/${trip.id}`);
  };

  const handleEditTrip = (e) => {
    e.stopPropagation();
    // For now, redirect to create new trip
    // In future versions, we could populate the form with existing data
    navigate("/create-trip");
  };

  const handleDeleteTrip = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(trip);
    }
  };

  return (
    <div className="group border rounded-lg overflow-hidden shadow hover:shadow-lg transition-all bg-white relative">
      {/* Action Menu */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleViewTrip} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEditTrip} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Trip
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteTrip} 
              className="flex items-center gap-2 text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete Trip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Trip Photo with loading state */}
      <div 
        className="cursor-pointer"
        onClick={handleViewTrip}
      >
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
      </div>

      {/* Enhanced Trip Summary */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition-colors duration-200 flex items-center gap-2 overflow-hidden">
          <span className="text-base flex-shrink-0">📍</span>
          <span 
            className="truncate cursor-pointer"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            onClick={handleViewTrip}
          >
            {trip.userSelection?.location || "Unknown Destination"}
          </span>
        </h3>

        {/* Show AI-generated trip summary if available */}
        {trip.tripData?.trip_summary && (
          <p 
            className="text-gray-600 text-sm mb-3 leading-relaxed cursor-pointer"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            onClick={handleViewTrip}
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Button
            onClick={handleViewTrip}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TripCard;