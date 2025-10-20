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
    <Card className="border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center">
            <Route className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Optimized Route
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your travel path with markers and directions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-sky-100 dark:border-sky-800">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {selectedDay === "all"
                  ? "Total Locations"
                  : `Day ${selectedDay} Locations`}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {filteredLocations.length}
              {selectedDay !== "all" && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  / {geocodedLocations.length}
                </span>
              )}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-sky-100 dark:border-sky-800">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-green-600 dark:text-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Total Time
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {totalStats.timeText}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-sky-100 dark:border-sky-800">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="h-4 w-4 text-sky-600 dark:text-sky-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Distance
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {totalStats.distanceText}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-sky-100 dark:border-sky-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Avg Speed
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {totalStats.avgSpeed}
            </p>
          </div>
        </div>

        {isLoadingRoutes && (
          <div className="mt-3 flex items-center gap-2 text-sm text-sky-700 dark:text-sky-400">
            <Zap className="h-4 w-4 animate-pulse" />
            <span>Calculating optimal routes...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
