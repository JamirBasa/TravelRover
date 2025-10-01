import React from "react";

function EmptyStateComponent({
  message = "No itinerary data available for this trip",
  icon = "📅",
  title = "No Itinerary Available",
  description = "Your trip itinerary is being prepared. Please check back soon or try regenerating your trip.",
}) {
  return (
    <div
      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center"
      role="region"
      aria-label="Empty state"
    >
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto">
        {message || description}
      </p>
    </div>
  );
}

export default EmptyStateComponent;
