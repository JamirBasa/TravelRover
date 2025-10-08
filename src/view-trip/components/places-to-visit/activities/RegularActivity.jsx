import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Star, DollarSign, Timer } from "lucide-react";
import { COLORS, PATTERNS, ANIMATIONS } from "../constants/designSystem";

function RegularActivity({ activity, activityIndex, dayIndex }) {
  // Generate consistent IDs for accessibility
  const activityId = `activity-${dayIndex}-${activityIndex}`;
  const titleId = `activity-title-${dayIndex}-${activityIndex}`;
  const detailsId = `activity-details-${dayIndex}-${activityIndex}`;

  return (
    <Card
      id={activityId}
      className={cn(
        PATTERNS.card.base,
        PATTERNS.card.hover,
        "group relative overflow-hidden"
      )}
      tabIndex="0"
      role="article"
      aria-labelledby={titleId}
      aria-describedby={detailsId}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="relative flex gap-3">
          {/* Enhanced activity indicator - Bigger and more visible */}
          <div className="flex-shrink-0 pt-1">
            <div
              className={cn(
                "w-5 h-5 rounded-full shadow-lg",
                COLORS.primary.gradient
              )}
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Enhanced time badge - Bigger icons and text */}
            {activity?.time && (
              <div className="flex items-center">
                <Badge
                  variant="secondary"
                  className={cn(
                    "gap-2 font-semibold border-0 px-3 py-1.5 text-sm",
                    "bg-primary/10 text-primary hover:bg-primary/20",
                    ANIMATIONS.transition.medium
                  )}
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={convertToISO8601Time(activity.time)}>
                    {activity.time}
                  </time>
                </Badge>
              </div>
            )}

            {/* Enhanced activity title - Bigger icon and more readable text */}
            <div className="flex items-start gap-2">
              <MapPin
                className={cn(
                  "h-5 w-5 mt-0.5 flex-shrink-0",
                  COLORS.primary.text
                )}
                aria-hidden="true"
              />
              <div className="flex-1">
                <h4
                  id={titleId}
                  className={cn(
                    "text-base font-semibold leading-tight",
                    "text-gray-900",
                    "break-words"
                  )}
                >
                  {activity?.placeName || "Activity"}
                </h4>

                {/* See Directions Link */}
                {activity?.placeName && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      activity.placeName
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors mt-1 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin className="h-3 w-3" />
                    See Directions
                  </a>
                )}
              </div>
            </div>

            {/* Enhanced description - More readable text */}
            <p
              id={detailsId}
              className="text-sm text-gray-600 leading-relaxed break-words"
            >
              {activity?.placeDetails ||
                "Discover this amazing location and create unforgettable memories during your visit."}
            </p>

            {/* Modern badge collection */}
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label="Activity details"
            >
              {activity?.ticketPricing && (
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 px-2 py-1 text-xs font-medium",
                    COLORS.badges.pricing.border,
                    COLORS.badges.pricing.bg,
                    COLORS.badges.pricing.text,
                    COLORS.badges.pricing.hover,
                    ANIMATIONS.transition.medium
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
                    "gap-1.5 px-2 py-1 text-xs font-medium",
                    COLORS.badges.time.border,
                    COLORS.badges.time.bg,
                    COLORS.badges.time.text,
                    COLORS.badges.time.hover,
                    ANIMATIONS.transition.medium
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
                    "gap-1.5 px-2 py-1 text-xs font-medium",
                    COLORS.badges.rating.border,
                    COLORS.badges.rating.bg,
                    COLORS.badges.rating.text,
                    COLORS.badges.rating.hover,
                    ANIMATIONS.transition.medium
                  )}
                >
                  <Star className="h-3 w-3" aria-hidden="true" />
                  <span className="font-medium">{activity.rating}/5</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to convert time to ISO 8601 format
function convertToISO8601Time(timeString) {
  if (!timeString) return "";

  try {
    // Expected format: "9:00 AM" or similar
    const [time, period] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    // Convert to 24-hour format
    if (period && period.toUpperCase() === "PM" && hours < 12) {
      hours += 12;
    } else if (period && period.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    // Format with leading zeros
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}:00`;
  } catch (error) {
    console.error("Error parsing time string:", timeString, error);
    return "";
  }
}

export default RegularActivity;
