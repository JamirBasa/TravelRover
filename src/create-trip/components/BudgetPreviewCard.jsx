import { useMemo } from "react";
import { FaInfoCircle, FaArrowRight } from "react-icons/fa";
import { getBudgetRecommendations } from "../../utils/budgetEstimator";

/**
 * Simple Budget Preview Card - Shows basic budget estimates on Steps 2-4
 * Lightweight alternative to FloatingBudgetEstimate
 * Appears as an inline card, not floating/overlay
 *
 * @param {Object} formData - Form data including location, duration, travelers
 * @param {Object} flightData - Flight preferences
 */
const BudgetPreviewCard = ({ formData = {}, flightData = {} }) => {
  // Calculate budget estimates
  const budgetEstimates = useMemo(() => {
    if (!formData.location || !formData.duration) {
      return null;
    }

    const travelerCount =
      typeof formData.travelers === "number"
        ? formData.travelers
        : parseInt(formData.travelers, 10) || 1;

    try {
      return getBudgetRecommendations({
        destination: formData.location,
        departureLocation: flightData.departureCity || "Manila, Philippines",
        duration: formData.duration,
        travelers: travelerCount,
        includeFlights: flightData.includeFlights || false,
        startDate: formData.startDate,
      });
    } catch (error) {
      console.error("Budget calculation error:", error);
      return null;
    }
  }, [
    formData.location,
    formData.duration,
    formData.travelers,
    formData.startDate,
    flightData,
  ]);

  // Don't show if no data yet
  if (!budgetEstimates) {
    return null;
  }

  // Get budget friendly estimate (lowest tier)
  const budgetFriendly =
    budgetEstimates["budget-friendly"] ||
    budgetEstimates["budget"] ||
    budgetEstimates["budgetfriendly"];

  // Get luxury estimate (highest tier)
  const luxury = budgetEstimates["luxury"];

  if (!budgetFriendly || !luxury) {
    return null;
  }

  return (
    <div className="mt-6 p-5 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-2 border-sky-200 dark:border-sky-800 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded-lg">
          <FaInfoCircle className="text-sky-600 dark:text-sky-400 text-lg" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-sky-900 dark:text-sky-300 mb-2">
            💡 Budget Preview
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
            Based on your trip details, estimated costs range from:
          </p>

          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Budget-Friendly
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {budgetFriendly.range}
              </div>
            </div>

            <FaArrowRight className="text-gray-400" />

            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Luxury
              </div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {luxury.range}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-sky-200 dark:border-sky-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Next Step:</span> You'll choose
              your budget preference after selecting flights & hotels for
              accurate estimates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPreviewCard;
