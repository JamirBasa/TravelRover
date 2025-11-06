import { useState, useEffect } from "react";
import { Input } from "../../components/ui/input";
import {
  FaSeedling,
  FaPlane,
  FaTrophy,
  FaPhoneAlt,
  FaWheelchair,
  FaMapMarkedAlt,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const SafetyEmergency = ({ formData, handleInputChange }) => {
  // Card-level edit states (independent of global isEditing)
  const [editingCards, setEditingCards] = useState({
    emergency: false,
    experience: false,
    mobility: false,
    dreams: false,
  });

  // Local state for each card (for cancel functionality)
  const [cardData, setCardData] = useState({
    emergency: {},
    experience: "",
    mobility: "",
    dreams: "",
  });

  // Initialize card data from formData
  useEffect(() => {
    setCardData({
      emergency: formData.emergencyContact || {},
      experience: formData.travelExperience || "",
      mobility: formData.mobilityNeeds || "",
      dreams: formData.bucketListDestinations || "",
    });
  }, [formData]);

  // Toggle edit mode for a specific card
  const toggleCardEdit = (cardName) => {
    setEditingCards((prev) => ({
      ...prev,
      [cardName]: !prev[cardName],
    }));
  };

  // Save changes for a specific card
  const saveCard = (cardName) => {
    // Update parent formData based on card
    switch (cardName) {
      case "emergency":
        handleInputChange("emergencyContact", cardData.emergency);
        break;
      case "experience":
        handleInputChange("travelExperience", cardData.experience);
        break;
      case "mobility":
        handleInputChange("mobilityNeeds", cardData.mobility);
        break;
      case "dreams":
        handleInputChange("bucketListDestinations", cardData.dreams);
        break;
    }
    toggleCardEdit(cardName);
  };

  // Cancel changes for a specific card
  const cancelCard = (cardName) => {
    // Reset card data from formData
    setCardData((prev) => ({
      ...prev,
      [cardName]:
        cardName === "emergency"
          ? formData.emergencyContact || {}
          : formData[
              cardName === "experience"
                ? "travelExperience"
                : cardName === "mobility"
                ? "mobilityNeeds"
                : "bucketListDestinations"
            ] || "",
    }));
    toggleCardEdit(cardName);
  };

  // Handle local input changes (before save)
  const handleLocalChange = (cardName, field, value, subField = null) => {
    if (cardName === "emergency") {
      setCardData((prev) => ({
        ...prev,
        emergency: {
          ...prev.emergency,
          [subField || field]: value,
        },
      }));
    } else {
      setCardData((prev) => ({
        ...prev,
        [cardName]: value,
      }));
    }
  };
  // Handle Philippine phone number input with formatting
  const handleEmergencyPhoneChange = (e) => {
    if (!editingCards.emergency) return; // Only allow changes when card is in edit mode

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

    // Update local card data
    handleLocalChange("emergency", "phone", storedValue);
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
    const phone = cardData.emergency?.phone || "";
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

  // Reusable Edit/Save/Cancel Controls
  const CardEditControls = ({ cardName, onSave, onCancel, isEditing }) => (
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <button
          onClick={() => toggleCardEdit(cardName)}
          className="px-3 py-1.5 rounded-lg brand-gradient text-white text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <FaEdit className="text-xs" />
          Edit
        </button>
      ) : (
        <>
          <button
            onClick={() => onCancel(cardName)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 flex items-center gap-2"
          >
            <FaTimes className="text-xs" />
            Cancel
          </button>
          <button
            onClick={() => onSave(cardName)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <FaSave className="text-xs" />
            Save
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Emergency Contact Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
              <FaPhoneAlt className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
                Emergency Contact
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Person to contact in case of emergency
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="emergency"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.emergency}
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={cardData.emergency?.name || ""}
                onChange={(e) =>
                  handleLocalChange("emergency", "name", e.target.value)
                }
                placeholder="Full name"
                disabled={!editingCards.emergency}
                className={`h-12 transition-all duration-300 ${
                  editingCards.emergency
                    ? "border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relationship
              </label>
              <Input
                type="text"
                value={cardData.emergency?.relationship || ""}
                onChange={(e) =>
                  handleLocalChange("emergency", "relationship", e.target.value)
                }
                placeholder="e.g., Parent, Spouse, Friend"
                disabled={!editingCards.emergency}
                className={`h-12 transition-all duration-300 ${
                  editingCards.emergency
                    ? "border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
                }`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={getEmergencyPhoneDisplayValue()}
              onChange={handleEmergencyPhoneChange}
              placeholder="0917-123-4567"
              maxLength={13}
              disabled={!editingCards.emergency}
              className={`h-12 transition-all duration-300 ${
                editingCards.emergency
                  ? "border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                  : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
              }`}
            />
            {cardData.emergency?.phone &&
              !isValidPhilippinePhone(cardData.emergency?.phone) && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠️</span> Please enter a valid Philippine mobile number
                  (09XX-XXX-XXXX)
                </p>
              )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format: 09XX-XXX-XXXX (Philippine mobile number)
            </p>
          </div>
        </div>
      </div>

      {/* Travel Experience Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center text-white shadow-lg">
              <FaPlane className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold brand-gradient-text">
                Travel Experience Level
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How experienced are you with traveling?
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="experience"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.experience}
          />
        </div>

        <div className="space-y-3">
          {travelExperienceOptions.map((exp) => {
            const isSelected = cardData.experience === exp.value;
            const IconComponent = exp.icon;
            return (
              <button
                key={exp.value}
                onClick={() =>
                  editingCards.experience &&
                  handleLocalChange("experience", null, exp.value)
                }
                disabled={!editingCards.experience}
                className={`group relative w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  editingCards.experience
                    ? "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    : "cursor-not-allowed opacity-60"
                } ${
                  isSelected
                    ? "border-sky-500 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 shadow-md"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300"
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white scale-110"
                      : "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 text-sky-600 dark:text-sky-400 group-hover:scale-110"
                  }`}
                >
                  <IconComponent className="text-xl" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-semibold ${
                      isSelected
                        ? "text-sky-700 dark:text-sky-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {exp.label}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {exp.desc}
                  </p>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      ✓
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Requirements Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <FaWheelchair className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Special Requirements
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Any mobility or accessibility needs
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="mobility"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.mobility}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mobility Needs <span className="text-gray-400">(Optional)</span>
          </label>
          <Input
            type="text"
            value={cardData.mobility || ""}
            onChange={(e) =>
              handleLocalChange("mobility", null, e.target.value)
            }
            placeholder="e.g., Wheelchair accessible, Walking assistance, None"
            disabled={!editingCards.mobility}
            className={`h-12 transition-all duration-300 ${
              editingCards.mobility
                ? "border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
            }`}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Help us recommend accessible destinations and accommodations
          </p>
        </div>
      </div>

      {/* Dream Destinations Section */}
      <div className="brand-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg">
              <FaMapMarkedAlt className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                Dream Destinations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Places on your bucket list
              </p>
            </div>
          </div>
          <CardEditControls
            cardName="dreams"
            onSave={saveCard}
            onCancel={cancelCard}
            isEditing={editingCards.dreams}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bucket List Destinations{" "}
            <span className="text-gray-400">(Optional)</span>
          </label>
          <Input
            type="text"
            value={cardData.dreams || ""}
            onChange={(e) => handleLocalChange("dreams", null, e.target.value)}
            placeholder="e.g., Boracay, Palawan, Siargao, Japan, Europe..."
            disabled={!editingCards.dreams}
            className={`h-12 transition-all duration-300 ${
              editingCards.dreams
                ? "border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                : "border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
            }`}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            🌟 Share the places you've always dreamed of visiting
          </p>
        </div>
      </div>
    </div>
  );
};

export default SafetyEmergency;
