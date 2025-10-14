import { Input } from "../../components/ui/input";
import { useState, useEffect } from "react";
import {
  getRegionsByCountry,
  getCitiesByRegion,
} from "../../data/locationData";

const PersonalInfo = ({ formData, handleInputChange, isEditing = false }) => {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    // Load Philippines regions
    const philippinesRegions = getRegionsByCountry("PH");
    setRegions(philippinesRegions);
  }, []);

  useEffect(() => {
    // Load cities when regionCode changes (not region name)
    if (formData.address?.regionCode) {
      const regionCities = getCitiesByRegion("PH", formData.address.regionCode);
      setCities(regionCities);
    } else {
      setCities([]);
    }
  }, [formData.address?.regionCode]); // Changed from region to regionCode

  const handleRegionChange = (regionCode) => {
    // Get the region name from the code
    const philippinesRegions = getRegionsByCountry("PH");
    const selectedRegion = philippinesRegions.find(r => r.code === regionCode);
    
    // Update address with both region name and code, clear city
    handleInputChange("address", { 
      ...formData.address,
      region: selectedRegion?.name || regionCode,
      regionCode: regionCode,
      city: "" 
    });
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
            value={formData.phone || ""}
            onChange={handleInputChange}
            placeholder="Enter your phone number"
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
            value={formData.address?.regionCode || ""}
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
              handleInputChange("address", {
                ...formData.address,
                city: e.target.value,
              })
            }
            disabled={!isEditing || !formData.address?.regionCode}
            className={`w-full h-12 px-3 py-2 border rounded-md focus:outline-none ${
              isEditing && formData.address?.regionCode
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