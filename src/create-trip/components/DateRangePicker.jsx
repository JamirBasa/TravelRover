// src/create-trip/components/DateRangePicker.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaPlane,
  FaExclamationTriangle,
  FaLightbulb,
  FaDollarSign,
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
  // Add these props for smart date calculations
  flightData = {},
  destination = "",
}) {
  const [duration, setDuration] = useState(0);

  // ✅ Memoize the duration change callback to prevent infinite loops
  const handleDurationChange = useCallback(
    (newDuration) => {
      if (onDurationChange) {
        onDurationChange(newDuration);
      }
    },
    [onDurationChange]
  );

  // Calculate duration when dates change using centralized function
  useEffect(() => {
    const newDuration = calculateDuration(startDate, endDate);
    if (newDuration !== duration) {
      setDuration(newDuration);
      handleDurationChange(newDuration);
    }
  }, [startDate, endDate, duration, handleDurationChange]);

  // Calculate smart travel dates and validation
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

  // Get flight pricing advice based on booking timing
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

  // Use centralized helper functions for date calculations

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          When are you traveling?
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Select your travel dates to plan the perfect itinerary 📅
        </p>
      </div>

      {/* Date Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              <FaCalendarAlt className="inline mr-2" />
              Start Date *
            </label>
            <Input
              type="date"
              min={getMinDate()}
              value={startDate || ""}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black h-auto"
              placeholder="Select start date"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              End Date *
            </label>
            <Input
              type="date"
              min={getMinEndDate(startDate)}
              value={endDate || ""}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black h-auto"
              disabled={!startDate}
              placeholder="Select end date"
            />
          </div>
        </div>

        {/* Show calculated duration */}
        {duration > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FaClock className="text-green-600" />
              <span className="font-medium text-green-800">
                Trip Duration: {duration} {duration === 1 ? "day" : "days"}
              </span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Perfect! We'll create a {duration}-day itinerary for your trip.
            </p>
          </div>
        )}

        {/* Flight Pricing Warnings - Critical for last-minute bookings */}
        {bookingAdvice && bookingAdvice.warnings.length > 0 && (
          <div
            className={`border rounded-lg p-4 ${
              bookingAdvice.warnings[0].level === "critical"
                ? "bg-red-50 border-red-300"
                : bookingAdvice.warnings[0].level === "warning"
                ? "bg-amber-50 border-amber-300"
                : "bg-blue-50 border-blue-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full ${
                  bookingAdvice.warnings[0].level === "critical"
                    ? "bg-red-100"
                    : bookingAdvice.warnings[0].level === "warning"
                    ? "bg-amber-100"
                    : "bg-blue-100"
                }`}
              >
                {bookingAdvice.warnings[0].level === "critical" ? (
                  <FaExclamationTriangle className="text-red-600 text-lg" />
                ) : bookingAdvice.warnings[0].level === "warning" ? (
                  <FaDollarSign className="text-amber-600 text-lg" />
                ) : (
                  <FaInfoCircle className="text-blue-600 text-lg" />
                )}
              </div>
              <div className="flex-1">
                <h4
                  className={`font-semibold text-sm mb-2 ${
                    bookingAdvice.warnings[0].level === "critical"
                      ? "text-red-800"
                      : bookingAdvice.warnings[0].level === "warning"
                      ? "text-amber-800"
                      : "text-blue-800"
                  }`}
                >
                  {bookingAdvice.timing.description} -{" "}
                  {bookingAdvice.pricing.impact}
                </h4>
                <div className="space-y-2">
                  {bookingAdvice.warnings.map((warning, index) => (
                    <p
                      key={index}
                      className={`text-sm ${
                        warning.level === "critical"
                          ? "text-red-700"
                          : warning.level === "warning"
                          ? "text-amber-700"
                          : "text-blue-700"
                      }`}
                    >
                      • {warning.message}
                    </p>
                  ))}
                </div>

                {/* Show flexible date suggestions for expensive bookings */}
                {bookingAdvice.flexibleDates.length > 0 &&
                  bookingAdvice.pricing.multiplier >= 2.0 && (
                    <div className="mt-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FaLightbulb className="text-green-600 text-sm" />
                        <span className="font-semibold text-green-800 text-xs">
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
                              className="text-left p-2 bg-white rounded border border-green-300 hover:bg-green-50 transition-colors"
                            >
                              <div className="font-medium text-green-800 text-xs">
                                {suggestion.label}
                              </div>
                              <div className="text-[10px] text-green-600">
                                {formatDateDisplay(suggestion.startDate)}
                              </div>
                              <div className="text-[10px] text-green-700 font-medium mt-1">
                                ~{suggestion.savingsPercent}% cheaper
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Quick recommendations */}
                {bookingAdvice.recommendations.length > 0 && (
                  <div className="mt-3 p-2 bg-white/40 backdrop-blur-sm rounded border border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      Quick Tips:
                    </div>
                    <ul className="space-y-1">
                      {bookingAdvice.recommendations
                        .slice(0, 3)
                        .map((rec, idx) => (
                          <li key={idx} className="text-[11px] text-gray-600">
                            • {rec}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Smart Date Information - Shows when flights are included */}
        {travelDateInfo && flightData.includeFlights && destination && (
          <div className="brand-card p-4 shadow-lg border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50">
            <div className="flex items-start gap-3">
              <div className="brand-gradient p-2 rounded-full">
                <FaPlane className="text-white text-sm" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sky-800 text-sm mb-2 flex items-center gap-2">
                  <FaInfoCircle className="text-xs" />
                  Flight & Travel Timing
                </h3>
                <p className="text-sky-700 text-xs leading-relaxed mb-3">
                  {getDateExplanation(travelDateInfo.dates)}
                </p>

                {/* Flight Details */}
                {travelDateInfo.dates.includesArrivalDay && (
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mb-2 border border-sky-200">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-sky-600 font-medium mb-1">
                          ✈️ Outbound Flight
                        </div>
                        <div className="font-semibold text-sky-900">
                          {travelDateInfo.dates.flightDepartureDate}
                        </div>
                        <div className="text-sky-600 text-[10px]">
                          {travelDateInfo.dates.travelInfo?.travelType ===
                          "domestic-far"
                            ? "Depart day before (Remote destination)"
                            : "Early morning departure"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sky-600 font-medium mb-1">
                          🏨 Hotel Check-in
                        </div>
                        <div className="font-semibold text-sky-900">
                          {travelDateInfo.dates.hotelCheckInDate}
                        </div>
                        <div className="text-sky-600 text-[10px]">
                          {travelDateInfo.dates.totalNights} nights total
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Travel Type Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-sky-100 text-sky-700">
                    {travelDateInfo.dates.travelInfo?.travelType ===
                    "domestic-far"
                      ? "�️ Remote Philippine Destination"
                      : travelDateInfo.dates.travelInfo?.isDomesticShort
                      ? "✈️ Domestic Flight"
                      : "🚗 Land/Sea Travel"}
                  </span>
                  <span className="text-[10px] text-sky-600">
                    {travelDateInfo.dates.travelInfo?.recommendation || ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {travelDateInfo && travelDateInfo.validation.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800 text-sm mb-2">
                  Travel Planning Tips
                </h4>
                <ul className="space-y-1">
                  {travelDateInfo.validation.warnings.map((warning, index) => (
                    <li
                      key={index}
                      className="text-amber-700 text-xs leading-relaxed"
                    >
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Validation messages */}
        {startDate && endDate && duration <= 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              <span className="font-medium text-red-800">
                End date must be after start date
              </span>
            </div>
          </div>
        )}

        {/* Date Selection Tips */}
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaClock className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Philippine Travel Planning Tips
              </h3>
              <ul className="text-gray-700 text-sm space-y-1 leading-relaxed">
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
                {!destination && (
                  <li className="text-blue-600 font-medium">
                    💡 Select your Philippine destination first to see smart
                    flight timing recommendations
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DateRangePicker;
