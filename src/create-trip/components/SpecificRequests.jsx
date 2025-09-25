// src/create-trip/components/SpecificRequests.jsx
import { FaListAlt, FaLightbulb } from "react-icons/fa";

function SpecificRequests({ value, onChange }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Any specific requests?
        </h2>
        <p className="text-gray-600 text-sm">
          Tell us about activities, places, or experiences you'd love to include
        </p>
      </div>

      {/* Request Input */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaLightbulb className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">
                Personalization Tips
              </h3>
              <p className="text-blue-700 text-sm">
                Share specific activities, attractions, food experiences, or
                cultural sites you want to include. The more details you
                provide, the more personalized your itinerary will be!
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-base font-medium text-gray-800 mb-2">
            <FaListAlt className="inline mr-2" />
            Special Requests (Optional)
          </label>
          <textarea
            className="w-full py-3 px-3 border-2 rounded-lg resize-none focus:border-black transition-colors"
            rows="5"
            placeholder="Examples:&#10;• Visit specific landmarks or attractions&#10;• Try local specialties or famous restaurants&#10;• Cultural experiences or workshops&#10;• Adventure activities like diving or hiking&#10;• Photography spots for Instagram&#10;• Shopping areas or local markets&#10;• Day-specific activities (e.g., Day 2: Island hopping)"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        {/* Examples */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">
            Popular Request Examples:
          </h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• "Include Chocolate Hills and tarsier sanctuary"</li>
            <li>• "Try authentic lechon and halo-halo"</li>
            <li>• "Visit historical sites like Intramuros"</li>
            <li>• "Include snorkeling or diving activities"</li>
            <li>• "Photography tour of scenic viewpoints"</li>
            <li>• "Local market shopping experience"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SpecificRequests;
