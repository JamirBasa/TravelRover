import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, MapPin, DollarSign, Calendar, Users } from "lucide-react";
import FilterPopover from "./FilterPopover";

function SearchAndFilter({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  clearFilters,
  userTrips
}) {
  const hasActiveFilters = searchTerm || Object.values(filters).some(f => f);

  return (
    <div className="bg-white rounded-lg border p-6 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search destinations, hotels, activities, places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Search Helper */}
          {searchTerm && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-600">
              🔍 Searching in: destinations, trip summaries, hotel names, and activity descriptions
            </div>
          )}
        </div>

        {/* Filter Button */}
        <FilterPopover 
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          userTrips={userTrips}
        />
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
          <span className="text-sm text-gray-600 font-medium">Active:</span>
          
          {/* Search Term Badge */}
          {searchTerm && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="font-medium">Search:</span> "{searchTerm}"
              <button
                onClick={() => setSearchTerm("")}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Filter Badges */}
          {Object.entries(filters).map(([key, value]) => 
            value && (
              <div key={key} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                {key === "budget" && <DollarSign className="h-3 w-3" />}
                {key === "duration" && <Calendar className="h-3 w-3" />}
                {key === "travelers" && <Users className="h-3 w-3" />}
                <span className="font-medium capitalize">{key}:</span>
                <span>
                  {key === "duration" ? 
                    (value === "short" ? "1-3 days" : value === "medium" ? "4-7 days" : "8+ days") : 
                    value
                  }
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, [key]: "" }))}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          )}

          {/* Clear All Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 text-sm ml-2"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

export default SearchAndFilter;