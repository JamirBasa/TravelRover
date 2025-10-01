import React from "react";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  COMPOSED_STYLES,
} from "../constants/designSystem";

// Separate header component styled like Must-See Places
export function ItineraryHeader() {
  return (
    <div className={PATTERNS.card.base}>
      <div
        className={`${COMPOSED_STYLES.primarySection} ${SPACING.padding.medium}`}
      >
        {/* Background decoration */}
        <div className={PATTERNS.sectionHeader.decoration}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-5 rounded-full translate-y-2 -translate-x-2"></div>
        </div>

        <div className={PATTERNS.sectionHeader.content}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={PATTERNS.iconContainer.medium}>
                <span className="text-white text-2xl">🗓️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-2 break-words">
                  Daily Itinerary
                </h2>
                <p className="text-base font-medium text-blue-100 flex items-center gap-2 flex-wrap">
                  <span>📅</span>
                  <span>Explore your personalized day-by-day travel plan</span>
                  <span>•</span>
                  <span>🎯 AI-optimized</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation helper instructions component
function ItineraryNavigationHelper({ editingDay }) {
  return (
    <div
      className={`mb-4 ${COLORS.info.lightGradient} rounded-lg p-4 ${COLORS.info.border} border`}
    >
      <div className="flex items-start gap-3">
        <div className="bg-indigo-100 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
          <span className="text-indigo-600 text-lg">🗺️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-indigo-900 mb-2">
            How to Use This Itinerary
          </h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm font-medium text-indigo-800">
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 text-sm">✅</span>
              <span>Times are suggestions - adjust to your pace</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 text-sm">📍</span>
              <span>Click place names for Google Maps directions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 text-sm">💰</span>
              <span>Check current prices before visiting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 text-sm">🖱️</span>
              <span>
                {editingDay !== null
                  ? "Drag activities to reorder them within the day"
                  : "Click 'Edit Day' on any day to customize activities"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItineraryNavigationHelper;
