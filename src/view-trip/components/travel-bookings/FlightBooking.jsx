import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Clock,
  Users,
  Calendar,
  ExternalLink,
  Star,
  Shield,
  Info,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { getLimitedServiceInfo } from "@/utils/flightRecommendations";
import { logDebug, logError } from "@/utils/productionLogger";
import { getAirportCode } from "@/data/airports";

// ✅ CENTRALIZED: Import airport data from single source of truth
// Convert LIMITED_SERVICE_AIRPORTS format to component-specific format
const createInactiveAirportsMap = () => {
  const map = {};

  // Get all limited service airport codes
  const limitedServiceCodes = [
    "BAG",
    "VIG",
    "SAG",
    "BAN",
    "PAG",
    "HUN", // Northern Luzon
    "SFE",
    "ANC", // Central Luzon
    "LGZ",
    "DAR",
    "CAL",
    "DON",
    "MSB", // Bicol
    "SJO",
    "PUG", // Mindoro
    "ELN",
    "COR",
    "SAB",
    "BAL", // Palawan
    "BOR",
    "GIM",
    "ANT", // Panay
    "DUM",
    "SIQ",
    "DAU", // Negros
    "PAN",
    "CHO",
    "AMO", // Bohol
    "BANT",
    "MAL",
    "OSL",
    "MOA", // Cebu
    "TUB",
    "SOH",
    "KAL", // Leyte/Samar
    "CAM",
    "BUK",
    "ILG", // Mindanao North
    "GLE",
    "BUR",
    "BIS",
    "BRI", // Caraga
    "SAM",
    "MAT",
    "TBL", // Davao
    "SAN",
    "BAS", // Zamboanga
    "TAW",
    "SIT", // Sulu/Tawi-Tawi
  ];

  limitedServiceCodes.forEach((code) => {
    const info = getLimitedServiceInfo(code);
    if (info) {
      map[code] = {
        name: info.name,
        alternatives: info.alternatives,
        alternativeNames: info.alternativeNames,
        transport: info.transport,
        travelTime: info.travelTime,
        message: `${info.name} has no commercial flights. ${info.recommendation}`,
        recommendation: info.recommendation,
        notes: info.notes,
      };
    }
  });

  return map;
};

const INACTIVE_AIRPORTS = createInactiveAirportsMap();

