// src/create-trip/index.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { chatSession } from "../config/aimodel";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import {
  STEP_CONFIGS,
  MESSAGES,
  VALIDATION_RULES,
  calculateProgress,
  validateAIResponse,
  sanitizeJSONString,
} from "../constants/options";
import { buildOptimizedPrompt } from "../constants/optimizedPrompt";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { safeJsonParse } from "../utils/jsonParsers";
import {
  validateItinerary,
  validateActivityCount,
  getValidationSuggestion,
} from "../utils/itineraryValidator";
import { autoFixItinerary } from "../utils/itineraryAutoFix";
import {
  validateHotelData,
  getHotelSearchParams, // For future hotel API integration
} from "../utils/hotelValidation";
import { FaArrowRight, FaArrowLeft, FaUser, FaCheck } from "react-icons/fa";

// Import components
import LocationSelector from "./components/LocationSelector";
import DateRangePicker from "./components/DateRangePicker";
import BudgetSelector from "./components/BudgetSelector";
import TravelerSelector from "./components/TravelerSelector";
import SpecificRequests from "./components/SpecificRequests";
import FlightPreferences from "./components/FlightPreferences";
import HotelPreferences from "./components/HotelPreferences";
import ActivityPreferenceSelector from "./components/ActivityPreferenceSelector";
import ReviewTripStep from "./components/ReviewTripStep";
import GenerateTripButton from "./components/GenerateTripButton";
import LoginDialog from "./components/LoginDialog";
import TripGenerationModal from "./components/TripGenerationModal";
import { ProfileLoading, ErrorState } from "../components/common/LoadingStates";
import { LangGraphTravelAgent } from "../config/langGraphAgent";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  shouldIncludeFlights,
  shouldIncludeHotels,
  validateFlightData,
  getActiveServices,
  sanitizeTripPreferences,
} from "../utils/tripPreferences";
import { UserProfileService } from "../services/userProfileService";
import {
  calculateTravelDates,
  getDateExplanation,
  validateTravelDates,
} from "../utils/travelDateManager";

// Use centralized step configuration
const STEPS = STEP_CONFIGS.CREATE_TRIP;

