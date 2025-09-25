import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SelectBudgetOptions } from "../../constants/options";
import { FaMoneyBillWave, FaInfoCircle } from "react-icons/fa";

const BudgetSelector = ({
  value,
  customValue,
  onBudgetChange,
  onCustomBudgetChange,
  error,
}) => {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          What's your budget range?
        </h2>
        <p className="text-gray-600 text-sm">
          Choose a budget that works for you - we'll optimize your experience
        </p>
      </div>

      <div className="space-y-4">
        {/* Budget Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">
                Budget Planning
              </h3>
              <p className="text-blue-700 text-sm">
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
              className={`p-4 cursor-pointer border-2 rounded-lg hover:shadow-lg transition-all duration-200 ${
                value === option.title && !showCustom
                  ? "shadow-lg border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{option.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {option.range}
                  </p>
                </div>
                {value === option.title && !showCustom && (
                  <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Budget Option */}
        <div className="border-t-2 border-gray-200 pt-4">
          <div
            onClick={() => setShowCustom(!showCustom)}
            className={`p-4 cursor-pointer border-2 rounded-lg hover:shadow-lg transition-all duration-200 ${
              showCustom || customValue
                ? "shadow-lg border-black bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaMoneyBillWave
                  style={{ color: "#3498db", fontSize: "24px" }}
                />
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    Custom Budget
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enter your specific budget amount
                  </p>
                </div>
              </div>
              {(showCustom || customValue) && (
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>

            {showCustom && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-gray-800">₱</span>
                  <Input
                    type="number"
                    placeholder="Enter your budget amount"
                    value={customValue}
                    onChange={(e) => {
                      onCustomBudgetChange(e.target.value);
                      onBudgetChange("");
                    }}
                    className="text-base py-3 px-3 rounded-lg border-2 focus:border-black h-auto"
                    min="1000"
                    step="500"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 Include accommodation, food, activities, and transportation
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetSelector;
