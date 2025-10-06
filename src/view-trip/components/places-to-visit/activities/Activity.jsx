/**
 * Activity Component - Simple activity display without drag-and-drop
 */

import React from "react";
import RegularActivity from "./RegularActivity";

function Activity({ activity, activityIndex, dayIndex }) {
  return (
    <RegularActivity
      activity={activity}
      activityIndex={activityIndex}
      dayIndex={dayIndex}
    />
  );
}

export default Activity;