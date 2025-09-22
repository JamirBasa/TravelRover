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

  // Check if we have real flight data
  const hasFlightData = trip?.hasRealFlights && trip?.realFlightData?.success;
  const flights = trip?.realFlightData?.flights || [];

  if (!hasFlightData || flights.length === 0) {
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
            onClick={() => window.open("https://www.expedia.com.ph/", "_blank")}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Book on Expedia
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
  const sortedFlights = [...flights].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return (
          parseFloat(a.price.replace(/[₱,]/g, "")) -
          parseFloat(b.price.replace(/[₱,]/g, ""))
        );
      case "duration":
        return a.duration.localeCompare(b.duration);
      case "departure":
        return a.departure.localeCompare(b.departure);
      default:
        return 0;
    }
  });

  const handleBookFlight = (flight) => {
    // Use the booking URL from the flight data if available
    const bookingUrl = flight.booking_url || "https://www.expedia.com.ph/";

    // Track booking attempt (you can add analytics here)
    console.log("Flight booking attempt:", flight);

    // Create booking URL with search parameters
    const params = new URLSearchParams({
      from: "MNL", // Default to Manila
      to: trip?.userSelection?.location || "",
      departure: trip?.userSelection?.startDate || "",
      return: trip?.userSelection?.endDate || "",
      passengers: trip?.userSelection?.travelers || "1",
      cabin: "economy",
    });

    // Generate specific booking URL with search parameters
    let finalBookingUrl = bookingUrl;

    // Add search parameters for better user experience
    if (bookingUrl.includes("expedia.com")) {
      finalBookingUrl = `${bookingUrl}Flights?${params.toString()}`;
    } else if (bookingUrl.includes("agoda.com")) {
      finalBookingUrl = `${bookingUrl}?${params.toString()}`;
    }

    // Open booking URL
    window.open(finalBookingUrl, "_blank");
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
            {flights.length} options found • Real-time prices
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
              <li>• You'll be redirected to the airline's official website</li>
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
            {Object.entries(trip.realFlightData.booking_info.partner_links).map(
              ([name, url]) => (
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
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
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
