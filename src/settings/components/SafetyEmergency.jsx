import { Input } from "../../components/ui/input";
import { FaSeedling, FaPlane, FaTrophy } from "react-icons/fa";

const SafetyEmergency = ({
  formData,
  handleInputChange,
  handleMultiSelect,
  isEditing = false,
}) => {
  // Handle Philippine phone number input with formatting
  const handleEmergencyPhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    // Handle if user pastes +63 format - convert to 09XX
    if (value.startsWith("63") && value.length === 12) {
      value = "0" + value.slice(2);
    }

    // Limit to 11 digits (Philippine mobile number format: 09XX-XXX-XXXX)
    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    // Format as 09XX-XXX-XXXX for display
    let formattedValue = value;
    if (value.length > 0) {
      if (value.length <= 4) {
        formattedValue = value;
      } else if (value.length <= 7) {
        formattedValue = value.slice(0, 4) + "-" + value.slice(4);
      } else {
        formattedValue =
          value.slice(0, 4) + "-" + value.slice(4, 7) + "-" + value.slice(7);
      }
    }

    // Store in international format (+639XX) but display as 09XX
    let storedValue = formattedValue;
    if (value.length === 11 && value.startsWith("09")) {
      // Convert 09XX to +639XX for storage
      storedValue = "+63" + value.slice(1);
    } else {
      storedValue = formattedValue;
    }

    // Store the international format for backend/database
    handleInputChange("emergencyContact", storedValue, "phone");
  };

  // Validate Philippine phone number
  const isValidPhilippinePhone = (phone) => {
    if (!phone) return false;
    // Remove all non-digits and check if it's valid
    const digits = phone.replace(/\D/g, "");

    // Check for +639XX format (12 digits) or 09XX format (11 digits)
    if (digits.length === 12 && digits.startsWith("63")) {
      return true; // +639XX-XXX-XXXX
    }
    if (digits.length === 11 && digits.startsWith("09")) {
      return true; // 09XX-XXX-XXXX
    }

    return false;
  };

  // Get display value for phone (convert +639XX back to 09XX for display)
  const getEmergencyPhoneDisplayValue = () => {
    const phone = formData.emergencyContact?.phone || "";
    if (!phone) return "";

    const digits = phone.replace(/\D/g, "");

    // If stored as +639XX, convert to 09XX for display
    if (digits.startsWith("63") && digits.length === 12) {
      const localNumber = "0" + digits.slice(2);
      // Format as 09XX-XXX-XXXX
      if (localNumber.length <= 4) {
        return localNumber;
      } else if (localNumber.length <= 7) {
        return localNumber.slice(0, 4) + "-" + localNumber.slice(4);
      } else {
        return (
          localNumber.slice(0, 4) +
          "-" +
          localNumber.slice(4, 7) +
          "-" +
          localNumber.slice(7)
        );
      }
    }

    // Already in display format
    return phone;
  };

  // Travel experience options - match BudgetSafetyStep
  const travelExperienceOptions = [
    {
      value: "beginner",
      label: "Beginner",
      desc: "First few trips",
      icon: FaSeedling,
    },
    {
      value: "intermediate",
      label: "Intermediate",
      desc: "Some travel experience",
      icon: FaPlane,
    },
    {
      value: "expert",
      label: "Expert",
      desc: "Frequent traveler",
      icon: FaTrophy,
    },
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
              value={getEmergencyPhoneDisplayValue()}
              onChange={handleEmergencyPhoneChange}
              placeholder="0917-123-4567"
              maxLength={13}
              disabled={!isEditing}
              className={`h-12 ${
                isEditing
                  ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
                  : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
              }`}
            />
            {formData.emergencyContact?.phone &&
              !isValidPhilippinePhone(formData.emergencyContact?.phone) && (
                <p className="text-xs text-red-500 mt-1">
                  Please enter a valid mobile number
                </p>
              )}
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
            const IconComponent = exp.icon;
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
                <IconComponent
                  className={`text-xl mr-3 ${
                    isSelected ? "text-white" : "text-blue-600"
                  }`}
                />
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
