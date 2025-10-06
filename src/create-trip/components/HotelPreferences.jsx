import React, { useState, useEffect } from "react";
import { Input } from "../../components/ui/input";
import Select from "../../components/ui/select";
import {
  FaHotel,
  FaInfoCircle,
  FaCheck,
  FaStar,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
} from "react-icons/fa";
import { HOTEL_CONFIG } from "../../constants/options";

const HotelPreferences = ({
  hotelData,
  onHotelDataChange,
  formData,
  userProfile,
}) => {
  // Debug log to see what we're receiving
  useEffect(() => {
    console.log("🏨 HotelPreferences received:", {
      hotelData,
      formData,
      userProfile: userProfile?.accommodationPreference,
    });
  }, [hotelData, formData, userProfile]);

  // Auto-populate hotel preferences when enabled
  useEffect(() => {
    if (
      hotelData.includeHotels &&
      userProfile?.accommodationPreference &&
      !hotelData.preferredType
    ) {
      console.log("🏨 Auto-populating hotel preferences from profile");
      onHotelDataChange({
        ...hotelData,
        preferredType: userProfile.accommodationPreference,
        budgetLevel: getBudgetLevelFromProfile(userProfile.budgetRange),
      });
    }
  }, [hotelData.includeHotels, userProfile]);

  // Helper function to map user budget to hotel price level
  const getBudgetLevelFromProfile = (budgetRange) => {
    const budgetMapping = {
      budget: 1,
      moderate: 2,
      luxury: 3,
    };
    return budgetMapping[budgetRange?.toLowerCase()] || 2;
  };

  const handlePriceRangeChange = (e) => {
    const level = parseInt(e.target.value);
    onHotelDataChange({
      ...hotelData,
      budgetLevel: level,
      priceRange: HOTEL_CONFIG.PRICE_LEVELS[level],
    });
  };

  const priceRangeOptions = [
    { value: 1, label: HOTEL_CONFIG.PRICE_LEVELS[1] },
    { value: 2, label: HOTEL_CONFIG.PRICE_LEVELS[2] },
    { value: 3, label: HOTEL_CONFIG.PRICE_LEVELS[3] },
    { value: 4, label: HOTEL_CONFIG.PRICE_LEVELS[4] },
  ];

  const accommodationOptions = [
    { value: "hotel", label: "Hotels" },
    { value: "resort", label: "Resorts" },
    { value: "hostel", label: "Hostels" },
    { value: "airbnb", label: "Vacation Rentals" },
    { value: "guesthouse", label: "Guesthouses" },
    { value: "boutique", label: "Boutique Hotels" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Hotel Preferences
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Would you like us to include hotel recommendations in your itinerary?
          🏨
        </p>
      </div>

      {/* Hotel Toggle */}
      <div className="space-y-6">
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaInfoCircle className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Hotel Search Feature
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Enable this to get real hotel recommendations with pricing,
                ratings, and availability for your destination. Helps with
                accommodation planning and booking.
              </p>
            </div>
          </div>
        </div>

        {/* Include Hotels Toggle */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hotelData.includeHotels}
              onChange={(e) => {
                const isEnabled = e.target.checked;

                onHotelDataChange({
                  ...hotelData,
                  includeHotels: isEnabled,
                  // Auto-populate when enabling hotels
                  ...(isEnabled &&
                  userProfile?.accommodationPreference &&
                  !hotelData.preferredType
                    ? {
                        preferredType: userProfile.accommodationPreference,
                        budgetLevel: getBudgetLevelFromProfile(
                          userProfile.budgetRange
                        ),
                        priceRange:
                          HOTEL_CONFIG.PRICE_LEVELS[
                            getBudgetLevelFromProfile(userProfile.budgetRange)
                          ],
                      }
                    : {}),
                });
              }}
              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
            />
            <div className="flex items-center gap-2">
              <FaHotel className="text-orange-600" />
              <span className="font-medium text-gray-800">
                Include hotel search and recommendations
              </span>
            </div>
          </label>

          {hotelData.includeHotels && (
            <div className="ml-7 pl-4 border-l-2 border-orange-200 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                {/* Auto-populated indicator */}
                {hotelData.preferredType &&
                  userProfile?.accommodationPreference ===
                    hotelData.preferredType && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <FaCheck className="text-xs" />
                        <span>
                          Auto-populated from your profile preferences
                        </span>
                      </div>
                    </div>
                  )}

                <h4 className="font-medium text-gray-800 mb-3">
                  What type of accommodation do you prefer?
                </h4>

                {/* Accommodation Type */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaHotel className="inline mr-1" />
                      Accommodation Type
                    </label>
                    <Select
                      value={hotelData.preferredType}
                      onChange={(e) =>
                        onHotelDataChange({
                          ...hotelData,
                          preferredType: e.target.value,
                        })
                      }
                      options={accommodationOptions}
                      placeholder="Select accommodation type"
                      className="text-sm"
                    />
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaStar className="inline mr-1" />
                      Budget Range
                    </label>
                    <Select
                      value={hotelData.budgetLevel}
                      onChange={handlePriceRangeChange}
                      options={priceRangeOptions}
                      placeholder="Select budget range"
                      className="text-sm"
                    />
                  </div>

                  {/* Guest Information Display */}
                  {formData?.travelers && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 text-sm">
                        <FaUsers className="text-xs" />
                        <span>
                          <strong>Guests:</strong> {formData.travelers}
                        </span>
                      </div>
                      {formData.startDate && formData.endDate && (
                        <div className="flex items-center gap-2 text-blue-700 text-sm mt-1">
                          <FaCalendarAlt className="text-xs" />
                          <span>
                            <strong>Duration:</strong> {formData.startDate} to{" "}
                            {formData.endDate}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  💡 We'll find the best hotel options matching your preferences
                  and budget in your destination.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hotel Benefits */}
        <div className="brand-card p-5 shadow-lg border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-full">
              <FaHotel className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 text-base mb-2">
                Benefits of including hotels
              </h3>
              <ul className="text-purple-800 text-sm space-y-1 leading-relaxed">
                <li>• Real hotel prices and availability</li>
                <li>• Multiple accommodation options and reviews</li>
                <li>• Integrated into your total trip budget</li>
                <li>• Location-based recommendations near attractions</li>
                <li>• Amenity filtering (WiFi, pool, etc.)</li>
                {userProfile?.accommodationPreference && (
                  <li>
                    • 🏠 Based on your preference:{" "}
                    <strong>{userProfile.accommodationPreference}</strong>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelPreferences;
