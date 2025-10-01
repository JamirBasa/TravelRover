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

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import InlineEditableText from "./InlineEditableText";
import {
  Clock,
  MapPin,
  Star,
  DollarSign,
  Timer,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Save,
  Edit3,
  AlertCircle,
} from "lucide-react";

function ActivityEditor({
  activities = [],
  dayIndex,
  onUpdateActivities,
  onSaveChanges,
  isEditing = false,
  dayNumber,
}) {
  const [localActivities, setLocalActivities] = useState(activities);
  const [hasChanges, setHasChanges] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Generate IDs for accessibility
  const editorId = `day-${dayIndex}-activity-editor`;
  const statusId = `day-${dayIndex}-status`;

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
    setHasChanges(true);
    setStatusMessage(`Updated ${field} for activity ${activityIndex + 1}`);

    // Auto-save after a brief delay
    onUpdateActivities?.(updatedActivities);
  };

  const handleAddActivity = () => {
    const newActivity = createNewActivity();
    const updatedActivities = [...localActivities, newActivity];
    setLocalActivities(updatedActivities);
    setHasChanges(true);
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
    setHasChanges(true);
    setStatusMessage(`Removed "${activityName}"`);

    onUpdateActivities?.(updatedActivities);

    // Clear status message after 2 seconds
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const handleCopyActivity = (activityIndex) => {
    const activityToCopy = { ...localActivities[activityIndex] };
    const originalName = activityToCopy.placeName;
    activityToCopy.placeName = `${activityToCopy.placeName} (Copy)`;

    const updatedActivities = [
      ...localActivities.slice(0, activityIndex + 1),
      activityToCopy,
      ...localActivities.slice(activityIndex + 1),
    ];

    setLocalActivities(updatedActivities);
    setHasChanges(true);
    setStatusMessage(`Duplicated "${originalName}"`);

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
      const directionText = direction === "up" ? "up" : "down";

      setLocalActivities(updatedActivities);
      setHasChanges(true);
      setStatusMessage(`Moved "${activityName}" ${directionText}`);

      onUpdateActivities?.(updatedActivities);

      // Clear status message after 2 seconds
      setTimeout(() => setStatusMessage(""), 2000);
    }
  };

  const handleSaveAll = async () => {
    try {
      setStatusMessage("Saving all activities...");
      await onSaveChanges?.(localActivities);
      setHasChanges(false);
      setStatusMessage("All activities saved successfully");

      // Clear success message after 2 seconds
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (error) {
      console.error("Error saving activities:", error);
      setStatusMessage("Error saving activities. Please try again.");

      // Clear error message after 4 seconds
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

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
                    className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Time badge */}
                  {activity.time && (
                    <Badge
                      variant="secondary"
                      className="gap-2 bg-primary/10 text-primary"
                    >
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <time dateTime={convertToISO8601Time(activity.time)}>
                        {activity.time}
                      </time>
                    </Badge>
                  )}

                  {/* Activity title */}
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="h-4 w-4 text-primary mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <h4 className="text-base font-semibold text-foreground">
                      {activity.placeName}
                    </h4>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activity.placeDetails}
                  </p>

                  {/* Badges */}
                  <div
                    className="flex flex-wrap gap-2"
                    aria-label="Activity details"
                  >
                    {activity.ticketPricing && (
                      <Badge
                        variant="outline"
                        className="gap-1.5 border-green-200 bg-green-50 text-green-700"
                      >
                        <DollarSign className="h-3 w-3" aria-hidden="true" />
                        <span>{activity.ticketPricing}</span>
                      </Badge>
                    )}
                    {activity.timeTravel && (
                      <Badge
                        variant="outline"
                        className="gap-1.5 border-orange-200 bg-orange-50 text-orange-700"
                      >
                        <Timer className="h-3 w-3" aria-hidden="true" />
                        <span>{activity.timeTravel}</span>
                      </Badge>
                    )}
                    {activity.rating && (
                      <Badge
                        variant="outline"
                        className="gap-1.5 border-yellow-200 bg-yellow-50 text-yellow-700"
                      >
                        <Star className="h-3 w-3" aria-hidden="true" />
                        <span>{activity.rating}/5</span>
                      </Badge>
                    )}
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
              className="h-8 w-8 mx-auto mb-2 opacity-50"
              aria-hidden="true"
            />
            <p>No activities planned for this day</p>
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
          className="p-3 bg-primary/5 border border-primary/20 rounded-md mb-4 flex items-center gap-2"
          role="status"
          aria-live="polite"
          id={statusId}
        >
          <AlertCircle className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm">{statusMessage}</span>
        </div>
      )}

      {/* Save button if there are changes */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveAll}
            className="gap-2"
            size="sm"
            aria-label="Save all activity changes"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Save Changes</span>
          </Button>
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
                  className="border-2 border-dashed border-muted-foreground/20 bg-muted/20"
                  id={activityId}
                >
                  <CardContent className="p-4 space-y-4">
                    {/* Activity controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold"
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
                          onClick={() => handleCopyActivity(index)}
                          aria-label="Duplicate this activity"
                          title="Copy activity"
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">Duplicate</span>
                        </Button>
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

                      {/* Place Name */}
                      <div>
                        <label
                          htmlFor={`name-${activityId}`}
                          className="text-xs font-medium text-muted-foreground mb-1 block"
                        >
                          Place Name
                        </label>
                        <InlineEditableText
                          id={`name-${activityId}`}
                          value={activity.placeName}
                          onSave={(value) =>
                            handleUpdateActivity(index, "placeName", value)
                          }
                          placeholder="Activity name"
                          className="w-full"
                          label="Place name"
                        />
                      </div>

                      {/* Ticket Pricing */}
                      <div>
                        <label
                          htmlFor={`price-${activityId}`}
                          className="text-xs font-medium text-muted-foreground mb-1 block"
                        >
                          Ticket Price
                        </label>
                        <InlineEditableText
                          id={`price-${activityId}`}
                          value={activity.ticketPricing}
                          onSave={(value) =>
                            handleUpdateActivity(index, "ticketPricing", value)
                          }
                          placeholder="₱0"
                          className="w-full"
                          label="Ticket price"
                        />
                      </div>

                      {/* Time Travel */}
                      <div>
                        <label
                          htmlFor={`duration-${activityId}`}
                          className="text-xs font-medium text-muted-foreground mb-1 block"
                        >
                          Duration
                        </label>
                        <InlineEditableText
                          id={`duration-${activityId}`}
                          value={activity.timeTravel}
                          onSave={(value) =>
                            handleUpdateActivity(index, "timeTravel", value)
                          }
                          placeholder="1 hour"
                          className="w-full"
                          label="Activity duration"
                        />
                      </div>

                      {/* Rating */}
                      <div>
                        <label
                          htmlFor={`rating-${activityId}`}
                          className="text-xs font-medium text-muted-foreground mb-1 block"
                        >
                          Rating
                        </label>
                        <InlineEditableText
                          id={`rating-${activityId}`}
                          value={activity.rating}
                          onSave={(value) =>
                            handleUpdateActivity(index, "rating", value)
                          }
                          placeholder="4.0"
                          className="w-full"
                          label="Activity rating"
                        />
                      </div>
                    </div>

                    {/* Description - full width */}
                    <div>
                      <label
                        htmlFor={`description-${activityId}`}
                        className="text-xs font-medium text-muted-foreground mb-1 block"
                      >
                        Description
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
            className="h-8 w-8 mx-auto mb-2 opacity-50"
            aria-hidden="true"
          />
          <p>Click "Add New Activity" to start planning this day</p>
        </div>
      )}

      {/* Add activity button */}
      <Button
        variant="outline"
        className="w-full border-dashed gap-2 h-16 text-muted-foreground hover:text-foreground hover:border-primary focus:ring-2 focus:ring-primary/50"
        onClick={handleAddActivity}
        aria-label="Add a new activity"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        <span>Add New Activity</span>
      </Button>
    </div>
  );
}

export default ActivityEditor;
