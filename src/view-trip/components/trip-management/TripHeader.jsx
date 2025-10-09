// src/view-trip/components/TripHeader.jsx
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, Clock, MapPin } from "lucide-react";
import TripActions from "./TripActions";
import { calculateTotalBudget, formatCurrency } from "@/utils/budgetCalculator";

function TripHeader({ trip, onShare, onDownload, onEdit }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate total estimated budget from generated itinerary
  const budgetInfo = calculateTotalBudget(trip);

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Compact Trip Title Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <MapPin className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1
                  className="text-lg sm:text-xl lg:text-2xl font-bold brand-gradient-text leading-tight break-words"
                  aria-label={`Trip to ${
                    trip?.userSelection?.location || "destination"
                  }`}
                >
                  {trip?.userSelection?.location || "Your Adventure"}
                </h1>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>Created {formatDate(trip?.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Compact Trip Details */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-1 text-xs font-medium"
              >
                <Calendar className="h-3 w-3 mr-1" />
                {trip?.userSelection?.duration || 0} days
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-700 border-green-200 px-2 py-1 text-xs font-medium"
              >
                <Users className="h-3 w-3 mr-1" />
                {trip?.userSelection?.travelers || "Multiple"}
              </Badge>
              {budgetInfo.total > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-purple-50 text-purple-700 border-purple-200 px-2 py-1 text-xs font-medium"
                  title={`Breakdown - Activities: ${formatCurrency(budgetInfo.breakdown.activities)} | Hotels: ${formatCurrency(budgetInfo.breakdown.hotels)} | Flights: ${formatCurrency(budgetInfo.breakdown.flights)}`}
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Total: {formatCurrency(budgetInfo.total)}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-200 px-2 py-1 text-xs font-medium"
              >
                Ready to explore
              </Badge>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex-shrink-0">
            <TripActions
              onShare={onShare}
              onDownload={onDownload}
              onEdit={onEdit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripHeader;
