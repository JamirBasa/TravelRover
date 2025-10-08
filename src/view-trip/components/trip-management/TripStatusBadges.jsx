// src/view-trip/components/TripStatusBadges.jsx
import { Badge } from "@/components/ui/badge";
import { DollarSign, Star } from "lucide-react";

function TripStatusBadges({ trip }) {
  const hasBadges =
    trip?.userSelection?.customBudget ||
    trip?.userSelection?.specificRequests ||
    trip?.hasRealFlights;

  if (!hasBadges) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {trip?.userSelection?.customBudget && (
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border-sky-200 px-3 py-1.5 text-xs font-medium rounded-full shadow-sm"
        >
          <DollarSign className="h-3 w-3" />
          Custom Budget
        </Badge>
      )}
      {trip?.userSelection?.specificRequests && (
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border-sky-200 px-3 py-1.5 text-xs font-medium rounded-full shadow-sm"
        >
          <Star className="h-3 w-3" />
          Personalized
        </Badge>
      )}
      {trip?.hasRealFlights && (
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border-sky-200 px-3 py-1.5 text-xs font-medium rounded-full shadow-sm"
        >
          <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
          Live Flights
        </Badge>
      )}
    </div>
  );
}

export default TripStatusBadges;
