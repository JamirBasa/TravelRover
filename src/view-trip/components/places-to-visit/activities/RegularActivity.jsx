import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Star, DollarSign, Timer, Award } from "lucide-react";

function RegularActivity({ activity, activityIndex, dayIndex }) {
  // Generate consistent IDs for accessibility
  const activityId = `activity-${dayIndex}-${activityIndex}`;
  const titleId = `activity-title-${dayIndex}-${activityIndex}`;
  const detailsId = `activity-details-${dayIndex}-${activityIndex}`;
  
  return (
    <Card
      id={activityId}
      className={cn(
        "group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5",
        "border-border/40 hover:border-primary/30",
        "bg-card hover:bg-card/80 backdrop-blur-sm",
        "relative overflow-hidden focus-within:ring-2 focus-within:ring-primary/50"
      )}
      tabIndex="0"
      role="article"
      aria-labelledby={titleId}
      aria-describedby={detailsId}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Enhanced gradient overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-accent/5 transition-all duration-500 pointer-events-none rounded-lg" 
          aria-hidden="true"
        />

        <div className="relative flex gap-4">
          {/* Modern activity indicator */}
          <div className="flex-shrink-0 pt-1">
            <div
              className={cn(
                "w-3 h-3 rounded-full shadow-sm transition-all duration-300",
                "bg-gradient-to-r from-primary to-primary/80",
                "group-hover:scale-125 group-hover:shadow-md group-hover:shadow-primary/30",
                "ring-2 ring-background group-hover:ring-primary/20"
              )}
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Enhanced time badge */}
            {activity?.time && (
              <div className="flex items-center">
                <Badge
                  variant="secondary"
                  className={cn(
                    "gap-2 font-medium border-0",
                    "bg-primary/10 text-primary hover:bg-primary/15",
                    "transition-colors duration-200"
                  )}
                >
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <time dateTime={convertToISO8601Time(activity.time)}>{activity.time}</time>
                </Badge>
              </div>
            )}

            {/* Enhanced activity title */}
            <div className="flex items-start gap-2">
              <MapPin 
                className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" 
                aria-hidden="true" 
              />
              <h4
                id={titleId}
                className={cn(
                  "text-base font-semibold leading-tight",
                  "text-foreground group-hover:text-primary",
                  "transition-colors duration-200 break-words"
                )}
              >
                {activity?.placeName || "Activity"}
              </h4>
            </div>

            {/* Enhanced description */}
            <p 
              id={detailsId}
              className="text-sm text-muted-foreground leading-relaxed break-words"
            >
              {activity?.placeDetails ||
                "Discover this amazing location and create unforgettable memories during your visit."}
            </p>

            {/* Modern badge collection */}
            <div 
              className="flex flex-wrap items-center gap-2"
              aria-label="Activity details"
            >
              {activity?.ticketPricing && (
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 border-green-200 bg-green-50 text-green-700",
                    "hover:bg-green-100 transition-colors"
                  )}
                >
                  <DollarSign className="h-3 w-3" aria-hidden="true" />
                  <span className="font-medium">{activity.ticketPricing}</span>
                </Badge>
              )}

              {activity?.timeTravel && (
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 border-orange-200 bg-orange-50 text-orange-700",
                    "hover:bg-orange-100 transition-colors"
                  )}
                >
                  <Timer className="h-3 w-3" aria-hidden="true" />
                  <span className="font-medium">{activity.timeTravel}</span>
                </Badge>
              )}

              {activity?.rating && (
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 border-yellow-200 bg-yellow-50 text-yellow-700",
                    "hover:bg-yellow-100 transition-colors"
                  )}
                >
                  <Star className="h-3 w-3" aria-hidden="true" />
                  <span className="font-medium">{activity.rating}/5</span>
                </Badge>
              )}

              {/* Enhanced activity type indicator */}
              <Badge
                className={cn(
                  "gap-1.5 bg-primary/10 text-primary border-primary/20",
                  "hover:bg-primary/15 transition-colors"
                )}
              >
                <Award className="h-3 w-3" aria-hidden="true" />
                <span className="font-medium">Must-See</span>
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to convert time to ISO 8601 format
function convertToISO8601Time(timeString) {
  if (!timeString) return '';
  
  try {
    // Expected format: "9:00 AM" or similar
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    if (period && period.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (period && period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Format with leading zeros
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}:00`;
  } catch (error) {
    console.error('Error parsing time string:', timeString, error);
    return '';
  }
}

export default RegularActivity;
