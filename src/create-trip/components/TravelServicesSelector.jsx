/**
 * Travel Services Selector - Consolidated
 * Combined Flight + Hotel preferences with unified design
 * Reduces information overload, shows only decision-critical details
 */

import React, { useMemo } from "react";
import {
  FaPlane,
  FaHotel,
  FaCheck,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Input } from "../../components/ui/input";
import Select from "../../components/ui/select";
import { UserProfileService } from "../../services/userProfileService";
import {
  getRegionsByCountry,
  getCitiesByRegion,
  getRegionName,
} from "../../data/locationData";
import {
  getFlightRecommendationMessage,
  getAirportStatus,
} from "../../utils/flightRecommendations";
import { getAirportRecommendations } from "../../utils/budgetEstimator";
import { HOTEL_CONFIG } from "../../constants/options";

const TravelServicesSelector = ({
  flightData,
  onFlightDataChange,
  hotelData,
  onHotelDataChange,
  formData,
  userProfile,
}) => {
  const profileSummary =
    UserProfileService.getProfileDisplaySummary(userProfile);

  // Flight logic
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

  // ✅ FIXED: Use useState + useEffect for async airport recommendations
  const [airportInfo, setAirportInfo] = React.useState(null);
  
  React.useEffect(() => {
    if (
      !flightData.includeFlights ||
      !flightData.departureCity ||
      !formData?.location
    ) {
      setAirportInfo(null);
      return;
    }
    
    // Fetch airport recommendations asynchronously
    getAirportRecommendations(
      flightData.departureCity,
      formData.location
    ).then(setAirportInfo);
  }, [flightData.includeFlights, flightData.departureCity, formData?.location]);

  const flightRecommendation = useMemo(() => {
    if (!flightData.includeFlights) return null;
    return getFlightRecommendationMessage({
      departureCity: flightData.departureCity,
      destination: formData?.location,
      startDate: formData?.startDate,
      endDate: formData?.endDate,
      includeFlights: flightData.includeFlights,
      destinationAirportCode: airportInfo?.destination?.code,
    });
  }, [
    flightData.includeFlights,
    flightData.departureCity,
    formData?.location,
    formData?.startDate,
    formData?.endDate,
    airportInfo?.destination?.code,
  ]);

  const destinationAirportStatus = useMemo(() => {
    if (!airportInfo?.destination?.code) return null;
    return getAirportStatus(airportInfo.destination.code);
  }, [airportInfo?.destination?.code]);

  // ✅ NEW: Check if origin city has an airport
  const originAirportStatus = useMemo(() => {
    if (!airportInfo?.origin?.code) return null;
    return getAirportStatus(airportInfo.origin.code);
  }, [airportInfo?.origin?.code]);

  // Hotel options
  const accommodationOptions = [
    { value: "hotel", label: "Hotels", icon: "🏨" },
    { value: "resort", label: "Resorts", icon: "🏖️" },
    { value: "hostel", label: "Hostels", icon: "🛏️" },
    { value: "aparthotel", label: "Aparthotels", icon: "🏢" },
    { value: "guesthouse", label: "Guesthouses", icon: "🏡" },
    { value: "boutique", label: "Boutique", icon: "✨" },
  ];

  const priceRangeOptions = [
    { value: 1, label: "Budget", icon: "💰", desc: "₱500-1.5k/night" },
    { value: 2, label: "Economy", icon: "🏷️", desc: "₱1.5-2.5k/night" },
    { value: 3, label: "Mid-Range", icon: "⭐", desc: "₱2.5-5k/night" },
    { value: 4, label: "Upscale", icon: "✨", desc: "₱5-10k/night" },
    { value: 5, label: "Luxury", icon: "💎", desc: "₱10-20k/night" },
    { value: 6, label: "Ultra-Luxury", icon: "👑", desc: "₱20k+/night" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold brand-gradient-text mb-2">
          Travel Services
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto">
          Select services to include. Your choices affect budget calculations in
          the next step.
        </p>
      </div>

      {/* Side-by-Side Service Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* FLIGHT CARD */}
        <div className="brand-card p-5 border-2 border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all">
          <div
            onClick={() => {
              const isEnabled = !flightData.includeFlights;
              onFlightDataChange({
                ...flightData,
                includeFlights: isEnabled,
                ...(isEnabled
                  ? UserProfileService.autoPopulateFlightData(userProfile, {
                      ...flightData,
                      includeFlights: isEnabled,
                    })
                  : {}),
              });
            }}
            className="flex items-center justify-between mb-4 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-all ${
                  flightData.includeFlights
                    ? "brand-gradient"
                    : "bg-gray-100 dark:bg-slate-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/30"
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
                  className={`font-bold text-base ${
                    flightData.includeFlights
                      ? "brand-gradient-text"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Flight Search
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {flightData.includeFlights ? "Enabled" : "Click to enable"}
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                flightData.includeFlights
                  ? "border-sky-500 bg-sky-500"
                  : "border-gray-300 dark:border-slate-600"
              }`}
            >
              {flightData.includeFlights && (
                <FaCheck className="text-white text-xs" />
              )}
            </div>
          </div>

          {flightData.includeFlights && (
            <div
              key="flight-content"
              className="space-y-3 animate-expand-height"
            >
              {/* Flight Recommendation Alert */}
              {flightRecommendation &&
                flightRecommendation.type !== "optimal" && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs animate-fade-in-scale stagger-1 ${
                      flightRecommendation.type === "same-city"
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                        : "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300"
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                      <span>{flightRecommendation.message}</span>
                    </div>
                  </div>
                )}

              {/* Auto-populated indicator */}
              {flightData.departureCity &&
                profileSummary?.hasLocationData &&
                flightRecommendation?.type !== "same-city" && (
                  <div className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-700 rounded-lg animate-fade-in-scale stagger-1">
                    <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 text-xs">
                      <FaCheck className="text-[10px]" />
                      <span>From profile: {profileSummary.location}</span>
                    </div>
                  </div>
                )}

              {/* Departure Selection */}
              <div className="space-y-2 animate-fade-in-scale stagger-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Departure From
                </label>
                <Select
                  value={flightData.departureRegionCode}
                  onChange={(e) => {
                    const regionCode = e.target.value;
                    const regionName = getRegionName("PH", regionCode);
                    onFlightDataChange({
                      ...flightData,
                      departureRegionCode: regionCode,
                      departureRegion: regionName,
                      departureCity: "",
                    });
                  }}
                  options={regionOptions}
                  placeholder="Select region"
                  className="text-sm !py-2 !h-auto"
                />
                {cityOptions.length > 0 ? (
                  <Select
                    value={flightData.departureCity}
                    onChange={(e) =>
                      onFlightDataChange({
                        ...flightData,
                        departureCity: e.target.value,
                      })
                    }
                    options={cityOptions}
                    placeholder={
                      !flightData.departureRegionCode
                        ? "Select region first"
                        : "Select city"
                    }
                    disabled={!flightData.departureRegionCode}
                    className="text-sm !py-2 !h-auto"
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
                        : "Enter city"
                    }
                    disabled={!flightData.departureRegionCode}
                    className="text-sm !py-2 !h-auto"
                  />
                )}
              </div>

              {/* ✅ NEW: Warning when origin city has no airport */}
              {flightData.departureCity && originAirportStatus?.limited && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-700 animate-fade-in-scale stagger-3">
                  <div className="flex items-start gap-2 text-xs">
                    <FaExclamationTriangle className="flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1 text-amber-800 dark:text-amber-300">
                      <span className="font-semibold">
                        {flightData.departureCity}
                      </span>{" "}
                      has limited/no airport service. You'll need to travel to{" "}
                      {originAirportStatus.info?.alternativeNames?.[0] ||
                        "a nearby city"}{" "}
                      first.
                    </div>
                  </div>
                </div>
              )}

              {/* Airport Route Info */}
              {airportInfo &&
                formData?.location &&
                flightData.departureCity &&
                destinationAirportStatus?.hasService && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-700 animate-fade-in-scale stagger-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <FaPlane className="flex-shrink-0" />
                      <span className="font-semibold">
                        {airportInfo.departure?.code || "---"} →{" "}
                        {airportInfo.destination?.code || "---"}
                      </span>
                      {airportInfo?.nonstopAvailableFromDeparture && (
                        <span className="text-[10px]">• Nonstop available</span>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* HOTEL CARD */}
        <div className="brand-card p-5 border-2 border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all">
          <div
            onClick={() =>
              onHotelDataChange({
                ...hotelData,
                includeHotels: !hotelData.includeHotels,
              })
            }
            className="flex items-center justify-between mb-4 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-all ${
                  hotelData.includeHotels
                    ? "bg-gradient-to-br from-orange-500 to-amber-600"
                    : "bg-gray-100 dark:bg-slate-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/30"
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
                  className={`font-bold text-base ${
                    hotelData.includeHotels
                      ? "text-orange-900 dark:text-orange-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Hotel Search
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hotelData.includeHotels ? "Enabled" : "Click to enable"}
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                hotelData.includeHotels
                  ? "border-orange-500 bg-orange-500"
                  : "border-gray-300 dark:border-slate-600"
              }`}
            >
              {hotelData.includeHotels && (
                <FaCheck className="text-white text-xs" />
              )}
            </div>
          </div>

          {hotelData.includeHotels && (
            <div
              key="hotel-content"
              className="space-y-3 animate-expand-height"
            >
              {/* Auto-populated indicator */}
              {hotelData.preferredType &&
                profileSummary?.accommodationPreference ===
                  hotelData.preferredType && (
                  <div className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-700 rounded-lg animate-fade-in-scale stagger-1">
                    <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 text-xs">
                      <FaCheck className="text-[10px]" />
                      <span>
                        From profile: {profileSummary.accommodationPreference}
                      </span>
                    </div>
                  </div>
                )}

              {/* Accommodation Type - Compact Grid */}
              <div className="animate-fade-in-scale stagger-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Accommodation Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {accommodationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        onHotelDataChange({
                          ...hotelData,
                          preferredType: option.value,
                        })
                      }
                      className={`p-2 rounded-lg border-2 text-center transition-all text-xs cursor-pointer ${
                        hotelData.preferredType === option.value
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 font-semibold"
                          : "border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700"
                      }`}
                    >
                      <div className="text-lg mb-0.5">{option.icon}</div>
                      <div className="text-[10px] font-medium">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range - Compact Grid */}
              <div className="animate-fade-in-scale stagger-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Budget Level{" "}
                  {formData?.location && (
                    <span className="text-sky-600 dark:text-sky-400 font-normal">
                      • {formData.location}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {priceRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        onHotelDataChange({
                          ...hotelData,
                          budgetLevel: option.value,
                        })
                      }
                      className={`p-2 rounded-lg border-2 text-left transition-all cursor-pointer ${
                        hotelData.budgetLevel === option.value
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                          : "border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{option.icon}</span>
                        <span className="text-xs font-semibold">
                          {option.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        {option.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-2 border-sky-200 dark:border-sky-700 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-lg">
            <FaInfoCircle className="text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-sky-900 dark:text-sky-300 leading-relaxed">
              <strong>Next Step:</strong> We'll calculate your personalized
              budget based on these services, your destination, and trip
              duration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelServicesSelector;
