import React from "react";
import { Button } from "@/components/ui/button";

function TravelTipsSection() {
  return (
    <div className="mt-8 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Planning Tips */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 sm:p-6 border border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600">🎯</span>
            </div>
            <div>
              <h4 className="font-bold text-emerald-800 mb-2">
                Smart Planning Tips
              </h4>
              <ul className="text-emerald-700 text-sm space-y-1">
                <li>• Book popular attractions in advance</li>
                <li>• Allow extra time for transportation</li>
                <li>• Check weather forecasts daily</li>
                <li>• Keep backup indoor activities ready</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Budget Tips */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600">💡</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-800 mb-2">
                Money-Saving Tips
              </h4>
              <ul className="text-blue-700 text-sm space-y-1">
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
