// src/create-trip/components/LocationSelector.jsx
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

function LocationSelector({ place, onPlaceChange, onLocationChange }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl mb-3 font-medium">Where would you like to go?</h2>
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
        }}
      />
    </div>
  );
}

export default LocationSelector;
