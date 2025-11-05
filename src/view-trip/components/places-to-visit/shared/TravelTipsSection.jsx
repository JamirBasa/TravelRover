import React from "react";
import { COLORS } from "../constants/designSystem";

function TravelTipsSection() {

  return (
    <div className="mt-6 space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
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

        {/* Local Insights */}
        <div
          className={`${COLORS.warning.lightGradient} dark:bg-amber-950/20 rounded-lg p-4 ${COLORS.warning.border} dark:border-amber-800 border`}
        >
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/50 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 dark:text-amber-400 text-lg">
                📍
              </span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-amber-800 dark:text-amber-300 mb-2">
                Local Insights
              </h4>
              <ul className="text-amber-700 dark:text-amber-400 text-sm font-medium space-y-1">
                <li>• Research local customs and etiquette</li>
                <li>• Download offline maps before departure</li>
                <li>• Learn basic local phrases</li>
                <li>• Have emergency contacts saved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Helpful Reminder */}
      <div className="p-3.5 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 rounded-lg">
        <p className="text-sm text-sky-700 dark:text-sky-300 text-center">
          💡 <strong>Quick tip:</strong> Use the action buttons at the top of
          the page to download, share, or edit your itinerary
        </p>
      </div>
    </div>
  );
}

export default TravelTipsSection;
