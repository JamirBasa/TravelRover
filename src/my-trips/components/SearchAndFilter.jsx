import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, MapPin, DollarSign, Calendar, Users } from "lucide-react";
import FilterPopover from "./FilterPopover";
import SortPopover from "./SortPopover";

function SearchAndFilter({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  clearFilters,
  userTrips,
  sortBy,
  setSortBy,
}) {
  const hasActiveFilters = searchTerm || Object.values(filters).some((f) => f);

  const formatFilterValue = (key, value) => {
    if (key === "duration") {
      return value === "short"
        ? "1-3 days"
        : value === "medium"
        ? "4-7 days"
        : "8+ days";
    }
    return value;
  };

  return (
    <div className="mb-6">
      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl p-2 shadow-lg hover:shadow-xl transition-all duration-300 w-full relative">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <Input
              placeholder="Search destinations, hotels, activities, places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-10 border-0 bg-transparent focus:ring-0 h-12 text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <Button
            onClick={() => {
              /* Search action if needed */
            }}
            className="brand-gradient text-white font-semibold px-6 py-3 cursor-pointer shadow-lg hover:shadow-xl rounded-lg transition-all duration-300 hover:scale-105 h-12"
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <SortPopover sortBy={sortBy} setSortBy={setSortBy} />
          <FilterPopover
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            userTrips={userTrips}
          />
        </div>
      </div>

      {/* Search Helper */}
      {searchTerm && (
        <div className="mt-3 p-3 bg-sky-50 rounded-lg text-sm text-sky-700 border border-sky-200">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-sky-600" />
            <span className="font-medium">
              Searching in: destinations, trip summaries, hotel names, and
              activity descriptions
            </span>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 bg-gradient-to-r from-sky-50 to-blue-50 backdrop-blur-sm rounded-xl p-4 border border-sky-200/50 shadow-sm">
          <span className="text-sm text-gray-700 font-semibold flex items-center gap-1">
            <span className="text-sky-600">🎯</span> Active Filters:
          </span>

          {/* Search Term Badge */}
          {searchTerm && (
            <div className="brand-gradient text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow-md">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-medium">Search:</span> "{searchTerm}"
              <button
                onClick={() => setSearchTerm("")}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Filter Badges */}
          {Object.entries(filters).map(
            ([key, value]) =>
              value && (
                <div
                  key={key}
                  className="brand-gradient text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 font-medium shadow-md"
                >
                  {key === "budget" && <DollarSign className="h-3.5 w-3.5" />}
                  {key === "duration" && <Calendar className="h-3.5 w-3.5" />}
                  {key === "travelers" && <Users className="h-3.5 w-3.5" />}
                  <span className="capitalize">{key}:</span>
                  <span className="font-semibold">
                    {formatFilterValue(key, value)}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, [key]: "" }))
                    }
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
          )}

          {/* Clear All Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-medium ml-2 border border-red-200 hover:border-red-300"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

export default SearchAndFilter;