import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function FilterPopover({ filters, setFilters, userTrips }) {
  const [customBudgetValue, setCustomBudgetValue] = useState("");

  const handleFilterClick = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType] === value ? "" : value,
    }));

    // Reset custom budget when selecting preset
    if (filterType === "budget" && value !== "custom") {
      setCustomBudgetValue("");
    }
  };

  const applyCustomBudget = () => {
    if (customBudgetValue) {
      const amount = parseInt(customBudgetValue);
      if (!isNaN(amount) && amount > 0) {
        setFilters((prev) => ({
          ...prev,
          budget: `₱${amount.toLocaleString()}`,
        }));
        setCustomBudgetValue("");
      }
    }
  };

  const hasActiveFilters = Object.values(filters).some((f) => f);
  const activeFilterCount = Object.values(filters).filter((f) => f).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <div className="bg-gradient-to-br from-blue-50 to-sky-50">
          {/* Header */}
          <div className="px-5 py-4 border-b border-blue-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-base">
                  Filter Trips
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Narrow down your search
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({ budget: "", duration: "", travelers: "" });
                    setCustomBudgetValue("");
                  }}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-5 max-h-[500px] overflow-y-auto">
            {/* Budget Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
                  <span className="text-white text-sm">💰</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">
                    Budget Range
                  </h4>
                  <p className="text-xs text-gray-500">
                    Filter by trip budget
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Preset Budget Options - Single Line */}
                <div className="flex gap-2">
                  {["Budget", "Moderate", "Luxury"].map((budget) => {
                    const isActive = filters.budget === budget;
                    return (
                      <button
                        key={budget}
                        onClick={() => handleFilterClick("budget", budget)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? "brand-gradient text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-sky-300 hover:bg-sky-50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-sm">
                            {budget === "Budget" && "🏕️"}
                            {budget === "Moderate" && "🏨"}
                            {budget === "Luxury" && "💎"}
                          </span>
                          <span>{budget}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Budget Input - Always Visible */}
                <div className="bg-white rounded-lg border border-sky-200 p-3">
                  <label className="text-xs font-medium text-sky-700 block mb-2">
                    Custom Budget Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-sky-700">₱</span>
                    <Input
                      type="number"
                      placeholder="Enter custom amount"
                      value={customBudgetValue}
                      onChange={(e) => setCustomBudgetValue(e.target.value)}
                      className="flex-1 text-sm border-sky-200 focus:border-sky-400 focus:ring-sky-400"
                      min="1000"
                      step="500"
                    />
                    <Button
                      size="sm"
                      onClick={applyCustomBudget}
                      className="bg-blue-600 hover:bg-blue-700 text-xs px-3 whitespace-nowrap"
                      disabled={!customBudgetValue}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
                  <span className="text-white text-sm">📅</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">
                    Trip Duration
                  </h4>
                  <p className="text-xs text-gray-500">
                    Filter by number of days
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { value: "short", label: "Short (1-3 days)", icon: "⚡" },
                  { value: "medium", label: "Medium (4-7 days)", icon: "🗓️" },
                  { value: "long", label: "Long (8+ days)", icon: "🌍" },
                ].map(({ value, label, icon }) => {
                  const isActive = filters.duration === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleFilterClick("duration", value)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all font-medium flex items-center justify-between ${
                        isActive
                          ? "brand-gradient text-white shadow-md transform scale-[1.02]"
                          : "bg-white text-gray-700 hover:bg-sky-50 border border-gray-200 hover:border-sky-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </span>
                      {isActive && (
                        <Check className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Travelers Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
                  <span className="text-white text-sm">👥</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">
                    Travel Group
                  </h4>
                  <p className="text-xs text-gray-500">
                    Filter by group size
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  ...new Set(
                    userTrips
                      .map((trip) => trip.userSelection?.travelers)
                      .filter(Boolean)
                  ),
                ].map((traveler) => {
                  const isActive = filters.travelers === traveler;
                  return (
                    <button
                      key={traveler}
                      onClick={() => handleFilterClick("travelers", traveler)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "brand-gradient text-white shadow-md"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-sky-300 hover:bg-sky-50"
                      }`}
                    >
                      {traveler}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default FilterPopover;