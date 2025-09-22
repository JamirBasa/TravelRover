// src/view-trip/components/TripHeader.jsx
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, Clock, Plane } from "lucide-react";
import TripActions from "./TripActions";

function TripHeader({ trip, onShare, onDownload, onEdit }) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Trip Title & Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {trip?.userSelection?.location}
              </h1>
              {trip.hasRealFlights && (
                <Badge
                  variant="secondary"
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  <Plane className="h-3 w-3 mr-1" />
                  Live Data
                </Badge>
              )}
            </div>

            {/* Trip Details */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{trip?.userSelection?.duration} days</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{trip?.userSelection?.travelers}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span>
                  {trip?.userSelection?.customBudget
                    ? `₱${trip?.userSelection?.customBudget}`
                    : trip?.userSelection?.budget}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  {new Date(trip?.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <TripActions
            onShare={onShare}
            onDownload={onDownload}
            onEdit={onEdit}
          />
        </div>
      </div>
    </div>
  );
}

export default TripHeader;
