// src/view-trip/components/ErrorState.jsx
import { Button } from "@/components/ui/button";

function ErrorState({ error, onRetry, onCreateNew }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={onRetry} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={onCreateNew} className="w-full">
              Create New Trip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
