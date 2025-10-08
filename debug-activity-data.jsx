// Debug component to understand activity data structure
import React from "react";

export const DebugActivityData = ({ activities, day }) => {
  console.log(`🐛 Debug: Day ${day} activities:`, activities);

  activities.forEach((activity, index) => {
    console.log(`🐛 Activity ${index + 1}:`, {
      type: typeof activity,
      keys: Object.keys(activity || {}),
      activity: activity,
      planText: activity?.planText,
      name: activity?.name,
      placeName: activity?.placeName,
      activity_prop: activity?.activity,
    });
  });

  return (
    <div className="bg-red-100 border border-red-300 p-4 m-4 text-xs">
      <h4 className="font-bold text-red-800">Debug: Activity Data Structure</h4>
      <pre className="mt-2 text-red-700">
        {JSON.stringify(activities, null, 2)}
      </pre>
    </div>
  );
};
