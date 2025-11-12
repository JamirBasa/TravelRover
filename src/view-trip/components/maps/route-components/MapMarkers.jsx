import React from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

/**
 * MapMarkers Component
 * Renders location markers on the map with images and day-based coloring
 */
export function MapMarkers({
  filteredLocations,
  onMarkerClick,
  getMarkerColor,
}) {
  return (
    <>
      {filteredLocations.map((location, index) => {
        if (!location.coordinates) return null;

        const position = {
          lat: location.coordinates.latitude,
          lng: location.coordinates.longitude,
        };

        return (
          <AdvancedMarker
            key={location.id}
            position={position}
            onClick={() => onMarkerClick(location)}
          >
            <CustomMarkerContent
              location={location}
              index={index}
              markerColor={getMarkerColor(location.day)}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

/**
 * CustomMarkerContent Component
 * Renders a custom pin-shaped marker with centered number
 */
function CustomMarkerContent({ location, index, markerColor }) {
  return (
    <div
      className="relative group cursor-pointer transition-transform duration-200 
                 hover:scale-110 hover:z-50"
      style={{ width: "48px" }}
    >
      {/* Pin-Shaped Marker with Number */}
      <div className="relative flex flex-col items-center">
        {/* Pin Head (Circle with Number) */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center 
                     shadow-lg transition-all duration-200 group-hover:shadow-xl
                     border-3 border-white dark:border-slate-800"
          style={{ backgroundColor: markerColor }}
        >
          {/* Large Centered Number */}
          <span className="text-white font-bold text-xl leading-none">
            {index + 1}
          </span>
        </div>

        {/* Pin Pointer (Teardrop bottom) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[42px]"
          style={{
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: `12px solid ${markerColor}`,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          }}
        />

        {/* Shadow circle at bottom for depth */}
        <div
          className="absolute top-[54px] left-1/2 -translate-x-1/2 w-3 h-1.5 
                     bg-black/20 rounded-full blur-sm"
        />
      </div>

      {/* Hover Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3
                 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                 pointer-events-none whitespace-nowrap z-50"
      >
        <div
          className="bg-gray-900 dark:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 
                   rounded-lg shadow-lg dark:shadow-sky-500/20 dark:border dark:border-slate-700"
        >
          {location.name}
        </div>
        <div
          className="absolute top-full left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: "4px solid #111827",
          }}
        />
      </div>
    </div>
  );
}
