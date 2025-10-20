import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MoreVertical, Eye, Trash2, Edit, Calendar, Users, DollarSign, Download, Share2 } from "lucide-react";
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

  // Format travel dates
  const formatTravelDates = () => {
    const startDate = trip.userSelection?.startDate;
    const endDate = trip.userSelection?.endDate;
    
    if (!startDate || !endDate) {
      return "Dates not set";
    }

    // Parse dates (handle both string and Date objects)
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Format as MM/DD/YY
    const formatDate = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${month}/${day}/${year}`;
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const handleViewTrip = (e) => {
    e.stopPropagation();
    navigate(`/view-trip/${trip.id}`);
  };

  const handleEditTrip = (e) => {
    e.stopPropagation();
    navigate("/create-trip");
  };

  const handleDeleteTrip = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(trip);
    }
  };

  const handleDownloadTrip = (e) => {
    e.stopPropagation();
    try {
      // Create a downloadable JSON file of the trip
      const tripData = {
        destination: trip.userSelection?.location,
        dates: formatTravelDates(),
        duration: trip.userSelection?.duration,
        travelers: trip.userSelection?.travelers,
        budget: trip.userSelection?.customBudget 
          ? `₱${trip.userSelection.customBudget.toLocaleString()}` 
          : trip.userSelection?.budget,
        itinerary: trip.tripData?.tripData?.itinerary,
        accommodations: trip.tripData?.tripData?.accommodations,
        summary: trip.tripData?.trip_summary
      };

      const dataStr = JSON.stringify(tripData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${trip.userSelection?.location || 'trip'}-itinerary.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Trip downloaded successfully!', {
        description: `${trip.userSelection?.location} itinerary saved to your device.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download trip');
    }
  };

  const handleShareTrip = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/view-trip/${trip.id}`;
    const shareText = `Check out my trip to ${trip.userSelection?.location || 'this destination'}! ${formatTravelDates()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trip to ${trip.userSelection?.location}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Trip link copied to clipboard!', {
        description: 'Share this link with your friends and family.',
      });
    }).catch((error) => {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    });
  };

  return (
    <div className="group border rounded-lg overflow-hidden shadow hover:shadow-xl transition-all bg-white relative flex flex-row h-48">
      {/* Trip Photo - Left Side */}
      <div 
        className="w-48 flex-shrink-0 cursor-pointer overflow-hidden"
        onClick={handleViewTrip}
      >
        {isLoading ? (
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <img
            src={photoUrl || "/placeholder.png"}
            alt={`${trip.userSelection?.location || "Trip"} photo`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.log("Trip image failed to load, using placeholder");
              e.target.src = "/placeholder.png";
            }}
          />
        )}
      </div>

      {/* Trip Details - Right Side */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Header with Action Menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h3 
              className="font-bold text-lg mb-1 text-gray-800 group-hover:text-blue-600 transition-colors duration-200 cursor-pointer truncate"
              onClick={handleViewTrip}
            >
              {trip.userSelection?.location || "Unknown Destination"}
            </h3>
            
            {/* Trip Meta Info */}
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5">
                <Calendar className="h-3 w-3 mr-1" />
                {trip.userSelection?.duration || "Multi"} days
              </Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs px-2 py-0.5">
                <Users className="h-3 w-3 mr-1" />
                {trip.userSelection?.travelers || "Not specified"}
              </Badge>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5">
                <DollarSign className="h-3 w-3 mr-1" />
                {trip.userSelection?.customBudget 
                  ? `₱${trip.userSelection.customBudget.toLocaleString()}` 
                  : trip.userSelection?.budget || "Flexible"}
              </Badge>
            </div>
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleViewTrip} className="text-sm">
                <Eye className="h-3.5 w-3.5 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditTrip} className="text-sm">
                <Edit className="h-3.5 w-3.5 mr-2" />
                Edit Trip
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeleteTrip} 
                className="text-sm text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Trip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Travel Dates */}
        <div className="flex-1 flex items-center">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-medium">
              {formatTravelDates()}
            </span>
          </div>
        </div>

        {/* Trip Highlights & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          {/* Highlights */}
          {highlights.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((highlight, index) => (
                <span 
                  key={index}
                  className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {highlight}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>✨</span>
              <span>AI-Generated</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              onClick={handleDownloadTrip}
              size="sm"
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-xs px-2 py-1 h-7"
              title="Download trip details"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={handleShareTrip}
              size="sm"
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-xs px-2 py-1 h-7"
              title="Share trip"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={handleViewTrip}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-7"
            >
              View Trip
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
            <span>⚠️</span>
            Failed to load photo
          </p>
        )}
      </div>
    </div>
  );
}

export default TripCard;