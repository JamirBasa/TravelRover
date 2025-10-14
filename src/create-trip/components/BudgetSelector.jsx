import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { SelectBudgetOptions } from "../../constants/options";
import {
  FaInfoCircle,
  FaCalculator,
  FaMapMarkerAlt,
  FaPlane,
} from "react-icons/fa";
import {
  getBudgetRecommendations,
  getDestinationInfo,
  getAirportRecommendations,
  findNearestAirport,
} from "../../utils/budgetEstimator";

const BudgetSelector = ({
  value,
  customValue,
  onBudgetChange,
  onCustomBudgetChange,
  error,
  // New props for smart estimation
  formData = {},
  flightData = {},
  userProfile = {}, // Add userProfile prop
}) => {
  const [showCustom, setShowCustom] = useState(!!customValue); // Show custom if there's already a custom value
  const [showEstimates, setShowEstimates] = useState(false);

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

  // Calculate smart budget recommendations
  const budgetEstimates = useMemo(() => {
    if (!formData.location || !formData.duration) {
      return null;
    }

    // Parse travelers count
    let travelerCount = 1;
    if (formData.travelers) {
      const match = formData.travelers.match(/(\d+)/);
      if (match) travelerCount = parseInt(match[1]);
    }

    return getBudgetRecommendations({
      destination: formData.location,
      departureLocation: flightData.departureCity || "Manila, Philippines",
      duration: formData.duration,
      travelers: travelerCount,
      includeFlights: flightData.includeFlights || false,
    });
  }, [formData.location, formData.duration, formData.travelers, flightData]);

  // Get airport recommendations for flight planning
  const airportInfo = useMemo(() => {
    if (!formData.location) return null;

    const departureCity = flightData.departureCity || "Manila";
    const destinationCity = formData.location;

    return getAirportRecommendations(departureCity, destinationCity);
  }, [formData.location, flightData.departureCity]);

  // Get destination info for display
  const destinationInfo = useMemo(() => {
    if (!formData.location) return null;
    return getDestinationInfo(formData.location);
  }, [formData.location]);

  // Calculate minimum required budget based on estimates
  const minimumBudget = useMemo(() => {
    if (!budgetEstimates) return 1000; // Default minimum

    // Use budget tier estimate as minimum (the cheapest option)
    const budgetTierTotal = budgetEstimates.budget.range
      .replace("₱", "")
      .replace(/,/g, "");

    return Math.floor(parseInt(budgetTierTotal) * 0.8); // 80% of budget tier as absolute minimum
  }, [budgetEstimates]);

  // Validate custom budget input
  const validateCustomBudget = (value) => {
    if (!value || value === "") return null;

    const amount = parseInt(value);

    if (isNaN(amount)) {
      return "Please enter a valid number";
    }

    if (amount < minimumBudget) {
      return `Minimum recommended budget for this trip is ₱${minimumBudget.toLocaleString()}. This covers basic accommodation, food, and activities for ${
        formData.duration
      } ${formData.duration === 1 ? "day" : "days"}.`;
    }

    if (amount > 1000000) {
      return "Budget seems too high. Please enter a reasonable amount.";
    }

    return null;
  };

  // Custom budget validation error
  const customBudgetError = useMemo(() => {
    return validateCustomBudget(customValue);
  }, [customValue, minimumBudget, formData.duration]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          What's your budget range?
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Choose a budget that works for you - we'll optimize your experience 💰
        </p>

        {/* Budget Override Indicator */}
        {isBudgetOverridden && profileBudget && (
          <div className="mt-4 mx-auto max-w-md p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-lg">⚡</span>
              <div className="text-left flex-1">
                <p className="text-xs font-semibold text-amber-800 mb-1">
                  Budget Override Active
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
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
        {/* Budget Info */}
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaInfoCircle className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Budget Planning
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Your budget helps us recommend the best accommodations, dining,
                activities, and transportation options for your trip.
              </p>
            </div>
          </div>
        </div>

        {/* Smart Budget Estimates - Shows when location & duration are selected */}
        {budgetEstimates && destinationInfo && (
          <div className="brand-card p-5 shadow-lg border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="brand-gradient p-2 rounded-full">
                  <FaCalculator className="text-white text-sm" />
                </div>
                <h3 className="font-semibold text-sky-800 text-base">
                  💡 Estimated Budget for {formData.location}
                </h3>
              </div>
              <button
                onClick={() => setShowEstimates(!showEstimates)}
                className="text-sky-600 hover:text-sky-800 text-sm font-medium transition-colors"
              >
                {showEstimates ? "Hide Details" : "Show Breakdown"}
              </button>
            </div>

            {/* Price Level Indicator */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-sky-200">
              <FaMapMarkerAlt className="text-sky-600" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold">{formData.location}</span> is a{" "}
                <span className="font-bold text-sky-700">
                  {destinationInfo.priceLevel}
                </span>{" "}
                price destination
                {flightData.includeFlights && flightData.departureCity && (
                  <span>
                    {" "}
                    • Flights from{" "}
                    <span className="font-semibold">
                      {flightData.departureCity}
                    </span>
                  </span>
                )}
              </span>
            </div>

            {/* Quick Estimates */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-sky-200 hover:shadow-md transition-shadow">
                <div className="text-xs text-sky-600 font-medium mb-1">
                  Budget
                </div>
                <div className="text-base font-bold text-sky-900">
                  {budgetEstimates.budget.range}
                </div>
                <div className="text-xs text-sky-600 mt-1">
                  {budgetEstimates.budget.perPerson}/person
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-sky-200 hover:shadow-md transition-shadow">
                <div className="text-xs text-sky-600 font-medium mb-1">
                  Moderate
                </div>
                <div className="text-base font-bold text-sky-900">
                  {budgetEstimates.moderate.range}
                </div>
                <div className="text-xs text-sky-600 mt-1">
                  {budgetEstimates.moderate.perPerson}/person
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-sky-200 hover:shadow-md transition-shadow">
                <div className="text-xs text-sky-600 font-medium mb-1">
                  Luxury
                </div>
                <div className="text-base font-bold text-sky-900">
                  {budgetEstimates.luxury.range}
                </div>
                <div className="text-xs text-sky-600 mt-1">
                  {budgetEstimates.luxury.perPerson}/person
                </div>
              </div>
            </div>

            {/* Detailed Breakdown - Expandable */}
            {showEstimates && (
              <div className="mt-4 space-y-3">
                {Object.entries(budgetEstimates).map(([level, data]) => (
                  <div
                    key={level}
                    className="bg-white/70 rounded-lg p-4 border border-sky-200"
                  >
                    <div className="font-semibold text-sky-900 capitalize mb-2 text-sm">
                      {level}
                    </div>
                    <div className="text-xs text-gray-700 space-y-1">
                      <p className="flex justify-between">
                        <span>• Accommodation:</span>
                        <span className="font-semibold">
                          ₱{data.breakdown.accommodation.toLocaleString()}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>• Food & Dining:</span>
                        <span className="font-semibold">
                          ₱{data.breakdown.food.toLocaleString()}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>• Activities:</span>
                        <span className="font-semibold">
                          ₱{data.breakdown.activities.toLocaleString()}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>• Local Transport:</span>
                        <span className="font-semibold">
                          ₱{data.breakdown.transport.toLocaleString()}
                        </span>
                      </p>
                      {data.breakdown.flights > 0 && (
                        <p className="flex justify-between border-t border-sky-100 pt-1 mt-1">
                          <span>• ✈️ Flights:</span>
                          <span className="font-semibold">
                            ₱{data.breakdown.flights.toLocaleString()}
                          </span>
                        </p>
                      )}
                      <p className="flex justify-between">
                        <span>• Miscellaneous:</span>
                        <span className="font-semibold">
                          ₱{data.breakdown.miscellaneous.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-sky-600 italic mt-2 pt-2 border-t border-sky-100">
                      {data.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Info Note */}
            <div className="mt-3 flex items-start gap-2 p-3 bg-sky-100/50 rounded-lg">
              <span className="text-sky-600">ℹ️</span>
              <p className="text-xs text-sky-700">
                Estimates based on{" "}
                <span className="font-semibold">{formData.duration} days</span>{" "}
                in <span className="font-semibold">{formData.location}</span>
                {formData.travelers && (
                  <span>
                    {" "}
                    for{" "}
                    <span className="font-semibold">{formData.travelers}</span>
                  </span>
                )}
                {flightData.includeFlights && flightData.departureCity && (
                  <span>
                    {" "}
                    (includes flights from {flightData.departureCity})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Airport Recommendations - Shows when flights are included */}
        {airportInfo && flightData.includeFlights && (
          <div className="brand-card p-5 shadow-lg border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 rounded-full">
                <FaPlane className="text-white text-lg" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 text-base mb-3">
                  ✈️ Airport Information
                </h3>

                {/* Departure Airport */}
                {airportInfo.departure && (
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mb-3 border border-emerald-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-emerald-600 font-medium mb-1">
                          Departure From
                        </div>
                        <div className="font-semibold text-emerald-900">
                          {airportInfo.departure.name}
                        </div>
                        <div className="text-xs text-emerald-700 mt-1">
                          {airportInfo.departure.code} •{" "}
                          {airportInfo.departure.city}
                        </div>
                        {!airportInfo.departure.hasDirectAirport && (
                          <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>
                              {flightData.departureCity} doesn't have an
                              airport. Nearest: {airportInfo.departure.city} (
                              {airportInfo.departure.travelTime})
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                        {airportInfo.departure.type}
                      </span>
                    </div>
                  </div>
                )}

                {/* Destination Airport */}
                {airportInfo.destination && (
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-emerald-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-emerald-600 font-medium mb-1">
                          Flying To
                        </div>
                        <div className="font-semibold text-emerald-900">
                          {airportInfo.destination.name}
                        </div>
                        <div className="text-xs text-emerald-700 mt-1">
                          {airportInfo.destination.code} •{" "}
                          {airportInfo.destination.city}
                        </div>
                        {!airportInfo.destination.hasDirectAirport && (
                          <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>
                              {formData.location} doesn't have an airport.
                              Nearest: {airportInfo.destination.city} (
                              {airportInfo.destination.travelTime})
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                        {airportInfo.destination.type}
                      </span>
                    </div>
                  </div>
                )}

                {/* Flight Route Info */}
                {airportInfo.route && (
                  <div className="mt-3 p-3 bg-emerald-100/50 rounded-lg border border-emerald-200">
                    <div className="text-xs text-emerald-700 flex items-center justify-between">
                      <span className="font-semibold">Flight Route:</span>
                      <span className="font-mono font-semibold">
                        {airportInfo.route}
                      </span>
                    </div>
                  </div>
                )}

                {!airportInfo.needsFlight && (
                  <div className="mt-3 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-700 flex items-center gap-2">
                      <span>💡</span>
                      <span>
                        <strong>Same region:</strong> Land travel is recommended
                        (more economical and scenic!)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preset budget options - Enhanced with estimates */}
        <div className="space-y-3">
          {SelectBudgetOptions.map((option) => {
            // Get matching estimate for this budget level
            const estimate = budgetEstimates?.[option.value.toLowerCase()];

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
                    ? "shadow-xl border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50"
                    : "border-gray-200 hover:border-sky-300 hover:shadow-lg"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                      value === option.title && !customValue
                        ? "brand-gradient shadow-lg"
                        : "bg-gray-100 group-hover:bg-sky-100"
                    }`}
                  >
                    <span
                      className={
                        value === option.title && !customValue
                          ? "text-white"
                          : ""
                      }
                    >
                      {option.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-lg transition-colors ${
                        value === option.title && !customValue
                          ? "text-sky-800"
                          : "text-gray-800 group-hover:text-sky-700"
                      }`}
                    >
                      {option.title}
                    </h3>
                    <p className="text-sm text-gray-600">{option.desc}</p>
                    {estimate && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-sky-700">
                          {estimate.range}{" "}
                          <span className="font-normal text-gray-600">
                            total
                          </span>
                        </p>
                        {formData.travelers &&
                          formData.travelers !== "Just Me" &&
                          formData.travelers !== "1 Person" && (
                            <>
                              <span className="text-gray-400">•</span>
                              <p className="text-xs font-semibold text-emerald-700">
                                {estimate.perPerson}{" "}
                                <span className="font-normal text-gray-600">
                                  per person
                                </span>
                              </p>
                            </>
                          )}
                        {estimate.perDay && formData.duration && (
                          <>
                            <span className="text-gray-400">•</span>
                            <p className="text-xs font-medium text-purple-700">
                              {estimate.perDay}{" "}
                              <span className="font-normal text-gray-600">
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
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs text-gray-500 font-medium px-2">OR</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          <div
            className={`group border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
              showCustom || customValue
                ? "shadow-xl border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50"
                : "border-gray-200 hover:border-sky-300 hover:shadow-lg"
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
                        : "bg-gray-100 group-hover:bg-sky-100"
                    }`}
                  >
                    <span className={customValue ? "text-white" : ""}>🎯</span>
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-lg transition-colors ${
                        customValue
                          ? "text-sky-800"
                          : "text-gray-800 group-hover:text-sky-700"
                      }`}
                    >
                      Custom Budget
                    </h3>
                    <p className="text-sm text-gray-600">
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
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center text-sm"
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
                className="px-5 pb-5 border-t border-gray-200 bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-700">
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
                      className="text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none h-auto transition-all bg-white hover:border-sky-300 focus:bg-white active:bg-white"
                      style={{
                        WebkitBoxShadow: "0 0 0 1000px white inset",
                        WebkitTextFillColor: "inherit",
                      }}
                      min="1000"
                      step="500"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <span className="text-sky-600">💡</span>
                    <p className="text-sm text-sky-700 font-medium">
                      {minimumBudget > 1000 && budgetEstimates ? (
                        <>
                          Minimum recommended:{" "}
                          <strong>₱{minimumBudget.toLocaleString()}</strong> for
                          this {formData.duration}-day trip
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
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-red-600">⚠️</span>
                      <p className="text-sm text-red-700 font-medium">
                        {customBudgetError}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600">⚠️</span>
              </div>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetSelector;
