import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FaCalculator,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaPlane,
  FaHotel,
  FaUtensils,
  FaTicketAlt,
  FaBus,
  FaInfoCircle,
  FaArrowRight,
} from "react-icons/fa";
import {
  getBudgetRecommendations,
  getDestinationInfo,
  getAirportRecommendations,
  formatBudgetRange,
} from "../utils/budgetEstimator";
import { SelectTravelerOptions } from "../constants/options";

const BudgetEstimator = () => {
  const navigate = useNavigate();
  const [estimatorData, setEstimatorData] = useState({
    destination: "",
    departureCity: "Manila, Philippines",
    duration: 3,
    travelers: "Just Me",
    includeFlights: false,
    startDate: "",
  });

  const [showResults, setShowResults] = useState(false);

  // Handle input changes
  const handleChange = (field, value) => {
    setEstimatorData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setShowResults(false);
  };

  // Calculate estimates
  const budgetEstimates = useMemo(() => {
    if (!estimatorData.destination || !estimatorData.duration) {
      return null;
    }

    // Parse travelers count
    let travelerCount = 1;
    if (estimatorData.travelers) {
      const match = estimatorData.travelers.match(/(\d+)/);
      if (match) travelerCount = parseInt(match[1]);
    }

    return getBudgetRecommendations({
      destination: estimatorData.destination,
      departureLocation: estimatorData.departureCity,
      duration: estimatorData.duration,
      travelers: travelerCount,
      includeFlights: estimatorData.includeFlights,
      startDate: estimatorData.startDate,
    });
  }, [estimatorData]);

  // Get destination info
  const destinationInfo = useMemo(() => {
    if (!estimatorData.destination) return null;
    return getDestinationInfo(estimatorData.destination);
  }, [estimatorData.destination]);

  // Get airport info
  const airportInfo = useMemo(() => {
    if (!estimatorData.destination || !estimatorData.includeFlights)
      return null;
    return getAirportRecommendations(
      estimatorData.departureCity,
      estimatorData.destination
    );
  }, [
    estimatorData.destination,
    estimatorData.departureCity,
    estimatorData.includeFlights,
  ]);

  // Validation
  const canCalculate = estimatorData.destination && estimatorData.duration >= 1;

  const handleCalculate = () => {
    if (canCalculate) {
      setShowResults(true);
    }
  };

  const handlePlanTrip = () => {
    // Navigate to create trip with pre-filled data
    navigate("/create-trip", {
      state: {
        prefill: {
          location: estimatorData.destination,
          duration: estimatorData.duration,
          travelers: estimatorData.travelers,
        },
      },
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 brand-gradient rounded-full mb-6 shadow-lg">
              <FaCalculator className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold brand-gradient-text mb-4">
              Trip Budget Estimator
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Plan your perfect Philippine adventure! Get instant budget
              estimates tailored to your destination, travel style, and
              preferences.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Input Form */}
            <div className="space-y-6">
              {/* Destination Input */}
              <div className="brand-card p-6 shadow-lg border-sky-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="brand-gradient p-2 rounded-lg">
                    <FaMapMarkerAlt className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Where are you going?
                  </h3>
                </div>
                <Input
                  type="text"
                  placeholder="e.g., Boracay, Palawan, Cebu, Siargao..."
                  value={estimatorData.destination}
                  onChange={(e) => handleChange("destination", e.target.value)}
                  className="w-full text-base py-6 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/30"
                />
                {destinationInfo && (
                  <div className="mt-3 p-3 bg-sky-50 rounded-lg border border-sky-200">
                    <p className="text-sm text-sky-700">
                      <span className="font-semibold">
                        {estimatorData.destination}
                      </span>{" "}
                      is a{" "}
                      <span className="font-bold">
                        {destinationInfo.priceLevel}
                      </span>{" "}
                      price destination
                    </p>
                  </div>
                )}
              </div>

              {/* Duration Input */}
              <div className="brand-card p-6 shadow-lg border-sky-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="brand-gradient p-2 rounded-lg">
                    <FaCalendarAlt className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    How many days?
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={estimatorData.duration}
                    onChange={(e) =>
                      handleChange("duration", parseInt(e.target.value) || 1)
                    }
                    className="w-24 text-xl text-center font-bold py-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/30"
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="1"
                      max="14"
                      value={estimatorData.duration}
                      onChange={(e) =>
                        handleChange("duration", parseInt(e.target.value))
                      }
                      className="w-full accent-sky-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 day</span>
                      <span>14 days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Travelers Input */}
              <div className="brand-card p-6 shadow-lg border-sky-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="brand-gradient p-2 rounded-lg">
                    <FaUsers className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Who's traveling?
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SelectTravelerOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handleChange("travelers", option.title)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        estimatorData.travelers === option.title
                          ? "border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 shadow-sm"
                          : "border-gray-200 dark:border-slate-600 hover:border-sky-300 dark:hover:border-sky-500"
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-sm text-gray-800">
                        {option.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.people}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flight Options */}
              <div className="brand-card p-6 shadow-lg border-sky-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="brand-gradient p-2 rounded-lg">
                    <FaPlane className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Flight options
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Include Flights Toggle */}
                  <div
                    onClick={() =>
                      handleChange(
                        "includeFlights",
                        !estimatorData.includeFlights
                      )
                    }
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      estimatorData.includeFlights
                        ? "border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30"
                        : "border-gray-200 dark:border-slate-600 hover:border-sky-300 dark:hover:border-sky-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            estimatorData.includeFlights
                              ? "border-sky-500 bg-sky-500"
                              : "border-gray-300"
                          }`}
                        >
                          {estimatorData.includeFlights && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">
                          Include flight costs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Departure City - Only show if flights included */}
                  {estimatorData.includeFlights && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Departure City
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., Manila, Cebu, Davao..."
                        value={estimatorData.departureCity}
                        onChange={(e) =>
                          handleChange("departureCity", e.target.value)
                        }
                        className="w-full text-base py-4 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/30"
                      />
                    </div>
                  )}

                  {/* Travel Date - Only show if flights included */}
                  {estimatorData.includeFlights && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Travel Date (Optional)
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          for accurate pricing
                        </span>
                      </label>
                      <Input
                        type="date"
                        value={estimatorData.startDate}
                        onChange={(e) =>
                          handleChange("startDate", e.target.value)
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full text-base py-4 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/30"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={handleCalculate}
                disabled={!canCalculate}
                className={`w-full py-6 text-lg font-semibold rounded-xl transition-all ${
                  canCalculate
                    ? "brand-gradient hover:shadow-xl"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                <FaCalculator className="mr-2" />
                Calculate Budget
              </Button>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              {!showResults || !budgetEstimates ? (
                <div className="brand-card p-12 shadow-lg border-sky-200 text-center">
                  <div className="text-gray-400 mb-4">
                    <FaInfoCircle className="text-6xl mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Ready to estimate?
                  </h3>
                  <p className="text-gray-500">
                    Fill in your travel details and click "Calculate Budget" to
                    see personalized cost estimates for your trip.
                  </p>
                </div>
              ) : (
                <>
                  {/* Budget Estimates */}
                  <div className="brand-card p-6 shadow-lg border-sky-200">
                    <h3 className="text-xl font-bold brand-gradient-text mb-6 flex items-center gap-2">
                      <FaCalculator />
                      Estimated Budget Ranges
                    </h3>

                    <div className="space-y-4">
                      {Object.entries(budgetEstimates).map(([level, data]) => (
                        <div
                          key={level}
                          className="p-5 rounded-xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-lg font-bold text-sky-900 capitalize">
                                {level}
                              </h4>
                              <p className="text-xs text-sky-600 italic">
                                {data.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-sky-900">
                                {data.range}
                              </div>
                              <div className="text-xs text-sky-600">
                                {data.perPerson}/person
                              </div>
                            </div>
                          </div>

                          {/* Breakdown */}
                          <div className="border-t border-sky-200 pt-3 mt-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <FaHotel className="text-sky-600" />
                                <span className="text-gray-700">
                                  Accommodation
                                </span>
                              </div>
                              <span className="font-semibold text-gray-800">
                                ₱{data.breakdown.accommodation.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <FaUtensils className="text-sky-600" />
                                <span className="text-gray-700">
                                  Food & Dining
                                </span>
                              </div>
                              <span className="font-semibold text-gray-800">
                                ₱{data.breakdown.food.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <FaTicketAlt className="text-sky-600" />
                                <span className="text-gray-700">
                                  Activities
                                </span>
                              </div>
                              <span className="font-semibold text-gray-800">
                                ₱{data.breakdown.activities.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <FaBus className="text-sky-600" />
                                <span className="text-gray-700">
                                  Local Transport
                                </span>
                              </div>
                              <span className="font-semibold text-gray-800">
                                ₱{data.breakdown.transport.toLocaleString()}
                              </span>
                            </div>
                            {data.breakdown.flights > 0 && (
                              <div className="flex items-center justify-between text-sm border-t border-sky-100 pt-2">
                                <div className="flex items-center gap-2">
                                  <FaPlane className="text-sky-600" />
                                  <span className="text-gray-700 font-medium">
                                    Flights
                                  </span>
                                </div>
                                <span className="font-semibold text-gray-800">
                                  ₱{data.breakdown.flights.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Airport Info */}
                  {airportInfo && estimatorData.includeFlights && (
                    <div className="brand-card p-6 shadow-lg border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                      <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                        <FaPlane />
                        Flight Information
                      </h3>

                      <div className="space-y-3">
                        {airportInfo.departure && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                            <div className="text-xs text-emerald-600 font-medium mb-1">
                              From
                            </div>
                            <div className="font-semibold text-emerald-900">
                              {airportInfo.departure.name}
                            </div>
                            <div className="text-xs text-emerald-700 mt-1">
                              {airportInfo.departure.code} •{" "}
                              {airportInfo.departure.city}
                            </div>
                          </div>
                        )}

                        {airportInfo.destination && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                            <div className="text-xs text-emerald-600 font-medium mb-1">
                              To
                            </div>
                            <div className="font-semibold text-emerald-900">
                              {airportInfo.destination.name}
                            </div>
                            <div className="text-xs text-emerald-700 mt-1">
                              {airportInfo.destination.code} •{" "}
                              {airportInfo.destination.city}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trip Summary */}
                  <div className="brand-card p-6 shadow-lg border-sky-200 bg-gradient-to-br from-gray-50 to-white">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Trip Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Destination:</span>
                        <span className="font-semibold text-gray-800">
                          {estimatorData.destination}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold text-gray-800">
                          {estimatorData.duration}{" "}
                          {estimatorData.duration === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Travelers:</span>
                        <span className="font-semibold text-gray-800">
                          {estimatorData.travelers}
                        </span>
                      </div>
                      {estimatorData.includeFlights && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Flights:</span>
                          <span className="font-semibold text-gray-800">
                            From {estimatorData.departureCity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call to Action */}
                  <Button
                    onClick={handlePlanTrip}
                    className="w-full py-6 text-lg font-semibold rounded-xl brand-gradient hover:shadow-xl"
                  >
                    Create Trip with This Budget
                    <FaArrowRight className="ml-2" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="brand-card p-6 shadow-lg border-sky-200 text-center">
              <div className="brand-gradient w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaInfoCircle className="text-white text-xl" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Accurate Estimates
              </h4>
              <p className="text-sm text-gray-600">
                Based on real Philippine travel costs, regional pricing, and
                seasonal variations
              </p>
            </div>

            <div className="brand-card p-6 shadow-lg border-sky-200 text-center">
              <div className="brand-gradient w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-white text-xl" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">
                200+ Destinations
              </h4>
              <p className="text-sm text-gray-600">
                Covers major tourist spots and hidden gems across all Philippine
                regions
              </p>
            </div>

            <div className="brand-card p-6 shadow-lg border-sky-200 text-center">
              <div className="brand-gradient w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalculator className="text-white text-xl" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Smart Pricing
              </h4>
              <p className="text-sm text-gray-600">
                Flight costs adjust based on booking timing - book early to
                save!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BudgetEstimator;
