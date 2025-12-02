import React, { useState, forwardRef, useImperativeHandle } from "react";
import {
  Calendar,
  MapPin,
  Hotel,
  Plane,
  Info,
  Lightbulb,
  Map,
  MessageCircle,
} from "lucide-react";

// ✅ Import production logging
import { logDebug } from "@/utils/productionLogger";
// ✅ Import budget calculator
import { calculateTotalBudget } from "@/utils";
// ✅ Import deduplication utility
import { cleanItinerary } from "@/utils/itineraryDeduplicator";

// Import existing components from organized folders
import { InfoSection } from "../shared";
import { Hotels } from "../accommodations";
import { PlacesToVisit } from "../places-to-visit";
import { FlightBooking, GroundTransportBanner } from "../travel-bookings";
import { RouteOptimizationStatus } from "../optimization";
import { OptimizedRouteMap } from "../maps";
import { TripChatbot } from "../chat";
import WeatherForecast from "../weather/WeatherForecast";

function TabbedTripView({ trip, onTripUpdate }, ref) {
  const [activeTab, setActiveTab] = useState("overview");

  // ✅ Create ref for PlacesToVisit component
  const placesToVisitRef = React.useRef(null);

  // ✅ Create deduplicated itinerary for map component
  const cleanedItinerary = React.useMemo(() => {
    if (!trip?.tripData?.itinerary) return [];
    let parsed = trip.tripData.itinerary;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        logDebug("TabbedTripView", "Failed to parse itinerary", { error: e });
        return [];
      }
    }
    const cleaned = cleanItinerary(Array.isArray(parsed) ? parsed : []);
    logDebug("TabbedTripView", "Cleaned itinerary for map", {
      originalDays: Array.isArray(parsed) ? parsed.length : 0,
      cleanedDays: cleaned.length,
    });
    return cleaned;
  }, [trip?.tripData?.itinerary]);

  // ✅ Debug: Log when component mounts
  React.useEffect(() => {
    logDebug("TabbedTripView", "Component mounted");
    return () => logDebug("TabbedTripView", "Component unmounting");
  }, []);

  // ✅ Expose methods to parent component via ref
  useImperativeHandle(ref, () => {
    logDebug(
      "TabbedTripView",
      "Setting up ref methods via useImperativeHandle"
    );
    return {
      switchToItinerary: () => {
        logDebug("TabbedTripView", "switchToItinerary called", {
          currentTab: activeTab,
        });
        setActiveTab("itinerary");
        logDebug("TabbedTripView", "Tab switched to itinerary");

        // After tab switch, expand and focus Day 1
        setTimeout(() => {
          if (
            placesToVisitRef.current &&
            placesToVisitRef.current.expandAndFocusDay
          ) {
            logDebug(
              "TabbedTripView",
              "Calling expandAndFocusDay on PlacesToVisit"
            );
            placesToVisitRef.current.expandAndFocusDay(0);
          }
        }, 300);
      },
    };
  });

  // ✅ Check if user enabled flights but has no real flight data (inactive airports show alternatives)
  const showsFlightAlternatives =
    trip?.flightPreferences?.includeFlights &&
    !trip?.realFlightData?.success &&
    !trip?.hasRealFlights;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <Info className="h-5 w-5" />,
      component: (
        <div className="space-y-6">
          <InfoSection trip={trip} />

          {/* Simple Transport Summary - Overview only, details in Air Travel tab */}
          {trip?.transportMode?.mode && (
            <div className="brand-card p-4 border border-sky-200">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {trip.transportMode.mode === "ground_preferred" ? "🚌" : "✈️"}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {trip.transportMode.mode === "ground_preferred"
                      ? "Ground Transport Recommended"
                      : "Flight Recommended"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {trip.transportMode.mode === "ground_preferred"
                      ? "Travel by bus/van for a scenic journey"
                      : "Air travel is the most efficient option for your route"}
                    {" • "}
                    <button
                      onClick={() =>
                        setActiveTab(
                          trip?.flightPreferences?.includeFlights
                            ? "air-travel"
                            : "itinerary"
                        )
                      }
                      className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium"
                    >
                      View Details →
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Weather Forecast - Shows for trips within 14 days */}
          <div id="weather-forecast-section">
            <WeatherForecast trip={trip} />
          </div>

          {trip?.routeOptimization && (
            <RouteOptimizationStatus
              routeOptimization={trip.routeOptimization}
              className="animate-fadeIn"
            />
          )}
        </div>
      ),
    },
    {
      id: "accommodations",
      label: "Accommodations",
      icon: <Hotel className="h-5 w-5" />,
      component: <Hotels trip={trip} />,
    },
    // ✅ Show Air Travel tab if user ENABLED flights (even if no data for inactive airports)
    ...(trip?.flightPreferences?.includeFlights ||
    trip?.hasRealFlights ||
    trip?.realFlightData?.success ||
    trip?.flightResults?.success
      ? [
          {
            id: "air-travel",
            label: "Air Travel",
            icon: <Plane className="h-5 w-5" />,
            component: (
              <div className="space-y-4">
                {/* Show ground transport info if ground_preferred */}
                {trip?.transportMode?.mode === "ground_preferred" ? (
                  <GroundTransportBanner
                    transportMode={trip.transportMode}
                    costBreakdown={trip.costBreakdown}
                  />
                ) : (
                  /* Show flight booking if flights are recommended */
                  <FlightBooking trip={trip} />
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      id: "itinerary",
      label: "Itinerary",
      icon: <Calendar className="h-5 w-5" />,
      component: (
        <PlacesToVisit
          ref={placesToVisitRef}
          trip={trip}
          onTripUpdate={onTripUpdate}
        />
      ),
    },
    {
      id: "map",
      label: "Interactive Map",
      icon: <Map className="h-5 w-5" />,
      component: (
        <OptimizedRouteMap
          itinerary={cleanedItinerary}
          destination={
            trip?.userSelection?.location || trip?.tripData?.destination
          }
          trip={trip}
        />
      ),
    },
    {
      id: "chat",
      label: "AI Assistant",
      icon: <MessageCircle className="h-5 w-5" />,
      component: <TripChatbot trip={trip} />,
    },
    {
      id: "tips",
      label: "Travel Tips",
      icon: <Lightbulb className="h-5 w-5" />,
      component: (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950/50 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-sm">
                💡
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Travel Tips & Information
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                Essential information for your trip to{" "}
                {trip?.userSelection?.location}
              </p>
            </div>
          </div>

          {/* Travel Tips Content */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Safety & Health */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-orange-100 dark:border-orange-900/50">
              <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-3 flex items-center gap-2 text-sm">
                <span>🛡️</span>
                Safety & Health
              </h3>
              <ul className="text-orange-800 dark:text-orange-400/90 text-xs space-y-1.5">
                <li>• Keep copies of important documents</li>
                <li>• Research local emergency numbers</li>
                <li>• Pack a basic first-aid kit</li>
                <li>• Stay hydrated and eat safely</li>
              </ul>
            </div>

            {/* Cultural Tips */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-orange-100 dark:border-orange-900/50">
              <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-3 flex items-center gap-2 text-sm">
                <span>🌏</span>
                Cultural Etiquette
              </h3>
              <ul className="text-orange-800 dark:text-orange-400/90 text-xs space-y-1.5">
                <li>• Learn basic local phrases</li>
                <li>• Respect local customs and dress codes</li>
                <li>• Tip appropriately for the region</li>
                <li>• Be mindful of photography restrictions</li>
              </ul>
            </div>

            {/* Money & Communication */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-orange-100 dark:border-orange-900/50">
              <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-3 flex items-center gap-2 text-sm">
                <span>💳</span>
                Money & Communication
              </h3>
              <ul className="text-orange-800 dark:text-orange-400/90 text-xs space-y-1.5">
                <li>• Notify banks of travel plans</li>
                <li>• Have multiple payment methods</li>
                <li>• Download offline maps and translation apps</li>
                <li>• Keep emergency cash in local currency</li>
              </ul>
            </div>

            {/* Packing Essentials */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-orange-100 dark:border-orange-900/50">
              <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-3 flex items-center gap-2 text-sm">
                <span>🎒</span>
                Packing Essentials
              </h3>
              <ul className="text-orange-800 dark:text-orange-400/90 text-xs space-y-1.5">
                <li>• Check weather forecasts and pack accordingly</li>
                <li>• Bring universal power adapters</li>
                <li>• Pack light but bring versatile clothing</li>
                <li>• Don't forget chargers and power banks</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="brand-card shadow-lg border-0 overflow-hidden w-full">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-0 w-full">
        {/* Main Content with Enhanced Tabs */}
        <section className="xl:col-span-3 w-full" aria-label="Trip content">
          {/* Compact Tab Navigation */}
          <nav
            className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 relative"
            role="tablist"
            aria-label="Trip sections"
          >
            {/* Scroll hint gradient indicators */}
            <div
              className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent pointer-events-none z-10"
              aria-hidden="true"
            ></div>
            <div
              className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none z-10"
              aria-hidden="true"
            ></div>

            <div
              className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory 
                         scrollbar-track-gray-100 dark:scrollbar-track-slate-800
                         scrollbar-thumb-gray-400 dark:scrollbar-thumb-slate-500
                         hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-slate-400"
              style={{
                scrollbarWidth: "auto" /* Firefox - show full scrollbar */,
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 sm:px-5 py-4 text-sm sm:text-base font-medium border-b-2 transition-all duration-300 whitespace-nowrap cursor-pointer flex-shrink-0 snap-start ${
                    activeTab === tab.id
                      ? "border-sky-500 dark:border-sky-400 text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/50"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/30 dark:hover:bg-sky-950/20"
                  }`}
                >
                  <span
                    className={`transition-colors duration-300 ${
                      activeTab === tab.id
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-gray-500 dark:text-gray-500 group-hover:text-sky-500"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {/* ✅ Show "Alternatives" badge on Flights tab when no direct flights */}
                  {tab.id === "flights" && showsFlightAlternatives && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700">
                      Alternatives
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Optimized Tab Content */}
          <div className="bg-white dark:bg-slate-950 min-h-[500px] w-full flex flex-col">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                id={`tabpanel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                className={`w-full ${
                  // ✅ No padding for chat tab (fills container), normal padding for others
                  tab.id === "chat"
                    ? "p-4 sm:p-5 lg:p-6 flex-1 flex flex-col"
                    : "p-3 sm:p-4 lg:p-6"
                } ${activeTab === tab.id ? "block" : "hidden"}`}
              >
                {tab.component}
              </div>
            ))}
          </div>
        </section>

        {/* Responsive Sidebar */}
        <aside
          className="xl:col-span-1 border-l border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50"
          aria-label="Trip summary and actions"
        >
          <div className="p-4 sm:p-5 space-y-4 xl:sticky xl:top-20">
            {/* At A Glance Card - Clean & Professional */}
            <div className="brand-gradient rounded-xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span
                    className="text-white text-lg"
                    role="img"
                    aria-label="Overview"
                  >
                    ✨
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">At A Glance</h3>
                  <p className="text-white/80 text-xs">Your trip essentials</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Travel Dates - Prominent Display */}
                {trip?.userSelection?.startDate &&
                  trip?.userSelection?.endDate && (
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">📅</span>
                        <span className="text-white/90 font-semibold text-sm">
                          Travel Period
                        </span>
                      </div>
                      <p className="font-bold text-white text-base leading-relaxed">
                        {new Date(
                          trip.userSelection.startDate
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {new Date(
                          trip.userSelection.endDate
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                {/* Trip Overview - 2 Key Metrics */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Duration */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10 hover:bg-white/15 transition-colors">
                    <div className="text-2xl font-bold text-white mb-1.5">
                      {trip?.userSelection?.duration || 0}
                    </div>
                    <div className="text-white/80 text-xs font-medium">
                      Days
                    </div>
                  </div>

                  {/* Travelers */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10 hover:bg-white/15 transition-colors">
                    <div className="text-2xl font-bold text-white mb-1.5">
                      {trip?.userSelection?.travelers || 1}
                    </div>
                    <div className="text-white/80 text-xs font-medium">
                      {(trip?.userSelection?.travelers || 1) === 1
                        ? "Traveler"
                        : "Travelers"}
                    </div>
                  </div>
                </div>

                {/* Your Budget */}
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">💰</span>
                    <span className="text-white/90 font-semibold text-sm">
                      Your Budget
                    </span>
                  </div>
                  <p className="font-bold text-white text-base leading-relaxed">
                    {(() => {
                      // ✅ Priority 1: Use budgetAmount (already parsed number - new trips)
                      if (trip?.userSelection?.budgetAmount) {
                        return `₱${trip.userSelection.budgetAmount.toLocaleString()}`;
                      }

                      // ✅ Priority 2: Parse customBudget (string to number - custom budget)
                      if (
                        trip?.userSelection?.customBudget &&
                        trip.userSelection.customBudget.trim() !== ""
                      ) {
                        const amount = parseInt(
                          trip.userSelection.customBudget
                        );
                        return !isNaN(amount)
                          ? `₱${amount.toLocaleString()}`
                          : "Budget not set";
                      }

                      // ✅ Priority 3: Calculate from trip data (tier-based budgets like "Moderate")
                      if (trip?.tripData) {
                        const calculated = calculateTotalBudget(trip);
                        if (calculated?.total && calculated.total > 0) {
                          return `₱${calculated.total.toLocaleString()}`;
                        }
                      }

                      // ❌ No budget data available
                      return "Budget not set";
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md dark:shadow-sky-500/5 border border-gray-100 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-950/50 rounded flex items-center justify-center">
                  <span
                    className="text-blue-600 dark:text-blue-400 text-sm"
                    role="img"
                    aria-label="Actions"
                  >
                    ⚡
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Quick Actions
                </h3>
              </div>
              <div className="space-y-2.5">
                <button
                  className="brand-button w-full py-2.5 px-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:ring-offset-2 text-sm cursor-pointer"
                  aria-label="Share this trip"
                >
                  <span className="text-sm" role="img" aria-label="Share">
                    📤
                  </span>
                  <span>Share Trip</span>
                </button>
                <button
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 dark:from-emerald-500 dark:to-green-500 dark:hover:from-emerald-600 dark:hover:to-green-600 text-white py-2.5 px-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-sm cursor-pointer"
                  aria-label="Download trip as PDF"
                >
                  <span className="text-sm" role="img" aria-label="Download">
                    📄
                  </span>
                  <span>Download PDF</span>
                </button>
                <button
                  className="w-full bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 dark:from-slate-600 dark:to-slate-700 dark:hover:from-slate-500 dark:hover:to-slate-600 text-white py-2.5 px-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-slate-500 focus:ring-offset-2 text-sm cursor-pointer"
                  aria-label="Edit this trip"
                >
                  <span className="text-sm" role="img" aria-label="Edit">
                    ✏️
                  </span>
                  <span>Edit Trip</span>
                </button>
              </div>
            </div>

            {/* Weather Forecast */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-sky-200/50 dark:border-sky-800/50 shadow-sm dark:shadow-sky-500/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-sky-100 dark:bg-sky-950/50 rounded flex items-center justify-center">
                  <span
                    className="text-sky-600 dark:text-sky-400 text-sm"
                    role="img"
                    aria-label="Weather"
                  >
                    🌤️
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-sky-900 dark:text-sky-300 text-sm">
                    Weather Forecast
                  </h4>
                  <p className="text-sky-700 dark:text-sky-400 text-sm">
                    Stay prepared
                  </p>
                </div>
              </div>
              <p className="text-sky-800 dark:text-sky-400 text-sm mb-3 leading-relaxed">
                Check weather for{" "}
                <span className="font-semibold">
                  {trip?.userSelection?.location}
                </span>
              </p>
              <button
                onClick={() => {
                  logDebug(
                    "TabbedTripView",
                    "View Forecast clicked - switching to Overview tab",
                    {
                      location: trip?.userSelection?.location,
                      startDate: trip?.userSelection?.startDate?.toString(),
                      duration: trip?.userSelection?.duration,
                      hasApiKey: !!import.meta.env.VITE_OPENWEATHER_API_KEY,
                    }
                  );

                  setActiveTab("overview");
                  // Scroll to weather forecast section
                  setTimeout(() => {
                    const weatherSection = document.getElementById(
                      "weather-forecast-section"
                    );
                    logDebug(
                      "TabbedTripView",
                      "Weather section element lookup",
                      {
                        found: !!weatherSection,
                      }
                    );

                    if (weatherSection) {
                      logDebug(
                        "TabbedTripView",
                        "Scrolling to weather section"
                      );
                      weatherSection.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });

                      // Add a subtle highlight effect
                      weatherSection.style.transition = "transform 0.3s ease";
                      weatherSection.style.transform = "scale(1.02)";
                      setTimeout(() => {
                        weatherSection.style.transform = "scale(1)";
                      }, 300);
                    } else {
                      logDebug(
                        "TabbedTripView",
                        "Weather section not found - may not be displayed"
                      );
                    }
                  }, 150);
                }}
                className="w-full bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white px-3 py-2.5 rounded text-sm font-medium transition-all duration-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                aria-label="View detailed weather forecast"
              >
                View Forecast
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Wrap with forwardRef and set display name
const TabbedTripViewWithRef = forwardRef(TabbedTripView);
TabbedTripViewWithRef.displayName = "TabbedTripView";

export default TabbedTripViewWithRef;
