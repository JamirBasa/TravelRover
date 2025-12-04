import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, Calendar, Users, DollarSign, X } from "lucide-react";

function FilterPopover({ filters, setFilters, clearFilters, userTrips }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterClick = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType] === value ? "" : value,
    }));
  };

  const getFilterCount = (filterType, value) => {
    return userTrips.filter((trip) => {
      switch (filterType) {
        case "budget": {
          const tripBudget = trip.userSelection?.budget;
          if (!tripBudget) return false;

          // Handle custom budgets
          if (value === "Custom") {
            return tripBudget.startsWith("Custom:");
          }

          // ✅ FIX: Match both "Budget" and "Budget-Friendly"
          if (value === "Budget") {
            return tripBudget === "Budget-Friendly" || tripBudget === "Budget";
          }

          // Handle standard budgets (exact match)
          return tripBudget === value;
        }
        case "duration": {
          const duration = parseInt(trip.userSelection?.duration);
          switch (value) {
            case "short":
              return duration <= 3; // 1-3 days
            case "medium":
              return duration >= 4 && duration <= 7; // 4-7 days (max limit)
            // ✅ REMOVED: "long" case (> 7 days) - impossible with 7-day maximum
            default:
              return false;
          }
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

  // Check if any filters have results
  const hasAnyResults = () => {
    const budgets = ["Budget", "Moderate", "Luxury", "Custom"];
    const durations = ["short", "medium"];
    const travelers = [
      ...new Set(
        userTrips.map((trip) => trip.userSelection?.travelers).filter(Boolean)
      ),
    ];

    return (
      budgets.some((b) => getFilterCount("budget", b) > 0) ||
      durations.some((d) => getFilterCount("duration", d) > 0) ||
      travelers.length > 0
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2 h-11 px-4 cursor-pointer transition-colors ${
            hasActiveFilters
              ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400"
              : "border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          }`}
          aria-label="Filter trips"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="bg-sky-500 text-white text-xs font-medium rounded-full px-2 py-0.5 min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[280px] p-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-lg rounded-lg overflow-hidden"
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Minimalist Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Filters
          </h3>
          {hasActiveFilters && (
            <button
              onClick={() => {
                clearFilters();
              }}
              className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 text-xs font-medium cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {/* Budget Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Budget</span>
            </div>

            <div className="space-y-1.5">
              {[
                { value: "Budget", label: "Budget-Friendly" },
                { value: "Moderate", label: "Moderate" },
                { value: "Luxury", label: "Luxury" },
                { value: "Custom", label: "Custom" },
              ].map(({ value, label }) => {
                const count = getFilterCount("budget", value);
                const isActive = filters.budget === value;

                // Don't show filter if no trips match
                if (count === 0) return null;

                return (
                  <button
                    key={value}
                    onClick={() => handleFilterClick("budget", value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                      isActive
                        ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400"
                        : "bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                    aria-label={`Filter by ${label}`}
                    aria-pressed={isActive}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-300"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Duration</span>
            </div>

            <div className="space-y-1.5">
              {[
                { value: "short", label: "1-3 days" },
                { value: "medium", label: "4-7 days" },
              ].map(({ value, label }) => {
                const count = getFilterCount("duration", value);
                const isActive = filters.duration === value;
                if (count === 0) return null;

                return (
                  <button
                    key={value}
                    onClick={() => handleFilterClick("duration", value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                      isActive
                        ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400"
                        : "bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                    aria-label={`Filter by ${label} trip`}
                    aria-pressed={isActive}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-300"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Travelers Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <Users className="h-3.5 w-3.5" />
              <span>Travelers</span>
            </div>

            <div className="space-y-1.5">
              {[
                ...new Set(
                  userTrips
                    .map((trip) => trip.userSelection?.travelers)
                    .filter(Boolean)
                ),
              ]
                .sort((a, b) => {
                  const order = [
                    "Solo",
                    "Couple",
                    "Family",
                    "Friends",
                    "Group",
                  ];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map((traveler) => {
                  const count = getFilterCount("travelers", traveler);
                  const isActive = filters.travelers === traveler;

                  return (
                    <button
                      key={traveler}
                      onClick={() => handleFilterClick("travelers", traveler)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                        isActive
                          ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400"
                          : "bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                      aria-label={`Filter by ${traveler}`}
                      aria-pressed={isActive}
                    >
                      <span className="text-sm font-medium">{traveler}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-300"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Empty State */}
          {!hasAnyResults() && (
            <div className="py-6 text-center">
              <Filter className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No trips to filter
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default FilterPopover;
