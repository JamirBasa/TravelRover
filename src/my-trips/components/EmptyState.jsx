import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, PackagePlus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

function EmptyState({ userTrips, clearFilters }) {
  const navigate = useNavigate();
  const hasTrips = userTrips && userTrips.length > 0;

  if (hasTrips) {
    // User has trips but filters are hiding them
    return (
      <div className="brand-card p-12 text-center">
        <div className="brand-gradient p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Filter className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          No trips match your filters
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Try adjusting your search terms or clearing the filters to see more
          trips
        </p>
        <Button
          onClick={clearFilters}
          variant="outline"
          className="cursor-pointer border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30"
        >
          Clear All Filters
        </Button>
      </div>
    );
  }

  // User has no trips at all
  return (
    <div className="brand-card p-12 text-center">
      <div className="brand-gradient p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <PackagePlus className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
        No trips yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Start planning your next adventure! Create your first trip and let AI
        help you build the perfect itinerary.
      </p>
      <Button
        onClick={() => navigate("/create-trip")}
        className="brand-button cursor-pointer"
      >
        <MapPin className="h-4 w-4 mr-2" />
        Create Your First Trip
      </Button>
    </div>
  );
}

export default EmptyState;
