import React, { useState } from "react";
import { Calendar, MapPin, Hotel, Plane, Info, Lightbulb } from "lucide-react";

// Import existing components from organized folders
import { InfoSection } from "../shared";
import { Hotels } from "../accommodations";
import { PlacesToVisit } from "../places-to-visit";
import { FlightBooking } from "../travel-bookings";

function TabbedTripView({ trip }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <Info className="h-4 w-4" />,
      component: <InfoSection trip={trip} />,
    },
    {
      id: "itinerary",
      label: "Itinerary",
      icon: <Calendar className="h-4 w-4" />,
      component: <PlacesToVisit trip={trip} />,
    },
    {
      id: "hotels",
      label: "Hotels",
      icon: <Hotel className="h-4 w-4" />,
      component: <Hotels trip={trip} />,
    },
    ...(trip?.hasRealFlights
      ? [
          {
            id: "flights",
            label: "Flights",
            icon: <Plane className="h-4 w-4" />,
            component: <FlightBooking trip={trip} />,
          },
        ]
      : []),
    {
      id: "tips",
      label: "Travel Tips",
      icon: <Lightbulb className="h-4 w-4" />,
      component: (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-sm">💡</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">
                Travel Tips & Information
              </h2>
              <p className="text-sm text-gray-600 break-words">
                Essential information for your trip to{" "}
                {trip?.userSelection?.location}
              </p>
            </div>
          </div>

          {/* Travel Tips Content */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Safety & Health */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2 text-sm">
                <span>🛡️</span>
                Safety & Health
              </h3>
              <ul className="text-orange-800 text-xs space-y-1.5">
                <li>• Keep copies of important documents</li>
                <li>• Research local emergency numbers</li>
                <li>• Pack a basic first-aid kit</li>
                <li>• Stay hydrated and eat safely</li>
              </ul>
            </div>

            {/* Cultural Tips */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2 text-sm">
                <span>🌏</span>
                Cultural Etiquette
              </h3>
              <ul className="text-orange-800 text-xs space-y-1.5">
                <li>• Learn basic local phrases</li>
                <li>• Respect local customs and dress codes</li>
                <li>• Tip appropriately for the region</li>
                <li>• Be mindful of photography restrictions</li>
              </ul>
            </div>

            {/* Money & Communication */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2 text-sm">
                <span>💳</span>
                Money & Communication
              </h3>
              <ul className="text-orange-800 text-xs space-y-1.5">
                <li>• Notify banks of travel plans</li>
                <li>• Have multiple payment methods</li>
                <li>• Download offline maps and translation apps</li>
                <li>• Keep emergency cash in local currency</li>
              </ul>
            </div>

            {/* Packing Essentials */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2 text-sm">
                <span>🎒</span>
                Packing Essentials
              </h3>
              <ul className="text-orange-800 text-xs space-y-1.5">
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
            className="bg-white border-b border-gray-200"
            role="tablist"
            aria-label="Trip sections"
          >
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-700 bg-blue-50/50"
                      : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`transition-colors duration-300 ${
                      activeTab === tab.id ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Optimized Tab Content */}
          <div className="bg-white min-h-[500px] w-full">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                id={`tabpanel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                className={`p-3 sm:p-4 lg:p-6 w-full ${
                  activeTab === tab.id ? "block" : "hidden"
                }`}
              >
                {tab.component}
              </div>
            ))}
          </div>
        </section>

        {/* Responsive Sidebar */}
        <aside
          className="xl:col-span-1 border-l border-gray-200 bg-gray-50/50"
          aria-label="Trip summary and actions"
        >
          <div className="p-4 sm:p-5 space-y-4 xl:sticky xl:top-20">
            {/* Trip Summary Card */}
            <div className="brand-gradient rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span
                    className="text-white text-sm"
                    role="img"
                    aria-label="Statistics"
                  >
                    📊
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Trip Summary</h3>
                  <p className="text-white/80 text-sm">Essential details</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1 py-2 border-b border-white/20">
                  <span className="text-white/90 font-medium text-sm">
                    Destination
                  </span>
                  <span className="font-semibold text-white text-sm break-words leading-relaxed">
                    {trip?.userSelection?.location || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/90 font-medium text-sm">
                    Duration
                  </span>
                  <span className="font-semibold text-white text-sm">
                    {trip?.userSelection?.duration || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/90 font-medium text-sm">
                    Travelers
                  </span>
                  <span className="font-semibold text-white text-sm">
                    {trip?.userSelection?.travelers || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/90 font-medium text-sm">
                    Budget
                  </span>
                  <span className="font-semibold text-white text-sm">
                    {trip?.userSelection?.customBudget
                      ? `₱${trip?.userSelection?.customBudget?.toLocaleString()}`
                      : trip?.userSelection?.budget || "Not set"}
                  </span>
                </div>
                {trip?.hasRealFlights && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-white/90 font-medium text-sm">
                      Flight Data
                    </span>
                    <span className="font-semibold text-green-300 flex items-center gap-1.5 text-sm">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      Live
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <span
                    className="text-blue-600 text-sm"
                    role="img"
                    aria-label="Actions"
                  >
                    ⚡
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="space-y-2.5">
                <button
                  className="brand-button w-full py-2.5 px-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                  aria-label="Share this trip"
                >
                  <span className="text-sm" role="img" aria-label="Share">
                    📤
                  </span>
                  <span>Share Trip</span>
                </button>
                <button
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-2.5 px-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-sm"
                  aria-label="Download trip as PDF"
                >
                  <span className="text-sm" role="img" aria-label="Download">
                    📄
                  </span>
                  <span>Download PDF</span>
                </button>
                <button
                  className="w-full bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white py-2.5 px-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
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
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-4 border border-sky-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-sky-100 rounded flex items-center justify-center">
                  <span
                    className="text-sky-600 text-sm"
                    role="img"
                    aria-label="Weather"
                  >
                    🌤️
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-sky-900 text-sm">
                    Weather Forecast
                  </h4>
                  <p className="text-sky-700 text-sm">Stay prepared</p>
                </div>
              </div>
              <p className="text-sky-800 text-sm mb-3 leading-relaxed">
                Check weather for{" "}
                <span className="font-semibold">
                  {trip?.userSelection?.location}
                </span>
              </p>
              <button
                className="w-full bg-sky-600 hover:bg-sky-700 text-white px-3 py-2.5 rounded text-sm font-medium transition-all duration-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
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

export default TabbedTripView;
