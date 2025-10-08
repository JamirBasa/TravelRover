import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Save,
  Edit,
  X,
  MapPin,
} from "lucide-react";
import { DayItineraryMap } from "../../maps";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  ANIMATIONS,
} from "../constants/designSystem";

function DayHeader({
  dayItem,
  dayIndex,
  isExpanded,
  isEditing,
  onToggleExpanded,
  onStartEdit,
  onStopEdit,
  onSaveEdit,
  trip, // Add trip prop for map functionality
}) {
  const [showDayMap, setShowDayMap] = useState(false);
  const dayNumber = dayItem?.day || dayIndex + 1;
  const headerId = `day-header-${dayIndex}`;
  const controlsId = `day-controls-${dayIndex}`;
  const activitiesCount = dayItem?.plan?.length || 0;

  // Event handlers with validation
  const handleToggleExpanded = onToggleExpanded || (() => {});
  const handleStartEdit = onStartEdit || (() => {});
  const handleStopEdit = onStopEdit || (() => {});
  const handleSaveEdit = onSaveEdit || (() => {});

  return (
    <header
      className={`${
        PATTERNS.card.base
      } p-4 sm:p-5 mb-3 shadow-md transition-all duration-300 ${
        isEditing
          ? `${COLORS.editing.border} ${COLORS.editing.ring}`
          : "border-gray-200"
      }`}
      id={headerId}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div
            className={`${
              PATTERNS.iconContainer.large
            } shadow-sm transition-all duration-300 ${
              isEditing ? COLORS.editing.gradient : COLORS.primary.gradient
            }`}
            aria-hidden="true"
          >
            <Calendar className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h3
                className={`${TYPOGRAPHY.heading.h2} text-gray-900`}
                id={`day-heading-${dayIndex}`}
              >
                Day {dayNumber}
              </h3>
              <Badge
                variant="secondary"
                className={
                  isEditing
                    ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 hover:from-amber-200 hover:to-orange-200 text-base px-3 py-1.5 font-semibold border border-amber-200"
                    : "bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 hover:from-sky-200 hover:to-blue-200 text-base px-3 py-1.5 font-semibold border border-sky-200"
                }
              >
                {activitiesCount}{" "}
                {activitiesCount === 1 ? "activity" : "activities"}
                {isEditing && (
                  <span className="ml-2" aria-hidden="true">
                    <Edit className="h-5 w-5 inline-block" />
                  </span>
                )}
              </Badge>
            </div>

            {/* Day Controls */}
            <div
              className="flex items-center gap-2 flex-wrap"
              id={controlsId}
              aria-label={`Day ${dayNumber} controls`}
            >
              {/* Map Toggle Button */}
              {activitiesCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDayMap(!showDayMap)}
                  className={`gap-2 ${ANIMATIONS.transition.medium} ${
                    showDayMap
                      ? `text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100`
                      : `text-gray-600 hover:text-gray-800 hover:bg-gray-50`
                  }`}
                  aria-label={showDayMap ? "Hide day map" : "Show day map"}
                >
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-medium">
                    {showDayMap ? "Hide Map" : "Show Map"}
                  </span>
                </Button>
              )}

              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleExpanded(dayIndex)}
                className={`gap-2 ${ANIMATIONS.transition.medium} ${
                  isEditing && isExpanded
                    ? `text-amber-700 hover:text-amber-800 hover:bg-amber-50`
                    : `text-sky-700 hover:text-sky-800 hover:bg-sky-50`
                }`}
                disabled={isEditing && isExpanded}
                aria-expanded={isExpanded}
                aria-controls={`day-activities-${dayIndex}`}
                aria-label={
                  isExpanded
                    ? "Collapse day activities"
                    : "Expand day activities"
                }
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-6 w-6" aria-hidden="true" />
                    <span className="text-base font-medium">
                      {isEditing ? "Editing" : "Collapse"}
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-6 w-6" aria-hidden="true" />
                    <span className="text-base font-medium">Expand</span>
                  </>
                )}
              </Button>

              {/* Edit Controls */}
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStopEdit(dayIndex)}
                    className={`gap-2 ${COLORS.editing.border} hover:bg-amber-50 ${COLORS.editing.text} hover:text-amber-800 transition-colors`}
                    aria-label="Cancel editing day"
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                    <span className="text-base font-medium">Cancel</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSaveEdit(dayIndex)}
                    className={`gap-2 ${COLORS.success.gradient} hover:opacity-90 text-white px-4 py-2 transition-opacity`}
                    aria-label="Save day changes"
                  >
                    <Save className="h-6 w-6" aria-hidden="true" />
                    <span className="text-base font-medium">Save</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartEdit(dayIndex)}
                  className="gap-2 border-sky-300 text-sky-700 hover:bg-sky-50 hover:text-sky-800 transition-colors"
                  aria-label="Edit this day's activities"
                >
                  <Edit className="h-6 w-6" aria-hidden="true" />
                  <span className="text-base font-medium">Edit Day</span>
                </Button>
              )}
            </div>
          </div>

          {isEditing && (
            <div
              className="mb-3 p-3 bg-amber-50 rounded-md border border-amber-200"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-amber-700">
                <span aria-hidden="true">🎯</span>
                <span className="font-semibold text-base">
                  Editing Mode Active - Drag activities to reorder them within
                  this day
                </span>
              </div>
            </div>
          )}

          {dayItem?.theme && (
            <p
              className={`font-bold text-lg ${
                isEditing ? "text-amber-700" : "text-sky-700"
              }`}
            >
              <span aria-hidden="true">🎯</span> {dayItem.theme}
            </p>
          )}
        </div>
      </div>

      {/* Day-specific Map */}
      {showDayMap && activitiesCount > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <DayItineraryMap
            trip={trip}
            day={dayNumber}
            activities={dayItem?.plan || []}
          />
        </div>
      )}
    </header>
  );
}

export default DayHeader;
