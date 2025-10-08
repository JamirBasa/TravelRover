import React from "react";
import ActivitiesRenderer from "../activities/ActivitiesRenderer";
import { ActivitiesContainer } from "../activities";

/**
 * DayActivities Component - Shows activities for a single day
 * Enhanced with accessibility features and simplified without drag-and-drop
 */
function DayActivities({
  dayIndex,
  dayItem,
  editingDay,
  editableItinerary,
  onUpdateActivities,
  onSaveChanges,
}) {
  // Compute values for proper accessibility
  const dayNumber = dayItem?.day || dayIndex + 1;
  const isBeingEdited = editingDay === dayIndex;
  const dayActivitiesId = `day-activities-${dayIndex}`;

  return (
    <section
      className="relative"
      aria-labelledby={`day-header-${dayIndex}`}
      id={dayActivitiesId}
    >
      {/* Activities content with proper alignment */}
      <div className="px-4 py-2">
        <ActivitiesContainer dayIndex={dayIndex}>
          <ActivitiesRenderer
            dayIndex={dayIndex}
            dayItem={dayItem}
            editingDay={editingDay}
            editableItinerary={editableItinerary}
            onUpdateActivities={onUpdateActivities}
            onSaveChanges={onSaveChanges}
            dayActivitiesId={dayActivitiesId}
            dayNumber={dayNumber}
            isBeingEdited={isBeingEdited}
          />
        </ActivitiesContainer>
      </div>
    </section>
  );
}

export default DayActivities;
