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
    <div className={`${SPACING.margin.large} space-y-4`}>
      <div className={`grid md:grid-cols-2 ${SPACING.gap.medium}`}>
        {/* Planning Tips */}
        <div
          className={`${COLORS.success.lightGradient} rounded-lg ${SPACING.padding.medium} ${COLORS.success.border} border`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`${PATTERNS.iconContainer.small} bg-emerald-100 flex-shrink-0 w-14 h-14 flex items-center justify-center`}
            >
              <span className="text-emerald-600 text-2xl">🎯</span>
            </div>
            <div>
              <h4 className={`text-lg font-bold text-emerald-800 mb-3`}>
                Smart Planning Tips
              </h4>
              <ul
                className={`text-emerald-700 text-base font-medium space-y-2`}
              >
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
          className={`${COLORS.info.lightGradient} rounded-lg ${SPACING.padding.medium} ${COLORS.info.border} border`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`${PATTERNS.iconContainer.small} bg-blue-100 flex-shrink-0 w-14 h-14 flex items-center justify-center`}
            >
              <span className="text-blue-600 text-2xl">💡</span>
            </div>
            <div>
              <h4 className={`text-lg font-bold text-blue-800 mb-3`}>
                Money-Saving Tips
              </h4>
              <ul className={`text-blue-700 text-base font-medium space-y-2`}>
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
        className={`${COLORS.secondary.lightGradient} rounded-lg ${SPACING.padding.medium} ${COLORS.secondary.border} border`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`${PATTERNS.iconContainer.large} bg-emerald-100`}>
              <span className="text-emerald-600 text-3xl">🚀</span>
            </div>
            <div>
              <h4 className={`text-xl font-bold ${COLORS.secondary.text}`}>
                Ready to explore?
              </h4>
              <p className={`${COLORS.secondary.text} text-base font-medium`}>
                Make the most of your adventure with these quick actions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              className={`${COLORS.secondary.gradient} hover:opacity-90 text-white gap-3 px-6 py-3 text-base font-semibold ${ANIMATIONS.transition.medium}`}
            >
              <span className="text-xl">📥</span> Save Offline
            </Button>
            <Button
              variant="outline"
              className={`${COLORS.secondary.border} ${COLORS.secondary.hover} ${COLORS.secondary.text} hover:bg-emerald-50 gap-3 px-6 py-3 text-base font-semibold ${ANIMATIONS.transition.medium}`}
            >
              <span className="text-xl">📤</span> Share Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelTipsSection;
