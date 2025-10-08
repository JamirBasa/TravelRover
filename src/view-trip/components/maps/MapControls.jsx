import React from "react";
import { Button } from "../../../components/ui/button";
import { FaExpand, FaCompress, FaMapMarkerAlt, FaFilter } from "react-icons/fa";

const MapControls = ({
  isFullscreen,
  onToggleFullscreen,
  showFilters,
  onToggleFilters,
  selectedDay,
  onDaySelect,
  totalDays = 0,
  placeCount = 0,
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
      {/* Left Controls */}
      <div className="flex items-center gap-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="brand-gradient p-1.5 rounded-full">
              <FaMapMarkerAlt className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {placeCount} places
            </span>
          </div>
        </div>

        {/* Day Filter */}
        {totalDays > 1 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <select
              value={selectedDay || "all"}
              onChange={(e) =>
                onDaySelect(
                  e.target.value === "all" ? null : parseInt(e.target.value)
                )
              }
              className="px-3 py-2 text-sm border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Days</option>
              {Array.from({ length: totalDays }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Day {i + 1}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Filter Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFilters}
          className={`bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 hover:bg-white ${
            showFilters ? "ring-2 ring-sky-500" : ""
          }`}
        >
          <FaFilter className="w-4 h-4" />
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFullscreen}
          className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 hover:bg-white"
        >
          {isFullscreen ? (
            <FaCompress className="w-4 h-4" />
          ) : (
            <FaExpand className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

const MapFilters = ({ onFilterChange, activeFilters = [] }) => {
  const filterOptions = [
    { id: "hotels", label: "Hotels", emoji: "🏨", color: "sky" },
    { id: "activities", label: "Activities", emoji: "🎯", color: "blue" },
    { id: "restaurants", label: "Restaurants", emoji: "🍽️", color: "green" },
    { id: "transport", label: "Transport", emoji: "🚗", color: "purple" },
    { id: "shopping", label: "Shopping", emoji: "🛍️", color: "pink" },
    { id: "landmarks", label: "Landmarks", emoji: "🏛️", color: "orange" },
  ];

  const toggleFilter = (filterId) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter((f) => f !== filterId)
      : [...activeFilters, filterId];
    onFilterChange(newFilters);
  };

  return (
    <div className="absolute top-20 left-4 right-4 z-10">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Filter Places
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filterOptions.map((option) => {
            const isActive = activeFilters.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleFilter(option.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? `bg-${option.color}-100 border-${option.color}-500 text-${option.color}-700 border-2`
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span>{option.emoji}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export { MapControls, MapFilters };
