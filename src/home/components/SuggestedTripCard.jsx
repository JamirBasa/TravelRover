import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, DollarSign, Plane } from "lucide-react";

function SuggestedTripCard({ trip, userProfile, onTripSelect }) {
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => onTripSelect(trip)}
    >
      {/* Trip Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={trip.image}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {userProfile && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            ✨ {trip.matchScore ? `${Math.round(trip.matchScore)}% Match` : 'For You'}
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {trip.matchReason}
        </div>
      </div>

      {/* Trip Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
          {trip.title}
        </h3>
        
        {/* Trip Meta */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{trip.destination}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Clock className="h-4 w-4" />
            <span>{trip.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Users className="h-4 w-4" />
            <span>{trip.travelers}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <DollarSign className="h-4 w-4" />
            <span>{trip.budget}</span>
          </div>
        </div>

        {/* Personalized Activities */}
        {trip.prioritizedActivities && trip.prioritizedActivities.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {userProfile ? "🎯 Matched Activities:" : "Featured Activities:"}
            </h4>
            <div className="space-y-1">
              {trip.prioritizedActivities.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.priority === 'high' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-gray-600 truncate">{item.activity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Considerations */}
        {trip.specialConsiderations && trip.specialConsiderations.length > 0 && (
          <div className="mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <h4 className="text-xs font-medium text-green-800 mb-1">✅ Perfect for you:</h4>
              <ul className="text-xs text-green-700 space-y-1">
                {trip.specialConsiderations.map((consideration, index) => (
                  <li key={index}>• {consideration}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Standard Highlights for non-personalized */}
        {(!trip.prioritizedActivities || trip.prioritizedActivities.length === 0) && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Highlights:</h4>
            <div className="flex flex-wrap gap-1">
              {trip.highlights.slice(0, 3).map((highlight, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={(e) => {
            e.stopPropagation();
            onTripSelect(trip);
          }}
        >
          <Plane className="h-4 w-4 mr-2" />
          {userProfile ? "Plan Personalized Trip" : "Plan This Trip"}
        </Button>
      </div>
    </div>
  );
}

export default SuggestedTripCard;