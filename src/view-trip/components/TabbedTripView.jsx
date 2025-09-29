import React, { useState } from "react";
import { Calendar, MapPin, Hotel, Plane, Info, Lightbulb } from "lucide-react";

// Import existing components
import InfoSection from "./InfoSection";
import Hotels from "./Hotels";
import PlacesToVisit from "./PlacesToVisit";
import FlightBooking from "./FlightBooking";

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
            component: (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">✈️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Flight Booking
                    </h2>
                    <p className="text-sm text-gray-600">
                      Book your flights with our travel partners
                    </p>
                  </div>
                </div>
                <FlightBooking trip={trip} />
              </div>
            ),
          },
        ]
      : []),
    {
      id: "tips",
      label: "Travel Tips",
      icon: <Lightbulb className="h-4 w-4" />,
      component: (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">💡</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Travel Tips & Information
              </h2>
              <p className="text-sm text-gray-600">
                Essential information for your trip to{" "}
                {trip?.userSelection?.location}
              </p>
            </div>
          </div>

          {/* Travel Tips Content */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Safety & Health */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span>🛡️</span>
                Safety & Health
              </h3>
              <ul className="text-orange-800 text-sm space-y-2">
                <li>• Keep copies of important documents</li>
                <li>• Research local emergency numbers</li>
                <li>• Pack a basic first-aid kit</li>
                <li>• Stay hydrated and eat safely</li>
              </ul>
            </div>

            {/* Cultural Tips */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span>🌏</span>
                Cultural Etiquette
              </h3>
              <ul className="text-orange-800 text-sm space-y-2">
                <li>• Learn basic local phrases</li>
                <li>• Respect local customs and dress codes</li>
                <li>• Tip appropriately for the region</li>
                <li>• Be mindful of photography restrictions</li>
              </ul>
            </div>

            {/* Money & Communication */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span>💳</span>
                Money & Communication
              </h3>
              <ul className="text-orange-800 text-sm space-y-2">
                <li>• Notify banks of travel plans</li>
                <li>• Have multiple payment methods</li>
                <li>• Download offline maps and translation apps</li>
                <li>• Keep emergency cash in local currency</li>
              </ul>
            </div>

            {/* Packing Essentials */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span>🎒</span>
                Packing Essentials
              </h3>
              <ul className="text-orange-800 text-sm space-y-2">
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-0">
        {/* Main Content with Tabs */}
        <div className="xl:col-span-3">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white">
            <div className="p-6">
              {tabs.find((tab) => tab.id === activeTab)?.component}
            </div>
          </div>
        </div>

        {/* Compact Sidebar */}
        <div className="xl:col-span-1 border-l border-gray-200 bg-gray-50">
          <div className="p-6 space-y-6">
            {/* Trip Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h3 className="text-lg font-bold">Trip Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-100">Destination</span>
                  <span className="font-semibold text-right text-sm">
                    {trip?.userSelection?.location}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-100">Duration</span>
                  <span className="font-semibold">
                    {trip?.userSelection?.duration} days
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-100">Travelers</span>
                  <span className="font-semibold">
                    {trip?.userSelection?.travelers}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-100">Budget</span>
                  <span className="font-semibold text-sm">
                    {trip?.userSelection?.customBudget
                      ? `₱${trip?.userSelection?.customBudget}`
                      : trip?.userSelection?.budget}
                  </span>
                </div>
                {trip?.hasRealFlights && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-blue-100">Flight Data</span>
                    <span className="font-semibold text-green-300">✅ Live</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md">
                  <span className="text-lg">📤</span> Share Trip
                </button>
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md">
                  <span className="text-lg">📄</span> Download PDF
                </button>
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md">
                  <span className="text-lg">✏️</span> Edit Trip
                </button>
              </div>
            </div>

            {/* Trip Status Indicators */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Trip Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Itinerary</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ✅ Ready
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hotels</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ✅ Available
                  </span>
                </div>
                {trip?.hasRealFlights && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Flights</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      ✈️ Live Data
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Weather Info Card (placeholder) */}
            <div className="bg-gradient-to-br from-sky-100 to-blue-100 rounded-lg p-4 border border-sky-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sky-600 text-lg">🌤️</span>
                <h4 className="font-semibold text-sky-900">Weather Forecast</h4>
              </div>
              <p className="text-sky-800 text-sm">
                Check weather conditions for {trip?.userSelection?.location} before
                your trip
              </p>
              <button className="mt-2 text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded-full transition-colors">
                View Forecast
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TabbedTripView;
