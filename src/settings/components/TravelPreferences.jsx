import { useState, useEffect } from "react";
import {
  FaMountain,
  FaUmbrellaBeach,
  FaCity,
  FaLeaf,
  FaCameraRetro,
  FaRunning,
  FaUtensils,
  FaHeart,
  FaWallet,
  FaUsers,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const TravelPreferences = ({
  formData,
  handleInputChange,
  handleMultiSelect,
}) => {
  // Card-level edit states
  const [editingCards, setEditingCards] = useState({
    tripTypes: false,
    budget: false,
    travelStyle: false,
  });

  // Local state for each card
  const [cardData, setCardData] = useState({
    tripTypes: [],
    budget: "",
    travelStyle: "",
  });

  // Initialize card data from formData
  useEffect(() => {
    setCardData({
      tripTypes: formData.preferredTripTypes || [],
      budget: formData.budgetRange || "",
      travelStyle: formData.travelStyle || "",
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
      case "tripTypes": {
        const currentTypes = formData.preferredTripTypes || [];
        currentTypes.forEach((type) => {
          if (!cardData.tripTypes.includes(type)) {
            handleMultiSelect("preferredTripTypes", type);
          }
        });
        cardData.tripTypes.forEach((type) => {
          if (!currentTypes.includes(type)) {
            handleMultiSelect("preferredTripTypes", type);
          }
        });
        break;
      }
      case "budget":
        handleInputChange("budgetRange", cardData.budget);
        break;
      case "travelStyle":
        handleInputChange("travelStyle", cardData.travelStyle);
        break;
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
        cardName === "tripTypes"
          ? formData.preferredTripTypes || []
          : formData[cardName === "budget" ? "budgetRange" : "travelStyle"] ||
            "",
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

  // Handle local input changes
  const handleLocalChange = (cardName, value) => {
    setCardData((prev) => ({
      ...prev,
      [cardName]: value,
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
  // Match the trip types from TravelStyleStep.jsx with icons
  const tripTypes = [
    {
      id: "adventure",
      label: "Adventure & Outdoor activities",
      icon: FaMountain,
      color: "orange",
    },
    {
      id: "beach",
      label: "Beach & Island getaways",
      icon: FaUmbrellaBeach,
      color: "cyan",
    },
    {
      id: "cultural",
      label: "Cultural & Historical sites",
      icon: FaCity,
      color: "indigo",
    },
    {
      id: "nature",
      label: "Nature & Wildlife experiences",
      icon: FaLeaf,
      color: "green",
    },
    {
      id: "photography",
      label: "Photography & Scenic tours",
      icon: FaCameraRetro,
      color: "purple",
    },
    {
      id: "wellness",
      label: "Wellness & Spa retreats",
      icon: FaRunning,
      color: "pink",
    },
    {
      id: "food",
      label: "Food & Culinary experiences",
      icon: FaUtensils,
      color: "amber",
    },
    {
      id: "romantic",
      label: "Romantic getaways",
      icon: FaHeart,
      color: "rose",
    },
  ];

  const budgetRanges = [
    { value: "budget", label: "Budget", range: "₱2,000 - ₱8,000", emoji: "💰" },
    {
      value: "moderate",
      label: "Moderate",
      range: "₱8,000 - ₱20,000",
      emoji: "💵",
    },
    { value: "luxury", label: "Luxury", range: "₱20,000+", emoji: "💎" },
    { value: "flexible", label: "Flexible", range: "It depends", emoji: "🔄" },
  ];

  const travelStyles = [
    {
      value: "solo",
      label: "Solo Traveler",
      desc: "I love exploring on my own",
      emoji: "🧳",
    },
    {
      value: "duo",
      label: "With Partner",
      desc: "Traveling with my spouse",
      emoji: "💑",
    },
    {
      value: "family",
      label: "Family Trips",
      desc: "With kids and family",
      emoji: "👨‍👩‍👧‍👦",
    },
    {
      value: "group",
      label: "Group Travel",
      desc: "With friends",
      emoji: "👥",
    },
    {
      value: "business",
      label: "Business",
      desc: "Work-related travel",
      emoji: "💼",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Trip Types Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center text-white shadow-lg">
              <FaMountain className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold brand-gradient-text">
                Preferred Trip Types
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select activities you enjoy
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="tripTypes"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.tripTypes}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tripTypes.map((type) => {
            const isSelected = cardData.tripTypes?.includes(type.id);
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() =>
                  editingCards.tripTypes &&
                  handleLocalMultiSelect("tripTypes", type.id)
                }
                disabled={!editingCards.tripTypes}
                className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  editingCards.tripTypes
                    ? "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    : "cursor-not-allowed opacity-60"
                } ${
                  isSelected
                    ? "border-sky-500 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 shadow-md"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg scale-110"
                      : "bg-gray-100 dark:bg-slate-700 group-hover:bg-sky-100"
                  }`}
                >
                  <IconComponent
                    className={`text-xl ${
                      isSelected ? "text-white" : "text-sky-600"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`font-semibold text-sm ${
                      isSelected
                        ? "text-sky-700 dark:text-sky-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {type.label}
                  </span>
                </div>

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

      {/* Budget Range Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg">
              <FaWallet className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                Budget Range
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your typical budget preference
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="budget"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.budget}
          />
        </div>

        <div className="mb-4 p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> Price Guide (per day):
          </p>
          <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[75px]">
                Budget:
              </span>
              <span>
                ₱2,000-8,000 - Hostels, local eateries, public transport
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[75px]">
                Moderate:
              </span>
              <span>
                ₱8,000-20,000 - 3-star hotels, casual dining, mix of transport
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[75px]">
                Luxury:
              </span>
              <span>
                ₱20,000+ - Premium hotels, fine dining, private transport
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-[75px]">
                Flexible:
              </span>
              <span>Budget varies based on destination and availability</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {budgetRanges.map((budget) => {
            const isSelected = cardData.budget === budget.value;
            return (
              <button
                key={budget.value}
                onClick={() =>
                  editingCards.budget &&
                  handleLocalChange("budget", budget.value)
                }
                disabled={!editingCards.budget}
                className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                  editingCards.budget
                    ? "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    : "cursor-not-allowed opacity-60"
                } ${
                  isSelected
                    ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 shadow-md"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300"
                }`}
              >
                <div
                  className={`text-3xl transition-all duration-300 ${
                    isSelected ? "scale-125" : "group-hover:scale-110"
                  }`}
                >
                  {budget.emoji}
                </div>
                <div className="text-center">
                  <div
                    className={`font-semibold text-sm ${
                      isSelected
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {budget.label}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isSelected
                        ? "text-emerald-600 dark:text-emerald-500"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {budget.range}
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">
                      ✓
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Travel Style Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
              <FaUsers className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Travel Style
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How do you prefer to travel?
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="travelStyle"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.travelStyle}
          />
        </div>

        <div className="space-y-3">
          {travelStyles.map((style) => {
            const isSelected = cardData.travelStyle === style.value;
            return (
              <button
                key={style.value}
                onClick={() =>
                  editingCards.travelStyle &&
                  handleLocalChange("travelStyle", style.value)
                }
                disabled={!editingCards.travelStyle}
                className={`group relative w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  editingCards.travelStyle
                    ? "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    : "cursor-not-allowed opacity-60"
                } ${
                  isSelected
                    ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-md"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg scale-110"
                      : "bg-gray-100 dark:bg-slate-700 group-hover:bg-purple-100"
                  }`}
                >
                  {style.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`font-semibold ${
                      isSelected
                        ? "text-purple-700 dark:text-purple-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {style.label}
                  </span>
                  <p
                    className={`text-sm mt-0.5 ${
                      isSelected
                        ? "text-purple-600 dark:text-purple-500"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {style.desc}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
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

export default TravelPreferences;
