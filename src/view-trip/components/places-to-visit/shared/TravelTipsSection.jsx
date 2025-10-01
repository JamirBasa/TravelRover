import React from "react";
import { Button } from "@/components/ui/button";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  PATTERNS,
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
              className={`${PATTERNS.iconContainer.small} bg-emerald-100 flex-shrink-0`}
            >
              <span className="text-emerald-600">🎯</span>
            </div>
            <div>
              <h4 className={`${TYPOGRAPHY.heading.h4} text-emerald-800 mb-2`}>
                Smart Planning Tips
              </h4>
              <ul
                className={`${COLORS.success.text} ${TYPOGRAPHY.body.medium} space-y-1`}
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
              className={`${PATTERNS.iconContainer.small} bg-blue-100 flex-shrink-0`}
            >
              <span className="text-blue-600">💡</span>
            </div>
            <div>
              <h4 className={`${TYPOGRAPHY.heading.h4} text-blue-800 mb-2`}>
                Money-Saving Tips
              </h4>
              <ul
                className={`${COLORS.info.text} ${TYPOGRAPHY.body.medium} space-y-1`}
              >
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
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 sm:p-6 border border-purple-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-purple-600">🚀</span>
            </div>
            <div>
              <h4 className="font-bold text-purple-800">Ready to explore?</h4>
              <p className="text-purple-700 text-sm">
                Make the most of your adventure with these quick actions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <span>📥</span> Save Offline
            </Button>
            <Button
              variant="outline"
              className="border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 gap-2"
            >
              <span>📤</span> Share Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelTipsSection;
