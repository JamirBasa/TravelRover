// src/create-trip/components/TravelerSelector.jsx
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  FaUsers,
  FaMinus,
  FaPlus,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";

// Enhanced traveler options with specific counts
const TRAVELER_OPTIONS = [
  {
    id: 1,
    title: "Solo Traveler",
    desc: "Exploring on your own adventure",
    icon: "🧳",
    count: 1,
    category: "solo",
  },
  {
    id: 2,
    title: "Couple",
    desc: "A romantic getaway for two",
    icon: "💑",
    count: 2,
    category: "couple",
  },
  {
    id: 3,
    title: "Small Group",
    desc: "Perfect for close friends",
    icon: "👥",
    count: 4,
    category: "group",
  },
  {
    id: 4,
    title: "Family",
    desc: "Fun for the whole family",
    icon: "👨‍👩‍👧‍👦",
    count: 5,
    category: "family",
  },
  {
    id: 5,
    title: "Large Group",
    desc: "Big adventures with more people",
    icon: "🎉",
    count: 8,
    category: "group",
  },
];

function TravelerSelector({ selectedTravelers, onTravelersChange }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [customCount, setCustomCount] = useState(1);
  const [showCounter, setShowCounter] = useState(false);

  // Parse initial value if provided
  // Also update when selectedTravelers changes externally (e.g., from profile auto-population)
  useEffect(() => {
    if (selectedTravelers) {
      // Handle both integer and string formats for backward compatibility
      let count;
      if (typeof selectedTravelers === "number") {
        count = selectedTravelers;
      } else {
        // Parse string format like "1 Person" or "2 People"
        const match = String(selectedTravelers).match(/(\d+)/);
        count = match ? parseInt(match[1], 10) : 1;
      }

      // Find matching preset option
      const matchingOption = TRAVELER_OPTIONS.find(
        (opt) => opt.count === count
      );
      if (matchingOption) {
        setSelectedOption(matchingOption.id);
        setCustomCount(count);
        setShowCounter(false);
      } else {
        // Custom count not in presets
        setSelectedOption(null);
        setCustomCount(count);
        setShowCounter(true);
      }
    }
  }, [selectedTravelers]); // Now responds to prop changes

  const handlePresetSelect = (option) => {
    setSelectedOption(option.id);
    setCustomCount(option.count);
    setShowCounter(false);
    // Store as integer, not string
    onTravelersChange(option.count);
  };

  const handleCounterChange = (delta) => {
    const newCount = Math.max(1, Math.min(50, customCount + delta));
    setCustomCount(newCount);
    // Store as integer, not string
    onTravelersChange(newCount);

    // Don't auto-switch - let user stay in custom mode
    // They can manually click a preset if they want
    setSelectedOption(null);
  };

  const handleCustomClick = () => {
    setSelectedOption(null);
    setShowCounter(true);

    // Smart default: Start at a non-preset number to avoid confusion
    // If current count is a preset (1,2,4,5,8), bump it by 1
    // Otherwise keep the current count
    const currentCount = customCount || 1;
    const isPresetNumber = TRAVELER_OPTIONS.some(
      (opt) => opt.count === currentCount
    );

    let startCount;
    if (isPresetNumber) {
      // Start at current + 1 to clearly show we're in custom mode
      startCount = Math.min(currentCount + 1, 50);
    } else {
      // Already a custom number, keep it
      startCount = currentCount;
    }

    setCustomCount(startCount);
    // Store as integer, not string
    onTravelersChange(startCount);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question - Enhanced Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          How many travelers?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl mx-auto leading-relaxed">
          Choose your group size to get personalized recommendations for
          accommodations and activities
        </p>
      </div>

      {/* Traveler Options */}
      <div className="space-y-4">
        {/* Quick Selection Cards - Enhanced Professional Design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TRAVELER_OPTIONS.map((option) => {
            const isSelected = selectedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handlePresetSelect(option)}
                aria-label={`Select ${option.title} - ${option.count} ${
                  option.count === 1 ? "person" : "people"
                }`}
                aria-pressed={isSelected}
                className={`relative p-5 cursor-pointer border-2 rounded-2xl transition-all duration-300 
                  hover:scale-[1.02] active:scale-[0.98]
                  focus:outline-none focus:ring-4 focus:ring-sky-200 dark:focus:ring-sky-800
                  ${
                    isSelected
                      ? "shadow-xl border-sky-500 dark:border-sky-600 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 dark:from-sky-950/40 dark:via-blue-950/40 dark:to-sky-950/40 ring-2 ring-sky-200 dark:ring-sky-700"
                      : "shadow-md border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-xl"
                  }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <FaCheckCircle className="text-green-500 text-xl drop-shadow-lg bg-white dark:bg-slate-900 rounded-full" />
                  </div>
                )}

                <div className="text-center space-y-3">
                  {/* Icon with animation */}
                  <div
                    className={`text-5xl transition-transform duration-300 ${
                      isSelected ? "scale-110" : "group-hover:scale-105"
                    }`}
                  >
                    {option.icon}
                  </div>

                  {/* Count with enhanced styling */}
                  <div
                    className={`text-3xl font-extrabold transition-colors ${
                      isSelected
                        ? "brand-gradient-text"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {option.count}
                  </div>

                  {/* Title */}
                  <div
                    className={`text-sm font-bold transition-colors ${
                      isSelected
                        ? "text-sky-800 dark:text-sky-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {option.title}
                  </div>

                  {/* Description */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 leading-snug px-1">
                    {option.desc}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Custom Counter Card - Enhanced */}
          <button
            onClick={handleCustomClick}
            aria-label="Enter custom traveler count"
            aria-pressed={showCounter}
            className={`relative p-5 cursor-pointer border-2 rounded-2xl transition-all duration-300 
              hover:scale-[1.02] active:scale-[0.98]
              focus:outline-none focus:ring-4 focus:ring-sky-200 dark:focus:ring-sky-800
              ${
                showCounter
                  ? "shadow-xl border-sky-500 dark:border-sky-600 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 dark:from-sky-950/40 dark:via-blue-950/40 dark:to-sky-950/40 ring-2 ring-sky-200 dark:ring-sky-700"
                  : "shadow-md border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-xl"
              }`}
          >
            {/* Selection Indicator */}
            {showCounter && (
              <div className="absolute -top-2 -left-2 z-10">
                <FaCheckCircle className="text-green-500 text-xl drop-shadow-lg bg-white dark:bg-slate-900 rounded-full" />
              </div>
            )}

            <div className="text-center space-y-3">
              <div
                className={`text-5xl transition-transform duration-300 ${
                  showCounter ? "scale-110" : ""
                }`}
              >
                🔢
              </div>
              <div
                className={`text-3xl font-extrabold transition-colors ${
                  showCounter
                    ? "brand-gradient-text"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {showCounter ? customCount : "?"}
              </div>
              <div
                className={`text-sm font-bold transition-colors ${
                  showCounter
                    ? "text-sky-800 dark:text-sky-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                Custom Size
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-snug px-1">
                Choose exact number
              </div>
            </div>
          </button>
        </div>

        {/* Counter Controls - Enhanced Professional Design */}
        {showCounter && (
          <div className="brand-card p-6 shadow-2xl border-sky-200 dark:border-sky-800 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Counter Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
                Adjust Your Group Size
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use the buttons below or type a specific number
              </p>
            </div>

            {/* Counter Display */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCounterChange(-1);
                }}
                disabled={customCount <= 1}
                aria-label="Decrease traveler count"
                className="brand-button w-14 h-14 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed 
                  hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg
                  focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-700
                  disabled:hover:scale-100"
              >
                <FaMinus className="text-white text-lg mx-auto" />
              </button>

              <div className="text-center min-w-[140px] bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-inner border-2 border-gray-100 dark:border-slate-700">
                <div className="text-6xl font-black brand-gradient-text mb-2 tracking-tight">
                  {customCount}
                </div>
                <div className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {customCount === 1 ? "Person" : "People"}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCounterChange(1);
                }}
                disabled={customCount >= 50}
                aria-label="Increase traveler count"
                className="brand-button w-14 h-14 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed 
                  hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg
                  focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-700
                  disabled:hover:scale-100"
              >
                <FaPlus className="text-white text-lg mx-auto" />
              </button>
            </div>

            {/* Helpful hints - Enhanced */}
            <div className="space-y-3">
              {/* Show preset suggestion if close to one */}
              {(() => {
                const nearbyPreset = TRAVELER_OPTIONS.find(
                  (opt) => opt.count === customCount
                );
                if (nearbyPreset) {
                  return (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl mt-0.5">
                          {nearbyPreset.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1.5">
                            💡 Smart Suggestion
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            This matches our{" "}
                            <span className="font-bold">
                              "{nearbyPreset.title}"
                            </span>{" "}
                            preset for a faster selection!
                          </p>
                          <button
                            onClick={() => handlePresetSelect(nearbyPreset)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer"
                          >
                            <FaCheckCircle />
                            Switch to {nearbyPreset.title} Preset
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {customCount > 15 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border-2 border-amber-200 dark:border-amber-800 p-4 shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
                        Large Group Notice
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                        For groups over 15, consider booking accommodations
                        separately for better availability and pricing options.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 rounded-xl border-2 border-sky-200 dark:border-sky-800 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-sky-800 dark:text-sky-300 mb-1">
                      Quick Tip
                    </p>
                    <p className="text-sm text-sky-700 dark:text-sky-400 leading-relaxed">
                      Use [+] and [-] buttons to fine-tune your exact group
                      size, or click any preset card above for instant
                      selection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Card - Enhanced Professional Design */}
        <div className="brand-card p-6 shadow-xl border-sky-200 dark:border-sky-800 bg-gradient-to-br from-white to-sky-50/30 dark:from-slate-900 dark:to-sky-950/20">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-3 rounded-2xl flex-shrink-0 shadow-lg">
              <FaInfoCircle className="text-white text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold brand-gradient-text text-base mb-2">
                Why Group Size Matters
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                Your group size helps us curate the perfect experience by
                recommending:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-sky-500 dark:text-sky-400 mt-0.5">
                    ✓
                  </span>
                  <span>
                    Suitable accommodations with appropriate room configurations
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-sky-500 dark:text-sky-400 mt-0.5">
                    ✓
                  </span>
                  <span>Activities that work best for your party size</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-sky-500 dark:text-sky-400 mt-0.5">
                    ✓
                  </span>
                  <span>Transportation options and dining experiences</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelerSelector;
