import React from "react";

function ItineraryNavigationHelper({ editingDay }) {
  return (
    <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-indigo-100">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-indigo-600 text-lg">🗺️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-indigo-900 mb-2">
            How to Use This Itinerary
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-indigo-800">
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">✅</span>
              <span>Times are suggestions - adjust to your pace</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">📍</span>
              <span>Click place names for Google Maps directions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">💰</span>
              <span>Check current prices before visiting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">🖱️</span>
              <span>
                {editingDay !== null
                  ? "Drag activities to reorder them within the day"
                  : "Click 'Edit Day' on any day to customize activities"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItineraryNavigationHelper;
