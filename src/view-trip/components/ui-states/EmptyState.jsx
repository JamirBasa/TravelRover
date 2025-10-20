// src/view-trip/components/EmptyState.jsx
import { Button } from "@/components/ui/button";

function EmptyState({ onCreateNew }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg shadow-md dark:shadow-sky-500/5 border border-gray-100 dark:border-slate-700">
          <div className="text-6xl mb-4">🧳</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            No trip data found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This trip might have been deleted or doesn't exist.
          </p>
          <Button
            onClick={onCreateNew}
            className="w-full brand-button cursor-pointer"
          >
            Create New Trip
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmptyState;
