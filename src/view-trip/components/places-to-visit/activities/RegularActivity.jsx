import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Clock,
  MapPin,
  Star,
  DollarSign,
  Timer,
  ChevronRight,
} from "lucide-react";
import { COLORS, PATTERNS, ANIMATIONS } from "../constants/designSystem";
import {
  parseTimeString,
  extractActivityTime,
  extractActivityPlaceName,
} from "../../../../utils";

function RegularActivity({ activity, activityIndex, dayIndex }) {
  // Generate consistent IDs for accessibility
  const activityId = `activity-${dayIndex}-${activityIndex}`;
  const titleId = `activity-title-${dayIndex}-${activityIndex}`;
  const detailsId = `activity-details-${dayIndex}-${activityIndex}`;

  // Extract enhanced time and place name
  const displayTime = extractActivityTime(activity);
  const cleanPlaceName = extractActivityPlaceName(activity);

  return (
    <Card
      id={activityId}
      className={cn(
        PATTERNS.card.base,
        PATTERNS.card.hover,
        "group relative overflow-hidden shadow-md hover:shadow-xl border-2 border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 rounded-xl transition-all duration-300"
      )}
      tabIndex="0"
      role="article"
      aria-labelledby={titleId}
      aria-describedby={detailsId}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="relative flex gap-3">
          {/* Compact activity indicator */}
          <div className="flex-shrink-0 pt-0.5">
            <div
              className={cn(
                "w-5 h-5 rounded-full shadow-md border-2 border-white dark:border-slate-800",
                COLORS.primary.gradient
              )}
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Compact time badge */}
            {displayTime && displayTime !== "All Day" && (
              <div className="flex items-center">
                <Badge
                  variant="secondary"
                  className={cn(
                    "gap-1.5 font-bold border px-3 py-1 text-xs",
                    "bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-200 dark:hover:bg-sky-900/50 shadow-sm",
                    ANIMATIONS.transition.medium
                  )}
                >
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <time dateTime={parseTimeString(displayTime)}>
                    {displayTime}
                  </time>
                </Badge>
              </div>
            )}

            {/* Compact activity title */}
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <h4
                  id={titleId}
                  className={cn(
                    "text-sm sm:text-base font-bold leading-tight",
                    "text-gray-900 dark:text-gray-100",
                    "break-words mb-1.5"
                  )}
                >
                  {cleanPlaceName || "Activity"}
                </h4>

                {/* See Directions Link - More compact */}
                {cleanPlaceName && cleanPlaceName !== "Activity" && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      cleanPlaceName
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin className="h-3 w-3" />
                    <span>Directions</span>
                  </a>
                )}
              </div>
            </div>

            {/* ✅ OPTIMIZED: Hide description by default, show on hover/click */}
            <details className="group/details">
              <summary className="text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors list-none flex items-center gap-1.5">
                <span>View Details</span>
                <ChevronRight
                  className="h-3 w-3 group-open/details:rotate-90 transition-transform"
                  aria-hidden="true"
                />
              </summary>
              <p
                id={detailsId}
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words mt-2 pl-1"
              >
                {activity?.placeDetails ||
                  "Discover this amazing location and create unforgettable memories during your visit."}
              </p>
            </details>

            {/* Compact badge collection - Minimal design */}
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label="Activity details"
            >
              {activity?.ticketPricing &&
                activity.ticketPricing !== "₱0" &&
                activity.ticketPricing !== "0" && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 px-2 py-0.5 text-xs font-semibold border",
                      "border-green-300 dark:border-green-800",
                      "bg-green-50 dark:bg-green-950/30",
                      "text-green-700 dark:text-green-400",
                      ANIMATIONS.transition.medium
                    )}
                  >
                    <span className="font-bold">{activity.ticketPricing}</span>
                  </Badge>
                )}

              {activity?.timeTravel && activity.timeTravel !== "Varies" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 px-2 py-0.5 text-xs font-semibold border",
                    "border-orange-300 dark:border-orange-800",
                    "bg-orange-50 dark:bg-orange-950/30",
                    "text-orange-700 dark:text-orange-400",
                    ANIMATIONS.transition.medium
                  )}
                >
                  <span className="font-bold">{activity.timeTravel}</span>
                </Badge>
              )}

              {activity?.rating &&
                activity.rating !== "4.0" &&
                activity.rating !== "4.0/5" && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 px-2 py-0.5 text-xs font-semibold border",
                      "border-yellow-300 dark:border-yellow-800",
                      "bg-yellow-50 dark:bg-yellow-950/30",
                      "text-yellow-700 dark:text-yellow-400",
                      ANIMATIONS.transition.medium
                    )}
                  >
                    <span className="font-bold">⭐ {activity.rating}</span>
                  </Badge>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Note: Time parsing utility moved to shared utils/jsonParsers.js

export default RegularActivity;
