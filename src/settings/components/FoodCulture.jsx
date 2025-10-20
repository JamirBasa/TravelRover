const FoodCulture = ({ formData, handleMultiSelect, isEditing = false }) => {
  // Match the dietary options from FoodCultureStep.jsx
  const dietaryOptions = [
    { id: "halal", label: "Halal", desc: "Islamic dietary laws" },
    { id: "vegetarian", label: "Vegetarian", desc: "No meat or fish" },
    { id: "vegan", label: "Vegan", desc: "No animal products" },
    { id: "pescatarian", label: "Pescatarian", desc: "Fish but no meat" },
    {
      id: "glutenfree",
      label: "Gluten-Free",
      desc: "No gluten-containing foods",
    },
    { id: "dairyfree", label: "Dairy-Free", desc: "No dairy products" },
    { id: "kosher", label: "Kosher", desc: "Jewish dietary laws" },
    { id: "none", label: "No Restrictions", desc: "Open to all cuisines" },
  ];

  const culturalOptions = [
    {
      id: "islamic",
      label: "Islamic-friendly",
      desc: "Prayer facilities, modest environment",
    },
    {
      id: "family",
      label: "Family-oriented",
      desc: "Family-friendly activities",
    },
    {
      id: "modest",
      label: "Modest dress codes",
      desc: "Conservative dress preferences",
    },
    {
      id: "prayer",
      label: "Prayer facilities",
      desc: "Access to prayer rooms/mosques",
    },
    {
      id: "alcohol_free",
      label: "Alcohol-free",
      desc: "No alcohol in environment",
    },
  ];

  const languages = [
    { id: "english", label: "English" },
    { id: "filipino", label: "Filipino/Tagalog" },
    { id: "cebuano", label: "Cebuano" },
    { id: "arabic", label: "Arabic" },
    { id: "spanish", label: "Spanish" },
    { id: "mandarin", label: "Mandarin" },
    { id: "japanese", label: "Japanese" },
    { id: "korean", label: "Korean" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Dietary Restrictions
        </label>
        <div className="space-y-3">
          {dietaryOptions.map((diet) => {
            const isSelected = formData.dietaryRestrictions?.includes(diet.id);
            return (
              <button
                key={diet.id}
                onClick={() =>
                  isEditing && handleMultiSelect("dietaryRestrictions", diet.id)
                }
                disabled={!isEditing}
                className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 ${
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
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Cultural Considerations
        </label>
        <div className="space-y-3">
          {culturalOptions.map((culture) => {
            const isSelected = formData.culturalPreferences?.includes(
              culture.id
            );
            return (
              <button
                key={culture.id}
                onClick={() =>
                  isEditing &&
                  handleMultiSelect("culturalPreferences", culture.id)
                }
                disabled={!isEditing}
                className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isEditing
                    ? "cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-amber-300 hover:bg-amber-50"
                    : "cursor-not-allowed"
                } ${
                  isSelected
                    ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : isEditing
                    ? "border-blue-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                }`}
              >
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
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Preferred Languages
        </label>
        <div className="space-y-3">
          {languages.map((lang) => {
            const isSelected = formData.languagePreferences?.includes(lang.id);
            return (
              <button
                key={lang.id}
                onClick={() =>
                  isEditing && handleMultiSelect("languagePreferences", lang.id)
                }
                disabled={!isEditing}
                className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isEditing
                    ? "cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-red-300 hover:bg-red-50"
                    : "cursor-not-allowed"
                } ${
                  isSelected
                    ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : isEditing
                    ? "border-blue-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                <span className="font-medium">{lang.label}</span>
                {isSelected && <span className="ml-auto text-white">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FoodCulture;
