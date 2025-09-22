// src/view-trip/components/FlightDataBanner.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plane,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";

function FlightDataBanner({ trip }) {
  if (!trip.hasRealFlights || !trip.realFlightData?.success) {
    return null;
  }

  const flights = trip.realFlightData?.flights || [];
  const bestFlight = flights.find((f) => f.is_best) || flights[0];
  const priceRange = {
    min: Math.min(
      ...flights.map((f) => parseFloat(f.price.replace(/[₱,]/g, "")))
    ),
    max: Math.max(
      ...flights.map((f) => parseFloat(f.price.replace(/[₱,]/g, "")))
    ),
  };

  const handleQuickBook = () => {
    const element = document.getElementById("flight-booking-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getPriceIcon = () => {
    switch (trip.realFlightData?.current_price) {
      case "low":
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case "high":
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriceColor = () => {
    switch (trip.realFlightData?.current_price) {
      case "low":
        return "text-green-700";
      case "high":
        return "text-red-700";
      default:
        return "text-blue-700";
    }
  };

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Flight Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Plane className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-blue-900">
                  Live Flight Prices Available
                </h3>
                <Badge
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                >
                  Real-time Data
                </Badge>
              </div>
              <p className="text-blue-800 text-sm">
                {flights.length} flight options found • Updated{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Price Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-blue-900 text-sm">
                  Best Deal
                </span>
                {bestFlight?.is_best && (
                  <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0">
                    ⭐
                  </Badge>
                )}
              </div>
              <div className="text-blue-700 text-lg font-bold">
                {bestFlight?.price || "N/A"}
              </div>
              <div className="text-blue-600 text-xs">
                {bestFlight?.name || ""}
              </div>
            </div>

            <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                {getPriceIcon()}
                <span className="font-medium text-blue-900 text-sm">
                  Price Level
                </span>
              </div>
              <div className={`text-lg font-bold ${getPriceColor()}`}>
                {trip.realFlightData?.current_price === "low" && "Great Deal!"}
                {trip.realFlightData?.current_price === "high" && "Premium"}
                {trip.realFlightData?.current_price === "typical" && "Typical"}
              </div>
              <div className="text-blue-600 text-xs">
                ₱{priceRange.min.toLocaleString()} - ₱
                {priceRange.max.toLocaleString()}
              </div>
            </div>

            <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
              <div className="font-medium text-blue-900 mb-1 text-sm">
                Total Options
              </div>
              <div className="text-blue-700 text-lg font-bold">
                {flights.length} flights
              </div>
              <div className="text-blue-600 text-xs">Round-trip available</div>
            </div>
          </div>
        </div>

        {/* Booking CTAs */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          <Button
            onClick={handleQuickBook}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            <Plane className="h-4 w-4 mr-2" />
            View All Flights
          </Button>

          <Button
            onClick={() => window.open("https://www.expedia.com.ph/", "_blank")}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Compare Prices
          </Button>

          {trip.realFlightData?.current_price === "low" && (
            <div className="text-center">
              <Badge className="bg-green-100 text-green-800 text-xs">
                🔥 Limited Time Deal
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlightDataBanner;
