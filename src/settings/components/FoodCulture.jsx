import { useState, useEffect } from "react";
import {
  FaUtensils,
  FaHeart,
  FaLanguage,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const FoodCulture = ({ formData, handleMultiSelect }) => {
  // Card-level edit states
  const [editingCards, setEditingCards] = useState({
    dietary: false,
    cultural: false,
    languages: false,
  });

  // Local state for each card
  const [cardData, setCardData] = useState({
    dietary: [],
    cultural: [],
    languages: [],
  });

  // Initialize card data from formData
  useEffect(() => {
    setCardData({
      dietary: formData.dietaryRestrictions || [],
      cultural: formData.culturalPreferences || [],
      languages: formData.languagePreferences || [],
    });
  }, [formData]);

  // Toggle edit mode for a specific card
  const toggleCardEdit = (cardName) => {
    setEditingCards((prev) => ({
      ...prev,
      [cardName]: !prev[cardName],
    }));
  };

  // Save changes for a specific card
  const saveCard = (cardName) => {
    switch (cardName) {
      case "dietary": {
        const currentDietary = formData.dietaryRestrictions || [];
        currentDietary.forEach((item) => {
          if (!cardData.dietary.includes(item)) {
            handleMultiSelect("dietaryRestrictions", item);
          }
        });
        cardData.dietary.forEach((item) => {
          if (!currentDietary.includes(item)) {
            handleMultiSelect("dietaryRestrictions", item);
          }
        });
        break;
      }
      case "cultural": {
        const currentCultural = formData.culturalPreferences || [];
        currentCultural.forEach((item) => {
          if (!cardData.cultural.includes(item)) {
            handleMultiSelect("culturalPreferences", item);
          }
        });
        cardData.cultural.forEach((item) => {
          if (!currentCultural.includes(item)) {
            handleMultiSelect("culturalPreferences", item);
          }
        });
        break;
      }
      case "languages": {
        const currentLanguages = formData.languagePreferences || [];
        currentLanguages.forEach((item) => {
          if (!cardData.languages.includes(item)) {
            handleMultiSelect("languagePreferences", item);
          }
        });
        cardData.languages.forEach((item) => {
          if (!currentLanguages.includes(item)) {
            handleMultiSelect("languagePreferences", item);
          }
        });
        break;
      }
      default:
        break;
    }
    toggleCardEdit(cardName);
  };

  // Cancel changes for a specific card
  const cancelCard = (cardName) => {
    setCardData((prev) => ({
      ...prev,
      [cardName]:
        cardName === "dietary"
          ? formData.dietaryRestrictions || []
          : cardName === "cultural"
          ? formData.culturalPreferences || []
          : formData.languagePreferences || [],
    }));
    toggleCardEdit(cardName);
  };

  // Handle local multi-select changes
  const handleLocalMultiSelect = (cardName, value) => {
    setCardData((prev) => ({
      ...prev,
      [cardName]: prev[cardName]?.includes(value)
        ? prev[cardName].filter((item) => item !== value)
        : [...(prev[cardName] || []), value],
    }));
  };

  // Reusable Edit/Save/Cancel Controls
  const CardEditControls = ({ cardName, onSave, onCancel, isEditing }) => (
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <button
          onClick={() => toggleCardEdit(cardName)}
          className="px-3 py-1.5 rounded-lg brand-gradient text-white text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <FaEdit className="text-xs" />
          Edit
        </button>
      ) : (
        <>
          <button
            onClick={() => onCancel(cardName)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 flex items-center gap-2"
          >
            <FaTimes className="text-xs" />
            Cancel
          </button>
          <button
            onClick={() => onSave(cardName)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <FaSave className="text-xs" />
            Save
          </button>
        </>
      )}
    </div>
  );
  // Match the dietary options from FoodCultureStep.jsx
  const dietaryOptions = [
    {
      id: "halal",
      label: "Halal",
      desc: "Islamic dietary laws",
      icon: "🕌",
      color: "emerald",
    },
    {
      id: "vegetarian",
      label: "Vegetarian",
      desc: "No meat or fish",
      icon: "🥗",
      color: "green",
    },
    {
      id: "vegan",
      label: "Vegan",
      desc: "No animal products",
      icon: "🌱",
      color: "lime",
    },
    {
      id: "pescatarian",
      label: "Pescatarian",
      desc: "Fish but no meat",
      icon: "🐟",
      color: "cyan",
    },
    {
      id: "glutenfree",
      label: "Gluten-Free",
      desc: "No gluten-containing foods",
      icon: "🌾",
      color: "amber",
    },
    {
      id: "dairyfree",
      label: "Dairy-Free",
      desc: "No dairy products",
      icon: "🥛",
      color: "orange",
    },
    {
      id: "kosher",
      label: "Kosher",
      desc: "Jewish dietary laws",
      icon: "✡️",
      color: "blue",
    },
    {
      id: "none",
      label: "No Restrictions",
      desc: "Open to all cuisines",
      icon: "🍽️",
      color: "purple",
    },
  ];

  const culturalOptions = [
    {
      id: "islamic",
      label: "Islamic-friendly",
      desc: "Prayer facilities, modest environment",
      icon: "🕌",
      color: "emerald",
    },
    {
      id: "family",
      label: "Family-oriented",
      desc: "Family-friendly activities",
      icon: "👨‍👩‍👧‍👦",
      color: "rose",
    },
    {
      id: "modest",
      label: "Modest dress codes",
      desc: "Conservative dress preferences",
      icon: "👔",
      color: "indigo",
    },
    {
      id: "prayer",
      label: "Prayer facilities",
      desc: "Access to prayer rooms/mosques",
      icon: "🙏",
      color: "purple",
    },
    {
      id: "alcohol_free",
      label: "Alcohol-free",
      desc: "No alcohol in environment",
      icon: "🚫",
      color: "red",
    },
  ];

  const languages = [
    { id: "english", label: "English", icon: "🇺🇸" },
    { id: "filipino", label: "Filipino/Tagalog", icon: "🇵🇭" },
    { id: "arabic", label: "Arabic", icon: "🇸🇦" },
    { id: "spanish", label: "Spanish", icon: "🇪🇸" },
    { id: "mandarin", label: "Mandarin", icon: "🇨🇳" },
    { id: "japanese", label: "Japanese", icon: "🇯🇵" },
    { id: "korean", label: "Korean", icon: "🇰🇷" },
    { id: "french", label: "French", icon: "🇫🇷" },
  ];

  return (
    <div className="space-y-8">
      {/* Dietary Restrictions Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center text-white shadow-lg">
              <FaUtensils className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold brand-gradient-text">
                Dietary Restrictions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select your dietary preferences
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="dietary"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.dietary}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dietaryOptions.map((diet) => {
            const isSelected = cardData.dietary?.includes(diet.id);
            return (
              <button
                key={diet.id}
                onClick={() =>
                  editingCards.dietary &&
                  handleLocalMultiSelect("dietary", diet.id)
                }
                disabled={!editingCards.dietary}
                className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  editingCards.dietary
                    ? "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    : "cursor-not-allowed opacity-60"
                } ${
                  isSelected
                    ? "border-sky-500 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 shadow-md"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300"
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg scale-110"
                      : "bg-gray-100 dark:bg-slate-700 group-hover:bg-sky-100"
                  }`}
                >
                  {diet.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-semibold ${
                      isSelected
                        ? "text-sky-700 dark:text-sky-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {diet.label}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {diet.desc}
                  </p>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      ✓
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cultural Considerations Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
              <FaHeart className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                Cultural Considerations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your cultural preferences
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="cultural"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.cultural}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {culturalOptions.map((culture) => {
            const isSelected = cardData.cultural?.includes(culture.id);
            return (
              <button
                key={culture.id}
                onClick={() =>
                  editingCards.cultural &&
                  handleLocalMultiSelect("cultural", culture.id)
                }
                disabled={!editingCards.cultural}
                className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  editingCards.cultural
                    ? "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    : "cursor-not-allowed opacity-60"
                } ${
                  isSelected
                    ? "border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-md"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300"
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg scale-110"
                      : "bg-gray-100 dark:bg-slate-700 group-hover:bg-amber-100"
                  }`}
                >
                  {culture.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-semibold ${
                      isSelected
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {culture.label}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {culture.desc}
                  </p>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      ✓
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Languages Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
              <FaLanguage className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Preferred Languages
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Languages you speak or prefer
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="languages"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.languages}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {languages.map((lang) => {
            const isSelected = cardData.languages?.includes(lang.id);
            return (
              <button
                key={lang.id}
                onClick={() =>
                  editingCards.languages &&
                  handleLocalMultiSelect("languages", lang.id)
                }
                disabled={!editingCards.languages}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                  editingCards.languages
                    ? "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    : "cursor-not-allowed opacity-60"
                } ${
                  isSelected
                    ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-md"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300"
                }`}
              >
                {/* Flag/Icon */}
                <div
                  className={`text-3xl transition-all duration-300 ${
                    isSelected ? "scale-125" : "group-hover:scale-110"
                  }`}
                >
                  {lang.icon}
                </div>

                {/* Language Name */}
                <span
                  className={`text-sm font-semibold text-center ${
                    isSelected
                      ? "text-purple-700 dark:text-purple-400"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {lang.label}
                </span>

                {/* Selection Check */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">
                      ✓
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FoodCulture;
