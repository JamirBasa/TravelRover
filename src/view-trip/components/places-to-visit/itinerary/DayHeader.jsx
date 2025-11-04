import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Save,
  Edit,
  X,
  MapPin,
  AlertCircle,
} from "lucide-react";
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
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const dayNumber = dayItem?.day || dayIndex + 1;
  const headerId = `day-header-${dayIndex}`;
  const controlsId = `day-controls-${dayIndex}`;
  const activitiesCount = dayItem?.plan?.length || 0;

  // Event handlers with validation
  const handleToggleExpanded = onToggleExpanded || (() => {});
  const handleStartEdit = onStartEdit || (() => {});
  const handleStopEdit = onStopEdit || (() => {});
  
  const handleSaveClick = () => {
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = () => {
    setShowSaveConfirm(false);
    if (onSaveEdit) {
      onSaveEdit(dayIndex);
    }
  };

  return (
    <header
      className={`${
        PATTERNS.card.base
      } p-5 sm:p-6 mb-3 shadow-lg rounded-xl transition-all duration-300 border-2 ${
        isEditing
          ? `${COLORS.editing.border} ${COLORS.editing.ring} dark:border-amber-800 dark:ring-amber-900/50`
          : "border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700"
      }`}
      id={headerId}
    >
      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Save className="h-5 w-5 text-sky-600" />
              Save Day {dayNumber} Changes?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base">
                You're about to save changes to <span className="font-semibold">Day {dayNumber}</span>.
              </p>
              {activitiesCount > 0 && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-sky-200 dark:border-sky-800">
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-300">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      <span className="font-semibold">{activitiesCount}</span> {activitiesCount === 1 ? 'activity' : 'activities'} will be updated
                    </span>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will update your trip itinerary. You can always edit it again later.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSave}
              className="h-11 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-start gap-4 sm:gap-5">
        <div className="relative">
          <div
            className={`${
              PATTERNS.iconContainer.large
            } w-14 h-14 sm:w-16 sm:h-16 shadow-md transition-all duration-300 ${
              isEditing ? COLORS.editing.gradient : COLORS.primary.gradient
            } dark:opacity-90`}
            aria-hidden="true"
          >
            <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-white" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h3
                className={`${TYPOGRAPHY.heading.h2} text-xl sm:text-2xl text-gray-900 dark:text-gray-100`}
                id={`day-heading-${dayIndex}`}
              >
                Day {dayNumber}
              </h3>
              <Badge
                variant="secondary"
                className={
                  isEditing
                    ? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-400 hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-900/50 dark:hover:to-orange-900/50 text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 font-semibold border-2 border-amber-300 dark:border-amber-800 shadow-sm"
                    : "bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-950/30 dark:to-blue-950/30 text-sky-700 dark:text-sky-400 hover:from-sky-200 hover:to-blue-200 dark:hover:from-sky-900/50 dark:hover:to-blue-900/50 text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 font-semibold border-2 border-sky-200 dark:border-sky-800 shadow-sm"
                }
              >
                {activitiesCount}{" "}
                {activitiesCount === 1 ? "activity" : "activities"}
                {isEditing && (
                  <span className="ml-2" aria-hidden="true">
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5 inline-block" />
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
              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleExpanded(dayIndex)}
                className={`gap-2 h-10 sm:h-11 px-3 sm:px-4 ${ANIMATIONS.transition.medium} ${
                  isEditing && isExpanded
                    ? `text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30`
                    : `text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30`
                } cursor-pointer font-semibold`}
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
                    <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    <span className="text-sm sm:text-base font-semibold">
                      {isEditing ? "Editing" : "Collapse"}
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    <span className="text-sm sm:text-base font-semibold">Expand</span>
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
                    className={`gap-2 h-10 sm:h-11 px-3 sm:px-4 border-2 ${COLORS.editing.border} dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 ${COLORS.editing.text} dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer font-semibold`}
                    aria-label="Cancel editing day"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    <span className="text-sm sm:text-base">Cancel</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveClick}
                    className={`gap-2 h-10 sm:h-11 px-4 sm:px-5 ${COLORS.success.gradient} hover:opacity-90 text-white transition-opacity cursor-pointer shadow-md font-bold`}
                    aria-label="Save day changes"
                  >
                    <Save className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    <span className="text-sm sm:text-base">Save</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartEdit(dayIndex)}
                  className="gap-2 h-10 sm:h-11 px-3 sm:px-4 border-2 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-800 dark:hover:text-sky-300 transition-colors cursor-pointer font-semibold"
                  aria-label="Edit this day's activities"
                >
                  <Edit className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Edit Day</span>
                </Button>
              )}
            </div>
          </div>

          {isEditing && (
            <div
              className="mb-4 p-2.5 sm:p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border-l-4 border-amber-500 dark:border-amber-600 shadow-sm"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
                <span aria-hidden="true" className="text-base">✏️</span>
                <span className="font-medium text-xs sm:text-sm">
                  Editing mode: Reorder activities using arrow buttons
                </span>
              </div>
            </div>
          )}

          {dayItem?.theme && (
            <div
              className={`mt-1 p-3 sm:p-3.5 rounded-xl border-2 ${
                isEditing
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-300 dark:border-amber-700 shadow-md"
                  : "bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-200 dark:border-sky-700 shadow-sm"
              } transition-all duration-300`}
            >
              <div className="flex items-center gap-2.5">
                <span 
                  aria-hidden="true" 
                  className={`text-xl ${
                    isEditing ? "grayscale-0" : ""
                  }`}
                >
                  🎯
                </span>
                <p
                  className={`font-bold text-sm sm:text-base ${
                    isEditing
                      ? "text-amber-900 dark:text-amber-300"
                      : "text-sky-900 dark:text-sky-300"
                  }`}
                >
                  {dayItem.theme}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Day-specific Map */}
      {showDayMap && activitiesCount > 0 && (
        <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
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
