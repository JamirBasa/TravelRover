import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { SelectBudgetOptions } from "../../constants/options";
import { getBudgetRecommendations } from "../../utils/budgetEstimator";
import { getRecommendedBudgetTier } from "../../utils/budgetRecommendation";
import { Badge } from "@/components/ui/badge";

const BudgetSelector = ({
  value,
  customValue,
  onBudgetChange,
  onCustomBudgetChange,
  error,
  // New props for smart estimation
  formData = {},
  flightData = {},
  hotelData = {}, // ✅ NEW: Track hotel preferences for budget calculation
  userProfile = {}, // Add userProfile prop
  activityPreference = 2, // ✅ NEW: Activity pace affects budget
}) => {
  const [showCustom, setShowCustom] = useState(!!customValue); // Show custom if there's already a custom value

  // ✅ Track initial custom value to detect if user is editing existing budget
  const initialCustomValueRef = useRef(customValue);

  // Update ref when customValue first becomes populated (on mount or navigation)
  useEffect(() => {
    if (customValue && !initialCustomValueRef.current) {
      initialCustomValueRef.current = customValue;
    }
  }, [customValue]);

  // Detect budget override
  const profileBudget = userProfile?.budgetRange;
  const tripBudget = customValue ? "Custom" : value;
  const isBudgetOverridden =
    profileBudget &&
    tripBudget &&
    profileBudget !== "Not specified" &&
    !tripBudget.toLowerCase().includes(profileBudget.toLowerCase()) &&
    profileBudget.toLowerCase() !== tripBudget.toLowerCase();

  // Keep showCustom state in sync with customValue
  useEffect(() => {
    if (customValue && !showCustom) {
      setShowCustom(true);
    }
  }, [customValue, showCustom]);

  // ✅ ENHANCED: Calculate smart budget recommendations with service tracking
  const budgetEstimates = useMemo(() => {
    if (!formData.location || !formData.duration) {
      return null;
    }

    // Parse travelers count (handle both integer and legacy string formats)
    const travelerCount =
      typeof formData.travelers === "number"
        ? formData.travelers
        : parseInt(formData.travelers, 10) || 1;

    return getBudgetRecommendations({
      destination: formData.location,
      departureLocation: flightData.departureCity || "Manila, Philippines",
      duration: formData.duration,
      travelers: travelerCount,
      includeFlights: flightData.includeFlights || false, // ✅ Reactive to flight changes
      startDate: formData.startDate, // Pass startDate for timing-based pricing
    });
  }, [
    formData.location,
    formData.duration,
    formData.travelers,
    formData.startDate,
    flightData.departureCity,
    flightData.includeFlights, // ✅ NEW: Trigger recalculation when flights toggled
  ]);

  // Calculate minimum required budget based on estimates
  const minimumBudget = useMemo(() => {
    if (!budgetEstimates) {
      return 1000; // Default minimum when no estimates available
    }

    try {
      // ✅ Try multiple possible keys for budget-friendly tier
      const budgetTier =
        budgetEstimates["budget-friendly"] ||
        budgetEstimates["budget"] ||
        budgetEstimates["budgetfriendly"];

      if (!budgetTier?.range) {
        console.warn("No budget tier found in estimates");
        return 1000;
      }

      // Use budget tier estimate as minimum (the cheapest option)
      const budgetTierTotal = budgetTier.range
        .replace("₱", "")
        .replace(/,/g, "");

      const parsed = parseInt(budgetTierTotal);

      if (isNaN(parsed)) {
        console.warn("Failed to parse budget estimate:", budgetTierTotal);
        return 1000;
      }

      // ✅ UPDATED: Use 90% of budget-friendly tier as the ABSOLUTE minimum (was 85%)
      // This is more realistic for successful trip generation
      // 90% allows some flexibility below the "recommended" tier without being too aggressive
      const calculatedMinimum = Math.floor(parsed * 0.9);

      // ✅ Enforce absolute floor based on trip duration
      // Prevents unrealistically low budgets for longer trips
      const duration = formData.duration || 3;
      const absoluteFloor = duration * 1200; // ₱1,200/day minimum (bare bones)

      // Use the higher of: calculated minimum OR absolute floor
      const finalMinimum = Math.max(calculatedMinimum, absoluteFloor);

      console.log("💰 Minimum Budget Calculation:", {
        budgetFriendlyTier: parsed,
        calculated90Percent: calculatedMinimum,
        absoluteFloor,
        finalMinimum,
        duration,
        includesFlights: flightData.includeFlights,
        includesHotels: hotelData.includeHotels, // ✅ NEW: Log hotel service
      });

      return finalMinimum;
    } catch (error) {
      console.error("Error calculating minimum budget:", error);
      return 1000;
    }
  }, [
    budgetEstimates,
    formData.duration,
    flightData.includeFlights, // ✅ NEW: Recalculate when flights change
    hotelData.includeHotels, // ✅ NEW: Recalculate when hotels change
  ]);

  // ✅ NEW: Get smart budget tier recommendation
  const recommendation = useMemo(() => {
    if (!formData.location || !formData.duration) return null;

    const travelerCount =
      typeof formData.travelers === "number"
        ? formData.travelers
        : parseInt(formData.travelers, 10) || 1;

    return getRecommendedBudgetTier({
      duration: formData.duration,
      travelers: travelerCount,
      includeFlights: flightData.includeFlights || false,
      includeHotels: hotelData.includeHotels || false,
      destination: formData.location,
      activityPreference: activityPreference,
    });
  }, [
    formData.location,
    formData.duration,
    formData.travelers,
    flightData.includeFlights,
    hotelData.includeHotels,
    activityPreference,
  ]);

  // Separate value for DISPLAY (what we recommend) vs VALIDATION (what we enforce)
  const recommendedBudget = useMemo(() => {
    if (!budgetEstimates) return null;

    const budgetTier =
      budgetEstimates["budget-friendly"] ||
      budgetEstimates["budget"] ||
      budgetEstimates["budgetfriendly"];

    if (!budgetTier?.range) return null;

    const parsed = parseInt(budgetTier.range.replace(/[^0-9]/g, ""));
    return isNaN(parsed) ? null : parsed;
  }, [budgetEstimates]);

  // ✅ NEW: Detect if custom budget is now invalid due to service changes
  const budgetNeedsUpdate = useMemo(() => {
    if (!customValue || !minimumBudget) return false;

    const amount = parseInt(customValue);
    if (isNaN(amount)) return false;

    // Check if current custom budget is below NEW minimum
    return amount < minimumBudget;
  }, [customValue, minimumBudget]);

  // ✅ NEW: Show console warning when budget becomes invalid (for debugging)
  useEffect(() => {
    if (budgetNeedsUpdate && customValue) {
      const amount = parseInt(customValue);
      console.warn("⚠️ Custom budget now invalid:", {
        current: amount,
        newMinimum: minimumBudget,
        difference: minimumBudget - amount,
        includesFlights: flightData.includeFlights,
        includesHotels: hotelData.includeHotels,
      });
    }
  }, [
    budgetNeedsUpdate,
    customValue,
    minimumBudget,
    flightData.includeFlights,
    hotelData.includeHotels,
  ]);

  // ✅ ENHANCED: Custom budget validation error with service-aware messaging
  const customBudgetError = useMemo(() => {
    // Inline validation to avoid dependency issues
    if (!customValue || customValue === "") return null;

    const amount = parseInt(customValue);

    if (isNaN(amount)) {
      return "Please enter a valid number";
    }

    // ✅ Check for zero or negative values
    if (amount <= 0) {
      return "Budget must be greater than zero";
    }

    // ✅ GRANDFATHERING: Check if this is the user's original budget
    // If they're navigating back to Step 5 with existing budget, be more lenient
    const isOriginalBudget =
      customValue === initialCustomValueRef.current &&
      initialCustomValueRef.current;

    // ✅ ENHANCED: Show service-specific message when budget becomes invalid
    if (amount < minimumBudget) {
      if (isOriginalBudget && budgetNeedsUpdate) {
        // Budget WAS valid but is now too low due to service changes
        const servicesAdded = [];
        if (flightData.includeFlights) servicesAdded.push("flights");
        if (hotelData.includeHotels) servicesAdded.push("hotels");

        const serviceText =
          servicesAdded.length > 0
            ? ` after adding ${servicesAdded.join(" and ")}`
            : "";

        return `⚠️ Your budget (₱${amount.toLocaleString()}) is now below the minimum (₱${minimumBudget.toLocaleString()})${serviceText}. Please increase your budget or adjust your trip preferences.`;
      }

      return `Budget too low. Minimum viable budget is ₱${minimumBudget.toLocaleString()} for ${
        formData.duration
      } ${
        formData.duration === 1 ? "day" : "days"
      } (covers only bare essentials).`;
    }

    // ✅ Soft warning if below recommended amount
    if (recommendedBudget && amount < recommendedBudget) {
      const percentBelow = Math.round(
        ((recommendedBudget - amount) / recommendedBudget) * 100
      );

      if (percentBelow > 3) {
        return `⚠️ Your budget is ${percentBelow}% below our recommendation (₱${recommendedBudget.toLocaleString()}). This may limit accommodation and activity options. Consider increasing for better quality experiences.`;
      }
    }

    // ✅ Upper limit check
    if (amount > 1000000) {
      return "Budget seems too high. Please enter a reasonable amount.";
    }

    return null;
  }, [
    customValue,
    minimumBudget,
    recommendedBudget,
    formData.duration,
    budgetNeedsUpdate,
    flightData.includeFlights,
    hotelData.includeHotels,
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          What's your budget range?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl mx-auto leading-relaxed">
          Choose a budget that works for you - we'll optimize your experience 💰
        </p>

        {/* ✅ NEW: Service Change Alert */}
        {budgetNeedsUpdate && (
          <div className="mt-4 mx-auto max-w-md p-3 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600 rounded-lg animate-pulse">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 text-lg">
                ⚠️
              </span>
              <div className="text-left flex-1">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Budget Update Required
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Your trip preferences have changed. Please review and update
                  your budget below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Override Indicator */}
        {isBudgetOverridden && profileBudget && (
          <div className="mt-4 mx-auto max-w-md p-3 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 text-lg">
                ⚡
              </span>
              <div className="text-left flex-1">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Budget Override Active
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Your profile preference is{" "}
                  <span className="font-bold">{profileBudget}</span>, but you've
                  selected <span className="font-bold">{tripBudget}</span> for
                  this trip. We'll use your trip-level choice.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Preset budget options - Enhanced with estimates */}
        <div className="space-y-3">
          {SelectBudgetOptions.map((option) => {
            // ✅ FIXED: Robust key normalization with fallbacks
            const normalizeKey = (value) => {
              if (!value) return null;

              // Remove hyphens, spaces, and convert to lowercase
              const normalized = value.toLowerCase().replace(/[-\s]/g, "");

              return normalized;
            };

            const normalizedKey = normalizeKey(option.value);

            // ✅ Try multiple key variations
            const estimate =
              budgetEstimates?.[option.value] || // Try exact match first
              budgetEstimates?.[normalizedKey] || // Try normalized (budgetfriendly)
              budgetEstimates?.[option.value.toLowerCase()] || // Try lowercase (budget-friendly)
              budgetEstimates?.[
                option.value.toLowerCase().replace(/-friendly/i, "")
              ] || // Try without "-friendly" (budget)
              null;

            // ✅ Debug logging (remove in production)
            if (import.meta.env.DEV && !estimate && budgetEstimates) {
              console.warn(
                `⚠️ No budget estimate found for "${option.value}"`,
                {
                  normalizedKey,
                  availableKeys: Object.keys(budgetEstimates),
                }
              );
            }

            return (
              <div
                key={option.id}
                onClick={() => {
                  onBudgetChange(option.title);
                  setShowCustom(false);
                  onCustomBudgetChange("");
                }}
                className={`group p-5 cursor-pointer border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
                  value === option.title && !customValue
                    ? "shadow-xl border-sky-500 dark:border-sky-600 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30"
                    : "border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                      value === option.title && !customValue
                        ? "brand-gradient shadow-lg"
                        : "bg-gray-100 dark:bg-slate-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/50"
                    }`}
                  >
                    <span
                      className={
                        value === option.title && !customValue
                          ? "text-white"
                          : "dark:text-gray-300"
                      }
                    >
                      {option.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold text-lg transition-colors ${
                          value === option.title && !customValue
                            ? "text-sky-800 dark:text-sky-300"
                            : "text-gray-800 dark:text-gray-200 group-hover:text-sky-700 dark:group-hover:text-sky-400"
                        }`}
                      >
                        {option.title}
                      </h3>
                      {/* ✅ NEW: Recommendation Badge */}
                      {recommendation &&
                        recommendation.tier === option.title && (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 text-xs"
                          >
                            ⭐ Recommended
                          </Badge>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {option.desc}
                    </p>
                    {estimate && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-sky-700 dark:text-sky-400">
                          {estimate.range}{" "}
                          <span className="font-normal text-gray-600 dark:text-gray-400">
                            total
                          </span>
                        </p>
                        {formData.travelers && formData.travelers > 1 && (
                          <>
                            <span className="text-gray-400 dark:text-gray-600">
                              •
                            </span>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              {estimate.perPerson}{" "}
                              <span className="font-normal text-gray-600 dark:text-gray-400">
                                per person
                              </span>
                            </p>
                          </>
                        )}
                        {estimate.perDay && formData.duration && (
                          <>
                            <span className="text-gray-400 dark:text-gray-600">
                              •
                            </span>
                            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                              {estimate.perDay}{" "}
                              <span className="font-normal text-gray-600 dark:text-gray-400">
                                per day
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {value === option.title && !customValue && (
                    <div className="brand-gradient w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Budget Option */}
        <div className="pt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">
              OR
            </span>
            <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
          </div>
          <div
            className={`group border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
              showCustom || customValue
                ? "shadow-xl border-sky-500 dark:border-sky-600 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30"
                : "border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg"
            }`}
          >
            {/* Custom Budget Header - Always Visible */}
            <div
              onClick={() => {
                if (!showCustom) {
                  setShowCustom(true);
                  // Clear preset budget when opening custom
                  onBudgetChange("");
                }
              }}
              className="p-5 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                      customValue
                        ? "brand-gradient shadow-lg"
                        : "bg-gray-100 dark:bg-slate-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/50"
                    }`}
                  >
                    <span
                      className={
                        customValue ? "text-white" : "dark:text-gray-300"
                      }
                    >
                      🎯
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-lg transition-colors ${
                        customValue
                          ? "text-sky-800 dark:text-sky-300"
                          : "text-gray-800 dark:text-gray-200 group-hover:text-sky-700 dark:group-hover:text-sky-400"
                      }`}
                    >
                      Custom Budget
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {customValue
                        ? `₱${parseInt(customValue).toLocaleString()}`
                        : "Enter your specific budget amount"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {customValue && (
                    <div className="brand-gradient w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                  )}
                  {(showCustom || customValue) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustom(false);
                        onCustomBudgetChange("");
                      }}
                      className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center text-sm cursor-pointer"
                      title="Clear custom budget"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Budget Input - Only When Active */}
            {showCustom && (
              <div
                className="px-5 pb-5 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      ₱
                    </span>
                    <Input
                      type="number"
                      placeholder="Enter your budget amount"
                      value={customValue}
                      onChange={(e) => {
                        onCustomBudgetChange(e.target.value);
                        onBudgetChange("");
                      }}
                      className="text-lg py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 focus:border-sky-500 dark:focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950/50 focus:outline-none h-auto transition-all bg-white dark:bg-slate-900 dark:text-white hover:border-sky-300 dark:hover:border-sky-700 focus:bg-white dark:focus:bg-slate-900 active:bg-white dark:active:bg-slate-900"
                      min="1"
                      max="1000000"
                      step="500"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-800">
                    <span className="text-sky-600 dark:text-sky-400">💡</span>
                    <p className="text-sm text-sky-700 dark:text-sky-300 font-medium">
                      {recommendedBudget && formData.duration ? (
                        <>
                          <strong>Recommended:</strong> ₱
                          {recommendedBudget.toLocaleString()}{" "}
                          <span className="text-sky-600 dark:text-sky-400 font-normal">
                            (budget-friendly tier) •
                          </span>{" "}
                          <strong>Bare minimum:</strong> ₱
                          {minimumBudget.toLocaleString()}
                        </>
                      ) : (
                        <>
                          Include accommodation, food, activities, and
                          transportation costs
                        </>
                      )}
                    </p>
                  </div>
                  {customBudgetError && (
                    <div
                      className={`flex items-start gap-2 p-3 rounded-xl border ${
                        customBudgetError.startsWith("⚠️")
                          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                          : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                      }`}
                    >
                      <span
                        className={
                          customBudgetError.startsWith("⚠️")
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {customBudgetError.startsWith("⚠️") ? "⚠️" : "❌"}
                      </span>
                      <p
                        className={`text-sm font-medium ${
                          customBudgetError.startsWith("⚠️")
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-red-700 dark:text-red-300"
                        }`}
                      >
                        {customBudgetError.replace(/^⚠️\s*/, "")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
              </div>
              <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                {error}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetSelector;
