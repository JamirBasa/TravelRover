import { Input } from "../../components/ui/input";
import Select from "../../components/ui/select";
import { FaUser, FaPhone, FaMapMarkerAlt, FaMapSigns } from "react-icons/fa";
import {
  getRegionsByCountry,
  getCitiesByRegion,
  getRegionName,
} from "../../data/locationData";
import { useMemo, useEffect } from "react";

const PersonalInfoStep = ({ profileData, handleInputChange }) => {
  // Set Philippines as default country
  useEffect(() => {
    if (!profileData.address.countryCode) {
      handleInputChange("address", {
        ...profileData.address,
        countryCode: "PH",
        country: "Philippines",
      });
    }
  }, [profileData.address, handleInputChange]);

  const regionOptions = useMemo(() => {
    // Always use Philippines (PH) as the country
    return getRegionsByCountry("PH").map((region) => ({
      value: region.code,
      label: region.name,
    }));
  }, []);

  const cityOptions = useMemo(() => {
    if (!profileData.address.regionCode) return [];
    return getCitiesByRegion("PH", profileData.address.regionCode).map(
      (city) => ({
        value: city,
        label: city,
      })
    );
  }, [profileData.address.regionCode]);

  const handleRegionChange = (e) => {
    const regionCode = e.target.value;
    const regionName = getRegionName("PH", regionCode);

    // Reset city when region changes
    handleInputChange("address", {
      ...profileData.address,
      regionCode,
      region: regionName,
      city: "",
    });
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    handleInputChange("address", {
      ...profileData.address,
      city,
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Main Question */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Tell us about yourself
        </h2>
        <p className="text-gray-600 text-sm">
          Let's start with your basic information
        </p>
      </div>

      {/* Personal Information Form */}
      <div className="space-y-5">
        {/* Name Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              <FaUser className="inline mr-2" />
              First Name *
            </label>
            <Input
              value={profileData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              placeholder="Enter your first name"
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              Last Name *
            </label>
            <Input
              value={profileData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              placeholder="Enter your last name"
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              Middle Name (Optional)
            </label>
            <Input
              value={profileData.middleName}
              onChange={(e) => handleInputChange("middleName", e.target.value)}
              placeholder="Enter your middle name"
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              Age
            </label>
            <Input
              type="number"
              value={profileData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              placeholder="Your age"
              className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
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
              placeholder="Select your gender"
              className="text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-base font-medium text-gray-800 mb-2">
            <FaPhone className="inline mr-2" />
            Phone
          </label>
          <Input
            value={profileData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="Your phone number"
            className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
          />
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center">
            Where are you located in the Philippines? *
          </h3>

          {/* Region/Province Selection */}
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              <FaMapSigns className="inline mr-1" />
              Region/Province *
            </label>
            <Select
              value={profileData.address.regionCode}
              onChange={handleRegionChange}
              options={regionOptions}
              placeholder="Select your region/province"
              className="text-base"
            />
          </div>

          {/* City Selection */}
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              <FaMapMarkerAlt className="inline mr-1" />
              City *
            </label>
            {cityOptions.length > 0 ? (
              <Select
                value={profileData.address.city}
                onChange={handleCityChange}
                options={cityOptions}
                placeholder={
                  !profileData.address.regionCode
                    ? "Select region first"
                    : "Select your city"
                }
                disabled={!profileData.address.regionCode}
                className="text-base"
              />
            ) : (
              <Input
                value={profileData.address.city}
                onChange={(e) =>
                  handleInputChange("address", e.target.value, "city")
                }
                placeholder={
                  !profileData.address.regionCode
                    ? "Select region first"
                    : "Enter your city"
                }
                disabled={!profileData.address.regionCode}
                className="text-base py-3 px-3 rounded-lg border-2 focus:border-black leading-tight h-auto"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PersonalInfoStep;
