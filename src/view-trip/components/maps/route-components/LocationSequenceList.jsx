import React from "react";
import { MapPin, Clock, ArrowDown, Navigation2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isValidDuration, isValidPricing } from "./locationDataValidator";

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
      <div className="text-center py-12 px-4">
        <div className="brand-card p-8 shadow-md border-sky-100 dark:border-slate-700">
          <MapPin className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">
            No locations found for selected day
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
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
              <div className="flex items-center gap-3 my-6 px-1">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-sky-300 dark:via-sky-700 to-transparent"></div>
                <Badge
                  variant="outline"
                  className="text-sm font-bold px-4 py-1.5 
                           bg-gradient-to-r from-sky-50 to-blue-50 
                           dark:from-slate-800 dark:to-slate-900 
                           border-2 shadow-md"
                  style={{ borderColor: getMarkerColor(location.day) }}
                >
                  <Sparkles
                    className="h-3.5 w-3.5 mr-1.5 inline"
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
 * Enhanced card with professional styling and realistic data display
 */
function LocationCard({ location, index, onLocationClick, getMarkerColor }) {
  // Validate and categorize the location type
  const isHotelReturn = location.isReturnToHotel;
  const hasDuration = isValidDuration(location.duration);
  const hasPricing = isValidPricing(location.pricing);
  const hasMetadata = location.time || hasDuration || hasPricing;

  return (
    <div className="group transition-all duration-200">
      <div
        className="relative flex items-start gap-4 p-5 rounded-xl 
                   border-2 border-gray-200 dark:border-slate-700
                   bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm
                   hover:shadow-xl hover:border-sky-400 dark:hover:border-sky-600 
                   hover:-translate-y-0.5
                   cursor-pointer transition-all duration-200"
        onClick={() => onLocationClick(location)}
      >
        {/* Enhanced Number Badge with Gradient */}
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center 
                     text-white font-bold text-base flex-shrink-0 shadow-lg
                     transition-transform duration-200
                     group-hover:scale-110 group-hover:shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${getMarkerColor(
              location.day
            )} 0%, ${adjustColorBrightness(
              getMarkerColor(location.day),
              -20
            )} 100%)`,
          }}
        >
          <span className="relative z-10">{index + 1}</span>
          {/* Pulse effect on hover */}
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 
                       group-hover:animate-ping transition-opacity"
            style={{ backgroundColor: getMarkerColor(location.day) }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <h5
                className="font-bold text-gray-900 dark:text-gray-100 text-base 
                           leading-snug break-words"
              >
                {location.name}
              </h5>
              {isHotelReturn && (
                <Badge
                  variant="outline"
                  className="text-xs py-0.5 px-2 h-5 shrink-0
                           bg-gradient-to-r from-blue-50 to-indigo-50 
                           dark:from-blue-950/40 dark:to-indigo-950/40 
                           border-blue-400 dark:border-blue-600 
                           text-blue-700 dark:text-blue-400
                           font-medium"
                >
                  🏨 Return
                </Badge>
              )}
            </div>
            <Navigation2
              className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 
                       group-hover:text-sky-500 dark:group-hover:text-sky-400 
                       transition-all duration-200 group-hover:rotate-45"
            />
          </div>

          {/* Metadata Row */}
          {hasMetadata && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Day Badge */}
              <Badge
                variant="outline"
                className="text-xs font-semibold border-2 px-2.5 py-0.5
                         bg-white dark:bg-slate-800 shadow-sm"
                style={{
                  borderColor: getMarkerColor(location.day),
                  color: getMarkerColor(location.day),
                }}
              >
                Day {location.day}
              </Badge>

              {/* Time Badge */}
              {location.time && location.time !== "All Day" && (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium
                           text-gray-700 dark:text-gray-300
                           bg-gradient-to-r from-gray-50 to-gray-100 
                           dark:from-slate-800 dark:to-slate-700
                           px-3 py-1 rounded-full shadow-sm
                           border border-gray-200 dark:border-slate-600"
                >
                  <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{location.time}</span>
                </div>
              )}

              {/* Duration Badge */}
              {hasDuration && (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium
                           text-amber-700 dark:text-amber-400
                           bg-gradient-to-r from-amber-50 to-orange-50 
                           dark:from-amber-950/30 dark:to-orange-950/30
                           px-3 py-1 rounded-full shadow-sm
                           border border-amber-200 dark:border-amber-800"
                >
                  <span>⏱️</span>
                  <span>{location.duration}</span>
                </div>
              )}

              {/* Pricing Badge */}
              {hasPricing && (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium
                           text-emerald-700 dark:text-emerald-400
                           bg-gradient-to-r from-emerald-50 to-green-50 
                           dark:from-emerald-950/30 dark:to-green-950/30
                           px-3 py-1 rounded-full shadow-sm
                           border border-emerald-200 dark:border-emerald-800"
                >
                  <span>💰</span>
                  <span>{location.pricing}</span>
                </div>
              )}
            </div>
          )}

          {/* Details/Description */}
          {location.details && location.details.length > 10 && (
            <p
              className="text-sm text-gray-600 dark:text-gray-400 
                        line-clamp-2 leading-relaxed"
            >
              {location.details}
            </p>
          )}
        </div>

        {/* Enhanced Hover Indicator - Glassmorphic glow */}
        <div
          className="absolute inset-0 rounded-xl 
                   bg-gradient-to-br from-sky-400/10 to-blue-500/10
                   dark:from-sky-500/10 dark:to-blue-600/10
                   opacity-0 group-hover:opacity-100 
                   transition-opacity duration-200
                   pointer-events-none"
        />
        <div
          className="absolute inset-0 rounded-xl border-2 
                   border-sky-400 dark:border-sky-500
                   opacity-0 group-hover:opacity-100 
                   transition-opacity duration-200
                   pointer-events-none"
        />
      </div>
    </div>
  );
}

/**
 * Helper function to adjust color brightness
 */
function adjustColorBrightness(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
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
    <div className="flex items-center gap-3 my-3 ml-6 pl-0.5">
      {/* Enhanced animated connector line with transport icon */}
      <div className="flex flex-col items-center gap-1 py-3">
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
            className={`text-xl leading-none transition-transform duration-200 
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
        className="flex-1 rounded-xl border-2 backdrop-blur-sm
                   shadow-sm hover:shadow-md transition-all duration-200"
        style={{
          backgroundColor: colorScheme.bg,
          borderColor: colorScheme.border,
        }}
      >
        <div className="px-4 py-3">
          {/* Main travel info row */}
          <div className="flex items-center gap-3 flex-wrap">
            <ArrowDown
              className="h-4 w-4 flex-shrink-0"
              style={{ color: colorScheme.icon }}
            />

            {/* Duration with enhanced styling */}
            {travelInfo.duration && (
              <div className="flex items-center gap-2">
                <Clock
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: colorScheme.icon }}
                />
                <span
                  className="font-semibold text-sm"
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
                className="text-xs py-0.5 px-2.5 h-6 gap-1.5 font-medium
                         border-2 shadow-sm"
                style={{
                  borderColor: colorScheme.badgeBorder,
                  backgroundColor: colorScheme.badgeBg,
                  color: colorScheme.badgeText,
                }}
              >
                <span className="text-sm">{icon}</span>
                <span className="capitalize">{travelInfo.transport}</span>
              </Badge>
            )}
          </div>

          {/* Full description if available and different from duration */}
          {travelInfo.rawText &&
            travelInfo.rawText !== travelInfo.duration &&
            travelInfo.rawText.length > travelInfo.duration?.length && (
              <div
                className="text-xs italic mt-2 leading-relaxed"
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
