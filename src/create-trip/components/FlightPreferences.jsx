import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import Select from "../../components/ui/select";
import { FaPlane, FaMapMarkerAlt, FaInfoCircle, FaCheck } from "react-icons/fa";
import {
  getRegionsByCountry,
  getCitiesByRegion,
  getRegionName,
} from "../../data/locationData";
import { useMemo } from "react";

const FlightPreferences = ({ flightData, onFlightDataChange, userProfile }) => {
  // Debug log to see what we're receiving
  React.useEffect(() => {
    if (userProfile) {
      const profileRegionCode =
        userProfile.address?.regionCode || userProfile.address?.region;
      const regionName = getRegionName("PH", profileRegionCode);

      console.log("🔍 FlightPreferences received userProfile:", {
        address: userProfile.address,
        city: userProfile.address?.city,
        region: userProfile.address?.region,
        regionCode: userProfile.address?.regionCode,
        "🔧 FIXED - profileRegionCode": profileRegionCode,
        "🔧 FIXED - regionName": regionName,
        "✅ Will auto-populate":
          !!profileRegionCode && !!userProfile.address?.city,
      });
    }
  }, [userProfile]);

  // Set default departure location from user profile
  // Fix: Handle both possible data structures (regionCode vs region containing the code)
  const defaultDepartureCity = userProfile?.address?.city || "";
  const defaultDepartureRegionCode =
    userProfile?.address?.regionCode || userProfile?.address?.region || "";

  // Get the region name from the code
  const defaultDepartureRegionName = defaultDepartureRegionCode
    ? getRegionName("PH", defaultDepartureRegionCode)
    : "";

  // Auto-populate when flights are enabled and we have profile data
  React.useEffect(() => {
    const profileRegionCode =
      userProfile?.address?.regionCode || userProfile?.address?.region;

    if (
      flightData.includeFlights &&
      userProfile?.address?.city &&
      profileRegionCode &&
      !flightData.departureCity &&
      !flightData.departureRegionCode
    ) {
      const regionName = getRegionName("PH", profileRegionCode);

      console.log("✈️ Auto-populating flight data on enable:", {
        city: userProfile.address.city,
        regionCode: profileRegionCode,
        regionName: regionName,
        originalData: userProfile.address,
      });

      onFlightDataChange({
        ...flightData,
        departureCity: userProfile.address.city,
        departureRegionCode: profileRegionCode,
        departureRegion: regionName,
      });
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
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Flight Preferences
        </h2>
        <p className="text-gray-600 text-sm">
          Would you like us to include flight options in your itinerary?
        </p>
      </div>

      {/* Flight Toggle */}
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">
                Flight Search Feature
              </h3>
              <p className="text-blue-700 text-sm">
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
                  // Auto-populate when enabling flights
                  ...(isEnabled &&
                  userProfile?.address?.city &&
                  !flightData.departureCity
                    ? (() => {
                        const profileRegionCode =
                          userProfile.address.regionCode ||
                          userProfile.address.region;
                        const regionName = getRegionName(
                          "PH",
                          profileRegionCode
                        );

                        return {
                          departureCity: userProfile.address.city,
                          departureRegionCode: profileRegionCode,
                          departureRegion: regionName,
                        };
                      })()
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
                  userProfile?.address?.city === flightData.departureCity && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <FaCheck className="text-xs" />
                        <span>Auto-populated from your profile</span>
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">
            Benefits of including flights:
          </h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Real-time flight prices and availability</li>
            <li>• Multiple airline options and recommendations</li>
            <li>• Integrated into your total trip budget</li>
            <li>• Direct booking links for convenience</li>
            <li>• Price level indicators (Low, Fair, High)</li>
            {userProfile?.address?.city && (
              <li>
                • 🏠 Using your home location:{" "}
                <strong>
                  {userProfile.address.city},{" "}
                  {getRegionName(
                    "PH",
                    userProfile.address?.regionCode ||
                      userProfile.address?.region
                  ) ||
                    userProfile.address?.region ||
                    "Unknown Region"}
                </strong>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FlightPreferences;
