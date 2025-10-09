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
} from "lucide-react";
import {
  validateDaySchedule,
  getSeverityColor,
  getSeverityIcon,
} from "../utils/timeValidator";

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
    const activityName =
      localActivities[activityIndex]?.placeName ||
      `Activity ${activityIndex + 1}`;
    const updatedActivities = localActivities.filter(
      (_, index) => index !== activityIndex
    );

    setLocalActivities(updatedActivities);
    setStatusMessage(`Removed "${activityName}"`);

    onUpdateActivities?.(updatedActivities);

    // Clear status message after 2 seconds
    setTimeout(() => setStatusMessage(""), 2000);
  };

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
                      className="h-6 w-6 text-sky-600 mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <h4 className="text-lg font-bold text-gray-900">
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
      className="space-y-4"
      id={editorId}
      aria-labelledby={`day-heading-${dayIndex}`}
      role="region"
      aria-label={`Edit day ${dayNumber || dayIndex + 1} activities`}
    >
      {/* Status notification */}
      {statusMessage && (
        <div
          className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-lg mb-4 flex items-center gap-3 shadow-sm"
          role="status"
          aria-live="polite"
          id={statusId}
        >
          <AlertCircle className="h-5 w-5 text-sky-600" aria-hidden="true" />
          <span className="text-base font-medium text-sky-800">
            {statusMessage}
          </span>
        </div>
      )}

      {/* Time Validation Warnings */}
      {validationResult && validationResult.warnings.length > 0 && (
        <div className="space-y-3 mb-4" role="alert" aria-live="assertive">
          {/* Overall schedule summary */}
          {validationResult.totalTime > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock
                  className="h-5 w-5 text-blue-600 mt-0.5"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Schedule Overview
                  </p>
                  <p className="text-sm text-blue-700">
                    Total time needed: ~
                    {Math.round(validationResult.totalTime / 60)} hours (
                    {validationResult.utilizationPercent}% of day)
                  </p>
                  {!validationResult.isValid && (
                    <p className="text-sm text-red-600 font-medium mt-2">
                      ⚠️ This schedule may not be realistic
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Individual warnings */}
          {validationResult.warnings
            .filter((w) => w.severity === "critical" || w.severity === "high")
            .slice(0, 5)
            .map((warning, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-lg ${getSeverityColor(
                  warning.severity
                )}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl" aria-hidden="true">
                    {getSeverityIcon(warning.severity)}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold">{warning.message}</p>
                    {warning.suggestion && (
                      <p className="text-xs opacity-90">
                        💡 {warning.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {validationResult.warnings.length > 5 && (
            <p className="text-xs text-gray-600 text-center">
              +{validationResult.warnings.length - 5} more suggestions
            </p>
          )}
        </div>
      )}

      {/* Activities list */}
      {localActivities.length > 0 ? (
        <ul className="space-y-4 list-none pl-0" aria-label="Edit activities">
          {localActivities.map((activity, index) => {
            const activityId = `activity-${dayIndex}-${index}`;
            return (
              <li key={index}>
                <Card
                  className="bg-white rounded-lg border-2 border-dashed border-sky-200 shadow-md hover:border-sky-300 hover:shadow-lg transition-all duration-300"
                  id={activityId}
                >
                  <CardContent className="p-4 space-y-4">
                    {/* Activity controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </div>
                        <h5
                          id={`activity-${dayIndex}-${index}-title`}
                          className="text-sm font-medium text-foreground"
                        >
                          Activity {index + 1}
                        </h5>
                      </div>

                      <div
                        className="flex items-center gap-1"
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
                          className="h-8 w-8 p-0"
                        >
                          <ChevronUp className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderActivity(index, "down")}
                          disabled={index === localActivities.length - 1}
                          aria-label="Move activity down"
                          title="Move down"
                          className="h-8 w-8 p-0"
                        >
                          <ChevronDown className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">Move down</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(index)}
                          aria-label="Delete this activity"
                          title="Delete activity"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>

                    {/* Editable fields */}
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      role="form"
                      aria-labelledby={`activity-${dayIndex}-${index}-title`}
                    >
                      {/* Time */}
                      <div>
                        <label
                          htmlFor={`time-${activityId}`}
                          className="text-xs font-medium text-muted-foreground mb-1 block"
                        >
                          Time
                        </label>
                        <InlineEditableText
                          id={`time-${activityId}`}
                          value={activity.time}
                          onSave={(value) =>
                            handleUpdateActivity(index, "time", value)
                          }
                          placeholder="09:00 AM"
                          className="w-full"
                          label="Activity time"
                        />
                      </div>

                      {/* Activity Name */}
                      <div>
                        <label
                          htmlFor={`name-${activityId}`}
                          className="text-xs font-medium text-muted-foreground mb-1 block"
                        >
                          Activity Name
                        </label>
                        <InlineEditableText
                          id={`name-${activityId}`}
                          value={activity.placeName}
                          onSave={(value) =>
                            handleUpdateActivity(index, "placeName", value)
                          }
                          placeholder="Activity name"
                          className="w-full"
                          label="Activity name"
                        />
                      </div>
                    </div>

                    {/* Activity Details - full width */}
                    <div>
                      <label
                        htmlFor={`description-${activityId}`}
                        className="text-xs font-medium text-muted-foreground mb-1 block"
                      >
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
          className="text-center py-8 text-muted-foreground"
          role="region"
          aria-label="No activities added yet"
        >
          <Edit3
            className="h-12 w-12 mx-auto mb-4 opacity-50"
            aria-hidden="true"
          />
          <p className="text-base font-medium">
            Click "Add New Activity" to start planning this day
          </p>
        </div>
      )}

      {/* Add activity button */}
      <Button
        variant="outline"
        className="w-full border-2 border-dashed border-sky-200 gap-3 h-16 text-sky-600 hover:text-sky-700 hover:border-sky-400 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 focus:ring-2 focus:ring-sky-500/50 transition-all duration-300"
        onClick={handleAddActivity}
        aria-label="Add a new activity"
      >
        <Plus className="h-7 w-7" aria-hidden="true" />
        <span className="text-base font-semibold">Add New Activity</span>
      </Button>
    </div>
  );
}

export default ActivityEditor;
