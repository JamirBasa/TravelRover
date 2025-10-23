import React from "react";
import { Button } from "@/components/ui/button";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
  ANIMATIONS,
} from "../constants/designSystem";

function TravelTipsSection() {
  return (
    <div className="mt-6 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        {/* Planning Tips */}
        <div
          className={`${COLORS.success.lightGradient} dark:bg-emerald-950/20 rounded-lg p-4 ${COLORS.success.border} dark:border-emerald-800 border`}
        >
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                🎯
              </span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                Smart Planning Tips
              </h4>
              <ul className="text-emerald-700 dark:text-emerald-400 text-sm font-medium space-y-1">
                <li>• Book popular attractions in advance</li>
                <li>• Allow extra time for transportation</li>
                <li>• Check weather forecasts daily</li>
                <li>• Keep backup indoor activities ready</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Budget Tips */}
        <div
          className={`${COLORS.info.lightGradient} dark:bg-sky-950/20 rounded-lg p-4 ${COLORS.info.border} dark:border-sky-800 border`}
        >
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-lg">
                💡
              </span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-blue-800 dark:text-blue-300 mb-2">
                Money-Saving Tips
              </h4>
              <ul className="text-blue-700 dark:text-blue-400 text-sm font-medium space-y-1">
                <li>• Look for combo tickets and discounts</li>
                <li>• Visit free attractions during peak hours</li>
                <li>• Use public transportation when possible</li>
                <li>• Try local street food for authentic meals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className={`${COLORS.secondary.lightGradient} dark:bg-emerald-950/20 rounded-lg p-4 ${COLORS.secondary.border} dark:border-emerald-800 border`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                🚀
              </span>
            </div>
            <div>
              <h4
                className={`text-base font-semibold ${COLORS.secondary.text} dark:text-emerald-300`}
              >
                Ready to explore?
              </h4>
              <p
                className={`${COLORS.secondary.text} dark:text-emerald-400 text-sm`}
              >
                Make the most of your adventure with these quick actions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              className={`${COLORS.secondary.gradient} hover:opacity-90 text-white gap-2 px-4 py-2 text-sm font-medium ${ANIMATIONS.transition.medium}`}
            >
              <span className="text-sm">📥</span> Save Offline
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`${COLORS.secondary.border} dark:border-emerald-700 ${COLORS.secondary.hover} dark:hover:bg-emerald-950/30 ${COLORS.secondary.text} dark:text-emerald-400 hover:bg-emerald-50 gap-2 px-4 py-2 text-sm font-medium ${ANIMATIONS.transition.medium}`}
            >
              <span className="text-sm">📤</span> Share Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelTipsSection;
