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
      <div className="brand-card p-12 sm:p-16 text-center rounded-xl shadow-xl dark:shadow-slate-900/50 backdrop-blur-sm border-2 border-dashed border-sky-300 dark:border-sky-700/50">
        <div className="brand-gradient p-5 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-sky-500/30 dark:shadow-sky-500/20 animate-pulse">
          <Filter className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4 brand-gradient-text tracking-tight leading-tight">
          No trips match your filters
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-base leading-loose tracking-wide">
          We couldn't find any trips matching your current search criteria. Try
          adjusting your filters or clearing them to explore more trips.
        </p>
        <Button
          onClick={clearFilters}
          variant="outline"
          size="lg"
          className="cursor-pointer border-2 border-sky-300 dark:border-sky-700 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-sky-950/30 dark:hover:to-blue-950/30 text-sky-700 dark:text-sky-300 font-semibold shadow-md hover:shadow-lg transition-all duration-300 tracking-wide"
        >
          <Filter className="h-4 w-4 mr-2.5" />
          Clear All Filters
        </Button>
      </div>
    );
  }

  // User has no trips at all
  return (
    <div className="brand-card p-12 sm:p-20 text-center rounded-xl shadow-xl dark:shadow-slate-900/50 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700/50">
      <div className="brand-gradient p-6 rounded-2xl w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-xl shadow-sky-500/30 dark:shadow-sky-500/20 transform hover:scale-110 transition-transform duration-300">
        <PackagePlus className="h-12 w-12 text-white" />
      </div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-5 brand-gradient-text tracking-tight leading-tight">
        Start Your Adventure
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto text-lg leading-loose tracking-wide">
        You haven't created any trips yet. Begin planning your next incredible
        journey and let our AI craft the perfect itinerary tailored just for
        you.
      </p>
      <Button
        onClick={() => navigate("/create-trip")}
        className="brand-button cursor-pointer shadow-xl shadow-sky-500/30 dark:shadow-sky-500/20 hover:shadow-2xl hover:shadow-sky-500/40 dark:hover:shadow-sky-500/30 transition-all duration-300 text-lg px-8 py-6 tracking-wide"
        size="lg"
      >
        <MapPin className="h-5 w-5 mr-2.5" />
        Create Your First Trip
      </Button>
    </div>
  );
}

export default EmptyState;
