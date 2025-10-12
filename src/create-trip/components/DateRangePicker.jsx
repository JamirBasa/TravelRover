// src/create-trip/components/DateRangePicker.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaPlane,
  FaExclamationTriangle,
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
                          {travelDateInfo.dates.travelInfo.isInternational
                            ? "Depart day before (International)"
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
                    {travelDateInfo.dates.travelInfo.isInternational
                      ? "🌏 International"
                      : travelDateInfo.dates.travelInfo.isDomesticShort
                      ? "🛫 Domestic Short"
                      : "🚗 Local Travel"}
                  </span>
                  <span className="text-[10px] text-sky-600">
                    {travelDateInfo.dates.travelInfo.recommendation}
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
                Travel Planning Tips
              </h3>
              <ul className="text-gray-700 text-sm space-y-1 leading-relaxed">
                <li>• Book at least 2-3 weeks in advance for better deals</li>
                <li>• Consider weekday travel for lower costs</li>
                <li>• Check local holidays and events at your destination</li>
                <li>
                  • Allow buffer days for relaxation and spontaneous activities
                </li>
                {!destination && (
                  <li className="text-blue-600 font-medium">
                    💡 Select your destination first to see smart flight timing
                    recommendations
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
