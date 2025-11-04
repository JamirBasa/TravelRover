import { useState, useMemo, useEffect } from "react";
import {
  FaCalculator,
  FaMapMarkerAlt,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaInfoCircle,
  FaCheckCircle,
  FaEdit,
} from "react-icons/fa";
import {
  getBudgetRecommendations,
  getDestinationInfo,
} from "../../utils/budgetEstimator";

/**
 * ENHANCED: Professional Floating Budget Estimate Component
 * Real-time budget calculations with improved accuracy and presentation
 *
 * @param {Object} formData - Form data including location, duration, travelers
 * @param {Object} flightData - Flight preferences
 * @param {Object} hotelData - Hotel preferences
 * @param {string} selectedBudget - The budget option selected by user (e.g., "Budget-Friendly")
 * @param {string|number} customBudget - Custom budget amount if selected
 * @param {number} currentStep - Current step in the wizard (1-5)
 * @param {Function} onGoToStep - Navigation callback to go to specific step
 */
const FloatingBudgetEstimate = ({
  formData = {},
  flightData = {},
  hotelData = {},
  selectedBudget,
  customBudget,
  currentStep,
  onGoToStep, // ✅ NEW: Navigation callback
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState("budget-friendly"); // ✅ FIXED: Changed from "moderate" to "budget-friendly"

  // ✅ DEBUG: Log activeTab changes
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        `💰 FloatingBudgetEstimate activeTab changed to: ${activeTab}`
      );
    }
  }, [activeTab]);

  // ✅ Determine if budget is locked (user completed budget step)
  // Budget is now on Step 5 (after services), so lock when past Step 5
  const isBudgetLocked =
    currentStep > 5 && (!!selectedBudget || !!customBudget);

  // ✅ NEW: Sync activeTab with selectedBudget when user clicks budget options in BudgetSelector
  useEffect(() => {
    // Only sync when NOT locked and a preset budget is selected (not custom)
    if (!isBudgetLocked && selectedBudget && !customBudget) {
      // Map budget option titles to internal tab keys
      const budgetToTabMap = {
        "Budget-Friendly": "budget-friendly",
        Moderate: "moderate",
        Luxury: "luxury",
      };

      const newTab = budgetToTabMap[selectedBudget];

      if (newTab && newTab !== activeTab) {
        console.log(
          `🔄 FloatingBudget syncing activeTab: "${selectedBudget}" → "${newTab}"`
        );
        setActiveTab(newTab);
      }
    }

    // ✅ IMPROVED: When custom budget is entered, reset to budget-friendly for reference
    // This prevents stale activeTab values when navigating back to Step 2
    if (!isBudgetLocked && customBudget && !selectedBudget) {
      console.log(
        `💰 Custom budget entered: ₱${customBudget} (resetting activeTab to budget-friendly for reference)`
      );

      // Reset to budget-friendly as the reference point for comparison
      if (activeTab !== "budget-friendly") {
        setActiveTab("budget-friendly");
      }
    }
  }, [selectedBudget, customBudget, isBudgetLocked, activeTab]);

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

  // Calculate budget estimates with validation
  const budgetEstimates = useMemo(() => {
    if (!formData.location || !formData.duration) {
      return null;
    }

    const travelerCount =
      typeof formData.travelers === "number"
        ? formData.travelers
        : parseInt(formData.travelers, 10) || 1;

    try {
      const estimates = getBudgetRecommendations({
        destination: formData.location,
        departureLocation: flightData.departureCity || "Manila, Philippines",
        duration: formData.duration,
        travelers: travelerCount,
        includeFlights: flightData.includeFlights || false,
        startDate: formData.startDate,
      });

      console.log("💰 Budget Estimates Calculated:", estimates);

      // ✅ Validate that all expected keys exist
      if (import.meta.env.DEV) {
        const expectedKeys = [
          "budget-friendly",
          "budget",
          "budgetfriendly",
          "moderate",
          "luxury",
        ];
        const missingKeys = expectedKeys.filter((key) => !estimates[key]);
        if (missingKeys.length > 0) {
          console.warn("⚠️ Missing budget estimate keys:", missingKeys);
        }
      }

      return estimates;
    } catch (error) {
      console.error("❌ Budget calculation error:", error);
      return null;
    }
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

  // Format percentage for breakdown
  const getBreakdownPercentage = (amount, total) => {
    if (!total || total === 0) return "0%";
    return `${Math.round((amount / total) * 100)}%`;
  };

  // Get tier color hex values for progress bars
  const getTierColorHex = (tierColor) => {
    const colors = {
      emerald: "#10b981", // emerald-500
      sky: "#0ea5e9", // sky-500
      amber: "#f59e0b", // amber-500
    };
    return colors[tierColor] || colors.sky;
  };

  // ✅ Memoize mobile active tier display to ensure proper reactivity
  const mobileActiveTierDisplay = useMemo(() => {
    if (!budgetEstimates || !activeTab) return null;

    const data = budgetEstimates[activeTab];

    if (!data) {
      if (import.meta.env.DEV) {
        console.warn(`No budget data found for activeTab: ${activeTab}`);
      }
      return null;
    }

    const tierColor =
      activeTab === "budget-friendly"
        ? "emerald"
        : activeTab === "moderate"
        ? "sky"
        : "amber";

    return (
      <div
        className={
          tierColor === "emerald"
            ? "bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
            : tierColor === "sky"
            ? "bg-sky-50 dark:bg-sky-950/20 rounded-xl p-4 border border-sky-200 dark:border-sky-800"
            : "bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
        }
      >
        <div className="text-center mb-3">
          <div
            className={
              tierColor === "emerald"
                ? "text-2xl font-bold text-emerald-900 dark:text-emerald-300 mb-1"
                : tierColor === "sky"
                ? "text-2xl font-bold text-sky-900 dark:text-sky-300 mb-1"
                : "text-2xl font-bold text-amber-900 dark:text-amber-300 mb-1"
            }
          >
            {data.range}
          </div>
          <div
            className={
              tierColor === "emerald"
                ? "text-xs text-emerald-700 dark:text-emerald-400"
                : tierColor === "sky"
                ? "text-xs text-sky-700 dark:text-sky-400"
                : "text-xs text-amber-700 dark:text-amber-400"
            }
          >
            {data.perPerson} per person
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span>🏨</span>
            <span className="text-gray-700 dark:text-gray-300">
              ₱{Math.round(data.breakdown.accommodation / 1000)}k
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>🍽️</span>
            <span className="text-gray-700 dark:text-gray-300">
              ₱{Math.round(data.breakdown.food / 1000)}k
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span className="text-gray-700 dark:text-gray-300">
              ₱{Math.round(data.breakdown.activities / 1000)}k
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>🚌</span>
            <span className="text-gray-700 dark:text-gray-300">
              ₱{Math.round(data.breakdown.transport / 1000)}k
            </span>
          </div>
        </div>
      </div>
    );
  }, [budgetEstimates, activeTab]);

  // Don't show if no data yet
  if (!budgetEstimates || !destinationInfo) {
    return null;
  }

  // Get accuracy indicators (kept for future analytics, not displayed to users)
  // const getAccuracyLevel = () => {
  //   let score = 0;
  //   if (formData.startDate) score += 25; // Timing data available
  //   if (flightData.departureCity) score += 25; // Departure city specified
  //   if (hotelData.budgetLevel) score += 25; // Hotel preferences set
  //   if (formData.duration && formData.duration <= 7) score += 25; // Realistic duration

  //   if (score >= 75)
  //     return { level: "High", color: "emerald", icon: FaCheckCircle };
  //   if (score >= 50) return { level: "Good", color: "sky", icon: FaInfoCircle };
  //   return { level: "Estimate", color: "amber", icon: FaInfoCircle };
  // };

  // const accuracy = getAccuracyLevel();

  // Minimized bubble version (mobile/small screens)
  if (isMinimized) {
    // ✅ If budget is locked, show only selected budget
    let displayTier;
    let budgetLabel = "Trip Budget";

    if (isBudgetLocked) {
      if (customBudget) {
        // Custom budget selected
        displayTier = {
          range: `₱${parseInt(customBudget).toLocaleString()}`,
          perPerson: formData.travelers
            ? `₱${Math.round(
                parseInt(customBudget) / formData.travelers
              ).toLocaleString()}/person`
            : "",
        };
        budgetLabel = "Custom Budget";
      } else {
        // Preset budget selected - find matching tier
        const normalizedSelected = selectedBudget
          ?.toLowerCase()
          .replace(/[-\s]/g, "");
        displayTier =
          budgetEstimates?.[selectedBudget] ||
          budgetEstimates?.[normalizedSelected] ||
          budgetEstimates?.["budget-friendly"] ||
          Object.values(budgetEstimates)[0];
        budgetLabel = selectedBudget || "Selected Budget";
      }
    } else {
      // ✅ Budget not locked - show ACTIVE TAB selection (not hardcoded moderate)
      displayTier =
        budgetEstimates?.[activeTab] ||
        budgetEstimates?.["budget-friendly"] ||
        Object.values(budgetEstimates)[0];

      // ✅ Show which tier is currently selected
      const tierLabels = {
        "budget-friendly": "Budget",
        moderate: "Moderate",
        luxury: "Luxury",
      };
      budgetLabel = `${tierLabels[activeTab] || "Estimated"} Budget`;
    }

    return (
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 lg:hidden">
        <button
          onClick={() => setIsMinimized(false)}
          className={`brand-gradient p-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer group ${
            isBudgetLocked ? "ring-2 ring-green-400 dark:ring-green-600" : ""
          }`}
          title={
            isBudgetLocked
              ? "Budget locked - Click to view details"
              : "Show budget estimates"
          }
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaCalculator className="text-white text-xl" />
              {isBudgetLocked && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs text-white/80 font-medium">
                {budgetLabel}
              </div>
              <div className="text-sm text-white font-bold whitespace-nowrap">
                {displayTier?.range || "N/A"}
              </div>
              {displayTier?.perPerson && (
                <div className="text-xs text-white/70">
                  {displayTier.perPerson}
                </div>
              )}
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Fixed Right Sidebar - Professional Design */}
      <div className="hidden lg:block fixed top-24 right-4 xl:right-6 w-[20rem] xl:w-[22rem] z-30 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-transparent">
        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border overflow-hidden ${
            isBudgetLocked
              ? "border-green-300 dark:border-green-700 ring-2 ring-green-200 dark:ring-green-900"
              : "border-gray-200 dark:border-slate-700"
          }`}
        >
          {/* Header with Gradient */}
          <div className="brand-gradient p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm relative">
                  <FaCalculator className="text-white text-lg" />
                  {isBudgetLocked && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <FaCheckCircle className="text-white text-xs" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {isBudgetLocked ? "Your Budget" : "Budget Estimate"}
                  </h3>
                  {isBudgetLocked && (
                    <span className="text-xs text-green-200 font-medium">
                      🔒 Budget Set
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-2 hover:bg-white/10 rounded-lg"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>

            {/* Trip Summary - Compact */}
            <div className="space-y-2 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-white/70" />
                <span className="font-semibold">{formData.location}</span>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                  {destinationInfo.priceLevel}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/70 ml-5">
                <span>
                  📅 {formData.duration}{" "}
                  {formData.duration === 1 ? "day" : "days"}
                </span>
                {formData.travelers && (
                  <span>
                    👥{" "}
                    {typeof formData.travelers === "number"
                      ? formData.travelers
                      : formData.travelers}
                  </span>
                )}
              </div>
              {(flightData.includeFlights || hotelData.includeHotels) && (
                <div className="flex items-center gap-3 text-xs text-white/70 ml-5">
                  {flightData.includeFlights && <span>✈️ Flights</span>}
                  {hotelData.includeHotels && <span>🏨 Hotels</span>}
                </div>
              )}
            </div>
          </div>

          {/* Budget Tier Tabs or Locked Message */}
          {isBudgetLocked ? (
            <div className="bg-green-50 dark:bg-green-950/30 px-4 py-3 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 justify-center mb-2">
                <FaCheckCircle className="text-green-600 dark:text-green-400 text-sm" />
                <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                  {customBudget
                    ? "Custom Budget Selected"
                    : `${selectedBudget} Budget Selected`}
                </span>
              </div>
              {onGoToStep && (
                <button
                  onClick={() => onGoToStep(5)}
                  className="w-full mt-2 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-300 bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaEdit className="text-xs" />
                  Change Budget (Go to Step 5)
                </button>
              )}
              {!onGoToStep && (
                <p className="text-xs text-green-700 dark:text-green-400 text-center mt-1">
                  Return to Step 5 to change your budget
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-slate-800 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <div className="flex gap-2">
                {/* ✅ FIXED: Map to correct internal keys */}
                {[
                  { key: "budget-friendly", label: "Budget" },
                  { key: "moderate", label: "Moderate" },
                  { key: "luxury", label: "Luxury" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === key
                        ? key === "budget-friendly"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700"
                          : key === "moderate"
                          ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-700"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                        : "bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Tier Details */}
          {isExpanded && (
            <div className="p-5">
              {isBudgetLocked && customBudget ? (
                // Show custom budget details
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                    <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                      Your Custom Budget
                    </div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-300 mb-2">
                      ₱{parseInt(customBudget).toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-400">
                      {formData.travelers && (
                        <span>
                          ₱
                          {Math.round(
                            parseInt(customBudget) / formData.travelers
                          ).toLocaleString()}{" "}
                          per person
                        </span>
                      )}
                      <span>
                        ₱
                        {Math.round(
                          parseInt(customBudget) / formData.duration
                        ).toLocaleString()}{" "}
                        per day
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    You've set a custom budget for this trip. The AI will
                    optimize your itinerary within this budget range.
                  </p>
                </div>
              ) : (
                // ✅ FIXED: Direct access instead of mapping with filters
                (() => {
                  // Get the data for the active tab
                  const data = budgetEstimates[activeTab];

                  if (!data) {
                    if (import.meta.env.DEV) {
                      console.warn(
                        `❌ [Desktop] No budget data found for activeTab: ${activeTab}`
                      );
                    }
                    return null;
                  }

                  if (import.meta.env.DEV) {
                    console.log(
                      `✅ [Desktop] Rendering tier: ${activeTab}`,
                      data
                    );
                  }

                  const level = activeTab; // Use activeTab as level for consistency
                  const tierColor =
                    level === "budget-friendly"
                      ? "emerald"
                      : level === "moderate"
                      ? "sky"
                      : "amber";

                  return (
                    <div key={level} className="space-y-4">
                      {/* Total Cost Card */}
                      <div
                        className={
                          tierColor === "emerald"
                            ? "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-emerald-200 dark:border-emerald-800"
                            : tierColor === "sky"
                            ? "bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/20 dark:to-sky-900/20 rounded-xl p-4 border-2 border-sky-200 dark:border-sky-800"
                            : "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 rounded-xl p-4 border-2 border-amber-200 dark:border-amber-800"
                        }
                      >
                        <div
                          className={
                            tierColor === "emerald"
                              ? "text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-1"
                              : tierColor === "sky"
                              ? "text-sm text-sky-700 dark:text-sky-400 font-medium mb-1"
                              : "text-sm text-amber-700 dark:text-amber-400 font-medium mb-1"
                          }
                        >
                          Estimated Total Cost
                        </div>
                        <div
                          className={
                            tierColor === "emerald"
                              ? "text-3xl font-bold text-emerald-900 dark:text-emerald-300 mb-2"
                              : tierColor === "sky"
                              ? "text-3xl font-bold text-sky-900 dark:text-sky-300 mb-2"
                              : "text-3xl font-bold text-amber-900 dark:text-amber-300 mb-2"
                          }
                        >
                          {data.range}
                        </div>
                        <div
                          className={
                            tierColor === "emerald"
                              ? "flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400"
                              : tierColor === "sky"
                              ? "flex items-center justify-between text-xs text-sky-700 dark:text-sky-400"
                              : "flex items-center justify-between text-xs text-amber-700 dark:text-amber-400"
                          }
                        >
                          <span>{data.perPerson} per person</span>
                          <span>
                            ₱
                            {Math.round(
                              data.total / formData.duration
                            ).toLocaleString()}{" "}
                            per day
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {data.description}
                      </p>

                      {/* Detailed Breakdown with Progress Bars */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Cost Breakdown
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Per trip
                          </span>
                        </div>

                        {/* Accommodation */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🏨</span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Accommodation
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              ₱{data.breakdown.accommodation.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: getBreakdownPercentage(
                                    data.breakdown.accommodation,
                                    data.total
                                  ),
                                  backgroundColor: getTierColorHex(tierColor),
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                              {getBreakdownPercentage(
                                data.breakdown.accommodation,
                                data.total
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Food & Dining */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🍽️</span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Food & Dining
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              ₱{data.breakdown.food.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: getBreakdownPercentage(
                                    data.breakdown.food,
                                    data.total
                                  ),
                                  backgroundColor: getTierColorHex(tierColor),
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                              {getBreakdownPercentage(
                                data.breakdown.food,
                                data.total
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Activities */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎯</span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Activities & Tours
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              ₱{data.breakdown.activities.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: getBreakdownPercentage(
                                    data.breakdown.activities,
                                    data.total
                                  ),
                                  backgroundColor: getTierColorHex(tierColor),
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                              {getBreakdownPercentage(
                                data.breakdown.activities,
                                data.total
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Transport */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🚌</span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Local Transport
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              ₱{data.breakdown.transport.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: getBreakdownPercentage(
                                    data.breakdown.transport,
                                    data.total
                                  ),
                                  backgroundColor: getTierColorHex(tierColor),
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                              {getBreakdownPercentage(
                                data.breakdown.transport,
                                data.total
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Flights (if included) */}
                        {data.breakdown.flights > 0 && (
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">✈️</span>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Flight Tickets
                                </span>
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                ₱{data.breakdown.flights.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: getBreakdownPercentage(
                                      data.breakdown.flights,
                                      data.total
                                    ),
                                    backgroundColor: getTierColorHex(tierColor),
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                                {getBreakdownPercentage(
                                  data.breakdown.flights,
                                  data.total
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Miscellaneous */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📦</span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Miscellaneous
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              ₱{data.breakdown.miscellaneous.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: getBreakdownPercentage(
                                    data.breakdown.miscellaneous,
                                    data.total
                                  ),
                                  backgroundColor: getTierColorHex(tierColor),
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                              {getBreakdownPercentage(
                                data.breakdown.miscellaneous,
                                data.total
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() // ✅ Close IIFE for direct data access
              )}
            </div>
          )}

          {/* Footer Info */}
          <div className="bg-gray-50 dark:bg-slate-800 px-5 py-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-sky-500 text-sm mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  💡 How we calculate
                </p>
                <ul className="space-y-1">
                  <li>• Based on 2025 Philippine market rates</li>
                  <li>• Regional price adjustments applied</li>
                  {flightData.includeFlights && formData.startDate && (
                    <li>• Flight timing premiums included</li>
                  )}
                  <li>• Updated as you fill the form</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Enhanced Bottom Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t-2 border-gray-200 dark:border-slate-700 shadow-2xl">
        <div className="p-4 max-w-screen-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="brand-gradient p-2.5 rounded-xl">
                <FaCalculator className="text-white text-base" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  {isBudgetLocked ? "Your Budget" : "Budget Estimate"}
                </h3>
                {isBudgetLocked && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                    🔒 Budget Set
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Minimize budget estimate"
            >
              <FaTimes />
            </button>
          </div>

          {/* Mobile Tier Selector */}
          {isBudgetLocked ? (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 justify-center">
                  <FaCheckCircle className="text-green-600 dark:text-green-400 text-sm" />
                  <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                    {customBudget
                      ? "Custom Budget Set"
                      : `${selectedBudget} Budget Set`}
                  </span>
                </div>
              </div>
              {onGoToStep && (
                <button
                  onClick={() => onGoToStep(5)}
                  className="w-full px-4 py-2.5 text-sm font-medium text-green-700 dark:text-green-300 bg-white dark:bg-slate-800 border-2 border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaEdit />
                  Change Budget
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2 mb-4">
              {/* ✅ FIXED: Use correct keys */}
              {[
                { key: "budget-friendly", label: "Budget" },
                { key: "moderate", label: "Moderate" },
                { key: "luxury", label: "Luxury" },
              ].map(({ key, label }) => {
                const tierColor =
                  key === "budget-friendly"
                    ? "emerald"
                    : key === "moderate"
                    ? "sky"
                    : "amber";
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === key
                        ? tierColor === "emerald"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700"
                          : tierColor === "sky"
                          ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-700"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mobile Selected Tier */}
          {isBudgetLocked && customBudget ? (
            // Show custom budget
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-green-900 dark:text-green-300 mb-1">
                  ₱{parseInt(customBudget).toLocaleString()}
                </div>
                {formData.travelers && (
                  <div className="text-xs text-green-700 dark:text-green-400">
                    ₱
                    {Math.round(
                      parseInt(customBudget) / formData.travelers
                    ).toLocaleString()}{" "}
                    per person
                  </div>
                )}
              </div>
              <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                Custom budget selected
              </p>
            </div>
          ) : (
            // ✅ FIXED: Use memoized component for proper reactivity
            mobileActiveTierDisplay
          )}
        </div>
      </div>
    </>
  );
};

export default FloatingBudgetEstimate;
