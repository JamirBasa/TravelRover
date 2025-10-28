import { useState, useMemo, useEffect } from "react";
import {
  FaCalculator,
  FaMapMarkerAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  getBudgetRecommendations,
  getDestinationInfo,
} from "../../utils/budgetEstimator";

/**
 * Floating Budget Estimate Component
 * Sticky sidebar that shows real-time budget calculations as user fills the form
 *
 * @param {Object} formData - Current form state { location, duration, travelers, startDate }
 * @param {Object} flightData - Flight preferences { includeFlights, departureCity }
 * @param {Object} hotelData - Hotel preferences { includeHotels, budgetLevel, preferredType }
 */
const FloatingBudgetEstimate = ({
  formData = {},
  flightData = {},
  hotelData = {},
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-minimize on mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMinimized(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate budget estimates
  const budgetEstimates = useMemo(() => {
    if (!formData.location || !formData.duration) {
      return null;
    }

    const travelerCount =
      typeof formData.travelers === "number"
        ? formData.travelers
        : parseInt(formData.travelers, 10) || 1;

    return getBudgetRecommendations({
      destination: formData.location,
      departureLocation: flightData.departureCity || "Manila, Philippines",
      duration: formData.duration,
      travelers: travelerCount,
      includeFlights: flightData.includeFlights || false,
      startDate: formData.startDate,
    });
  }, [
    formData.location,
    formData.duration,
    formData.travelers,
    formData.startDate,
    flightData,
  ]);

  // Get destination info
  const destinationInfo = useMemo(() => {
    if (!formData.location) return null;
    return getDestinationInfo(formData.location);
  }, [formData.location]);

  // Don't show if no data yet (Steps 1-2 before destination is selected)
  if (!budgetEstimates || !destinationInfo) {
    return null;
  }

  // Minimized bubble version (mobile/small screens)
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 lg:hidden">
        <button
          onClick={() => setIsMinimized(false)}
          className="brand-gradient p-3 sm:p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer group"
          title="Show budget estimates"
        >
          <div className="flex items-center gap-2">
            <FaCalculator className="text-white text-lg sm:text-xl" />
            <div className="text-left">
              <div className="text-xs text-white/80 font-medium">Budget</div>
              <div className="text-xs sm:text-sm text-white font-bold whitespace-nowrap">
                {budgetEstimates.budget.range}
              </div>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Fixed Right Sidebar - Positioned to avoid overlap */}
      <div className="hidden lg:block fixed top-24 right-4 xl:right-6 w-[18rem] xl:w-[20rem] z-30 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-transparent">
        <div className="brand-card shadow-2xl border-sky-200 dark:border-sky-800 bg-gradient-to-br from-white/95 to-sky-50/95 dark:from-slate-900/95 dark:to-sky-950/95 backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 border-b border-sky-200 dark:border-sky-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="brand-gradient p-2 rounded-lg">
                  <FaCalculator className="text-white text-sm" />
                </div>
                <h3 className="font-bold text-sky-900 dark:text-sky-300 text-base">
                  💡 Budget Estimate
                </h3>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition-colors cursor-pointer"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>

            {/* Trip Summary */}
            <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-sky-600 dark:text-sky-400 text-sm" />
                <span className="font-semibold">{formData.location}</span>
                <span className="px-2 py-0.5 bg-sky-200 dark:bg-sky-800 rounded-full text-xs font-medium text-sky-800 dark:text-sky-300">
                  {destinationInfo.priceLevel}
                </span>
              </div>
              <div className="flex items-center gap-3 ml-5 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  📅 {formData.duration}{" "}
                  {formData.duration === 1 ? "day" : "days"}
                </span>
                {formData.travelers && (
                  <>
                    <span>•</span>
                    <span>
                      👥{" "}
                      {typeof formData.travelers === "number"
                        ? `${formData.travelers} ${
                            formData.travelers === 1 ? "person" : "people"
                          }`
                        : formData.travelers}
                    </span>
                  </>
                )}
              </div>
              {flightData.includeFlights && flightData.departureCity && (
                <div className="flex items-center gap-2 ml-5 text-xs text-gray-600 dark:text-gray-400">
                  <span>✈️ from {flightData.departureCity}</span>
                </div>
              )}
              {hotelData.includeHotels && (
                <div className="flex items-center gap-2 ml-5 text-xs text-gray-600 dark:text-gray-400">
                  <span>
                    🏨{" "}
                    {hotelData.preferredType
                      ? hotelData.preferredType.charAt(0).toUpperCase() +
                        hotelData.preferredType.slice(1)
                      : "Hotels"}
                    {hotelData.budgetLevel && (
                      <span className="ml-1">
                        (Level {hotelData.budgetLevel})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Price Cards */}
          <div className="p-4 space-y-2">
            {/* Budget Tier */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-emerald-200 dark:border-emerald-700 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Budget
                </span>
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  {budgetEstimates.budget.range}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {budgetEstimates.budget.perPerson}/person
              </div>
            </div>

            {/* Moderate Tier */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-sky-200 dark:border-sky-700 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                  Moderate
                </span>
                <span className="text-sm font-bold text-sky-900 dark:text-sky-300">
                  {budgetEstimates.moderate.range}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {budgetEstimates.moderate.perPerson}/person
              </div>
            </div>

            {/* Luxury Tier */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-amber-200 dark:border-amber-700 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Luxury
                </span>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                  {budgetEstimates.luxury.range}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {budgetEstimates.luxury.perPerson}/person
              </div>
            </div>
          </div>

          {/* Detailed Breakdown - Expandable */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-sky-200 dark:border-sky-700 pt-4">
              <div className="text-xs font-semibold text-sky-800 dark:text-sky-300 mb-2">
                💰 Cost Breakdown
              </div>
              {Object.entries(budgetEstimates).map(([level, data]) => (
                <details
                  key={level}
                  className="bg-white/70 dark:bg-slate-800/70 rounded-lg border border-sky-200 dark:border-sky-700 overflow-hidden"
                >
                  <summary className="p-3 cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-900 dark:text-sky-300 capitalize">
                        {level}
                      </span>
                      <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                        {data.range}
                      </span>
                    </div>
                  </summary>
                  <div className="px-3 pb-3 text-xs text-gray-700 dark:text-gray-300 space-y-1.5">
                    <p className="flex justify-between py-1">
                      <span>🏨 Accommodation:</span>
                      <span className="font-semibold">
                        ₱{data.breakdown.accommodation.toLocaleString()}
                      </span>
                    </p>
                    <p className="flex justify-between py-1">
                      <span>🍽️ Food & Dining:</span>
                      <span className="font-semibold">
                        ₱{data.breakdown.food.toLocaleString()}
                      </span>
                    </p>
                    <p className="flex justify-between py-1">
                      <span>🎯 Activities:</span>
                      <span className="font-semibold">
                        ₱{data.breakdown.activities.toLocaleString()}
                      </span>
                    </p>
                    <p className="flex justify-between py-1">
                      <span>🚌 Local Transport:</span>
                      <span className="font-semibold">
                        ₱{data.breakdown.transport.toLocaleString()}
                      </span>
                    </p>
                    {data.breakdown.flights > 0 && (
                      <p className="flex justify-between py-1 border-t border-sky-100 dark:border-sky-800 pt-1.5">
                        <span>✈️ Flights:</span>
                        <span className="font-semibold">
                          ₱{data.breakdown.flights.toLocaleString()}
                        </span>
                      </p>
                    )}
                    <p className="flex justify-between py-1">
                      <span>📦 Miscellaneous:</span>
                      <span className="font-semibold">
                        ₱{data.breakdown.miscellaneous.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-xs text-sky-600 dark:text-sky-400 italic mt-2 pt-2 border-t border-sky-100 dark:border-sky-800">
                      {data.description}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* Info Footer */}
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 p-2.5 bg-sky-100/50 dark:bg-sky-950/30 rounded-lg">
              <span className="text-sky-600 dark:text-sky-400 text-sm">ℹ️</span>
              <div className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                <p className="mb-1">
                  Updates automatically as you fill the form. Prices based on
                  2025 market rates.
                </p>
                {hotelData.includeHotels && (
                  <p className="text-xs text-sky-600 dark:text-sky-400 italic">
                    🏨 Hotel costs included in accommodation estimates
                  </p>
                )}
                {flightData.includeFlights && (
                  <p className="text-xs text-sky-600 dark:text-sky-400 italic">
                    ✈️ Flight costs included in estimates
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Bottom Sheet - Collapsible, doesn't block form */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t-2 border-sky-200 dark:border-sky-800 shadow-2xl transform transition-transform duration-300">
        <div className="p-4 max-w-screen-sm mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="brand-gradient p-2 rounded-lg">
                <FaCalculator className="text-white text-sm" />
              </div>
              <div>
                <h3 className="font-bold text-sky-900 dark:text-sky-300 text-sm">
                  Budget Estimate
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formData.location} • {formData.duration} days
                  {hotelData.includeHotels && " • 🏨 Hotels"}
                  {flightData.includeFlights && " • ✈️ Flights"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Minimize budget estimate"
            >
              ✕
            </button>
          </div>

          {/* Mobile Quick Summary - Compact Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2 text-center border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">
                Budget
              </div>
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                {budgetEstimates.budget.range}
              </div>
            </div>
            <div className="bg-sky-50 dark:bg-sky-950/30 rounded-lg p-2 text-center border border-sky-200 dark:border-sky-800">
              <div className="text-xs text-sky-700 dark:text-sky-400 font-medium mb-1">
                Moderate
              </div>
              <div className="text-sm font-bold text-sky-900 dark:text-sky-300">
                {budgetEstimates.moderate.range}
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2 text-center border border-amber-200 dark:border-amber-800">
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
                Luxury
              </div>
              <div className="text-sm font-bold text-amber-900 dark:text-amber-300">
                {budgetEstimates.luxury.range}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingBudgetEstimate;
