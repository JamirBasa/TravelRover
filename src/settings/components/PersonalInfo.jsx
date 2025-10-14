import { Input } from "../../components/ui/input";
import { useState, useEffect } from "react";
import {
  getRegionsByCountry,
  getCitiesByRegion,
} from "../../data/locationData";

const PersonalInfo = ({ formData, handleInputChange, isEditing = false }) => {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

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

    // Create synthetic event for handleInputChange
    const syntheticEvent = {
      target: {
        name: "phone",
        value: storedValue,
      },
    };
    handleInputChange(syntheticEvent);
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
  const getPhoneDisplayValue = () => {
    const phone = formData.phone || "";
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

  useEffect(() => {
    // Load Philippines regions
    const philippinesRegions = getRegionsByCountry("PH");
    setRegions(philippinesRegions);
  }, []);

  useEffect(() => {
    // Load cities when region changes
    if (formData.address?.region) {
      const regionCities = getCitiesByRegion("PH", formData.address.region);
      setCities(regionCities);
    } else {
      setCities([]);
    }
  }, [formData.address?.region]);

  const handleRegionChange = (regionCode) => {
    // Clear city when region changes
    handleInputChange("address", { region: regionCode, city: "" });
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">
            First Name *
          </label>
          <Input
            type="text"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleInputChange}
            required
            placeholder="Enter your first name"
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
            Last Name *
          </label>
          <Input
            type="text"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleInputChange}
            required
            placeholder="Enter your last name"
            disabled={!isEditing}
            className={`h-12 ${
              isEditing
                ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
                : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">
            Phone Number
          </label>
          <Input
            type="tel"
            name="phone"
            value={getPhoneDisplayValue()}
            onChange={handlePhoneChange}
            placeholder="0917-123-4567"
            maxLength={13}
            disabled={!isEditing}
            className={`h-12 ${
              isEditing
                ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
                : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
            }`}
          />
          {formData.phone && !isValidPhilippinePhone(formData.phone) && (
            <p className="text-xs text-red-500 mt-1">
              Please enter a valid mobile number
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">
            Age
          </label>
          <Input
            type="number"
            name="age"
            value={formData.age || ""}
            onChange={handleInputChange}
            min="18"
            max="120"
            placeholder="Enter your age"
            disabled={!isEditing}
            className={`h-12 ${
              isEditing
                ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
                : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender || ""}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`w-full h-12 px-3 py-2 border rounded-md focus:outline-none ${
              isEditing
                ? "border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900"
                : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
            }`}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">
            Middle Name
          </label>
          <Input
            type="text"
            name="middleName"
            value={formData.middleName || ""}
            onChange={handleInputChange}
            placeholder="Enter your middle name (optional)"
            disabled={!isEditing}
            className={`h-12 ${
              isEditing
                ? "border-blue-200 focus:border-blue-400 bg-white text-gray-900"
                : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">
            Region
          </label>
          <select
            value={formData.address?.region || ""}
            onChange={(e) => handleRegionChange(e.target.value)}
            disabled={!isEditing}
            className={`w-full h-12 px-3 py-2 border rounded-md focus:outline-none ${
              isEditing
                ? "border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900"
                : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
            }`}
          >
            <option value="">Select Region</option>
            {regions.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">
            City
          </label>
          <select
            value={formData.address?.city || ""}
            onChange={(e) =>
              handleInputChange("address", e.target.value, "city")
            }
            disabled={!isEditing || !formData.address?.region}
            className={`w-full h-12 px-3 py-2 border rounded-md focus:outline-none ${
              isEditing && formData.address?.region
                ? "border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900"
                : "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
            }`}
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
