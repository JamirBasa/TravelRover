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
        <p className="text-gray-700 text-base font-medium">
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
                  ? "shadow-xl border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50"
                  : "border-gray-200 hover:border-sky-300 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
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
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs text-gray-500 font-medium px-2">OR</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          <div
            className={`group border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
              showCustom
                ? "shadow-xl border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50"
                : "border-gray-200 hover:border-sky-300 hover:shadow-lg"
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
                        : "bg-gray-100 group-hover:bg-sky-100"
                    }`}
                  >
                    <span
                      className={showCustom && customCount ? "text-white" : ""}
                    >
                      👥
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-lg transition-colors ${
                        showCustom && customCount
                          ? "text-sky-800"
                          : "text-gray-800 group-hover:text-sky-700"
                      }`}
                    >
                      Custom Group Size
                    </h3>
                    <p className="text-sm text-gray-600">
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
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center text-sm"
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
                className="px-5 pb-5 border-t border-gray-200 bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Enter number of travelers"
                      value={customCount}
                      onChange={(e) => handleCustomCountChange(e.target.value)}
                      className="text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none h-auto transition-all bg-white hover:border-sky-300 focus:bg-white active:bg-white"
                      style={{
                        WebkitBoxShadow: "0 0 0 1000px white inset",
                        WebkitTextFillColor: "inherit",
                      }}
                      min="1"
                      max="50"
                      autoFocus
                    />
                    <span className="text-lg font-semibold text-gray-700 whitespace-nowrap">
                      {customCount && parseInt(customCount) === 1
                        ? "Person"
                        : "People"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <span className="text-sky-600">💡</span>
                    <p className="text-sm text-sky-700 font-medium">
                      Perfect for large groups or specific party sizes
                    </p>
                  </div>
                  {customCount && parseInt(customCount) > 15 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-amber-600">ℹ️</span>
                      <p className="text-sm text-amber-700 font-medium">
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
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaUsers className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Why we ask about group size
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
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
