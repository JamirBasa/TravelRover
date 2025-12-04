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

  // Calculate hotel breakdown for transparency
  const hotelBreakdown = React.useMemo(() => {
    const hotels = tripData?.hotels || [];
    const numNights = Math.max(
      1,
      (tripData?.userSelection?.duration ||
        tripData?.userSelection?.noOfDays ||
        1) - 1
    );

    if (!Array.isArray(hotels) || hotels.length === 0) return null;

    const selectedHotel = hotels[0];
    const priceField =
      selectedHotel?.pricePerNight ||
      selectedHotel?.priceRange ||
      selectedHotel?.price_range ||
      selectedHotel?.priceNumeric;
    const parsePrice = (price) => {
      if (!price) return 0;
      if (typeof price === "number") return price;
      const numericString = String(price)
        .replace(/[₱$,\s]/g, "")
        .trim();
      const parsed = parseFloat(numericString);
      return isNaN(parsed) ? 0 : parsed;
    };
    const pricePerNight = parsePrice(priceField);

    return {
      hotelName:
        selectedHotel?.hotelName || selectedHotel?.name || "Selected Hotel",
      pricePerNight,
      numNights,
      total: pricePerNight * numNights,
    };
  }, [tripData]);

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
            {!withinBudget && remaining < 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                ({((Math.abs(remaining) / userBudget) * 100).toFixed(0)}% over)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Budget Exceeded Recommendations */}
      {budgetCompliance && !withinBudget && remaining < 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-700 p-5 rounded-lg">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-amber-600 dark:text-amber-400 mt-1 text-xl flex-shrink-0" />
            <div className="flex-1">
              <h5 className="font-bold text-amber-900 dark:text-amber-300 mb-2 text-lg">
                💡 Ways to Reduce Costs
              </h5>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-400">
                {hotelBreakdown && hotelBreakdown.total > userBudget * 0.5 && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold">🏨</span>
                    <span>
                      <strong>
                        Accommodation is{" "}
                        {((hotelBreakdown.total / totalCost) * 100).toFixed(0)}%
                        of your budget.
                      </strong>{" "}
                      Consider budget-friendly options (₱1,500-2,500/night)
                      instead of ₱
                      {hotelBreakdown.pricePerNight.toLocaleString()}/night.{" "}
                      Savings: ₱
                      {Math.max(
                        0,
                        (hotelBreakdown.pricePerNight - 2000) *
                          hotelBreakdown.numNights
                      ).toLocaleString()}
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="font-bold">📅</span>
                  <span>
                    <strong>Shorten your trip</strong> by 1-2 days to reduce
                    accommodation and activity costs
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">🎯</span>
                  <span>
                    <strong>Select free or low-cost activities</strong> like
                    beaches, parks, and hiking trails
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">💰</span>
                  <span>
                    <strong>Increase your budget</strong> to ₱
                    {totalCost.toLocaleString()} to match estimated costs
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Cost Transparency */}
      {hotelBreakdown && hotelBreakdown.total > 0 && (
        <div className="bg-blue-50 dark:bg-slate-800 border border-blue-300 dark:border-blue-700 p-4 rounded-lg">
          <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            🏨 Accommodation Cost Breakdown
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">
                Selected Hotel:
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {hotelBreakdown.hotelName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">
                Price per Night:
              </span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                ₱{hotelBreakdown.pricePerNight.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">
                Number of Nights:
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {hotelBreakdown.numNights}
              </span>
            </div>
            <div className="border-t-2 border-blue-300 dark:border-blue-600 pt-2 mt-2 flex justify-between items-center">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Total Accommodation:
              </span>
              <span className="font-bold text-lg text-blue-700 dark:text-blue-400">
                ₱{hotelBreakdown.pricePerNight.toLocaleString()} ×{" "}
                {hotelBreakdown.numNights} = ₱
                {hotelBreakdown.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Flight Cost Transparency */}
      {tripData?.realFlightData?.flights &&
        tripData.realFlightData.flights.length > 0 && (
          <div className="bg-sky-50 dark:bg-slate-800 border border-sky-300 dark:border-sky-700 p-4 rounded-lg">
            <h5 className="font-semibold text-sky-900 dark:text-sky-300 mb-3 flex items-center gap-2">
              ✈️ Flight Cost Breakdown
            </h5>
            <div className="space-y-3">
              {tripData.realFlightData.flights.map((flight, index) => {
                const parsePrice = (price) => {
                  if (!price) return 0;
                  if (typeof price === "number") return price;
                  const numericString = String(price)
                    .replace(/[₱$,\s]/g, "")
                    .trim();
                  const parsed = parseFloat(numericString);
                  return isNaN(parsed) ? 0 : parsed;
                };

                const travelers =
                  flight.travelers || tripData?.userSelection?.travelers || 1;
                const totalCost =
                  flight.total_for_group_numeric ||
                  parsePrice(flight.total_for_group) ||
                  flight.numeric_price * travelers ||
                  0;
                const perPerson = totalCost / travelers;

                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-900 p-3 rounded border border-sky-200 dark:border-sky-800"
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {flight.departure_airport?.id || "?"} →{" "}
                          {flight.arrival_airport?.id || "?"}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                          {flight.name || "Unknown Airline"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">
                          Price per Person:
                        </span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          ₱{perPerson.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">
                          Travelers:
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {travelers}
                        </span>
                      </div>
                      <div className="border-t border-sky-200 dark:border-sky-800 pt-2 flex justify-between items-center">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          Flight Total:
                        </span>
                        <span className="font-bold text-sky-700 dark:text-sky-400">
                          ₱{perPerson.toLocaleString()} × {travelers} = ₱
                          {totalCost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {tripData.realFlightData.flights.length > 1 && (
                <div className="border-t-2 border-sky-300 dark:border-sky-600 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    Total Flights:
                  </span>
                  <span className="font-bold text-lg text-sky-700 dark:text-sky-400">
                    ₱
                    {tripData.realFlightData.flights
                      .reduce((sum, f) => {
                        const travelers =
                          f.travelers ||
                          tripData?.userSelection?.travelers ||
                          1;
                        const parsePrice = (price) => {
                          if (!price) return 0;
                          if (typeof price === "number") return price;
                          const numericString = String(price)
                            .replace(/[₱$,\s]/g, "")
                            .trim();
                          const parsed = parseFloat(numericString);
                          return isNaN(parsed) ? 0 : parsed;
                        };
                        return (
                          sum +
                          (f.total_for_group_numeric ||
                            parsePrice(f.total_for_group) ||
                            f.numeric_price * travelers ||
                            0)
                        );
                      }, 0)
                      .toLocaleString()}
                  </span>
                </div>
              )}
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
