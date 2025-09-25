// src/view-trip/components/TripStatusBadges.jsx
import { Badge } from "@/components/ui/badge";
import { DollarSign, Star, MapPin } from "lucide-react";

function TripStatusBadges({ trip }) {
  const hasBadges =
    trip?.userSelection?.customBudget ||
    trip?.userSelection?.specificRequests ||
    trip?.hasRealFlights;

  if (!hasBadges) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {trip?.userSelection?.customBudget && (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
        >
          <DollarSign className="h-3 w-3" />
          Custom Budget
        </Badge>
      )}
      {trip?.userSelection?.specificRequests && (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200"
        >
          <Star className="h-3 w-3" />
          Personalized
        </Badge>
      )}
    </div>
  );
}

export default TripStatusBadges;
