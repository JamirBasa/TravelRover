import React from "react";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  COMPOSED_STYLES,
  ANIMATIONS,
} from "../constants/designSystem";

// Enhanced header component with more visual appeal
export function ItineraryHeader({ totalDays, totalActivities }) {
  return (
    <div className={PATTERNS.card.base}>
      <div
        className={`${COMPOSED_STYLES.primarySection} ${SPACING.padding.medium}`}
      >
        {/* Enhanced Background decoration with multiple layers */}
        <div className={PATTERNS.sectionHeader.decoration}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/3 rounded-full"></div>
        </div>

        <div className={PATTERNS.sectionHeader.content}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Title & Description */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white text-3xl">🗓️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1.5 break-words">
                  Daily Itinerary
                </h2>
                <p className="text-sm md:text-base font-medium text-white/90 flex items-center gap-2 flex-wrap">
                  <span>📅</span>
                  <span>Your personalized day-by-day travel plan</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">
                    🎯 AI-optimized route
                  </span>
                </p>
              </div>
            </div>

            {/* Right: Quick Stats */}
            {(totalDays || totalActivities) && (
              <div className="flex items-center gap-3">
                {totalDays && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
                    <div className="text-xs text-white/80 font-medium mb-0.5">
                      Days
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {totalDays}
                    </div>
                  </div>
                )}
                {totalActivities && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
                    <div className="text-xs text-white/80 font-medium mb-0.5">
                      Activities
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {totalActivities}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced navigation helper with card-based interactive design
function ItineraryNavigationHelper({ editingDay }) {
  const instructions = [
    {
      icon: "⏰",
      title: "Flexible Timing",
      description:
        "Times are suggestions - adjust to your pace and preferences",
      gradient: "from-purple-500 to-pink-500",
      lightBg:
        "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
      iconBg: "bg-purple-100 dark:bg-purple-950/50",
      textColor: "text-purple-800 dark:text-purple-300",
    },
    {
      icon: "📍",
      title: "Quick Navigation",
      description:
        "Click place names to open Google Maps for instant directions",
      gradient: "from-blue-500 to-cyan-500",
      lightBg:
        "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
      iconBg: "bg-blue-100 dark:bg-blue-950/50",
      textColor: "text-blue-800 dark:text-blue-300",
    },
    {
      icon: "💰",
      title: "Live Pricing",
      description:
        "Prices shown are estimates - verify current rates before visiting",
      gradient: "from-emerald-500 to-teal-500",
      lightBg:
        "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
      textColor: "text-emerald-800 dark:text-emerald-300",
    },
    {
      icon: editingDay !== null ? "🎯" : "✏️",
      title: editingDay !== null ? "Editing Active" : "Customize Itinerary",
      description:
        editingDay !== null
          ? "Drag activities to reorder - changes save automatically"
          : "Click 'Edit Day' on any day card to rearrange activities",
      gradient:
        editingDay !== null
          ? "from-amber-500 to-orange-500"
          : "from-sky-500 to-indigo-500",
      lightBg:
        editingDay !== null
          ? "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
          : "from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30",
      iconBg:
        editingDay !== null
          ? "bg-amber-100 dark:bg-amber-950/50"
          : "bg-sky-100 dark:bg-sky-950/50",
      textColor:
        editingDay !== null
          ? "text-amber-800 dark:text-amber-300"
          : "text-sky-800 dark:text-sky-300",
      highlighted: editingDay !== null,
    },
  ];

  return (
    <div className="mb-6">
      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-sky-200 dark:border-sky-800 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🗺️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Quick Guide</h3>
              <p className="text-white/90 text-xs">
                Everything you need to know
              </p>
            </div>
          </div>
        </div>

        {/* Instruction Cards Grid */}
        <div className="p-5 grid sm:grid-cols-2 gap-4 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/10">
          {instructions.map((instruction, index) => (
            <div
              key={index}
              className={`group relative bg-gradient-to-br ${
                instruction.lightBg
              } rounded-xl p-4 border-2 ${
                instruction.highlighted
                  ? "border-amber-300 dark:border-amber-700 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30"
                  : "border-transparent"
              } hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-default`}
            >
              {/* Highlight Pulse Animation */}
              {instruction.highlighted && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-orange-400/10 rounded-xl animate-pulse"></div>
              )}

              <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`${instruction.iconBg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-2xl">{instruction.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-bold text-sm mb-1.5 ${instruction.textColor}`}
                  >
                    {instruction.title}
                  </h4>
                  <p
                    className={`text-xs leading-relaxed ${instruction.textColor} opacity-90`}
                  >
                    {instruction.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Tip */}
        <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-t border-blue-100 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2 justify-center font-medium">
            <span>💡</span>
            <span>
              Pro tip: Click activity cards to see full details and pricing
              breakdown
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ItineraryNavigationHelper;
