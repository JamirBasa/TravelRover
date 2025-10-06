// src/create-trip/components/LocationSelector.jsx
import { PlacesAutocomplete } from "../../components/common/PlacesAutocomplete";
import { FaMapMarkerAlt, FaGlobe } from "react-icons/fa";

function LocationSelector({ place, onPlaceChange, onLocationChange }) {
  const handlePlaceChange = (selectedPlace) => {
    onPlaceChange(selectedPlace);
    if (selectedPlace) {
      onLocationChange(selectedPlace.label);
    } else {
      onLocationChange("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          {isPreFilled ? "Perfect! Let's plan your trip" : "Where would you like to go?"}
        </h2>
        <p className="text-gray-700 text-base font-medium">
          {isPreFilled 
            ? `You've selected ${place?.label || place?.value?.description} ✈️` 
            : "Choose your dream destination to start planning ✈️"
          }
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
                Destination Search
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {isPreFilled 
                  ? "You can change your destination or continue with your selection"
                  : "Start typing any city, landmark, or attraction within the Philippines to see suggestions and detailed location options."
                }
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-800 mb-3">
            <FaMapMarkerAlt className="inline mr-2 text-sky-500" />
            Destination *
          </label>
          <PlacesAutocomplete
            value={place}
            onChange={handlePlaceChange}
            placeholder="Search for cities, attractions, or landmarks..."
            countryRestriction={["ph"]}
          />
        </div>

        {/* Pre-filled Location Indicator */}
        {isPreFilled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">
                  Destination Selected
                </h4>
                <p className="text-green-700 text-sm">
                  Ready to explore {place?.label || place?.value?.description}! 
                  You can change this anytime or continue to the next step.
                </p>
              </div>
            </div>
          </div>
        )}

        {place && (
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sky-800 font-semibold text-sm">
                ✅ Selected: {place.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationSelector;
