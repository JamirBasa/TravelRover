import { useState, useEffect } from "react";
import { toast } from "sonner";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  STEP_CONFIGS,
  DEFAULT_VALUES,
  MESSAGES,
  calculateProgress,
} from "../constants/options";
import { FaArrowRight, FaArrowLeft, FaCheck } from "react-icons/fa";

// Import step components
import PersonalInfoStep from "./components/PersonalInfoStep";
import TravelStyleStep from "./components/TravelStyleStep";
import FoodCultureStep from "./components/FoodCultureStep";
import BudgetSafetyStep from "./components/BudgetSafetyStep";
import ReviewStep from "./components/ReviewStep";

// Use centralized step configuration
const STEPS = STEP_CONFIGS.USER_PROFILE;

const UserProfile = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    middleName: "",
    age: "",
    gender: "",
    phone: "",
    address: {
      city: "",
      region: "",
      regionCode: "",
      country: "Philippines",
      countryCode: "PH",
    },

    // Travel Preferences
    preferredTripTypes: [],
    budgetRange: "",
    travelStyle: "",
    accommodationPreference: "",

    // Dietary & Cultural Preferences
    dietaryRestrictions: [],
    isHalal: false,
    culturalPreferences: [],

    // Travel Experience
    travelExperience: "",
    favoritePastDestinations: "",
    bucketListDestinations: "",

    // Special Requirements
    mobilityNeeds: "",
    languagePreferences: [],
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },

    // Meta
    isProfileComplete: false,
    createdAt: null,
    updatedAt: null,
  });

  const navigate = useNavigate();
  const progress = calculateProgress(currentStep, STEPS.length);

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
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

        if (existingData.isProfileComplete) {
          // Redirect existing users to settings page
          toast.info("Profile already exists! Redirecting to settings...");
          setTimeout(() => navigate("/settings"), 1500);
          return;
        } else {
          setProfileData((prev) => ({ ...prev, ...existingData }));
        }
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      toast.error("Error loading profile data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value, subField = null) => {
    setProfileData((prev) => {
      if (subField) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [subField]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleMultiSelect = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Personal Info
        if (
          !profileData.firstName ||
          !profileData.lastName ||
          !profileData.address.city ||
          !profileData.address.countryCode
        ) {
          toast.error("Please fill in your first name, last name, and city");
          return false;
        }
        break;
      case 2: // Travel Style
        if (
          profileData.preferredTripTypes.length === 0 ||
          !profileData.budgetRange ||
          !profileData.travelStyle
        ) {
          toast.error("Please select your travel preferences");
          return false;
        }
        break;
      case 3: // Food & Culture
        if (profileData.dietaryRestrictions.length === 0) {
          toast.error("Please select your dietary preferences");
          return false;
        }
        break;
      case 4: // Budget & Safety
        if (
          !profileData.emergencyContact.name ||
          !profileData.emergencyContact.phone
        ) {
          toast.error("Please provide emergency contact information");
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const saveProfile = async () => {
    if (!validateCurrentStep()) return;

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.email) {
        toast.error("Please login first");
        return;
      }

      const profileDocument = {
        ...profileData,
        userEmail: user.email,
        updatedAt: new Date().toISOString(),
        isProfileComplete: true,
        createdAt: profileData.createdAt || new Date().toISOString(),
      };

      await setDoc(doc(db, "UserProfiles", user.email), profileDocument);

      // Update user in localStorage to indicate profile is complete
      const updatedUser = { ...user, hasProfile: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("🎉 Profile saved successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            profileData={profileData}
            handleInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <TravelStyleStep
            profileData={profileData}
            handleInputChange={handleInputChange}
            handleMultiSelect={handleMultiSelect}
          />
        );
      case 3:
        return (
          <FoodCultureStep
            profileData={profileData}
            handleInputChange={handleInputChange}
            handleMultiSelect={handleMultiSelect}
          />
        );
      case 4:
        return (
          <BudgetSafetyStep
            profileData={profileData}
            handleInputChange={handleInputChange}
          />
        );
      case 5:
        return <ReviewStep profileData={profileData} />;
      default:
        return (
          <PersonalInfoStep
            profileData={profileData}
            handleInputChange={handleInputChange}
          />
        );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Checking your profile...</p>
          <p className="text-sm text-gray-500">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Travel Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="w-full bg-cover bg-center relative"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjEwMDAiIHZpZXdCb3g9IjAgMCA4MDAgMTAwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzMzNTVGRjtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNkE4MkZCO3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iMTAwMCIgZmlsbD0idXJsKCNncmFkaWVudDEpIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iNTAwIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI0OCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkV4cGxvcmUgdGhlIFdvcmxkPC90ZXh0Pgo8L3N2Zz4K')",
          }}
        >
          {/* Travel-themed background image placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-700/90"></div>

          {/* Travel elements overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <div className="mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  Your Journey <br />
                  Starts Here
                </h1>
                <p className="text-xl opacity-90 max-w-md mx-auto">
                  Create a personalized travel profile and discover amazing
                  destinations tailored just for you
                </p>
              </div>

              {/* Travel icons */}
              <div className="flex justify-center space-x-8 text-3xl opacity-70">
                <FaPlane className="animate-pulse" />
                <div className="w-2 h-2 bg-white rounded-full mt-4"></div>
                <div className="w-2 h-2 bg-white rounded-full mt-4"></div>
                <div className="w-2 h-2 bg-white rounded-full mt-4"></div>
                <FaUser className="animate-pulse" />
              </div>
            </div>
          </div>

          {/* Map pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="map"
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M10 10 L20 20 M15 5 L25 15 M5 15 L15 25"
                    stroke="white"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#map)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header for mobile */}
        <div className="lg:hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">
            Complete Your Travel Profile
          </h1>
          <p className="opacity-90">Create personalized travel experiences</p>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isActive
                          ? "bg-black border-black text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <FaCheck className="text-sm" />
                      ) : (
                        <Icon className="text-sm" />
                      )}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`hidden md:block w-12 lg:w-16 h-0.5 mx-2 transition-all ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold brand-gradient-text mb-3">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-gray-700 text-lg">
                {STEPS[currentStep - 1].description}
              </p>
            </div>

            <Progress value={progress} className="w-full h-2 mb-2" />
            <div className="text-center text-sm text-gray-500">
              Step {currentStep} of {STEPS.length}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 mb-8">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6"
            >
              <FaArrowLeft />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < STEPS.length ? (
                <Button
                  onClick={nextStep}
                  className="brand-button flex items-center gap-2 px-8 py-3"
                >
                  Next
                  <FaArrowRight />
                </Button>
              ) : (
                <Button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Complete Profile
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
