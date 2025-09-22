// src/create-trip/components/TravelerSelector.jsx
import { SelectTravelList } from "../../constants/options";

function TravelerSelector({ selectedTravelers, onTravelersChange }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl mb-3 font-medium">
        Who will be joining you on your adventure?
      </h2>
      <div className="grid grid-cols-3 gap-5 mt-5">
        {SelectTravelList.map((item, index) => (
          <div
            key={index}
            onClick={() => onTravelersChange(item.people)}
            className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg transition-all
            ${
              selectedTravelers === item.people && "shadow-lg border-black"
            }
            `}
          >
            <h2 className="text-4xl">{item.icon}</h2>
            <h2 className="font-bold text-lg">{item.title}</h2>
            <h2 className="text-sm text-gray-500">{item.desc}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TravelerSelector;