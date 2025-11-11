/**
 * BudgetBreakdown Component - Collapsible Version
 * Displays detailed budget breakdown for the trip
 * ✅ OPTIMIZED: Starts collapsed to reduce scrolling
 */

import React, { useState } from "react";
import { calculateTotalBudget, formatCurrency } from "@/utils";
import {
  DollarSign,
  MapPin,
  Hotel,
  Plane,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function BudgetBreakdown({ trip, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
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
      className={`brand-card shadow-xl border-2 border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden ${className}`}
    >
      {/* Collapsible Header - Click to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        aria-expanded={isExpanded}
        aria-controls="budget-details"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="brand-gradient w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-0.5">
              Budget Breakdown
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              Total:{" "}
              <span className="font-bold brand-gradient-text">
                {formatCurrency(budgetInfo.total)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="text-xs font-semibold hidden sm:inline">
            {isExpanded ? "Hide Details" : "View Details"}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronDown className="h-5 w-5 group-hover:scale-110 transition-transform" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div
          id="budget-details"
          className="border-t-2 border-gray-200 dark:border-slate-700 p-4 sm:p-6 bg-gray-50/50 dark:bg-slate-800/30"
        >
          {/* Total Budget Highlight */}
          <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-sky-950/30 rounded-lg p-4 sm:p-5 mb-6 border-2 border-sky-200 dark:border-sky-800 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-200">
                Total Estimated Budget
              </span>
              <span className="text-xl sm:text-2xl font-bold brand-gradient-text">
                {formatCurrency(budgetInfo.total)}
              </span>
            </div>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-4">
            {/* Activities Cost */}
            {hasActivities && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-200 dark:border-green-800/50 shadow-sm">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      Activities & Attractions
                    </span>
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      {formatCurrency(breakdown.activities)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-2 mb-1.5 border border-gray-300 dark:border-slate-600 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${percentages.activities}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {percentages.activities.toFixed(1)}% of total budget
                  </span>
                </div>
              </div>
            )}

            {/* Hotels Cost */}
            {hasHotels && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                  <Hotel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      Accommodation
                    </span>
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      {formatCurrency(breakdown.hotels)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-2 mb-1.5 border border-gray-300 dark:border-slate-600 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-blue-500 h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${percentages.hotels}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {percentages.hotels.toFixed(1)}% of total budget
                  </span>
                </div>
              </div>
            )}

            {/* Flights Cost */}
            {hasFlights && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-sky-200 dark:border-sky-800/50 shadow-sm">
                  <Plane className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      Flights
                    </span>
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      {formatCurrency(breakdown.flights)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700/70 rounded-full h-2 mb-1.5 border border-gray-300 dark:border-slate-600 shadow-inner">
                    <div
                      className="brand-gradient h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${percentages.flights}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {percentages.flights.toFixed(1)}% of total budget
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-start gap-2 bg-gray-100 dark:bg-slate-800/50 rounded-lg p-3">
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <strong className="text-gray-700 dark:text-gray-300 font-bold">
                  Note:
                </strong>{" "}
                Estimated costs. Actual prices may vary.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetBreakdown;
