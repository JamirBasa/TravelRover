import React from "react";

function EmptyStateComponent({
  message = "No itinerary data available for this trip",
  icon = "📅",
  title = "No Itinerary Available",
  description = "Your trip itinerary is being prepared. Please check back soon or try regenerating your trip.",
}) {
  return (
    <div
      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 sm:p-8 text-center"
      role="region"
      aria-label="Empty state"
    >
      <div className="w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-base font-medium max-w-md mx-auto">
        {message || description}
      </p>
    </div>
  );
}

export default EmptyStateComponent;
