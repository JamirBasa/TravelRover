/**
 * BudgetBreakdown Component - Collapsible Version
 * Displays detailed budget breakdown for the trip
 * ✅ OPTIMIZED: Starts collapsed to reduce scrolling
 */

import React, { useState } from "react";
import {
  calculateTotalBudget,
  formatCurrency,
  getUserBudget,
  parsePrice,
} from "@/utils";
import {
  DollarSign,
  MapPin,
  Hotel,
  Plane,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Copy,
  Check,
} from "lucide-react";

function BudgetBreakdown({ trip, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFlightDiagnostics, setShowFlightDiagnostics] = useState(false);
  const [copiedDiagnostics, setCopiedDiagnostics] = useState(false);
  const budgetInfo = calculateTotalBudget(trip);

  // 🔍 DIAGNOSTIC: Log raw data structure for budget debugging
  React.useEffect(() => {
    console.group("🔍 Budget Diagnostic Data");
    console.log("User Budget:", {
      budgetAmount: trip?.userSelection?.budgetAmount,
      customBudget: trip?.userSelection?.customBudget,
      travelers: trip?.userSelection?.travelers,
      travelersType: typeof trip?.userSelection?.travelers,
      duration: trip?.userSelection?.duration,
    });
    console.log(
      "Real Flight Data:",
      trip?.realFlightData?.flights?.map((f) => ({
        name: f.name,
        price: f.price,
        numeric_price: f.numeric_price,
        total_for_group: f.total_for_group,
        price_per_person: f.price_per_person,
        travelers: f.travelers,
        pricing_note: f.pricing_note,
      }))
    );
    console.log(
      "Real Hotel Data:",
      trip?.realHotelData?.hotels?.map((h) => ({
        hotelName: h.hotelName,
        pricePerNight: h.pricePerNight,
        priceNumeric: h.priceNumeric,
        priceRange: h.priceRange,
      }))
    );
    console.log("[BudgetCalculator] Final breakdown:", budgetInfo.breakdown);
    console.log("[BudgetCalculator] Total:", budgetInfo.total);
    console.groupEnd();
  }, [trip, budgetInfo]);

  // Don't render if no breakdown data at all
  const hasAnyData =
    budgetInfo.breakdown.activities > 0 ||
    budgetInfo.breakdown.hotels > 0 ||
    budgetInfo.breakdown.flights > 0 ||
    budgetInfo.breakdown.groundTransport > 0;

  if (!hasAnyData) {
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
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                Cost Breakdown
              </h3>
              {!hasHotels && trip?.hotelSearchRequested === false && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700">
                  Activities Only
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              Estimated Total:{" "}
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
          {/* Total Estimated Cost Highlight */}
          <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-sky-950/30 rounded-lg p-4 sm:p-5 mb-6 border-2 border-sky-200 dark:border-sky-800 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-200">
                Total Estimated Cost
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
                    {percentages.activities.toFixed(1)}% of estimated cost
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
                    {percentages.hotels.toFixed(1)}% of estimated cost
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
                    {percentages.flights.toFixed(1)}% of estimated cost
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Budget vs Cost Comparison */}
          <div className="mt-6 p-4 bg-white dark:bg-slate-900/50 rounded-lg border-2 border-gray-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="text-lg">💰</span>
              Budget Summary
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Your Budget:
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {(() => {
                    const userBudget = getUserBudget(trip);
                    return userBudget
                      ? `₱${userBudget.toLocaleString()}`
                      : "Not set";
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated Cost:
                </span>
                <span className="font-bold brand-gradient-text">
                  {formatCurrency(budgetInfo.total)}
                </span>
              </div>
              {(() => {
                const userBudget = getUserBudget(trip);
                const estimatedCost = budgetInfo.total;

                if (userBudget && estimatedCost > 0) {
                  const difference = userBudget - estimatedCost;
                  const percentDiff = Math.abs((difference / userBudget) * 100);
                  const isUnder = difference >= 0;

                  return (
                    <>
                      <div className="h-px bg-gray-200 dark:bg-slate-700 my-2"></div>
                      <div
                        className={`flex items-center justify-between p-2 rounded ${
                          isUnder
                            ? "bg-green-50 dark:bg-green-950/30"
                            : "bg-amber-50 dark:bg-amber-950/30"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            isUnder
                              ? "text-green-700 dark:text-green-400"
                              : "text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {isUnder ? "Under Budget ✅" : "Over Budget ⚠️"}
                        </span>
                        <span
                          className={`font-bold ${
                            isUnder
                              ? "text-green-700 dark:text-green-400"
                              : "text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {isUnder ? "+" : "-"}₱
                          {Math.abs(difference).toLocaleString()} (
                          {percentDiff.toFixed(1)}%)
                        </span>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Flight Calculation Diagnostics (Dev Mode) */}
          {hasFlights && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowFlightDiagnostics(!showFlightDiagnostics)}
                className="w-full flex items-center justify-between gap-3 p-3 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-950/50 rounded-lg border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                    Flight Calculation Details
                  </span>
                </div>
                {showFlightDiagnostics ? (
                  <ChevronUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                )}
              </button>

              {showFlightDiagnostics && (
                <div className="mt-3 space-y-3">
                  {/* Flight Diagnostics Info */}
                  {trip?.realFlightData?.flights?.map((flight, index) => {
                    // ✅ FIX: Use numeric fields to avoid NaN from string division
                    const totalGroupNumeric =
                      flight.total_for_group_numeric ||
                      parsePrice(flight.total_for_group) ||
                      0;
                    const perPersonNumeric =
                      flight.price_per_person_numeric ||
                      parsePrice(flight.price_per_person) ||
                      flight.numeric_price ||
                      0;

                    const travelers =
                      flight.travelers || trip?.userSelection?.travelers || 1;
                    const perPerson =
                      totalGroupNumeric > 0
                        ? totalGroupNumeric / travelers
                        : perPersonNumeric;

                    const isHighCost = perPerson > 20000;
                    const isInternational = perPerson >= 30000;

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          isInternational
                            ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                            : isHighCost
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                            : "bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-700"
                        }`}
                      >
                        {/* Flight Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Plane
                                className={`h-4 w-4 ${
                                  isInternational
                                    ? "text-purple-600 dark:text-purple-400"
                                    : isHighCost
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                              />
                              <h5 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                {flight.name || `Flight ${index + 1}`}
                              </h5>
                            </div>
                            {flight.departure_airport?.id &&
                              flight.arrival_airport?.id && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {flight.departure_airport.id} →{" "}
                                  {flight.arrival_airport.id}
                                </p>
                              )}
                          </div>
                          {(isHighCost || isInternational) && (
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                isInternational
                                  ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                                  : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                              }`}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {isInternational ? "International?" : "High Cost"}
                            </div>
                          )}
                        </div>

                        {/* Pricing Details */}
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Method:
                              </span>
                              <p className="font-mono text-gray-900 dark:text-gray-100 font-semibold">
                                {flight.total_for_group_numeric
                                  ? "total_for_group_numeric"
                                  : flight.total_for_group
                                  ? "total_for_group"
                                  : flight.price_per_person
                                  ? "price_per_person"
                                  : flight.numeric_price
                                  ? "numeric_price"
                                  : "legacy"}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Travelers:
                              </span>
                              <p className="font-mono text-gray-900 dark:text-gray-100 font-semibold">
                                {flight.travelers ||
                                  trip?.userSelection?.travelers ||
                                  1}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Per Person:
                              </span>
                              <p
                                className={`font-mono font-semibold ${
                                  perPerson > 60000
                                    ? "text-red-600 dark:text-red-400"
                                    : perPerson > 20000
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                ₱{Math.round(perPerson).toLocaleString()}
                                {perPerson > 60000 && (
                                  <span className="text-xs ml-1">
                                    (⚠️ Too High!)
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Group Total:
                              </span>
                              <p className="font-mono text-gray-900 dark:text-gray-100 font-semibold">
                                ₱
                                {Math.round(totalGroupNumeric).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Raw Price Data */}
                          <div className="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-1">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {flight.price && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    price:
                                  </span>
                                  <p className="font-mono text-gray-600 dark:text-gray-300">
                                    {JSON.stringify(flight.price)}
                                  </p>
                                </div>
                              )}
                              {flight.price_numeric !== undefined && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    price_numeric:
                                  </span>
                                  <p className="font-mono text-gray-600 dark:text-gray-300">
                                    {flight.price_numeric}
                                  </p>
                                </div>
                              )}
                              {flight.total_for_group_numeric !== undefined && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    total_for_group_numeric:
                                  </span>
                                  <p className="font-mono text-gray-600 dark:text-gray-300">
                                    {flight.total_for_group_numeric}
                                  </p>
                                </div>
                              )}
                              {flight.price_per_person_numeric !==
                                undefined && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    price_per_person_numeric:
                                  </span>
                                  <p className="font-mono text-gray-600 dark:text-gray-300">
                                    {flight.price_per_person_numeric}
                                  </p>
                                </div>
                              )}
                            </div>
                            {flight.pricing_note && (
                              <div className="text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                  Note:
                                </span>
                                <p className="font-mono text-gray-600 dark:text-gray-300">
                                  {flight.pricing_note}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary Stats */}
                  <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-lg border-2 border-sky-200 dark:border-sky-800">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Total Flights:
                        </span>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {trip?.realFlightData?.flights?.length || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Total Cost:
                        </span>
                        <p className="font-bold brand-gradient-text">
                          {formatCurrency(breakdown.flights)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Cost/Person:
                        </span>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          ₱
                          {Math.round(
                            breakdown.flights /
                              (trip?.userSelection?.travelers || 1)
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Travelers:
                        </span>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {trip?.userSelection?.travelers || 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Copy Diagnostics Button */}
                  <button
                    onClick={() => {
                      const diagnosticData = {
                        flights: trip?.realFlightData?.flights?.map((f, i) => ({
                          index: i,
                          name: f.name,
                          route: `${f.departure_airport?.id || "?"} → ${
                            f.arrival_airport?.id || "?"
                          }`,
                          price: f.price,
                          numeric_price: f.numeric_price,
                          total_for_group: f.total_for_group,
                          price_per_person: f.price_per_person,
                          travelers: f.travelers,
                          pricing_note: f.pricing_note,
                        })),
                        summary: {
                          totalFlights:
                            trip?.realFlightData?.flights?.length || 0,
                          totalCost: breakdown.flights,
                          travelers: trip?.userSelection?.travelers || 1,
                          costPerPerson: Math.round(
                            breakdown.flights /
                              (trip?.userSelection?.travelers || 1)
                          ),
                        },
                      };
                      navigator.clipboard.writeText(
                        JSON.stringify(diagnosticData, null, 2)
                      );
                      setCopiedDiagnostics(true);
                      setTimeout(() => setCopiedDiagnostics(false), 2000);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg border border-gray-300 dark:border-slate-600 transition-colors cursor-pointer"
                  >
                    {copiedDiagnostics ? (
                      <>
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Copied to Clipboard!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Copy Diagnostic Data
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

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
