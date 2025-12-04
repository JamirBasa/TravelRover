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
import TravelTips from "../tips/TravelTips";

function TabbedTripView({ trip, tripId, onTripUpdate }, ref) {
  const [activeTab, setActiveTab] = useState("overview");
  // ✅ Track live itinerary for instant map updates
  const [liveItinerary, setLiveItinerary] = useState(null);

  // ✅ Create ref for PlacesToVisit component
  const placesToVisitRef = React.useRef(null);

  // ✅ Create deduplicated itinerary for map component
  // Priority: liveItinerary (optimistic) > Firebase data (source of truth)
  const cleanedItinerary = React.useMemo(() => {
    // If we have live updates, use them for instant map refresh
    if (liveItinerary && Array.isArray(liveItinerary)) {
      const cleaned = cleanItinerary(liveItinerary);
      logDebug("TabbedTripView", "Using live itinerary for map (optimistic)", {
        days: cleaned.length,
      });
      return cleaned;
    }

    // Otherwise, use Firebase data
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
    logDebug("TabbedTripView", "Cleaned itinerary for map (from Firebase)", {
      originalDays: Array.isArray(parsed) ? parsed.length : 0,
      cleanedDays: cleaned.length,
    });
    return cleaned;
  }, [liveItinerary, trip?.tripData?.itinerary]);

  // ✅ Reset live itinerary when Firebase data changes (after save completes)
  React.useEffect(() => {
    if (trip?.tripData?.itinerary) {
      setLiveItinerary(null); // Clear optimistic state, Firebase is now source of truth
      logDebug("TabbedTripView", "Reset live itinerary after Firebase update");
    }
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
          onLiveItineraryChange={setLiveItinerary}
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
      component: <TravelTips trip={trip} tripId={tripId} />,
    },
  ];

  return (
    <div className="brand-card shadow-lg border-0 overflow-hidden w-full">
      {/* Trip Context Bar - Compact & Always Visible */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-b border-sky-200 dark:border-sky-800 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Dates & Budget */}
          <div className="flex items-center gap-6 flex-wrap">
            {trip?.userSelection?.startDate && trip?.userSelection?.endDate && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Date(trip.userSelection.startDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}{" "}
                  -{" "}
                  {new Date(trip.userSelection.endDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            )}

            <div className="h-4 w-px bg-gray-300 dark:bg-slate-600 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {(() => {
                  if (trip?.userSelection?.budgetAmount) {
                    return `₱${trip.userSelection.budgetAmount.toLocaleString()}`;
                  }
                  if (
                    trip?.userSelection?.customBudget &&
                    trip.userSelection.customBudget.trim() !== ""
                  ) {
                    const amount = parseInt(trip.userSelection.customBudget);
                    return !isNaN(amount)
                      ? `₱${amount.toLocaleString()}`
                      : "Budget not set";
                  }
                  if (trip?.tripData) {
                    const calculated = calculateTotalBudget(trip);
                    if (calculated?.total && calculated.total > 0) {
                      return `₱${calculated.total.toLocaleString()}`;
                    }
                  }
                  return "Budget not set";
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Content */}
      <div className="w-full">
        <section className="w-full" aria-label="Trip content">
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
      </div>
    </div>
  );
}

// Wrap with forwardRef and set display name
const TabbedTripViewWithRef = forwardRef(TabbedTripView);
TabbedTripViewWithRef.displayName = "TabbedTripView";

export default TabbedTripViewWithRef;
