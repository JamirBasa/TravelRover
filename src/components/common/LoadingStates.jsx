// src/components/common/LoadingStates.jsx
// ========================================
// UNIFIED LOADING & ERROR STATE SYSTEM
// ========================================
// Provides consistent, brand-aligned loading experiences across the entire app
//
// USAGE EXAMPLES:
//
// 1. Full-screen loading with custom message:
//    <LoadingSpinner message="Loading your trips..." subtitle="Fetching adventures..." />
//
// 2. Minimal inline loading (for cards, modals):
//    <LoadingSpinner message="Loading..." minimal={true} />
//
// 3. Half-screen loading (for sections):
//    <LoadingSpinner message="Loading data..." fullScreen={false} />
//
// 4. Use pre-configured loading states:
//    <ProfileLoading />
//    <TripLoading />
//    <FlightLoading />
//
// 5. Standard messages from constants:
//    import { MESSAGES } from "../../constants/options";
//    <LoadingSpinner message={MESSAGES.LOADING.LOADING_TRIPS} />
//
// DESIGN SYSTEM:
// - Brand gradient (sky-500 to blue-600) with pulse animation
// - Spinning icon with AiOutlineLoading3Quarters
// - Animated bouncing dots for progress indication
// - Full dark mode support
// - Consistent spacing and typography (tracking-wide)
// ========================================

import { Button } from "../ui/button";
import { FaExclamationTriangle, FaCheck } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { MESSAGES } from "../../constants/options";

/**
 * Unified Loading Component
 * Consistent brand-aligned loading experience across all pages
 * @param {string} message - Main loading message
 * @param {string} subtitle - Optional subtitle text
 * @param {boolean} minimal - Use minimal inline version
 * @param {boolean} fullScreen - Use full screen height (default: true)
 * @param {boolean} showDots - Show animated progress dots (default: true)
 */
export const LoadingSpinner = ({
  message = MESSAGES.LOADING.LOADING_TRIPS,
  subtitle = "Please wait a moment",
  minimal = false,
  fullScreen = true,
  showDots = true,
}) => {
  // Minimal loading for inline use (e.g., inside cards, modals)
  if (minimal) {
    return (
      <div className="flex items-center justify-center gap-3 p-4">
        <div className="w-5 h-5 border-2 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-400 tracking-wide">
          {message}
        </span>
      </div>
    );
  }

  // Full loading state with brand gradient
  return (
    <div
      className={`bg-gradient-to-br from-gray-50 via-blue-50/30 to-sky-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center ${
        fullScreen ? "min-h-screen" : "min-h-[400px]"
      }`}
    >
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
              <AiOutlineLoading3Quarters
                className="h-8 w-8 text-white"
                style={{
                  animation: "spin 1s linear infinite",
                  transformOrigin: "center center",
                  willChange: "transform",
                }}
              />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 brand-gradient-text tracking-wide">
            {message}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 tracking-wide">
              {subtitle}
            </p>
          )}
        </div>

        {/* Loading Progress Dots */}
        {showDots && (
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-sky-500 dark:bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 bg-sky-600 dark:bg-sky-500 rounded-full animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
};

// Profile Loading State
export const ProfileLoading = () => (
  <LoadingSpinner message={MESSAGES.LOADING.CHECKING_PROFILE} />
);

// Trip Loading State
export const TripLoading = () => (
  <LoadingSpinner message={MESSAGES.LOADING.GENERATING_TRIP} />
);

// Flight Loading State
export const FlightLoading = () => (
  <LoadingSpinner message={MESSAGES.LOADING.SEARCHING_FLIGHTS} />
);

// Generic Error State
export const ErrorState = ({
  error = MESSAGES.ERROR.GENERIC_ERROR,
  onRetry = null,
  onCreateNew = null,
}) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
      <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <div className="space-y-2">
        {onRetry && (
          <Button onClick={onRetry} className="w-full">
            Try Again
          </Button>
        )}
        {onCreateNew && (
          <Button variant="outline" onClick={onCreateNew} className="w-full">
            Create New Trip
          </Button>
        )}
      </div>
    </div>
  </div>
);

// Success State
export const SuccessState = ({
  message = MESSAGES.SUCCESS.DATA_LOADED,
  title = "Success!",
  onContinue = null,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
    <div className="text-center bg-white p-8 rounded-lg shadow-lg">
      <FaCheck className="text-green-500 text-6xl mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{message}</p>
      {onContinue && (
        <Button
          onClick={onContinue}
          className="bg-green-600 hover:bg-green-700"
        >
          Continue
        </Button>
      )}
    </div>
  </div>
);

// Empty State
export const EmptyState = ({
  title = "No items found",
  description = "Get started by creating your first item",
  actionLabel = "Create New",
  onAction = null,
  icon = "✈️",
}) => (
  <div className="text-center py-12">
    <div className="max-w-md mx-auto">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h2>
      <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
      {onAction && (
        <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700">
          {actionLabel}
        </Button>
      )}
    </div>
  </div>
);

// Profile Complete Check
export const ProfileCompleteCheck = ({
  userProfile,
  onRedirectToProfile,
  children,
}) => {
  if (!userProfile?.isProfileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <FaExclamationTriangle className="text-yellow-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Profile Incomplete
          </h2>
          <p className="text-gray-600 mb-4">
            Please complete your profile to create personalized trips.
          </p>
          <Button onClick={onRedirectToProfile} className="w-full">
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  return children;
};
