// src/view-trip/components/LoadingState.jsx
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
      <div className="text-center">
        {/* Enhanced Loading Card */}
        <div className="brand-card p-6 sm:p-8 max-w-md mx-auto">
          {/* Loading Animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto brand-gradient rounded-full flex items-center justify-center shadow-xl">
              <AiOutlineLoading3Quarters className="h-10 w-10 animate-spin text-white" />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-sky-200 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-sky-300 rounded-full animate-ping opacity-30 animation-delay-2000"></div>
          </div>

          {/* Loading Text */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Loading your adventure...
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Preparing your personalized travel experience with the latest
              information and recommendations
            </p>

            {/* Loading Steps */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
                <span>Gathering trip details</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse animation-delay-2000"></div>
                <span>Loading itinerary data</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse animation-delay-4000"></div>
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