function FlightBooking({ trip }) {
  const [sortBy, setSortBy] = useState("price");

  // ✅ NEW: Client-side price validation helper
  const validateFlightPrice = (priceStr) => {
    try {
      const numericPrice = parseFloat(
        (priceStr || "0").toString().replace(/[₱,]/g, "")
      );

      // Basic validation
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return { valid: false, error: "Invalid price" };
      }

      // Range validation (₱500 - ₱100,000)
      if (numericPrice < 500) {
        return { valid: false, error: "Price too low" };
      }
      if (numericPrice > 100000) {
        return { valid: false, error: "Price unusually high" };
      }

      return { valid: true, price: numericPrice };
    } catch {
      return { valid: false, error: "Price validation error" };
    }
  };

  // Helper function to format flight duration consistently
  const formatDuration = (duration) => {
    if (!duration || duration === "N/A" || duration === "") {
      return "Not specified";
    }

    // Handle numeric duration (minutes) directly
    if (typeof duration === "number") {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return hours > 0
        ? minutes > 0
          ? `${hours}h ${minutes}m`
          : `${hours}h`
        : `${minutes}m`;
    }

    const durationStr = String(duration).trim();

    // Handle incorrectly formatted hours (like "105h" which should be "1h 45m")
    const incorrectHourMatch = durationStr.match(/^(\d+)h$/);
    if (incorrectHourMatch) {
      const number = parseInt(incorrectHourMatch[1]);
      // If it's a suspiciously large number of hours (13+), treat as minutes
      if (number >= 13) {
        const hours = Math.floor(number / 60);
        const minutes = number % 60;
        return hours > 0
          ? minutes > 0
            ? `${hours}h ${minutes}m`
            : `${hours}h`
          : `${minutes}m`;
      }
      return durationStr;
    }

    // If already in correct format (like "2h 30m"), return as is
    if (/^\d+h\s*(\d+m)?$/.test(durationStr)) {
      return durationStr;
    }

    // Parse "2 hours 30 minutes" or "2 hours"
    const longFormatMatch = durationStr.match(
      /(\d+)\s*hours?\s*(\d+)?\s*minutes?/i
    );
    if (longFormatMatch) {
      const hours = parseInt(longFormatMatch[1]);
      const minutes = longFormatMatch[2] ? parseInt(longFormatMatch[2]) : 0;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    // Parse "2h 30m", "2h30m", or just "2h"
    const shortFormatMatch = durationStr.match(/(\d+)h\s*(\d+)?m?/i);
    if (shortFormatMatch) {
      const hours = parseInt(shortFormatMatch[1]);
      const minutes = shortFormatMatch[2] ? parseInt(shortFormatMatch[2]) : 0;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    // Parse total minutes (like "150 minutes" or "90 min")
    const minutesMatch = durationStr.match(/(\d+)\s*(min|minutes)/i);
    if (minutesMatch) {
      const totalMinutes = parseInt(minutesMatch[1]);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
      return `${minutes}m`;
    }

    // Parse decimal hours (like "2.5" or "1.75")
    const decimalMatch = durationStr.match(/^(\d+\.?\d*)\s*(hours?)?$/i);
    if (decimalMatch) {
      const decimalHours = parseFloat(decimalMatch[1]);
      if (decimalHours > 0) {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        if (hours > 0) {
          return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${minutes}m`;
      }
    }

    // Parse just numbers (flight API data usually provides duration in minutes)
    const numberMatch = durationStr.match(/^(\d+)$/);
    if (numberMatch) {
      const number = parseInt(numberMatch[1]);
      const hours = Math.floor(number / 60);
      const minutes = number % 60;

      return hours > 0
        ? minutes > 0
          ? `${hours}h ${minutes}m`
          : `${hours}h`
        : `${minutes}m`;
    }

    return durationStr || "Not specified";
  };

  // ✅ FIX: Removed local getAirportCode function - now using centralized version from airports.js
  // The old local version had a bug where "Pagadian City, Zamboanga del Sur" matched
  // "Zamboanga City" because it used locationLower.includes(keyLower) which found "zamboanga"
  // in the full address string BEFORE checking "pagadian". The fixed version from airports.js
  // extracts the city name first before matching.

  // ✅ NEW: Validate if route has commercial flights
  const validateRoute = (originCode, destinationCode) => {
    // Check if destination is an inactive airport
    if (INACTIVE_AIRPORTS[destinationCode]) {
      return {
        valid: false,
        type: "inactive_destination",
        info: INACTIVE_AIRPORTS[destinationCode],
      };
    }

    // Check if origin is an inactive airport
    if (INACTIVE_AIRPORTS[originCode]) {
      return {
        valid: false,
        type: "inactive_origin",
        info: INACTIVE_AIRPORTS[originCode],
      };
    }

    return { valid: true };
  };

  // Helper function to generate Trip.com affiliate booking URL
  const generateTripComURL = (options = {}) => {
    logDebug("FlightBooking", "Generating Trip.com URL", {
      tripLocation: trip?.userSelection?.location,
      hasFlightPreferences: !!trip?.flightPreferences,
      hasUserProfile: !!trip?.userProfile,
      options,
    });

    const departureCity =
      options.origin ||
      trip?.flightPreferences?.departureCity ||
      trip?.userProfile?.address?.city ||
      "Manila";

    const destinationCity =
      options.destination || trip?.userSelection?.location || "Cebu";

    const originCode = getAirportCode(departureCity);
    const destinationCode = getAirportCode(destinationCity);

    logDebug("FlightBooking", "Airport codes resolved", {
      departureCity,
      destinationCity,
      originCode,
      destinationCode,
    });

    // ✅ ADDED: Validate route before generating URL
    const routeValidation = validateRoute(originCode, destinationCode);
    if (!routeValidation.valid) {
      logDebug("FlightBooking", "Invalid route detected", routeValidation);
      // For inactive airports, use the first alternative
      if (routeValidation.info?.alternatives) {
        const alternativeCode = routeValidation.info.alternatives[0];
        logDebug("FlightBooking", "Using alternative airport", {
          alternativeCode,
        });
        return generateTripComURL({
          ...options,
          destination:
            routeValidation.type === "inactive_destination"
              ? alternativeCode
              : destinationCity,
          origin:
            routeValidation.type === "inactive_origin"
              ? alternativeCode
              : departureCity,
        });
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return "";

      // If already in YYYY-MM-DD format, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Parse as local date without timezone conversion
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      if (isNaN(date.getTime())) return "";

      const yearStr = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, "0");
      const dayStr = String(date.getDate()).padStart(2, "0");

      return `${yearStr}-${monthStr}-${dayStr}`;
    };

    const departDate = formatDate(
      options.departDate || trip?.userSelection?.startDate
    );
    const returnDate = formatDate(
      options.returnDate || trip?.userSelection?.endDate
    );

    // ✅ FIX: Default to 1 traveler for convenience
    // Let users adjust traveler count on booking site (easier than re-searching)
    const params = new URLSearchParams({
      SID: "2209817",
      allianceid: "1094387",
      trip_sub1: "702904c5206a4eb899386a613-621043",
      currency: "PHP",
      acity: destinationCode,
      dcity: originCode,
      ddate: departDate,
      rdate: returnDate,
      quantity: "1", // Default to 1 traveler (users can adjust on booking site)
      class: "ys",
      flighttype: returnDate ? "D" : "S",
    });

    return `https://www.trip.com/flights/ShowFareFirst/?${params.toString()}`;
  };

  // ✅ NEW: Check if current route involves inactive airports
  const routeWarning = useMemo(() => {
    if (
      !trip?.userSelection?.location ||
      !trip?.flightPreferences?.departureCity
    ) {
      return null;
    }

    const originCode = getAirportCode(trip.flightPreferences.departureCity);
    const destinationCode = getAirportCode(trip.userSelection.location);
    const validation = validateRoute(originCode, destinationCode);

    if (!validation.valid) {
      return {
        ...validation,
        originCode,
        destinationCode,
      };
    }

    return null;
  }, [trip?.userSelection?.location, trip?.flightPreferences?.departureCity]);

  // Error boundary protection
  try {
    if (!trip) {
      logDebug("FlightBooking", "No trip data provided");
      throw new Error("No trip data available");
    }

    // ✅ NEW: Don't render if ground transport is preferred
    if (trip?.transportMode?.mode === "ground_preferred") {
      return null;
    }

    const hasFlightData = trip?.hasRealFlights && trip?.realFlightData?.success;
    const flights = trip?.realFlightData?.flights || [];

    logDebug("FlightBooking", "Flight data loaded", {
      hasFlightData,
      flightCount: flights.length,
      hasRealData: !!trip?.realFlightData,
    });

    // ✅ NEW: Validate and filter flights with price validation
    const validFlights = flights
      .filter((flight) => {
        // Check basic structure
        const hasBasicStructure =
          flight && typeof flight === "object" && flight.name && flight.price;

        if (!hasBasicStructure) {
          logDebug("FlightBooking", "Invalid flight structure", { flight });
          return false;
        }

        // Validate price
        const priceValidation = validateFlightPrice(flight.price);

        if (!priceValidation.valid) {
          logDebug("FlightBooking", "Invalid flight price", {
            flightName: flight.name,
            price: flight.price,
            error: priceValidation.error,
          });
          return false;
        }

        return true;
      })
      .map((flight) => ({
        ...flight,
        name: String(flight.name || "Unknown Airline"),
        price: String(flight.price || "₱0"),
        departure: String(flight.departure || "N/A"),
        arrival: String(flight.arrival || "N/A"),
        duration: flight.duration || "N/A",
        stops: typeof flight.stops === "number" ? flight.stops : 0,
      }));

    // ✅ NEW: Extract data quality metrics
    const dataQualityScore = trip?.realFlightData?.data_quality_score;
    const validationSummary = trip?.realFlightData?.validation_summary;

    // ✅ IMPROVED: Show appropriate warning based on route type
    if (routeWarning) {
      const isOriginInactive = routeWarning.type === "inactive_origin";
      const isDestinationInactive =
        routeWarning.type === "inactive_destination";

      return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-5">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {isDestinationInactive
                ? routeWarning.info.name
                : trip?.userSelection?.location}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {routeWarning.info.message}
            </p>
          </div>

          {/* Journey Steps */}
          <div className="space-y-3">
            {isOriginInactive ? (
              // Origin city has no airport - need ground transport first
              <>
                <div className="flex gap-4">
                  <div className="text-sm font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0 w-8">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-medium">
                        {routeWarning.info.transport}
                      </span>{" "}
                      to {routeWarning.info.alternativeNames[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      {routeWarning.info.travelTime}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-sm font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0 w-8">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-medium">Fly</span> to{" "}
                      {trip?.userSelection?.location}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // Destination has no airport
              <>
                <div className="flex gap-4">
                  <div className="text-sm font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0 w-8">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-medium">Fly</span> to{" "}
                      {routeWarning.info.alternativeNames[0]} (
                      {routeWarning.info.alternatives[0]})
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-sm font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0 w-8">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-medium">
                        {routeWarning.info.transport}
                      </span>{" "}
                      to {trip?.userSelection?.location}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      {routeWarning.info.travelTime}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          <Button
            onClick={() =>
              window.open(
                generateTripComURL({
                  [isOriginInactive ? "origin" : "destination"]:
                    routeWarning.info.alternatives[0],
                }),
                "_blank"
              )
            }
            className="brand-button cursor-pointer w-full mt-5"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Alternative Options
          </Button>
        </div>
      );
    }

    if (!hasFlightData || validFlights.length === 0) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-8 sm:p-12 text-center">
            <div className="w-20 h-20 brand-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl">✈️</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Air Travel Options Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              Search for flights and compare prices from our travel partners to{" "}
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                {trip?.userSelection?.location}
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
              <Button
                onClick={() => window.open(generateTripComURL(), "_blank")}
                className="brand-button cursor-pointer h-12 text-base font-semibold"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Search on Trip.com
              </Button>
              <Button
                onClick={() =>
                  window.open("https://www.agoda.com/flights", "_blank")
                }
                variant="outline"
                className="border-2 border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 h-12 text-base font-semibold cursor-pointer transition-all"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Book on Agoda
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Sort flights
    const sortedFlights = [...validFlights].sort((a, b) => {
      switch (sortBy) {
        case "price":
          const priceA = parseFloat(
            (a.price || "0").toString().replace(/[₱,]/g, "")
          );
          const priceB = parseFloat(
            (b.price || "0").toString().replace(/[₱,]/g, "")
          );
          return priceA - priceB;
        case "duration":
          const durationA = (a.duration || "").toString();
          const durationB = (b.duration || "").toString();
          return durationA.localeCompare(durationB);
        case "departure":
          const departureA = (a.departure || "").toString();
          const departureB = (b.departure || "").toString();
          return departureA.localeCompare(departureB);
        default:
          return 0;
      }
    });

    const handleBookFlight = (flight) => {
      logDebug("FlightBooking", "Flight booking attempt", {
        flightName: flight.name,
      });
      const bookingUrl = generateTripComURL();
      logDebug("FlightBooking", "Generated booking URL", {
        url: bookingUrl.substring(0, 100),
      });
      window.open(bookingUrl, "_blank");
    };

    return (
      <div className="space-y-6">
        {/* 🆕 AUTO-REROUTE BANNER: Show when flights were rerouted to alternative airport */}
        {trip?.realFlightData?.rerouted &&
          trip?.realFlightData?.reroute_info && (
            <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 rounded-xl shadow-lg border-2 border-blue-300 dark:border-blue-700 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✈️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                    Smart Route: Flying to{" "}
                    {trip.realFlightData.reroute_info.alternative_name}
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm mb-4 leading-relaxed">
                    <strong>
                      {trip.realFlightData.reroute_info.original_destination}
                    </strong>{" "}
                    has no airport, so we've found flights to{" "}
                    <strong>
                      {trip.realFlightData.reroute_info.alternative_name}
                    </strong>{" "}
                    instead! This is the recommended gateway.
                  </p>

                  <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      🚌 Complete Journey:
                    </h4>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-xs font-bold text-sky-700 dark:text-sky-300">
                          1
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">
                          <strong>Fly</strong> to{" "}
                          {trip.realFlightData.reroute_info.alternative_name} (
                          {trip.realFlightData.reroute_info.alternative_airport}
                          )
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          2
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">
                          <strong>
                            Take{" "}
                            {
                              trip.realFlightData.reroute_info.ground_transport
                                .mode
                            }
                          </strong>{" "}
                          to{" "}
                          {
                            trip.realFlightData.reroute_info
                              .original_destination
                          }{" "}
                          (
                          {
                            trip.realFlightData.reroute_info.ground_transport
                              .travel_time
                          }
                          )
                        </span>
                      </div>
                    </div>

                    {trip.realFlightData.reroute_info.ground_transport
                      .recommendation && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          <strong>💡 Tip:</strong>{" "}
                          {
                            trip.realFlightData.reroute_info.ground_transport
                              .recommendation
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Minimalist Header */}
          <div className="brand-gradient px-4 sm:px-6 py-5 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>

            <div className="relative flex items-center justify-between gap-6">
              {/* Left: Title & Count */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Flights
                  </h2>
                  <p className="text-sm text-white/80 font-medium">
                    {validFlights.length}{" "}
                    {validFlights.length === 1 ? "option" : "options"} available
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950">
            {/* Sort Controls - Below Header */}
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white cursor-pointer font-medium transition-all hover:border-sky-400"
                >
                  <option value="price">💰 Price (Low to High)</option>
                  <option value="duration">⏱️ Flight Duration</option>
                  <option value="best">⭐ Best Value</option>
                </select>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {sortedFlights.length}{" "}
                {sortedFlights.length === 1 ? "result" : "results"}
              </div>
            </div>
            {/* ✅ NEW: Data Quality Indicator */}
            {dataQualityScore !== undefined && dataQualityScore < 100 && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 dark:border-amber-600 rounded-lg p-4 sm:p-5 shadow-sm">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2 text-sm sm:text-base">
                      Data Quality Notice
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-400 mb-3 leading-relaxed">
                      Some flight data has been filtered or corrected. Quality
                      score:{" "}
                      <span className="font-bold">
                        {Math.round(dataQualityScore)}%
                      </span>
                    </p>
                    {validationSummary?.invalid_flights > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-500 mb-2">
                        {validationSummary.invalid_flights} flight(s) removed
                        due to invalid pricing data.
                      </p>
                    )}
                    {validationSummary?.price_anomalies?.length > 0 && (
                      <details className="text-xs text-amber-700 dark:text-amber-500">
                        <summary className="cursor-pointer font-medium mb-1 hover:text-amber-900 dark:hover:text-amber-300">
                          View {validationSummary.price_anomalies.length} price
                          anomalies detected
                        </summary>
                        <ul className="ml-4 space-y-1 mt-2">
                          {validationSummary.price_anomalies
                            .slice(0, 5)
                            .map((anomaly, idx) => (
                              <li key={idx} className="text-xs">
                                • {anomaly.flight}: {anomaly.price} -{" "}
                                {anomaly.reason}
                              </li>
                            ))}
                          {validationSummary.price_anomalies.length > 5 && (
                            <li className="text-xs italic">
                              ... and{" "}
                              {validationSummary.price_anomalies.length - 5}{" "}
                              more
                            </li>
                          )}
                        </ul>
                      </details>
                    )}
                    {validationSummary?.price_statistics && (
                      <div className="mt-2 text-xs text-amber-700 dark:text-amber-500 grid grid-cols-3 gap-2">
                        <div>
                          <span className="font-medium">Avg:</span> ₱
                          {Math.round(
                            validationSummary.price_statistics.average
                          ).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Min:</span> ₱
                          {validationSummary.price_statistics.min.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Max:</span> ₱
                          {validationSummary.price_statistics.max.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Flight List */}
            <div className="space-y-4">
              {sortedFlights.map((flight, index) => (
                <FlightCard
                  key={index}
                  flight={flight}
                  onBook={() => handleBookFlight(flight)}
                  trip={trip}
                  formatDuration={formatDuration}
                />
              ))}
            </div>

            {/* Helpful tip */}
            <div className="mt-8 p-5 sm:p-6 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white text-lg">💡</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold brand-gradient-text mb-2 text-base sm:text-lg">
                    Flight Booking Tips
                  </h4>
                  <div className="text-sky-800 dark:text-sky-300 text-sm space-y-2.5 leading-relaxed">
                    <p>
                      Prices shown are current estimates and may change. You'll
                      be redirected to our trusted booking partners for secure
                      transactions and the best available rates.
                    </p>
                    <p className="text-xs sm:text-sm">
                      <strong className="font-semibold">
                        Flight Duration:
                      </strong>{" "}
                      Scheduled time from takeoff to landing, excluding ground
                      time and boarding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Alerts */}
        {trip?.realFlightData?.price_alerts && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-l-4 border-green-500 dark:border-green-600 rounded-xl p-5 sm:p-6 shadow-sm">
            <h4 className="font-bold text-green-900 dark:text-green-400 mb-4 flex items-center gap-2 text-base sm:text-lg">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              Price Insights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                <div className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                  Lowest Price
                </div>
                <div className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-300">
                  ₱
                  {trip.realFlightData.price_alerts.lowest_price?.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                <div className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                  Average Price
                </div>
                <div className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-300">
                  ₱
                  {Math.round(
                    trip.realFlightData.price_alerts.average_price
                  )?.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                <div className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                  Price Trend
                </div>
                <div className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-300 capitalize">
                  {trip.realFlightData.price_alerts.price_trend}
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-300 text-sm font-medium flex items-start gap-2">
                <span className="text-base flex-shrink-0">💡</span>
                <span>
                  {trip.realFlightData.price_alerts.best_booking_time}
                </span>
              </p>
            </div>
          </div>
        )}
        {/* Alternative Booking Partners */}
        {trip?.realFlightData?.booking_info?.partner_links && (
          <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-base sm:text-lg flex items-center gap-2">
              <span className="text-lg">🔍</span>
              Compare Prices on Other Sites
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(
                trip.realFlightData.booking_info.partner_links
              ).map(([name, url]) => (
                <Button
                  key={name}
                  onClick={() => window.open(url, "_blank")}
                  variant="outline"
                  className="text-sm font-medium hover:bg-white dark:hover:bg-slate-700 hover:border-sky-400 dark:hover:border-sky-600 cursor-pointer transition-all h-11 border-2"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    logError("FlightBooking", "Component error", { error: error.message });
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
        <div className="text-red-600 text-xl mb-2">⚠️</div>
        <h3 className="font-semibold text-red-800 mb-2 text-base">
          Flight Data Error
        </h3>
        <p className="text-sm text-red-700 mb-4 break-words">
          There was an issue loading flight information. Please try refreshing
          the page.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() =>
              window.open(generateTripComURL({ destination: "CEB" }), "_blank")
            }
            className="bg-red-600 hover:bg-red-700 text-white text-sm"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Search on Trip.com
          </Button>
          <Button
            onClick={() =>
              window.open("https://www.agoda.com/flights", "_blank")
            }
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 text-sm"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Book on Agoda
          </Button>
        </div>
      </div>
    );
  }
}

// Individual Flight Card Component
function FlightCard({ flight, onBook, trip, formatDuration }) {
  return (
    <div className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl transition-all duration-300 hover:shadow-lg dark:hover:shadow-sky-500/20 hover:border-sky-300 dark:hover:border-sky-600 group overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
          {/* Flight Details */}
          <div className="flex-1 min-w-0">
            {/* Airline Name and Icon */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plane className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                {flight.name}
              </h3>
            </div>

            {/* Badges Row - Separate Line */}
            {(flight.is_best || flight.flight_number) && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {flight.is_best && (
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 text-green-800 dark:text-green-400 text-xs font-semibold px-2.5 py-1 border border-green-300 dark:border-green-700">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Best Value
                  </Badge>
                )}
                {flight.flight_number && (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium border-gray-300 dark:border-slate-600 px-2.5 py-1"
                  >
                    {flight.flight_number}
                  </Badge>
                )}
              </div>
            )}

            {/* Flight Times and Route */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3">
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Departure
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                  {flight.departure}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Arrival
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                  {flight.arrival}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Duration
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                  {formatDuration(flight.duration)}
                </div>
              </div>
            </div>

            {/* Flight Features */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                <Shield className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                {flight.stops === 0 ? "✈️ Non-stop" : `${flight.stops} stop(s)`}
              </span>
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                <Users className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                {trip?.userSelection?.travelers}
              </span>
              {flight.aircraft_type && (
                <span className="bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  ✈️ {flight.aircraft_type}
                </span>
              )}
            </div>
          </div>

          {/* Price and Booking */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 lg:border-l border-gray-100 dark:border-slate-700 lg:pl-5">
            <div className="text-center sm:text-right lg:text-right flex-1 sm:flex-initial">
              {/* Price Display */}
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {flight.pricing_note || "Per Person"}
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-500 mb-0.5">
                {flight.price_per_person || flight.price}
              </div>
              {/* Show total for group only when multiple travelers */}
              {trip?.userSelection?.travelers > 1 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {flight.total_for_group ||
                    `₱${(
                      parseFloat(
                        (
                          flight.price_per_person ||
                          flight.price ||
                          "0"
                        ).replace(/[₱,]/g, "")
                      ) * trip.userSelection.travelers
                    ).toLocaleString()}`}{" "}
                  total for {trip.userSelection.travelers} travelers
                </div>
              )}
            </div>

            <Button
              onClick={onBook}
              className="bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600 active:bg-sky-800 dark:active:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg active:shadow-inner w-full sm:w-auto lg:w-full min-w-[140px] border border-sky-700 dark:border-sky-600"
            >
              <span>Book Now</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightBooking;
