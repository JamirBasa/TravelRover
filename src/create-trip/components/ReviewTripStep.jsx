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
} from "react-icons/fa";
import {
  calculateDuration,
  formatCurrency,
  DATE_CONFIG,
} from "../../constants/options";
import { formatTravelersDisplay } from "../../utils/travelersParsers";

const ReviewTripStep = ({
  formData,
  customBudget,
  flightData,
  hotelData,
  userProfile,
  place,
  onEdit, // Optional: callback to navigate back to specific step
}) => {
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

            {/* Flight Search Details */}
            {flightData?.includeFlights && (
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
                        <FaPlane className="text-blue-500" />
                        Flight Search
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
            )}

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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-5">
            <div>
              <h3 className="font-bold text-green-900 dark:text-green-300 text-lg mb-2">
                🎉 Ready to Create Your Itinerary!
              </h3>
              <p className="text-green-800 dark:text-green-400 text-sm leading-relaxed mb-3">
                Your personalized <strong>{getDuration()}</strong> itinerary to{" "}
                <strong>{formData.location}</strong> will include:
              </p>
              <ul className="text-green-800 dark:text-green-400 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-500 mt-0.5 text-base">
                    ✓
                  </span>
                  <span className="leading-relaxed">
                    Day-by-day activities optimized for your{" "}
                    {getActivityPaceDisplay().toLowerCase()}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-500 mt-0.5 text-base">
                    ✓
                  </span>
                  <span className="leading-relaxed">
                    Dining recommendations matching your{" "}
                    {getBudgetDisplay().toLowerCase()} budget
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-500 mt-0.5 text-base">
                    ✓
                  </span>
                  <span className="leading-relaxed">
                    Transportation options and travel time estimates
                  </span>
                </li>
                {flightData?.includeFlights && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-500 mt-0.5 text-base">
                      ✈️
                    </span>
                    <span className="leading-relaxed">
                      <strong>Real-time flight search</strong> from{" "}
                      {flightData.departureCity || "your city"}
                    </span>
                  </li>
                )}
                {hotelData?.includeHotels && (
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-500 mt-0.5 text-base">
                      🏨
                    </span>
                    <span className="leading-relaxed">
                      <strong>Hotel recommendations</strong> with real photos
                      and reviews
                    </span>
                  </li>
                )}
              </ul>
            </div>
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
