// src/create-trip/components/LocationSelector.jsx
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { FaMapMarkerAlt, FaGlobe } from "react-icons/fa";

function LocationSelector({ place, onPlaceChange, onLocationChange }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Where would you like to go?
        </h2>
        <p className="text-gray-600 text-sm">
          Choose your dream destination to start planning
        </p>
      </div>

      {/* Location Input */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaGlobe className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">
                Destination Search
              </h3>
              <p className="text-blue-700 text-sm">
                Start typing any city, landmark, or attraction within the
                Philippines to see suggestions and detailed location options.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-base font-medium text-gray-800 mb-2">
            <FaMapMarkerAlt className="inline mr-2" />
            Destination *
          </label>
          <div className="relative">
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              autocompletionRequest={{
                componentRestrictions: {
                  country: ["ph"],
                },
              }}
              selectProps={{
                value: place,
                onChange: (v) => {
                  onPlaceChange(v);
                  onLocationChange(v?.label);
                },
                placeholder: "Search for cities, attractions, or landmarks...",
                className: "text-base",
                styles: {
                  control: (provided) => ({
                    ...provided,
                    border: "2px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    minHeight: "48px",
                    "&:hover": {
                      borderColor: "#9ca3af",
                    },
                    "&:focus-within": {
                      borderColor: "#000000",
                      boxShadow: "none",
                    },
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: "#9ca3af",
                    fontSize: "16px",
                  }),
                  singleValue: (provided) => ({
                    ...provided,
                    fontSize: "16px",
                    color: "#374151",
                  }),
                },
              }}
            />
          </div>
        </div>

        {place && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium text-sm">
                Selected: {place.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationSelector;
