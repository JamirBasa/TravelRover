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
import { UserProfileService } from "../../services/userProfileService";

const HotelPreferences = ({
  hotelData,
  onHotelDataChange,
  formData,
  userProfile,
}) => {
  // Get profile summary for consistent display
  const profileSummary =
    UserProfileService.getProfileDisplaySummary(userProfile);

  // Auto-populate hotel preferences when enabled using centralized service
  useEffect(() => {
    if (UserProfileService.shouldAutoPopulateHotels(userProfile, hotelData)) {
      const autoPopulatedData = UserProfileService.autoPopulateHotelData(
        userProfile,
        hotelData
      );

      console.log(
        "🏨 Auto-populating hotel preferences from centralized service"
      );
      onHotelDataChange(autoPopulatedData);
    }
  }, [hotelData.includeHotels, userProfile]);

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
        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
          Would you like us to include hotel recommendations in your itinerary?
          🏨
        </p>
      </div>

      {/* Hotel Toggle */}
      <div className="space-y-6">
        <div className="brand-card p-5 shadow-lg border-sky-200 dark:border-sky-800">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaInfoCircle className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Hotel Search Feature
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Enable this to get real hotel recommendations with pricing,
                ratings, and availability for your destination. Helps with
                accommodation planning and booking.
              </p>
            </div>
          </div>
        </div>

        {/* Include Hotels Toggle */}
        <div className="space-y-4">
          <div
            onClick={() => {
              const isEnabled = !hotelData.includeHotels;

              onHotelDataChange({
                ...hotelData,
                includeHotels: isEnabled,
                // Auto-populate when enabling hotels using centralized service
                ...(isEnabled
                  ? UserProfileService.autoPopulateHotelData(userProfile, {
                      ...hotelData,
                      includeHotels: isEnabled,
                    })
                  : {}),
              });
            }}
            className={`brand-card p-5 cursor-pointer transition-all duration-200 border-2 hover:shadow-lg ${
              hotelData.includeHotels
                ? "border-orange-500 dark:border-orange-600 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30"
                : "border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-full transition-all ${
                    hotelData.includeHotels
                      ? "bg-gradient-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700"
                      : "bg-gray-100 dark:bg-slate-800"
                  }`}
                >
                  <FaHotel
                    className={`text-lg ${
                      hotelData.includeHotels
                        ? "text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-semibold text-base ${
                      hotelData.includeHotels
                        ? "text-orange-900 dark:text-orange-300"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Include Hotel Search
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {hotelData.includeHotels
                      ? "Hotel preferences enabled"
                      : "Click to enable hotel search"}
                  </p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  hotelData.includeHotels
                    ? "border-orange-500 dark:border-orange-600 bg-orange-500 dark:bg-orange-600"
                    : "border-gray-300 dark:border-slate-600"
                }`}
              >
                {hotelData.includeHotels && (
                  <FaCheck className="text-white text-xs" />
                )}
              </div>
            </div>
          </div>

          {hotelData.includeHotels && (
            <div className="ml-7 pl-4 border-l-2 border-orange-200 dark:border-orange-800 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg">
                {/* Auto-populated indicator */}
                {hotelData.preferredType &&
                  profileSummary?.accommodationPreference ===
                    hotelData.preferredType && (
                    <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                        <FaCheck className="text-xs" />
                        <span>
                          Auto-populated from your profile:{" "}
                          {profileSummary.accommodationPreference}
                        </span>
                      </div>
                    </div>
                  )}

                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  What type of accommodation do you prefer?
                </h4>

                {/* Accommodation Type */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
                        <FaUsers className="text-xs" />
                        <span>
                          <strong>Guests:</strong> {formData.travelers}
                        </span>
                      </div>
                      {formData.startDate && formData.endDate && (
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm mt-1">
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

                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  💡 We'll find the best hotel options matching your preferences
                  and budget in your destination.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hotel Benefits */}
        <div className="brand-card p-5 shadow-lg border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaHotel className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Benefits of including hotels
              </h3>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 leading-relaxed">
                <li>• Real hotel prices and availability</li>
                <li>• Multiple accommodation options and reviews</li>
                <li>• Integrated into your total trip budget</li>
                <li>• Location-based recommendations near attractions</li>
                <li>• Amenity filtering (WiFi, pool, etc.)</li>
                {profileSummary?.accommodationPreference && (
                  <li>
                    • 🏠 Based on your preference:{" "}
                    <strong>{profileSummary.accommodationPreference}</strong>
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
