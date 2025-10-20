// src/view-trip/components/LoadingState.jsx
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        {/* Enhanced Loading Card */}
        <div className="brand-card p-6 sm:p-8 max-w-md mx-auto">
          {/* Loading Animation - CONTINUOUS SPINNING */}
          <div
            className="relative mb-6 flex items-center justify-center"
            key="loading-spinner"
          >
            {/* Pulse rings - Fixed positioning */}
            <div
              className="absolute w-20 h-20 border-4 border-sky-200 dark:border-sky-800 rounded-full opacity-20"
              style={{
                animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            ></div>
            <div
              className="absolute w-20 h-20 border-4 border-sky-300 dark:border-sky-700 rounded-full opacity-30"
              style={{
                animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                animationDelay: "0.5s",
              }}
            ></div>

            {/* Main spinning circle - CONTINUOUS SPIN */}
            <div className="relative w-20 h-20 brand-gradient rounded-full flex items-center justify-center shadow-xl z-10">
              <AiOutlineLoading3Quarters
                className="h-10 w-10 text-white"
                style={{
                  animation: "spin 1s linear infinite",
                  transformOrigin: "center center",
                  willChange: "transform",
                }}
              />
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Loading your adventure...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Preparing your personalized travel experience with the latest
              information and recommendations
            </p>

            {/* Loading Steps */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-sky-500 dark:bg-sky-400 rounded-full animate-pulse"></div>
                <span>Gathering trip details</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-sky-500 dark:bg-sky-400 rounded-full animate-pulse animation-delay-2000"></div>
                <span>Loading itinerary data</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-sky-500 dark:bg-sky-400 rounded-full animate-pulse animation-delay-4000"></div>
                <span>Preparing recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
