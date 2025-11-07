import { Input } from "../../components/ui/input";
import {
  FaShieldAlt,
  FaUser,
  FaPhone,
  FaStar,
  FaWheelchair,
  FaMapMarkerAlt,
  FaSeedling,
  FaPlane,
  FaTrophy,
} from "react-icons/fa";

const BudgetSafetyStep = ({ profileData, handleInputChange }) => {
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
    const phone = profileData.emergencyContact?.phone || "";
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
    <div className="max-w-2xl mx-auto">
      <div className="space-y-4">
        {/* Emergency Contact - Ultra Compact */}
        <div className="brand-card p-4 border-sky-200 dark:border-sky-700">
          <h3 className="text-sm font-bold brand-gradient-text mb-3 flex items-center gap-1.5">
            <FaShieldAlt className="text-sky-600 dark:text-sky-400 text-sm" />
            Emergency Contact
          </h3>
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-1">
                <FaUser className="text-xs text-sky-600 dark:text-sky-400" />
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
                <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
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
                <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-1">
                  <FaPhone className="text-xs text-sky-600 dark:text-sky-400" />
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={getEmergencyPhoneDisplayValue()}
                  onChange={handleEmergencyPhoneChange}
                  placeholder="0917-123-4567"
                  maxLength={13}
                  className="text-sm py-1.5 px-3 rounded-lg border-2 focus:border-sky-500 leading-tight h-auto"
                />
                {profileData.emergencyContact?.phone &&
                  !isValidPhilippinePhone(
                    profileData.emergencyContact?.phone
                  ) && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                      Please enter a valid mobile number
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Travel Experience - Ultra Compact */}
        <div className="brand-card p-4 border-sky-200 dark:border-sky-700">
          <h3 className="text-sm font-bold brand-gradient-text mb-2.5 flex items-center gap-1.5">
            <FaStar className="text-sky-600 dark:text-sky-400 text-sm" />
            Travel Experience
          </h3>
          <div className="space-y-1.5">
            {travelExperienceOptions.map((exp) => {
              const isSelected = profileData.travelExperience === exp.value;
              const IconComponent = exp.icon;
              return (
                <div
                  key={exp.value}
                  className={`flex items-center p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-sky-500 brand-gradient text-white shadow-md"
                      : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-sm"
                  }`}
                  onClick={() =>
                    handleInputChange("travelExperience", exp.value)
                  }
                >
                  <IconComponent
                    className={`text-base mr-2.5 ${
                      isSelected ? "text-white" : "text-sky-600 dark:text-sky-400"
                    }`}
                  />
                  <div className="flex-1">
                    <span
                      className={`font-medium text-xs ${
                        isSelected ? "text-white" : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {exp.label}
                    </span>
                    <p
                      className={`text-xs mt-0.5 ${
                        isSelected ? "text-white/90" : "text-gray-600 dark:text-gray-400"
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
        <div className="brand-card p-4 border-sky-200 dark:border-sky-700 space-y-2.5">
          {/* Mobility Needs */}
          <div>
            <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-1">
              <FaWheelchair className="text-xs text-sky-600 dark:text-sky-400" />
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
            <label className="block text-xs font-medium text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-1">
              <FaMapMarkerAlt className="text-xs text-sky-600 dark:text-sky-400" />
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