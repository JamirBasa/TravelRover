import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaPlane,
  FaHotel,
  FaListAlt,
  FaRunning,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaEdit,
  FaBus,
} from "react-icons/fa";
import {
  calculateDuration,
  formatCurrency,
  DATE_CONFIG,
} from "../../constants/options";
import { formatTravelersDisplay } from "../../utils/travelersParsers";
import { determineTransportModeAsync } from "../../utils/transportModeDetector";
import { useState, useEffect } from "react";

const ReviewTripStep = ({
  formData,
  customBudget,
  flightData,
  hotelData,
  userProfile,
  place,
  onEdit, // Optional: callback to navigate back to specific step
}) => {
  // ✅ Analyze transport mode with async backend API
  const [transportAnalysis, setTransportAnalysis] = useState(null);
  const [isLoadingTransport, setIsLoadingTransport] = useState(false);

  useEffect(() => {
    const analyzeTransportMode = async () => {
      if (!formData?.location || !flightData?.departureCity) {
        setTransportAnalysis(null);
        return;
      }

      setIsLoadingTransport(true);
      try {
        const analysis = await determineTransportModeAsync(
          formData.location,
          flightData.departureCity,
          flightData.includeFlights
        );
        setTransportAnalysis(analysis);
      } catch (error) {
        console.error("Transport mode analysis error:", error);
        setTransportAnalysis(null);
      } finally {
        setIsLoadingTransport(false);
      }
    };

    analyzeTransportMode();
  }, [
    formData?.location,
    flightData?.departureCity,
    flightData?.includeFlights,
  ]);

  // Use centralized formatting functions
  const formatDate = (dateString) => {
    if (!dateString) return "Not selected";
    const date = new Date(dateString);
    return date.toLocaleDateString(
      DATE_CONFIG.DATE_FORMAT,
      DATE_CONFIG.DATE_OPTIONS
    );
  };

  const getDuration = () => {
    const days = calculateDuration(formData.startDate, formData.endDate);
    return days > 0
      ? `${days} ${days === 1 ? "day" : "days"}`
      : "Not calculated";
  };

  const getBudgetDisplay = () => {
    if (customBudget) return `${formatCurrency(customBudget)} (Custom)`;
    return formData.budget || "Not selected";
  };

  const getActivityPaceDisplay = () => {
    const pace = formData.activityPreference || 2;
    const paceLabels = {
      1: "Light Pace (1 activity/day)",
      2: "Moderate Pace (2 activities/day)",
      3: "Active Pace (3 activities/day)",
      4: "Intensive Pace (4 activities/day)",
    };
    return paceLabels[pace] || "Moderate Pace (2 activities/day)";
  };

  // Get budget level display name
  const getBudgetLevelDisplay = (level) => {
    const levels = {
      1: "Budget (₱500-1.5k/night)",
      2: "Economy (₱1.5-2.5k/night)",
      3: "Mid-Range (₱2.5-5k/night)",
      4: "Upscale (₱5-10k/night)",
      5: "Luxury (₱10-20k/night)",
      6: "Ultra-Luxury (₱20k+/night)",
    };
    return levels[level] || levels[2];
  };

  // Validation checks
  const isFlightDataComplete =
    flightData?.includeFlights && flightData?.departureCity;
  const isHotelDataComplete =
    hotelData?.includeHotels && hotelData?.preferredType;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Wider for better information display */}
      {/* Main Question */}
      <div className="text-center mb-8 animate-fade-in-scale">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Review Your Trip Details
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
          Please review and verify all information before generating your
          personalized itinerary ✅
        </p>
      </div>

      {/* Review Cards Grid - Enhanced with Better Organization */}
      <div className="space-y-6">
        {/* SECTION 1: Core Trip Details */}
        <div className="space-y-3 animate-fade-in-scale stagger-1">
          <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide flex items-center gap-2">
            <FaMapMarkerAlt className="text-xs" />
            Trip Overview
          </h3>

          <div className="grid md:grid-cols-2 gap-3">
            {/* Destination */}
            <div className="brand-card p-4 border-2 border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Destination
                  </h4>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {place?.label || formData.location || "Not selected"}
                  </p>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="brand-card p-4 border-2 border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <FaCalendarAlt className="text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Duration
                  </h4>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {getDuration()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Dates - Full Width */}
          <div className="brand-card p-4 border-2 border-gray-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Travel Dates
                </h4>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(formData.startDate)}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(formData.endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* Travelers */}
            <div className="brand-card p-4 border-2 border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <FaUsers className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Travel Group
                  </h4>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatTravelersDisplay(formData.travelers)}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="brand-card p-4 border-2 border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <FaMoneyBillWave className="text-orange-600 dark:text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Budget
                  </h4>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {getBudgetDisplay()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Pace - Full Width */}
          <div className="brand-card p-4 border-2 border-gray-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <FaRunning className="text-purple-600 dark:text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Activity Pace
                </h4>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getActivityPaceDisplay()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Travel Services (Flight & Hotel) */}
        {(flightData?.includeFlights || hotelData?.includeHotels) && (
          <div className="space-y-3 animate-fade-in-scale stagger-2">
            <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide flex items-center gap-2">
              <FaPlane className="text-xs" />
              Travel Services
            </h3>

            {/* ✅ Smart Transport Recommendation Banner */}
            {flightData?.includeFlights &&
              transportAnalysis?.groundTransport?.preferred && (
                <div className="brand-card p-3 border-2 border-emerald-400 dark:border-emerald-600 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🚌</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 mb-1 flex items-center gap-2">
                        <FaBus className="text-emerald-600" />
                        Ground Transport Recommended
                      </h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mb-2">
                        {transportAnalysis.hasAirport === false ||
                        transportAnalysis.warning
                          ? `${
                              formData.location?.split(",")[0]
                            } has no direct flights. Ground transport is the practical option.`
                          : transportAnalysis.recommendation}
                      </p>
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ⏱️
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {transportAnalysis.groundTransport.travelTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            💰
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {transportAnalysis.groundTransport.cost}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            🚌
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {transportAnalysis.groundTransport.operators?.[0]}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-2 italic">
                        {transportAnalysis.hasAirport === false
                          ? "✅ Direct ground transport available - no flight connections needed."
                          : "💡 Tip: Ground transport is more convenient and economical for this route."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Flight Search Details */}
            {flightData?.includeFlights &&
              // Show different card based on whether ground transport is preferred
              (transportAnalysis?.groundTransport?.preferred ||
              transportAnalysis?.groundTransport?.available ? (
                // Special card when ground transport is better
                <div className="brand-card p-4 border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/30">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                          {transportAnalysis?.groundTransport?.hasFerry
                            ? "⛴️"
                            : "🚌"}
                          {transportAnalysis?.groundTransport?.hasFerry
                            ? "Ferry Recommended"
                            : "Ground Transport Recommended"}{" "}
                          <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                            (Best option for this route)
                          </span>
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Based on your route,{" "}
                        <strong>
                          {transportAnalysis?.groundTransport?.hasFerry
                            ? "ferry travel"
                            : "ground transport"}{" "}
                          is more practical
                        </strong>
                        . No flight search needed—we'll generate your itinerary
                        with the recommended{" "}
                        {transportAnalysis?.groundTransport?.hasFerry
                          ? "ferry"
                          : "bus/van"}{" "}
                        travel.
                      </p>
                      <div className="text-[10px] text-gray-500 dark:text-gray-500 italic">
                        💡 Your trip will be generated without flight search. If
                        you prefer to search flights anyway, you can adjust this
                        in the AI-generated itinerary later.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Normal flight search card
                <div
                  className={`brand-card p-4 border-2 ${
                    isFlightDataComplete
                      ? "border-green-200 dark:border-green-700 bg-green-50/30 dark:bg-green-950/20"
                      : "border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          {transportAnalysis?.groundTransport?.hasFerry ? (
                            <span className="text-blue-500">⛴️</span>
                          ) : (
                            <FaPlane className="text-blue-500" />
                          )}
                          {transportAnalysis?.groundTransport?.hasFerry
                            ? "Ferry Travel"
                            : "Flight Search"}
                        </h4>
                        {isFlightDataComplete && (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 rounded-full">
                            ✓ Ready
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[90px]">
                            Departure:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {flightData.departureCity || (
                              <span className="text-amber-600 dark:text-amber-400">
                                ⚠️ Not specified
                              </span>
                            )}
                          </span>
                        </div>
                        {flightData.departureRegion && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 dark:text-gray-400 min-w-[90px]">
                              Region:
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {flightData.departureRegion}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[90px]">
                            Destination:
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {formData.location}
                          </span>
                        </div>
                      </div>

                      {!isFlightDataComplete && (
                        <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded text-xs text-amber-800 dark:text-amber-300">
                          <FaInfoCircle className="inline mr-1" />
                          Departure city is required for flight search
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {/* Hotel Search Details */}
            {hotelData?.includeHotels && (
              <div
                className={`brand-card p-4 border-2 ${
                  isHotelDataComplete
                    ? "border-green-200 dark:border-green-700 bg-green-50/30 dark:bg-green-950/20"
                    : "border-blue-200 dark:border-blue-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FaHotel className="text-orange-500" />
                        Hotel Search
                      </h4>
                      {isHotelDataComplete && (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 rounded-full">
                          ✓ Ready
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 dark:text-gray-400 min-w-[90px]">
                          Type:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {hotelData.preferredType ? (
                            hotelData.preferredType.charAt(0).toUpperCase() +
                            hotelData.preferredType.slice(1)
                          ) : (
                            <span className="text-gray-500">
                              Standard Hotels (default)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 dark:text-gray-400 min-w-[90px]">
                          Budget:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {getBudgetLevelDisplay(hotelData.budgetLevel || 2)}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 dark:text-gray-400 min-w-[90px]">
                          Location:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {formData.location}
                        </span>
                      </div>
                    </div>

                    {!isHotelDataComplete && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-xs text-blue-700 dark:text-blue-300">
                        <FaInfoCircle className="inline mr-1" />
                        Default hotel preferences will be used
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Special Requests */}
        {formData.specificRequests && (
          <div className="space-y-3 animate-fade-in-scale stagger-3">
            <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide flex items-center gap-2">
              <FaListAlt className="text-xs" />
              Additional Preferences
            </h3>
            <div className="brand-card p-4 border-2 border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <FaListAlt className="text-teal-600 dark:text-teal-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Special Requests
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {formData.specificRequests}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Ready to Generate */}
        <div className="animate-fade-in-scale stagger-4">
          <div className="brand-card border-sky-200 dark:border-sky-800 p-6">
            <h3 className="text-lg font-bold brand-gradient-text mb-1">
              Ready to Create Your Itinerary
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your {getDuration()} trip to <strong>{formData.location}</strong>{" "}
              will include:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  ✓
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Day-by-day activities optimized for{" "}
                  {getActivityPaceDisplay().toLowerCase()}
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  ✓
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Dining recommendations for your{" "}
                  {getBudgetDisplay().toLowerCase()} budget
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  ✓
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Transportation and travel time estimates
                </span>
              </li>
              {flightData?.includeFlights &&
                (isLoadingTransport ? (
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-gray-400 flex-shrink-0">⏳</span>
                    <span className="text-gray-500 dark:text-gray-400 italic">
                      Analyzing transport options...
                    </span>
                  </li>
                ) : transportAnalysis?.groundTransport?.preferred ||
                  transportAnalysis?.groundTransport?.available ? (
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      {transportAnalysis?.groundTransport?.hasFerry
                        ? "⛴️"
                        : "🚌"}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {transportAnalysis?.groundTransport?.hasFerry
                        ? "Ferry"
                        : "Ground transport"}{" "}
                      from {flightData.departureCity || "your city"} (
                      {transportAnalysis.groundTransport.travelTime},{" "}
                      {transportAnalysis.groundTransport.cost})
                    </span>
                  </li>
                ) : (
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-sky-600 dark:text-sky-400 flex-shrink-0">
                      ✈️
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Real-time flights from{" "}
                      {flightData.departureCity || "your city"}
                    </span>
                  </li>
                ))}
              {hotelData?.includeHotels && (
                <li className="flex items-start gap-3 text-sm">
                  <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">
                    🏨
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Hotel recommendations with real photos and reviews
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Validation Summary (if any issues) */}
        {!isFlightDataComplete && flightData?.includeFlights && (
          <div className="animate-fade-in-scale stagger-5">
            <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-1">
                    Action Required
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    Please specify your departure city to enable flight search,
                    or disable flight search to continue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewTripStep;
