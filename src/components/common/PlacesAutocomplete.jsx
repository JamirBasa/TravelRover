// src/components/common/PlacesAutocomplete.jsx
// Modern Google Places Autocomplete using new API (recommended as of March 2025)

import { useState, useEffect, useRef, useCallback } from "react";
import { FaMapMarkerAlt, FaTimes } from "react-icons/fa";

/**
 * Custom Places Autocomplete Component
 * Uses the new google.maps.places.AutocompleteSuggestion API
 * Addresses Google Maps deprecation warnings and performance issues
 */
export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a location...",
  countryRestriction = ["ph"],
  className = "",
  disabled = false,
}) {
  const [inputValue, setInputValue] = useState(value?.label || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);

  // Initialize Google Maps services
  useEffect(() => {
    const initMap = () => {
      // Check if Google Maps is already loaded
      if (window.google?.maps?.places) {
        initializeServices();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          setTimeout(initializeServices, 100);
        });
        return;
      }

      // Load the script
      loadGoogleMapsScript();
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadGoogleMapsScript = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      setError("Google Maps API key is missing. Please check your .env file.");
      console.error("VITE_GOOGLE_PLACES_API_KEY is not defined");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("✅ Google Maps loaded successfully");
      // Wait longer for the places library to be fully available
      setTimeout(initializeServices, 500);
    };

    script.onerror = () => {
      const errorMsg =
        "Failed to load Google Maps. Please check your API key and internet connection.";
      setError(errorMsg);
      console.error(errorMsg);
    };

    document.head.appendChild(script);
  };

  const initializeServices = (retryCount = 0) => {
    const maxRetries = 10;

    try {
      if (!window.google) {
        if (retryCount < maxRetries) {
          console.warn(
            `Google Maps not loaded yet, retrying... (${
              retryCount + 1
            }/${maxRetries})`
          );
          setTimeout(() => initializeServices(retryCount + 1), 300);
        } else {
          setError("Failed to load Google Maps after multiple attempts");
        }
        return;
      }

      if (!window.google.maps) {
        if (retryCount < maxRetries) {
          console.warn(
            `Google Maps object not ready, retrying... (${
              retryCount + 1
            }/${maxRetries})`
          );
          setTimeout(() => initializeServices(retryCount + 1), 300);
        } else {
          setError("Google Maps object not available");
        }
        return;
      }

      if (!window.google.maps.places) {
        if (retryCount < maxRetries) {
          console.warn(
            `Google Places library not ready, retrying... (${
              retryCount + 1
            }/${maxRetries})`
          );
          setTimeout(() => initializeServices(retryCount + 1), 300);
        } else {
          console.error("Google Maps Places library not loaded after retries");
          setError(
            "Google Maps Places API not available. Please enable Maps JavaScript API in Google Cloud Console."
          );
        }
        return;
      }

      // Initialize services
      // Note: Google shows deprecation warnings for AutocompleteService and PlacesService
      // These are still fully supported with 12+ months notice before discontinuation
      // Migration to new Place API will be done in a future update
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();

      // Create a session token for billing optimization
      sessionToken.current =
        new window.google.maps.places.AutocompleteSessionToken();

      // Create a temporary div for PlacesService (required by API)
      const div = document.createElement("div");
      placesService.current = new window.google.maps.places.PlacesService(div);

      console.log("✅ Google Places services initialized successfully");
      setError(null);
    } catch (err) {
      console.error("Error initializing Google Places services:", err);
      setError("Failed to initialize location services: " + err.message);
    }
  };

  // Debounced search function
  const searchPlaces = useCallback(
    async (searchText) => {
      if (!searchText || searchText.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      if (!autocompleteService.current) {
        console.warn("Autocomplete service not initialized yet");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const request = {
          input: searchText,
          componentRestrictions: { country: countryRestriction },
          sessionToken: sessionToken.current,
        };

        autocompleteService.current.getPlacePredictions(
          request,
          (predictions, status) => {
            setIsLoading(false);

            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setSuggestions(
                predictions.map((prediction) => ({
                  placeId: prediction.place_id,
                  description: prediction.description,
                  mainText: prediction.structured_formatting.main_text,
                  secondaryText:
                    prediction.structured_formatting.secondary_text,
                }))
              );
              setShowDropdown(true);
            } else if (
              status ===
              window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              setSuggestions([]);
              setShowDropdown(false);
            } else {
              console.error("Places API error:", status);
              setError("Error searching locations. Please try again.");
              setSuggestions([]);
            }
          }
        );
      } catch (err) {
        console.error("Error in searchPlaces:", err);
        setError("Search error. Please try again.");
        setIsLoading(false);
      }
    },
    [countryRestriction]
  );

  // Debounce timer
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, searchPlaces]);

  // Handle place selection
  const handleSelectPlace = (suggestion) => {
    if (!placesService.current) {
      console.error("Places service not initialized");
      return;
    }

    setInputValue(suggestion.description);
    setShowDropdown(false);
    setSuggestions([]);

    // Get detailed place information
    const request = {
      placeId: suggestion.placeId,
      fields: ["name", "formatted_address", "geometry", "place_id"],
      sessionToken: sessionToken.current,
    };

    placesService.current.getDetails(request, (place, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        const placeData = {
          label: suggestion.description,
          value: {
            place_id: place.place_id,
            description: suggestion.description,
            structured_formatting: {
              main_text: suggestion.mainText,
              secondary_text: suggestion.secondaryText,
            },
          },
        };

        onChange(placeData);
        if (onPlaceSelect) {
          onPlaceSelect(place);
        }

        // Create a new session token after selection (best practice)
        sessionToken.current =
          new window.google.maps.places.AutocompleteSessionToken();
      }
    });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectPlace(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear input
  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setShowDropdown(false);
    onChange(null);
    if (onPlaceSelect) {
      onPlaceSelect(null);
    }
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 pr-10 text-base border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
        />

        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear input"
          >
            <FaTimes className="text-lg" />
          </button>
        )}

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSelectPlace(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-sky-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? "bg-sky-100" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-sky-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {suggestion.mainText}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {suggestion.secondaryText}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* No results */}
      {showDropdown &&
        !isLoading &&
        suggestions.length === 0 &&
        inputValue.length >= 3 && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 text-center text-gray-500">
            No locations found. Try a different search term.
          </div>
        )}
    </div>
  );
}

export default PlacesAutocomplete;
