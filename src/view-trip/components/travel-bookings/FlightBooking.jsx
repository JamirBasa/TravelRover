import React, { useState } from "react";
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
} from "lucide-react";

function FlightBooking({ trip }) {
  const [sortBy, setSortBy] = useState("price"); // price, duration, departure

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
      // Otherwise, it's likely correct (1h-12h)
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

      // Flight duration numbers from APIs are typically in minutes
      // Convert all raw numbers to proper hour/minute format
      const hours = Math.floor(number / 60);
      const minutes = number % 60;

      return hours > 0
        ? minutes > 0
          ? `${hours}h ${minutes}m`
          : `${hours}h`
        : `${minutes}m`;
    }

    // If nothing matches, return cleaned version
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

    const airportMap = {
      Manila: "MNL",
      "Metro Manila": "MNL",
      "Manila City": "MNL",
      Cebu: "CEB",
      "Cebu City": "CEB",
      Davao: "DVO",
      "Davao City": "DVO",
      Palawan: "PPS",
      "Puerto Princesa": "PPS",
      "El Nido": "PPS",
      Coron: "PPS",
      Boracay: "KLO",
      Kalibo: "KLO",
      Malay: "KLO",
      Bohol: "TAG",
      Tagbilaran: "TAG",
      "Tagbilaran City": "TAG",
      Siargao: "IAO",
      "General Luna": "IAO",
      Clark: "CRK",
      Angeles: "CRK",
      "Angeles City": "CRK",
      Iloilo: "ILO",
      "Iloilo City": "ILO",
      Bacolod: "BCD",
      "Bacolod City": "BCD",
      Zamboanga: "ZAM",
      Cagayan: "CGY",
      "Cagayan de Oro": "CGY",
      Dumaguete: "DGT",
      "Dumaguete City": "DGT",
      Butuan: "BXU",
      Surigao: "SUG",
      Laoag: "LAO",
      Tuguegarao: "TUG",
      Legazpi: "LGP",
      Naga: "WNP",
      Roxas: "RXS",
      Tacloban: "TAC",
      Catarman: "CRM",
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
    return "MNL"; // Default to Manila
  };

  // Helper function to generate Trip.com affiliate booking URL
  // Based on your provided affiliate parameters
  const generateTripComURL = (options = {}) => {
    // Debug: Log trip data to see what we're working with
    console.log("🔍 Trip data for URL generation:", {
      tripLocation: trip?.userSelection?.location,
      flightPreferences: trip?.flightPreferences,
      userProfile: trip?.userProfile,
      options: options,
    });

    // Get departure city from flight preferences or user profile
    const departureCity =
      options.origin ||
      trip?.flightPreferences?.departureCity ||
      trip?.userProfile?.address?.city ||
      "Manila";

    const destinationCity =
      options.destination || trip?.userSelection?.location || "Cebu";

    // Extract airport codes from location names
    const originCode = getAirportCode(departureCity);
    const destinationCode = getAirportCode(destinationCity);

    console.log("✈️ Airport codes:", {
      departureCity,
      destinationCity,
      originCode,
      destinationCode,
    });

    // Helper function to parse traveler count from strings like "2 People", "Just Me", etc.
    const parseTravelerCount = (travelers) => {
      if (!travelers) return "1";

      const travelerMap = {
        "Just Me": "1",
        "A Couple": "2",
        Family: "4",
        Friends: "3",
      };

      // If it's a direct mapping, use it
      if (travelerMap[travelers]) {
        return travelerMap[travelers];
      }

      // Extract number from strings like "2 People", "3 adults", etc.
      const match = travelers.toString().match(/(\d+)/);
      return match ? match[1] : "1";
    };

    // Format dates for Trip.com (YYYY-MM-DD)
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toISOString().split("T")[0];
    };

    const departDate = formatDate(
      options.departDate || trip?.userSelection?.startDate
    );
    const returnDate = formatDate(
      options.returnDate || trip?.userSelection?.endDate
    );

    const params = new URLSearchParams({
      SID: "2209817", // Your Site ID
      allianceid: "1094387", // Your Alliance ID
      trip_sub1: "702904c5206a4eb899386a613-621043", // Your tracking sub ID
      currency: "PHP",
      acity: destinationCode, // Arrival city (where you arrive/destination)
      dcity: originCode, // Departure city (where you depart from/origin)
      ddate: departDate,
      rdate: returnDate,
      quantity: parseTravelerCount(
        options.adults || trip?.userSelection?.travelers
      ),
      class: "ys", // Economy class
      flighttype: returnDate ? "D" : "S", // D = Round trip, S = One way
    });

    return `https://www.trip.com/flights/ShowFareFirst/?${params.toString()}`;
  };

  // Error boundary protection
  try {
    // Early validation of trip data
    if (!trip) {
      console.warn("⚠️ No trip data provided to FlightBooking component");
      throw new Error("No trip data available");
    }

    // Check if we have real flight data
    const hasFlightData = trip?.hasRealFlights && trip?.realFlightData?.success;
    const flights = trip?.realFlightData?.flights || [];

    // Debug: Log flight data structure
    console.log("🛫 Flight data:", {
      hasFlightData,
      flights,
      realFlightData: trip?.realFlightData,
    });

    // Validate flight data structure
    const validFlights = flights
      .filter((flight) => {
        const isValid =
          flight && typeof flight === "object" && flight.name && flight.price;
        if (!isValid) {
          console.warn("⚠️ Invalid flight data:", flight);
        }
        return isValid;
      })
      .map((flight) => ({
        ...flight,
        // Ensure all required fields are strings
        name: String(flight.name || "Unknown Airline"),
        price: String(flight.price || "₱0"),
        departure: String(flight.departure || "N/A"),
        arrival: String(flight.arrival || "N/A"),
        duration: flight.duration || "N/A",
        stops: typeof flight.stops === "number" ? flight.stops : 0,
      }));

    if (!hasFlightData || validFlights.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-2xl text-blue-600">✈️</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Flight Booking Available
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto font-medium mb-4">
            Contact our travel partners for the best flight deals to{" "}
            {trip?.userSelection?.location}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => window.open(generateTripComURL(), "_blank")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Search on Trip.com
            </Button>
            <Button
              onClick={() =>
                window.open("https://www.agoda.com/flights", "_blank")
              }
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Book on Agoda
            </Button>
          </div>
        </div>
      );
    }

    // Sort flights based on selected criteria
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
      // Track booking attempt (you can add analytics here)
      console.log("Flight booking attempt:", flight);

      // Generate Trip.com affiliate URL
      const bookingUrl = generateTripComURL();
      console.log("🔗 Generated Trip.com booking URL:", bookingUrl);

      // Open booking URL
      window.open(bookingUrl, "_blank");
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          {/* Consistent Header Section */}
          <div className="brand-gradient px-4 sm:px-6 py-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-5 rounded-full translate-y-2 -translate-x-2"></div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg border border-white/30">
                    <Plane className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white mb-1 break-words">
                      Available Flights
                    </h2>
                    <p className="text-blue-100 text-xs flex items-center gap-2 flex-wrap">
                      <span>✈️</span>
                      <span>
                        {validFlights.length} flights available for your journey
                      </span>
                      <span>•</span>
                      <span>🎯 Real-time prices</span>
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-white">
                  <div className="text-center">
                    <div className="text-base font-bold">
                      {validFlights.length}
                    </div>
                    <div className="text-xs text-blue-100">Flights</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Sort Options Section */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="price">Price (Low to High)</option>
                  <option value="departure">Departure Time</option>
                  <option value="duration">Flight Duration</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6">
              {sortedFlights.map((flight, index) => (
                <div key={index}>
                  <FlightCard
                    flight={flight}
                    onBook={() => handleBookFlight(flight)}
                    trip={trip}
                    formatDuration={formatDuration}
                  />
                  {/* Add separator except for last item */}
                  {index < sortedFlights.length - 1 && (
                    <div className="mt-6 border-b border-gray-100"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Compact Helpful tip */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs">💡</span>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">
                    Flight Booking Tips
                  </h4>
                  <div className="text-blue-700 text-sm space-y-2">
                    <p>
                      Prices shown are current estimates and may change. You'll
                      be redirected to our trusted booking partners for secure
                      transactions and the best available rates!
                    </p>
                    <p className="text-xs">
                      <strong>Duration:</strong> Scheduled flight time from
                      takeoff to landing, excluding ground time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Alerts & Partner Links - Outside main container */}
        {trip?.realFlightData?.price_alerts && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Price Insights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-green-700 font-medium">Lowest: </span>
                <span className="text-green-800">
                  ₱
                  {trip.realFlightData.price_alerts.lowest_price?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Average: </span>
                <span className="text-green-800">
                  ₱
                  {Math.round(
                    trip.realFlightData.price_alerts.average_price
                  )?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Trend: </span>
                <span className="text-green-800 capitalize">
                  {trip.realFlightData.price_alerts.price_trend}
                </span>
              </div>
            </div>
            <p className="text-green-700 text-xs mt-2 font-medium">
              💡 {trip.realFlightData.price_alerts.best_booking_time}
            </p>
          </div>
        )}

        {/* Alternative Booking Partners */}
        {trip?.realFlightData?.booking_info?.partner_links && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Compare Prices on Other Sites
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(
                trip.realFlightData.booking_info.partner_links
              ).map(([name, url]) => (
                <Button
                  key={name}
                  onClick={() => window.open(url, "_blank")}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-gray-100"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
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
    <div className="border border-gray-200 bg-white rounded-lg transition-all duration-200 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 group">
      {/* Main Flight Info */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Flight Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <Plane className="h-4 w-4 text-gray-600" />
                {flight.name}
              </div>
              {flight.is_best && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Best Value
                </Badge>
              )}
              {flight.flight_number && (
                <Badge variant="outline" className="text-xs">
                  {flight.flight_number}
                </Badge>
              )}
            </div>

            {/* Flight Times and Route */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600 text-xs mb-1">Departure</div>
                <div className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  {flight.departure}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-xs mb-1">Arrival</div>
                <div className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  {flight.arrival}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-xs mb-1">Duration</div>
                <div className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  {formatDuration(flight.duration)}
                </div>
              </div>
            </div>

            {/* Flight Features */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop(s)`}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {trip?.userSelection?.travelers}
              </span>
              {flight.aircraft_type && (
                <span className="text-gray-500">{flight.aircraft_type}</span>
              )}
            </div>
          </div>

          {/* Price and Booking */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 lg:gap-2">
            <div className="text-center sm:text-right lg:text-right flex-1 sm:flex-initial">
              <div className="text-xs text-gray-600 mb-1">Total Price</div>
              <div className="text-2xl font-bold text-green-600">
                {flight.price}
              </div>
              <div className="text-xs text-gray-500">per person</div>
            </div>

            <Button
              onClick={onBook}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer group-hover:bg-blue-700 group-hover:scale-105 transition-all duration-200 w-full sm:w-auto lg:w-auto px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm font-semibold"
            >
              <span className="flex items-center justify-center gap-2">
                <span>Book Now</span>
                <ExternalLink className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightBooking;
