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
        <div className="space-y-3">
          {tripTypes.map((type) => {
            const isSelected = formData.preferredTripTypes?.includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() =>
                  isEditing && handleMultiSelect("preferredTripTypes", type.id)
                }
                disabled={!isEditing}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isEditing
                    ? "cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-blue-300 hover:bg-blue-50"
                    : "cursor-not-allowed"
                } ${
                  isSelected
                    ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : isEditing
                    ? "border-blue-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                <span className="font-medium">{type.label}</span>
                {isSelected && <span className="ml-auto text-white">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Budget Range
        </label>
        <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <p className="text-sm text-blue-700 font-semibold mb-2">
            💡 Price Guide (per day):
          </p>
          <div className="space-y-1.5 text-xs text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 min-w-[75px]">
                Budget:
              </span>
              <span>
                ₱2,000-8,000 - Hostels, local eateries, public transport
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 min-w-[75px]">
                Moderate:
              </span>
              <span>
                ₱8,000-20,000 - 3-star hotels, casual dining, mix of transport
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 min-w-[75px]">
                Luxury:
              </span>
              <span>
                ₱20,000+ - Premium hotels, fine dining, private transport
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 min-w-[75px]">
                Flexible:
              </span>
              <span>Budget varies based on destination and availability</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { value: "budget", label: "Budget", range: "₱2,000 - ₱8,000" },
            {
              value: "moderate",
              label: "Moderate",
              range: "₱8,000 - ₱20,000",
            },
            { value: "luxury", label: "Luxury", range: "₱20,000+" },
            { value: "flexible", label: "Flexible", range: "It depends" },
          ].map((budget) => {
            const isSelected = formData.budgetRange === budget.value;
            return (
              <button
                key={budget.value}
                onClick={() =>
                  isEditing && handleInputChange("budgetRange", budget.value)
                }
                disabled={!isEditing}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isEditing
                    ? "cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-blue-300 hover:bg-blue-50"
                    : "cursor-not-allowed"
                } ${
                  isSelected
                    ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : isEditing
                    ? "border-blue-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                <div>
                  <div className="font-medium">{budget.label}</div>
                  <div
                    className={`text-sm ${
                      isSelected ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {budget.range}
                  </div>
                </div>
                {isSelected && <span className="ml-auto text-white">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Travel Style
        </label>
        <div className="space-y-3">
          {[
            { value: "solo", label: "Solo - I love exploring on my own" },
            { value: "couple", label: "With my partner/spouse" },
            { value: "family", label: "Family trips with kids" },
            { value: "group", label: "Group trips with friends" },
            { value: "business", label: "Business/work travel" },
          ].map((style) => {
            const isSelected = formData.travelStyle === style.value;
            return (
              <button
                key={style.value}
                onClick={() =>
                  isEditing && handleInputChange("travelStyle", style.value)
                }
                disabled={!isEditing}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isEditing
                    ? "cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-blue-300 hover:bg-blue-50"
                    : "cursor-not-allowed"
                } ${
                  isSelected
                    ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : isEditing
                    ? "border-blue-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                <span className="font-medium">{style.label}</span>
                {isSelected && <span className="ml-auto text-white">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TravelPreferences;
