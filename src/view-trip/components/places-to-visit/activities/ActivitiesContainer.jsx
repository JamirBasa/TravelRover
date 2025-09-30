import React from "react";
import { cn } from "@/lib/utils";

/**
 * ActivitiesContainer Component - Simple container for activities without drag-and-drop
 */
function ActivitiesContainer({ children, dayIndex }) {
  return (
    <div
      className={cn(
        "relative rounded-lg transition-all duration-300 ease-in-out",
        "hover:bg-muted/30"
      )}
      data-day={dayIndex}
      aria-label={`Day ${dayIndex + 1} activities container`}
    >
      {/* Modern activities container with enhanced spacing */}
      <div
        className={cn(
          "space-y-4 py-1",
          "relative before:absolute before:left-0 before:top-0 before:bottom-0",
          "before:w-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent",
          "before:opacity-20"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default ActivitiesContainer;