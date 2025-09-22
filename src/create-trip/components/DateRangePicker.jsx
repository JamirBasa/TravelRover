// src/create-trip/components/DateRangePicker.jsx
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

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

  // Calculate duration when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays !== duration) {
        setDuration(diffDays);
        handleDurationChange(diffDays);
      }
    } else {
      if (duration !== 0) {
        setDuration(0);
        handleDurationChange(0);
      }
    }
  }, [startDate, endDate, duration, handleDurationChange]);

  // Helper function to get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Helper function to get minimum end date (day after start date)
  const getMinEndDate = () => {
    if (startDate) {
      const minEnd = new Date(startDate);
      minEnd.setDate(minEnd.getDate() + 1);
      return minEnd.toISOString().split("T")[0];
    }
    return getMinDate();
  };

  return (
    <div className={`mb-8 ${className}`}>
      <h2 className="text-xl mb-3 font-medium">📅 When are you traveling?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <Input
            type="date"
            min={getMinDate()}
            value={startDate || ""}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full"
            placeholder="Select start date"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <Input
            type="date"
            min={getMinEndDate()}
            value={endDate || ""}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full"
            disabled={!startDate}
            placeholder="Select end date"
          />
        </div>
      </div>

      {/* Show calculated duration */}
      {duration > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            🗓️ Trip duration:{" "}
            <span className="font-semibold">
              {duration} {duration === 1 ? "day" : "days"}
            </span>
          </p>
        </div>
      )}

      {/* Validation messages */}
      {startDate && endDate && duration <= 0 && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">
            ⚠️ End date must be after start date
          </p>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
