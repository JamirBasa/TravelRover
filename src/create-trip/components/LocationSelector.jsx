// src/create-trip/components/LocationSelector.jsx
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { FaMapMarkerAlt, FaGlobe } from "react-icons/fa";

function LocationSelector({ place, onPlaceChange, onLocationChange }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Where would you like to go?
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Choose your dream destination to start planning ✈️
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
                Start typing any city, landmark, or attraction within the
                Philippines to see suggestions and detailed location options.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-800 mb-3">
            <FaMapMarkerAlt className="inline mr-2 text-sky-500" />
            Destination *
          </label>
          <div className="relative">
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
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
                      borderColor: "#0ea5e9",
                      boxShadow: "0 0 0 3px rgba(14, 165, 233, 0.1)",
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
