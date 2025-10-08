import React from "react";
import { TripMap } from "./TripMap";
import { Button } from "../../../components/ui/button";
import { FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";

const DayItineraryMap = ({ trip, day, activities }) => {

  const handlePlaceSelect = (place) => {
    // Scroll to activity in itinerary
    const elementId = place.id.replace("day-", "activity-");
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add highlight effect
      element.classList.add("ring-2", "ring-sky-500", "ring-offset-2");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-sky-500", "ring-offset-2");
      }, 2000);
    }
  };

  const generateRoute = () => {
    // Get all places for the day
    const places = activities
      .filter((activity) => activity.location || activity.placeName)
      .map((activity) => activity.placeName || activity.location);

    if (places.length === 0) return;

    // Create Google Maps route URL
    const destination = trip.userSelection?.location || places[0];
    const waypoints = places.slice(1).join("|");

    let googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(
      destination
    )}`;
    if (waypoints) {
      googleMapsUrl += `/${encodeURIComponent(waypoints)}`;
    }

    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  const openInGoogleMaps = (searchQuery) => {
    const location = trip.userSelection?.location || "Philippines";
    const url = `https://www.google.com/maps/search/${encodeURIComponent(
      searchQuery + " near " + location
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Note: Route optimization is now handled in the backend during trip creation
  // The optimized routes are displayed in the RouteOptimizationStatus component

  return (
    <div className="space-y-4">
      {/* Day Map Header */}
      <div className="brand-card p-4 shadow-lg border-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="brand-gradient p-3 rounded-xl shadow-lg">
              <FaMapMarkerAlt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold brand-gradient-text">
                Day {day} Map
              </h3>
              <p className="text-gray-600 text-sm">
                {activities.length} activities to explore
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={generateRoute}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={activities.length === 0}
            >
              <FaExternalLinkAlt className="w-4 h-4" />
              Open Route
            </Button>

            <Button
              onClick={() => openInGoogleMaps(`attractions day ${day}`)}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              🔍 Explore Area
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="brand-card p-0 overflow-hidden">
        <TripMap
          trip={trip}
          selectedDay={day}
          onPlaceSelect={handlePlaceSelect}
        />
      </div>

      {/* Enhanced Quick Actions */}
      <div className="brand-card p-4 shadow-md">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>🔍</span>
          Discover Nearby
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openInGoogleMaps("restaurants")}
            className="h-auto py-3 px-4 flex-col gap-1 hover:bg-orange-50 hover:text-orange-700 transition-all"
          >
            <span className="text-lg">🍽️</span>
            <span className="text-xs font-medium">Restaurants</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openInGoogleMaps("attractions")}
            className="h-auto py-3 px-4 flex-col gap-1 hover:bg-blue-50 hover:text-blue-700 transition-all"
          >
            <span className="text-lg">🎯</span>
            <span className="text-xs font-medium">Attractions</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openInGoogleMaps("shopping")}
            className="h-auto py-3 px-4 flex-col gap-1 hover:bg-purple-50 hover:text-purple-700 transition-all"
          >
            <span className="text-lg">🛍️</span>
            <span className="text-xs font-medium">Shopping</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openInGoogleMaps("coffee shops")}
            className="h-auto py-3 px-4 flex-col gap-1 hover:bg-amber-50 hover:text-amber-700 transition-all"
          >
            <span className="text-lg">☕</span>
            <span className="text-xs font-medium">Coffee</span>
          </Button>
        </div>
      </div>

      {/* Day Summary */}
      {activities.length > 0 && (
        <div className="brand-card p-4 shadow-lg border-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">D{day}</span>
            </div>
            <div>
              <h4 className="font-bold text-sky-900 text-lg">Today's Journey</h4>
              <p className="text-sky-600 text-sm">Your curated experience awaits</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {activities.slice(0, 4).map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg transition-all bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-sky-500 text-white">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sky-800">
                    {activity.placeName || activity.location || activity.activity}
                  </p>
                  {activity.time && (
                    <p className="text-xs text-sky-600">
                      {activity.time}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {activities.length > 4 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
                  <span className="font-medium">+{activities.length - 4}</span> more activities in your itinerary
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { DayItineraryMap };
