import React from "react";

/**
 * DayFilterDropdown Component
 * Allows filtering locations by specific day
 */
export function DayFilterDropdown({
  selectedDay,
  uniqueDays,
  onDayChange,
  getDayTheme,
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Filter by Day:
      </label>
      <select
        value={selectedDay}
        onChange={(e) => onDayChange(e.target.value)}
        className="flex-1 sm:flex-none min-w-[180px] px-4 py-2 border border-gray-300 
                 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 
                 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
      >
        <option value="all">All Days ({uniqueDays.length} days)</option>
        {uniqueDays.map((day) => (
          <option key={day} value={day}>
            Day {day} - {getDayTheme(day)}
          </option>
        ))}
      </select>
    </div>
  );
}
