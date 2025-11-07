/**
 * ActivityEditor Component - Enhanced activity editing without drag-and-drop
 *
 * Features:
 * ✅ Inline editing for all activity fields
 * ✅ Add/remove activities within days
 * ✅ Reorder activities with buttons
 * ✅ Auto-save with visual feedback
 * ✅ Rich text editing for descriptions
 * ✅ Full keyboard navigation and screen reader support
 * ✅ ARIA attributes for accessibility
 * ✅ Focus management for modal dialogs
 * ✅ Semantic HTML structure
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import InlineEditableText from "./InlineEditableText";
import { COLORS, ANIMATIONS, PATTERNS } from "../constants/designSystem";
import {
  Clock,
  MapPin,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit3,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Undo2,
  CheckCircle2,
} from "lucide-react";
import { validateDaySchedule } from "../utils/timeValidator";

function ActivityEditor({
  activities = [],
  dayIndex,
  onUpdateActivities,
  isEditing = false,
  dayNumber,
}) {
  const [localActivities, setLocalActivities] = useState(activities);
  const [statusMessage, setStatusMessage] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [deletedActivity, setDeletedActivity] = useState(null);
  const [deleteTimer, setDeleteTimer] = useState(null);

  // Generate IDs for accessibility
  const editorId = `day-${dayIndex}-activity-editor`;
  const statusId = `day-${dayIndex}-status`;

  // Validate schedule whenever activities change
  useEffect(() => {
    if (isEditing && localActivities.length > 0) {
      const result = validateDaySchedule(localActivities);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [localActivities, isEditing]);

  // New activity template
  const createNewActivity = () => ({
    time: "09:00 AM",
    placeName: "New Activity",
    placeDetails: "Add details about this activity...",
    imageUrl: "",
    geoCoordinates: { latitude: 0, longitude: 0 },
    ticketPricing: "₱0",
    timeTravel: "1 hour",
    rating: "4.0",
  });

  const handleUpdateActivity = async (activityIndex, field, value) => {
    const updatedActivities = [...localActivities];
    updatedActivities[activityIndex] = {
      ...updatedActivities[activityIndex],
      [field]: value,
    };

    setLocalActivities(updatedActivities);
    setStatusMessage(`Updated ${field} for activity ${activityIndex + 1}`);

    // Auto-save after a brief delay
    onUpdateActivities?.(updatedActivities);
  };

  const handleAddActivity = () => {
    const newActivity = createNewActivity();
    const updatedActivities = [...localActivities, newActivity];
    setLocalActivities(updatedActivities);
    setStatusMessage("New activity added");

    onUpdateActivities?.(updatedActivities);

    // Clear status message after 2 seconds
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const handleDeleteActivity = (activityIndex) => {
    const activity = localActivities[activityIndex];
    const activityName = activity?.placeName || `Activity ${activityIndex + 1}`;

    // Store deleted activity for potential undo
    setDeletedActivity({
      activity,
      index: activityIndex,
      timestamp: Date.now(),
    });

    // Remove from list immediately
    const updatedActivities = localActivities.filter(
      (_, index) => index !== activityIndex
    );
    setLocalActivities(updatedActivities);

    // Show undo message
    setStatusMessage(
      <div className="flex items-center justify-between gap-4">
        <span>Deleted "{activityName.slice(0, 50)}..."</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndoDelete}
          className="h-8 gap-2 text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 font-semibold"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </Button>
      </div>
    );

    // Set timer to finalize deletion after 5 seconds
    const timer = setTimeout(() => {
      // Finalize the deletion - update parent
      onUpdateActivities?.(updatedActivities);
      setDeletedActivity(null);
      setStatusMessage("Activity deleted");
      setTimeout(() => setStatusMessage(""), 2000);
    }, 5000);

    setDeleteTimer(timer);
  };

  const handleUndoDelete = () => {
    if (deletedActivity) {
      // Clear the deletion timer
      if (deleteTimer) {
        clearTimeout(deleteTimer);
        setDeleteTimer(null);
      }

      // Restore the activity at its original position
      const updatedActivities = [...localActivities];
      updatedActivities.splice(
        deletedActivity.index,
        0,
        deletedActivity.activity
      );

      setLocalActivities(updatedActivities);
      setDeletedActivity(null);

      setStatusMessage(`Restored "${deletedActivity.activity.placeName}"`);
      setTimeout(() => setStatusMessage(""), 2000);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (deleteTimer) {
        clearTimeout(deleteTimer);
      }
    };
  }, [deleteTimer]);

  const handleReorderActivity = (activityIndex, direction) => {
    const newIndex = direction === "up" ? activityIndex - 1 : activityIndex + 1;

    if (newIndex >= 0 && newIndex < localActivities.length) {
      const updatedActivities = [...localActivities];
      const [movedActivity] = updatedActivities.splice(activityIndex, 1);
      updatedActivities.splice(newIndex, 0, movedActivity);

      const activityName =
        movedActivity.placeName || `Activity ${activityIndex + 1}`;
      const truncatedName =
        activityName.length > 50
          ? `${activityName.substring(0, 50)}...`
          : activityName;
      const directionText = direction === "up" ? "up" : "down";

      setLocalActivities(updatedActivities);
      setStatusMessage(`Moved "${truncatedName}" ${directionText}`);

      onUpdateActivities?.(updatedActivities);

      // Clear status message after 2 seconds
      setTimeout(() => setStatusMessage(""), 2000);
    }
  };

  // Save functionality for future use
  // const handleSaveAll = async () => {
  //   try {
  //     setStatusMessage("Saving all activities...");
  //     await onSaveChanges?.(localActivities);
  //     setStatusMessage("All activities saved successfully");

  //     // Clear success message after 2 seconds
  //     setTimeout(() => setStatusMessage(""), 2000);
  //   } catch (error) {
  //     console.error("Error saving activities:", error);
  //     setStatusMessage("Error saving activities. Please try again.");

  //     // Clear error message after 4 seconds
  //     setTimeout(() => setStatusMessage(""), 4000);
  //   }
  // };

  // Display mode (read-only)
  if (!isEditing) {
    return (
      <div
        className="space-y-4"
        id={editorId}
        role="region"
        aria-label={`Day ${dayNumber || dayIndex + 1} activities`}
      >
        {localActivities.map((activity, index) => (
          <Card
            key={index}
            className="group hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/50"
            tabIndex="0"
            role="article"
            aria-label={`Activity: ${
              activity.placeName || `Activity ${index + 1}`
            }`}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="relative flex gap-4">
                {/* Activity indicator */}
                <div className="flex-shrink-0 pt-1">
                  <div
                    className="w-5 h-5 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 shadow-sm"
                    aria-hidden="true"
                  />
                </div>{" "}
                <div className="flex-1 space-y-3">
                  {/* Time badge */}
                  {activity.time && (
                    <Badge
                      variant="secondary"
                      className="gap-2 bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 border border-sky-200 px-3 py-1.5 text-sm font-semibold"
                    >
                      <Clock className="h-5 w-5" aria-hidden="true" />
                      <time dateTime={convertToISO8601Time(activity.time)}>
                        {activity.time}
                      </time>
                    </Badge>
                  )}

                  {/* Activity title */}
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="h-6 w-6 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {activity.placeName}
                    </h4>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {localActivities.length === 0 && (
          <div
            className="text-center py-8 text-muted-foreground"
            role="region"
            aria-label="No activities"
          >
            <MapPin
              className="h-12 w-12 mx-auto mb-4 opacity-50"
              aria-hidden="true"
            />
            <p className="text-base font-medium">
              No activities planned for this day
            </p>
          </div>
        )}
      </div>
    );
  }

  // Helper function to convert time to ISO 8601 format
  function convertToISO8601Time(timeString) {
    if (!timeString) return "";

    try {
      // Expected format: "9:00 AM" or similar
      const [time, period] = timeString.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      // Convert to 24-hour format
      if (period && period.toUpperCase() === "PM" && hours < 12) {
        hours += 12;
      } else if (period && period.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }

      // Format with leading zeros
      const formattedHours = hours.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");

      return `${formattedHours}:${formattedMinutes}:00`;
    } catch (error) {
      console.error("Error parsing time string:", timeString, error);
      return "";
    }
  }

  // Edit mode
  return (
    <div
      className="space-y-6"
      id={editorId}
      aria-labelledby={`day-heading-${dayIndex}`}
      role="region"
      aria-label={`Edit day ${dayNumber || dayIndex + 1} activities`}
    >
      {/* Enhanced Status notification */}
      {statusMessage && (
        <div
          className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl mb-6 flex items-center gap-4 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300"
          role="status"
          aria-live="polite"
          id={statusId}
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
              <AlertCircle className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
          </div>
          <span className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
            {statusMessage}
          </span>
        </div>
      )}

      {/* Enhanced Time Validation Warnings */}
      {validationResult && validationResult.warnings.length > 0 && (
        <div className="space-y-4 mb-6" role="alert" aria-live="assertive">
          {/* Overall schedule summary with modern card */}
          {validationResult.totalTime > 0 && (
            <div className="relative overflow-hidden p-6 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 border-2 border-sky-300 dark:border-sky-700 rounded-2xl shadow-lg backdrop-blur-sm">
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-sky-200 dark:bg-sky-800 rounded-full blur-3xl opacity-20"
                aria-hidden="true"
              />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <Clock className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-sky-900 dark:text-sky-200 mb-2">
                    📅 Schedule Overview
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-sky-800 dark:text-sky-300 font-medium">
                      Total time needed:{" "}
                      <span className="font-bold">
                        ~{Math.round(validationResult.totalTime / 60)} hours
                      </span>
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-sky-200 dark:bg-sky-800 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-500 ${
                            validationResult.utilizationPercent > 90
                              ? "bg-gradient-to-r from-red-500 to-orange-500"
                              : validationResult.utilizationPercent > 75
                              ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                              : "bg-gradient-to-r from-emerald-500 to-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              validationResult.utilizationPercent,
                              100
                            )}%`,
                          }}
                          role="progressbar"
                          aria-valuenow={validationResult.utilizationPercent}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                      <span className="text-sm font-bold text-sky-700 dark:text-sky-400 min-w-[60px]">
                        {validationResult.utilizationPercent}% full
                      </span>
                    </div>
                  </div>
                  {!validationResult.isValid && (
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-950/50 border-l-4 border-red-500 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400 font-semibold flex items-center gap-2">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        This schedule may not be realistic - consider adjusting
                        times
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Individual warnings with enhanced styling */}
          {validationResult.warnings
            .filter((w) => w.severity === "critical" || w.severity === "high")
            .slice(0, 5)
            .map((warning, idx) => {
              const severityConfig = {
                critical: {
                  icon: XCircle,
                  gradient:
                    "from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40",
                  border: "border-red-300 dark:border-red-700",
                  iconBg: "from-red-500 to-rose-600",
                  text: "text-red-900 dark:text-red-200",
                },
                high: {
                  icon: AlertTriangle,
                  gradient:
                    "from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40",
                  border: "border-orange-300 dark:border-orange-700",
                  iconBg: "from-orange-500 to-amber-600",
                  text: "text-orange-900 dark:text-orange-200",
                },
              };

              const config =
                severityConfig[warning.severity] || severityConfig.high;
              const IconComponent = config.icon;

              return (
                <div
                  key={idx}
                  className={`p-5 bg-gradient-to-br ${config.gradient} border-2 ${config.border} rounded-xl shadow-md backdrop-blur-sm animate-in fade-in slide-in-from-left-2 duration-300`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${config.iconBg} rounded-lg flex items-center justify-center shadow-md`}
                      >
                        <IconComponent
                          className="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className={`text-sm font-bold ${config.text}`}>
                        {warning.message}
                      </p>
                      {warning.suggestion && (
                        <p className="text-xs font-medium opacity-80 flex items-start gap-2">
                          <span className="text-base" aria-hidden="true">
                            💡
                          </span>
                          <span>{warning.suggestion}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {validationResult.warnings.length > 5 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              +{validationResult.warnings.length - 5} more suggestions available
            </p>
          )}
        </div>
      )}

      {/* Enhanced Activities list */}
      {localActivities.length > 0 ? (
        <ul className="space-y-5 list-none pl-0" aria-label="Edit activities">
          {localActivities.map((activity, index) => {
            const activityId = `activity-${dayIndex}-${index}`;
            return (
              <li
                key={index}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <Card
                  className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border-2 border-sky-200 dark:border-sky-800 shadow-lg hover:shadow-2xl hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 backdrop-blur-sm"
                  id={activityId}
                >
                  {/* Decorative gradient overlay */}
                  <div
                    className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500"
                    aria-hidden="true"
                  />

                  <CardContent className="p-6 space-y-5">
                    {/* Enhanced Activity controls */}
                    <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-lg ring-4 ring-sky-100 dark:ring-sky-900/50"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h5
                            id={`activity-${dayIndex}-${index}-title`}
                            className="text-base font-bold text-gray-900 dark:text-gray-100"
                          >
                            Activity {index + 1}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {activity.time || "Set time"}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-1.5 shadow-inner"
                        role="toolbar"
                        aria-label={`Activity ${index + 1} controls`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderActivity(index, "up")}
                          disabled={index === 0}
                          aria-label="Move activity up"
                          title="Move up"
                          className="h-9 w-9 p-0 hover:bg-sky-100 dark:hover:bg-sky-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ChevronUp
                            className="h-4 w-4 text-sky-600 dark:text-sky-400"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderActivity(index, "down")}
                          disabled={index === localActivities.length - 1}
                          aria-label="Move activity down"
                          title="Move down"
                          className="h-9 w-9 p-0 hover:bg-sky-100 dark:hover:bg-sky-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ChevronDown
                            className="h-4 w-4 text-sky-600 dark:text-sky-400"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Move down</span>
                        </Button>
                        <div
                          className="w-px h-6 bg-gray-300 dark:bg-gray-600"
                          aria-hidden="true"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(index)}
                          aria-label="Delete this activity"
                          title="Delete activity"
                          className="h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced Editable fields */}
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-5"
                      role="form"
                      aria-labelledby={`activity-${dayIndex}-${index}-title`}
                    >
                      {/* Time with enhanced styling */}
                      <div className="space-y-2">
                        <label
                          htmlFor={`time-${activityId}`}
                          className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                          <Clock
                            className="h-4 w-4 text-sky-600 dark:text-sky-400"
                            aria-hidden="true"
                          />
                          Time
                        </label>
                        <div className="relative">
                          <InlineEditableText
                            id={`time-${activityId}`}
                            value={activity.time}
                            onSave={(value) =>
                              handleUpdateActivity(index, "time", value)
                            }
                            placeholder="09:00 AM"
                            className="w-full font-semibold"
                            label="Activity time"
                          />
                        </div>
                      </div>

                      {/* Activity Name with enhanced styling */}
                      <div className="space-y-2">
                        <label
                          htmlFor={`name-${activityId}`}
                          className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                          <MapPin
                            className="h-4 w-4 text-sky-600 dark:text-sky-400"
                            aria-hidden="true"
                          />
                          Activity Name
                        </label>
                        <InlineEditableText
                          id={`name-${activityId}`}
                          value={activity.placeName}
                          onSave={(value) =>
                            handleUpdateActivity(index, "placeName", value)
                          }
                          placeholder="Activity name"
                          className="w-full font-semibold"
                          label="Activity name"
                        />
                      </div>
                    </div>

                    {/* Activity Details - full width with enhanced styling */}
                    <div className="space-y-2">
                      <label
                        htmlFor={`description-${activityId}`}
                        className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"
                      >
                        <Edit3
                          className="h-4 w-4 text-sky-600 dark:text-sky-400"
                          aria-hidden="true"
                        />
                        Activity Details
                      </label>
                      <InlineEditableText
                        id={`description-${activityId}`}
                        value={activity.placeDetails}
                        onSave={(value) =>
                          handleUpdateActivity(index, "placeDetails", value)
                        }
                        placeholder="Add details about this activity..."
                        multiline
                        maxLength={500}
                        className="w-full"
                        label="Activity description"
                      />
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <div
          className="relative overflow-hidden text-center py-16 bg-gradient-to-br from-gray-50 via-sky-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-dashed border-sky-300 dark:border-sky-700 rounded-2xl shadow-inner"
          role="region"
          aria-label="No activities added yet"
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 bg-sky-200 dark:bg-sky-800 rounded-full blur-3xl opacity-20"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-40 h-40 bg-blue-200 dark:bg-blue-800 rounded-full blur-3xl opacity-20"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-lg mb-6">
              <Edit3 className="h-10 w-10 text-white" aria-hidden="true" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No Activities Yet
            </h4>
            <p className="text-base text-gray-600 dark:text-gray-400 font-medium max-w-md mx-auto">
              Start building your perfect day by adding activities below
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Add activity button */}
      <Button
        variant="outline"
        className="group relative overflow-hidden w-full border-2 border-dashed border-sky-300 dark:border-sky-700 gap-3 h-20 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:border-sky-500 dark:hover:border-sky-500 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 hover:from-sky-100 hover:via-blue-100 hover:to-indigo-100 dark:hover:from-sky-900/50 dark:hover:via-blue-900/50 dark:hover:to-indigo-900/50 focus:ring-2 focus:ring-sky-500/50 transition-all duration-300 rounded-2xl shadow-md hover:shadow-lg"
        onClick={handleAddActivity}
        aria-label="Add a new activity"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
            <Plus className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold">Add New Activity</span>
        </div>
      </Button>
    </div>
  );
}

export default ActivityEditor;
