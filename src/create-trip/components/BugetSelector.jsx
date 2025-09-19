import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SelectBudgetOptions } from "../../constants/options";
import { FaMoneyBillWave } from "react-icons/fa";

const BudgetSelector = ({
  value,
  customValue,
  onBudgetChange,
  onCustomBudgetChange,
  error,
}) => {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-4">
      {/* Preset budget options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SelectBudgetOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => {
              onBudgetChange(option.title);
              setShowCustom(false);
              onCustomBudgetChange("");
            }}
            className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg transition-all duration-200 ${
              value === option.title && !showCustom
                ? "shadow-lg border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="text-3xl mb-2 flex justify-center">
              {option.icon}
            </div>
            <h3 className="font-semibold text-lg text-center">
              {option.title}
            </h3>
            <p className="text-sm text-gray-600 text-center">{option.desc}</p>
            <p className="text-xs text-blue-600 font-medium text-center mt-2">
              {option.range}
            </p>
          </div>
        ))}
      </div>

      {/* Custom Budget Option */}
      <div className="border-t pt-4">
        <div
          onClick={() => setShowCustom(true)}
          className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg transition-all duration-200 ${
            showCustom
              ? "shadow-lg border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaMoneyBillWave style={{ color: "#3498db", fontSize: "24px" }} />
              <div>
                <h3 className="font-semibold text-lg">Custom Budget</h3>
                <p className="text-sm text-gray-600">
                  Enter your specific budget amount
                </p>
              </div>
            </div>
            {showCustom && (
              <div className="ml-4 flex items-center gap-2">
                <span className="text-sm font-medium">₱</span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customValue}
                  onChange={(e) => {
                    onCustomBudgetChange(e.target.value);
                    onBudgetChange("");
                  }}
                  className="w-32"
                  min="1000"
                  step="500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default BudgetSelector;

