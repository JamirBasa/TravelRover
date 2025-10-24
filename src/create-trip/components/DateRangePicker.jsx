// src/create-trip/components/DateRangePicker.jsx
// SIMPLIFIED VERSION - Reduced information overload
import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  FaCalendarAlt,
  FaClock,
  FaPlane,
  FaExclamationTriangle,
  FaLightbulb,
  FaDollarSign,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  calculateDuration,
  getMinDate,
  getMinEndDate,
} from "../../constants/options";
import {
  calculateTravelDates,
  validateTravelDates,
  getDateExplanation,
} from "../../utils/travelDateManager";
import {
  getBookingAdvice,
  formatDateDisplay,
} from "../../utils/flightPricingAnalyzer";

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDurationChange,
  className = "",
  flightData = {},
  destination = "",
}) {
  const [showAdvancedTips, setShowAdvancedTips] = useState(false);

  // ✅ FIXED: Calculate duration with useMemo to prevent unnecessary recalculations
  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0;

    // Validate dates
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    // Calculate inclusive days
    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Return inclusive count (Oct 23-29 = 7 days, not 6)
    return diffDays >= 0 ? diffDays + 1 : 0;
  }, [startDate, endDate]);

  // ✅ FIXED: Notify parent of duration changes without causing loops
  useEffect(() => {
    if (onDurationChange && duration >= 0) {
      onDurationChange(duration);
    }
  }, [duration]); // Only duration in deps, not onDurationChange

  const travelDateInfo = useMemo(() => {
    if (!startDate || !endDate || !destination) return null;

    const dates = calculateTravelDates({
      startDate,
      endDate,
      includeFlights: flightData.includeFlights,
      departureCity: flightData.departureCity,
      destination,
      travelers: "",
    });

    const validation = validateTravelDates({
      startDate,
      endDate,
      includeFlights: flightData.includeFlights,
      departureCity: flightData.departureCity,
      destination,
    });

    return { dates, validation };
  }, [
    startDate,
    endDate,
    destination,
    flightData.includeFlights,
    flightData.departureCity,
  ]);

  const bookingAdvice = useMemo(() => {
    if (!startDate || !flightData.includeFlights) return null;

    return getBookingAdvice(
      startDate,
      endDate,
      flightData.includeFlights,
      flightData.departureCity,
      destination
    );
  }, [
    startDate,
    endDate,
    flightData.includeFlights,
    flightData.departureCity,
    destination,
  ]);

  // ✅ ADDED: Validate date selection
  const dateError = useMemo(() => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    if (isNaN(start.getTime())) return "Invalid start date";
    if (isNaN(end.getTime())) return "Invalid end date";
    if (end < start) return "End date must be after start date";

    return null;
  }, [startDate, endDate]);

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          When are you traveling?
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
          Select your travel dates to plan the perfect itinerary 📅
        </p>
      </div>

      {/* Date Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              <FaCalendarAlt className="inline mr-2" />
              Start Date *
            </label>
            <Input
              type="date"
              min={getMinDate()}
              value={startDate || ""}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black dark:focus:border-sky-500 h-auto dark:bg-slate-900 dark:text-white dark:border-slate-600"
              placeholder="Select start date"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              End Date *
            </label>
            <Input
              type="date"
              min={getMinEndDate(startDate)}
              value={endDate || ""}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black dark:focus:border-sky-500 h-auto dark:bg-slate-900 dark:text-white dark:border-slate-600"
              disabled={!startDate}
              placeholder="Select end date"
            />
          </div>
        </div>

        {/* Show calculated duration */}
        {duration > 0 && !dateError && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FaClock className="text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-300">
                Trip Duration: {duration} {duration === 1 ? "day" : "days"}
              </span>
            </div>
            {/* ✅ ADDED: Show date range confirmation */}
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-6">
              {startDate &&
                endDate &&
                `${formatDateDisplay(startDate)} to ${formatDateDisplay(
                  endDate
                )}`}
            </p>
          </div>
        )}

        {/* ✅ FIXED: Date validation errors */}
        {dateError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-800 dark:text-red-300">
                {dateError}
              </span>
            </div>
          </div>
        )}

        {/* Flight Pricing Warnings - ONLY CRITICAL WARNINGS */}
        {bookingAdvice &&
          bookingAdvice.warnings.length > 0 &&
          bookingAdvice.warnings[0].level === "critical" && (
            <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-950/50">
                  <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-2 text-red-800 dark:text-red-300">
                    {bookingAdvice.timing.description} -{" "}
                    {bookingAdvice.pricing.impact}
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    • {bookingAdvice.warnings[0].message}
                  </p>

                  {/* Show flexible date suggestions for expensive bookings */}
                  {bookingAdvice.flexibleDates.length > 0 &&
                    bookingAdvice.pricing.multiplier >= 2.0 && (
                      <div className="mt-3 p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <FaLightbulb className="text-green-600 dark:text-green-400 text-sm" />
                          <span className="font-semibold text-green-800 dark:text-green-300 text-xs">
                            💰 Save up to{" "}
                            {Math.max(
                              ...bookingAdvice.flexibleDates.map(
                                (d) => d.savingsPercent
                              )
                            )}
                            % with flexible dates:
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {bookingAdvice.flexibleDates
                            .slice(0, 3)
                            .map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  onStartDateChange(suggestion.startDate);
                                  onEndDateChange(suggestion.endDate);
                                }}
                                className="text-left p-2 bg-white dark:bg-slate-900 rounded border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors cursor-pointer"
                              >
                                <div className="font-medium text-green-800 dark:text-green-300 text-xs">
                                  {suggestion.label}
                                </div>
                                <div className="text-[10px] text-green-600 dark:text-green-400">
                                  {formatDateDisplay(suggestion.startDate)}
                                </div>
                                <div className="text-[10px] text-green-700 dark:text-green-400 font-medium mt-1">
                                  ~{suggestion.savingsPercent}% cheaper
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

        {/* Flight timing info - SIMPLIFIED */}
        {travelDateInfo &&
          flightData.includeFlights &&
          destination &&
          travelDateInfo.dates.includesArrivalDay && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FaPlane className="text-blue-600 dark:text-blue-400 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  {getDateExplanation(travelDateInfo.dates)}
                </p>
              </div>
            </div>
          )}

        {/* Validation Warnings - Keep these */}
        {travelDateInfo && travelDateInfo.validation.warnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-2">
                  Travel Planning Tips
                </h4>
                <ul className="space-y-1">
                  {travelDateInfo.validation.warnings.map((warning, index) => (
                    <li
                      key={index}
                      className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed"
                    >
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Advanced Tips */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <button
            onClick={() => setShowAdvancedTips(!showAdvancedTips)}
            className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaLightbulb className="text-blue-500" />
              Philippine Travel Planning Tips
            </span>
            {showAdvancedTips ? (
              <FaChevronUp className="text-gray-400" />
            ) : (
              <FaChevronDown className="text-gray-400" />
            )}
          </button>

          {showAdvancedTips && (
            <div className="mt-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2 leading-relaxed">
                <li>
                  • Book Philippine Airlines, Cebu Pacific, or AirAsia flights
                  2-3 weeks in advance for better deals
                </li>
                <li>
                  • Consider weekday travel for lower domestic flight costs
                </li>
                <li>
                  • Check local fiestas and holidays at your Philippine
                  destination
                </li>
                <li>
                  • Allow buffer days for island hopping, diving, or spontaneous
                  adventures
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DateRangePicker;
