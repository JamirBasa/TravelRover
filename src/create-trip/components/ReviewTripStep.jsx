import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaPlane,
  FaHotel,
  FaListAlt,
  FaInfoCircle,
  FaRunning,
  FaCheckCircle,
} from "react-icons/fa";
import {
  calculateDuration,
  formatCurrency,
  DATE_CONFIG,
} from "../../constants/options";

const ReviewTripStep = ({
  formData,
  customBudget,
  flightData,
  hotelData,
  // userProfile, // Reserved for future profile-based features
  place,
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

  // Note: Smart travel dates calculation removed - reserved for future feature
  // const travelDates = calculateTravelDates({ ... });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Review Your Trip Details
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
          Please review your travel preferences before generating your itinerary
          ✅
        </p>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {/* Destination */}
        <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="text-blue-600 dark:text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Destination
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {place?.label || formData.location || "Not selected"}
              </p>
            </div>
          </div>
        </div>

        {/* Travel Dates - Simplified */}
        <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaCalendarAlt className="text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Travel Dates
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {formatDate(formData.startDate)} →{" "}
                {formatDate(formData.endDate)}
              </p>
              <p className="text-blue-600 dark:text-blue-500 text-sm font-medium mt-1">
                {getDuration()} trip
              </p>
            </div>
          </div>
        </div>

        {/* Travelers */}
        <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaUsers className="text-sky-600 dark:text-sky-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Travel Group
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {formData.travelers || "Not selected"}
              </p>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaMoneyBillWave className="text-orange-600 dark:text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Budget
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {getBudgetDisplay()}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Pace */}
        <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaRunning className="text-purple-600 dark:text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Activity Pace
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {getActivityPaceDisplay()}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Services - Combined Flight & Hotel */}
        {(flightData?.includeFlights || hotelData?.includeHotels) && (
          <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex gap-2">
                {flightData?.includeFlights && (
                  <FaPlane className="text-blue-600 dark:text-blue-500 mt-1 flex-shrink-0" />
                )}
                {hotelData?.includeHotels && (
                  <FaHotel className="text-orange-600 dark:text-orange-500 mt-1 flex-shrink-0" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Additional Services
                </h3>

                {/* Flight Info */}
                {flightData?.includeFlights && (
                  <div className="mb-3 pb-3 border-b border-gray-200 dark:border-slate-700 last:border-b-0 last:pb-0 last:mb-0">
                    <p className="text-green-600 dark:text-green-500 text-sm font-medium mb-1">
                      ✓ Flight Search Included
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      From:{" "}
                      {flightData.departureCity ||
                        "Please specify departure city"}
                    </p>
                    {!flightData.departureCity && (
                      <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                        ⚠️ Departure city required for flight search
                      </p>
                    )}
                  </div>
                )}

                {/* Hotel Info */}
                {hotelData?.includeHotels && (
                  <div>
                    <p className="text-green-600 dark:text-green-500 text-sm font-medium mb-1">
                      ✓ Hotel Search Included
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Type:{" "}
                      {hotelData.preferredType
                        ? hotelData.preferredType.charAt(0).toUpperCase() +
                          hotelData.preferredType.slice(1)
                        : "Standard Hotels"}{" "}
                      •{" "}
                      {hotelData.priceRange ||
                        `Budget Level ${hotelData.budgetLevel || 2}`}
                    </p>
                    {(!hotelData.preferredType || !hotelData.priceRange) && (
                      <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                        ⚠️ Using default hotel preferences
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Special Requests */}
        {formData.specificRequests && (
          <div className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaListAlt className="text-teal-600 dark:text-teal-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                  Special Requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                  {formData.specificRequests}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ready to Generate Notice */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 p-2.5 rounded-full">
              <FaCheckCircle className="text-white text-lg" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-300 text-base mb-2">
                🎉 Ready to Create Your Itinerary!
              </h3>
              <p className="text-green-800 dark:text-green-400 text-sm leading-relaxed">
                Your personalized {formData.duration}-day itinerary will include
                activities, dining, and transportation options optimized for
                your preferences.
                {(flightData?.includeFlights || hotelData?.includeHotels) &&
                  " Plus real-time flight and hotel recommendations!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewTripStep;
