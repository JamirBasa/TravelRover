// src/create-trip/components/TravelerSelector.jsx
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SelectTravelList } from "../../constants/options";
import { FaUsers } from "react-icons/fa";

function TravelerSelector({ selectedTravelers, onTravelersChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customCount, setCustomCount] = useState("");

  // Check if current selection is a custom number
  useEffect(() => {
    const isPresetOption = SelectTravelList.some(
      (item) => item.people === selectedTravelers
    );

    if (!isPresetOption && selectedTravelers) {
      setShowCustom(true);
      // Extract number from string like "8 People"
      const match = selectedTravelers.match(/(\d+)/);
      if (match) {
        setCustomCount(match[1]);
      }
    }
  }, [selectedTravelers]);

  const handleCustomCountChange = (value) => {
    setCustomCount(value);
    if (value && parseInt(value) > 0) {
      const count = parseInt(value);
      const label = count === 1 ? "1 Person" : `${count} People`;
      onTravelersChange(label);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Who's joining your adventure?
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
          Let us know your group size to tailor recommendations 👥
        </p>
      </div>

      {/* Traveler Options */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {SelectTravelList.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                onTravelersChange(item.people);
                setShowCustom(false);
                setCustomCount("");
              }}
              className={`p-5 cursor-pointer border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
                selectedTravelers === item.people && !showCustom
                  ? "shadow-xl border-sky-500 dark:border-sky-600 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30"
                  : "border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.desc}
                  </p>
                </div>
                {selectedTravelers === item.people && !showCustom && (
                  <div className="brand-gradient w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Traveler Count Option */}
        <div className="pt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">
              OR
            </span>
            <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
          </div>
          <div
            className={`group border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
              showCustom
                ? "shadow-xl border-sky-500 dark:border-sky-600 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30"
                : "border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg"
            }`}
          >
            {/* Custom Count Header */}
            <div
              onClick={() => {
                if (!showCustom) {
                  setShowCustom(true);
                  onTravelersChange("");
                }
              }}
              className="p-5 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                      showCustom && customCount
                        ? "brand-gradient shadow-lg"
                        : "bg-gray-100 dark:bg-slate-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/50"
                    }`}
                  >
                    <span
                      className={
                        showCustom && customCount
                          ? "text-white"
                          : "dark:text-gray-300"
                      }
                    >
                      👥
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-lg transition-colors ${
                        showCustom && customCount
                          ? "text-sky-800 dark:text-sky-300"
                          : "text-gray-800 dark:text-gray-200 group-hover:text-sky-700 dark:group-hover:text-sky-400"
                      }`}
                    >
                      Custom Group Size
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {customCount
                        ? `${customCount} ${
                            customCount === "1" ? "Person" : "People"
                          }`
                        : "Enter your exact group size"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showCustom && customCount && (
                    <div className="brand-gradient w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                  )}
                  {showCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustom(false);
                        setCustomCount("");
                        onTravelersChange("");
                      }}
                      className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center text-sm cursor-pointer"
                      title="Clear custom count"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Count Input */}
            {showCustom && (
              <div
                className="px-5 pb-5 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Enter number of travelers"
                      value={customCount}
                      onChange={(e) => handleCustomCountChange(e.target.value)}
                      className="text-lg py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 focus:border-sky-500 dark:focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950/50 focus:outline-none h-auto transition-all bg-white dark:bg-slate-900 dark:text-white hover:border-sky-300 dark:hover:border-sky-700 focus:bg-white dark:focus:bg-slate-900 active:bg-white dark:active:bg-slate-900"
                      min="1"
                      max="50"
                      autoFocus
                    />
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {customCount && parseInt(customCount) === 1
                        ? "Person"
                        : "People"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-800">
                    <span className="text-sky-600 dark:text-sky-400">💡</span>
                    <p className="text-sm text-sky-700 dark:text-sky-300 font-medium">
                      Perfect for large groups or specific party sizes
                    </p>
                  </div>
                  {customCount && parseInt(customCount) > 15 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                      <span className="text-amber-600 dark:text-amber-400">
                        ℹ️
                      </span>
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                        Large group! Consider splitting accommodations and
                        activities for better experiences.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="brand-card p-5 shadow-lg border-sky-200 dark:border-sky-800">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaUsers className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Why we ask about group size
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Group size helps us recommend appropriate accommodations,
                activities, transportation options, and dining experiences that
                work best for your travel party.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelerSelector;
