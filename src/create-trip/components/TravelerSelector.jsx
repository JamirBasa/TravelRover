// src/create-trip/components/TravelerSelector.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  FaUsers,
  FaMinus,
  FaPlus,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { getTravelersCount } from "@/utils/travelersParsers";
import { TRAVELER_OPTIONS, VALIDATION_RULES } from "@/constants/options";
import { useDebounce } from "@/hooks/useDebounce";
import BudgetPreviewCard from "./BudgetPreviewCard";

const TravelerSelector = React.memo(
  ({
    selectedTravelers,
    onTravelersChange,
    formData = {},
    flightData = {},
  }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [customCount, setCustomCount] = useState(1);
    const [showCounter, setShowCounter] = useState(false);

    // ✅ Use centralized validation rules
    const {
      MIN: MIN_TRAVELERS,
      MAX: MAX_TRAVELERS,
      LARGE_GROUP_WARNING,
    } = VALIDATION_RULES.TRAVELER_LIMITS;

    // ✅ Debounce counter changes (only notify parent after 300ms of inactivity)
    const debouncedCount = useDebounce(customCount, 300);

    // ✅ Only sync to parent when debounced value changes
    useEffect(() => {
      if (showCounter && debouncedCount) {
        onTravelersChange(debouncedCount);
      }
    }, [debouncedCount, showCounter, onTravelersChange]);

    // ✅ Initialize with proper default handling (runs ONCE on mount)
    useEffect(() => {
      // Get traveler count (defaults to 1 if undefined)
      const count = selectedTravelers
        ? getTravelersCount(selectedTravelers)
        : 1;

      // Check if it matches a preset
      const preset = TRAVELER_OPTIONS.find((opt) => opt.count === count);

      if (preset) {
        // ✅ Select preset (e.g., "Solo Traveler" for count = 1)
        setSelectedOption(preset.id);
        setCustomCount(preset.count);
        setShowCounter(false);

        // ✅ Notify parent if this is initial load and no value was set
        if (!selectedTravelers) {
          onTravelersChange(preset.count);
        }
      } else {
        // Custom number that doesn't match presets
        setSelectedOption(null);
        setCustomCount(count);
        setShowCounter(true);

        // ✅ Notify parent if this is initial load
        if (!selectedTravelers) {
          onTravelersChange(count);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ✅ Only run ONCE on mount to set initial state

    // ✅ Memoize handlers to prevent re-creation on every render
    const handlePresetSelect = useCallback(
      (option) => {
        setSelectedOption(option.id);
        setCustomCount(option.count);
        setShowCounter(false);
        // Immediately notify parent for preset selection (no debounce needed)
        onTravelersChange(option.count);
      },
      [onTravelersChange]
    );

    const handleCounterChange = useCallback(
      (delta) => {
        setCustomCount((prev) => {
          const newCount = Math.max(
            MIN_TRAVELERS,
            Math.min(MAX_TRAVELERS, prev + delta)
          );
          return newCount;
        });
        setSelectedOption(null);
        // Don't call onTravelersChange here - let debounce handle it
      },
      [MIN_TRAVELERS, MAX_TRAVELERS]
    );

    const handleCustomClick = useCallback(() => {
      setSelectedOption(null);
      setShowCounter(true);

      setCustomCount((prev) => {
        const currentCount = prev || 1;
        const isPresetNumber = TRAVELER_OPTIONS.some(
          (opt) => opt.count === currentCount
        );

        if (isPresetNumber) {
          return Math.min(currentCount + 1, MAX_TRAVELERS);
        }
        return currentCount;
      });
    }, [MAX_TRAVELERS]);

    // ✅ Memoize expensive warning message computation
    const warningMessage = useMemo(() => {
      if (customCount >= 30) {
        return {
          icon: "🚨",
          title: "Very Large Group Alert",
          message:
            "Groups over 30 require special arrangements. Consider splitting into smaller groups for better experiences.",
          color: "red",
        };
      } else if (customCount >= 20) {
        return {
          icon: "⚠️",
          title: "Large Group Notice",
          message:
            "For groups over 20, advance booking is highly recommended. Some activities may have group size limits.",
          color: "orange",
        };
      } else if (customCount > LARGE_GROUP_WARNING) {
        return {
          icon: "⚠️",
          title: "Large Group Notice",
          message:
            "For groups over 15, consider booking accommodations separately for better availability and pricing options.",
          color: "amber",
        };
      }
      return null;
    }, [customCount, LARGE_GROUP_WARNING]);

    // ✅ Memoize preset options to prevent re-renders
    const presetOptions = useMemo(
      () =>
        TRAVELER_OPTIONS.map((option) => (
          <PresetOption
            key={option.id}
            option={option}
            isSelected={selectedOption === option.id}
            onSelect={handlePresetSelect}
          />
        )),
      [selectedOption, handlePresetSelect]
    );

    return (
      <div className="max-w-2xl mx-auto">
        {/* Main Question - Enhanced Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold brand-gradient-text mb-3">
            How many travelers?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl mx-auto leading-relaxed">
            Select your group size for tailored recommendations.
          </p>
        </div>

        {/* Traveler Options */}
        <div className="space-y-4">
          {/* Quick Selection Cards - Enhanced Professional Design */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {presetOptions}

            {/* Custom Option Button */}
            <CustomOptionButton
              showCounter={showCounter}
              customCount={customCount}
              onClick={handleCustomClick}
            />
          </div>

          {/* Counter Controls - Enhanced Professional Design */}
          {showCounter && (
            <CounterPanel
              customCount={customCount}
              minTravelers={MIN_TRAVELERS}
              maxTravelers={MAX_TRAVELERS}
              onCounterChange={handleCounterChange}
              warningMessage={warningMessage}
              onPresetSelect={handlePresetSelect}
            />
          )}

          {/* Info Card - Enhanced Professional Design */}
          <div className="brand-card p-5 shadow-lg border-sky-200">
            <h3 className="text-base font-bold brand-gradient-text mb-2">
              Why Group Size Matters
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              We use your group size to recommend:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Accommodations with suitable room options</li>
              <li>Activities matched to your group</li>
              <li>Transportation and dining arrangements</li>
            </ul>
          </div>

          {/* Budget Preview Card */}
          <BudgetPreviewCard formData={formData} flightData={flightData} />
        </div>
      </div>
    );
  }
);

TravelerSelector.displayName = "TravelerSelector";

// ✅ PresetOption - Memoized to prevent re-renders
const PresetOption = React.memo(({ option, isSelected, onSelect }) => (
  <button
    onClick={() => onSelect(option)}
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
    {isSelected && (
      <div className="absolute -top-2 -left-2 z-10">
        <FaCheckCircle className="text-green-500 text-xl drop-shadow-lg bg-white dark:bg-slate-900 rounded-full" />
      </div>
    )}

    <div className="text-center space-y-3">
      <div
        className={`text-5xl transition-transform duration-300 ${
          isSelected ? "scale-110" : ""
        }`}
      >
        {option.icon}
      </div>
      <div
        className={`text-3xl font-extrabold transition-colors ${
          isSelected
            ? "brand-gradient-text"
            : "text-gray-800 dark:text-gray-200"
        }`}
      >
        {option.count}
      </div>
      <div
        className={`text-sm font-bold transition-colors ${
          isSelected
            ? "text-sky-800 dark:text-sky-300"
            : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {option.title}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 leading-snug px-1">
        {option.desc}
      </div>
    </div>
  </button>
));

PresetOption.displayName = "PresetOption";

// ✅ CustomOptionButton - Memoized
const CustomOptionButton = React.memo(
  ({ showCounter, customCount, onClick }) => (
    <button
      onClick={onClick}
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
  )
);

CustomOptionButton.displayName = "CustomOptionButton";

// ✅ CounterPanel - Memoized
const CounterPanel = React.memo(
  ({
    customCount,
    minTravelers,
    maxTravelers,
    onCounterChange,
    warningMessage,
    onPresetSelect,
  }) => {
    // Check for nearby preset
    const nearbyPreset = useMemo(
      () => TRAVELER_OPTIONS.find((opt) => opt.count === customCount),
      [customCount]
    );

    return (
      <div className="brand-card p-6 shadow-2xl border-sky-200 dark:border-sky-800 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
            Adjust Your Group Size
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use the buttons below to set your exact number
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={() => onCounterChange(-1)}
            disabled={customCount <= minTravelers}
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
            onClick={() => onCounterChange(1)}
            disabled={customCount >= maxTravelers}
            aria-label="Increase traveler count"
            className="brand-button w-14 h-14 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed 
            hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg
            focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-700
            disabled:hover:scale-100"
          >
            <FaPlus className="text-white text-lg mx-auto" />
          </button>
        </div>

        {/* Warning Messages */}
        <div className="space-y-3">
          {nearbyPreset && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-4 shadow-md">
              <div className="flex items-start gap-3">
                <div className="text-3xl mt-0.5">{nearbyPreset.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1.5">
                    💡 Smart Suggestion
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    This matches our{" "}
                    <span className="font-bold">"{nearbyPreset.title}"</span>{" "}
                    preset!
                  </p>
                  <button
                    onClick={() => onPresetSelect(nearbyPreset)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <FaCheckCircle />
                    Switch to {nearbyPreset.title} Preset
                  </button>
                </div>
              </div>
            </div>
          )}

          {warningMessage && (
            <div
              className={`bg-gradient-to-r from-${warningMessage.color}-50 to-${warningMessage.color}-50 dark:from-${warningMessage.color}-950/30 dark:to-${warningMessage.color}-950/30 rounded-xl border-2 border-${warningMessage.color}-200 dark:border-${warningMessage.color}-800 p-4 shadow-md`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{warningMessage.icon}</span>
                <div>
                  <p
                    className={`text-sm font-bold text-${warningMessage.color}-800 dark:text-${warningMessage.color}-300 mb-1`}
                  >
                    {warningMessage.title}
                  </p>
                  <p
                    className={`text-sm text-${warningMessage.color}-700 dark:text-${warningMessage.color}-400 leading-relaxed`}
                  >
                    {warningMessage.message}
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
                  Click [+] or [-] to adjust. Changes save automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CounterPanel.displayName = "CounterPanel";

export default TravelerSelector;
