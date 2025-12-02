// src/view-trip/components/BudgetBreakdown.jsx
import React from "react";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

/**
 * Budget Breakdown Component
 * Displays detailed cost breakdown with budget compliance status
 */
const BudgetBreakdown = ({ tripData }) => {
  // Extract budget data
  const budgetCompliance = tripData?.budgetCompliance;
  const dailyCosts = tripData?.dailyCosts || [];
  const grandTotal = tripData?.grandTotal;
  const missingPrices = tripData?.missingPrices || [];
  const pricingNotes = tripData?.pricingNotes;

  // 🔍 DIAGNOSTIC: Log trip-level budget data
  React.useEffect(() => {
    if (budgetCompliance || dailyCosts.length > 0) {
      console.group("🔍 Trip-Level Budget Breakdown Data");
      console.log("Budget Compliance:", budgetCompliance);
      console.log("Daily Costs:", dailyCosts);
      console.log("Grand Total:", grandTotal);
      console.log("Missing Prices:", missingPrices);
      console.log("Pricing Notes:", pricingNotes);
      console.groupEnd();
    }
  }, [budgetCompliance, dailyCosts, grandTotal, missingPrices, pricingNotes]);

  // If no budget data, don't render
  if (!budgetCompliance && !dailyCosts.length) {
    return null;
  }

  const { userBudget, totalCost, remaining, withinBudget } =
    budgetCompliance || {};

  return (
    <div className="brand-card p-6 space-y-6">
      {/* Header with Compliance Status */}
      <div className="flex items-center justify-between border-b border-sky-200 pb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          💰 Budget Breakdown
        </h3>
        {withinBudget !== undefined && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              withinBudget
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {withinBudget ? (
              <>
                <FaCheckCircle className="text-green-600" />
                <span className="font-semibold">Within Budget</span>
              </>
            ) : (
              <>
                <FaExclamationTriangle className="text-red-600" />
                <span className="font-semibold">Over Budget</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pricing Source Information */}
      {pricingNotes && (
        <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
            <div>
              <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Pricing Information
              </h5>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {pricingNotes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Summary */}
      {budgetCompliance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Budget Allocated
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              ₱{userBudget?.toLocaleString()}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              withinBudget
                ? "bg-green-50 border-green-200 dark:bg-green-900/20"
                : "bg-red-50 border-red-200 dark:bg-red-900/20"
            }`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Cost
            </p>
            <p
              className={`text-2xl font-bold ${
                withinBudget
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              ₱{totalCost?.toLocaleString()}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              remaining >= 0
                ? "bg-slate-50 border-slate-200 dark:bg-slate-800"
                : "bg-red-50 border-red-200 dark:bg-red-900/20"
            }`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {remaining >= 0 ? "Remaining" : "Over Budget"}
            </p>
            <p
              className={`text-2xl font-bold ${
                remaining >= 0
                  ? "text-gray-700 dark:text-gray-300"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              ₱{Math.abs(remaining)?.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Daily Cost Breakdown */}
      {dailyCosts.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Daily Costs
          </h4>
          <div className="space-y-3">
            {dailyCosts.map((dayCost, index) => {
              const { day, breakdown } = dayCost;
              const { accommodation, meals, activities, transport, subtotal } =
                breakdown || {};

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-800 dark:text-white">
                      Day {day}
                    </h5>
                    <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                      ₱{subtotal?.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        🏨 Accommodation:
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        ₱{accommodation?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        🍽️ Meals:
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        ₱{meals?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        🎯 Activities:
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        ₱{activities?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        🚗 Transport:
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        ₱{transport?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grand Total */}
      {grandTotal !== undefined && (
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 p-5 rounded-lg border-2 border-sky-300 dark:border-sky-600">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800 dark:text-white">
              Grand Total
            </span>
            <span className="text-3xl font-bold brand-gradient-text">
              ₱{grandTotal?.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Missing Prices Warning */}
      {missingPrices.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                Items Requiring Price Confirmation (₱???)
              </h5>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                These items have uncertain pricing. Please verify actual costs
                before booking:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                {missingPrices.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-3 italic">
                💡 Tip: Contact the venue/service provider directly for current
                rates
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetBreakdown;
