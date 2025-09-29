const TravelPreferences = ({
  formData,
  handleInputChange,
  handleMultiSelect,
  isEditing = false,
}) => {
  // Match the trip types from TravelStyleStep.jsx
  const tripTypes = [
    { id: "adventure", label: "Adventure & Outdoor activities" },
    { id: "beach", label: "Beach & Island getaways" },
    { id: "cultural", label: "Cultural & Historical sites" },
    { id: "nature", label: "Nature & Wildlife experiences" },
    { id: "photography", label: "Photography & Scenic tours" },
    { id: "wellness", label: "Wellness & Spa retreats" },
    { id: "food", label: "Food & Culinary experiences" },
    { id: "romantic", label: "Romantic getaways" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Preferred Trip Types
        </label>
        <div className="grid grid-cols-1 gap-2">
          {tripTypes.map((type) => (
            <button
              key={type.id}
              onClick={() =>
                isEditing && handleMultiSelect("preferredTripTypes", type.id)
              }
              disabled={!isEditing}
              className={`p-4 rounded-xl border-2 text-left font-medium transition-all duration-200 ${
                isEditing
                  ? "cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-blue-300 hover:bg-blue-50"
                  : "cursor-not-allowed"
              } ${
                formData.preferredTripTypes?.includes(type.id)
                  ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : isEditing
                  ? "border-blue-200 bg-white text-gray-700"
                  : "border-gray-300 bg-gray-100 text-gray-500"
              }`}
            >
              {type.label}
              {formData.preferredTripTypes?.includes(type.id) && (
                <span className="ml-auto float-right text-white">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Budget Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "budget", label: "Budget", range: "₱2,000 - ₱8,000" },
            {
              value: "moderate",
              label: "Moderate",
              range: "₱8,000 - ₱20,000",
            },
            { value: "luxury", label: "Luxury", range: "₱20,000+" },
            { value: "flexible", label: "Flexible", range: "It depends" },
          ].map((budget) => (
            <button
              key={budget.value}
              onClick={() =>
                isEditing && handleInputChange("budgetRange", budget.value)
              }
              disabled={!isEditing}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                isEditing
                  ? "cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-amber-300 hover:bg-amber-50"
                  : "cursor-not-allowed"
              } ${
                formData.budgetRange === budget.value
                  ? "border-amber-400 bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md"
                  : isEditing
                  ? "border-blue-200 bg-white text-gray-900"
                  : "border-gray-300 bg-gray-100 text-gray-500"
              }`}
            >
              <div className="font-medium">{budget.label}</div>
              <div className="text-sm opacity-70">{budget.range}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Travel Style
        </label>
        <div className="grid grid-cols-1 gap-3">
          {[
            { value: "solo", label: "Solo - I love exploring on my own" },
            { value: "couple", label: "With my partner/spouse" },
            { value: "family", label: "Family trips with kids" },
            { value: "group", label: "Group trips with friends" },
            { value: "business", label: "Business/work travel" },
          ].map((style) => (
            <button
              key={style.value}
              onClick={() =>
                isEditing && handleInputChange("travelStyle", style.value)
              }
              disabled={!isEditing}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                isEditing
                  ? "cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-red-300 hover:bg-red-50"
                  : "cursor-not-allowed"
              } ${
                formData.travelStyle === style.value
                  ? "border-red-400 bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md"
                  : isEditing
                  ? "border-blue-200 bg-white text-gray-900"
                  : "border-gray-300 bg-gray-100 text-gray-500"
              }`}
            >
              <span className="font-medium">{style.label}</span>
              {formData.travelStyle === style.value && (
                <span className="ml-auto float-right text-white">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TravelPreferences;
