// src/create-trip/components/LocationSelector.jsx
import { PlacesAutocomplete } from "../../components/common/PlacesAutocomplete";
import { MapPin, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function LocationSelector({ place, onPlaceChange, isPreFilled, categoryData }) {
  const [loadingDestination, setLoadingDestination] = useState(null);

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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          {isPreFilled
            ? "Perfect! Let's plan your trip"
            : categoryData?.name
            ? `${categoryData.name} Adventures Await`
            : "Where would you like to go?"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
          {isPreFilled
            ? `You've selected ${place?.label || place?.value?.description}`
            : categoryData?.name
            ? `Discover the best ${categoryData.name.toLowerCase()} destinations in the Philippines`
            : "Choose your destination to start planning your adventure"}
        </p>
      </div>

      {/* Quick Select Recommendations */}
      {categoryData?.recommendedDestinations && !place && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Popular {categoryData.name} Destinations
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {categoryData.recommendedDestinations.map((dest, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSelect(dest)}
                disabled={loadingDestination === dest.city}
                className="group relative overflow-hidden text-left p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {/* Hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex items-center gap-4">
                  {/* Icon */}
                  <div className="shrink-0">
                    {loadingDestination === dest.city ? (
                      <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {dest.city}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {dest.reason}
                    </p>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="shrink-0">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            <MapPin className="inline mr-2 text-sky-500" />
            {categoryData?.name && !place ? "Or search for another destination" : "Search Destination"} *
          </label>
          
          <div className="relative">
            <PlacesAutocomplete
              value={place}
              onChange={handlePlaceChange}
              placeholder="e.g., Manila, Palawan, Boracay..."
              countryRestriction={["ph"]}
              restrictToCities={true}
            />
          </div>
          
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Select your primary destination. You can add specific places later.
          </p>
        </div>

        {/* Selection Confirmation Card */}
        {place && (
          <div className="p-5 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-2 border-sky-200 dark:border-sky-800 rounded-xl animate-fade-in-scale">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sky-700 dark:text-sky-400 mb-1">
                  {isPreFilled ? "Your Selected Location" : "✓ Destination Selected"}
                </p>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {place.label}
                </h4>
              </div>
              
              {!isPreFilled && (
                <div className="shrink-0 w-3 h-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 animate-pulse shadow-lg" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationSelector;
