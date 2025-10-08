import React from "react";
import { cn } from "@/lib/utils";

/**
 * ActivitiesContainer Component - Simple container for activities without drag-and-drop
 */
function ActivitiesContainer({ children, dayIndex }) {
  return (
    <div
      className={cn("w-full")}
      data-day={dayIndex}
      aria-label={`Day ${dayIndex + 1} activities container`}
    >
      {/* Activities container with proper spacing */}
      <div className="space-y-3 w-full">{children}</div>
    </div>
  );
}

export default ActivitiesContainer;
