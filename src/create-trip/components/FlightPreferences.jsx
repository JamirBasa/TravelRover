import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import Select from "../../components/ui/select";
import { FaPlane, FaMapMarkerAlt, FaInfoCircle, FaCheck } from "react-icons/fa";
import {
  getRegionsByCountry,
  getCitiesByRegion,
} from "../../data/locationData";
import { useMemo } from "react";
import { UserProfileService } from "../../services/userProfileService";

const FlightPreferences = ({ flightData, onFlightDataChange, userProfile }) => {
  // Get profile summary for consistent display
  const profileSummary =
    UserProfileService.getProfileDisplaySummary(userProfile);

  // Auto-populate when flights are enabled and we have profile data
  React.useEffect(() => {
    if (UserProfileService.shouldAutoPopulateFlights(userProfile, flightData)) {
      const autoPopulatedData = UserProfileService.autoPopulateFlightData(
        userProfile,
        flightData
      );

      console.log("✈️ Auto-populating flight data from centralized service");
      onFlightDataChange(autoPopulatedData);
    }
  }, [flightData.includeFlights, userProfile]);

  const regionOptions = useMemo(() => {
    return getRegionsByCountry("PH").map((region) => ({
      value: region.code,
      label: region.name,
    }));
  }, []);

  const cityOptions = useMemo(() => {
    if (!flightData.departureRegionCode) return [];
    return getCitiesByRegion("PH", flightData.departureRegionCode).map(
      (city) => ({
        value: city,
        label: city,
      })
    );
  }, [flightData.departureRegionCode]);

  const handleRegionChange = (e) => {
    const regionCode = e.target.value;
    const regionName = getRegionName("PH", regionCode);

    onFlightDataChange({
      ...flightData,
      departureRegionCode: regionCode,
      departureRegion: regionName,
      departureCity: "",
    });
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    onFlightDataChange({
      ...flightData,
      departureCity: city,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Flight Preferences
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Would you like us to include flight options in your itinerary? ✈️
        </p>
      </div>

      {/* Flight Toggle */}
      <div className="space-y-6">
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaInfoCircle className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Flight Search Feature
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Enable this to get real-time flight prices and recommendations
                included in your travel itinerary. This helps with budget
                planning and booking convenience.
              </p>
            </div>
          </div>
        </div>

        {/* Include Flights Toggle */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={flightData.includeFlights}
              onChange={(e) => {
                const isEnabled = e.target.checked;

                onFlightDataChange({
                  ...flightData,
                  includeFlights: isEnabled,
                  // Auto-populate when enabling flights using centralized service
                  ...(isEnabled
                    ? UserProfileService.autoPopulateFlightData(userProfile, {
                        ...flightData,
                        includeFlights: isEnabled,
                      })
                    : {}),
                });
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <FaPlane className="text-blue-600" />
              <span className="font-medium text-gray-800">
                Include flight search and recommendations
              </span>
            </div>
          </label>

          {flightData.includeFlights && (
            <div className="ml-7 pl-4 border-l-2 border-blue-200 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                {/* Auto-populated indicator */}
                {flightData.departureCity &&
                  profileSummary?.hasLocationData && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <FaCheck className="text-xs" />
                        <span>
                          Auto-populated from your profile:{" "}
                          {profileSummary.location}
                        </span>
                      </div>
                    </div>
                  )}
                <h4 className="font-medium text-gray-800 mb-3">
                  Where will you be departing from?
                </h4>{" "}
                {/* Departure Region */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region/Province
                    </label>
                    <Select
                      value={flightData.departureRegionCode}
                      onChange={handleRegionChange}
                      options={regionOptions}
                      placeholder="Select departure region"
                      className="text-sm"
                    />
                  </div>

                  {/* Departure City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaMapMarkerAlt className="inline mr-1" />
                      Departure City
                    </label>
                    {cityOptions.length > 0 ? (
                      <Select
                        value={flightData.departureCity}
                        onChange={handleCityChange}
                        options={cityOptions}
                        placeholder={
                          !flightData.departureRegionCode
                            ? "Select region first"
                            : "Select departure city"
                        }
                        disabled={!flightData.departureRegionCode}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        value={flightData.departureCity}
                        onChange={(e) =>
                          onFlightDataChange({
                            ...flightData,
                            departureCity: e.target.value,
                          })
                        }
                        placeholder={
                          !flightData.departureRegionCode
                            ? "Select region first"
                            : "Enter departure city"
                        }
                        disabled={!flightData.departureRegionCode}
                        className="text-sm py-2 px-3 rounded-lg border-2 focus:border-black h-auto"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  💡 We'll find the best flight options from your departure city
                  to your destination and include pricing in your itinerary.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Flight Benefits */}
        <div className="brand-card p-5 shadow-lg border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 rounded-full">
              <FaPlane className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900 text-base mb-2">
                Benefits of including flights
              </h3>
              <ul className="text-emerald-800 text-sm space-y-1 leading-relaxed">
                <li>• Real-time flight prices and availability</li>
                <li>• Multiple airline options and recommendations</li>
                <li>• Integrated into your total trip budget</li>
                <li>• Direct booking links for convenience</li>
                <li>• Price level indicators (Low, Fair, High)</li>
                {profileSummary?.hasLocationData && (
                  <li>
                    • 🏠 Using your home location:{" "}
                    <strong>{profileSummary.location}</strong>
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

export default FlightPreferences;
