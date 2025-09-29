// src/components/common/LoadingStates.jsx
// Reusable loading and error state components to reduce duplication

import { Button } from "../ui/button";
import { FaSpinner, FaExclamationTriangle, FaCheck } from "react-icons/fa";
import { MESSAGES } from "../../constants/options";

// Generic Loading Component
export const LoadingSpinner = ({
  message = MESSAGES.LOADING.LOADING_TRIPS,
  size = "default",
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-16 h-16",
    large: "w-24 h-24",
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className={`border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${sizeClasses[size]}`}
        ></div>
        <p className="text-gray-600 mb-2">{message}</p>
        <p className="text-sm text-gray-500">Please wait a moment</p>
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
