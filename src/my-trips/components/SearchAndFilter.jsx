import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, MapPin, DollarSign, Calendar, Users } from "lucide-react";
import FilterPopover from "./FilterPopover";
import SortPopover from "./SortPopover";

function SearchAndFilter({
  searchTerm,
  setSearchTerm,
  filters = {},
  setFilters,
  clearFilters,
  userTrips,
  sortBy,
  setSortBy,
}) {
  const hasActiveFilters =
    searchTerm || (filters && Object.values(filters).some((f) => f));

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
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6 shadow-sm dark:shadow-sky-500/5">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search destinations, hotels, activities, places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Search Helper */}
          {searchTerm && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/50 rounded text-xs text-blue-600 dark:text-blue-400">
              🔍 Searching in: destinations, trip summaries, hotel names, and
              activity descriptions
            </div>
          )}
        </div>

        {/* Sort and Filter Buttons */}
        <div className="flex gap-2">
          <SortPopover sortBy={sortBy} setSortBy={setSortBy} />
          <FilterPopover
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            userTrips={userTrips}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Active:
          </span>

          {/* Search Term Badge */}
          {searchTerm && (
            <div className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="font-medium">Search:</span> "{searchTerm}"
              <button
                onClick={() => setSearchTerm("")}
                className="ml-1 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Filter Badges */}
          {filters &&
            Object.entries(filters).map(
              ([key, value]) =>
                value && (
                  <div
                    key={key}
                    className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {key === "budget" && <DollarSign className="h-3 w-3" />}
                    {key === "duration" && <Calendar className="h-3 w-3" />}
                    {key === "travelers" && <Users className="h-3 w-3" />}
                    <span className="font-medium capitalize">{key}:</span>
                    <span>{formatFilterValue(key, value)}</span>
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, [key]: "" }))
                      }
                      className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full p-0.5 transition-colors"
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
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm ml-2"
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
