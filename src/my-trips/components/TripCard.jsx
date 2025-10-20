import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function TripCard({ trip, onDelete }) {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Helper function to get trip highlights with correct data structure
  const getTripHighlights = () => {
    const highlights = [];

    // Check accommodations
    if (trip.tripData?.tripData?.accommodations?.length > 0) {
      highlights.push(
        `${trip.tripData.tripData.accommodations.length} hotel${
          trip.tripData.tripData.accommodations.length > 1 ? "s" : ""
        }`
      );
    }

    // Check activities in itinerary
    const totalActivities =
      trip.tripData?.tripData?.itinerary?.reduce(
        (count, day) => count + (day.activities?.length || 0),
        0
      ) || 0;

    if (totalActivities > 0) {
      highlights.push(`${totalActivities} activities`);
    }

    return highlights.slice(0, 2); // Show max 2 highlights
  };

  const highlights = getTripHighlights();

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = (e) => {
    e.target.src = `https://via.placeholder.com/400x300/e3f2fd/1976d2?text=${encodeURIComponent(
      trip.userSelection?.location || "Trip"
    )}`;
    setIsLoading(false);
  };

  const handleViewTrip = (e) => {
    if (e) e.stopPropagation();
    if (trip?.id) {
      navigate(`/view-trip/${trip.id}`);
    }
  };

  const handleEditTrip = (e) => {
    e.stopPropagation();
    if (trip?.id) {
      navigate(`/edit-trip/${trip.id}`);
    }
  };

  const handleDeleteTrip = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete this trip to ${trip.userSelection?.location}?`
      )
    ) {
      onDelete(trip.id);
    }
  };

  return (
    <div className="group border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow hover:shadow-lg dark:shadow-sky-500/10 dark:hover:shadow-sky-500/20 transition-all bg-white dark:bg-slate-900 relative">
      {/* Action Menu */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-600 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleViewTrip}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleEditTrip}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              Edit Trip
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeleteTrip}
              className="flex items-center gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete Trip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Trip Photo with loading state */}
      <div className="cursor-pointer" onClick={handleViewTrip}>
        {isLoading ? (
          <div className="h-48 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin text-blue-500 dark:text-sky-400" />
          </div>
        ) : null}
        <img
          src={
            trip.userSelection?.photoUrl ||
            "https://via.placeholder.com/400x300"
          }
          alt={trip.userSelection?.location || "Trip destination"}
          className={`w-full h-48 object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Enhanced Trip Summary */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 overflow-hidden">
          <span className="text-base flex-shrink-0">📍</span>
          <span
            className="truncate cursor-pointer"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            onClick={handleViewTrip}
          >
            {trip.userSelection?.location || "Unknown Destination"}
          </span>
        </h3>

        {/* Show AI-generated trip summary if available */}
        {trip.tripData?.trip_summary && (
          <p
            className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed cursor-pointer"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            onClick={handleViewTrip}
          >
            {trip.tripData.trip_summary}
          </p>
        )}

        {/* Trip details */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed flex items-start gap-2">
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
                className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs"
              >
                {highlight}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripCard;
