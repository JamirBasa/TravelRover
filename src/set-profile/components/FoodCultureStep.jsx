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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          What are your preferences?
        </h2>
        <p className="text-gray-600">
          Help us recommend culturally appropriate destinations and dining
        </p>
      </div>

      <div className="space-y-6">
        {/* Dietary Restrictions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaUtensils className="mr-2" />
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
                      ? "border-black bg-black text-white"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-500"
                  }`}
                  onClick={() =>
                    handleMultiSelect("dietaryRestrictions", diet.id)
                  }
                >
                  <IconComponent className="text-2xl mr-4" />
                  <div className="flex-1">
                    <span className="font-medium">{diet.label}</span>
                    <p
                      className={`text-sm ${
                        isSelected ? "text-gray-300" : "text-gray-500"
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
        <div className="mb-8 bg-gray-50 p-4 rounded-xl">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profileData.isHalal}
              onChange={(e) => handleInputChange("isHalal", e.target.checked)}
              className="w-5 h-5 text-black focus:ring-black border-gray-300 rounded"
            />
            <div className="flex items-center space-x-3">
              <FaMosque className="text-gray-700 text-xl" />
              <div>
                <span className="font-semibold text-gray-800">
                  Halal Food Required
                </span>
                <p className="text-sm text-gray-600">
                  Only recommend destinations with halal food options
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Cultural Preferences */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaHeart className="mr-2" />
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
                      ? "border-black bg-black text-white"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-500"
                  }`}
                  onClick={() =>
                    handleMultiSelect("culturalPreferences", culture.id)
                  }
                >
                  <IconComponent className="text-2xl mr-4" />
                  <div className="flex-1">
                    <span className="font-medium">{culture.label}</span>
                    <p
                      className={`text-sm ${
                        isSelected ? "text-gray-300" : "text-gray-500"
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaLanguage className="mr-2" />
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
                      ? "border-black bg-black text-white"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-500"
                  }`}
                  onClick={() =>
                    handleMultiSelect("languagePreferences", lang.id)
                  }
                >
                  <div className="text-center">
                    <span className="font-medium">{lang.label}</span>
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
