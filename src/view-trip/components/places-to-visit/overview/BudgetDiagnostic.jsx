/**
 * BudgetDiagnostic Component
 * Temporary diagnostic tool to check why budget isn't calculating
 * This will help us see the actual data structure
 */

import React from "react";
import { AlertCircle } from "lucide-react";

function BudgetDiagnostic({ trip }) {
  // Only show in development mode
  if (!import.meta.env.DEV) return null;

  const tripData =
    typeof trip?.tripData === "string"
      ? JSON.parse(trip.tripData)
      : trip?.tripData;

  return (
    <div className="brand-card p-6 border-2 border-orange-500 dark:border-orange-600 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="h-6 w-6 text-orange-500 dark:text-orange-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          🔍 Budget Diagnostic (Dev Only)
        </h3>
      </div>

      <div className="space-y-4 text-sm">
        {/* Trip Data Structure */}
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Trip Data Type:
          </p>
          <code className="block bg-gray-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto">
            {typeof trip?.tripData}
          </code>
        </div>

        {/* Itinerary Check */}
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Itinerary Data:
          </p>
          <code className="block bg-gray-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(
              {
                hasItinerary: !!tripData?.itinerary,
                hasItineraryData: !!tripData?.itinerary_data,
                itineraryLength: tripData?.itinerary?.length || 0,
                itineraryType: Array.isArray(tripData?.itinerary)
                  ? "array"
                  : typeof tripData?.itinerary,
                firstDay: tripData?.itinerary?.[0],
                firstDayPlanLength: Array.isArray(
                  tripData?.itinerary?.[0]?.plan
                )
                  ? tripData.itinerary[0].plan.length
                  : "not an array",
                sampleActivity: tripData?.itinerary?.[0]?.plan?.[0],
                // Show raw string preview if it's a string
                rawStringPreview:
                  typeof tripData?.itinerary === "string"
                    ? tripData.itinerary.substring(0, 200) + "..."
                    : "N/A",
                // Show first 3 days for context
                first3Days: tripData?.itinerary?.slice(0, 3),
              },
              null,
              2
            )}
          </code>
        </div>

        {/* Hotels Check */}
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Hotels Data:
          </p>
          <code className="block bg-gray-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(
              {
                hasHotels: !!tripData?.hotels,
                hotelsCount: tripData?.hotels?.length || 0,
                hotelsType: Array.isArray(tripData?.hotels)
                  ? "array"
                  : typeof tripData?.hotels,
                firstHotel: tripData?.hotels?.[0],
                // Show raw string preview if it's a string
                rawStringPreview:
                  typeof tripData?.hotels === "string"
                    ? tripData.hotels.substring(0, 200) + "..."
                    : "N/A",
                // Show first 3 hotels
                first3Hotels: tripData?.hotels?.slice(0, 3),
              },
              null,
              2
            )}
          </code>
        </div>

        {/* Flights Check */}
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Flights Data:
          </p>
          <code className="block bg-gray-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(
              {
                hasFlights: !!tripData?.flights,
                flightsCount: tripData?.flights?.length || 0,
                firstFlight: tripData?.flights?.[0],
              },
              null,
              2
            )}
          </code>
        </div>

        {/* User Selection */}
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            User Selection (for duration):
          </p>
          <code className="block bg-gray-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(trip?.userSelection, null, 2)}
          </code>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          💡 <strong>Tip:</strong> Check the browser console for detailed budget
          calculation logs. This diagnostic will be automatically hidden in
          production.
        </p>
      </div>
    </div>
  );
}

export default BudgetDiagnostic;
