// src/create-trip/components/DateRangePicker.jsx
// SIMPLIFIED VERSION - Reduced information overload
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  FaClock,
  FaPlane,
  FaExclamationTriangle,
  FaLightbulb,
  FaDollarSign,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { getMinDate, getMinEndDate } from "../../constants/options";
import {
  calculatePHTDays,
  isPastDatePHT,
  getPHTMidnight,
} from "../../utils/philippineTime";
import {
  validateDuration,
  getDurationCategory,
  getDurationRecommendation,
} from "../../constants/tripDurationLimits";
import {
  calculateTravelDates,
  validateTravelDates,
  getDateExplanation,
} from "../../utils/travelDateManager";
import {
  getBookingAdvice,
  formatDateDisplay,
} from "../../utils/flightPricingAnalyzer";
import { DurationCategoryBadge } from "../../components/common/DurationCategoryBadge";

// ✅ NEW: Enhanced native date input with professional styling
function DateInputWithIcon({ value, onChange, min, disabled, name, label }) {
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
        {label} *
      </label>
      <input
        type="date"
        min={min}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        name={name}
        autoComplete="off"
        className="w-full text-base py-3 px-4 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 focus:ring-offset-0 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

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

  // ✅ FIXED: Calculate duration using PHT utilities with useMemo
  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calculatePHTDays(startDate, endDate);
  }, [startDate, endDate]);

  // ✅ FIXED: Notify parent of duration changes without causing loops
  useEffect(() => {
    if (onDurationChange && duration >= 0) {
      onDurationChange(duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]); // Only duration in deps, onDurationChange is stable from parent useCallback

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

  // ✅ CROSS-STEP VALIDATION: Calculate booking advice for early warning
  // Shows flight pricing insights ALWAYS - even before user confirms flights in Step 4
  // This provides proactive guidance that helps inform date and service decisions
  const bookingAdvice = useMemo(() => {
    if (!startDate || !destination) return null;

    // ALWAYS show flight warnings to help users make informed decisions
    // They can still choose "No Flights" in Step 4 if they want
    return getBookingAdvice(
      startDate,
      endDate,
      true, // Always pass true to bypass the includeFlights check
      flightData.departureCity || destination, // Fallback to destination
      destination
    );
  }, [startDate, endDate, flightData.departureCity, destination]);

  // ✅ ADDED: Validate date selection using PHT
  const dateError = useMemo(() => {
    if (!startDate || !endDate) return null;

    // Check if dates are in the past (PHT)
    if (isPastDatePHT(startDate)) return "Start date cannot be in the past";

    // Compare dates at midnight (PHT)
    const start = getPHTMidnight(startDate);
    const end = getPHTMidnight(endDate);

    if (!start || !end) return "Invalid date format";
    if (end < start) return "End date must be after start date";

    return null;
  }, [startDate, endDate]);

  // ✅ NEW: Validate trip duration with helpful feedback
  const durationValidation = useMemo(() => {
    if (duration === 0) return null;

    const validation = validateDuration(duration);
    const category = validation.valid ? getDurationCategory(duration) : null;
    const recommendation = validation.valid
      ? getDurationRecommendation(duration)
      : null;

    return { ...validation, category, recommendation };
  }, [duration]);

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
          <DateInputWithIcon
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            min={getMinDate()}
            name="startDate"
            label="Start Date"
          />
          <DateInputWithIcon
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={getMinEndDate(startDate)}
            name="endDate"
            label="End Date"
            disabled={!startDate}
          />
        </div>

        {/* Show calculated duration */}
        {duration > 0 && !dateError && durationValidation?.valid && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FaClock className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="font-medium text-green-800 dark:text-green-300">
                {duration} {duration === 1 ? "day" : "days"} •{" "}
                {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}
              </span>
            </div>
          </div>
        )}

        {/* ✅ REDESIGNED: Critical Date Validation Errors */}
        {dateError && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 shadow-sm">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)",
                  color: "#ef4444",
                }}
              ></div>
            </div>

            <div className="relative flex items-start gap-3">
              {/* Icon container with gradient */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 flex items-center justify-center shadow-md">
                <FaExclamationTriangle className="text-white text-sm" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                    Date Selection Error
                  </h4>
                  <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-200 dark:bg-red-900/50 px-2 py-0.5 rounded-full">
                    REQUIRED
                  </span>
                </div>

                <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                  {dateError}
                </p>

                {/* Actionable guidance */}
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">💡</span>
                    <span>
                      {dateError.includes("after")
                        ? "Please select an end date that comes after your start date, or adjust your start date."
                        : dateError.includes("start")
                        ? "Choose a valid start date from the calendar picker above."
                        : "Choose a valid end date from the calendar picker above."}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NEW: Duration Validation Error (show if duration is invalid) */}
        {duration > 0 &&
          !durationValidation?.valid &&
          durationValidation?.error && (
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-4 shadow-sm">
              <div className="relative flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700 flex items-center justify-center shadow-md">
                  <FaExclamationTriangle className="text-white text-sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-orange-900 dark:text-orange-200">
                      Duration Limit Exceeded
                    </h4>
                    <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 bg-orange-200 dark:bg-orange-900/50 px-2 py-0.5 rounded-full">
                      ADJUST
                    </span>
                  </div>

                  <p className="text-sm text-orange-800 dark:text-orange-300 font-medium mb-2">
                    {durationValidation.error}
                  </p>

                  <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-orange-700 dark:text-orange-400 flex items-start gap-2">
                      <span className="flex-shrink-0 mt-0.5">💡</span>
                      <span>{durationValidation.suggestion}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ✅ REDESIGNED: Critical Flight Pricing Warnings */}
        {/* ✅ CROSS-STEP VALIDATION: Shows even before flight confirmation */}
        {bookingAdvice &&
          bookingAdvice.warnings.length > 0 &&
          bookingAdvice.warnings[0].level === "critical" && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900 dark:text-red-200 mb-2">
                    Flight Booking Alert: {bookingAdvice.timing.description}
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                    {bookingAdvice.warnings[0].message}
                  </p>

                  {/* Simplified date suggestions */}
                  {bookingAdvice.flexibleDates.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                        Consider these alternative dates:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {bookingAdvice.flexibleDates
                          .slice(0, 2)
                          .map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                onStartDateChange(suggestion.startDate);
                                onEndDateChange(suggestion.endDate);
                              }}
                              className="text-left p-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded hover:bg-red-25 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                            >
                              <div className="font-medium text-red-900 dark:text-red-200 text-sm">
                                {suggestion.label}
                              </div>
                              <div className="text-xs text-red-700 dark:text-red-400">
                                {formatDateDisplay(suggestion.startDate)} • -
                                {suggestion.savingsPercent}%
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

        {/* ✅ REDESIGNED: Flight Timing Information (Tier 3 - Informational) */}
        {travelDateInfo &&
          flightData.includeFlights &&
          destination &&
          travelDateInfo.dates.includesArrivalDay && (
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 shadow-sm">
              {/* Decorative plane trail effect */}
              <div className="absolute top-2 right-4 opacity-10">
                <FaPlane className="text-blue-500 text-3xl transform rotate-45" />
              </div>

              <div className="relative flex items-start gap-3">
                {/* Icon container */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-600 dark:from-blue-600 dark:to-sky-700 flex items-center justify-center shadow-md">
                  <FaPlane className="text-white text-sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                      Flight Timing Information
                    </h4>
                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-200 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                      FYI
                    </span>
                  </div>

                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    {getDateExplanation(travelDateInfo.dates)}
                  </p>

                  {/* Additional context */}
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <FaClock className="text-blue-600 dark:text-blue-500" />
                      <span>
                        This automatically accounts for flight arrival times in
                        your itinerary.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ✅ REDESIGNED: Travel Planning Tips & Warnings */}
        {/* Only show if NO critical flight pricing warnings exist (priority display) */}
        {travelDateInfo &&
          travelDateInfo.validation.warnings.length > 0 &&
          !(
            bookingAdvice &&
            bookingAdvice.warnings.length > 0 &&
            bookingAdvice.warnings[0].level === "critical"
          ) && (
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 shadow-sm">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 dark:from-amber-800/20 to-transparent rounded-bl-full"></div>

              <div className="relative flex items-start gap-4">
                {/* Icon container */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-amber-600 dark:to-yellow-700 flex items-center justify-center shadow-md">
                  <FaExclamationTriangle className="text-white text-sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Travel Planning Tips
                    </h4>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-200 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                      RECOMMENDED
                    </span>
                  </div>

                  {/* Enhanced warning list with icons */}
                  <div className="space-y-2.5">
                    {travelDateInfo.validation.warnings.map(
                      (warning, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm"
                        >
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-400 text-xs font-bold mt-0.5">
                            {index + 1}
                          </span>
                          <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex-1">
                            {warning}
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  {/* Footer note */}
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <FaLightbulb className="text-amber-600 dark:text-amber-500" />
                      <span className="font-medium">
                        These tips help optimize your travel experience and
                        budget.
                      </span>
                    </p>
                  </div>
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
