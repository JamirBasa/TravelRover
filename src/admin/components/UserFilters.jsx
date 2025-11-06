import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X, Users, Shield, Calendar } from "lucide-react"; // ✅ Removed Database icon

/**
 * UserFilters Component - TravelRover Admin
 * Provides comprehensive filtering for users list
 */
function UserFilters({ filters, setFilters, users }) {
  const handleFilterChange = (category, value) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category] === value ? "" : value,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: "",
      userType: "",
      tripActivity: "",
      dateRange: "",
    });
  };

  const getFilterCount = (category, value) => {
    return users.filter((user) => {
      switch (category) {
        case "status":
          return value === "active" ? user.is_active : !user.is_active;

        case "userType":
          if (value === "staff") return user.is_staff;
          if (value === "superuser") return user.is_superuser;
          if (value === "regular") return !user.is_staff && !user.is_superuser;
          return false;

        case "tripActivity":
          const hasTrips = (user.total_trips || 0) > 0;
          return value === "has_trips" ? hasTrips : !hasTrips;

        case "dateRange":
          if (!user.date_joined) return false;

          try {
            const joinDate = new Date(user.date_joined);
            const now = new Date();

            // Check if date is valid
            if (isNaN(joinDate.getTime())) return false;

            if (value === "today") {
              return joinDate.toDateString() === now.toDateString();
            }
            if (value === "week") {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return joinDate >= weekAgo;
            }
            if (value === "month") {
              const monthAgo = new Date(
                now.getTime() - 30 * 24 * 60 * 60 * 1000
              );
              return joinDate >= monthAgo;
            }
          } catch (error) {
            console.error("Date parsing error:", error);
            return false;
          }
          return false;

        default:
          return false;
      }
    }).length;
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`flex items-center gap-2 cursor-pointer ${
              hasActiveFilters
                ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                : "border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filter Users</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 p-0 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          align="end"
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-slate-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Filter Users
              </h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 text-xs cursor-pointer"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-5 max-h-[500px] overflow-y-auto">
              {/* Status Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Status
                  </span>
                </div>
                <div className="space-y-2">
                  {["active", "inactive"].map((status) => {
                    const count = getFilterCount("status", status);
                    const isActive = filters.status === status;
                    return (
                      <div
                        key={status}
                        onClick={() => handleFilterChange("status", status)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isActive
                            ? "bg-blue-500 dark:bg-sky-500 text-white border-blue-500 dark:border-sky-500"
                            : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <span className="font-medium capitalize">{status}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isActive
                              ? "bg-blue-400 dark:bg-sky-400 text-white"
                              : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Type Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    User Type
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { value: "regular", label: "Regular User" },
                    { value: "staff", label: "Staff" },
                    { value: "superuser", label: "Superuser" },
                  ].map((type) => {
                    const count = getFilterCount("userType", type.value);
                    const isActive = filters.userType === type.value;
                    return (
                      <div
                        key={type.value}
                        onClick={() =>
                          handleFilterChange("userType", type.value)
                        }
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isActive
                            ? "bg-blue-500 dark:bg-sky-500 text-white border-blue-500 dark:border-sky-500"
                            : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <span className="font-medium">{type.label}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isActive
                              ? "bg-blue-400 dark:bg-sky-400 text-white"
                              : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trip Activity Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trip Activity
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { value: "has_trips", label: "Has Created Trips" },
                    { value: "no_trips", label: "No Trips Yet" },
                  ].map((activity) => {
                    const count = getFilterCount(
                      "tripActivity",
                      activity.value
                    );
                    const isActive = filters.tripActivity === activity.value;
                    return (
                      <div
                        key={activity.value}
                        onClick={() =>
                          handleFilterChange("tripActivity", activity.value)
                        }
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isActive
                            ? "bg-blue-500 dark:bg-sky-500 text-white border-blue-500 dark:border-sky-500"
                            : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <span className="font-medium">{activity.label}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isActive
                              ? "bg-blue-400 dark:bg-sky-400 text-white"
                              : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Joined Date
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { value: "today", label: "Today" },
                    { value: "week", label: "Last 7 Days" },
                    { value: "month", label: "Last 30 Days" },
                  ].map((range) => {
                    const count = getFilterCount("dateRange", range.value);
                    const isActive = filters.dateRange === range.value;
                    return (
                      <div
                        key={range.value}
                        onClick={() =>
                          handleFilterChange("dateRange", range.value)
                        }
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isActive
                            ? "bg-blue-500 dark:bg-sky-500 text-white border-blue-500 dark:border-sky-500"
                            : "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <span className="font-medium">{range.label}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isActive
                              ? "bg-blue-400 dark:bg-sky-400 text-white"
                              : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Active filters:
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(filters).map(
                    ([key, value]) =>
                      value && (
                        <span
                          key={key}
                          className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 px-2 py-1 rounded text-xs"
                        >
                          {key}: {value.replace("_", " ")}
                        </span>
                      )
                  )}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear All Button (outside popover) */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default UserFilters;
