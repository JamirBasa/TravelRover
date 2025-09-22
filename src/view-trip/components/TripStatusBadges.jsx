// src/view-trip/components/TripStatusBadges.jsx
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign } from "lucide-react";

function TripStatusBadges({ trip }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Badge variant="outline" className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {trip?.userSelection?.duration} Day Trip
      </Badge>
      <Badge variant="outline" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {trip?.userSelection?.travelers}
      </Badge>
      {trip?.userSelection?.customBudget && (
        <Badge variant="outline" className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          Custom Budget
        </Badge>
      )}
      {trip?.userSelection?.specificRequests && (
        <Badge variant="outline">
          Custom Activities
        </Badge>
      )}
    </div>
  );
}

export default TripStatusBadges;