import React from "react";
import RegularActivity from "./RegularActivity";
import { ActivityEditor } from "../editing";
import { MapPin } from "lucide-react";

function ActivitiesRenderer({
  dayIndex,
  dayItem,
  editingDay,
  editableItinerary,
  onUpdateActivities,
  onSaveChanges,
  dayActivitiesId, // Prop for accessibility
  dayNumber, // Prop for accessibility
  isBeingEdited, // Prop for clarity
}) {
  // Priority-based data source selection
  let activitiesData;
  let dataSource = "none";

  // Use prop or compute it locally
  const isEditing = isBeingEdited ?? editingDay === dayIndex;

  if (isEditing && editableItinerary[dayIndex]?.plan?.length > 0) {
    // Use editable data when actively editing and has activities
    activitiesData = editableItinerary[dayIndex].plan;
    dataSource = "editable";
  } else {
    // Check for planText or similar fields (your actual data format)
    const possibleTextFields = [
      dayItem?.planText,
      dayItem?.plan_text,
      dayItem?.activities,
      dayItem?.itinerary,
      dayItem?.schedule,
      dayItem?.description,
      dayItem?.content,
    ];

    const planTextData = possibleTextFields.find(
      (field) =>
        field &&
        typeof field === "string" &&
        field.trim() &&
        field.includes("|")
    );

    if (planTextData) {
      activitiesData = planTextData.split(" | ").map((activity, index) => {
        const timeMatch = activity.match(/^(\d{1,2}:\d{2} [AP]M)/);
        const time = timeMatch ? timeMatch[1] : "";
        const content = time ? activity.replace(time + " - ", "") : activity;

        return {
          placeName: content,
          time: time,
          placeDetails: `Activity ${index + 1} for Day ${
            dayNumber || dayIndex + 1
          }`,
          id: `${dayIndex}-${index}`,
        };
      });
      dataSource = "planText";
    } else if (
      dayItem?.plan &&
      Array.isArray(dayItem.plan) &&
      dayItem.plan.length > 0
    ) {
      // Fallback to plan array format
      activitiesData = dayItem.plan;
      dataSource = "plan";
    } else {
      activitiesData = [];
      dataSource = "empty";
    }
  }

  // Only log when there are issues for debugging
  if (dataSource === "empty" && dayItem) {
    console.log("⚠️ No activities found for day:", dayIndex, {
      dataSource,
      availableKeys: Object.keys(dayItem),
    });
  }

  // Activity count for accessibility descriptions
  const activityCount = activitiesData?.length || 0;
  const activitiesLabel = `${activityCount} ${
    activityCount === 1 ? "activity" : "activities"
  } for Day ${dayNumber || dayIndex + 1}`;

  // Handle activities based on data source
  if (isEditing) {
    // Edit mode: use ActivityEditor for inline editing
    return (
      <div
        role="region"
        aria-labelledby={`day-heading-${dayIndex}`}
        aria-live="polite"
      >
        <h4 id={`activities-heading-${dayIndex}`} className="sr-only">
          {isEditing ? "Edit activities" : activitiesLabel}
        </h4>

        <ActivityEditor
          activities={activitiesData || []}
          dayIndex={dayIndex}
          onUpdateActivities={onUpdateActivities}
          onSaveChanges={onSaveChanges}
          isEditing={true}
          dayNumber={dayNumber}
          dayActivitiesId={dayActivitiesId}
        />
      </div>
    );
  } else {
    // View mode: regular activities display
    if (
      activitiesData &&
      Array.isArray(activitiesData) &&
      activitiesData.length > 0
    ) {
      return (
        <div role="region" aria-labelledby={`day-heading-${dayIndex}`}>
          <h4 id={`activities-heading-${dayIndex}`} className="sr-only">
            {activitiesLabel}
          </h4>

          <ul className="space-y-4 list-none pl-0" aria-label={activitiesLabel}>
            {activitiesData.map((activity, activityIndex) => (
              <li key={`activity-${dayIndex}-${activityIndex}`}>
                <RegularActivity
                  activity={activity}
                  activityIndex={activityIndex}
                  dayIndex={dayIndex}
                />
              </li>
            ))}
          </ul>
        </div>
      );
    } else {
      // No activities available
      return (
        <div
          className="bg-muted/30 rounded-lg p-8 text-center border-2 border-dashed border-muted-foreground/20"
          role="region"
          aria-labelledby={`day-heading-${dayIndex}`}
          aria-label="No activities planned"
        >
          <MapPin
            className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-base font-medium">
            No activities planned for this day
          </p>
        </div>
      );
    }
  }
}

export default ActivitiesRenderer;
