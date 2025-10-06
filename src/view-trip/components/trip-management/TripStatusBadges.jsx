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
          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 px-2 py-1 text-xs font-medium"
        >
          <DollarSign className="h-3 w-3" />
          Custom Budget
        </Badge>
      )}
      {trip?.userSelection?.specificRequests && (
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 px-2 py-1 text-xs font-medium"
        >
          <Star className="h-3 w-3" />
          Personalized
        </Badge>
      )}
      {trip?.hasRealFlights && (
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 bg-green-50 text-green-700 border-green-200 px-2 py-1 text-xs font-medium"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live Flights
        </Badge>
      )}
    </div>
  );
}

export default TripStatusBadges;
