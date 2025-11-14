import { Input } from "../../components/ui/input";
import Select from "../../components/ui/select";
import { FaUser, FaPhone, FaCalendar } from "react-icons/fa";

const PersonalInfoStep = ({ profileData, handleInputChange }) => {
  // Handle Philippine phone number input with formatting
  const handlePhoneChange = (e) => {
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
    handleInputChange("phone", storedValue);
    handleInputChange("phoneDisplay", formattedValue); // For display purposes
  };

  const handleDateOfBirthChange = (e) => {
    const dateOfBirth = e.target.value;
    handleInputChange("dateOfBirth", dateOfBirth);
  };

  // Validate Philippine phone number
  const isValidPhilippinePhone = (phone) => {
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
  const getPhoneDisplayValue = () => {
    if (!profileData.phone) return "";

    const digits = profileData.phone.replace(/\D/g, "");

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
    return profileData.phone;
  };

  // Get max date (18 years ago - minimum age to travel independently) and min date (120 years ago)
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split("T")[0]; // Must be at least 18 years old
  const minDate = new Date(
    new Date().setFullYear(new Date().getFullYear() - 120)
  )
    .toISOString()
    .split("T")[0];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Personal Information Form - Ultra Compact */}
      <div className="brand-card p-5 border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="brand-gradient p-1.5 rounded-lg">
            <FaUser className="text-white text-base" />
          </div>
          <div>
            <h3 className="text-base font-bold brand-gradient-text">
              Personal Details
            </h3>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              First Name *
            </label>
            <Input
              value={profileData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              placeholder="Juan"
              className="text-sm py-2 px-3 rounded-lg border-2 focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-tight h-auto"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              Last Name *
            </label>
            <Input
              value={profileData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              placeholder="Dela Cruz"
              className="text-sm py-2 px-3 rounded-lg border-2 focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-tight h-auto"
            />
          </div>

          {/* Middle Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              Middle Name{" "}
              <span className="text-gray-400 dark:text-gray-500 text-xs">(Optional)</span>
            </label>
            <Input
              value={profileData.middleName}
              onChange={(e) => handleInputChange("middleName", e.target.value)}
              placeholder="Santos"
              className="text-sm py-2 px-3 rounded-lg border-2 focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-tight h-auto"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-1">
              <FaCalendar className="text-sky-600 dark:text-sky-400 text-xs" />
              Date of Birth *{" "}
              <span className="text-gray-400 dark:text-gray-500 font-normal">(18+)</span>
            </label>
            <Input
              type="date"
              value={profileData.dateOfBirth || ""}
              onChange={handleDateOfBirthChange}
              max={maxDate}
              min={minDate}
              className="text-sm py-2 px-3 rounded-lg border-2 focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600 leading-tight h-auto cursor-pointer"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              Gender
            </label>
            <Select
              value={profileData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
                { value: "prefer_not_to_say", label: "Prefer not to say" },
              ]}
              placeholder="Select"
              className="text-sm"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-1">
              <FaPhone className="text-sky-600 dark:text-sky-400 text-xs" />
              Mobile Number *
            </label>
            <Input
              type="tel"
              value={getPhoneDisplayValue()}
              onChange={handlePhoneChange}
              placeholder="0917-123-4567"
              maxLength={13}
              className="text-sm py-2 px-3 rounded-lg border-2 focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-tight h-auto"
            />
            {profileData.phone &&
              !isValidPhilippinePhone(profileData.phone) && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                  Please enter a valid mobile number
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PersonalInfoStep;
