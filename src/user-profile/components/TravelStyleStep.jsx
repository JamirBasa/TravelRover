import {
  FaMountain,
  FaUmbrellaBeach,
  FaCity,
  FaLeaf,
  FaCameraRetro,
  FaRunning,
  FaUtensils,
  FaHeart,
} from "react-icons/fa";

const TravelStyleStep = ({
  profileData,
  handleInputChange,
  handleMultiSelect,
}) => {
  // Trip type options - clean design with React icons
  const tripTypes = [
    {
      id: "adventure",
      label: "Adventure & Outdoor activities",
      icon: FaMountain,
    },
    {
      id: "beach",
      label: "Beach & Island getaways",
      icon: FaUmbrellaBeach,
    },
    {
      id: "cultural",
      label: "Cultural & Historical sites",
      icon: FaCity,
    },
    {
      id: "nature",
      label: "Nature & Wildlife experiences",
      icon: FaLeaf,
    },
    {
      id: "photography",
      label: "Photography & Scenic tours",
      icon: FaCameraRetro,
    },
    {
      id: "wellness",
      label: "Wellness & Spa retreats",
      icon: FaRunning,
    },
    {
      id: "food",
      label: "Food & Culinary experiences",
      icon: FaUtensils,
    },
    {
      id: "romantic",
      label: "Romantic getaways",
      icon: FaHeart,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question - matching the image style */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          What kind of trips do you prefer?
        </h2>
        <p className="text-gray-600">
          Tell us about your travel style and preferences
        </p>
      </div>

      {/* Trip Types - Clean selection with React icons */}
      <div className="space-y-3 mb-8">
        {tripTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <div
              key={type.id}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                profileData.preferredTripTypes.includes(type.id)
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => handleMultiSelect("preferredTripTypes", type.id)}
            >
              <IconComponent className="text-2xl mr-4" />
              <span className="font-medium">{type.label}</span>
              {profileData.preferredTripTypes.includes(type.id) && (
                <span className="ml-auto text-white">✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Budget Selection - Simplified */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          What's your typical budget per trip?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "budget", label: "Budget", range: "₱2,000 - ₱8,000" },
            { value: "moderate", label: "Moderate", range: "₱8,000 - ₱20,000" },
            { value: "luxury", label: "Luxury", range: "₱20,000+" },
            { value: "flexible", label: "Flexible", range: "It depends" },
          ].map((budget) => (
            <div
              key={budget.value}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                profileData.budgetRange === budget.value
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => handleInputChange("budgetRange", budget.value)}
            >
              <div className="font-medium">{budget.label}</div>
              <div className="text-sm opacity-70">{budget.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Travel Style - Simplified */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          How do you prefer to travel?
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { value: "solo", label: "Solo - I love exploring on my own" },
            { value: "couple", label: "With my partner/spouse" },
            { value: "family", label: "Family trips with kids" },
            { value: "group", label: "Group trips with friends" },
            { value: "business", label: "Business/work travel" },
          ].map((style) => (
            <div
              key={style.value}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                profileData.travelStyle === style.value
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => handleInputChange("travelStyle", style.value)}
            >
              <span className="font-medium">{style.label}</span>
              {profileData.travelStyle === style.value && (
                <span className="ml-auto float-right text-white">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TravelStyleStep;
