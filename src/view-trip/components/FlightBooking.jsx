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
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [sortBy, setSortBy] = useState("price"); // price, duration, departure

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
        duration: String(flight.duration || "N/A"),
        stops: typeof flight.stops === "number" ? flight.stops : 0,
      }));

    if (!hasFlightData || validFlights.length === 0) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="text-amber-600 text-2xl mb-2">✈️</div>
          <h3 className="font-semibold text-amber-800 mb-2">
            Flight Booking Available
          </h3>
          <p className="text-sm text-amber-700 mb-4">
            Contact our travel partners for the best flight deals to{" "}
            {trip?.userSelection?.location}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => window.open(generateTripComURL(), "_blank")}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Search on Trip.com
            </Button>
            <Button
              onClick={() =>
                window.open("https://www.agoda.com/flights", "_blank")
              }
              variant="outline"
              className="border-amber-600 text-amber-600 hover:bg-amber-50"
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
        {/* Header with Sort Options */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              Available Flights
            </h3>
            <p className="text-sm text-gray-600">
              {validFlights.length} options found • Real-time prices
            </p>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price">Price</option>
              <option value="departure">Departure Time</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>

        {/* Flight Options */}
        <div className="space-y-4">
          {sortedFlights.map((flight, index) => (
            <FlightCard
              key={index}
              flight={flight}
              isSelected={selectedFlight === index}
              onSelect={() => setSelectedFlight(index)}
              onBook={() => handleBookFlight(flight)}
              trip={trip}
            />
          ))}
        </div>

        {/* Booking Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Booking Information</p>
              <ul className="space-y-1 text-xs">
                <li>• Prices shown are current estimates and may change</li>
                <li>
                  • You'll be redirected to the airline's official website
                </li>
                <li>• Book early for better deals and seat selection</li>
                <li>
                  • All flights are round-trip for your{" "}
                  {trip?.userSelection?.duration} day trip
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Price Alerts & Partner Links */}
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-2xl mb-2">⚠️</div>
        <h3 className="font-semibold text-red-800 mb-2">Flight Data Error</h3>
        <p className="text-sm text-red-700 mb-4">
          There was an issue loading flight information. Please try refreshing
          the page.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() =>
              window.open(generateTripComURL({ destination: "CEB" }), "_blank")
            }
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Search on Trip.com
          </Button>
          <Button
            onClick={() =>
              window.open("https://www.agoda.com/flights", "_blank")
            }
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
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
function FlightCard({ flight, isSelected, onSelect, onBook, trip }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`border rounded-lg transition-all duration-200 hover:shadow-md ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      {/* Main Flight Info */}
      <div className="p-4 cursor-pointer" onClick={onSelect}>
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
                <div className="font-medium">{flight.duration}</div>
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

            {/* Toggle Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
              className="text-blue-600 text-xs mt-2 hover:text-blue-700 flex items-center gap-1"
            >
              {showDetails ? "Hide Details" : "Show Details"}
              <ArrowRight
                className={`h-3 w-3 transition-transform ${
                  showDetails ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>

          {/* Price and Booking */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 lg:gap-2">
            <div className="text-right">
              <div className="text-xs text-gray-600 mb-1">Total Price</div>
              <div className="text-2xl font-bold text-green-600">
                {flight.price}
              </div>
              <div className="text-xs text-gray-500">per person</div>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                onBook();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              Book Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Baggage Info */}
            {flight.baggage_allowance && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Baggage Allowance
                </h4>
                <p className="text-gray-600">{flight.baggage_allowance}</p>
              </div>
            )}

            {/* Cancellation Policy */}
            {flight.cancellation_policy && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Cancellation Policy
                </h4>
                <p className="text-gray-600">{flight.cancellation_policy}</p>
              </div>
            )}

            {/* Amenities */}
            {flight.amenities && flight.amenities.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-2">
                  Included Amenities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {flight.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FlightBooking;
