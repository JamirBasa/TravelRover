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
    <div className="space-y-8">
      {!isEditing && (
        <div className="brand-card border-sky-200 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="brand-gradient p-2 rounded-full">
              <span className="text-white text-sm">🔒</span>
            </div>
            <div>
              <span className="font-semibold brand-gradient-text">
                View Mode
              </span>
              <p className="text-gray-600 text-sm mt-1">
                Click "Edit Profile" to modify your travel preferences
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold brand-gradient-text mb-2">
            Preferred Trip Types
          </h3>
          <div className="w-16 h-1 brand-gradient rounded-full"></div>
          {isEditing && (
            <span className="inline-block mt-2 text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full">
              Editable
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {tripTypes.map((type) => (
            <button
              key={type.id}
              onClick={() =>
                isEditing && handleMultiSelect("preferredTripTypes", type.id)
              }
              disabled={!isEditing}
              className={`group p-4 rounded-xl border-2 text-left font-medium transition-all duration-200 relative ${
                isEditing
                  ? "cursor-pointer transform hover:scale-[1.02] hover:shadow-lg hover:border-sky-400 hover:bg-sky-50"
                  : "cursor-not-allowed opacity-70"
              } ${
                formData.preferredTripTypes?.includes(type.id)
                  ? "border-sky-500 brand-gradient text-white shadow-lg"
                  : isEditing
                  ? "border-gray-200 bg-white text-gray-800 hover:border-sky-300"
                  : "border-gray-300 bg-gray-50 text-gray-400"
              } ${
                !isEditing
                  ? "after:content-['🔒'] after:absolute after:top-2 after:right-2 after:text-gray-400"
                  : ""
              }`}
            >
              <span className="flex items-center justify-between w-full">
                <span>{type.label}</span>
                {formData.preferredTripTypes?.includes(type.id) && (
                  <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    ✓
                  </span>
                )}
                {isEditing &&
                  !formData.preferredTripTypes?.includes(type.id) && (
                    <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to select
                    </span>
                  )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold brand-gradient-text mb-2">
            Budget Range
          </h3>
          <div className="w-16 h-1 brand-gradient rounded-full"></div>
          {isEditing && (
            <span className="inline-block mt-2 text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full">
              Editable
            </span>
          )}
        </div>
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
              className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 relative ${
                isEditing
                  ? "cursor-pointer transform hover:scale-[1.02] hover:shadow-lg hover:border-sky-400 hover:bg-sky-50"
                  : "cursor-not-allowed opacity-70"
              } ${
                formData.budgetRange === budget.value
                  ? "border-sky-500 brand-gradient text-white shadow-lg"
                  : isEditing
                  ? "border-gray-200 bg-white text-gray-800 hover:border-sky-300"
                  : "border-gray-300 bg-gray-50 text-gray-400"
              } ${
                !isEditing
                  ? "after:content-['🔒'] after:absolute after:top-2 after:right-2 after:text-gray-400"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{budget.label}</div>
                  <div className="text-sm opacity-70">{budget.range}</div>
                </div>
                {formData.budgetRange === budget.value && (
                  <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    ✓
                  </span>
                )}
                {isEditing && formData.budgetRange !== budget.value && (
                  <span className="text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Select
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold brand-gradient-text mb-2">
            Travel Style
          </h3>
          <div className="w-16 h-1 brand-gradient rounded-full"></div>
          {isEditing && (
            <span className="inline-block mt-2 text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full">
              Editable
            </span>
          )}
        </div>
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
              className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 relative ${
                isEditing
                  ? "cursor-pointer transform hover:scale-[1.02] hover:shadow-lg hover:border-sky-400 hover:bg-sky-50"
                  : "cursor-not-allowed opacity-70"
              } ${
                formData.travelStyle === style.value
                  ? "border-sky-500 brand-gradient text-white shadow-lg"
                  : isEditing
                  ? "border-gray-200 bg-white text-gray-800 hover:border-sky-300"
                  : "border-gray-300 bg-gray-50 text-gray-400"
              } ${
                !isEditing
                  ? "after:content-['🔒'] after:absolute after:top-2 after:right-2 after:text-gray-400"
                  : ""
              }`}
            >
              <span className="flex items-center justify-between w-full">
                <span className="font-medium">{style.label}</span>
                {formData.travelStyle === style.value && (
                  <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    ✓
                  </span>
                )}
                {isEditing && formData.travelStyle !== style.value && (
                  <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to select
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TravelPreferences;
