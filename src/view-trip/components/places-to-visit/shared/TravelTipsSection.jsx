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
          className={`${COLORS.success.lightGradient} rounded-lg p-4 ${COLORS.success.border} border`}
        >
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 text-lg">🎯</span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-emerald-800 mb-2">
                Smart Planning Tips
              </h4>
              <ul className="text-emerald-700 text-sm font-medium space-y-1">
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
          className={`${COLORS.info.lightGradient} rounded-lg p-4 ${COLORS.info.border} border`}
        >
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">💡</span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-blue-800 mb-2">
                Money-Saving Tips
              </h4>
              <ul className="text-blue-700 text-sm font-medium space-y-1">
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
        className={`${COLORS.secondary.lightGradient} rounded-lg p-4 ${COLORS.secondary.border} border`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 text-lg">🚀</span>
            </div>
            <div>
              <h4
                className={`text-base font-semibold ${COLORS.secondary.text}`}
              >
                Ready to explore?
              </h4>
              <p className={`${COLORS.secondary.text} text-sm`}>
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
              className={`${COLORS.secondary.border} ${COLORS.secondary.hover} ${COLORS.secondary.text} hover:bg-emerald-50 gap-2 px-4 py-2 text-sm font-medium ${ANIMATIONS.transition.medium}`}
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
