import { FaUtensils, FaHeart, FaPrayingHands } from "react-icons/fa";

const DietaryCulturalStep = ({
  profileData,
  handleInputChange,
  handleMultiSelect,
}) => {
  // Dietary restrictions with emojis/flags
  const dietaryOptions = [
    {
      id: "halal",
      label: "Halal",
      flag: "🕌",
      desc: "Islamic dietary laws",
    },
    {
      id: "vegetarian",
      label: "Vegetarian",
      flag: "🥗",
      desc: "No meat or fish",
    },
    { id: "vegan", label: "Vegan", flag: "🌱", desc: "No animal products" },
    {
      id: "pescatarian",
      label: "Pescatarian",
      flag: "🐟",
      desc: "Fish but no meat",
    },
    {
      id: "glutenfree",
      label: "Gluten-Free",
      flag: "🌾",
      desc: "No gluten foods",
    },
    {
      id: "dairyfree",
      label: "Dairy-Free",
      flag: "🥛",
      desc: "No dairy products",
    },
    {
      id: "none",
      label: "No Restrictions",
      flag: "🍽️",
      desc: "Open to all cuisines",
    },
  ];

  // Cultural preferences - inclusive of all religions
  const culturalOptions = [
    {
      id: "islamic",
      label: "Islamic-friendly",
      flag: "🕌",
      desc: "Prayer rooms, halal options",
    },
    {
      id: "catholic",
      label: "Catholic-friendly",
      flag: "⛪",
      desc: "Churches, religious sites",
    },
    {
      id: "christian",
      label: "Christian-friendly",
      flag: "✝️",
      desc: "Churches, worship spaces",
    },
    {
      id: "spiritual",
      label: "Spiritual sites",
      flag: "🙏",
      desc: "Temples, meditation centers",
    },
    {
      id: "family",
      label: "Family-oriented",
      flag: "👨‍👩‍👧‍👦",
      desc: "Kid-friendly activities",
    },
    {
      id: "modest",
      label: "Modest dress codes",
      flag: "👔",
      desc: "Conservative dress preferences",
    },
    {
      id: "alcohol_free",
      label: "Alcohol-free",
      flag: "🚫",
      desc: "No alcohol in environment",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-5">
        {/* Dietary Restrictions - 2 Column Grid */}
        <div>
          <div className="mb-3">
            <h3 className="text-base font-bold brand-gradient-text mb-1 flex items-center gap-1.5">
              <FaUtensils className="text-sm" />
              Dietary Needs
            </h3>
            <p className="text-xs text-gray-600">Select all that apply</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {dietaryOptions.map((diet) => {
              const isSelected = profileData.dietaryRestrictions.includes(
                diet.id
              );
              return (
                <div
                  key={diet.id}
                  className={`group flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white shadow-md"
                      : "border-gray-200 bg-white hover:border-sky-400 hover:shadow-sm"
                  }`}
                  onClick={() =>
                    handleMultiSelect("dietaryRestrictions", diet.id)
                  }
                >
                  <div
                    className={`${
                      isSelected
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-sky-100 to-blue-100"
                    } p-2 rounded-lg text-2xl`}
                  >
                    {diet.flag}
                  </div>
                  <div className="flex-1 min-w-0 ml-3">
                    <span
                      className={`font-semibold text-sm block ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {diet.label}
                    </span>
                    <p
                      className={`text-xs mt-0.5 truncate ${
                        isSelected ? "text-white/90" : "text-gray-600"
                      }`}
                    >
                      {diet.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      ✓
                    </span>
                  )}
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
          <div className="mb-3">
            <h3 className="text-base font-bold brand-gradient-text mb-1 flex items-center gap-1.5">
              <FaHeart className="text-sm" />
              Cultural Considerations
            </h3>
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
                  className={`group flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white shadow-md"
                      : "border-gray-200 bg-white hover:border-sky-400 hover:shadow-sm"
                  }`}
                  onClick={() =>
                    handleMultiSelect("culturalPreferences", culture.id)
                  }
                >
                  <div
                    className={`${
                      isSelected
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-sky-100 to-blue-100"
                    } p-2 rounded-lg text-2xl`}
                  >
                    {culture.flag}
                  </div>
                  <div className="flex-1 min-w-0 ml-3">
                    <span
                      className={`font-semibold text-sm block ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {culture.label}
                    </span>
                    <p
                      className={`text-xs mt-0.5 truncate ${
                        isSelected ? "text-white/90" : "text-gray-600"
                      }`}
                    >
                      {culture.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
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
  );
};

export default DietaryCulturalStep;
