import React from "react";
import { Badge } from "@/components/ui/badge";
import PlaceCardItem from "../../shared/PlaceCardItem";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  COMPOSED_STYLES,
} from "../constants/designSystem";

function PlacesToVisitSection({ placesToVisit }) {
  if (placesToVisit.length === 0) {
    return null;
  }

  return (
    <div className={PATTERNS.card.base}>
      <div
        className={`${COMPOSED_STYLES.secondarySection} ${SPACING.padding.medium}`}
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
                <span className="text-white text-2xl">🎯</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className={`text-2xl font-bold text-white mb-2 break-words`}
                >
                  Must-Visit Attractions
                </h2>
                <p
                  className={`text-base font-medium text-emerald-100 flex items-center gap-2 flex-wrap`}
                >
                  <span>📍</span>
                  <span>
                    {placesToVisit.length} carefully curated destinations
                  </span>
                  <span>•</span>
                  <span>🤖 AI-recommended</span>
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-white">
              <div className="text-center">
                <div className="text-xl font-bold">{placesToVisit.length}</div>
                <div className="text-sm text-emerald-100 font-medium">
                  Places
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Category breakdown if available */}
        <div className="mb-4 flex flex-wrap gap-2">
          {placesToVisit.some((p) => p.category) && (
            <div className="flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400">
              <span>Categories:</span>
              {[
                ...new Set(
                  placesToVisit.filter((p) => p.category).map((p) => p.category)
                ),
              ].map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {placesToVisit.map((place, index) => (
            <PlaceCardItem key={place?.placeName || index} place={place} />
          ))}
        </div>

        {/* Compact helpful tip */}
        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600 text-xl">💡</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-emerald-800 mb-2 text-base">
                Pro Travel Tip
              </h4>
              <p className="text-emerald-700 text-base font-medium break-words">
                Click on any attraction to view its exact location on Google
                Maps. Consider visiting nearby places together to save time and
                transportation costs!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlacesToVisitSection;
