import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, Calendar, Users, DollarSign } from "lucide-react";

function FilterPopover({ filters, setFilters, clearFilters, userTrips }) {
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

          // Handle custom budgets
          if (value === "Custom") {
            return tripBudget?.startsWith("Custom:");
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
        className="w-[calc(100vw-2rem)] sm:w-80 p-0 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 z-[100]"
        align="end"
        sideOffset={8}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between p-3 sm:p-4 pb-3 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">
            Filter Trips
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 text-xs cursor-pointer"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Scrollable Content - Compact Version */}
        <div className="p-3 sm:p-4 space-y-4 max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
          {/* Budget Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Budget
              </span>
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
                  <div
                    key={value}
                    onClick={() => handleFilterClick("budget", value)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? "bg-sky-500 dark:bg-sky-500 text-white border-sky-500"
                        : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <span className="font-medium text-sm">{label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-sky-400 text-white"
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
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration
              </span>
            </div>

            <div className="space-y-1.5">
              {[
                { value: "short", label: "Short", desc: "1-3 days" },
                { value: "medium", label: "Medium", desc: "4-7 days" },
              ].map(({ value, label, desc }) => {
                const count = getFilterCount("duration", value);
                const isActive = filters.duration === value;
                if (count === 0) return null;

                return (
                  <div
                    key={value}
                    onClick={() => handleFilterClick("duration", value)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? "bg-sky-500 dark:bg-sky-500 text-white border-sky-500"
                        : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div
                        className={`text-xs ${
                          isActive
                            ? "text-sky-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {desc}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-sky-400 text-white"
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
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Travel Group
              </span>
            </div>

            <div className="space-y-1.5">
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
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? "bg-sky-500 dark:bg-sky-500 text-white border-sky-500"
                        : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <span className="font-medium text-sm">{traveler}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-sky-400 text-white"
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
      </PopoverContent>
    </Popover>
  );
}

export default FilterPopover;
