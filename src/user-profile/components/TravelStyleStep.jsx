import {
  FaMountain,
  FaUmbrellaBeach,
  FaCity,
  FaLeaf,
  FaCameraRetro,
  FaRunning,
  FaUtensils,
  FaHeart,
} from "react-icons/fa";

const TravelStyleStep = ({
  profileData,
  handleInputChange,
  handleMultiSelect,
}) => {
  // Trip type options - clean design with React icons
  const tripTypes = [
    {
      id: "adventure",
      label: "Adventure & Outdoor activities",
      icon: FaMountain,
    },
    {
      id: "beach",
      label: "Beach & Island getaways",
      icon: FaUmbrellaBeach,
    },
    {
      id: "cultural",
      label: "Cultural & Historical sites",
      icon: FaCity,
    },
    {
      id: "nature",
      label: "Nature & Wildlife experiences",
      icon: FaLeaf,
    },
    {
      id: "photography",
      label: "Photography & Scenic tours",
      icon: FaCameraRetro,
    },
    {
      id: "wellness",
      label: "Wellness & Spa retreats",
      icon: FaRunning,
    },
    {
      id: "food",
      label: "Food & Culinary experiences",
      icon: FaUtensils,
    },
    {
      id: "romantic",
      label: "Romantic getaways",
      icon: FaHeart,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-5">
        {/* Trip Types - Compact Grid */}
        <div>
          <div className="mb-3">
            <h3 className="text-base font-bold brand-gradient-text mb-1">
              Preferred Trip Types
            </h3>
            <p className="text-xs text-gray-600">Select activities you enjoy</p>
          </div>
          <div className="space-y-2">
            {tripTypes.map((type) => {
              const IconComponent = type.icon;
              const isSelected = profileData.preferredTripTypes.includes(
                type.id
              );
              return (
                <div
                  key={type.id}
                  className={`group flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white shadow-md"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500"
                  }`}
                  onClick={() =>
                    handleMultiSelect("preferredTripTypes", type.id)
                  }
                >
                  <div
                    className={`${
                      isSelected
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-sky-100 to-blue-100"
                    } p-2 rounded-lg mr-3`}
                  >
                    <IconComponent
                      className={`text-lg ${
                        isSelected ? "text-white" : "text-sky-600"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-medium text-sm flex-1 ${
                      isSelected ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {type.label}
                  </span>
                  {isSelected && (
                    <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Budget & Travel Style */}
        <div className="space-y-5">
          {/* Budget Selection - Compact */}
          <div>
            <div className="mb-3">
              <h3 className="text-base font-bold brand-gradient-text mb-1">
                Budget Per Trip
              </h3>
            </div>
            <div className="mb-2 p-2.5 bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-lg">
              <div className="space-y-0.5 text-xs text-gray-700">
                <div className="flex gap-2">
                  <span className="font-semibold text-sky-600 min-w-[55px]">
                    Budget:
                  </span>
                  <span>₱2-8k/day</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-sky-600 min-w-[55px]">
                    Moderate:
                  </span>
                  <span>₱8-20k/day</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-sky-600 min-w-[55px]">
                    Luxury:
                  </span>
                  <span>₱20k+/day</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "budget", label: "Budget", range: "₱2-8k" },
                { value: "moderate", label: "Moderate", range: "₱8-20k" },
                { value: "luxury", label: "Luxury", range: "₱20k+" },
                { value: "flexible", label: "Flexible", range: "Varies" },
              ].map((budget) => {
                const isSelected = profileData.budgetRange === budget.value;
                return (
                  <div
                    key={budget.value}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-sky-500 brand-gradient text-white shadow-md"
                        : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500"
                    }`}
                    onClick={() =>
                      handleInputChange("budgetRange", budget.value)
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className={`font-semibold text-sm ${
                          isSelected ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {budget.label}
                      </div>
                      {isSelected && (
                        <span className="text-white bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs ${
                        isSelected ? "text-white/90" : "text-sky-600"
                      }`}
                    >
                      {budget.range}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Travel Style - Compact */}
          <div>
            <div className="mb-3">
              <h3 className="text-base font-bold brand-gradient-text mb-1">
                Travel Style
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { value: "solo", label: "Solo traveler", icon: "🧳" },
                { value: "couple", label: "With partner", icon: "💑" },
                { value: "family", label: "Family trips", icon: "👨‍👩‍👧‍👦" },
                { value: "group", label: "With friends", icon: "👥" },
                { value: "business", label: "Business", icon: "💼" },
              ].map((style) => {
                const isSelected = profileData.travelStyle === style.value;
                return (
                  <div
                    key={style.value}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-sky-500 brand-gradient text-white shadow-md"
                        : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500"
                    }`}
                    onClick={() =>
                      handleInputChange("travelStyle", style.value)
                    }
                  >
                    <div
                      className={`${
                        isSelected
                          ? "bg-white/20"
                          : "bg-gradient-to-br from-sky-100 to-blue-100"
                      } p-2 rounded-lg mr-3 text-lg`}
                    >
                      {style.icon}
                    </div>
                    <span
                      className={`font-medium text-sm flex-1 ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {style.label}
                    </span>
                    {isSelected && (
                      <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelStyleStep;
