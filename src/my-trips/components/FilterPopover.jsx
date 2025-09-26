import React from "react";
import { Button } from "@/components/ui/button";
import { Filter, DollarSign, Calendar, Users, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function FilterPopover({ filters, setFilters, clearFilters, userTrips }) {
  
  const handleFilterClick = (filterType, value) => {
    console.log(`Filter clicked: ${filterType} = ${value}`);
    setFilters(prev => ({ 
      ...prev, 
      [filterType]: prev[filterType] === value ? "" : value 
    }));
  };

  const getFilterCount = (filterType, value) => {
    return userTrips.filter(trip => {
      switch (filterType) {
        case 'budget':
          return trip.userSelection?.budget === value;
        case 'duration':
          const duration = parseInt(trip.userSelection?.duration);
          switch(value) {
            case "short": return duration <= 3;
            case "medium": return duration >= 4 && duration <= 7;
            case "long": return duration > 7;
            default: return false;
          }
        case 'travelers':
          return trip.userSelection?.travelers === value;
        default:
          return false;
      }
    }).length;
  };

  const hasActiveFilters = Object.values(filters).some(f => f);
  const activeFilterCount = Object.values(filters).filter(f => f).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex items-center gap-2 ${
            hasActiveFilters ? "bg-blue-50 border-blue-200 text-blue-700" : ""
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <h3 className="font-semibold text-lg">Filter Trips</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Clear all filters clicked');
                  clearFilters();
                }}
                className="text-blue-600 hover:text-blue-700 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Budget Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Budget</span>
              </div>
              
              <div className="space-y-2">
                {["Budget", "Moderate", "Luxury"].map((budget) => {
                  const count = getFilterCount('budget', budget);
                  const isActive = filters.budget === budget;
                  
                  return (
                    <div
                      key={budget}
                      onClick={() => handleFilterClick('budget', budget)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? "bg-blue-500 text-white border-blue-500" 
                          : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                      }`}
                    >
                      <span className="font-medium">{budget}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isActive ? "bg-blue-400" : "bg-gray-200"
                      }`}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duration Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Duration</span>
              </div>
              
              <div className="space-y-2">
                {[
                  { value: "short", label: "Short", desc: "1-3 days" },
                  { value: "medium", label: "Medium", desc: "4-7 days" },
                  { value: "long", label: "Long", desc: "8+ days" }
                ].map(({ value, label, desc }) => {
                  const count = getFilterCount('duration', value);
                  const isActive = filters.duration === value;
                  
                  if (count === 0) return null;
                  
                  return (
                    <div
                      key={value}
                      onClick={() => handleFilterClick('duration', value)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? "bg-blue-500 text-white border-blue-500" 
                          : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className={`text-xs ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                          {desc}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isActive ? "bg-blue-400" : "bg-gray-200"
                      }`}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Travelers Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Travel Group</span>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[...new Set(userTrips.map(trip => trip.userSelection?.travelers).filter(Boolean))].map((traveler) => {
                  const count = getFilterCount('travelers', traveler);
                  const isActive = filters.travelers === traveler;
                  
                  return (
                    <div
                      key={traveler}
                      onClick={() => handleFilterClick('travelers', traveler)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? "bg-blue-500 text-white border-blue-500" 
                          : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                      }`}
                    >
                      <span className="font-medium">{traveler}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isActive ? "bg-blue-400" : "bg-gray-200"
                      }`}>
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
            <div className="mt-4 pt-3 border-t">
              <div className="text-xs text-gray-500 mb-2">Active filters:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(filters).map(([key, value]) => 
                  value && (
                    <span 
                      key={key}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      {key}: {value === "short" ? "1-3 days" : value === "medium" ? "4-7 days" : value === "long" ? "8+ days" : value}
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