import { FaUtensils, FaHeart, FaPrayingHands } from "react-icons/fa";

const DietaryCulturalStep = ({
  profileData,
  handleInputChange,
  handleMultiSelect,
}) => {
  // Dietary restrictions with intuitive emojis
  const dietaryOptions = [
    {
      id: "halal",
      label: "Halal",
      emoji: "☪️",
      desc: "Islamic dietary laws",
    },
    {
      id: "vegetarian",
      label: "Vegetarian",
      emoji: "🥗",
      desc: "No meat or fish",
    },
    { id: "vegan", label: "Vegan", emoji: "🌱", desc: "No animal products" },
    {
      id: "pescatarian",
      label: "Pescatarian",
      emoji: "🐟",
      desc: "Fish but no meat",
    },
    {
      id: "glutenfree",
      label: "Gluten-Free",
      emoji: "🚫🌾",
      desc: "No gluten foods",
    },
    {
      id: "dairyfree",
      label: "Dairy-Free",
      emoji: "🚫🥛",
      desc: "No dairy products",
    },
    {
      id: "none",
      label: "No Restrictions",
      emoji: "🍽️",
      desc: "Open to all cuisines",
    },
  ];

  // Cultural preferences - universal and inclusive
  const culturalOptions = [
    {
      id: "islamic",
      label: "Islamic-friendly",
      emoji: "🕌",
      desc: "Prayer rooms, halal options",
    },
    {
      id: "catholic",
      label: "Catholic-friendly",
      emoji: "⛪",
      desc: "Churches, religious sites",
    },
    {
      id: "christian",
      label: "Christian-friendly",
      emoji: "✝️",
      desc: "Churches, worship spaces",
    },
    {
      id: "spiritual",
      label: "Spiritual sites",
      emoji: "🙏",
      desc: "Temples, meditation centers",
    },
    {
      id: "family",
      label: "Family-oriented",
      emoji: "👨‍👩‍👧‍👦",
      desc: "Kid-friendly activities",
    },
    {
      id: "modest",
      label: "Modest dress codes",
      emoji: "👔",
      desc: "Conservative dress preferences",
    },
    {
      id: "alcohol_free",
      label: "Alcohol-free",
      emoji: "🚫🍺",
      desc: "No alcohol in environment",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Dietary Restrictions - 2 Column Grid */}
        <div>
          <div className="mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="brand-gradient p-1.5 rounded-lg">
                <FaUtensils className="text-white text-base" />
              </div>
              <h3 className="text-base font-bold brand-gradient-text">
                Dietary Preferences
              </h3>
            </div>
            <p className="text-xs text-gray-600">
              Choose dietary restrictions we should consider
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {dietaryOptions.map((diet) => {
              const isSelected = profileData.dietaryRestrictions.includes(
                diet.id
              );
              return (
                <div
                  key={diet.id}
                  className={`group p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white shadow-md"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-sm"
                  }`}
                  onClick={() =>
                    handleMultiSelect("dietaryRestrictions", diet.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`${
                        isSelected
                          ? "bg-white/20"
                          : "bg-gradient-to-br from-sky-100 to-blue-100"
                      } p-2 rounded-lg text-2xl flex-shrink-0`}
                    >
                      {diet.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-semibold text-sm ${
                          isSelected ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {diet.label}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          isSelected ? "text-white/90" : "text-gray-600"
                        }`}
                      >
                        {diet.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Religious Dietary Requirement - Inclusive */}
        <div className="brand-card p-3 border-sky-200">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profileData.isHalal}
              onChange={(e) => handleInputChange("isHalal", e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded transition-all"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="brand-gradient p-1 rounded">
                  <FaPrayingHands className="text-white text-xs" />
                </div>
                <span className="font-bold text-sm brand-gradient-text">
                  Strict Religious Dietary Requirements
                </span>
              </div>
              <p className="text-gray-600 text-xs ml-6">
                Only recommend destinations with verified religious dietary
                options (Halal, Kosher, etc.)
              </p>
            </div>
          </label>
        </div>

        {/* Cultural Considerations - 2 Column Grid */}
        <div>
          <div className="mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="brand-gradient p-1.5 rounded-lg">
                <FaHeart className="text-white text-base" />
              </div>
              <h3 className="text-base font-bold brand-gradient-text">
                Cultural Considerations
              </h3>
            </div>
            <p className="text-xs text-gray-600">
              Select any preferences (optional)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {culturalOptions.map((culture) => {
              const isSelected = profileData.culturalPreferences.includes(
                culture.id
              );
              return (
                <div
                  key={culture.id}
                  className={`group p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white shadow-md"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-sm"
                  }`}
                  onClick={() =>
                    handleMultiSelect("culturalPreferences", culture.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`${
                        isSelected
                          ? "bg-white/20"
                          : "bg-gradient-to-br from-sky-100 to-blue-100"
                      } p-2 rounded-lg text-2xl flex-shrink-0`}
                    >
                      {culture.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-semibold text-sm ${
                          isSelected ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {culture.label}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          isSelected ? "text-white/90" : "text-gray-600"
                        }`}
                      >
                        {culture.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietaryCulturalStep;
