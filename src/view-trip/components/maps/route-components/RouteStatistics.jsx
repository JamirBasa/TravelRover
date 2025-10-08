import React from "react";
import {
  Route,
  MapPin,
  Clock,
  Navigation,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * RouteStatistics Component
 * Displays trip overview statistics including locations, time, and distance
 */
export function RouteStatistics({
  filteredLocations,
  geocodedLocations,
  selectedDay,
  totalStats,
  isLoadingRoutes,
}) {
  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Route className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Optimized Route</h3>
            <p className="text-sm text-gray-600">
              Your travel path with markers and directions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">
                {selectedDay === "all"
                  ? "Total Locations"
                  : `Day ${selectedDay} Locations`}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {filteredLocations.length}
              {selectedDay !== "all" && (
                <span className="text-xs text-gray-500 ml-1">
                  / {geocodedLocations.length}
                </span>
              )}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-600">Total Time</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {totalStats.timeText}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-gray-600">Distance</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {totalStats.distanceText}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-gray-600">Avg Speed</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {totalStats.avgSpeed}
            </p>
          </div>
        </div>

        {isLoadingRoutes && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
            <Zap className="h-4 w-4 animate-pulse" />
            <span>Calculating optimal routes...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
