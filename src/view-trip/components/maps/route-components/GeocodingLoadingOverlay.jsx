import React from "react";
import { MapPin } from "lucide-react";

/**
 * GeocodingLoadingOverlay Component
 * Shows loading state while geocoding locations with progress
 */
export function GeocodingLoadingOverlay({ isGeocoding, geocodingProgress }) {
  if (!isGeocoding) return null;

  const progressPercentage = Math.round(
    (geocodingProgress.current / geocodingProgress.total) * 100
  );

  return (
    <div
      className="absolute inset-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm z-50 
                  flex items-center justify-center"
    >
      <div className="text-center">
        {/* Animated Map Pin Icon */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/50 animate-ping"></div>
          </div>
          <MapPin className="relative h-16 w-16 text-blue-600 dark:text-blue-400 animate-bounce z-10" />
        </div>

        {/* Loading Text */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Loading Map Locations
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Geocoding {geocodingProgress.current} of {geocodingProgress.total}{" "}
          locations...
        </p>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-sky-500 
                     transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Percentage */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {progressPercentage}% complete
        </p>
      </div>
    </div>
  );
}
