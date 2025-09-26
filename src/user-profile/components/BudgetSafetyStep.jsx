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
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Let's finalize your profile
        </h2>
        <p className="text-gray-600">
          Final details for emergency contacts and special needs
        </p>
      </div>

      <div className="space-y-8">
        {/* Emergency Contact */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaShieldAlt className="mr-2" />
            Emergency Contact
          </h3>
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <label className="block text-base font-medium text-gray-800 mb-2">
                <FaUser className="inline mr-2" />
                Contact Name *
              </label>
              <Input
                value={profileData.emergencyContact.name}
                onChange={(e) =>
                  handleInputChange("emergencyContact", e.target.value, "name")
                }
                placeholder="Enter emergency contact name"
                className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-base font-medium text-gray-800 mb-2">
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
                  className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-800 mb-2">
                  <FaPhone className="inline mr-2" />
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
                  className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Travel Experience */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaStar className="mr-2" />
            Travel experience level?
          </h3>
          <div className="space-y-3">
            {travelExperienceOptions.map((exp) => {
              const isSelected = profileData.travelExperience === exp.value;
              return (
                <div
                  key={exp.value}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() =>
                    handleInputChange("travelExperience", exp.value)
                  }
                >
                  <FaStar className="text-2xl mr-4" />
                  <div className="flex-1">
                    <span className="font-medium">{exp.label}</span>
                    <p
                      className={`text-sm ${
                        isSelected ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {exp.desc}
                    </p>
                  </div>
                  {isSelected && <span className="ml-auto text-white">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-4">
          {/* Mobility Needs */}
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              <FaWheelchair className="inline mr-2" />
              Any special mobility needs?
            </label>
            <Input
              value={profileData.mobilityNeeds}
              onChange={(e) =>
                handleInputChange("mobilityNeeds", e.target.value)
              }
              placeholder="e.g., Wheelchair accessible (optional)"
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
            />
          </div>

          {/* Bucket List */}
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              <FaMapMarkerAlt className="inline mr-2" />
              Dream destinations?
            </label>
            <Input
              value={profileData.bucketListDestinations}
              onChange={(e) =>
                handleInputChange("bucketListDestinations", e.target.value)
              }
              placeholder="Places you've always wanted to visit (optional)"
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSafetyStep;
