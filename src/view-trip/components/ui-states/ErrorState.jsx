// src/view-trip/components/ErrorState.jsx
import { Button } from "@/components/ui/button";

function ErrorState({ error, onRetry, onCreateNew }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        {/* Enhanced Error Card */}
        <div className="brand-card p-6 sm:p-8 max-w-lg mx-auto">
          {/* Error Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-full flex items-center justify-center shadow-xl">
              <span
                className="text-4xl text-white"
                role="img"
                aria-label="Error"
              >
                ⚠️
              </span>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-200 dark:bg-red-800 rounded-full animate-bounce"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-red-200 dark:bg-red-800 rounded-full animate-bounce animation-delay-2000"></div>
          </div>

          {/* Error Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {error ||
                  "We encountered an unexpected error while loading your trip."}
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">
                What can you do?
              </h3>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onRetry}
                className="brand-button w-full py-4 text-lg font-semibold cursor-pointer"
                aria-label="Retry loading the trip"
              >
                <span className="mr-2" role="img" aria-label="Retry">
                  🔄
                </span>
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={onCreateNew}
                className="w-full py-4 text-lg font-semibold border-2 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-500 focus:ring-offset-2 text-gray-700 dark:text-gray-300 cursor-pointer"
                aria-label="Create a new trip"
              >
                <span className="mr-2" role="img" aria-label="New trip">
                  ✨
                </span>
                Create New Trip
              </Button>
            </div>

            {/* Support Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Need help? Contact our{" "}
                <a
                  href="#"
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium underline"
                  aria-label="Contact support team"
                >
                  support team
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
