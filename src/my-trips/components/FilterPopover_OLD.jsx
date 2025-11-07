import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, Calendar, Users, DollarSign, Check } from "lucide-react";

function FilterPopover({ filters, setFilters, clearFilters, userTrips }) {
  const handleFilterClick = (filterType, value) => {
    console.log(`Filter clicked: ${filterType} = ${value}`);
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType] === value ? "" : value,
    }));
  };

  const getFilterCount = (filterType, value) => {
    return userTrips.filter((trip) => {
      switch (filterType) {
        case "budget":
          return trip.userSelection?.budget === value;
        case "duration":
          const duration = parseInt(trip.userSelection?.duration);
          switch (value) {
            case "short":
              return duration <= 3;
            case "medium":
              return duration >= 4 && duration <= 7;
            case "long":
              return duration > 7;
            default:
              return false;
          }
        case "travelers":
          return trip.userSelection?.travelers === value;
        default:
          return false;
      }
    }).length;
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2 cursor-pointer ${
            hasActiveFilters
              ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
              : "border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 dark:bg-sky-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
        align="end"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Filter Trips
            </h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("Clear all filters clicked");
                  clearFilters();
                }}
                className="text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 text-xs cursor-pointer"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="p-4 space-y-5 max-h-[500px] overflow-y-auto">
            {/* Budget Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budget
                </span>
              </div>

              <div className="space-y-2">
                {["Budget", "Moderate", "Luxury"].map((budget) => {
                  const count = getFilterCount("budget", budget);
                  const isActive = filters.budget === budget;

                  return (
                    <div
                      key={budget}
                      onClick={() => handleFilterClick("budget", budget)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? "bg-sky-500 dark:bg-sky-500 text-white border-sky-500 dark:border-sky-500"
                          : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <span className="font-medium">{budget}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? "bg-sky-400 dark:bg-sky-400 text-white"
                            : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duration Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { value: "short", label: "Short", desc: "1-3 days" },
                  { value: "medium", label: "Medium", desc: "4-7 days" },
                  { value: "long", label: "Long", desc: "8+ days" },
                ].map(({ value, label, desc }) => {
                  const count = getFilterCount("duration", value);
                  const isActive = filters.duration === value;
                  if (count === 0) return null;

                  return (
                    <div
                      key={value}
                      onClick={() => handleFilterClick("duration", value)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? "bg-sky-500 dark:bg-sky-500 text-white border-sky-500 dark:border-sky-500"
                          : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{label}</div>
                        <div
                          className={`text-xs ${
                            isActive
                              ? "text-sky-100 dark:text-sky-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {desc}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? "bg-blue-400 dark:bg-sky-400 text-white"
                            : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Travelers Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Travel Group
                </span>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[
                  ...new Set(
                    userTrips
                      .map((trip) => trip.userSelection?.travelers)
                      .filter(Boolean)
                  ),
                ].map((traveler) => {
                  const count = getFilterCount("travelers", traveler);
                  const isActive = filters.travelers === traveler;

                  return (
                    <div
                      key={traveler}
                      onClick={() => handleFilterClick("travelers", traveler)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? "bg-sky-500 dark:bg-sky-500 text-white border-sky-500 dark:border-sky-500"
                          : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <span className="font-medium">{traveler}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? "bg-sky-400 dark:bg-sky-400 text-white"
                            : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Active filters:
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(filters).map(
                  ([key, value]) =>
                    value && (
                      <span
                        key={key}
                        className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 px-2 py-1 rounded text-xs"
                      >
                        {key}:{" "}
                        {value === "short"
                          ? "1-3 days"
                          : value === "medium"
                          ? "4-7 days"
                          : value === "long"
                          ? "8+ days"
                          : value}
                      </span>
                    )
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default FilterPopover;
