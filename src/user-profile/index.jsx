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
import {
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaPlane,
  FaUser,
} from "react-icons/fa";
import { usePageTitle } from "../hooks/usePageTitle";

// Import step components
import PersonalInfoStep from "./components/PersonalInfoStep";
import LocationStep from "./components/LocationStep";
import TravelStyleStep from "./components/TravelStyleStep";
import DietaryCulturalStep from "./components/DietaryCulturalStep";
import LanguageStep from "./components/LanguageStep";
import BudgetSafetyStep from "./components/BudgetSafetyStep";
import ReviewStep from "./components/ReviewStep";

// Use centralized step configuration
const STEPS = STEP_CONFIGS.USER_PROFILE;

const UserProfile = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Set dynamic page title based on current step
  const currentStepTitle =
    STEPS.find((step) => step.id === currentStep)?.title || "User Profile";
  usePageTitle(`${currentStepTitle} - Profile Setup`);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    gender: "",
    phone: "", // Stored as +639XX format
    phoneDisplay: "", // Display format 09XX-XXX-XXXX
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
          !profileData.phone
        ) {
          toast.error(
            "Please fill in your first name, last name, and phone number"
          );
          return false;
        }
        break;
      case 2: // Location
        if (!profileData.address.city || !profileData.address.regionCode) {
          toast.error("Please select your region and city");
          return false;
        }
        break;
      case 3: // Travel Style
        if (
          profileData.preferredTripTypes.length === 0 ||
          !profileData.budgetRange ||
          !profileData.travelStyle
        ) {
          toast.error("Please select your travel preferences");
          return false;
        }
        break;
      case 4: // Dietary & Cultural
        if (profileData.dietaryRestrictions.length === 0) {
          toast.error("Please select at least one dietary preference");
          return false;
        }
        break;
      case 5: // Languages
        if (profileData.languagePreferences.length === 0) {
          toast.error("Please select at least one language you speak");
          return false;
        }
        break;
      case 6: // Budget & Safety
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

      toast.success(
        "Your travel profile is now complete. You can start creating personalized trips and receive AI-powered recommendations tailored to your preferences."
      );
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
          <LocationStep
            profileData={profileData}
            handleInputChange={handleInputChange}
          />
        );
      case 3:
        return (
          <TravelStyleStep
            profileData={profileData}
            handleInputChange={handleInputChange}
            handleMultiSelect={handleMultiSelect}
          />
        );
      case 4:
        return (
          <DietaryCulturalStep
            profileData={profileData}
            handleInputChange={handleInputChange}
            handleMultiSelect={handleMultiSelect}
          />
        );
      case 5:
        return (
          <LanguageStep
            profileData={profileData}
            handleMultiSelect={handleMultiSelect}
          />
        );
      case 6:
        return (
          <BudgetSafetyStep
            profileData={profileData}
            handleInputChange={handleInputChange}
          />
        );
      case 7:
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Checking your profile...</p>
          <p className="text-sm text-gray-500">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Travel Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="w-full bg-cover bg-center relative"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2835&auto=format&fit=crop')",
          }}
        >
          {/* Travel-themed background image with lighter overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-600/50 to-blue-700/50"></div>

          {/* Travel elements overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-8 bg-black/20 backdrop-blur-sm rounded-3xl max-w-lg mx-4">
              <div className="mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                  Your Journey <br />
                  Starts Here
                </h1>
                <p className="text-xl opacity-95 max-w-md mx-auto drop-shadow-md">
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
        <div className="lg:hidden brand-gradient text-white p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">
            Complete Your Travel Profile
          </h1>
          <p className="opacity-90">Create personalized travel experiences</p>
        </div>

        {/* Form Container - No Scroll, Compact Layout */}
        <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden max-h-screen">
          {/* Modern Progress Header */}
          <div className="mb-5">
            {/* Animated Progress Bar with Gradient */}
            <div className="relative mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full brand-gradient rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>

              {/* Step Dots Overlay */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-1">
                {STEPS.map((step, index) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className="relative group"
                      style={{ width: `${100 / STEPS.length}%` }}
                    >
                      <div className="flex justify-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            isCompleted
                              ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30"
                              : isActive
                              ? "brand-gradient border-sky-500 text-white shadow-lg shadow-sky-500/40 scale-110"
                              : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {isCompleted ? (
                            <FaCheck className="text-xs" />
                          ) : (
                            <Icon className="text-xs" />
                          )}
                        </div>
                      </div>

                      {/* Tooltip on hover - hidden on small screens */}
                      <div className="hidden md:block absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        <div className="bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg">
                          {step.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modern Title Card with Progress Badge */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-3 mb-3">
                {/* Progress Badge */}
                <div className="relative">
                  <svg className="w-16 h-16 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="url(#gradient)"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 28 * (1 - progress / 100)
                      }`}
                      className="transition-all duration-500 ease-out"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Percentage in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold brand-gradient-text">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Step Info */}
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 border border-sky-200">
                      Step {currentStep} of {STEPS.length}
                    </span>
                    {currentStep === STEPS.length && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        Almost done!
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold brand-gradient-text">
                    {STEPS[currentStep - 1].title}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Step Content - Fits viewport */}
          <div className="flex-1 overflow-y-auto">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-700">
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
