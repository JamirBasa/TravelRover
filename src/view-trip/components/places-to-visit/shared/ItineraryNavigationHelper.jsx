import React from "react";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
} from "../constants/designSystem";

function ItineraryNavigationHelper({ editingDay }) {
  return (
    <div
      className={`${SPACING.margin.large} ${COLORS.info.lightGradient} rounded-lg ${SPACING.padding.medium} ${COLORS.info.border} border`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`${PATTERNS.iconContainer.small} bg-indigo-100 flex-shrink-0`}
        >
          <span className="text-indigo-600 text-lg">🗺️</span>
        </div>
        <div className="flex-1">
          <h3 className={`${TYPOGRAPHY.heading.h4} text-indigo-900 mb-2`}>
            How to Use This Itinerary
          </h3>
          <div
            className={`grid md:grid-cols-2 ${SPACING.gap.medium} ${TYPOGRAPHY.body.medium} text-indigo-800`}
          >
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">✅</span>
              <span>Times are suggestions - adjust to your pace</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">📍</span>
              <span>Click place names for Google Maps directions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">💰</span>
              <span>Check current prices before visiting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">🖱️</span>
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
