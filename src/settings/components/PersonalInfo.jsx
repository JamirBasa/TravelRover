import { Input } from "../../components/ui/input";
import { useState, useEffect } from "react";
import {
  getRegionsByCountry,
  getCitiesByRegion,
} from "../../data/locationData";
import {
  isValidPhilippinePhone,
  formatPhilippinePhone,
  normalizePhilippinePhone,
} from "../../utils/validators";
import {
  FaUser,
  FaPhone,
  FaCalendar,
  FaMapMarkerAlt,
  FaVenusMars,
  FaIdCard,
  FaEnvelope,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const PersonalInfo = ({ formData, handleInputChange }) => {
  // Card-level edit state
  const [editingCards, setEditingCards] = useState({
    basic: false,
    contact: false,
    location: false,
  });

  // Local draft data
  const [cardData, setCardData] = useState({
    basic: {
      firstName: "",
      lastName: "",
      middleName: "",
      gender: "",
      dateOfBirth: "",
    },
    contact: {
      email: "",
      phone: "",
    },
    location: {
      address: {
        country: "",
        region: "",
        regionCode: "",
        city: "",
      },
    },
  });

  // Initialize cardData from formData
  useEffect(() => {
    setCardData({
      basic: {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        middleName: formData.middleName || "",
        gender: formData.gender || "",
        dateOfBirth: formData.dateOfBirth || "",
      },
      contact: {
        email: formData.userEmail || formData.email || "", // Support both field names
        phone: formData.phone || "",
      },
      location: {
        address: {
          country: formData.address?.country || "Philippines",
          region: formData.address?.region || "",
          regionCode: formData.address?.regionCode || "",
          city: formData.address?.city || "",
        },
      },
    });
  }, [formData]);

  // Toggle card edit mode
  const toggleCardEdit = (cardName) => {
    setEditingCards((prev) => ({ ...prev, [cardName]: !prev[cardName] }));
  };

  // Save card changes
  const saveCard = (cardName) => {
    switch (cardName) {
      case "basic": {
        // Sync all basic fields
        if (cardData.basic.firstName !== formData.firstName) {
          handleInputChange({
            target: { name: "firstName", value: cardData.basic.firstName },
          });
        }
        if (cardData.basic.lastName !== formData.lastName) {
          handleInputChange({
            target: { name: "lastName", value: cardData.basic.lastName },
          });
        }
        if (cardData.basic.middleName !== formData.middleName) {
          handleInputChange({
            target: { name: "middleName", value: cardData.basic.middleName },
          });
        }
        if (cardData.basic.gender !== formData.gender) {
          handleInputChange({
            target: { name: "gender", value: cardData.basic.gender },
          });
        }
        if (cardData.basic.dateOfBirth !== formData.dateOfBirth) {
          handleInputChange({
            target: { name: "dateOfBirth", value: cardData.basic.dateOfBirth },
          });
        }
        break;
      }
      case "contact": {
        // Sync contact fields
        if (cardData.contact.email !== formData.email) {
          handleInputChange({
            target: { name: "email", value: cardData.contact.email },
          });
        }
        if (cardData.contact.phone !== formData.phone) {
          handleInputChange({
            target: { name: "phone", value: cardData.contact.phone },
          });
        }
        break;
      }
      case "location": {
        // Sync address
        handleInputChange("address", cardData.location.address);
        break;
      }
    }
    toggleCardEdit(cardName);
  };

  // Cancel card changes
  const cancelCard = (cardName) => {
    // Reset cardData to formData
    switch (cardName) {
      case "basic":
        setCardData((prev) => ({
          ...prev,
          basic: {
            firstName: formData.firstName || "",
            lastName: formData.lastName || "",
            middleName: formData.middleName || "",
            gender: formData.gender || "",
            dateOfBirth: formData.dateOfBirth || "",
          },
        }));
        break;
      case "contact":
        setCardData((prev) => ({
          ...prev,
          contact: {
            email: formData.userEmail || formData.email || "",
            phone: formData.phone || "",
          },
        }));
        break;
      case "location":
        setCardData((prev) => ({
          ...prev,
          location: {
            address: {
              country: formData.address?.country || "Philippines",
              region: formData.address?.region || "",
              regionCode: formData.address?.regionCode || "",
              city: formData.address?.city || "",
            },
          },
        }));
        break;
    }
    toggleCardEdit(cardName);
  };

  // Handle local changes to card data
  const handleLocalChange = (cardName, field, value) => {
    setCardData((prev) => ({
      ...prev,
      [cardName]: {
        ...prev[cardName],
        [field]: value,
      },
    }));
  };

  // Handle local address changes
  const handleLocalAddressChange = (field, value) => {
    setCardData((prev) => ({
      ...prev,
      location: {
        address: {
          ...prev.location.address,
          [field]: value,
        },
      },
    }));
  };

  // Reusable Card Edit Controls Component
  const CardEditControls = ({ cardName, onSave, onCancel, isEditing }) => {
    if (!isEditing) {
      return (
        <button
          onClick={() => toggleCardEdit(cardName)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
        >
          <FaEdit />
          <span className="font-medium">Edit</span>
        </button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSave(cardName)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
        >
          <FaSave />
          <span className="font-medium">Save</span>
        </button>
        <button
          onClick={() => onCancel(cardName)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
        >
          <FaTimes />
          <span className="font-medium">Cancel</span>
        </button>
      </div>
    );
  };

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  // Handle Philippine phone number input with formatting (for card-level editing)
  const handleLocalPhoneChange = (e) => {
    const normalized = normalizePhilippinePhone(e.target.value);
    handleLocalChange("contact", "phone", normalized);
  };

  // Get display value for phone (convert +639XX back to 09XX for display) - for card-level editing
  const getPhoneDisplayValue = () => {
    const phone = editingCards.contact
      ? cardData.contact.phone
      : formData.phone;
    return formatPhilippinePhone(phone);
  };

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

  // Handle local region change for card-level editing
  const handleLocalRegionChange = (regionCode) => {
    // Get the region name from the code
    const philippinesRegions = getRegionsByCountry("PH");
    const selectedRegion = philippinesRegions.find(
      (r) => r.code === regionCode
    );

    // Update local cardData with both region name and code, clear city
    setCardData((prev) => ({
      ...prev,
      location: {
        address: {
          ...prev.location.address,
          region: selectedRegion?.name || regionCode,
          regionCode: regionCode,
          city: "",
        },
      },
    }));

    // Also update the cities dropdown when editing
    if (regionCode) {
      const regionCities = getCitiesByRegion("PH", regionCode);
      setCities(regionCities);
    } else {
      setCities([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center text-white shadow-lg">
              <FaUser className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold brand-gradient-text">
                Basic Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your personal details
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="basic"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.basic}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaIdCard className="text-sky-500" />
              First Name *
            </label>
            <Input
              type="text"
              name="firstName"
              value={cardData.basic.firstName || ""}
              onChange={(e) =>
                handleLocalChange("basic", "firstName", e.target.value)
              }
              required
              placeholder="Enter your first name"
              disabled={!editingCards.basic}
              className={`h-12 transition-all duration-200 ${
                editingCards.basic
                  ? "border-sky-200 focus:border-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:border-sky-300"
                  : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaIdCard className="text-sky-500" />
              Last Name *
            </label>
            <Input
              type="text"
              name="lastName"
              value={cardData.basic.lastName || ""}
              onChange={(e) =>
                handleLocalChange("basic", "lastName", e.target.value)
              }
              required
              placeholder="Enter your last name"
              disabled={!editingCards.basic}
              className={`h-12 transition-all duration-200 ${
                editingCards.basic
                  ? "border-sky-200 focus:border-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:border-sky-300"
                  : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaIdCard className="text-sky-500" />
              Middle Name
            </label>
            <Input
              type="text"
              name="middleName"
              value={cardData.basic.middleName || ""}
              onChange={(e) =>
                handleLocalChange("basic", "middleName", e.target.value)
              }
              placeholder="Optional"
              disabled={!editingCards.basic}
              className={`h-12 transition-all duration-200 ${
                editingCards.basic
                  ? "border-sky-200 focus:border-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:border-sky-300"
                  : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaVenusMars className="text-sky-500" />
              Gender
            </label>
            <div className="relative">
              <select
                name="gender"
                value={cardData.basic.gender || ""}
                onChange={(e) =>
                  handleLocalChange("basic", "gender", e.target.value)
                }
                disabled={!editingCards.basic}
                className={`w-full h-12 pl-4 pr-10 py-2 border-2 rounded-lg appearance-none focus:outline-none transition-all duration-200 ${
                  editingCards.basic
                    ? "border-sky-200 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:border-sky-300 cursor-pointer"
                    : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
                }`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className={`w-5 h-5 ${
                    editingCards.basic ? "text-sky-500" : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaCalendar className="text-sky-500" />
              Date of Birth
            </label>
            <Input
              type="date"
              name="dateOfBirth"
              value={cardData.basic.dateOfBirth || ""}
              onChange={(e) =>
                handleLocalChange("basic", "dateOfBirth", e.target.value)
              }
              disabled={!editingCards.basic}
              className={`h-12 transition-all duration-200 ${
                editingCards.basic
                  ? "border-sky-200 focus:border-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:border-sky-300"
                  : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg">
              <FaPhone className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                Contact Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How we can reach you
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="contact"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.contact}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaEnvelope className="text-emerald-500" />
              Email Address *
            </label>
            <Input
              type="email"
              name="userEmail"
              value={formData.userEmail || ""}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              disabled={true}
              className="h-12 transition-all duration-200 border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
              <span>ℹ️</span> Email cannot be changed (used for account login)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaPhone className="text-emerald-500" />
              Phone Number
            </label>
            <Input
              type="tel"
              name="phone"
              value={getPhoneDisplayValue()}
              onChange={handleLocalPhoneChange}
              placeholder="0917-123-4567"
              maxLength={13}
              disabled={!editingCards.contact}
              className={`h-12 transition-all duration-200 ${
                editingCards.contact
                  ? "border-emerald-200 focus:border-emerald-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:border-emerald-300"
                  : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
              }`}
            />
            {cardData.contact.phone &&
              !isValidPhilippinePhone(cardData.contact.phone) && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> Please enter a valid mobile number
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Location Information Card */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
              <FaMapMarkerAlt className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Location
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Where you're based in the Philippines
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="location"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.location}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Region
            </label>
            <select
              value={cardData.location.address?.regionCode || ""}
              onChange={(e) => handleLocalRegionChange(e.target.value)}
              disabled={!editingCards.location}
              className={`w-full h-12 px-4 py-2 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                editingCards.location
                  ? "border-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:border-purple-300 cursor-pointer"
                  : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              City
            </label>
            <select
              value={cardData.location.address?.city || ""}
              onChange={(e) => handleLocalAddressChange("city", e.target.value)}
              disabled={
                !editingCards.location || !cardData.location.address?.regionCode
              }
              className={`w-full h-12 px-4 py-2 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                editingCards.location && cardData.location.address?.regionCode
                  ? "border-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:border-purple-300 cursor-pointer"
                  : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
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
    </div>
  );
};

export default PersonalInfo;
