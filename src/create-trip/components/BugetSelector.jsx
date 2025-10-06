import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SelectBudgetOptions } from "../../constants/options";
import { FaInfoCircle } from "react-icons/fa";

const BudgetSelector = ({
  value,
  customValue,
  onBudgetChange,
  onCustomBudgetChange,
  error,
}) => {
  const [showCustom, setShowCustom] = useState(!!customValue); // Show custom if there's already a custom value

  // Keep showCustom state in sync with customValue
  useEffect(() => {
    if (customValue && !showCustom) {
      setShowCustom(true);
    }
  }, [customValue, showCustom]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          What's your budget range?
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Choose a budget that works for you - we'll optimize your experience 💰
        </p>
      </div>

      <div className="space-y-4">
        {/* Budget Info */}
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaInfoCircle className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Budget Planning
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Your budget helps us recommend the best accommodations, dining,
                activities, and transportation options for your trip.
              </p>
            </div>
          </div>
        </div>

        {/* Preset budget options */}
        <div className="space-y-3">
          {SelectBudgetOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => {
                onBudgetChange(option.title);
                setShowCustom(false);
                onCustomBudgetChange("");
              }}
              className={`group p-5 cursor-pointer border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
                value === option.title && !customValue
                  ? "shadow-xl border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50"
                  : "border-gray-200 hover:border-sky-300 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                    value === option.title && !customValue
                      ? "brand-gradient shadow-lg"
                      : "bg-gray-100 group-hover:bg-sky-100"
                  }`}
                >
                  <span
                    className={
                      value === option.title && !customValue ? "text-white" : ""
                    }
                  >
                    {option.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-semibold text-lg transition-colors ${
                      value === option.title && !customValue
                        ? "text-sky-800"
                        : "text-gray-800 group-hover:text-sky-700"
                    }`}
                  >
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                  <p className="text-xs text-sky-600 font-semibold mt-1">
                    {option.range}
                  </p>
                </div>
                {value === option.title && !customValue && (
                  <div className="brand-gradient w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Budget Option */}
        <div className="pt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs text-gray-500 font-medium px-2">OR</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          <div
            className={`group border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
              showCustom || customValue
                ? "shadow-xl border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50"
                : "border-gray-200 hover:border-sky-300 hover:shadow-lg"
            }`}
          >
            {/* Custom Budget Header - Always Visible */}
            <div
              onClick={() => {
                if (!showCustom) {
                  setShowCustom(true);
                  // Clear preset budget when opening custom
                  onBudgetChange("");
                }
              }}
              className="p-5 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                      customValue
                        ? "brand-gradient shadow-lg"
                        : "bg-gray-100 group-hover:bg-sky-100"
                    }`}
                  >
                    <span className={customValue ? "text-white" : ""}>🎯</span>
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-lg transition-colors ${
                        customValue
                          ? "text-sky-800"
                          : "text-gray-800 group-hover:text-sky-700"
                      }`}
                    >
                      Custom Budget
                    </h3>
                    <p className="text-sm text-gray-600">
                      {customValue
                        ? `₱${parseInt(customValue).toLocaleString()}`
                        : "Enter your specific budget amount"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {customValue && (
                    <div className="brand-gradient w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                  )}
                  {(showCustom || customValue) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustom(false);
                        onCustomBudgetChange("");
                      }}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center text-sm"
                      title="Clear custom budget"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Budget Input - Only When Active */}
            {showCustom && (
              <div
                className="px-5 pb-5 border-t border-gray-200 bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-700">
                      ₱
                    </span>
                    <Input
                      type="number"
                      placeholder="Enter your budget amount"
                      value={customValue}
                      onChange={(e) => {
                        onCustomBudgetChange(e.target.value);
                        onBudgetChange("");
                      }}
                      className="text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none h-auto transition-all bg-white"
                      min="1000"
                      step="500"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <span className="text-sky-600">💡</span>
                    <p className="text-sm text-sky-700 font-medium">
                      Include accommodation, food, activities, and
                      transportation costs
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600">⚠️</span>
              </div>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetSelector;
