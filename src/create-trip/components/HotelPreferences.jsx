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
    { 
      value: 1, 
      label: HOTEL_CONFIG.PRICE_LEVELS[1],
      description: "Hostels, fan rooms, basic lodging, shared bathrooms",
      examples: "Backpacker hostels, pension houses, fan rooms"
    },
    { 
      value: 2, 
      label: HOTEL_CONFIG.PRICE_LEVELS[2],
      description: "Budget hotels, air-con, private bath, WiFi",
      examples: "RedDoorz, OYO, budget chains, standard rooms"
    },
    { 
      value: 3, 
      label: HOTEL_CONFIG.PRICE_LEVELS[3],
      description: "Comfortable hotels, pool, restaurant, good amenities",
      examples: "Go Hotels, Summit Hotels, 3-star properties"
    },
    { 
      value: 4, 
      label: HOTEL_CONFIG.PRICE_LEVELS[4],
      description: "Quality hotels, excellent service, business facilities",
      examples: "Microtel, Quest, Seda Hotels, 4-star properties"
    },
    { 
      value: 5, 
      label: HOTEL_CONFIG.PRICE_LEVELS[5],
      description: "Premium resorts, spa, multiple restaurants, luxury",
      examples: "Shangri-La, Marco Polo, Dusit Thani, 5-star"
    },
    { 
      value: 6, 
      label: HOTEL_CONFIG.PRICE_LEVELS[6],
      description: "Ultra-luxury resorts, villas, private beaches",
      examples: "Amanpulo, El Nido Resorts, exclusive properties"
    },
  ];

  const accommodationOptions = [
    { 
      value: "hotel", 
      label: "Hotels",
      icon: "🏨",
      description: "Standard hotels with room service and facilities"
    },
    { 
      value: "resort", 
      label: "Beach/Mountain Resorts",
      icon: "🏖️",
      description: "Full-service resorts with recreational activities"
    },
    { 
      value: "hostel", 
      label: "Hostels & Backpacker Inns",
      icon: "🛏️",
      description: "Budget-friendly, shared or private rooms"
    },
    { 
      value: "aparthotel", 
      label: "Aparthotels/Condotels",
      icon: "🏢",
      description: "Apartment-style with kitchen facilities"
    },
    { 
      value: "guesthouse", 
      label: "Guesthouses & B&Bs",
      icon: "🏡",
      description: "Family-run, homely atmosphere with breakfast"
    },
    { 
      value: "boutique", 
      label: "Boutique Hotels",
      icon: "✨",
      description: "Unique, stylish, personalized service"
    },
  ];

  // Calculate check-in and check-out dates from trip dates
  const getAccommodationDates = () => {
    if (formData?.startDate && formData?.endDate) {
      return {
        checkIn: new Date(formData.startDate).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        checkOut: new Date(formData.endDate).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        nights: Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))
      };
    }
    return null;
  };

  const accommodationDates = getAccommodationDates();

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

                {/* Check-in/Check-out Dates Display */}
                {accommodationDates && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCalendarAlt className="text-sky-600 dark:text-sky-400" />
                      <span className="font-semibold text-sky-900 dark:text-sky-300 text-sm">
                        Accommodation Period
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-sky-200 dark:border-sky-700">
                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Check-in</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {accommodationDates.checkIn}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Standard: 2:00 PM
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-sky-200 dark:border-sky-700">
                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Check-out</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {accommodationDates.checkOut}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Standard: 12:00 PM
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400 font-semibold text-sm">
                        <FaHotel className="text-xs" />
                        {accommodationDates.nights} {accommodationDates.nights === 1 ? 'Night' : 'Nights'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Accommodation Type */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaHotel className="inline mr-1" />
                      Accommodation Type
                    </label>
                    <div className="space-y-2">
                      {accommodationOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() =>
                            onHotelDataChange({
                              ...hotelData,
                              preferredType: option.value,
                            })
                          }
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            hotelData.preferredType === option.value
                              ? 'border-orange-500 dark:border-orange-600 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 shadow-md'
                              : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{option.icon}</span>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 dark:text-gray-200">
                                {option.label}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {option.description}
                              </div>
                            </div>
                            {hotelData.preferredType === option.value && (
                              <FaCheck className="text-orange-500 dark:text-orange-400 mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaStar className="inline mr-1" />
                      Budget Range (Per Night)
                    </label>
                    <div className="space-y-2">
                      {priceRangeOptions.map((option) => {
                        // Calculate price range for total trip
                        const priceMatch = HOTEL_CONFIG.PRICE_LEVELS[option.value].match(/₱[\d,]+-[\d,]+/);
                        let estimatedTotal = 'Contact for pricing';
                        
                        if (priceMatch && accommodationDates) {
                          const prices = priceMatch[0].split('-');
                          const minPrice = parseInt(prices[0].replace(/[₱,]/g, ''));
                          const maxPrice = parseInt(prices[1].replace(/[₱,]/g, ''));
                          const totalMin = minPrice * accommodationDates.nights;
                          const totalMax = maxPrice * accommodationDates.nights;
                          estimatedTotal = `₱${totalMin.toLocaleString()} - ₱${totalMax.toLocaleString()}`;
                        }

                        return (
                          <div
                            key={option.value}
                            onClick={() => {
                              const level = option.value;
                              onHotelDataChange({
                                ...hotelData,
                                budgetLevel: level,
                                priceRange: HOTEL_CONFIG.PRICE_LEVELS[level],
                              });
                            }}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              hotelData.budgetLevel === option.value
                                ? 'border-orange-500 dark:border-orange-600 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 shadow-md'
                                : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                                    {option.label}
                                  </div>
                                  {hotelData.budgetLevel === option.value && (
                                    <FaCheck className="text-orange-500 dark:text-orange-400" />
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {option.description}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                                  Examples: {option.examples}
                                </div>
                                {accommodationDates && priceMatch && (
                                  <div className="mt-2 p-2 bg-sky-50 dark:bg-sky-950/30 rounded border border-sky-200 dark:border-sky-800">
                                    <div className="text-xs text-sky-700 dark:text-sky-400 font-medium">
                                      💰 Total for {accommodationDates.nights} {accommodationDates.nights === 1 ? 'night' : 'nights'}: {estimatedTotal}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Budget Helper Info */}
                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 text-sm">💡</span>
                        <div className="text-xs text-green-800 dark:text-green-300">
                          <div className="font-semibold mb-1">Budget-Saving Tips:</div>
                          <ul className="space-y-0.5 ml-4 list-disc">
                            <li><strong>₱500-1,500:</strong> Perfect for backpackers, hostels with dorms/fan rooms</li>
                            <li><strong>₱1,500-3,500:</strong> Best value - clean budget hotels with A/C</li>
                            <li><strong>₱3,500+:</strong> More comfort and amenities included</li>
                            <li>Book directly for better rates, check promo codes</li>
                            <li>Weekday rates are typically 20-30% cheaper than weekends</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Information Display */}
                  {formData?.travelers && (
                    <div className="mt-4 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <FaUsers className="text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                          Guest Details
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Number of guests:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {formData.travelers}
                          </span>
                        </div>
                        {formData.startDate && formData.endDate && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Trip duration:</span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {accommodationDates?.nights} {accommodationDates?.nights === 1 ? 'night' : 'nights'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Dates:</span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(formData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Helpful Tips */}
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FaInfoCircle className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-900 dark:text-amber-300">
                      <div className="font-semibold mb-1">💡 Accommodation Tips:</div>
                      <ul className="space-y-1 ml-4 list-disc">
                        <li>Check-in time is typically 2:00 PM - 3:00 PM</li>
                        <li>Check-out time is usually 11:00 AM - 12:00 PM</li>
                        <li>Early check-in/late check-out may incur additional charges</li>
                        <li>Budget prices are per room per night, not per person</li>
                        <li>Peak season rates may be 20-50% higher</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Search Info */}
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                  🔍 We'll search for available accommodations matching your preferences in {formData?.location || 'your destination'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelPreferences;
