// src/view-trip/components/travel-bookings/GroundTransportBanner.jsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  Mountain,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

/**
 * Display ground transport recommendations with 3 visual states:
 * 1. Ground Preferred (Green) - search_flights=false
 * 2. Flight Required (Blue) - ground_transport_notice exists
 * 3. Both Options (Yellow) - both available
 */
function GroundTransportBanner({ transportMode, costBreakdown }) {
  if (!transportMode || !transportMode.mode) {
    return null;
  }

  const {
    mode,
    recommendation,
    search_flights,
    ground_transport,
    ground_transport_notice,
    alternative_mode,
  } = transportMode;

  // State 1: Ground Preferred (Green Banner)
  const isGroundPreferred =
    mode === "ground_preferred" ||
    (ground_transport?.preferred && !search_flights);

  // State 2: Flight Required (Blue Banner with Warning)
  const isFlightRequired =
    mode === "flight_required" ||
    (search_flights && ground_transport_notice && !ground_transport?.practical);

  // State 3: Both Options Available (Yellow Info)
  const bothOptionsAvailable =
    search_flights &&
    ground_transport?.available &&
    ground_transport?.practical &&
    !ground_transport?.preferred;

  // Helper function to format cost
  const formatCost = (cost) => {
    if (!cost) return null;
    const min = cost.min || 0;
    const max = cost.max || 0;
    if (min === max) return `₱${min}`;
    return `₱${min}-${max}`;
  };

  return (
    <div className="ground-transport-banner mb-4">
      {/* State 1: Ground Transport Preferred (Green) */}
      {isGroundPreferred && ground_transport && (
        <div className="brand-card border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/30 dark:to-emerald-950/30 p-5 shadow-lg animate-fade-in">
          {/* MINIMALIST: Ferry Route */}
          {ground_transport.modes?.includes("ferry") ? (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  ⛴️ Ferry Recommended
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-500">
                  {recommendation}
                </p>
              </div>

              {/* Key Info Grid - Compact */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Travel Time
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {ground_transport.travel_time}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cost
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCost(ground_transport.cost)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Frequency
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {ground_transport.frequency?.includes("daily") ||
                    ground_transport.frequency?.includes("multiple")
                      ? "Frequent"
                      : "Regular"}
                  </p>
                </div>
              </div>

              {/* Operators */}
              {ground_transport.operators &&
                ground_transport.operators.length > 0 && (
                  <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Ferry Operators
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {Array.isArray(ground_transport.operators)
                        ? ground_transport.operators.join(", ")
                        : ground_transport.operators}
                    </p>
                  </div>
                )}

              {/* Notes/Tips */}
              {ground_transport.notes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    💡 <strong>Tip:</strong> {ground_transport.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Regular Bus/Van Route */
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <Bus className="h-6 w-6 text-white" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                    Getting There: Ground Transport
                  </h3>
                  <Badge className="bg-green-600 text-white border-0">
                    Recommended
                  </Badge>
                </div>

                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  {recommendation}
                </p>

                {/* Route Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 p-3 rounded-lg">
                    <Clock className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Travel Time
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {ground_transport.travel_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 p-3 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Cost Range
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCost(ground_transport.cost)}
                      </p>
                    </div>
                  </div>

                  {ground_transport.distance && (
                    <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 p-3 rounded-lg">
                      <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Distance
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {ground_transport.distance}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operators */}
                {ground_transport.operators && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Transport Operators:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // ✅ FIX: Handle both string and array formats
                        const operators = Array.isArray(
                          ground_transport.operators
                        )
                          ? ground_transport.operators
                          : typeof ground_transport.operators === "string"
                          ? ground_transport.operators
                              .split(",")
                              .map((op) => op.trim())
                          : [ground_transport.operators];

                        return operators.map((operator, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700"
                          >
                            {operator}
                          </Badge>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Schedule/Frequency */}
                {ground_transport.frequency && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>
                      <strong>Schedule:</strong> {ground_transport.frequency}
                    </span>
                  </div>
                )}

                {/* Scenic Badge */}
                {ground_transport.scenic && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
                    <Mountain className="h-3 w-3 mr-1" />
                    Scenic Route
                  </Badge>
                )}

                {/* Additional Notes */}
                {ground_transport.notes && (
                  <div className="mt-3 p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      💡 <strong>Tip:</strong> {ground_transport.notes}
                    </p>
                  </div>
                )}

                {/* Flight Skipped Notice */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    ✈️ <strong>Note:</strong> Flight search was skipped for this
                    route as ground transport is more practical and economical.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* State 2: Flight Required (Blue Banner with Ground Warning) */}
      {isFlightRequired && ground_transport_notice && (
        <div className="brand-card border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/80 to-sky-50/80 dark:from-blue-950/30 dark:to-sky-950/30 p-5 shadow-lg animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Bus className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  Getting There: Ground Transport Available (Not Recommended)
                </h3>
              </div>

              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                {ground_transport_notice.warning || recommendation}
              </p>

              {/* Ground Transport Details (Warning Style) */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Travel Time
                    </p>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      {ground_transport_notice.travel_time}
                    </p>
                  </div>

                  {ground_transport_notice.cost && (
                    <div>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Cost Range
                      </p>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        {formatCost(ground_transport_notice.cost)}
                      </p>
                    </div>
                  )}

                  {ground_transport_notice.distance && (
                    <div>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Distance
                      </p>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        {ground_transport_notice.distance}
                      </p>
                    </div>
                  )}
                </div>

                {ground_transport_notice.notes && (
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    {ground_transport_notice.notes}
                  </p>
                )}
              </div>

              {/* Flight Recommendation */}
              <div className="p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  ✈️ <strong>Recommended:</strong> Flying is faster, more
                  comfortable, and more practical for this route.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State 3: Both Options Available (Yellow Info) */}
      {bothOptionsAvailable && ground_transport && (
        <div className="brand-card border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50/80 to-amber-50/80 dark:from-yellow-950/30 dark:to-amber-950/30 p-5 shadow-lg animate-fade-in">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Info className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                Getting There: Multiple Options Available
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {recommendation}
              </p>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Ground Transport Option */}
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <Bus className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-bold text-gray-900 dark:text-white">
                  Ground Transport
                </h4>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Travel Time:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {ground_transport.travel_time}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Cost:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCost(ground_transport.cost)}
                  </span>
                </div>
              </div>

              {ground_transport.operators &&
                ground_transport.operators.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Operators:
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {ground_transport.operators.slice(0, 2).join(", ")}
                      {ground_transport.operators.length > 2 && "..."}
                    </p>
                  </div>
                )}

              {ground_transport.scenic && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                  <Mountain className="h-3 w-3 mr-1" />
                  Scenic
                </Badge>
              )}

              {ground_transport.warning && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-900 dark:text-yellow-100">
                    ⚠️ {ground_transport.warning}
                  </p>
                </div>
              )}
            </div>

            {/* Flight Option */}
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border-2 border-sky-200 dark:border-sky-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 text-sky-600 dark:text-sky-400">✈️</div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  Flight
                </h4>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Travel Time:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ~1 hour
                  </span>
                </div>

                {costBreakdown?.flights > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Estimated Cost:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₱{costBreakdown.flights}
                    </span>
                  </div>
                )}
              </div>

              <Badge className="bg-gradient-to-r from-sky-500 to-blue-500 text-white border-0">
                ⚡ Fastest
              </Badge>

              <div className="mt-3 p-2 bg-sky-50 dark:bg-sky-950/30 rounded border border-sky-200 dark:border-sky-800">
                <p className="text-xs text-sky-900 dark:text-sky-100">
                  ℹ️ Check flights tab for available options
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Note */}
          {alternative_mode && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💡 <strong>Tip:</strong> Consider your budget and schedule when
                choosing. Ground transport offers scenic views and is more
                economical, while flights save time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GroundTransportBanner;
