// src/create-trip/components/LocationSelector.jsx
import { PlacesAutocomplete } from "../../components/common/PlacesAutocomplete";
import { FaMapMarkerAlt, FaGlobe } from "react-icons/fa";

function LocationSelector({ place, onPlaceChange, isPreFilled }) {
  // Simplified handler - only need to manage the place object
  const handlePlaceChange = (selectedPlace) => {
    onPlaceChange(selectedPlace);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          {isPreFilled
            ? "Perfect! Let's plan your trip"
            : "Which city would you like to explore?"}
        </h2>
        <p className="text-gray-700 text-base font-medium">
          {isPreFilled
            ? `You've selected ${place?.label || place?.value?.description} ✈️`
            : "Choose a city in the Philippines to start planning your adventure ✈️"}
        </p>
      </div>

      {/* Location Input */}
      <div className="space-y-4">
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaGlobe className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                City-Level Destination
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {isPreFilled
                  ? "You can change your city or continue with your selection"
                  : "Select a city or region. You'll be able to specify exact places you want to visit in a later step for a more personalized itinerary."}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-800 mb-3">
            <FaMapMarkerAlt className="inline mr-2 text-sky-500" />
            City or Region *
          </label>
          <PlacesAutocomplete
            value={place}
            onChange={handlePlaceChange}
            placeholder="Search for cities (e.g., Manila, Cebu, Boracay)..."
            countryRestriction={["ph"]}
            restrictToCities={true}
          />
          <p className="mt-2 text-xs text-gray-600 italic">
            💡 Tip: Select a city first. You can list specific places you want
            to visit in the "Specific Requests" step later.
          </p>
        </div>

        {/* Unified Selection Indicator */}
        {place && (
          <div
            className={`border rounded-lg p-4 shadow-sm ${
              isPreFilled
                ? "bg-green-50 border-green-200"
                : "bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt
                className={isPreFilled ? "text-green-600" : "text-sky-600"}
              />
              <div className="flex-1">
                <h4
                  className={`font-medium ${
                    isPreFilled ? "text-green-800" : "text-sky-800"
                  }`}
                >
                  {isPreFilled ? "Pre-selected City" : "Selected City"}
                </h4>
                <p
                  className={`text-sm ${
                    isPreFilled ? "text-green-700" : "text-sky-700"
                  }`}
                >
                  {place.label}
                  {isPreFilled && " - Ready to continue or change anytime"}
                </p>
                {!isPreFilled && (
                  <p className="text-xs text-sky-600 mt-1">
                    You'll be able to specify exact places in the next steps
                  </p>
                )}
              </div>
              {!isPreFilled && (
                <div className="w-3 h-3 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationSelector;
