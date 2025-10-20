// src/view-trip/components/optimization/RouteOptimizationStatus.jsx
import React from "react";
import {
  FaRoute,
  FaClock,
  FaStar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";

export const RouteOptimizationStatus = ({
  routeOptimization,
  className = "",
}) => {
  if (!routeOptimization) {
    return null;
  }

  const {
    applied,
    efficiency_score,
    total_travel_time_minutes,
    optimization_summary,
    recommendations,
    error,
  } = routeOptimization;

  // Don't show component if optimization wasn't applied and there's no useful data
  if (!applied && !error && !recommendations?.length) {
    return null;
  }

  // Format travel time
  const formatTravelTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get efficiency color and icon
  const getEfficiencyDisplay = (score) => {
    if (score >= 80) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        icon: FaCheckCircle,
        label: "Excellent",
      };
    } else if (score >= 60) {
      return {
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
        icon: FaInfoCircle,
        label: "Good",
      };
    } else if (score >= 40) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
        icon: FaExclamationTriangle,
        label: "Fair",
      };
    } else {
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-50 border-orange-200",
        icon: FaExclamationTriangle,
        label: "Needs Improvement",
      };
    }
  };

  const efficiencyDisplay = getEfficiencyDisplay(efficiency_score || 0);
  const EfficiencyIcon = efficiencyDisplay.icon;

  return (
    <div className={`brand-card border-l-4 border-l-sky-500 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="brand-gradient p-2 rounded-full flex-shrink-0">
          <FaRoute className="w-4 h-4 text-white" />
        </div>

        <div className="flex-grow min-w-0">
          <h3 className="text-lg font-semibold brand-gradient-text mb-2">
            Route Optimization
          </h3>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-red-700">
                <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Optimization Failed</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          ) : (
            <>
              {/* Optimization Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Efficiency Score */}
                <div
                  className={`p-3 rounded-lg border ${efficiencyDisplay.bgColor}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <EfficiencyIcon
                      className={`w-4 h-4 ${efficiencyDisplay.color}`}
                    />
                    <span className="text-sm font-medium text-gray-600">
                      Efficiency
                    </span>
                  </div>
                  <div
                    className={`text-lg font-bold ${efficiencyDisplay.color}`}
                  >
                    {efficiency_score || 0}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {efficiencyDisplay.label}
                  </div>
                </div>

                {/* Travel Time */}
                {total_travel_time_minutes > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <FaClock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Travel Time
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {formatTravelTime(total_travel_time_minutes)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Total per day avg
                    </div>
                  </div>
                )}

                {/* Days Optimized */}
                {optimization_summary?.total_days_optimized > 0 && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <FaStar className="w-4 h-4 text-sky-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Days Optimized
                      </span>
                    </div>
                    <div className="text-lg font-bold text-sky-700">
                      {optimization_summary.total_days_optimized}
                    </div>
                    <div className="text-xs text-gray-500">Itinerary days</div>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {recommendations && recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Optimization Insights
                  </h4>
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-sm ${
                        rec.priority === "high"
                          ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-400"
                          : rec.priority === "medium"
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400"
                          : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-medium capitalize">
                          {rec.type.replace("_", " ")}:
                        </span>
                        <span>{rec.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Applied Status */}
              {applied && (
                <div className="mt-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4" />
                  <span>
                    Route optimization has been applied to your itinerary
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