function CreateTrip() {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const currentStepTitle =
    STEPS.find((step) => step.id === currentStep)?.title || "Create Trip";
  usePageTitle(`${currentStepTitle} - Create Trip`);

  const [place, setPlace] = useState(null);
  const [formData, setFormData] = useState({});
  const hasShownHomeToast = useRef(false);
  const [customBudget, setCustomBudget] = useState("");
  const [flightData, setFlightData] = useState({
    includeFlights: false,
    departureCity: "",
    departureRegion: "",
    departureRegionCode: "",
  });
  const [hotelData, setHotelData] = useState({
    includeHotels: false,
    preferredType: "",
    budgetLevel: 2,
    priceRange: "",
  });
  const [activityPreference, setActivityPreference] = useState(2);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flightLoading, setFlightLoading] = useState(false);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [langGraphLoading, setLangGraphLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const progress = calculateProgress(currentStep, STEPS.length);

  // Check user profile on component mount
  useEffect(() => {
    checkUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync activity preference to formData
  useEffect(() => {
    console.log(
      "🎯 Syncing activityPreference to formData:",
      activityPreference
    );

    setFormData((prev) => ({
      ...prev,
      activityPreference,
    }));
  }, [activityPreference]);

  // Handle searched location from home page
  useEffect(() => {
    const hasLocation = location.state?.searchedLocation;
    const hasCategory = location.state?.selectedCategory;

    if (hasLocation) {
      const searchedLocation = location.state.searchedLocation;
      console.log("🏠 Received searched location from home:", searchedLocation);

      setFormData((prev) => ({
        ...prev,
        location: searchedLocation,
      }));

      setPlace({
        label: searchedLocation,
        value: {
          description: searchedLocation,
          place_id: `search_${Date.now()}`,
          structured_formatting: {
            main_text: searchedLocation,
            secondary_text: "",
          },
        },
      });
    }

    if (hasCategory) {
      const categoryData = {
        type: location.state.selectedCategory,
        name: location.state.categoryName,
        activities: location.state.categoryActivities,
        keywords: location.state.categoryKeywords,
        focus: location.state.categoryFocus,
      };

      console.log("🏠 Received selected category from home:", categoryData);

      setFormData((prev) => ({
        ...prev,
        selectedCategory: categoryData.type,
        categoryName: categoryData.name,
        categoryActivities: categoryData.activities,
        categoryKeywords: categoryData.keywords,
        categoryFocus: categoryData.focus,
      }));
    }

    if ((hasLocation || hasCategory) && !hasShownHomeToast.current) {
      const searchedLocation = location.state?.searchedLocation;
      const categoryName = location.state?.categoryName;
      const categoryKeywords = location.state?.categoryKeywords;

      if (hasLocation && hasCategory) {
        toast.success(
          `Perfect! Planning your ${categoryName} trip to ${searchedLocation}`,
          {
            description: `We'll focus on ${
              categoryKeywords?.split(",")[0] || "amazing experiences"
            }`,
          }
        );
      } else if (hasCategory) {
        toast.success(`Perfect! Let's plan your ${categoryName} trip`, {
          description: `We'll focus on ${
            categoryKeywords?.split(",")[0] || "relevant activities"
          }`,
        });
      } else {
        toast.success(
          `Great choice! Planning your trip to ${searchedLocation}`
        );
      }

      hasShownHomeToast.current = true;
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Sync place state with formData.location
  useEffect(() => {
    if (place) {
      const locationValue = place.label || place.value?.description;
      if (locationValue && locationValue !== formData.location) {
        console.log("📍 Syncing place to formData:", locationValue);
        setFormData((prev) => ({
          ...prev,
          location: locationValue,
        }));
      }
    }
  }, [place, formData.location]);

  const checkUserProfile = async () => {
    setProfileLoading(true);
    try {
      const profile = await UserProfileService.getCurrentUserProfile();

      if (!profile) {
        console.log("📝 No user profile found, redirecting to profile setup");
        navigate("/user-profile");
        return;
      }

      if (profile.needsCompletion) {
        console.log("🔄 User profile incomplete, redirecting to complete it");
        navigate("/user-profile");
        return;
      }

      console.log("✅ User profile loaded successfully");
      setUserProfile(profile);

      const formDefaults = UserProfileService.getFormDefaults(profile);
      setFormData((prev) => ({
        ...prev,
        ...formDefaults,
      }));

      const autoPopulatedFlightData = UserProfileService.autoPopulateFlightData(
        profile,
        flightData
      );

      if (autoPopulatedFlightData !== flightData) {
        setFlightData(autoPopulatedFlightData);
        console.log("🏠 Auto-populated flight departure from profile");
      }

      const autoPopulatedHotelData = UserProfileService.autoPopulateHotelData(
        profile,
        hotelData
      );

      if (autoPopulatedHotelData !== hotelData) {
        setHotelData(autoPopulatedHotelData);
        console.log("🏨 Auto-populated hotel preferences from profile");
      }
    } catch (error) {
      console.error("❌ Error checking profile:", error);
      toast.error("Profile loading issue", {
        description:
          "We couldn't load your profile information. Please refresh the page or try again.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handlers
  const handleInputChange = useCallback((name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleStartDateChange = useCallback(
    (date) => {
      handleInputChange("startDate", date);
    },
    [handleInputChange]
  );

  const handleEndDateChange = useCallback(
    (date) => {
      handleInputChange("endDate", date);
    },
    [handleInputChange]
  );

  const handleDurationChange = useCallback(
    (duration) => {
      handleInputChange("duration", duration);
    },
    [handleInputChange]
  );

  const handleTravelersChange = useCallback(
    (travelers) => {
      handleInputChange("travelers", travelers);
    },
    [handleInputChange]
  );

  const handleSpecificRequestsChange = useCallback(
    (requests) => {
      handleInputChange("specificRequests", requests);
    },
    [handleInputChange]
  );

  const handleBudgetChange = useCallback(
    (budget) => {
      handleInputChange("budget", budget);
    },
    [handleInputChange]
  );

  const handleFlightDataChange = useCallback((newFlightData) => {
    setFlightData(newFlightData);
  }, []);

  const handleHotelDataChange = useCallback((newHotelData) => {
    setHotelData(newHotelData);
  }, []);

  // Step validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: {
        if (!formData?.location) {
          toast.error("Destination required", {
            description: "Please choose where you'd like to go for your trip.",
          });
          return false;
        }
        if (!formData?.startDate || !formData?.endDate) {
          toast.error("Travel dates needed", {
            description:
              "Please select when you want to start and end your trip.",
          });
          return false;
        }

        const dateValidation = validateTravelDates({
          startDate: formData.startDate,
          endDate: formData.endDate,
          includeFlights: flightData.includeFlights,
          departureCity: flightData.departureCity,
          destination: formData.location,
        });

        if (!dateValidation.isValid) {
          toast.error("Date validation failed", {
            description: dateValidation.errors[0],
          });
          return false;
        }

        if (dateValidation.warnings.length > 0) {
          dateValidation.warnings.forEach((warning) => {
            toast.warning("Travel planning tip", {
              description: warning,
              duration: 6000,
            });
          });
        }
        break;
      }

      case 2:
        if (!formData?.travelers) {
          toast.error("Group size needed", {
            description:
              "Please let us know how many people will be traveling.",
          });
          return false;
        }
        if (!formData?.budget && !customBudget) {
          toast.error("Budget information needed", {
            description:
              "Please select a budget range or enter a custom amount to help plan your trip.",
          });
          return false;
        }
        if (customBudget) {
          const amount = parseInt(customBudget);
          if (isNaN(amount) || amount < 1000) {
            toast.error("Invalid budget amount", {
              description:
                "Please enter a budget of at least ₱1,000 for your trip.",
            });
            return false;
          }
          if (amount > 1000000) {
            toast.error("Budget too high", {
              description: "Please enter a reasonable budget amount.",
            });
            return false;
          }
        }
        break;

      case 3:
        // Activity preference - no validation needed
        break;

      case 4: {
        const flightValidation = validateFlightData(flightData);
        if (!flightValidation.isValid) {
          toast.error("Flight preferences incomplete", {
            description: flightValidation.errors[0],
          });
          return false;
        }
        break;
      }

      case 5: {
        // Debug: Check formData before validation
        console.log("🔍 Step 5 - formData before hotel validation:", {
          travelers: formData.travelers,
          startDate: formData.startDate,
          endDate: formData.endDate,
          fullFormData: formData,
        });

        const hotelValidation = validateHotelData(hotelData, formData);
        if (!hotelValidation.isValid) {
          toast.error("Hotel preferences incomplete", {
            description: hotelValidation.errors[0],
          });
          return false;
        }
        // Show warnings if any
        if (hotelValidation.warnings && hotelValidation.warnings.length > 0) {
          hotelValidation.warnings.forEach((warning) => {
            toast.warning("Hotel Search Notice", {
              description: warning,
            });
          });
        }
        break;
      }

      case 6:
        // Review step - no additional validation needed
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

  // Google Login
  const googleLogin = useGoogleLogin({
    onSuccess: (codeResp) => GetUserProfile(codeResp),
    onError: (error) => console.log(error),
  });

  // Main trip generation function
  const OnGenerateTrip = async () => {
    const user = localStorage.getItem("user");

    if (!user) {
      setOpenDialog(true);
      return;
    }

    if (!userProfile) {
      toast.info("Profile setup needed", {
        description:
          "We need to know your preferences to create the perfect trip for you.",
      });
      navigate("/user-profile");
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);

    let langGraphResults = null;
    let flightResults = null;
    let hotelResults = null;

    try {
      const flightValidation = validateFlightData(flightData);
      const hotelValidation = validateHotelData(hotelData, formData); // ✅ Pass formData here!
      const activeServices = getActiveServices(flightData, hotelData);

      if (!flightValidation.isValid) {
        toast.error("Flight Preferences Incomplete", {
          description: flightValidation.errors.join(", "),
        });
        setLoading(false);
        return;
      }

      if (!hotelValidation.isValid) {
        toast.error("Hotel Preferences Incomplete", {
          description: hotelValidation.errors.join(", "),
        });
        setLoading(false);
        return;
      }

      setLangGraphLoading(true);

      if (activeServices.hasAnyAgent) {
        console.log("🤖 Starting LangGraph with flights/hotels search...");
      } else {
        console.log(
          "🤖 Starting LangGraph GA-First itinerary generation (no flights/hotels)..."
        );
      }

      const travelDates = calculateTravelDates({
        startDate: formData.startDate,
        endDate: formData.endDate,
        includeFlights: flightData.includeFlights,
        departureCity: flightData.departureCity,
        destination: formData.location,
        travelers: formData.travelers,
      });

      console.log("📅 Smart travel dates calculated:", travelDates);
      console.log("💡 Date explanation:", getDateExplanation(travelDates));

      const langGraphAgent = new LangGraphTravelAgent();

      const tripParams = {
        destination: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: formData.duration,
        travelers: formData.travelers,
        budget: customBudget ? `Custom: ₱${customBudget}` : formData.budget,
        flightData: {
          ...flightData,
          searchDepartureDate: travelDates.flightDepartureDate,
          searchReturnDate: travelDates.flightReturnDate,
        },
        hotelData: {
          ...hotelData,
          checkInDate: travelDates.hotelCheckInDate,
          checkOutDate: travelDates.hotelCheckOutDate,
        },
        travelDates: travelDates,
        userProfile: userProfile,
      };

      langGraphResults = await langGraphAgent.orchestrateTrip(tripParams);

      flightResults = langGraphResults.flights;
      hotelResults = langGraphResults.hotels;

      if (flightResults?.success) {
        console.log(
          "✈️ Flight search completed:",
          flightResults.fallback ? "recommendations" : "live data"
        );
      }

      if (hotelResults?.success) {
        console.log(
          "🏨 Hotel search completed:",
          hotelResults.fallback ? "recommendations" : "live data"
        );
      }

      if (langGraphResults.optimized_plan) {
        console.log(
          "🤖 LangGraph optimization completed with score:",
          langGraphResults.optimized_plan.optimization_score
        );
      }

      setLangGraphLoading(false);

      // 🚀 OPTIMIZED PROMPT SYSTEM
      console.log("🎯 Building optimized prompt with reduced token usage...");

      let combinedRequests = formData?.specificRequests || "";

      if (formData.categoryFocus && formData.categoryName) {
        const categoryInstructions = {
          Adventure:
            "70%+ outdoor/adventure activities, hiking, extreme sports",
          Beach: "70%+ coastal/island activities, water sports, beach resorts",
          Cultural:
            "70%+ historical sites, museums, heritage tours, local traditions",
          "Food Trip":
            "70%+ food experiences, local restaurants, cooking classes, food markets",
        };

        combinedRequests += `\n🎯 ${formData.categoryName?.toUpperCase()} FOCUSED TRIP: ${
          categoryInstructions[formData.categoryName] ||
          "Category-specific activities"
        }`;
      }

      const enhancedPrompt = buildOptimizedPrompt({
        location: formData?.location,
        duration: `${formData?.duration} days`,
        travelers:
          typeof formData?.travelers === "number"
            ? `${formData.travelers} ${
                formData.travelers === 1 ? "Person" : "People"
              }`
            : formData?.travelers,
        budget: customBudget ? `Custom: ₱${customBudget}` : formData?.budget,
        activityPreference: formData?.activityPreference || "2",
        userProfile: userProfile,
        dateInfo: travelDates,
        flightRecommendations: shouldIncludeFlights(flightData)
          ? flightResults
          : null,
        hotelRecommendations: shouldIncludeHotels(hotelData)
          ? hotelResults
          : null,
        specialRequests: combinedRequests || "None",
        customBudget,
        flightData,
        hotelData,
        langGraphResults,
      });

      console.log(
        "📝 Optimized prompt generated:",
        enhancedPrompt.length,
        "characters"
      );
      console.log("📊 Estimated tokens:", Math.ceil(enhancedPrompt.length / 4));

      // AI Generation with Retry Logic
      let aiResponseText = null;
      let lastError = null;

      for (
        let attempt = 1;
        attempt <= VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS;
        attempt++
      ) {
        try {
          console.log(
            `🔄 AI Generation Attempt ${attempt}/${VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS}`
          );

          const result = await chatSession.sendMessage(enhancedPrompt);
          const rawResponse = result?.response.text();

          console.log(
            `🎉 AI Raw Response (Attempt ${attempt}):`,
            rawResponse?.substring(0, 200) + "..."
          );

          const cleanedResponse = sanitizeJSONString(rawResponse);

          if (!cleanedResponse) {
            throw new Error("Failed to extract valid JSON from AI response");
          }

          const testParse = safeJsonParse(cleanedResponse);
          const validationError = validateAIResponse(testParse);

          if (validationError) {
            throw new Error(validationError);
          }

          aiResponseText = cleanedResponse;
          console.log(`✅ AI Generation successful on attempt ${attempt}`);
          break;
        } catch (error) {
          console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
          lastError = error;

          if (attempt < VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS) {
            console.log("🔄 Retrying with enhanced prompt...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (!aiResponseText) {
        throw new Error(
          `AI generation failed after ${VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message}`
        );
      }

      console.log(
        "🧹 Final cleaned Response:",
        aiResponseText?.substring(0, 200) + "..."
      );

      SaveAiTrip(aiResponseText, flightResults, hotelResults, langGraphResults);
    } catch (error) {
      console.error("❌ Trip generation error:", error);
      toast.error("Unable to create your trip", {
        description:
          "Something went wrong while generating your itinerary. Please try again or contact support if the issue persists.",
      });
      setLoading(false);
      setFlightLoading(false);
      setHotelLoading(false);
      setLangGraphLoading(false);
    }
  };

  // Function to sanitize data for Firebase
  const sanitizeForFirebase = (obj) => {
    if (obj === null || obj === undefined) return null;

    if (Array.isArray(obj)) {
      return obj
        .map((item) => sanitizeForFirebase(item))
        .filter((item) => item !== null);
    }

    if (typeof obj === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedValue = sanitizeForFirebase(value);

        if (sanitizedValue !== null) {
          if (Array.isArray(value)) {
            if (key === "plan" && value.length > 0) {
              sanitized[`${key}Text`] = value
                .map(
                  (item) =>
                    `${item?.time || ""} - ${item?.placeName || ""} - ${
                      item?.placeDetails || ""
                    } (${item?.ticketPricing || ""}, ${
                      item?.timeTravel || ""
                    }, Rating: ${item?.rating || "N/A"})`
                )
                .join(" | ");
            } else if (key === "flights" && value.length > 0) {
              sanitized[key] = value
                .map((flight) => sanitizeForFirebase(flight))
                .filter((item) => item !== null);
            } else if (value.length > 0) {
              sanitized[key] = value
                .map((item) =>
                  typeof item === "object" && item !== null
                    ? JSON.stringify(sanitizeForFirebase(item))
                    : String(item || "")
                )
                .filter((item) => item && item !== "undefined")
                .join(", ");
            }
          } else {
            sanitized[key] = sanitizedValue;
          }
        }
      }
      return Object.keys(sanitized).length > 0 ? sanitized : null;
    }

    return obj;
  };

  const SaveAiTrip = async (
    TripData,
    flightResults = null,
    hotelResults = null,
    langGraphResults = null
  ) => {
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const docId = Date.now().toString();

      const activeServices = getActiveServices(flightData, hotelData);

      const cleanLangGraphResults = langGraphResults
        ? {
            ...langGraphResults,
            merged_data: langGraphResults.merged_data
              ? {
                  ...langGraphResults.merged_data,
                  recommended_flight:
                    langGraphResults.merged_data.recommended_flight || null,
                  recommended_hotel:
                    langGraphResults.merged_data.recommended_hotel || null,
                  total_estimated_cost:
                    langGraphResults.merged_data.total_estimated_cost || 0,
                }
              : null,
            optimized_plan: langGraphResults.optimized_plan
              ? {
                  ...langGraphResults.optimized_plan,
                  optimization_score:
                    langGraphResults.optimized_plan.optimization_score || 0,
                  cost_efficiency:
                    langGraphResults.optimized_plan.cost_efficiency ||
                    "Unknown",
                  final_recommendations:
                    langGraphResults.optimized_plan.final_recommendations || [],
                }
              : null,
          }
        : null;

      let parsedTripData;
      try {
        parsedTripData = JSON.parse(TripData);
      } catch (e) {
        console.error("Initial parse failed, attempting to clean JSON:", e);

        // JSON cleanup and fallback logic here...
        parsedTripData = {
          tripName: `Trip to ${formData.location}`,
          destination: formData.location,
          duration: `${formData.duration} days`,
          budget: formData.budget || `₱${customBudget}`,
          travelers: formData.travelers,
          startDate: formData.startDate,
          endDate: formData.endDate,
          currency: "PHP",
          parseError: true,
        };

        toast.warning(
          "AI response had formatting issues. Created basic itinerary - please try generating again for better results."
        );
      }

      if (!parsedTripData || typeof parsedTripData !== "object") {
        throw new Error("Parsed data is not a valid object");
      }

      // 🔧 AUTO-FIX: Ensure activity counts meet constraints before validation
      console.log("🔧 Running auto-fix on itinerary...");
      console.log("📦 Trip data structure:", {
        hasItinerary: !!parsedTripData?.itinerary,
        days: parsedTripData?.itinerary?.length || 0,
        firstDayPlan: parsedTripData?.itinerary?.[0]?.plan?.length || 0,
      });

      try {
        const originalData = JSON.stringify(parsedTripData);
        parsedTripData = autoFixItinerary(parsedTripData, formData);
        const wasModified = originalData !== JSON.stringify(parsedTripData);

        if (wasModified) {
          console.log(
            "✅ Auto-fix completed successfully - Itinerary was modified"
          );
          toast.info("Itinerary Optimized", {
            description: "Activity counts adjusted to match your preferences.",
            duration: 3000,
          });
        } else {
          console.log(
            "✅ Auto-fix completed successfully - No modifications needed"
          );
        }
      } catch (autoFixError) {
        console.error("❌ Auto-fix failed:", autoFixError);
        console.error("Stack trace:", autoFixError.stack);
        toast.error("Auto-fix Error", {
          description:
            "Failed to auto-correct itinerary. Proceeding with validation.",
        });
      }

      // Location validation
      console.log("🔍 Validating location consistency...");
      const { validateTripLocations, getValidationSummary } = await import(
        "../utils/locationValidator"
      );
      const locationValidation = validateTripLocations(
        parsedTripData,
        formData.location
      );

      console.log("📍 Location Validation Results:", locationValidation);
      console.log(getValidationSummary(locationValidation));

      if (locationValidation.suspiciousPlaces.length > 0) {
        console.warn(
          `⚠️ Found ${locationValidation.suspiciousPlaces.length} places that may not be in ${formData.location}:`,
          locationValidation.suspiciousPlaces
        );

        if (locationValidation.errors.length > 0) {
          toast.warning("Location Verification", {
            description: `Some places in the itinerary may not be in ${formData.location}. Please review the trip details.`,
            duration: 5000,
          });
        }
      } else {
        console.log(`✅ All places validated for ${formData.location}`);
      }

      // Itinerary validation
      console.log("🏨 Validating itinerary structure...");
      const itineraryValidation = validateItinerary(parsedTripData, formData);

      // Activity count validation
      console.log("🏃 Validating activity count per day...");
      const activityValidation = validateActivityCount(
        parsedTripData,
        formData
      );

      console.log("📋 Itinerary Validation Results:", itineraryValidation);
      console.log("🏃 Activity Count Validation Results:", activityValidation);

      if (
        !itineraryValidation.isValid &&
        itineraryValidation.errors.length > 0
      ) {
        console.error(
          "❌ Itinerary validation failed:",
          itineraryValidation.errors
        );

        const errorMessages = itineraryValidation.errors
          .map((err) => err.message)
          .join("\n");
        const suggestion = getValidationSuggestion(itineraryValidation);

        toast.error("Itinerary Validation Failed", {
          description: `The generated itinerary has critical issues:\n${errorMessages}\n\n${suggestion}`,
          duration: 10000,
        });

        setLoading(false);
        return;
      }

      if (!activityValidation.isValid && activityValidation.errors.length > 0) {
        console.error(
          "❌ Activity count validation failed:",
          activityValidation.errors
        );

        const errorMessages = activityValidation.errors
          .map((err) => (typeof err === "string" ? err : err.message))
          .join("\n");

        toast.error("Activity Pace Validation Failed", {
          description: `The itinerary doesn't match your selected activity pace (${activityValidation.activityPreference} activities/day):\n${errorMessages}\n\nPlease try generating again.`,
          duration: 10000,
        });

        setLoading(false);
        return;
      }

      if (itineraryValidation.warnings.length > 0) {
        console.warn(
          "⚠️ Itinerary has warnings:",
          itineraryValidation.warnings
        );

        const warningMessages = itineraryValidation.warnings
          .slice(0, 3)
          .map((warn) => warn.message)
          .join("\n");

        toast.warning("Itinerary Review Recommended", {
          description: `Please review these items:\n${warningMessages}`,
          duration: 7000,
        });
      } else {
        console.log("✅ Itinerary structure validated successfully");
      }

      const tripDocument = {
        userSelection: {
          ...formData,
          customBudget: customBudget,
        },
        flightPreferences: flightData,
        hotelPreferences: hotelData,
        tripPreferences: sanitizeTripPreferences(flightData, hotelData),
        langGraphResults: cleanLangGraphResults,
        userProfile: userProfile,
        tripData: parsedTripData,
        realFlightData: flightResults || null,
        realHotelData: hotelResults || null,
        userEmail: user?.email,
        id: docId,
        createdAt: new Date().toISOString(),
        hasRealFlights: flightResults?.success || false,
        hasRealHotels: hotelResults?.success || false,
        flightSearchRequested: shouldIncludeFlights(flightData),
        hotelSearchRequested: shouldIncludeHotels(hotelData),
        langGraphUsed: activeServices.hasAnyAgent,
        isPersonalized: true,
      };

      const sanitizedTripDocument = sanitizeForFirebase(tripDocument);

      console.log("📋 Saving sanitized trip document:", sanitizedTripDocument);

      await setDoc(doc(db, "AITrips", docId), sanitizedTripDocument);

      toast.success("🎉 Your Amazing Trip is Ready!", {
        description: `Your personalized itinerary for ${formData.location} has been created and saved. Get ready for an incredible adventure!`,
        duration: 6000,
      });
      navigate("/view-trip/" + docId);
    } catch (error) {
      console.error("Error saving trip: ", error);
      toast.error("Oops! Something went wrong", {
        description:
          "We couldn't save your trip right now. Please try again in a moment.",
      });
    }
    setLoading(false);
  };

  const GetUserProfile = (tokenInfo) => {
    axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo?.access_token}`,
            Accept: "Application/json",
          },
        }
      )
      .then((resp) => {
        console.log(resp);
        localStorage.setItem("user", JSON.stringify(resp.data));
        setOpenDialog(false);
        OnGenerateTrip();
      })
      .catch((error) => {
        console.error("Error fetching user profile:", error);
        toast.error("Sign-in issue", {
          description: "We couldn't complete your sign-in. Please try again.",
        });
      });
  };

  useEffect(() => {
    console.log(formData);
  }, [formData]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <LocationSelector
              place={place}
              onPlaceChange={setPlace}
              isPreFilled={!!place}
            />
            <DateRangePicker
              startDate={formData.startDate}
              endDate={formData.endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onDurationChange={handleDurationChange}
              flightData={flightData}
              destination={formData.location}
            />
            <SpecificRequests
              value={formData?.specificRequests}
              onChange={handleSpecificRequestsChange}
              formData={formData}
              userProfile={userProfile}
              flightData={flightData}
              hotelData={hotelData}
              customBudget={customBudget}
              startDate={formData?.startDate}
              endDate={formData?.endDate}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <TravelerSelector
              selectedTravelers={formData?.travelers}
              onTravelersChange={handleTravelersChange}
            />
            <BudgetSelector
              value={formData?.budget}
              customValue={customBudget}
              onBudgetChange={handleBudgetChange}
              onCustomBudgetChange={setCustomBudget}
              error={null}
              formData={formData}
              flightData={flightData}
              userProfile={userProfile}
            />
          </div>
        );
      case 3:
        return (
          <ActivityPreferenceSelector
            activityPreference={activityPreference}
            onActivityPreferenceChange={setActivityPreference}
            formData={formData}
            userProfile={userProfile}
          />
        );
      case 4:
        return (
          <FlightPreferences
            flightData={flightData}
            onFlightDataChange={handleFlightDataChange}
            userProfile={userProfile}
            formData={formData}
          />
        );
      case 5:
        return (
          <HotelPreferences
            hotelData={hotelData}
            onHotelDataChange={handleHotelDataChange}
            formData={formData}
            userProfile={userProfile}
          />
        );
      case 6:
        return (
          <ReviewTripStep
            formData={formData}
            customBudget={customBudget}
            flightData={flightData}
            hotelData={hotelData}
            userProfile={userProfile}
            place={place}
          />
        );
      default:
        return (
          <LocationSelector
            place={place}
            onPlaceChange={setPlace}
            isPreFilled={!!place}
          />
        );
    }
  };

  if (profileLoading) {
    return <ProfileLoading />;
  }

  if (!userProfile) {
    return (
      <ErrorState
        error={MESSAGES.ERROR.PROFILE_REQUIRED}
        onRetry={() => navigate("/user-profile")}
        onCreateNew={() => navigate("/")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Create Your Perfect Trip
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Plan personalized travel experiences tailored just for you
            </p>
          </div>

          {/* User Profile Summary */}
          {userProfile &&
            (() => {
              const profileSummary =
                UserProfileService.getProfileDisplaySummary(userProfile);
              return (
                <div className="mt-6 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-sky-100 dark:bg-sky-900/50 p-3 rounded-full">
                        <FaUser className="text-sky-600 dark:text-sky-400 text-lg" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sky-900 dark:text-sky-200 text-lg">
                          Welcome back, {profileSummary.name}!
                        </h3>
                        <p className="text-sky-700 dark:text-sky-400 text-sm font-medium mt-1">
                          Creating personalized trips based on your preferences:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profileSummary.preferredTripTypes
                            ?.slice(0, 2)
                            .map((typeLabel, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300"
                              >
                                {typeLabel}
                              </span>
                            ))}
                          {profileSummary.preferredTripTypes?.length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              +{profileSummary.preferredTripTypes.length - 2}{" "}
                              more
                            </span>
                          )}
                        </div>
                        {profileSummary.travelStyle && (
                          <p className="text-sky-600 dark:text-sky-400 text-xs mt-2">
                            <span className="font-medium">Travel Style:</span>{" "}
                            {profileSummary.travelStyle}
                          </p>
                        )}
                        {profileSummary.hasLocationData && (
                          <p className="text-sky-600 dark:text-sky-400 text-xs mt-1">
                            <span className="font-medium">📍 Home:</span>{" "}
                            {profileSummary.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 lg:p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            {/* Step Circles - Responsive Layout */}
            <div className="flex items-center justify-between mb-6">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 transition-all ${
                        isCompleted
                          ? "bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white"
                          : isActive
                          ? "bg-sky-600 dark:bg-sky-500 border-sky-600 dark:border-sky-500 text-white"
                          : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <FaCheck className="text-[10px] sm:text-xs md:text-sm" />
                      ) : (
                        <Icon className="text-[10px] sm:text-xs md:text-sm" />
                      )}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`w-4 sm:w-8 md:w-12 lg:w-16 h-0.5 mx-1 sm:mx-2 md:mx-3 transition-all ${
                          isCompleted
                            ? "bg-green-500 dark:bg-green-600"
                            : "bg-gray-300 dark:bg-slate-600"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Title and Description */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {STEPS[currentStep - 1].description}
              </p>
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="w-full h-3 mb-2" />
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep} of {STEPS.length}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-12">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-8 py-3 cursor-pointer border-sky-200 dark:border-sky-700 text-gray-700 dark:text-gray-200 hover:bg-sky-50 dark:hover:bg-sky-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowLeft />
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStep < STEPS.length ? (
                <Button
                  onClick={nextStep}
                  className="brand-button cursor-pointer flex items-center gap-2 px-8 py-3"
                >
                  Next
                  <FaArrowRight />
                </Button>
              ) : (
                <GenerateTripButton
                  loading={loading}
                  flightLoading={flightLoading}
                  hotelLoading={hotelLoading}
                  langGraphLoading={langGraphLoading}
                  onClick={OnGenerateTrip}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginDialog open={openDialog} onGoogleLogin={() => googleLogin()} />

      {/* Trip Generation Modal */}
      <TripGenerationModal
        isOpen={loading || flightLoading || hotelLoading || langGraphLoading}
        loading={loading}
        flightLoading={flightLoading}
        hotelLoading={hotelLoading}
        langGraphLoading={langGraphLoading}
        destination={formData?.location}
        duration={formData?.duration}
        includeFlights={flightData.includeFlights}
        includeHotels={hotelData.includeHotels}
      />
    </div>
  );
}

export default CreateTrip;
