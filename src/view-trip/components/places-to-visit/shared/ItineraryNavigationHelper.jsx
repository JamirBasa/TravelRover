import React from "react";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  COMPOSED_STYLES,
  ANIMATIONS,
} from "../constants/designSystem";

// Compact header component
export function ItineraryHeader() {
  return (
    <div className={PATTERNS.card.base}>
      <div className={`${COMPOSED_STYLES.primarySection} px-5 py-4`}>
        {/* Minimal Background decoration */}
        <div className={PATTERNS.sectionHeader.decoration}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
        </div>

        <div className={PATTERNS.sectionHeader.content}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white text-xl">🗓️</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                Daily Itinerary
              </h2>
              <p className="text-xs md:text-sm font-medium text-white/90">
                Your personalized day-by-day travel plan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact navigation helper with essential tips
function ItineraryNavigationHelper({ editingDay }) {
  const instructions = [
    {
      icon: "📍",
      title: "Quick Navigation",
      description: "Click place names for Google Maps directions",
      highlighted: false,
    },
    {
      icon: editingDay !== null ? "🎯" : "✏️",
      title: editingDay !== null ? "Editing Active" : "Customize",
      description:
        editingDay !== null
          ? "Drag activities to reorder - auto-saves"
          : "Click 'Edit Day' to modify activities",
      highlighted: editingDay !== null,
    },
  ];

  return (
    <div className="mb-4">
      {/* Compact Single-Line Tips */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-sky-200 dark:border-sky-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center gap-4 bg-gradient-to-r from-blue-50/50 to-sky-50/50 dark:from-blue-950/20 dark:to-sky-950/20">
          {instructions.map((instruction, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-xs sm:text-sm ${
                instruction.highlighted
                  ? "font-bold text-amber-700 dark:text-amber-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="text-base">{instruction.icon}</span>
              <span className="font-semibold">{instruction.title}:</span>
              <span className="hidden sm:inline">
                {instruction.description}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-auto">
            <span className="text-base">💡</span>
            <span className="hidden lg:inline">
              Click days to expand/collapse
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItineraryNavigationHelper;
