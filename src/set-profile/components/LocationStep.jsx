import Select from "../../components/ui/select";
import { FaMapMarkerAlt, FaMapSigns } from "react-icons/fa";
import {
  getRegionsByCountry,
  getCitiesByRegion,
  getRegionName,
} from "../../data/locationData";
import { useMemo, useEffect } from "react";

const LocationStep = ({ profileData, handleInputChange }) => {
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
    <div className="max-w-2xl mx-auto">
      {/* Location Section - Ultra Compact */}
      <div className="brand-card p-5 border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="brand-gradient p-1.5 rounded-lg">
            <FaMapMarkerAlt className="text-white text-base" />
          </div>
          <h3 className="text-base font-bold brand-gradient-text">
            Your Location in the Philippines
          </h3>
        </div>

        <div className="space-y-3">
          {/* Region/Province Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-1">
              <FaMapSigns className="text-sky-600 dark:text-sky-400 text-xs" />
              Region/Province *
            </label>
            <Select
              value={profileData.address.regionCode}
              onChange={handleRegionChange}
              options={regionOptions}
              placeholder="Select your region/province"
              className="text-sm"
            />
          </div>

          {/* City Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-1">
              <FaMapMarkerAlt className="text-sky-600 dark:text-sky-400 text-xs" />
              City/Municipality *
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
                className="text-sm"
              />
            ) : (
              <input
                type="text"
                value={profileData.address.city}
                onChange={(e) =>
                  handleInputChange("address", {
                    ...profileData.address,
                    city: e.target.value,
                  })
                }
                placeholder={
                  !profileData.address.regionCode
                    ? "Select region first"
                    : "Enter your city"
                }
                disabled={!profileData.address.regionCode}
                className="w-full text-sm py-2.5 px-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationStep;
