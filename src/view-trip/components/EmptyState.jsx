// src/view-trip/components/EmptyState.jsx
import { Button } from "@/components/ui/button";

function EmptyState({ onCreateNew }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">🧳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No trip data found
          </h2>
          <p className="text-gray-600 mb-6">
            This trip might have been deleted or doesn't exist.
          </p>
          <Button onClick={onCreateNew} className="w-full">
            Create New Trip
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmptyState;
