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
    <div className={`brand-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Budget Breakdown</h3>
          <p className="text-sm text-gray-500">Estimated costs for your trip</p>
        </div>
      </div>

      {/* Total Budget */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total Estimated Budget</span>
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
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">Activities & Attractions</span>
                <span className="font-bold text-gray-900">{formatCurrency(breakdown.activities)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentages.activities}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">{percentages.activities.toFixed(1)}% of total budget</span>
            </div>
          </div>
        )}

        {/* Hotels Cost */}
        {hasHotels && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Hotel className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">Accommodation</span>
                <span className="font-bold text-gray-900">{formatCurrency(breakdown.hotels)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentages.hotels}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">{percentages.hotels.toFixed(1)}% of total budget</span>
            </div>
          </div>
        )}

        {/* Flights Cost */}
        {hasFlights && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plane className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">Flights</span>
                <span className="font-bold text-gray-900">{formatCurrency(breakdown.flights)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentages.flights}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">{percentages.flights.toFixed(1)}% of total budget</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 <strong>Note:</strong> These are estimated costs. Actual prices may vary based on season, availability, and booking time.
        </p>
      </div>
    </div>
  );
}

export default BudgetBreakdown;
