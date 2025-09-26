import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaPlane,
  FaListAlt,
} from "react-icons/fa";

const ReviewTripStep = ({
  formData,
  customBudget,
  flightData,
  userProfile,
  place,
}) => {
  // Format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return "Not selected";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDuration = () => {
    if (!formData.startDate || !formData.endDate) return "Not calculated";
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
  };

  const getBudgetDisplay = () => {
    if (customBudget) return `₱${customBudget} (Custom)`;
    return formData.budget || "Not selected";
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Review Your Trip Details
        </h2>
        <p className="text-gray-600 text-sm">
          Please review your travel preferences before generating your itinerary
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
            <div>
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

        {/* Generation Notice */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">
            🎉 Ready to Generate!
          </h3>
          <p className="text-green-700 text-sm">
            Your personalized itinerary will include accommodations, activities,
            dining recommendations, and transportation options based on your
            preferences and profile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewTripStep;
