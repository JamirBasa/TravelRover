import { Input } from "../../components/ui/input";

const SafetyEmergency = ({
  formData,
  handleInputChange,
  handleMultiSelect,
  isEditing = false,
}) => {
  // Travel experience options - match BudgetSafetyStep
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-blue-600 mb-4">
          Emergency Contact
        </h3>
        <div className="bg-blue-50 p-4 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-2">
                Contact Name *
              </label>
              <Input
                type="text"
                value={formData.emergencyContact?.name || ""}
                onChange={(e) =>
                  handleInputChange("emergencyContact", e.target.value, "name")
                }
                placeholder="Contact person's name"
                disabled={!isEditing}
                className={`h-12 ${
                  isEditing
                    ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
                    : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-2">
                Relationship
              </label>
              <Input
                type="text"
                value={formData.emergencyContact?.relationship || ""}
                onChange={(e) =>
                  handleInputChange(
                    "emergencyContact",
                    e.target.value,
                    "relationship"
                  )
                }
                placeholder="e.g., Parent, Spouse"
                disabled={!isEditing}
                className={`h-12 ${
                  isEditing
                    ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
                    : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
                }`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-600 mb-2">
              Phone Number *
            </label>
            <Input
              type="tel"
              value={formData.emergencyContact?.phone || ""}
              onChange={(e) =>
                handleInputChange("emergencyContact", e.target.value, "phone")
              }
              placeholder="+63 XXX XXX XXXX"
              disabled={!isEditing}
              className={`h-12 ${
                isEditing
                  ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
                  : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
              }`}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-blue-600 mb-4">
          Travel Experience Level
        </h3>
        <div className="space-y-3">
          {travelExperienceOptions.map((exp) => {
            const isSelected = formData.travelExperience === exp.value;
            return (
              <button
                key={exp.value}
                onClick={() =>
                  isEditing && handleInputChange("travelExperience", exp.value)
                }
                disabled={!isEditing}
                className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isEditing
                    ? "cursor-pointer transform hover:scale-105 hover:shadow-md"
                    : "cursor-not-allowed"
                } ${
                  isSelected
                    ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : isEditing
                    ? "border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-900"
                    : "border-gray-300 bg-gray-100 text-gray-500"
                }`}
              >
                <div className="flex-1">
                  <span className="font-medium">{exp.label}</span>
                  <p
                    className={`text-sm ${
                      isSelected ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {exp.desc}
                  </p>
                </div>
                {isSelected && <span className="ml-auto text-white">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Special Mobility Needs
        </label>
        <Input
          type="text"
          value={formData.mobilityNeeds || ""}
          onChange={(e) => handleInputChange("mobilityNeeds", e.target.value)}
          placeholder="e.g., Wheelchair accessible, assistance needed (optional)"
          disabled={!isEditing}
          className={`h-12 ${
            isEditing
              ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
              : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
          }`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-600 mb-2">
          Dream Destinations
        </label>
        <Input
          type="text"
          value={formData.bucketListDestinations || ""}
          onChange={(e) =>
            handleInputChange("bucketListDestinations", e.target.value)
          }
          placeholder="Places you've always wanted to visit (optional)"
          disabled={!isEditing}
          className={`h-12 ${
            isEditing
              ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
              : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
          }`}
        />
      </div>
    </div>
  );
};

export default SafetyEmergency;
