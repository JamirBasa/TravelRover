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

  // Helper function to extract airport codes from location names
  const getAirportCode = (location) => {
    if (!location) return "MNL";

    // If it's already a 3-letter airport code, return it
    if (
      typeof location === "string" &&
      location.length === 3 &&
      location.match(/^[A-Z]{3}$/)
    ) {
      return location;
    }

    // ✅ UPDATED: Complete airport map with Baguio
    const airportMap = {
      // Metro Manila
      Manila: "MNL",
      "Metro Manila": "MNL",
      "Manila City": "MNL",

      // Luzon
      Baguio: "BAG", // ✅ ADDED: Returns BAG (will be handled by validation)
      "Baguio City": "BAG",
      Benguet: "BAG",
      Clark: "CRK",
      Angeles: "CRK",
      "Angeles City": "CRK",
      Laoag: "LAO",
      Tuguegarao: "TUG",
      Legazpi: "LGP",
      Naga: "WNP",

      // Visayas
      Cebu: "CEB",
      "Cebu City": "CEB",
      Iloilo: "ILO",
      "Iloilo City": "ILO",
      Bacolod: "BCD",
      "Bacolod City": "BCD",
      Bohol: "TAG",
      Tagbilaran: "TAG",
      "Tagbilaran City": "TAG",
      Boracay: "KLO",
      Kalibo: "KLO",
      Malay: "KLO",
      Dumaguete: "DGT",
      "Dumaguete City": "DGT",
      Roxas: "RXS",
      Tacloban: "TAC",
      Catarman: "CRM",

      // Mindanao
      Davao: "DVO",
      "Davao City": "DVO",
      Zamboanga: "ZAM",
      "Zamboanga City": "ZAM",
      Cagayan: "CGY",
      "Cagayan de Oro": "CGY",
      Butuan: "BXU",
      Surigao: "SUG",
      Siargao: "IAO",
      "General Luna": "IAO",

      // Palawan
      Palawan: "PPS",
      "Puerto Princesa": "PPS",
      "El Nido": "PPS",
      Coron: "PPS",

      // Others
      Dipolog: "DPG",
      Pagadian: "PAG",
      Jolo: "JOL",
      Tawi: "TWY",
    };

    const locationStr = String(location);
    const locationLower = locationStr.toLowerCase();
    const city = locationStr.split(",")[0].trim();
    const cityLower = city.toLowerCase();

    console.log(
      `🔍 Looking for airport code for: "${location}" -> City: "${city}"`
    );

    // Direct exact matches first
    for (const [key, code] of Object.entries(airportMap)) {
      const keyLower = key.toLowerCase();
      if (cityLower === keyLower || locationLower.includes(keyLower)) {
        console.log(`✅ Found exact match: ${key} -> ${code}`);
        return code;
      }
    }

    // Partial matches
    for (const [key, code] of Object.entries(airportMap)) {
      const keyLower = key.toLowerCase();
      if (cityLower.includes(keyLower) || keyLower.includes(cityLower)) {
        console.log(`✅ Found partial match: ${key} -> ${code}`);
        return code;
      }
    }

    console.log(
      `⚠️ No airport code found for "${location}", defaulting to MNL`
    );
    return "MNL";
  };

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
    console.log("🔍 Trip data for URL generation:", {
      tripLocation: trip?.userSelection?.location,
      flightPreferences: trip?.flightPreferences,
      userProfile: trip?.userProfile,
      options: options,
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

    console.log("✈️ Airport codes:", {
      departureCity,
      destinationCity,
      originCode,
      destinationCode,
    });

    // ✅ ADDED: Validate route before generating URL
    const routeValidation = validateRoute(originCode, destinationCode);
    if (!routeValidation.valid) {
      console.warn("⚠️ Invalid route detected:", routeValidation);
      // For inactive airports, use the first alternative
      if (routeValidation.info?.alternatives) {
        const alternativeCode = routeValidation.info.alternatives[0];
        console.log(`🔄 Using alternative airport: ${alternativeCode}`);
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

    const parseTravelerCount = (travelers) => {
      if (!travelers) return "1";

      const travelerMap = {
        "Just Me": "1",
        "A Couple": "2",
        Family: "4",
        Friends: "3",
      };

      if (travelerMap[travelers]) {
        return travelerMap[travelers];
      }

      const match = travelers.toString().match(/(\d+)/);
      return match ? match[1] : "1";
    };

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

    const params = new URLSearchParams({
      SID: "2209817",
      allianceid: "1094387",
      trip_sub1: "702904c5206a4eb899386a613-621043",
      currency: "PHP",
      acity: destinationCode,
      dcity: originCode,
      ddate: departDate,
      rdate: returnDate,
      quantity: parseTravelerCount(
        options.adults || trip?.userSelection?.travelers
      ),
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
      console.warn("⚠️ No trip data provided to FlightBooking component");
      throw new Error("No trip data available");
    }

    const hasFlightData = trip?.hasRealFlights && trip?.realFlightData?.success;
    const flights = trip?.realFlightData?.flights || [];

    console.log("🛫 Flight data:", {
      hasFlightData,
      flights,
      realFlightData: trip?.realFlightData,
    });

    // ✅ NEW: Validate and filter flights with price validation
    const validFlights = flights
      .filter((flight) => {
        // Check basic structure
        const hasBasicStructure =
          flight && typeof flight === "object" && flight.name && flight.price;

        if (!hasBasicStructure) {
          console.warn("⚠️ Invalid flight structure:", flight);
          return false;
        }

        // Validate price
        const priceValidation = validateFlightPrice(flight.price);

        if (!priceValidation.valid) {
          console.warn(
            `⚠️ Invalid flight price for ${flight.name}: ${flight.price}`,
            priceValidation.error
          );
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
        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl shadow-lg border-2 border-orange-300 dark:border-orange-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-2">
                {isOriginInactive
                  ? `No Airport in ${routeWarning.info.name}`
                  : "No Direct Flights Available"}
              </h3>
              <p className="text-orange-800 dark:text-orange-200 mb-4">
                {routeWarning.info.message}
              </p>

              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  {isOriginInactive ? "🚌" : "✈️"} Recommended Route:
                </h4>
                <div className="space-y-2.5 text-sm">
                  {isOriginInactive ? (
                    // Origin city has no airport - need ground transport first
                    <>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-xs font-bold text-orange-700 dark:text-orange-300">
                          1
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">
                          Take {routeWarning.info.transport} from{" "}
                          {routeWarning.info.name} to{" "}
                          {routeWarning.info.alternativeNames[0]} (
                          {routeWarning.info.travelTime})
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-xs font-bold text-sky-700 dark:text-sky-300">
                          2
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">
                          Fly from {routeWarning.info.alternativeNames[0]} to{" "}
                          {trip?.userSelection?.location}
                        </span>
                      </div>
                      {routeWarning.info.recommendation && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            💡 <span className="font-semibold">Tip:</span>{" "}
                            {routeWarning.info.recommendation}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Destination has no airport
                    <>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-xs font-bold text-sky-700 dark:text-sky-300">
                          1
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">
                          Fly to {routeWarning.info.alternativeNames[0]} (
                          {routeWarning.info.alternatives[0]})
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-xs font-bold text-orange-700 dark:text-orange-300">
                          2
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">
                          Take {routeWarning.info.transport} to{" "}
                          {trip?.userSelection?.location} (
                          {routeWarning.info.travelTime})
                        </span>
                      </div>
                      {routeWarning.info.recommendation && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            💡 <span className="font-semibold">Tip:</span>{" "}
                            {routeWarning.info.recommendation}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {routeWarning.info.alternatives.map((altCode, index) => (
                  <Button
                    key={altCode}
                    onClick={() =>
                      window.open(
                        generateTripComURL({
                          [isOriginInactive ? "origin" : "destination"]:
                            altCode,
                        }),
                        "_blank"
                      )
                    }
                    className="brand-button cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Search Flights {isOriginInactive ? "from" : "to"}{" "}
                    {routeWarning.info.alternativeNames[index]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
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
              Flight Booking Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              Contact our travel partners for the best flight deals to{" "}
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
      console.log("Flight booking attempt:", flight);
      const bookingUrl = generateTripComURL();
      console.log("🔗 Generated Trip.com booking URL:", bookingUrl);
      window.open(bookingUrl, "_blank");
    };

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Header Section */}
          <div className="brand-gradient px-5 sm:px-8 py-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-white/10 opacity-5 rounded-full -translate-y-6 translate-x-6"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white dark:bg-white/10 opacity-5 rounded-full translate-y-4 -translate-x-4"></div>

            <div className="relative">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-white/90 rounded-xl flex items-center justify-center shadow-lg border border-white/30 flex-shrink-0">
                    <Plane className="h-6 w-6 sm:h-7 sm:w-7 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                      Available Flights
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sky-100 text-xs sm:text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">✈️</span>
                        <span className="font-medium">
                          {validFlights.length}{" "}
                          {validFlights.length === 1 ? "flight" : "flights"}{" "}
                          available
                        </span>
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">🎯</span>
                        <span>Real-time prices</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-4">
                  <div className="text-right bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-white">
                      {validFlights.length}
                    </div>
                    <div className="text-xs text-sky-100 font-medium">
                      Total Flights
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
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

            {/* Sort Options */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-600 focus:border-sky-500 dark:focus:border-sky-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white cursor-pointer font-medium transition-all hover:border-sky-400 dark:hover:border-sky-500"
                >
                  <option value="price">💰 Price (Low to High)</option>
                  <option value="departure">🕐 Departure Time</option>
                  <option value="duration">⏱️ Flight Duration</option>
                </select>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                Showing {sortedFlights.length}{" "}
                {sortedFlights.length === 1 ? "result" : "results"}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5">
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
    console.error("❌ FlightBooking component error:", error);
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
    <div className="border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl transition-all duration-300 hover:shadow-2xl hover:border-sky-400 dark:hover:border-sky-500 hover:-translate-y-0.5 group overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
          {/* Flight Details */}
          <div className="flex-1 min-w-0">
            {/* Airline Name and Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-2.5 mr-2">
                <div className="w-9 h-9 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plane className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                  {flight.name}
                </h3>
              </div>
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

            {/* Flight Times and Route */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4">
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Departure
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {flight.departure}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Arrival
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {flight.arrival}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Duration
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {formatDuration(flight.duration)}
                </div>
              </div>
            </div>

            {/* Flight Features */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                <Shield className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                {flight.stops === 0 ? "✈️ Non-stop" : `${flight.stops} stop(s)`}
              </span>
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                <Users className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                {trip?.userSelection?.travelers}
              </span>
              {flight.aircraft_type && (
                <span className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                  ✈️ {flight.aircraft_type}
                </span>
              )}
            </div>
          </div>

          {/* Price and Booking */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-4 lg:gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 lg:border-l-2 border-gray-100 dark:border-slate-700 lg:pl-6">
            <div className="text-center sm:text-right lg:text-right flex-1 sm:flex-initial">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Total Price
              </div>
              <div className="text-3xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-500 mb-1">
                {flight.price}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                per person
              </div>
            </div>

            <Button
              onClick={onBook}
              className="brand-button cursor-pointer group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 w-full sm:w-auto lg:w-full min-w-[140px] h-12 sm:h-11 lg:h-12 text-base font-bold"
            >
              <span className="flex items-center justify-center gap-2">
                <span>Book Now</span>
                <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightBooking;
