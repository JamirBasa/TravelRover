import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Save,
  Edit,
  X
} from "lucide-react";

function DayHeader({
  dayItem,
  dayIndex,
  currentItinerary,
  editingDay,
  expandedDays,
  toggleDayExpansion,
  startEditingDay,
  saveDayChanges,
  cancelDayEdit,
  // New props from PlacesToVisit.jsx
  isExpanded,
  isEditing,
  onToggleExpanded,
  onStartEdit,
  onStopEdit,
  onSaveEdit,
  totalDays, // Add as a fallback
}) {
  // Handle both old and new prop patterns for compatibility
  const isCurrentlyEditing = isEditing ?? editingDay === dayIndex;
  const isCurrentlyExpanded = isExpanded ?? expandedDays?.has(dayIndex);
  const dayNumber = dayItem?.day || dayIndex + 1;
  const headerId = `day-header-${dayIndex}`;
  const controlsId = `day-controls-${dayIndex}`;
  const activitiesCount = dayItem?.plan?.length || 0;

  // Safe event handlers
  const handleToggleExpanded =
    onToggleExpanded || toggleDayExpansion || (() => {});
  const handleStartEdit = onStartEdit || startEditingDay || (() => {});
  const handleStopEdit = onStopEdit || cancelDayEdit || (() => {});
  const handleSaveEdit = onSaveEdit || saveDayChanges || (() => {});

  return (
    <header
      className={`bg-white rounded-lg p-4 sm:p-6 mb-4 border shadow-md transition-all duration-300 ${
        isCurrentlyEditing
          ? "border-amber-200 ring-2 ring-amber-100"
          : "border-gray-200"
      }`}
      id={headerId}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300 ${
              isCurrentlyEditing
                ? "bg-gradient-to-br from-amber-500 to-orange-500"
                : "bg-gradient-to-br from-blue-500 to-purple-600"
            }`}
            aria-hidden="true"
          >
            <Calendar 
              className="h-6 w-6 text-white" 
              aria-hidden="true" 
            />
          </div>
          {/* Day connector line */}
          {dayIndex < (currentItinerary?.length || totalDays || 999) - 1 && (
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-blue-300 to-transparent mt-2"
              aria-hidden="true"
            ></div>
          )}
        </div>

        <div className="flex-1 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h3 
                className="text-xl font-bold text-gray-900"
                id={`day-heading-${dayIndex}`}
              >
                Day {dayNumber}
              </h3>
              {dayItem?.plan && Array.isArray(dayItem.plan) && (
                <Badge
                  variant="secondary"
                  className={
                    isCurrentlyEditing
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs"
                  }
                >
                  {activitiesCount} {activitiesCount === 1 ? 'activity' : 'activities'}
                  {isCurrentlyEditing && (
                    <span className="ml-1" aria-hidden="true">
                      <Edit className="h-3 w-3 inline-block" />
                    </span>
                  )}
                </Badge>
              )}
            </div>

            {/* Day Controls */}
            <div 
              className="flex items-center gap-2" 
              id={controlsId}
              aria-label={`Day ${dayNumber} controls`}
            >
              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleExpanded(dayIndex)}
                className={`gap-2 transition-all duration-200 ${
                  isCurrentlyEditing && isCurrentlyExpanded
                    ? "text-amber-600 hover:text-amber-800"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                disabled={isCurrentlyEditing && isCurrentlyExpanded}
                aria-expanded={isCurrentlyExpanded}
                aria-controls={`day-activities-${dayIndex}`}
                aria-label={
                  isCurrentlyExpanded 
                    ? "Collapse day activities" 
                    : "Expand day activities"
                }
              >
                {isCurrentlyExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    <span>{isCurrentlyEditing ? "Editing" : "Collapse"}</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    <span>Expand</span>
                  </>
                )}
              </Button>

              {/* Edit Controls */}
              {isCurrentlyEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStopEdit(dayIndex)}
                    className="gap-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                    aria-label="Cancel editing day"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(dayIndex)}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    aria-label="Save day changes"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>Save</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartEdit(dayIndex)}
                  className="gap-2 border-blue-300 hover:border-blue-400 text-blue-600 hover:text-blue-800"
                  aria-label="Edit this day's activities"
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                  <span>Edit Day</span>
                </Button>
              )}
            </div>
          </div>

          {isCurrentlyEditing && (
            <div 
              className="mb-3 p-3 bg-amber-50 rounded-md border border-amber-200"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-amber-700">
                <span aria-hidden="true">🎯</span>
                <span className="font-medium text-sm">
                  Editing Mode Active - Drag activities to reorder them within
                  this day
                </span>
              </div>
            </div>
          )}

          <p
            className={`font-semibold text-base mb-3 ${
              isCurrentlyEditing ? "text-amber-700" : "text-blue-700"
            }`}
          >
            <span aria-hidden="true">🎯</span> {dayItem?.theme || "Explore & Discover"}
          </p>

          {/* Quick day stats */}
          <div 
            className="flex flex-wrap items-center gap-3 text-sm"
            aria-label="Day overview"
          >
            {dayItem?.plan && Array.isArray(dayItem.plan) && (
              <>
                <div className="flex items-center gap-1 text-gray-600">
                  <span aria-hidden="true">⏱️</span>
                  <span>Full Day Adventure</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <span aria-hidden="true">📍</span>
                  <span>{activitiesCount} {activitiesCount === 1 ? 'Stop' : 'Stops'}</span>
                </div>
                {dayItem.plan.some((activity) => activity.ticketPricing) && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <span aria-hidden="true">💰</span>
                    <span>Tickets Required</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default DayHeader;
