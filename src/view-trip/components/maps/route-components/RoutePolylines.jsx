import React, { useMemo } from "react";
import { useMap } from "@vis.gl/react-google-maps";

/**
 * RoutePolylines Component
 * Renders geodesic polylines connecting activities per day
 *
 * Features:
 * - Day-aware color coding matching markers
 * - Geodesic curves for realistic Earth curvature
 * - Only shows routes for selected day (or all if "all" selected)
 * - Animated stroke for better visibility
 * - Arrow decorations showing direction
 */
export function RoutePolylines({
  filteredLocations,
  selectedDay,
  getMarkerColor,
}) {
  const map = useMap();

  // Group locations by day and create polyline paths
  const routesByDay = useMemo(() => {
    if (!filteredLocations || filteredLocations.length === 0) return {};

    const grouped = {};

    filteredLocations.forEach((location) => {
      if (!location.coordinates) return;

      const day = location.day;
      if (!grouped[day]) {
        grouped[day] = [];
      }

      grouped[day].push({
        lat: location.coordinates.latitude,
        lng: location.coordinates.longitude,
      });
    });

    // Only keep days with 2+ locations (need at least 2 points for a line)
    Object.keys(grouped).forEach((day) => {
      if (grouped[day].length < 2) {
        delete grouped[day];
      }
    });

    return grouped;
  }, [filteredLocations]);

  // Draw polylines when map and routes are ready
  React.useEffect(() => {
    if (!map || !window.google) return;

    const polylines = [];

    Object.entries(routesByDay).forEach(([day, path]) => {
      const dayNumber = parseInt(day);
      const color = getMarkerColor(dayNumber);

      // Create geodesic polyline with enhanced styling
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true, // Follow Earth's curvature
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map,
        zIndex: selectedDay === "all" ? dayNumber : 100,
      });

      // Add arrow symbols to show direction
      const lineSymbol = {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 4,
        strokeColor: color,
        strokeOpacity: 1,
        fillColor: color,
        fillOpacity: 0.9,
      };

      polyline.setOptions({
        icons: [
          {
            icon: lineSymbol,
            offset: "0", // Start
          },
          {
            icon: lineSymbol,
            offset: "50%", // Middle
          },
          {
            icon: lineSymbol,
            offset: "100%", // End
          },
        ],
      });

      // Add hover effect
      window.google.maps.event.addListener(polyline, "mouseover", function () {
        polyline.setOptions({
          strokeWeight: 7,
          strokeOpacity: 1,
          zIndex: 1000,
        });
      });

      window.google.maps.event.addListener(polyline, "mouseout", function () {
        polyline.setOptions({
          strokeWeight: 5,
          strokeOpacity: 0.8,
          zIndex: selectedDay === "all" ? dayNumber : 100,
        });
      });

      polylines.push(polyline);
    });

    // Cleanup polylines on unmount or when dependencies change
    return () => {
      polylines.forEach((polyline) => polyline.setMap(null));
    };
  }, [map, routesByDay, getMarkerColor, selectedDay]);

  // This component doesn't render DOM elements, it uses Google Maps API directly
  return null;
}
