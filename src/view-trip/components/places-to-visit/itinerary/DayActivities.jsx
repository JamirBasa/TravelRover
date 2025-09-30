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
  onSaveChanges
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
      {/* Visual connection line from day header to activities */}
      <div 
        className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-100 to-transparent opacity-60"
        aria-hidden="true"
      ></div>

      {/* Activities content with optimal alignment */}
      <div className="pl-8 pt-1">
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
