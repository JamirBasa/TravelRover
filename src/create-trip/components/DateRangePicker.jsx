// src/create-trip/components/DateRangePicker.jsx
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import {
  calculateDuration,
  getMinDate,
  getMinEndDate,
} from "../../constants/options";

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDurationChange,
  className = "",
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

  // Use centralized helper functions for date calculations

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Main Question */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          When are you traveling?
        </h2>
        <p className="text-gray-600 text-sm">
          Select your travel dates to plan the perfect itinerary
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Travel Tips:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Book at least 2-3 weeks in advance for better deals</li>
            <li>• Consider weekday travel for lower costs</li>
            <li>• Check local holidays and events at your destination</li>
            <li>
              • Allow buffer days for relaxation and spontaneous activities
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DateRangePicker;
