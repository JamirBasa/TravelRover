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
      className={`brand-card p-6 shadow-lg border border-gray-200 dark:border-slate-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="brand-gradient w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
          <DollarSign className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Budget Breakdown
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimated costs for your trip
          </p>
        </div>
      </div>

      {/* Total Budget */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-lg p-4 mb-6 border border-sky-200 dark:border-sky-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Total Estimated Budget
          </span>
          <span className="text-2xl font-bold brand-gradient-text">
            {formatCurrency(budgetInfo.total)}
          </span>
        </div>
      </div>

      {/* Breakdown Items */}
      <div className="space-y-4">
        {/* Activities Cost */}
        {hasActivities && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-200 dark:border-green-800/50">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Activities & Attractions
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(breakdown.activities)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-2.5 mb-1 border border-gray-300 dark:border-slate-600">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${percentages.activities}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {percentages.activities.toFixed(1)}% of total budget
              </span>
            </div>
          </div>
        )}

        {/* Hotels Cost */}
        {hasHotels && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800/50">
              <Hotel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Accommodation
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(breakdown.hotels)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-2.5 mb-1 border border-gray-300 dark:border-slate-600">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-500 h-2.5 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${percentages.hotels}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {percentages.hotels.toFixed(1)}% of total budget
              </span>
            </div>
          </div>
        )}

        {/* Flights Cost */}
        {hasFlights && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-sky-200 dark:border-sky-800/50">
              <Plane className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Flights
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(breakdown.flights)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-2.5 mb-1 border border-gray-300 dark:border-slate-600">
                <div
                  className="brand-gradient h-2.5 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${percentages.flights}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {percentages.flights.toFixed(1)}% of total budget
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 <strong className="text-gray-700 dark:text-gray-300">Note:</strong>{" "}
          These are estimated costs. Actual prices may vary based on season,
          availability, and booking time.
        </p>
      </div>
    </div>
  );
}

export default BudgetBreakdown;
