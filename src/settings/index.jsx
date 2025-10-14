import { useState, useEffect } from "react";
import { toast } from "sonner";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import TravelPreferences from "./components/TravelPreferences";
import FoodCulture from "./components/FoodCulture";
import PersonalInfo from "./components/PersonalInfo";
import SafetyEmergency from "./components/SafetyEmergency";
import {
  FaUser,
  FaPlane,
  FaUtensils,
  FaShieldAlt,
  FaSave,
  FaArrowLeft,
  FaEdit,
  FaTimes,
} from "react-icons/fa";
import { usePageTitle } from "../hooks/usePageTitle";

const Settings = () => {
  const [loading, setLoading] = useState(true);

  // Set page title for settings
  usePageTitle("Settings");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("travel");
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});

  const navigate = useNavigate();

  const tabs = [
    { id: "travel", label: "Travel Preferences", icon: FaPlane },
    { id: "food", label: "Food & Culture", icon: FaUtensils },
    { id: "personal", label: "Personal Info", icon: FaUser },
    { id: "safety", label: "Safety & Emergency", icon: FaShieldAlt },
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userString = localStorage.getItem("user");
      if (!userString) {
        toast.error("Please login first");
        navigate("/");
        return;
      }

      const user = JSON.parse(userString);
      if (!user?.email) {
        toast.error("Invalid user data, please login again");
        navigate("/");
        return;
      }

      const docRef = doc(db, "UserProfiles", user.email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        if (!existingData.isProfileComplete) {
          toast.error("Please complete your profile first");
          navigate("/user-profile");
          return;
        }
        setProfileData(existingData);
        setFormData(existingData);
        setOriginalData(existingData);
      } else {
        toast.error("Profile not found. Please create your profile first.");
        navigate("/user-profile");
        return;
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Error loading profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldOrEvent, value = null, subField = null) => {
    if (!isEditing) return; // Prevent changes when not in edit mode

    // Handle both React event objects and direct field/value calls
    let field, newValue;

    if (typeof fieldOrEvent === "object" && fieldOrEvent.target) {
      // React event object
      field = fieldOrEvent.target.name;
      newValue = fieldOrEvent.target.value;
    } else {
      // Direct field/value call (backwards compatibility)
      field = fieldOrEvent;
      newValue = value;
    }

    setFormData((prev) => {
      if (subField) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [subField]: newValue,
          },
        };
      }
      return {
        ...prev,
        [field]: newValue,
      };
    });
  };

  const handleMultiSelect = (field, value) => {
    if (!isEditing) return; // Prevent changes when not in edit mode

    setFormData((prev) => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...(prev[field] || []), value],
    }));
  };

  const enableEdit = () => {
    setOriginalData({ ...formData }); // Store current data as backup
    setIsEditing(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const profileDocument = {
        ...formData,
        userEmail: user.email,
        updatedAt: new Date().toISOString(),
        isProfileComplete: true,
      };

      await setDoc(doc(db, "UserProfiles", user.email), profileDocument);
      setProfileData(formData);
      setOriginalData(formData);
      setIsEditing(false);
      toast.success("Settings updated successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({ ...originalData }); // Restore original data
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading your settings...</p>
          <p className="text-blue-500 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              >
                <FaArrowLeft />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-blue-600">Manage your travel preferences</p>
              </div>
            </div>
            <div className="text-sm text-blue-600">
              Last updated:{" "}
              {profileData?.updatedAt
                ? new Date(profileData.updatedAt).toLocaleDateString()
                : "Never"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105"
                          : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      <Icon className="text-lg" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {tabs.find((tab) => tab.id === activeTab)?.label}
                  </h2>
                  {isEditing && (
                    <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-300">
                      Editing Mode
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button
                      onClick={enableEdit}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105 transition-all duration-200"
                    >
                      <FaEdit />
                      Edit Settings
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={cancelEdit}
                        variant="outline"
                        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                      >
                        <FaTimes />
                        Cancel
                      </Button>
                      <Button
                        onClick={saveChanges}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105 transition-all duration-200"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="max-w-2xl">
                {activeTab === "travel" && (
                  <TravelPreferences
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleMultiSelect={handleMultiSelect}
                    isEditing={isEditing}
                  />
                )}
                {activeTab === "food" && (
                  <FoodCulture
                    formData={formData}
                    handleMultiSelect={handleMultiSelect}
                    isEditing={isEditing}
                  />
                )}
                {activeTab === "personal" && (
                  <PersonalInfo
                    formData={formData}
                    handleInputChange={handleInputChange}
                    isEditing={isEditing}
                  />
                )}
                {activeTab === "safety" && (
                  <SafetyEmergency
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleMultiSelect={handleMultiSelect}
                    isEditing={isEditing}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
