import React, { useState, useEffect } from "react";
import { InfoWindow } from "@vis.gl/react-google-maps";
import { Badge } from "@/components/ui/badge";
import { Clock, Navigation, ImageIcon } from "lucide-react";
import {
  isValidDuration,
  isValidPricing,
  isValidRating,
} from "./locationDataValidator";
import { buildGooglePlacesQuery } from "@/utils/googlePlacesQueryBuilder";

/**
 * LocationInfoWindow Component
 * Displays detailed information popup when a marker is clicked with place photo
 * ✅ Enhanced with optimized Google Places queries for better photo accuracy
 */
/* global google */
export function LocationInfoWindow({ selectedLocation, onClose, trip }) {
  const [placePhoto, setPlacePhoto] = useState(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);

  useEffect(() => {
    if (!selectedLocation) return;

    // Fetch place photo using Google Places API with optimized query
    const fetchPlacePhoto = async () => {
      setIsLoadingPhoto(true);
      try {
        // ✅ Use optimized query builder for better place results
        const optimizedQuery = buildGooglePlacesQuery(
          { placeName: selectedLocation.name, name: selectedLocation.name },
          trip
        );

        const service = new google.maps.places.PlacesService(
          document.createElement("div")
        );

        const request = {
          query: optimizedQuery || selectedLocation.name,
          fields: ["photos", "name"],
        };

        service.findPlaceFromQuery(request, (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results?.[0]
          ) {
            const place = results[0];
            if (place.photos && place.photos.length > 0) {
              const photoUrl = place.photos[0].getUrl({
                maxWidth: 400,
                maxHeight: 200,
              });
              setPlacePhoto(photoUrl);
            }
          }
          setIsLoadingPhoto(false);
        });
      } catch {
        // Silently handle photo fetch errors
        setIsLoadingPhoto(false);
      }
    };

    fetchPlacePhoto();
  }, [selectedLocation, trip]);

  if (!selectedLocation || !selectedLocation.coordinates) return null;

  return (
    <InfoWindow
      position={{
        lat: selectedLocation.coordinates.latitude,
        lng: selectedLocation.coordinates.longitude,
      }}
      onCloseClick={onClose}
    >
      <div className="max-w-[280px] sm:max-w-xs bg-white dark:bg-slate-900 rounded-lg overflow-hidden">
        {/* Place Photo with Loading State */}
        {isLoadingPhoto ? (
          <div className="relative w-full h-32 bg-gray-200 dark:bg-slate-800 rounded-t-lg overflow-hidden">
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 dark:via-slate-700/60 to-transparent animate-shimmer"
              style={{
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 animate-pulse" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Loading photo...
                </span>
              </div>
            </div>
          </div>
        ) : placePhoto ? (
          <div className="relative w-full h-32 overflow-hidden rounded-t-lg group">
            <img
              src={placePhoto}
              alt={selectedLocation.name}
              className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-blue-100 via-sky-100 to-blue-50 dark:from-blue-950/30 dark:via-sky-950/30 dark:to-blue-900/30 rounded-t-lg flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-blue-400 dark:text-blue-500 mx-auto mb-1" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                No photo available
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-2 bg-white dark:bg-slate-900">
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
            {selectedLocation.name}
          </h4>
          <div className="space-y-2 text-sm">
            <Badge
              variant="outline"
              className="text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300"
            >
              Day {selectedLocation.day} - {selectedLocation.dayTheme}
            </Badge>
            {selectedLocation.time && selectedLocation.time !== "All Day" && (
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {selectedLocation.time}
              </p>
            )}
            {selectedLocation.details &&
              selectedLocation.details.length > 0 && (
                <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                  {selectedLocation.details}
                </p>
              )}

            {/* Duration, Price, and Rating in a row */}
            <div className="flex flex-wrap items-center gap-3">
              {isValidDuration(selectedLocation.duration) && (
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>⏱️</span>
                  <span className="font-medium">
                    {selectedLocation.duration}
                  </span>
                </div>
              )}

              {isValidPricing(selectedLocation.pricing) && (
                <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                  <span>💰</span>
                  <span className="font-semibold">
                    {selectedLocation.pricing}
                  </span>
                </div>
              )}

              {isValidRating(selectedLocation.rating) && (
                <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                  <span>⭐</span>
                  <span className="font-medium">{selectedLocation.rating}</span>
                </div>
              )}
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                selectedLocation.name
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs mt-2"
            >
              <Navigation className="h-3 w-3" />
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </InfoWindow>
  );
}
