import { Input } from "../../components/ui/input";
import {
  FaShieldAlt,
  FaUser,
  FaPhone,
  FaStar,
  FaWheelchair,
  FaMapMarkerAlt,
} from "react-icons/fa";

const BudgetSafetyStep = ({ profileData, handleInputChange }) => {
  const travelExperienceOptions = [
    { value: "beginner", label: "Beginner", desc: "First few trips" },
    {
      value: "intermediate",
      label: "Intermediate",
      desc: "Some travel experience",
    },
    { value: "expert", label: "Expert", desc: "Frequent traveler" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-4">
        {/* Emergency Contact - Ultra Compact */}
        <div className="brand-card p-4 border-sky-200">
          <h3 className="text-sm font-bold brand-gradient-text mb-3 flex items-center gap-1.5">
            <FaShieldAlt className="text-sky-600 text-sm" />
            Emergency Contact
          </h3>
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1 flex items-center gap-1">
                <FaUser className="text-xs text-sky-600" />
                Contact Name *
              </label>
              <Input
                value={profileData.emergencyContact.name}
                onChange={(e) =>
                  handleInputChange("emergencyContact", e.target.value, "name")
                }
                placeholder="Enter emergency contact name"
                className="text-sm py-1.5 px-3 rounded-lg border-2 focus:border-sky-500 leading-tight h-auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-1">
                  Relationship
                </label>
                <Input
                  value={profileData.emergencyContact.relationship}
                  onChange={(e) =>
                    handleInputChange(
                      "emergencyContact",
                      e.target.value,
                      "relationship"
                    )
                  }
                  placeholder="e.g., Parent"
                  className="text-sm py-1.5 px-3 rounded-lg border-2 focus:border-sky-500 leading-tight h-auto"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-1 flex items-center gap-1">
                  <FaPhone className="text-xs text-sky-600" />
                  Phone *
                </label>
                <Input
                  value={profileData.emergencyContact.phone}
                  onChange={(e) =>
                    handleInputChange(
                      "emergencyContact",
                      e.target.value,
                      "phone"
                    )
                  }
                  placeholder="+63 XXX XXX"
                  className="text-sm py-1.5 px-3 rounded-lg border-2 focus:border-sky-500 leading-tight h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Travel Experience - Ultra Compact */}
        <div className="brand-card p-4 border-sky-200">
          <h3 className="text-sm font-bold brand-gradient-text mb-2.5 flex items-center gap-1.5">
            <FaStar className="text-sky-600 text-sm" />
            Travel Experience
          </h3>
          <div className="space-y-1.5">
            {travelExperienceOptions.map((exp) => {
              const isSelected = profileData.travelExperience === exp.value;
              return (
                <div
                  key={exp.value}
                  className={`flex items-center p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white shadow-md"
                      : "border-gray-200 bg-white hover:border-sky-400 hover:shadow-sm"
                  }`}
                  onClick={() =>
                    handleInputChange("travelExperience", exp.value)
                  }
                >
                  <FaStar
                    className={`text-base mr-2.5 ${
                      isSelected ? "text-white" : "text-sky-600"
                    }`}
                  />
                  <div className="flex-1">
                    <span
                      className={`font-medium text-xs ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {exp.label}
                    </span>
                    <p
                      className={`text-xs mt-0.5 ${
                        isSelected ? "text-white/90" : "text-gray-500"
                      }`}
                    >
                      {exp.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="ml-auto text-white bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Info - Ultra Compact */}
        <div className="brand-card p-4 border-sky-200 space-y-2.5">
          {/* Mobility Needs */}
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-1 flex items-center gap-1">
              <FaWheelchair className="text-xs text-sky-600" />
              Mobility needs?
            </label>
            <Input
              value={profileData.mobilityNeeds}
              onChange={(e) =>
                handleInputChange("mobilityNeeds", e.target.value)
              }
              placeholder="e.g., Wheelchair accessible (optional)"
              className="text-sm py-1.5 px-3 rounded-lg border-2 focus:border-sky-500 leading-tight h-auto"
            />
          </div>

          {/* Bucket List */}
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-1 flex items-center gap-1">
              <FaMapMarkerAlt className="text-xs text-sky-600" />
              Dream destinations?
            </label>
            <Input
              value={profileData.bucketListDestinations}
              onChange={(e) =>
                handleInputChange("bucketListDestinations", e.target.value)
              }
              placeholder="Places you want to visit (optional)"
              className="text-sm py-1.5 px-3 rounded-lg border-2 focus:border-sky-500 leading-tight h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSafetyStep;
