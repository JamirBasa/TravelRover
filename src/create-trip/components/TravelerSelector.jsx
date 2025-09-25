// src/create-trip/components/TravelerSelector.jsx
import { SelectTravelList } from "../../constants/options";
import { FaUsers } from "react-icons/fa";

function TravelerSelector({ selectedTravelers, onTravelersChange }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Who's joining your adventure?
        </h2>
        <p className="text-gray-600 text-sm">
          Let us know your group size to tailor recommendations
        </p>
      </div>

      {/* Traveler Options */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {SelectTravelList.map((item, index) => (
            <div
              key={index}
              onClick={() => onTravelersChange(item.people)}
              className={`p-4 cursor-pointer border-2 rounded-lg hover:shadow-lg transition-all duration-200 ${
                selectedTravelers === item.people
                  ? "shadow-lg border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    {item.people}
                  </div>
                </div>
                {selectedTravelers === item.people && (
                  <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaUsers className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                Why we ask about group size
              </h4>
              <p className="text-blue-700 text-sm">
                Group size helps us recommend appropriate accommodations,
                activities, transportation options, and dining experiences that
                work best for your travel party.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelerSelector;
