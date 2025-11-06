import { useState, useEffect } from "react";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
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
  FaArrowLeft,
} from "react-icons/fa";
import { usePageTitle } from "../hooks/usePageTitle";
import { LoadingSpinner } from "../components/common/LoadingStates";

const Settings = () => {
  const [loading, setLoading] = useState(true);

  // Set page title for settings
  usePageTitle("Settings");
  const [activeTab, setActiveTab] = useState("travel");
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({});

  const navigate = useNavigate();

  const tabs = [
    { id: "travel", label: "Travel Preferences", icon: FaPlane },
    { id: "food", label: "Food & Culture", icon: FaUtensils },
    { id: "personal", label: "Personal Info", icon: FaUser },
    { id: "safety", label: "Safety & Emergency", icon: FaShieldAlt },
  ];

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          navigate("/set-profile");
          return;
        }
        setProfileData(existingData);
        setFormData(existingData);
      } else {
        toast.error("Profile not found. Please create your profile first.");
        navigate("/set-profile");
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
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...(prev[field] || []), value],
    }));
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading your settings..."
        subtitle="Please wait a moment"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-sky-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:border-sky-300 dark:hover:border-sky-600 cursor-pointer"
              >
                <FaArrowLeft />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Settings
                </h1>
                <p className="text-blue-600 dark:text-blue-400">
                  Manage your travel preferences
                </p>
              </div>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Last updated:{" "}
              {profileData?.updatedAt
                ? new Date(profileData.updatedAt).toLocaleDateString()
                : "Never"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-blue-100 dark:border-slate-700 p-4 sticky top-8">
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
                          : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400"
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
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-blue-100 dark:border-slate-700 p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold brand-gradient-text">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h2>
              </div>

              <div>
                {activeTab === "travel" && (
                  <TravelPreferences
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleMultiSelect={handleMultiSelect}
                  />
                )}
                {activeTab === "food" && (
                  <FoodCulture
                    formData={formData}
                    handleMultiSelect={handleMultiSelect}
                  />
                )}
                {activeTab === "personal" && (
                  <PersonalInfo
                    formData={formData}
                    handleInputChange={handleInputChange}
                  />
                )}
                {activeTab === "safety" && (
                  <SafetyEmergency
                    formData={formData}
                    handleInputChange={handleInputChange}
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
