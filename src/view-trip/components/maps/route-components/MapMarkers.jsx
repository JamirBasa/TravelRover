import React, { useState, useEffect } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

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
 * Renders a custom marker with image thumbnail and number badge
 */
function CustomMarkerContent({ location, index, markerColor }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Try to get place photo
    if (location.name && !imageError) {
      getLocationImage(location).then((url) => {
        if (url) {
          setImageUrl(url);
        } else {
          setImageError(true);
        }
      });
    }
  }, [location.name, imageError]);

  /**
   * Get location image from various sources
   * Priority: location.photoUrl > Unsplash API > fallback icon
   */
  const getLocationImage = async (location) => {
    // 1. Check if location already has a photo URL
    if (location.photoUrl) {
      return location.photoUrl;
    }

    // 2. Try Unsplash API for generic travel photos (no API key needed for basic usage)
    try {
      const query = encodeURIComponent(
        `${location.name} landmark tourist attraction`
      );
      const unsplashUrl = `https://source.unsplash.com/100x100/?${query}`;

      // Test if image loads
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(unsplashUrl);
        img.onerror = () => resolve(null);
        img.src = unsplashUrl;
      });
    } catch (error) {
      // Silently return null if image fetch fails
      return null;
    }
  };

  return (
    <div
      className="relative group cursor-pointer transition-transform duration-200 
                 hover:scale-110 hover:z-50"
      style={{ width: "56px" }}
    >
      {/* Marker Container */}
      <div className="relative">
        {/* Image Container */}
        <div
          className="w-14 h-14 rounded-full overflow-hidden border-4 shadow-lg
                   transition-all duration-200 group-hover:shadow-xl"
          style={{ borderColor: markerColor }}
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={location.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: markerColor }}
            >
              <MapPin className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Number Badge */}
        <div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center 
                   justify-center text-white font-bold text-xs shadow-md border-2 
                   border-white z-10 transition-transform group-hover:scale-125"
          style={{ backgroundColor: markerColor }}
        >
          {index + 1}
        </div>

        {/* Pointer/Arrow at bottom */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full"
          style={{
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `8px solid ${markerColor}`,
          }}
        />
      </div>

      {/* Hover Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                 pointer-events-none whitespace-nowrap"
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
