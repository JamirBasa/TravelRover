/**
 * BudgetBreakdown Component
 * Displays detailed budget breakdown for the trip
 */

import React from "react";
import { calculateTotalBudget, formatCurrency } from "@/utils/budgetCalculator";
import { DollarSign, MapPin, Hotel, Plane } from "lucide-react";

function BudgetBreakdown({ trip, className = "" }) {
  const budgetInfo = calculateTotalBudget(trip);

  // Don't render if no budget data
  if (budgetInfo.total === 0) {
    return null;
  }

  const { breakdown } = budgetInfo;
  const hasActivities = breakdown.activities > 0;
  const hasHotels = breakdown.hotels > 0;
  const hasFlights = breakdown.flights > 0;

  // Calculate percentages
  const total = budgetInfo.total;
  const percentages = {
    activities: total > 0 ? (breakdown.activities / total) * 100 : 0,
    hotels: total > 0 ? (breakdown.hotels / total) * 100 : 0,
    flights: total > 0 ? (breakdown.flights / total) * 100 : 0,
  };

  return (
    <div
      className={`brand-card p-6 sm:p-8 shadow-xl border-2 border-gray-200 dark:border-slate-700 rounded-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="brand-gradient w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg">
          <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Budget Breakdown
          </h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
            Estimated costs for your trip
          </p>
        </div>
      </div>

      {/* Total Budget */}
      <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-sky-950/30 rounded-xl p-5 sm:p-6 mb-8 border-2 border-sky-200 dark:border-sky-800 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-200">
            Total Estimated Budget
          </span>
          <span className="text-2xl sm:text-3xl font-bold brand-gradient-text">
            {formatCurrency(budgetInfo.total)}
          </span>
        </div>
      </div>

      {/* Breakdown Items */}
      <div className="space-y-5">
        {/* Activities Cost */}
        {hasActivities && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-green-200 dark:border-green-800/50 shadow-sm">
              <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Activities & Attractions
                </span>
                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  {formatCurrency(breakdown.activities)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-3 mb-2 border-2 border-gray-300 dark:border-slate-600 shadow-inner">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${percentages.activities}%` }}
                ></div>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                {percentages.activities.toFixed(1)}% of total budget
              </span>
            </div>
          </div>
        )}

        {/* Hotels Cost */}
        {hasHotels && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-blue-200 dark:border-blue-800/50 shadow-sm">
              <Hotel className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Accommodation
                </span>
                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  {formatCurrency(breakdown.hotels)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-3 mb-2 border-2 border-gray-300 dark:border-slate-600 shadow-inner">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${percentages.hotels}%` }}
                ></div>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                {percentages.hotels.toFixed(1)}% of total budget
              </span>
            </div>
          </div>
        )}

        {/* Flights Cost */}
        {hasFlights && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-sky-200 dark:border-sky-800/50 shadow-sm">
              <Plane className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Flights
                </span>
                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  {formatCurrency(breakdown.flights)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-3 mb-2 border-2 border-gray-300 dark:border-slate-600 shadow-inner">
                <div
                  className="brand-gradient h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${percentages.flights}%` }}
                ></div>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                {percentages.flights.toFixed(1)}% of total budget
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-8 pt-5 border-t-2 border-gray-200 dark:border-slate-700">
        <div className="flex items-start gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4">
          <span className="text-xl flex-shrink-0">💡</span>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong className="text-gray-700 dark:text-gray-300 font-bold">Note:</strong>{" "}
            These are estimated costs. Actual prices may vary based on season,
            availability, and booking time.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BudgetBreakdown;
