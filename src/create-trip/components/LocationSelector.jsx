// src/create-trip/components/LocationSelector.jsx
import { PlacesAutocomplete } from "../../components/common/PlacesAutocomplete";
import { FaMapMarkerAlt, FaGlobe } from "react-icons/fa";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function LocationSelector({ place, onPlaceChange, isPreFilled, categoryData }) {
  const [loadingDestination, setLoadingDestination] = useState(null);

  // Simplified handler - only need to manage the place object
  const handlePlaceChange = (selectedPlace) => {
    onPlaceChange(selectedPlace);
  };

  // ✅ FIXED: Smart multi-strategy search for all destination types
  const handleQuickSelect = async (destination) => {
    // Check if Google Maps is loaded
    if (!window.google?.maps?.places) {
      toast.error("Google Maps is still loading", {
        description: "Please wait a moment and try again",
        duration: 3000,
      });
      return;
    }

    setLoadingDestination(destination.city);

    try {
      const service = new window.google.maps.places.AutocompleteService();

      // Strategy 1: Try as city first
      let searchQuery = `${destination.city}, Philippines`;
      let searchTypes = ["(cities)"];

      console.log(`🔍 Searching for: "${searchQuery}" as city...`);

      const trySearch = (query, types) => {
        return new Promise((resolve) => {
          const request = {
            input: query,
            componentRestrictions: { country: "ph" },
            types: types,
          };

          service.getPlacePredictions(request, (predictions, status) => {
            resolve({ predictions, status });
          });
        });
      };

      // Try city search first
      let result = await trySearch(searchQuery, searchTypes);

      // Strategy 2: If no results, try without type restriction (for districts, landmarks)
      if (
        result.status !== window.google.maps.places.PlacesServiceStatus.OK ||
        !result.predictions?.length
      ) {
        console.log(`⚠️ City search failed, trying general search...`);
        result = await trySearch(searchQuery, []); // No type restriction
      }

      // Strategy 3: If still no results and it contains comma (like "Intramuros, Manila"), try just the first part
      if (
        result.status !== window.google.maps.places.PlacesServiceStatus.OK ||
        !result.predictions?.length
      ) {
        if (destination.city.includes(",")) {
          const firstPart = destination.city.split(",")[0].trim();
          console.log(
            `⚠️ General search failed, trying first part: "${firstPart}"`
          );
          searchQuery = `${firstPart}, Philippines`;
          result = await trySearch(searchQuery, []);
        }
      }

      // Check if we got results
      if (
        result.status === window.google.maps.places.PlacesServiceStatus.OK &&
        result.predictions?.length > 0
      ) {
        const prediction = result.predictions[0];

        // Create proper place object with full Google Places data
        const fullPlaceObject = {
          label: prediction.description,
          value: {
            description: prediction.description,
            place_id: prediction.place_id,
            structured_formatting: prediction.structured_formatting,
            terms: prediction.terms,
            types: prediction.types,
          },
        };

        console.log("✅ Quick select found place:", fullPlaceObject);
        onPlaceChange(fullPlaceObject);

        toast.success(`Selected ${destination.city}`, {
          description: `Found: ${prediction.description}`,
          duration: 3000,
        });
      } else {
        console.error("❌ All search strategies failed:", result.status);
        toast.error(`Couldn't load "${destination.city}"`, {
          description: "Please search manually below",
          duration: 4000,
        });
      }

      setLoadingDestination(null);
    } catch (error) {
      console.error("Error in quick select:", error);
      toast.error("Failed to load destination", {
        description: "Please try searching manually",
      });
      setLoadingDestination(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          {isPreFilled
            ? "Perfect! Let's plan your trip"
            : categoryData?.name
            ? `Plan Your ${categoryData.name} Adventure`
            : "Which city would you like to explore?"}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
          {isPreFilled
            ? `You've selected ${place?.label || place?.value?.description} ✈️`
            : categoryData?.name
            ? `We've curated the best ${categoryData.name.toLowerCase()} destinations for you`
            : "Choose a city in the Philippines to start planning your adventure ✈️"}
        </p>
      </div>

      {/* ✅ NEW: Category-based Destination Recommendations */}
      {categoryData?.recommendedDestinations && !place && (
        <div className="mb-6 p-5 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="font-semibold text-sky-900 dark:text-sky-100">
              Recommended {categoryData.name} Destinations
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {categoryData.recommendedDestinations.map((dest, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSelect(dest)}
                disabled={loadingDestination === dest.city}
                className="group text-left p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {loadingDestination === dest.city ? (
                        <div style={{ animation: "spin 1s linear infinite" }}>
                          <Loader2 className="w-4 h-4 text-sky-500 dark:text-sky-400 flex-shrink-0" />
                        </div>
                      ) : (
                        <FaMapMarkerAlt className="text-sky-500 dark:text-sky-400 flex-shrink-0" />
                      )}
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {dest.city}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                      {dest.reason}
                    </p>
                  </div>
                  <div className="text-sky-500 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {loadingDestination === dest.city ? "..." : "→"}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center italic">
            💡 Click any destination or search for your own below
          </p>
        </div>
      )}

      {/* Location Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
            <FaMapMarkerAlt className="inline mr-2 text-sky-500 dark:text-sky-400" />
            {categoryData?.name ? "Or Search Any City" : "City or Region"} *
          </label>
          <PlacesAutocomplete
            value={place}
            onChange={handlePlaceChange}
            placeholder="Search for cities (e.g., Manila, Cebu, Boracay)..."
            countryRestriction={["ph"]}
            restrictToCities={true}
          />
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
            💡 Select a city first. You can list specific places you want to
            visit in a later step.
          </p>
        </div>

        {/* Unified Selection Indicator */}
        {place && (
          <div
            className={`border rounded-lg p-4 shadow-sm ${
              isPreFilled
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                : "bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-200 dark:border-sky-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt
                className={
                  isPreFilled
                    ? "text-green-600 dark:text-green-400"
                    : "text-sky-600 dark:text-sky-400"
                }
              />
              <div className="flex-1">
                <h4
                  className={`font-medium text-sm ${
                    isPreFilled
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-sky-800 dark:text-sky-300"
                  }`}
                >
                  {isPreFilled ? "Your Location" : "Selected City"}
                </h4>
                <p
                  className={`text-base font-semibold ${
                    isPreFilled
                      ? "text-gray-900 dark:text-white"
                      : "text-sky-700 dark:text-sky-300"
                  }`}
                >
                  {place.label}
                </p>
                {!isPreFilled && (
                  <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
                    You'll be able to specify exact places in the next steps
                  </p>
                )}
              </div>
              {!isPreFilled && (
                <div className="w-3 h-3 bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-600 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationSelector;
