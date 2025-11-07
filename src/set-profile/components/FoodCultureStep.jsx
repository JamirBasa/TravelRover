import {
  FaUtensils,
  FaMosque,
  FaLanguage,
  FaLeaf,
  FaHeart,
} from "react-icons/fa";

const FoodCultureStep = ({
  profileData,
  handleInputChange,
  handleMultiSelect,
}) => {
  // Dietary restrictions
  const dietaryOptions = [
    {
      id: "halal",
      label: "Halal",
      icon: FaMosque,
      desc: "Islamic dietary laws",
    },
    {
      id: "vegetarian",
      label: "Vegetarian",
      icon: FaLeaf,
      desc: "No meat or fish",
    },
    { id: "vegan", label: "Vegan", icon: FaLeaf, desc: "No animal products" },
    {
      id: "pescatarian",
      label: "Pescatarian",
      icon: FaUtensils,
      desc: "Fish but no meat",
    },
    {
      id: "glutenfree",
      label: "Gluten-Free",
      icon: FaHeart,
      desc: "No gluten-containing foods",
    },
    {
      id: "dairyfree",
      label: "Dairy-Free",
      icon: FaHeart,
      desc: "No dairy products",
    },
    {
      id: "kosher",
      label: "Kosher",
      icon: FaUtensils,
      desc: "Jewish dietary laws",
    },
    {
      id: "none",
      label: "No Restrictions",
      icon: FaUtensils,
      desc: "Open to all cuisines",
    },
  ];

  // Cultural preferences
  const culturalOptions = [
    {
      id: "islamic",
      label: "Islamic-friendly",
      icon: FaMosque,
      desc: "Prayer facilities, modest environment",
    },
    {
      id: "family",
      label: "Family-oriented",
      icon: FaHeart,
      desc: "Family-friendly activities",
    },
    {
      id: "modest",
      label: "Modest dress codes",
      icon: FaHeart,
      desc: "Conservative dress preferences",
    },
    {
      id: "prayer",
      label: "Prayer facilities",
      icon: FaMosque,
      desc: "Access to prayer rooms/mosques",
    },
    {
      id: "alcohol_free",
      label: "Alcohol-free",
      icon: FaHeart,
      desc: "No alcohol in environment",
    },
  ];

  // Languages
  const languages = [
    { id: "english", label: "English" },
    { id: "filipino", label: "Filipino/Tagalog" },
    { id: "arabic", label: "Arabic" },
    { id: "spanish", label: "Spanish" },
    { id: "mandarin", label: "Mandarin" },
    { id: "japanese", label: "Japanese" },
    { id: "korean", label: "Korean" },
    { id: "french", label: "French" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-2">
          What are your preferences?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Help us recommend culturally appropriate destinations and dining
        </p>
      </div>

      <div className="space-y-6">
        {/* Dietary Restrictions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold brand-gradient-text mb-4 flex items-center">
            <div className="brand-gradient p-1.5 rounded-lg mr-2">
              <FaUtensils className="text-white" />
            </div>
            What are your dietary needs?
          </h3>
          <div className="space-y-3">
            {dietaryOptions.map((diet) => {
              const IconComponent = diet.icon;
              const isSelected = profileData.dietaryRestrictions.includes(
                diet.id
              );
              return (
                <div
                  key={diet.id}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500"
                  }`}
                  onClick={() =>
                    handleMultiSelect("dietaryRestrictions", diet.id)
                  }
                >
                  <div
                    className={`${
                      isSelected
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30"
                    } p-2 rounded-lg mr-4`}
                  >
                    <IconComponent
                      className={`text-2xl ${
                        isSelected ? "text-white" : "text-sky-600 dark:text-sky-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <span
                      className={`font-medium ${
                        isSelected ? "text-white" : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {diet.label}
                    </span>
                    <p
                      className={`text-sm ${
                        isSelected ? "text-white/90" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {diet.desc}
                    </p>
                  </div>
                  {isSelected && <span className="ml-auto text-white">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Halal Preference */}
        <div className="mb-8 brand-card p-4 border-sky-200 dark:border-sky-700">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profileData.isHalal}
              onChange={(e) => handleInputChange("isHalal", e.target.checked)}
              className="w-5 h-5 text-sky-600 focus:ring-sky-500 border-gray-300 dark:border-slate-600 rounded"
            />
            <div className="flex items-center space-x-3">
              <div className="brand-gradient p-1.5 rounded-lg">
                <FaMosque className="text-white text-xl" />
              </div>
              <div>
                <span className="font-semibold brand-gradient-text">
                  Halal Food Required
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Only recommend destinations with halal food options
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Cultural Preferences */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold brand-gradient-text mb-4 flex items-center">
            <div className="brand-gradient p-1.5 rounded-lg mr-2">
              <FaHeart className="text-white" />
            </div>
            Cultural considerations?
          </h3>
          <div className="space-y-3">
            {culturalOptions.map((culture) => {
              const IconComponent = culture.icon;
              const isSelected = profileData.culturalPreferences.includes(
                culture.id
              );
              return (
                <div
                  key={culture.id}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500"
                  }`}
                  onClick={() =>
                    handleMultiSelect("culturalPreferences", culture.id)
                  }
                >
                  <div
                    className={`${
                      isSelected
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30"
                    } p-2 rounded-lg mr-4`}
                  >
                    <IconComponent
                      className={`text-2xl ${
                        isSelected ? "text-white" : "text-sky-600 dark:text-sky-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <span
                      className={`font-medium ${
                        isSelected ? "text-white" : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {culture.label}
                    </span>
                    <p
                      className={`text-sm ${
                        isSelected ? "text-white/90" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {culture.desc}
                    </p>
                  </div>
                  {isSelected && <span className="ml-auto text-white">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Language Preferences */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold brand-gradient-text mb-4 flex items-center">
            <div className="brand-gradient p-1.5 rounded-lg mr-2">
              <FaLanguage className="text-white" />
            </div>
            Which languages do you speak?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {languages.map((lang) => {
              const isSelected = profileData.languagePreferences.includes(
                lang.id
              );
              return (
                <div
                  key={lang.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500"
                  }`}
                  onClick={() =>
                    handleMultiSelect("languagePreferences", lang.id)
                  }
                >
                  <div className="text-center">
                    <span
                      className={`font-medium ${
                        isSelected ? "text-white" : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {lang.label}
                    </span>
                    {isSelected && <span className="ml-2 text-white">✓</span>}
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

export default FoodCultureStep;