import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Zap } from "lucide-react";
import {
  FaFeather,
  FaWalking,
  FaRunning,
  FaBolt,
  FaCheck,
  FaInfoCircle,
} from "react-icons/fa";

const ActivityPreferenceSelector = ({
  activityPreference,
  onActivityPreferenceChange,
  formData,
  userProfile,
}) => {
  const activityOptions = [
    {
      value: 1,
      label: "Light Pace",
      description: "1 activity per day",
      icon: FaFeather,
      details: "Perfect for relaxation, elderly travelers, or short trips",
      recommended: "Senior citizens, families with young children",
      dailySchedule: "Relaxed mornings, plenty of rest time",
      color: "from-green-500 to-emerald-500",
      bgGradient:
        "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    },
    {
      value: 2,
      label: "Moderate Pace",
      description: "2 activities per day",
      icon: FaWalking,
      details: "Balanced schedule with time for meals and rest",
      recommended: "Most travelers, first-time visitors",
      dailySchedule: "Morning activity, afternoon activity with breaks",
      color: "from-sky-500 to-blue-500",
      bgGradient:
        "from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30",
    },
    {
      value: 3,
      label: "Active Pace",
      description: "3 activities per day",
      icon: FaRunning,
      details: "Full day of exploration with strategic breaks",
      recommended: "Young adults, experienced travelers",
      dailySchedule: "Morning, afternoon, evening activities",
      color: "from-orange-500 to-amber-500",
      bgGradient:
        "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
    },
    {
      value: 4,
      label: "Intensive Pace",
      description: "4 activities per day",
      icon: FaBolt,
      details: "Maximum exploration, minimal downtime",
      recommended: "Short trips, adventure seekers",
      dailySchedule: "Back-to-back activities with quick transitions",
      color: "from-red-500 to-rose-500",
      bgGradient:
        "from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Daily Activity Pace
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl mx-auto leading-relaxed">
          Choose how many activities you'd like per day. We'll optimize your
          itinerary based on travel times, rest periods, and your preferences.
        </p>
      </div>

      {/* Activity Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activityOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = activityPreference === option.value;

          return (
            <Card
              key={option.value}
              className={`brand-card cursor-pointer transition-all duration-200 border-2 hover:shadow-lg ${
                isSelected
                  ? `border-sky-500 dark:border-sky-600 bg-gradient-to-r ${option.bgGradient}`
                  : "border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700"
              }`}
              onClick={() => onActivityPreferenceChange(option.value)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`bg-gradient-to-br ${
                        option.color
                      } p-3 rounded-lg transition-transform ${
                        isSelected ? "scale-110" : ""
                      }`}
                    >
                      <IconComponent className="text-white text-xl" />
                    </div>
                    <div>
                      <CardTitle
                        className={`text-lg ${
                          isSelected
                            ? "brand-gradient-text"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {option.label}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-sky-500 dark:bg-sky-600 flex items-center justify-center flex-shrink-0">
                      <FaCheck className="text-white text-xs" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {option.details}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    <strong>Recommended for:</strong> {option.recommended}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    ⏰ {option.dailySchedule}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection Confirmation */}
      {activityPreference && (
        <div className="brand-card p-5 shadow-lg border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <Clock className="text-white text-lg" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold brand-gradient-text text-base mb-2">
                Your Selection:{" "}
                {
                  activityOptions.find(
                    (opt) => opt.value === activityPreference
                  )?.label
                }
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                We'll create a{" "}
                <strong>{activityPreference} activity per day</strong> itinerary
                with realistic travel times, meal breaks, and rest periods. Your
                schedule will be optimized for maximum enjoyment while
                respecting your chosen pace.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>⏰</span>
                <span>
                  {
                    activityOptions.find(
                      (opt) => opt.value === activityPreference
                    )?.dailySchedule
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Travel Time Awareness */}
      <div className="brand-card p-5 shadow-lg border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <FaInfoCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-base mb-2">
              ✨ Smart Scheduling Included
            </h4>
            <p className="text-amber-800 dark:text-amber-400 text-sm leading-relaxed">
              Regardless of your activity pace, we'll always include realistic
              travel times between locations, meal breaks, rest periods, and
              proper arrival/departure buffers. Your itinerary will be
              achievable and enjoyable!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityPreferenceSelector;
