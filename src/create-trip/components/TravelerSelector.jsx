// src/create-trip/components/TravelerSelector.jsx
import { SelectTravelList } from "../../constants/options";
import { FaUsers } from "react-icons/fa";

function TravelerSelector({ selectedTravelers, onTravelersChange }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold brand-gradient-text mb-3">
          Who's joining your adventure?
        </h2>
        <p className="text-gray-700 text-base font-medium">
          Let us know your group size to tailor recommendations 👥
        </p>
      </div>

      {/* Traveler Options */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {SelectTravelList.map((item, index) => (
            <div
              key={index}
              onClick={() => onTravelersChange(item.people)}
              className={`p-5 cursor-pointer border-2 rounded-xl hover:shadow-xl transition-all duration-300 ${
                selectedTravelers === item.people
                  ? "shadow-xl border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50"
                  : "border-gray-200 hover:border-sky-300 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                  <div className="text-xs text-sky-600 font-semibold mt-1">
                    {item.people}
                  </div>
                </div>
                {selectedTravelers === item.people && (
                  <div className="brand-gradient w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="brand-card p-5 shadow-lg border-sky-200">
          <div className="flex items-start gap-4">
            <div className="brand-gradient p-2.5 rounded-full">
              <FaUsers className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold brand-gradient-text text-base mb-2">
                Why we ask about group size
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
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
