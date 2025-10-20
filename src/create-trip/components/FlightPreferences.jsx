import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import Select from "../../components/ui/select";
import {
  FaPlane,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  getRegionsByCountry,
  getCitiesByRegion,
  getRegionName,
} from "../../data/locationData";
import { useMemo } from "react";
import { UserProfileService } from "../../services/userProfileService";
import {
  getFlightRecommendationMessage,
  getFlightContextTips,
} from "../../utils/flightRecommendations";

const FlightPreferences = ({
  flightData,
  onFlightDataChange,
  userProfile,
  formData,
}) => {
  // Get profile summary for consistent display
  const profileSummary =
    UserProfileService.getProfileDisplaySummary(userProfile);

  // Get smart flight recommendations
  const flightRecommendation = useMemo(() => {
    if (!flightData.includeFlights) return null;

    return getFlightRecommendationMessage({
      departureCity: flightData.departureCity,
      destination: formData?.location,
      startDate: formData?.startDate,
      endDate: formData?.endDate,
      includeFlights: flightData.includeFlights,
    });
  }, [
    flightData.includeFlights,
    flightData.departureCity,
    formData?.location,
    formData?.startDate,
    formData?.endDate,
  ]);

  // Get contextual tips
  const contextTips = useMemo(() => {
    if (!flightData.includeFlights || !flightData.departureCity) return [];

    return getFlightContextTips({
      departureCity: flightData.departureCity,
      destination: formData?.location,
      startDate: formData?.startDate,
      endDate: formData?.endDate,
      duration: formData?.duration,
    });
  }, [
    flightData.includeFlights,
    flightData.departureCity,
    formData?.location,
    formData?.startDate,
    formData?.endDate,
    formData?.duration,
  ]);

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
        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
          Would you like us to include flight options in your itinerary? ✈️
        </p>
      </div>

      {/* Flight Toggle */}
      <div className="space-y-6">
        <div className="brand-card p-5 shadow-lg border-sky-200 dark:border-sky-800">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaInfoCircle className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Flight Search Feature
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Enable this to get real-time flight prices and recommendations
                included in your travel itinerary. This helps with budget
                planning and booking convenience.
              </p>
            </div>
          </div>
        </div>

        {/* Include Flights Toggle */}
        <div className="space-y-4">
          <div
            onClick={() => {
              const isEnabled = !flightData.includeFlights;

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
            className={`brand-card p-5 cursor-pointer transition-all duration-200 border-2 hover:shadow-lg ${
              flightData.includeFlights
                ? "border-blue-500 dark:border-blue-600 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30"
                : "border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-full transition-all ${
                    flightData.includeFlights
                      ? "brand-gradient"
                      : "bg-gray-100 dark:bg-slate-800"
                  }`}
                >
                  <FaPlane
                    className={`text-lg ${
                      flightData.includeFlights
                        ? "text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-semibold text-base ${
                      flightData.includeFlights
                        ? "brand-gradient-text"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Include Flight Search
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {flightData.includeFlights
                      ? "Flight preferences enabled"
                      : "Click to enable flight search"}
                  </p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  flightData.includeFlights
                    ? "border-blue-500 dark:border-blue-600 bg-blue-500 dark:bg-blue-600"
                    : "border-gray-300 dark:border-slate-600"
                }`}
              >
                {flightData.includeFlights && (
                  <FaCheck className="text-white text-xs" />
                )}
              </div>
            </div>
          </div>

          {flightData.includeFlights && (
            <div className="ml-7 pl-4 border-l-2 border-blue-200 dark:border-blue-800 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg">
                {/* Smart Flight Recommendations */}
                {flightRecommendation && (
                  <div
                    className={`mb-3 p-3 rounded-lg border ${
                      flightRecommendation.type === "same-city"
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                        : flightRecommendation.type === "remote-destination"
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800"
                        : "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {flightRecommendation.type === "same-city" ? (
                        <FaExclamationTriangle className="text-amber-600 dark:text-amber-400 text-sm mt-0.5 flex-shrink-0" />
                      ) : (
                        <FaInfoCircle className="text-blue-600 dark:text-blue-400 text-sm mt-0.5 flex-shrink-0" />
                      )}
                      <p
                        className={`text-sm ${
                          flightRecommendation.type === "same-city"
                            ? "text-amber-800 dark:text-amber-300"
                            : "text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {flightRecommendation.message}
                      </p>
                    </div>
                  </div>
                )}
                {/* Auto-populated indicator */}
                {flightData.departureCity &&
                  profileSummary?.hasLocationData &&
                  flightRecommendation?.type !== "same-city" && (
                    <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                        <FaCheck className="text-xs" />
                        <span>
                          Auto-populated from your profile:{" "}
                          {profileSummary.location}
                        </span>
                      </div>
                    </div>
                  )}
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Where will you be departing from?
                </h4>{" "}
                {/* Departure Region */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="text-sm py-2 px-3 rounded-lg border-2 focus:border-black dark:focus:border-sky-500 h-auto dark:bg-slate-900 dark:text-white dark:border-slate-600"
                      />
                    )}
                  </div>
                </div>
                {/* Contextual Tips */}
                {contextTips.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="space-y-1">
                      {contextTips.map((tip, index) => (
                        <p
                          key={index}
                          className="text-xs text-blue-700 dark:text-blue-300"
                        >
                          {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {contextTips.length === 0 && (
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    💡 We'll find the best flight options from your departure
                    city to your destination and include pricing in your
                    itinerary.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Flight Benefits */}
        <div className="brand-card p-5 shadow-lg border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 p-2.5 rounded-full">
              <FaPlane className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 text-base mb-2">
                Benefits of including flights
              </h3>
              <ul className="text-emerald-800 dark:text-emerald-400 text-sm space-y-1 leading-relaxed">
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
