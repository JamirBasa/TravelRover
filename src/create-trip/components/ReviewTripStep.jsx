import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaPlane,
  FaHotel,
  FaListAlt,
  FaInfoCircle,
} from "react-icons/fa";
import {
  calculateDuration,
  formatCurrency,
  DATE_CONFIG,
} from "../../constants/options";
import {
  calculateTravelDates,
  getDateExplanation,
} from "../../utils/travelDateManager";

const ReviewTripStep = ({
  formData,
  customBudget,
  flightData,
  hotelData,
  userProfile,
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

  // Calculate smart travel dates
  const travelDates =
    formData.startDate && formData.endDate
      ? calculateTravelDates({
          startDate: formData.startDate,
          endDate: formData.endDate,
          includeFlights: flightData?.includeFlights,
          departureCity: flightData?.departureCity,
          destination: formData.location,
          travelers: formData.travelers,
        })
      : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Review Your Trip Details
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Please review your travel preferences before generating your itinerary
          ✅
        </p>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {/* Destination */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Destination</h3>
              <p className="text-gray-600 text-sm">
                {place?.label || formData.location || "Not selected"}
              </p>
            </div>
          </div>
        </div>

        {/* Travel Dates */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaCalendarAlt className="text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-800 mb-1">Travel Dates</h3>
              <p className="text-gray-600 text-sm">
                <strong>Start:</strong> {formatDate(formData.startDate)}
              </p>
              <p className="text-gray-600 text-sm">
                <strong>End:</strong> {formatDate(formData.endDate)}
              </p>
              <p className="text-blue-600 text-sm font-medium mt-1">
                Duration: {getDuration()}
              </p>

              {/* Smart Date Explanation */}
              {travelDates && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700">
                      <p className="font-semibold mb-1">Travel Timing:</p>
                      <p>{getDateExplanation(travelDates)}</p>
                      {travelDates.includesArrivalDay && (
                        <p className="mt-2 font-semibold">
                          ✈️ Flying out on {travelDates.flightDepartureDate}
                        </p>
                      )}
                      {travelDates.totalNights !== travelDates.totalDays && (
                        <p className="mt-1">
                          🏨 Hotel: {travelDates.totalNights} nights (
                          {travelDates.hotelCheckInDate} to{" "}
                          {travelDates.hotelCheckOutDate})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Travelers */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaUsers className="text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Travel Group</h3>
              <p className="text-gray-600 text-sm">
                {formData.travelers || "Not selected"}
              </p>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaMoneyBillWave className="text-orange-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Budget</h3>
              <p className="text-gray-600 text-sm">{getBudgetDisplay()}</p>
            </div>
          </div>
        </div>

        {/* Flight Preferences */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaPlane className="text-indigo-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Flight Options</h3>
              {flightData.includeFlights ? (
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    ✓ Include flight search
                  </p>
                  <p className="text-gray-600 text-sm">
                    Departing from:{" "}
                    {flightData.departureCity || "Not specified"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">
                  No flight search requested
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Hotel Preferences */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaHotel className="text-orange-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Hotel Options</h3>
              {hotelData?.includeHotels ? (
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    ✓ Include hotel search
                  </p>
                  <p className="text-gray-600 text-sm">
                    Preferred Type: {hotelData.preferredType || "Not specified"}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Budget Range: {hotelData.priceRange || "Not specified"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">
                  No hotel search requested
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {formData.specificRequests && (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaListAlt className="text-teal-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-800 mb-1">
                  Special Requests
                </h3>
                <p className="text-gray-600 text-sm whitespace-pre-line">
                  {formData.specificRequests}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile Summary */}
        {userProfile && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">
              Personalization Based on Your Profile:
            </h3>
            <div className="space-y-1 text-blue-700 text-sm">
              <p>• Travel Style: {userProfile.travelStyle}</p>
              <p>
                • Preferred Trip Types:{" "}
                {userProfile.preferredTripTypes?.slice(0, 2).join(", ")}
              </p>
              <p>• Accommodation: {userProfile.accommodationPreference}</p>
              {userProfile.dietaryRestrictions?.length > 0 && (
                <p>• Dietary: {userProfile.dietaryRestrictions.join(", ")}</p>
              )}
            </div>
          </div>
        )}

        {/* LangGraph Multi-Agent Notice */}
        {(flightData?.includeFlights || hotelData?.includeHotels) && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-800 mb-2">
              🤖 LangGraph Multi-Agent System
            </h3>
            <p className="text-purple-700 text-sm">
              Our AI agents will work together to find the best options:
            </p>
            <ul className="text-purple-700 text-sm mt-2 space-y-1">
              {flightData?.includeFlights && (
                <li>
                  • ✈️ Flight Agent: Real-time flight search and optimization
                </li>
              )}
              {hotelData?.includeHotels && (
                <li>
                  • 🏨 Hotel Agent: Accommodation recommendations and pricing
                </li>
              )}
              <li>• 🎯 Coordinator: Smart optimization and cost analysis</li>
            </ul>
          </div>
        )}

        {/* Generation Notice */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">
            🎉 Ready to Generate!
          </h3>
          <p className="text-green-700 text-sm">
            Your personalized itinerary will include accommodations, activities,
            dining recommendations, and transportation options based on your
            preferences and profile.
            {(flightData?.includeFlights || hotelData?.includeHotels) &&
              " Plus real-time flight and hotel data from our AI agents!"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewTripStep;
