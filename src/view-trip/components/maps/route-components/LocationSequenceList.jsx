import React from "react";
import { MapPin, Clock, ArrowDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * LocationSequenceList Component
 * Displays the ordered list of locations with travel time between them
 * Enhanced with professional design and realistic data validation
 */
export function LocationSequenceList({
  filteredLocations,
  onLocationClick,
  getMarkerColor,
  getTravelInfo,
}) {
  if (filteredLocations.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="brand-card p-6 sm:p-8 shadow-md border-sky-100 dark:border-slate-700">
          <MapPin className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
            No locations found for selected day
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
            Try selecting a different day or create a new trip
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredLocations.map((location, index) => {
        // Check if this is the start of a new day (for "All Days" view)
        const isNewDay =
          index === 0 || filteredLocations[index - 1].day !== location.day;
        const showDaySeparator = isNewDay && index > 0;

        return (
          <div key={location.id}>
            {/* Enhanced Day Separator */}
            {showDaySeparator && (
              <div className="flex items-center gap-2 sm:gap-3 my-4 sm:my-6 px-1">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-sky-300 dark:via-sky-700 to-transparent"></div>
                <Badge
                  variant="outline"
                  className="text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-4 sm:py-1.5 
                           bg-gradient-to-r from-sky-50 to-blue-50 
                           dark:from-slate-800 dark:to-slate-900 
                           border-2 shadow-md"
                  style={{ borderColor: getMarkerColor(location.day) }}
                >
                  <Sparkles
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 inline"
                    style={{ color: getMarkerColor(location.day) }}
                  />
                  Day {location.day}
                </Badge>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-sky-300 dark:via-sky-700 to-transparent"></div>
              </div>
            )}

            {/* Enhanced Location Card */}
            <LocationCard
              location={location}
              index={index}
              onLocationClick={onLocationClick}
              getMarkerColor={getMarkerColor}
            />

            {/* Travel Time Connector */}
            {index < filteredLocations.length - 1 &&
              getTravelInfo(index, index + 1) && (
                <TravelTimeConnector
                  travelInfo={getTravelInfo(index, index + 1)}
                />
              )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * LocationCard Component
 * Compact inline layout showing only essential information
 */
function LocationCard({ location, index, onLocationClick, getMarkerColor }) {
  const isHotelReturn = location.isReturnToHotel;

  return (
    <div
      className="group flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg 
                 border border-gray-200 dark:border-slate-700
                 bg-white dark:bg-slate-900
                 hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 
                 cursor-pointer transition-all duration-200"
      onClick={() => onLocationClick(location)}
    >
      {/* Compact Number Badge */}
      <div
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center 
                   text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-md
                   transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: getMarkerColor(location.day) }}
      >
        {index + 1}
      </div>

      {/* Inline Content: Day • Time • Activity Name */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Day */}
        <span
          className="text-[11px] sm:text-xs font-bold"
          style={{ color: getMarkerColor(location.day) }}
        >
          Day {location.day}
        </span>

        {/* Separator */}
        <span className="text-gray-400 dark:text-gray-600 text-[11px] sm:text-xs">
          •
        </span>

        {/* Time */}
        {location.time && location.time !== "All Day" && (
          <>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-sky-500 dark:text-sky-400" />
              <span className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">
                {location.time}
              </span>
            </div>
            <span className="text-gray-400 dark:text-gray-600 text-[11px] sm:text-xs">
              •
            </span>
          </>
        )}

        {/* Activity Name */}
        <h5 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
          {location.name}
        </h5>

        {/* Hotel Return Badge (if applicable) */}
        {isHotelReturn && (
          <Badge
            variant="outline"
            className="text-[10px] sm:text-xs py-0 px-1 sm:px-1.5 h-4 sm:h-5 ml-0.5 sm:ml-1
                     bg-blue-50 dark:bg-blue-950/40 
                     border-blue-400 dark:border-blue-600 
                     text-blue-700 dark:text-blue-400"
          >
            🏨
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * TravelTimeConnector Component
 * Shows AI-recommended travel time between consecutive locations
 * Enhanced with professional styling and realistic transport modes
 */
/**
 * TravelTimeConnector Component
 * Shows AI-recommended travel time between consecutive locations
 * Enhanced with professional styling and realistic transport modes
 */
function TravelTimeConnector({ travelInfo }) {
  // Use the transport icon from parsed data, or default to walking
  const icon = travelInfo.transportIcon || "🚶";

  // Categorize transport for styling
  const transportType = getTransportType(travelInfo.transport);
  const colorScheme = getColorScheme(transportType);

  return (
    <div className="flex items-center gap-2 sm:gap-3 my-2 sm:my-3 ml-4 sm:ml-6 pl-0.5">
      {/* Enhanced animated connector line with transport icon */}
      <div className="flex flex-col items-center gap-0.5 sm:gap-1 py-2 sm:py-3">
        {/* Top gradient line */}
        <div
          className="w-0.5 h-4 bg-gradient-to-b transition-all duration-300"
          style={{
            backgroundImage: `linear-gradient(to bottom, transparent, ${colorScheme.line})`,
          }}
        />

        {/* Transport icon with pulse animation */}
        <div className="relative">
          <div
            className={`text-base sm:text-xl leading-none transition-transform duration-200 
                       hover:scale-125 ${colorScheme.iconAnimation}`}
          >
            {icon}
          </div>
          {/* Subtle glow effect */}
          <div
            className="absolute inset-0 rounded-full blur-md opacity-30"
            style={{ backgroundColor: colorScheme.glow }}
          />
        </div>

        {/* Bottom gradient line */}
        <div
          className="w-0.5 h-4 bg-gradient-to-b transition-all duration-300"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${colorScheme.line}, transparent)`,
          }}
        />
      </div>

      {/* Enhanced travel info card with glassmorphism */}
      <div
        className="flex-1 rounded-lg sm:rounded-xl border sm:border-2 backdrop-blur-sm
                   shadow-sm hover:shadow-md transition-all duration-200"
        style={{
          backgroundColor: colorScheme.bg,
          borderColor: colorScheme.border,
        }}
      >
        <div className="px-2.5 py-2 sm:px-4 sm:py-3">
          {/* Main travel info row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ArrowDown
              className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
              style={{ color: colorScheme.icon }}
            />

            {/* Duration with enhanced styling */}
            {travelInfo.duration && (
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock
                  className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                  style={{ color: colorScheme.icon }}
                />
                <span
                  className="font-semibold text-xs sm:text-sm"
                  style={{ color: colorScheme.text }}
                >
                  {travelInfo.duration}
                </span>
              </div>
            )}

            {/* Transport mode badge (if not 'various') */}
            {travelInfo.transport && travelInfo.transport !== "various" && (
              <Badge
                variant="outline"
                className="text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2.5 h-5 sm:h-6 gap-1 sm:gap-1.5 font-medium
                         border sm:border-2 shadow-sm"
                style={{
                  borderColor: colorScheme.badgeBorder,
                  backgroundColor: colorScheme.badgeBg,
                  color: colorScheme.badgeText,
                }}
              >
                <span className="text-xs sm:text-sm">{icon}</span>
                <span className="capitalize">{travelInfo.transport}</span>
              </Badge>
            )}
          </div>

          {/* Full description if available and different from duration */}
          {travelInfo.rawText &&
            travelInfo.rawText !== travelInfo.duration &&
            travelInfo.rawText.length > travelInfo.duration?.length && (
              <div
                className="text-[10px] sm:text-xs italic mt-1.5 sm:mt-2 leading-relaxed"
                style={{ color: colorScheme.secondaryText }}
              >
                {travelInfo.rawText}
              </div>
            )}

          {/* AI source indicator with subtle styling */}
          {travelInfo.source && (
            <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
              <Sparkles
                className="h-3 w-3"
                style={{ color: colorScheme.icon }}
              />
              <span style={{ color: colorScheme.secondaryText }}>
                AI-recommended route
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: Categorize transport type for consistent styling
 */
function getTransportType(transport) {
  if (!transport) return "walking";

  const transportLower = transport.toLowerCase();

  if (["taxi", "car", "van"].includes(transportLower)) return "vehicle";
  if (["jeepney", "bus", "tricycle"].includes(transportLower)) return "public";
  if (["walking", "walk"].includes(transportLower)) return "walking";

  return "general";
}

/**
 * Helper: Get color scheme based on transport type
 */
function getColorScheme(transportType) {
  const schemes = {
    vehicle: {
      line: "#06b6d4",
      glow: "#06b6d4",
      bg: "rgba(240, 253, 255, 0.8)",
      border: "#67e8f9",
      icon: "#0891b2",
      text: "#0e7490",
      secondaryText: "#0e7490",
      badgeBg: "rgba(165, 243, 252, 0.3)",
      badgeBorder: "#67e8f9",
      badgeText: "#0e7490",
      iconAnimation: "hover:animate-pulse",
    },
    public: {
      line: "#8b5cf6",
      glow: "#8b5cf6",
      bg: "rgba(250, 245, 255, 0.8)",
      border: "#c4b5fd",
      icon: "#7c3aed",
      text: "#6d28d9",
      secondaryText: "#6d28d9",
      badgeBg: "rgba(221, 214, 254, 0.3)",
      badgeBorder: "#c4b5fd",
      badgeText: "#6d28d9",
      iconAnimation: "hover:animate-bounce",
    },
    walking: {
      line: "#10b981",
      glow: "#10b981",
      bg: "rgba(240, 253, 244, 0.8)",
      border: "#86efac",
      icon: "#059669",
      text: "#047857",
      secondaryText: "#047857",
      badgeBg: "rgba(187, 247, 208, 0.3)",
      badgeBorder: "#86efac",
      badgeText: "#047857",
      iconAnimation: "",
    },
    general: {
      line: "#0ea5e9",
      glow: "#0ea5e9",
      bg: "rgba(240, 249, 255, 0.8)",
      border: "#7dd3fc",
      icon: "#0284c7",
      text: "#0369a1",
      secondaryText: "#0369a1",
      badgeBg: "rgba(186, 230, 253, 0.3)",
      badgeBorder: "#7dd3fc",
      badgeText: "#0369a1",
      iconAnimation: "",
    },
  };

  return schemes[transportType] || schemes.general;
}
