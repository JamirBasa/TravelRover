// src/view-trip/components/LoadingState.jsx
import { AiOutlineLoading3Quarters } from "react-icons/ai";

/**
 * View Trip Loading State
 * Uses unified loading design system with brand gradient
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-sky-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6 p-6">
        {/* Animated Loading Spinner with Gradient */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-20 h-20">
            {/* Outer pulse ring */}
            <div className="absolute inset-0 brand-gradient rounded-full opacity-20 animate-ping" />

            {/* Middle pulse ring with delay */}
            <div
              className="absolute inset-0 brand-gradient rounded-full opacity-30 animate-ping"
              style={{ animationDelay: "0.5s" }}
            />

            {/* Main spinning container - PERFECTLY CENTERED */}
            <div className="absolute inset-0 brand-gradient rounded-full shadow-xl shadow-sky-500/30 dark:shadow-sky-500/20 flex items-center justify-center">
              {/* ✅ FIX: Use inline style to force animation */}
              <div style={{ animation: "spin 1s linear infinite" }}>
                <AiOutlineLoading3Quarters className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 brand-gradient-text tracking-wide">
            Loading your adventure...
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 tracking-wide">
            Preparing your personalized travel experience
          </p>
        </div>

        {/* Loading Progress Dots */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-sky-500 dark:bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2.5 h-2.5 bg-sky-600 dark:bg-sky-500 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
