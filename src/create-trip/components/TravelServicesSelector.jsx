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
import {
  determineTransportMode,
  TRANSPORT_MODE,
  getTransportModeIcon,
  getTransportModeLabel,
} from "../../utils/transportModeDetector";

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

  // ✅ ENHANCED: Analyze transport mode based on route (with backend API)
  const [transportAnalysis, setTransportAnalysis] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // ✅ NEW: Detect same-city scenario for special handling
  const isSameCity = useMemo(() => {
    if (!formData?.location || !flightData.departureCity) return false;

    const normalizeCity = (city) =>
      city
        .toLowerCase()
        .trim()
        .split(",")[0] // Extract city from "City, Province, Country"
        .replace(/\s+/g, " ")
        .replace(/\b(city|metro|province)\b/gi, "")
        .trim();

    const dest = normalizeCity(formData.location);
    const depart = normalizeCity(flightData.departureCity);

    return dest === depart;
  }, [formData?.location, flightData.departureCity]);

  // ✅ FIXED: Analyze transport without causing parent re-renders
  React.useEffect(() => {
    if (!formData?.location || !flightData.departureCity) {
      setTransportAnalysis(null);
      setIsAnalyzing(false);
      return;
    }

    // Use async version with backend API
    const analyzeTransport = async () => {
      setIsAnalyzing(true);
      try {
        // Import async version dynamically
        const { determineTransportModeAsync } = await import(
          "../../utils/transportModeDetector"
        );
        const result = await determineTransportModeAsync(
          formData.location,
          flightData.departureCity,
          flightData.includeFlights,
          true // Use backend API
        );
        setTransportAnalysis(result);
      } catch (error) {
        console.error("Transport mode analysis error:", error);
        // Fallback to synchronous version
        const result = determineTransportMode(
          formData.location,
          flightData.departureCity,
          flightData.includeFlights
        );
        setTransportAnalysis(result);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeTransport();
  }, [formData?.location, flightData.departureCity, flightData.includeFlights]);

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
    getAirportRecommendations(flightData.departureCity, formData.location).then(
      setAirportInfo
    );
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
    { value: 2, label: "Economy", icon: "🏷️", desc: "₱1.5-3.5k/night" },
    { value: 3, label: "Mid-Range", icon: "⭐", desc: "₱3.5-8k/night" },
    { value: 4, label: "Upscale", icon: "✨", desc: "₱8-15k/night" },
    { value: 5, label: "Luxury", icon: "💎", desc: "₱15-30k/night" },
    { value: 6, label: "Ultra-Luxury", icon: "👑", desc: "₱30k+/night" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-2">
          Travel Services
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Choose services to include in your trip.
        </p>
      </div>

      {/* ✅ SMART: Show Local Trip Banner for Same-City, Transport Analysis for Inter-City */}
      {formData?.location &&
        flightData.departureCity &&
        (isSameCity ? (
          // 🏙️ LOCAL TRIP BANNER (Same City)
          <div className="brand-card p-4 border-2 border-indigo-300 dark:border-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">🏙️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-base text-indigo-900 dark:text-indigo-200">
                    Local Experience in {formData.location.split(",")[0]}
                  </h3>
                  <span className="px-1.5 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-[10px] font-semibold rounded text-indigo-800 dark:text-indigo-200">
                    Staycation
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  Perfect for exploring your own city! No inter-city travel
                  needed.
                </p>
                <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                  <span>✓ Focus on local activities</span>
                  <span className="text-gray-400">•</span>
                  <span>✓ Consider staycation hotels</span>
                  <span className="text-gray-400">•</span>
                  <span>✓ Use taxis/Grab for transport</span>
                </div>
              </div>
            </div>
          </div>
        ) : transportAnalysis ? (
          // 🚌 TRANSPORT ANALYSIS BANNER (Inter-City)
          <div
            className={`brand-card p-4 border-2 mb-6 ${
              transportAnalysis.groundTransport?.preferred === true &&
              !transportAnalysis.recommendation
                ?.toLowerCase()
                .includes("not recommended")
                ? "border-emerald-400 dark:border-emerald-600 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30"
                : transportAnalysis.mode === "flight_required" ||
                  transportAnalysis.groundTransportNotice?.available ||
                  transportAnalysis.recommendation
                    ?.toLowerCase()
                    .includes("not recommended")
                ? "border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
                : "border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">
                {transportAnalysis.groundTransport?.preferred === true &&
                !transportAnalysis.recommendation
                  ?.toLowerCase()
                  .includes("not recommended")
                  ? transportAnalysis.groundTransport?.hasFerry
                    ? "⛴️"
                    : "🚌"
                  : transportAnalysis.mode === "flight_required" ||
                    transportAnalysis.groundTransportNotice?.available ||
                    transportAnalysis.recommendation
                      ?.toLowerCase()
                      .includes("not recommended")
                  ? "✈️"
                  : getTransportModeIcon(transportAnalysis.mode)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3
                    className={`font-bold text-base ${
                      transportAnalysis.groundTransport?.preferred === true &&
                      !transportAnalysis.recommendation
                        ?.toLowerCase()
                        .includes("not recommended")
                        ? "text-emerald-900 dark:text-emerald-200"
                        : transportAnalysis.mode === "flight_required" ||
                          transportAnalysis.groundTransportNotice?.available ||
                          transportAnalysis.recommendation
                            ?.toLowerCase()
                            .includes("not recommended")
                        ? "text-amber-900 dark:text-amber-200"
                        : "brand-gradient-text"
                    }`}
                  >
                    {transportAnalysis.groundTransport?.preferred === true &&
                    !transportAnalysis.recommendation
                      ?.toLowerCase()
                      .includes("not recommended")
                      ? transportAnalysis.groundTransport?.hasFerry
                        ? "Ferry Recommended"
                        : "Ground Transport Recommended"
                      : transportAnalysis.mode === "flight_required" ||
                        transportAnalysis.groundTransportNotice?.available ||
                        transportAnalysis.recommendation
                          ?.toLowerCase()
                          .includes("not recommended")
                      ? "Air Travel Recommended"
                      : `${getTransportModeLabel(
                          transportAnalysis.mode
                        )} Recommended`}
                  </h3>
                  {transportAnalysis.groundTransport?.preferred === true &&
                    !transportAnalysis.recommendation
                      ?.toLowerCase()
                      .includes("not recommended") && (
                      <span className="px-1.5 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-[10px] font-semibold rounded text-emerald-800 dark:text-emerald-200">
                        Best Option
                      </span>
                    )}
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                  {transportAnalysis.groundTransport?.hasFerry
                    ? `Ferry service available from ${
                        flightData.departureCity || "your location"
                      } to ${
                        formData?.location?.split(",")[0] || "your destination"
                      }. This is the most practical and scenic option for this route.`
                    : transportAnalysis.recommendation}
                </p>

                {/* ✅ ENHANCED Ground Transport Details - With Confidence & Ferry Info */}
                {/* 🔧 FIX: Only show when TRULY preferred AND recommendation doesn't say "not recommended" */}
                {transportAnalysis.groundTransport?.available &&
                  transportAnalysis.groundTransport?.preferred === true &&
                  !transportAnalysis.recommendation
                    ?.toLowerCase()
                    .includes("not recommended") && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ⏱️
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {transportAnalysis.groundTransport.travelTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            💰
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {transportAnalysis.groundTransport.cost}
                          </span>
                        </div>

                        {/* ✅ NEW: Ferry indicator */}
                        {transportAnalysis.groundTransport.hasFerry && (
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600 dark:text-blue-400">
                              ⛴️
                            </span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              Ferry
                            </span>
                          </div>
                        )}

                        {/* ✅ ENHANCED: Show multiple operators for ferries */}
                        {transportAnalysis.groundTransport.operators?.length >
                          0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {transportAnalysis.groundTransport.hasFerry
                                ? "🚢"
                                : "🚌"}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {transportAnalysis.groundTransport.operators
                                .length > 1
                                ? `${
                                    transportAnalysis.groundTransport
                                      .operators[0]
                                  } +${
                                    transportAnalysis.groundTransport.operators
                                      .length - 1
                                  } more`
                                : transportAnalysis.groundTransport
                                    .operators[0]}
                            </span>
                          </div>
                        )}

                        {transportAnalysis.groundTransport.scenic && (
                          <span className="text-blue-600 dark:text-blue-400">
                            ✨ Scenic
                          </span>
                        )}
                      </div>

                      {/* ✅ NEW: Confidence Indicator Badge */}
                      {(transportAnalysis.groundTransport.calculated ||
                        transportAnalysis.source === "backend") && (
                        <div className="flex items-center gap-2">
                          {transportAnalysis.groundTransport.calculated ? (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-semibold rounded flex items-center gap-1">
                              📊 Estimated Route
                              {transportAnalysis.groundTransport.confidence && (
                                <span className="text-[9px]">
                                  (
                                  {transportAnalysis.groundTransport.confidence}{" "}
                                  confidence)
                                </span>
                              )}
                            </span>
                          ) : transportAnalysis.source === "backend" ? (
                            <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 text-[10px] font-semibold rounded flex items-center gap-1">
                              ✓ Verified Route
                            </span>
                          ) : null}
                        </div>
                      )}

                      {/* ✅ NEW: Show all ferry operators if available */}
                      {transportAnalysis.groundTransport.hasFerry &&
                        transportAnalysis.groundTransport.operators?.length >
                          1 && (
                          <p className="text-[10px] text-gray-600 dark:text-gray-400">
                            <strong>Ferry Operators:</strong>{" "}
                            {transportAnalysis.groundTransport.operators.join(
                              ", "
                            )}
                          </p>
                        )}
                    </div>
                  )}

                {/* 🔧 NEW: Ground Transport Notice Details (for flight_required routes) */}
                {transportAnalysis.groundTransportNotice?.available && (
                  <div className="space-y-2 border-t border-amber-200 dark:border-amber-800 pt-3 mt-2">
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-600 dark:text-amber-400">
                          ⏱️
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {transportAnalysis.groundTransportNotice.travelTime ||
                            transportAnalysis.groundTransportNotice.travel_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-600 dark:text-amber-400">
                          💰
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {typeof transportAnalysis.groundTransportNotice
                            .cost === "object"
                            ? `₱${transportAnalysis.groundTransportNotice.cost.min}-${transportAnalysis.groundTransportNotice.cost.max}`
                            : transportAnalysis.groundTransportNotice.cost}
                        </span>
                      </div>

                      {/* Show operators if available */}
                      {transportAnalysis.groundTransportNotice.operators
                        ?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600 dark:text-amber-400">
                            🚌
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {
                              transportAnalysis.groundTransportNotice
                                .operators[0]
                            }
                          </span>
                        </div>
                      )}

                      {/* Verified badge */}
                      <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 text-[10px] font-semibold rounded flex items-center gap-1">
                        ✓ Verified Route
                      </span>
                    </div>

                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      ⚠️{" "}
                      {transportAnalysis.groundTransportNotice.warning ||
                        "Ground transport available but not ideal - very long travel time"}
                    </p>

                    {/* Show helpful tip for overnight buses */}
                    {transportAnalysis.groundTransportNotice
                      .has_overnight_option && (
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        💡 Tip:{" "}
                        {transportAnalysis.groundTransportNotice.notes ||
                          "Overnight bus travel available. Sleep during journey, arrive refreshed. More time-efficient than connecting flights with 2-4hr layovers."}
                      </p>
                    )}
                  </div>
                )}

                {transportAnalysis.warning &&
                  !transportAnalysis.groundTransportNotice && (
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                      ⚠️{" "}
                      {transportAnalysis.groundTransport?.hasFerry
                        ? `Ferry travel takes ${
                            transportAnalysis.groundTransport?.travelTime ||
                            "8-12 hours"
                          }. Consider booking overnight ferry for comfortable journey, or plan to arrive the next day.`
                        : transportAnalysis.warning}
                    </p>
                  )}
              </div>
            </div>
          </div>
        ) : null)}

      {/* Side-by-Side Service Cards - RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FLIGHT CARD */}
        <div
          className={`brand-card p-5 border-2 transition-all relative ${
            isSameCity
              ? "border-gray-300 dark:border-slate-600 opacity-60 cursor-not-allowed"
              : "border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600"
          }`}
        >
          {/* Same-city notice */}
          {isSameCity && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-gray-200 dark:bg-slate-700 text-[10px] font-semibold text-gray-700 dark:text-gray-300 rounded">
              Not needed
            </div>
          )}
          <div
            onClick={() => {
              if (isSameCity) return; // Prevent toggling for same-city
              const isEnabled = !flightData.includeFlights;
              onFlightDataChange({
                ...flightData,
                includeFlights: isEnabled,
                transportAnalysis: transportAnalysis, // ✅ Pass current analysis
                ...(isEnabled
                  ? UserProfileService.autoPopulateFlightData(userProfile, {
                      ...flightData,
                      includeFlights: isEnabled,
                    })
                  : {}),
              });
            }}
            className={`flex items-center justify-between mb-4 ${
              !isSameCity ? "cursor-pointer group" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-all ${
                  flightData.includeFlights && !isSameCity
                    ? "brand-gradient"
                    : "bg-gray-100 dark:bg-slate-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/30"
                }`}
              >
                <FaPlane
                  className={`text-lg ${
                    flightData.includeFlights && !isSameCity
                      ? "text-white"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`font-bold text-base ${
                    flightData.includeFlights && !isSameCity
                      ? "brand-gradient-text"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {isSameCity ? "Flights" : "Transport Options"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isSameCity
                    ? "Not needed for local trip"
                    : flightData.includeFlights
                    ? "Enabled"
                    : "Click to search"}
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                flightData.includeFlights && !isSameCity
                  ? "border-sky-500 bg-sky-500"
                  : "border-gray-300 dark:border-slate-600"
              }`}
            >
              {flightData.includeFlights && !isSameCity && (
                <FaCheck className="text-white text-xs" />
              )}
            </div>
          </div>

          {flightData.includeFlights && (
            <div
              key="flight-content"
              className="space-y-3 animate-fade-in-scale"
              style={{ minHeight: isAnalyzing ? "200px" : "auto" }}
            >
              {/* ✅ NEW: Transport Options Comparison Card */}
              {transportAnalysis &&
                transportAnalysis.flightInfo &&
                transportAnalysis.groundTransport?.available && (
                  <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-2 border-sky-200 dark:border-sky-700 rounded-lg animate-fade-in-scale stagger-1">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg">💡</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-sky-900 dark:text-sky-200 mb-1">
                          {transportAnalysis.flightInfo.direct
                            ? "Direct Flight Available"
                            : "Flights Available"}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          {transportAnalysis.flightInfo.direct
                            ? `${
                                transportAnalysis.flightMetrics
                                  ?.estimated_flight_time || "~1 hour"
                              } • ${
                                transportAnalysis.flightMetrics?.distance ||
                                "Distance available"
                              }`
                            : "Connecting flights via hub"}
                        </div>
                      </div>
                    </div>

                    {/* Ground Transport Alternative */}
                    {!transportAnalysis.groundTransport.preferred && (
                      <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 rounded">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                              💰 Save money: Take ground transport?
                            </div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">
                              {transportAnalysis.groundTransport.travelTime} •{" "}
                              {transportAnalysis.groundTransport.cost}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Show more details or switch preference
                            }}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline whitespace-nowrap"
                          >
                            Details →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Flight is Recommended but Ground Available */}
                    {transportAnalysis.groundTransport.preferred && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded">
                        <div className="text-xs text-amber-800 dark:text-amber-300">
                          <span className="font-semibold">💡 Tip:</span> Ground
                          transport (
                          {transportAnalysis.groundTransport.travelTime}) is
                          actually more practical for this route.
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Flight Recommendation Alert */}
              {flightRecommendation &&
                flightRecommendation.type !== "optimal" &&
                !transportAnalysis?.groundTransport?.preferred &&
                !transportAnalysis?.groundTransport?.available && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs animate-fade-in-scale stagger-1 ${
                      flightRecommendation.type === "same-city"
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                        : flightRecommendation.type === "limited-service"
                        ? "bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-300"
                        : "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300"
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      {flightRecommendation.type === "limited-service" ? (
                        <FaPlane className="mt-0.5 flex-shrink-0 text-sky-600 dark:text-sky-400" />
                      ) : (
                        <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold mb-1">
                          {flightRecommendation.type === "limited-service"
                            ? `${
                                flightRecommendation.cityName ||
                                formData?.location?.split(",")[0]
                              } - Limited Airport Service`
                            : "Flight Advisory"}
                        </div>
                        <span>{flightRecommendation.message}</span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Auto-populated indicator */}
              {flightData.departureCity &&
                profileSummary?.hasLocationData &&
                flightRecommendation?.type !== "same-city" && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs animate-fade-in-scale stagger-1">
                    <FaCheck className="text-[10px]" />
                    <span title="Auto-populated from profile">
                      Profile: {profileSummary.location}
                    </span>
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
                airportInfo.departure?.code &&
                airportInfo.destination?.code &&
                airportInfo.departure.code !== airportInfo.destination.code && // ✅ Don't show if same city
                destinationAirportStatus?.hasService && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-700 animate-fade-in-scale stagger-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <FaPlane className="flex-shrink-0" />
                      <span className="font-semibold">
                        {airportInfo.departure.code} →{" "}
                        {airportInfo.destination.code}
                      </span>
                      {airportInfo?.nonstopAvailableFromDeparture && (
                        <span className="text-[10px]">• Nonstop available</span>
                      )}
                    </div>
                  </div>
                )}

              {/* ✅ NEW: Detailed Comparison (Expandable) */}
              {transportAnalysis &&
                transportAnalysis.groundTransport?.available &&
                transportAnalysis.flightInfo && (
                  <details className="mt-3 animate-fade-in-scale stagger-4">
                    <summary className="cursor-pointer text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium flex items-center gap-1">
                      <span>📊 Compare All Transport Options</span>
                      <span className="text-[10px] text-gray-500">
                        (Flight vs Ground)
                      </span>
                    </summary>

                    <div className="mt-3 space-y-2">
                      {/* Flight Option */}
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          transportAnalysis.groundTransport.preferred
                            ? "border-gray-200 dark:border-slate-700"
                            : "border-sky-300 dark:border-sky-600 bg-sky-50 dark:bg-sky-950/30"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">✈️</span>
                            <div>
                              <div className="text-sm font-bold">
                                {transportAnalysis.flightInfo.direct
                                  ? "Direct Flight"
                                  : "Connecting Flight"}
                              </div>
                              {transportAnalysis.flightInfo.direct &&
                                transportAnalysis.flightInfo.airlines && (
                                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                    {transportAnalysis.flightInfo.airlines.join(
                                      ", "
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                          {!transportAnalysis.groundTransport.preferred && (
                            <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-bold">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <div className="font-bold text-sky-600 dark:text-sky-400">
                              {transportAnalysis.flightMetrics
                                ?.estimated_flight_time || "~1 hr"}
                            </div>
                            <div className="text-[9px] text-gray-500">
                              Flight Time
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-amber-600 dark:text-amber-400">
                              ₱2.5-4k
                            </div>
                            <div className="text-[9px] text-gray-500">
                              Est. Cost
                            </div>
                          </div>
                          <div>
                            <div className="text-sm">⭐⭐⭐⭐⭐</div>
                            <div className="text-[9px] text-gray-500">
                              Comfort
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-gray-600 dark:text-gray-400 flex flex-wrap gap-2">
                          <span>✓ Fastest</span>
                          <span>✓ Most comfortable</span>
                          <span>✓ Arrive fresh</span>
                        </div>
                      </div>

                      {/* Ground Transport Option */}
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          transportAnalysis.groundTransport.preferred
                            ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-gray-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🚌</span>
                            <div>
                              <div className="text-sm font-bold">
                                Ground Transport
                              </div>
                              {transportAnalysis.groundTransport.operators &&
                                transportAnalysis.groundTransport.operators
                                  .length > 0 && (
                                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                    {
                                      transportAnalysis.groundTransport
                                        .operators[0]
                                    }
                                  </div>
                                )}
                            </div>
                          </div>
                          {transportAnalysis.groundTransport.preferred && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                              BEST OPTION
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                              {transportAnalysis.groundTransport.travelTime}
                            </div>
                            <div className="text-[9px] text-gray-500">
                              Travel Time
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                              {transportAnalysis.groundTransport.cost}
                            </div>
                            <div className="text-[9px] text-gray-500">Cost</div>
                          </div>
                          <div>
                            <div className="text-sm">⭐⭐⭐</div>
                            <div className="text-[9px] text-gray-500">
                              Comfort
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-gray-600 dark:text-gray-400 flex flex-wrap gap-2">
                          <span>✓ Most economical</span>
                          <span>✓ Frequent departures</span>
                          {transportAnalysis.groundTransport.scenic && (
                            <span>✓ Scenic route</span>
                          )}
                        </div>
                      </div>

                      {/* Cost Savings Highlight */}
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded text-center">
                        <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          💰 Ground transport saves ₱1,500-3,000 per person
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                          {transportAnalysis.groundTransport.preferred
                            ? "Recommended for budget-conscious travelers"
                            : `But ${
                                transportAnalysis.flightMetrics
                                  ?.estimated_flight_time
                                  ? `saves ${transportAnalysis.groundTransport.travelTime} of travel time`
                                  : "flight saves significant time"
                              }`}
                        </div>
                      </div>
                    </div>
                  </details>
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
              {/* ✅ NEW: Staycation hint for same-city trips */}
              {isSameCity && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">💡</span>
                    <p className="text-xs text-purple-900 dark:text-purple-200">
                      <strong>Staycation Tip:</strong> Treat yourself to a local
                      hotel experience - perfect for a weekend getaway without
                      leaving the city!
                    </p>
                  </div>
                </div>
              )}

              {/* Auto-populated indicator */}
              {hotelData.preferredType &&
                profileSummary?.accommodationPreference ===
                  hotelData.preferredType && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs animate-fade-in-scale stagger-1">
                    <FaCheck className="text-[10px]" />
                    <span title="Auto-populated from profile">
                      Profile: {profileSummary.accommodationPreference}
                    </span>
                  </div>
                )}

              {/* Accommodation Type - Compact Grid */}
              <div className="animate-fade-in-scale stagger-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Accommodation Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
