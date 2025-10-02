// src/view-trip/components/TripHeader.jsx
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, Clock, Plane } from "lucide-react";
import TripActions from "./TripActions";

function TripHeader({ trip, onShare, onDownload, onEdit }) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Trip Title */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                {trip?.userSelection?.location}
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              {trip?.userSelection?.duration} day adventure • Created{" "}
              {new Date(trip?.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
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
