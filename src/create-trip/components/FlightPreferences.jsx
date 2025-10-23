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
  getAirportStatus, // Import the new function
} from "../../utils/flightRecommendations";
import { getAirportRecommendations } from "../../utils/budgetEstimator";

const FlightPreferences = ({
  flightData,
  onFlightDataChange,
  userProfile,
  formData,
}) => {
  // Get profile summary for consistent display
  const profileSummary =
    UserProfileService.getProfileDisplaySummary(userProfile);

  // Get airport recommendations for intelligent routing
  const airportInfo = useMemo(() => {
    if (
      !flightData.includeFlights ||
      !flightData.departureCity ||
      !formData?.location
    )
      return null;

    return getAirportRecommendations(
      flightData.departureCity,
      formData.location
    );
  }, [flightData.includeFlights, flightData.departureCity, formData?.location]);

  // Get smart flight recommendations - PASS AIRPORT CODE
  const flightRecommendation = useMemo(() => {
    if (!flightData.includeFlights) return null;

    return getFlightRecommendationMessage({
      departureCity: flightData.departureCity,
      destination: formData?.location,
      startDate: formData?.startDate,
      endDate: formData?.endDate,
      includeFlights: flightData.includeFlights,
      destinationAirportCode: airportInfo?.destination?.code, // ✅ ADD THIS
    });
  }, [
    flightData.includeFlights,
    flightData.departureCity,
    formData?.location,
    formData?.startDate,
    formData?.endDate,
    airportInfo?.destination?.code, // ✅ ADD THIS DEPENDENCY
  ]);

  // Get contextual tips - PASS AIRPORT CODE
  const contextTips = useMemo(() => {
    if (!flightData.includeFlights || !flightData.departureCity) return [];

    return getFlightContextTips({
      departureCity: flightData.departureCity,
      destination: formData?.location,
      startDate: formData?.startDate,
      endDate: formData?.endDate,
      duration: formData?.duration,
      destinationAirportCode: airportInfo?.destination?.code, // ✅ ADD THIS
    });
  }, [
    flightData.includeFlights,
    flightData.departureCity,
    formData?.location,
    formData?.startDate,
    formData?.endDate,
    formData?.duration,
    airportInfo?.destination?.code, // ✅ ADD THIS DEPENDENCY
  ]);

  // ✅ ADD: Check if destination airport has service
  const destinationAirportStatus = useMemo(() => {
    if (!airportInfo?.destination?.code) return null;
    return getAirportStatus(airportInfo.destination.code);
  }, [airportInfo?.destination?.code]);

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
                        : flightRecommendation.type === "limited-service" ||
                          flightRecommendation.type === "no-direct-flights"
                        ? "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800"
                        : flightRecommendation.type === "remote-destination"
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800"
                        : "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {flightRecommendation.type === "same-city" ||
                      flightRecommendation.type === "limited-service" ||
                      flightRecommendation.type === "no-direct-flights" ? (
                        <FaExclamationTriangle
                          className={`text-sm mt-0.5 flex-shrink-0 ${
                            flightRecommendation.type === "same-city"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-orange-600 dark:text-orange-400"
                          }`}
                        />
                      ) : (
                        <FaInfoCircle className="text-blue-600 dark:text-blue-400 text-sm mt-0.5 flex-shrink-0" />
                      )}
                      <p
                        className={`text-sm ${
                          flightRecommendation.type === "same-city"
                            ? "text-amber-800 dark:text-amber-300"
                            : flightRecommendation.type === "limited-service" ||
                              flightRecommendation.type === "no-direct-flights"
                            ? "text-orange-800 dark:text-orange-300"
                            : "text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {flightRecommendation.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Auto-populated indicator - Only show if not same city */}
                {flightData.departureCity &&
                  profileSummary?.hasLocationData &&
                  flightRecommendation?.type !== "same-city" && (
                    <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                        <FaCheck className="text-xs" />
                        <span>
                          From your profile: {profileSummary.location}
                        </span>
                      </div>
                    </div>
                  )}

                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Where will you be departing from?
                </h4>

                {/* Departure Region & City */}
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

                {/* ✅ UPDATED: Only show airport info if destination has commercial service */}
                {airportInfo &&
                  formData?.location &&
                  flightData.departureCity &&
                  destinationAirportStatus?.hasService && ( // ✅ ADD THIS CHECK
                    <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-start gap-2">
                        <FaPlane className="text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          {/* Flight Route */}
                          <div>
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                              Flight Route:{" "}
                              {airportInfo.departure?.code || "---"} →{" "}
                              {airportInfo.destination?.code || "---"}
                            </p>
                          </div>

                          {/* Destination Airport Info */}
                          {airportInfo.destination && (
                            <div className="text-xs text-emerald-700 dark:text-emerald-400">
                              {airportInfo?.nonstopAvailableFromDeparture ? (
                                <p>
                                  ✈️ Nonstop available to{" "}
                                  <span className="font-medium">
                                    {formData.location}
                                  </span>
                                </p>
                              ) : (
                                <p>
                                  🧭 Direct flight to{" "}
                                  <span className="font-medium">
                                    {airportInfo.destination.city} (
                                    {airportInfo.destination.code})
                                  </span>
                                  . Connection may be required.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Fallback helper text */}
                {!airportInfo && flightData.departureCity && (
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span>💡</span>
                    <span>
                      We'll find the best flight options and include pricing in
                      your itinerary.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightPreferences;
