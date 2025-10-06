// src/create-trip/components/SpecificRequests.jsx
import { FaListAlt, FaLightbulb } from "react-icons/fa";

function SpecificRequests({ value, onChange }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Any specific requests?
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Tell us about activities, places, or experiences you'd love to include
          📝
        </p>
      </div>

      {/* Request Input */}
      <div className="space-y-4">
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaLightbulb className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Personalization Tips
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
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
        <div className="brand-card p-5 shadow-lg border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-2.5 rounded-full">
              <FaListAlt className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 text-base mb-2">
                Popular Request Examples
              </h3>
              <ul className="text-amber-800 text-sm space-y-1 leading-relaxed">
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
      </div>
    </div>
  );
}

export default SpecificRequests;
