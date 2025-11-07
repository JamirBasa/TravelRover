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
    if (key === "budget") {
      if (value === "Custom") return "Custom Budget";
      if (value === "Budget") return "Budget-Friendly";
    }
    return value;
  };

  return (
    <div className="brand-card border-gray-200/80 dark:border-slate-700/50 rounded-xl p-5 sm:p-6 mb-8 shadow-lg dark:shadow-slate-900/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Enhanced Search Bar */}
        <div className="flex-1">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 group-focus-within:text-sky-500 dark:group-focus-within:text-sky-400 transition-colors" />
            <Input
              placeholder="Search destinations, hotels, activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-11 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 focus:border-sky-500 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 rounded-lg transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 p-1 rounded-md transition-all duration-200"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sort and Filter Buttons with Enhanced Design */}
        <div className="flex gap-2 sm:gap-3">
          <SortPopover sortBy={sortBy} setSortBy={setSortBy} />
          <FilterPopover
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            userTrips={userTrips}
          />
        </div>
      </div>

      {/* Enhanced Active Filters Display with Better Spacing */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-5 border-t border-gray-200/80 dark:border-slate-700/50">
          {/* Search Term Badge with Gradient */}
          {searchTerm && (
            <div className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-950/50 dark:to-blue-950/50 text-sky-700 dark:text-sky-300 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 border border-sky-200 dark:border-sky-800/50 shadow-sm">
              <Search className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="max-w-[150px] sm:max-w-xs truncate font-semibold tracking-wide">
                "{searchTerm}"
              </span>
              <button
                onClick={() => setSearchTerm("")}
                className="hover:bg-sky-200 dark:hover:bg-sky-900/50 rounded-md p-1 transition-colors ml-1"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Enhanced Filter Badges */}
          {filters &&
            Object.entries(filters).map(
              ([key, value]) =>
                value && (
                  <div
                    key={key}
                    className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-300 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 border border-blue-200 dark:border-blue-800/50 shadow-sm"
                  >
                    {key === "budget" && (
                      <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    {key === "duration" && (
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    {key === "travelers" && (
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <span className="font-semibold tracking-wide">
                      {formatFilterValue(key, value)}
                    </span>
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, [key]: "" }))
                      }
                      className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md p-1 transition-colors ml-1"
                      aria-label={`Clear ${key} filter`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
            )}

          {/* Clear All Button with Better Design */}
          <button
            onClick={clearFilters}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 flex items-center gap-2 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 tracking-wide"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear all filters</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchAndFilter;
