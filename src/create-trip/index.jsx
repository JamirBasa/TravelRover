// src/create-trip/index.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { chatSession } from "../config/aimodel";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { doc, setDoc } from "firebase/firestore";
import { correctItineraryTravelTimes } from "../utils/itineraryTravelTimeCorrector";
import { db } from "../config/firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import {
  STEP_CONFIGS,
  MESSAGES,
  VALIDATION_RULES,
  calculateProgress,
  validateAIResponse,
  BUDGET_RETRY_STRATEGY,
} from "../constants/options";
import { buildOptimizedPrompt } from "../constants/optimizedPrompt";
import { TRIP_DURATION } from "../constants/tripDurationLimits";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { safeJsonParse, sanitizeJSONString } from "../utils/jsonParsers";
import {
  validateItinerary,
  validateActivityCount,
  getValidationSuggestion,
} from "../utils/itineraryValidator";
import { autoFixItinerary } from "../utils/itineraryAutoFix";
import {
  classifyActivities,
  getActivityConstraints,
} from "../utils/activityClassifier";
import { validateHotelData } from "../utils/hotelValidation";
import {
  formatTravelersDisplay,
  validateTravelers,
  getTravelersCount,
} from "../utils/travelersParsers";
import {
  validateHotelItineraryConsistency,
  autoFixHotelItineraryConsistency,
  reportHotelItineraryValidation,
} from "../utils/hotelItineraryValidator";
import {
  calculateBudgetAmount,
  validateBudgetCompliance,
  detectUnrealisticPricing,
} from "../utils/budgetCompliance";
import { getBudgetRecommendations } from "../utils/budgetEstimator";
import { FaArrowRight, FaArrowLeft, FaUser, FaCheck } from "react-icons/fa";

// Import components
import LocationSelector from "./components/LocationSelector";
import DateRangePicker from "./components/DateRangePicker";
import BudgetSelector from "./components/BudgetSelector";
import TravelerSelector from "./components/TravelerSelector";
import SpecificRequests from "./components/SpecificRequests";
import TravelServicesSelector from "./components/TravelServicesSelector"; // ✅ Combined services step
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
import {
  saveDraft,
  loadDraft,
  clearDraft,
  formatDraftAge,
} from "../utils/formPersistence";
import {
  validateFirebaseDocSize,
  safeFirebaseSave,
} from "../utils/firebaseSizeValidator";
import { deduplicateTripGeneration } from "../utils/requestDeduplicator";

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

  // ✅ NEW: Track transport mode analysis for modal display
  const [transportModeResult, setTransportModeResult] = useState(null);
  const [transportAnalysisComplete, setTransportAnalysisComplete] =
    useState(false);

  // 🆕 OPTIMIZATION: Track validation progress for better UX
  const [validationPhase, setValidationPhase] = useState(null); // 'parsing', 'autofix', 'validation', 'saving'
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const progress = calculateProgress(currentStep, STEPS.length);

  // ✅ NEW: Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && !location.state?.searchedLocation) {
      // Only restore draft if user didn't come from home with a search
      toast.info("Draft Restored", {
        description: `Continuing from ${formatDraftAge()}`,
        duration: 5000,
        action: {
          label: "Start Fresh",
          onClick: () => {
            clearDraft();
            window.location.reload();
          },
        },
      });

      // Restore form state
      if (draft.formData) setFormData(draft.formData);
      if (draft.flightData) setFlightData(draft.flightData);
      if (draft.hotelData) setHotelData(draft.hotelData);
      if (draft.activityPreference)
        setActivityPreference(draft.activityPreference);
      if (draft.customBudget) setCustomBudget(draft.customBudget);
      if (draft.currentStep) setCurrentStep(draft.currentStep);
    }
  }, [location.state]);

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

  // ✅ NEW: Auto-save draft every 30 seconds
  useEffect(() => {
    if (currentStep <= 1) return; // Don't save empty form

    const autoSaveTimer = setInterval(() => {
      saveDraft({
        formData,
        flightData,
        hotelData,
        activityPreference,
        customBudget,
        currentStep,
      });
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [
    formData,
    flightData,
    hotelData,
    activityPreference,
    customBudget,
    currentStep,
  ]);

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
        recommendedDestinations: location.state.recommendedDestinations, // ✅ NEW
      };

      console.log("🏠 Received selected category from home:", categoryData);

      // ✅ Store category data for AI prompt enhancement
      setFormData((prev) => ({
        ...prev,
        selectedCategory: categoryData.type,
        categoryName: categoryData.name,
        categoryActivities: categoryData.activities,
        categoryKeywords: categoryData.keywords,
        categoryFocus: categoryData.focus,
        recommendedDestinations: categoryData.recommendedDestinations, // ✅ NEW
        // ✅ Pre-populate specific requests with category focus
        specificRequests:
          prev.specificRequests ||
          `I'm interested in a ${categoryData.name.toLowerCase()} trip. Please focus on ${categoryData.keywords
            .split(",")[0]
            .trim()}.`,
      }));

      // ✅ NOTE: Toast will be shown below in consolidated notification section
    }

    if ((hasLocation || hasCategory) && !hasShownHomeToast.current) {
      const searchedLocation = location.state?.searchedLocation;
      const categoryName = location.state?.categoryName;
      const categoryKeywords = location.state?.categoryKeywords;
      const recommendedDestinations = location.state?.recommendedDestinations;

      if (hasLocation && hasCategory) {
        // Both location and category selected
        toast.success(
          `Perfect! Planning your ${categoryName} trip to ${searchedLocation}`,
          {
            description: `We'll focus on ${
              categoryKeywords?.split(",")[0] || "amazing experiences"
            }`,
            duration: 6000,
          }
        );
      } else if (hasCategory) {
        // Only category selected - show destinations
        const destList = recommendedDestinations
          ?.slice(0, 3)
          .map((d) => d.city)
          .join(", ");

        toast.success(`${categoryName} Adventure Awaits!`, {
          description: destList
            ? `Top picks: ${destList}`
            : `Let's plan your perfect ${categoryName.toLowerCase()} trip!`,
          duration: 8000,
        });
      } else {
        // Only location selected
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

  // ❌ REMOVED: Service change monitoring (no longer needed with new step order)
  // Budget is now set AFTER services are configured in Step 4, so no reactive updates needed

  // ✅ NEW: Track service changes and warn about budget implications
  const budgetWarningShownRef = useRef(false);
  const previousServicesRef = useRef({
    flights: flightData.includeFlights,
    hotels: hotelData.includeHotels,
  });

  // ✅ NEW: Monitor service changes and validate custom budget
  useEffect(() => {
    // Only validate if we have a custom budget and we're past step 5 (budget step)
    if (!customBudget || currentStep <= 5) {
      budgetWarningShownRef.current = false;
      return;
    }

    const currentServices = {
      flights: flightData.includeFlights,
      hotels: hotelData.includeHotels,
    };

    // Check if services have changed
    const servicesChanged =
      currentServices.flights !== previousServicesRef.current.flights ||
      currentServices.hotels !== previousServicesRef.current.hotels;

    if (servicesChanged) {
      console.log("🔄 Service configuration changed:", {
        previous: previousServicesRef.current,
        current: currentServices,
        customBudget,
      });

      // Update reference
      previousServicesRef.current = currentServices;

      // Recalculate minimum budget with new services
      if (formData.location && formData.duration) {
        try {
          // ✅ travelers is now guaranteed to be integer from getFormDefaults()
          const travelerCount = formData.travelers || 1;

          const budgetEstimates = getBudgetRecommendations({
            destination: formData.location,
            departureLocation:
              flightData.departureCity || "Manila, Philippines",
            duration: formData.duration,
            travelers: travelerCount,
            includeFlights: flightData.includeFlights || false,
            transportAnalysis: flightData.transportAnalysis || null, // ✅ NEW: Pass transport mode analysis
            startDate: formData.startDate,
          });

          if (budgetEstimates) {
            const budgetTier =
              budgetEstimates["budget-friendly"] ||
              budgetEstimates["budget"] ||
              budgetEstimates["budgetfriendly"];

            if (budgetTier?.range) {
              const recommendedBudget = parseInt(
                budgetTier.range.replace(/[^0-9]/g, "")
              );

              // ✅ FIXED: Use SAME minimum calculation as BudgetSelector
              // Matches BudgetSelector.jsx lines 80-132
              const travelers = formData.travelers || 1;
              const duration = formData.duration || 3;

              const getMinPerPersonPerDay = (travelerCount) => {
                if (travelerCount >= 11) return 600;
                if (travelerCount >= 6) return 700;
                if (travelerCount >= 3) return 800;
                return 1000;
              };

              const minPerPersonPerDay = getMinPerPersonPerDay(travelers);
              const tieredMinimum = minPerPersonPerDay * duration * travelers;
              const budgetTier90Percent = Math.floor(recommendedBudget * 0.9);

              // Use the LOWER value (more lenient)
              const absoluteMinimum = Math.min(
                tieredMinimum,
                budgetTier90Percent
              );

              const customBudgetAmount = parseInt(customBudget);

              console.log("💰 Budget revalidation after service change:", {
                customBudgetAmount,
                absoluteMinimum,
                tieredMinimum,
                budgetTier90Percent,
                calculation: "Min of (tiered OR 90%) - matches BudgetSelector",
                servicesAdded: Object.entries(currentServices)
                  .filter(([, enabled]) => enabled)
                  .map(([service]) => service),
                isValid: customBudgetAmount >= absoluteMinimum,
              });

              // ✅ NEW: Show warning if budget is now insufficient
              if (
                customBudgetAmount < absoluteMinimum &&
                !budgetWarningShownRef.current
              ) {
                budgetWarningShownRef.current = true;

                const servicesAdded = [];
                if (
                  currentServices.flights &&
                  !previousServicesRef.current.flights
                )
                  servicesAdded.push("flights");
                if (
                  currentServices.hotels &&
                  !previousServicesRef.current.hotels
                )
                  servicesAdded.push("hotels");

                const serviceText =
                  servicesAdded.length > 0
                    ? ` after adding ${servicesAdded.join(" and ")}`
                    : "";

                toast.warning("Budget Update Required", {
                  description: `Your custom budget (₱${customBudgetAmount.toLocaleString()}) is now below the minimum (₱${absoluteMinimum.toLocaleString()})${serviceText}. Please return to Step 5 to adjust your budget.`,
                  duration: 8000,
                  action: {
                    label: "Go to Budget",
                    onClick: () => setCurrentStep(5),
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error("❌ Budget revalidation error:", error);
        }
      }
    }
  }, [
    flightData.includeFlights,
    flightData.transportAnalysis, // ✅ NEW: Added to dependency array
    hotelData.includeHotels,
    customBudget,
    currentStep,
    formData.location,
    formData.duration,
    formData.travelers,
    formData.startDate,
    flightData.departureCity,
  ]);

  const checkUserProfile = async () => {
    setProfileLoading(true);
    try {
      const profile = await UserProfileService.getCurrentUserProfile();

      if (!profile) {
        console.log("📝 No user profile found, redirecting to profile setup");
        navigate("/set-profile");
        return;
      }

      if (profile.needsCompletion) {
        console.log("🔄 User profile incomplete, redirecting to complete it");
        navigate("/set-profile");
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
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // ✅ CRITICAL: Always store travelers as INTEGER
      if (name === "travelers") {
        // If value is already an integer (from TravelerSelector), use it
        if (typeof value === "number") {
          updated.travelers = value;
        } else {
          // If string or object, extract count
          updated.travelers = getTravelersCount(value);
        }

        console.log(
          "✅ Travelers stored as:",
          updated.travelers,
          typeof updated.travelers
        );
      }

      return updated;
    });
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

        // ✅ NEW: Validate trip duration limits (1-7 days) - Block navigation
        console.log("🔍 Duration Validation Check:", {
          duration: formData?.duration,
          type: typeof formData?.duration,
          MIN_DAYS: TRIP_DURATION.MIN,
          MAX_DAYS: TRIP_DURATION.MAX,
          startDate: formData?.startDate,
          endDate: formData?.endDate,
        });

        if (!formData?.duration || formData.duration <= 0) {
          console.log("❌ BLOCKING: Duration is 0 or undefined");
          toast.error("Invalid Trip Duration", {
            description:
              "Please select valid travel dates to calculate trip duration.",
            duration: 5000,
          });
          return false;
        }

        if (formData.duration < TRIP_DURATION.MIN) {
          console.log("❌ BLOCKING: Duration too short:", formData.duration);
          toast.error("Trip Too Short", {
            description: `Trip must be at least ${TRIP_DURATION.MIN} day. Please adjust your dates.`,
            duration: 6000,
          });
          return false;
        }

        if (formData.duration > TRIP_DURATION.MAX) {
          console.log("❌ BLOCKING: Duration too long:", formData.duration);
          toast.error("Trip Duration Exceeds Limit", {
            description: `Maximum trip duration is ${TRIP_DURATION.MAX} days. Please shorten your trip or consider breaking it into multiple ${TRIP_DURATION.MAX}-day segments.`,
            duration: 8000,
          });
          return false;
        }

        console.log(
          "✅ Duration validation PASSED:",
          formData.duration,
          "days"
        );

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

      case 2: {
        // Step 2: Group Size (Travelers only)
        const travelersValidation = validateTravelers(formData?.travelers);
        if (!travelersValidation.isValid) {
          toast.error("Group size needed", {
            description:
              travelersValidation.error ||
              "Please let us know how many people will be traveling.",
          });
          return false;
        }
        break;
      }

      case 3:
        // Step 3: Activity preference - no validation needed
        break;

      case 4: {
        // Step 4: Travel Services (Flights + Hotels)
        // Validate flights if enabled
        const flightValidation = validateFlightData(flightData);
        if (!flightValidation.isValid) {
          toast.error("Flight preferences incomplete", {
            description: flightValidation.errors[0],
          });
          return false;
        }

        // Validate hotels if enabled
        const hotelValidation = validateHotelData(hotelData, formData);
        if (!hotelValidation.isValid) {
          toast.error("Hotel preferences incomplete", {
            description: hotelValidation.errors[0],
          });
          return false;
        }

        // Show hotel warnings if any
        if (hotelValidation.warnings && hotelValidation.warnings.length > 0) {
          hotelValidation.warnings.forEach((warning) => {
            toast.warning("Hotel Search Notice", {
              description: warning,
            });
          });
        }
        break;
      }

      case 5: {
        // Step 5: Budget (NOW comes after services are selected!)
        // ✅ Budget validation with FULL context of services
        console.log("💰 Step 5 (Budget) Validation - Current State:", {
          customBudget,
          formDataBudget: formData?.budget,
          location: formData?.location,
          duration: formData?.duration,
          travelers: formData?.travelers,
          includeFlights: flightData.includeFlights,
          includeHotels: hotelData.includeHotels,
        });

        const hasCustomBudget = customBudget && customBudget.trim() !== "";
        const customBudgetAmount = hasCustomBudget ? parseInt(customBudget) : 0;

        if (!formData?.budget && !hasCustomBudget) {
          toast.error("Budget information needed", {
            description:
              "Please select a budget range or enter a custom amount to help plan your trip.",
          });
          return false;
        }

        // Validate custom budget amount (only if provided)
        if (hasCustomBudget) {
          if (isNaN(customBudgetAmount)) {
            toast.error("Invalid budget amount", {
              description: "Please enter a valid number for your budget.",
            });
            return false;
          }

          if (customBudgetAmount <= 0) {
            toast.error("Budget must be greater than zero", {
              description: "Please enter a budget amount greater than ₱0.",
            });
            return false;
          }

          // ✅ Smart minimum validation based on trip configuration
          // Now includes ALL services that were configured in Step 4
          if (formData.location && formData.duration) {
            try {
              console.log("🔍 Running smart budget validation...");

              // ✅ travelers is now guaranteed to be integer from getFormDefaults()
              const travelerCount = formData.travelers || 1;

              const budgetEstimates = getBudgetRecommendations({
                destination: formData.location,
                departureLocation:
                  flightData.departureCity || "Manila, Philippines",
                duration: formData.duration,
                travelers: travelerCount,
                includeFlights: flightData.includeFlights || false,
                transportAnalysis: flightData.transportAnalysis || null, // ✅ NEW: Pass transport mode analysis
                startDate: formData.startDate,
              });

              console.log("📊 Budget estimates received:", budgetEstimates);
              console.log("🚌 Transport analysis passed:", {
                hasTransportAnalysis: !!flightData.transportAnalysis,
                isGroundPreferred:
                  flightData.transportAnalysis?.groundTransport?.preferred,
                includeFlights: flightData.includeFlights,
                includeHotels: hotelData.includeHotels,
                departureCity: flightData.departureCity,
                destination: formData.location,
              });

              // ⚠️ WARNING: If transport analysis is missing, budget might be incorrect
              if (flightData.includeFlights && !flightData.transportAnalysis) {
                console.warn(
                  "⚠️ VALIDATION WARNING: includeFlights=true but transportAnalysis is missing!"
                );
                console.warn(
                  "This may cause budget to include flight costs even for ground-preferred routes"
                );
              }

              if (budgetEstimates) {
                const budgetTier =
                  budgetEstimates["budget-friendly"] ||
                  budgetEstimates["budget"] ||
                  budgetEstimates["budgetfriendly"];

                console.log("🏷️ Budget tier found:", budgetTier);

                if (budgetTier?.range) {
                  const recommendedBudget = parseInt(
                    budgetTier.range.replace(/[^0-9]/g, "")
                  );

                  // ✅ FIXED: Use SAME minimum calculation as BudgetSelector
                  // Matches BudgetSelector.jsx lines 80-132
                  const travelers = formData.travelers || 1;
                  const duration = formData.duration || 3;

                  const getMinPerPersonPerDay = (travelerCount) => {
                    if (travelerCount >= 11) return 600;
                    if (travelerCount >= 6) return 700;
                    if (travelerCount >= 3) return 800;
                    return 1000;
                  };

                  const minPerPersonPerDay = getMinPerPersonPerDay(travelers);
                  const tieredMinimum =
                    minPerPersonPerDay * duration * travelers;
                  const budgetTier90Percent = Math.floor(
                    recommendedBudget * 0.9
                  );

                  // Use the LOWER value (more lenient)
                  const absoluteMinimum = Math.min(
                    tieredMinimum,
                    budgetTier90Percent
                  );

                  console.log("💰 Budget validation check:", {
                    customBudgetAmount,
                    recommendedBudget,
                    tieredMinimum,
                    budgetTier90Percent,
                    absoluteMinimum,
                    calculation:
                      "Min of (tiered OR 90%) - matches BudgetSelector",
                    isValid: customBudgetAmount >= absoluteMinimum,
                  });

                  if (customBudgetAmount < absoluteMinimum) {
                    console.log("❌ Budget validation FAILED");

                    // Service-aware error message
                    const services = [];
                    if (flightData.includeFlights) services.push("flights");
                    if (hotelData.includeHotels) services.push("hotels");
                    const serviceText =
                      services.length > 0
                        ? ` (including ${services.join(" and ")})`
                        : "";

                    toast.error("Budget too low", {
                      description: `Need at least ₱${absoluteMinimum.toLocaleString()} for your ${
                        formData.duration
                      }-day trip${serviceText}. You have ₱${customBudgetAmount.toLocaleString()}.`,
                      duration: 6000,
                    });
                    return false;
                  }

                  console.log("✅ Budget validation PASSED");

                  // ✅ REMOVED: Confusing warning with inconsistent recommended budget
                  // User already saw budget comparison in BudgetSelector display
                  // No need to show duplicate warning with potentially different calculation
                  // (Transport analysis timing can cause discrepancy: ₱11,500 vs ₱12,600)
                }
              }
            } catch (error) {
              console.error("❌ Budget validation error:", error);
            }
          }

          // Basic fallback validation
          if (customBudgetAmount < 1000) {
            toast.error("Budget too low", {
              description:
                "Please enter a budget of at least ₱1,000 for your trip.",
            });
            return false;
          }

          if (customBudgetAmount > 1000000) {
            toast.error("Budget too high", {
              description:
                "Please enter a reasonable budget amount under ₱1,000,000.",
            });
            return false;
          }
        }
        break;
      }

      case 6:
        // Step 6: Review - no additional validation needed
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

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

    // ✅ SECURITY: Validate user email before proceeding
    let userEmail = null;
    try {
      const userObj = JSON.parse(user);
      userEmail =
        userObj.email ||
        userObj.user?.email ||
        userObj.providerData?.[0]?.email;

      if (!userEmail || !userEmail.includes("@")) {
        console.error("❌ Invalid user email:", userEmail);
        toast.error("Authentication Error", {
          description: "Your email address is invalid. Please log in again.",
          duration: 5000,
        });
        setOpenDialog(true);
        return;
      }

      console.log("✅ User email validated:", userEmail);
    } catch (parseError) {
      console.error("❌ Could not parse user data:", parseError);
      toast.error("Authentication Error", {
        description: "Your session is invalid. Please log in again.",
        duration: 5000,
      });
      setOpenDialog(true);
      return;
    }

    if (!userProfile) {
      toast.info("Profile setup needed", {
        description:
          "We need to know your preferences to create the perfect trip for you.",
      });
      navigate("/set-profile");
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    // ✅ NEW: Wrap entire trip generation in deduplication
    return deduplicateTripGeneration(formData, async () => {
      setLoading(true);

      let langGraphResults = null;
      let flightResults = null;
      let hotelResults = null;

      try {
        // ✅ STEP 1: Backend health check before starting
        console.log("🔍 Checking backend connection...");
        try {
          const API_BASE_URL =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
          const healthCheck = await axios.get(
            `${API_BASE_URL}/langgraph/health/`,
            {
              timeout: 5000,
            }
          );

          if (!healthCheck.data || healthCheck.data.status !== "healthy") {
            throw new Error("Backend health check failed");
          }
          console.log("✅ Backend connection verified");
        } catch (healthError) {
          console.error("❌ Backend connection failed:", healthError);
          toast.error("Backend Connection Failed", {
            description:
              "Unable to connect to the AI service. Please ensure the Django server is running on port 8000.",
            duration: 6000,
          });
          setLoading(false);
          setLangGraphLoading(false);
          setFlightLoading(false);
          setHotelLoading(false);
          return; // ✅ STOP execution immediately
        }

        const flightValidation = validateFlightData(flightData);
        const hotelValidation = validateHotelData(hotelData, formData); // ✅ Pass formData here!
        const activeServices = getActiveServices(flightData, hotelData);

        // ✅ NEW: Validate trip duration (1-7 days)
        const { validateDuration } = await import(
          "../constants/tripDurationLimits"
        );
        const durationValidation = validateDuration(formData.duration);

        if (!durationValidation.valid) {
          toast.error("Invalid Trip Duration", {
            description: `${durationValidation.error} ${durationValidation.suggestion}`,
            duration: 8000,
          });
          setLoading(false);
          return;
        }

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

        // ✅ PHASE 1: Sort hotels by quality BEFORE sending to AI
        // This ensures the best hotel becomes hotels[0] and gets selected for Day 1 check-in
        let sortedHotelData = { ...hotelData };
        if (hotelData.hotels && Array.isArray(hotelData.hotels)) {
          const sortedHotels = [...hotelData.hotels].sort((a, b) => {
            // Priority: Rating > Reviews > Price (lower is better)
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;

            // Sort by rating (descending)
            if (ratingB !== ratingA) return ratingB - ratingA;

            // Sort by review count (descending)
            const reviewsA = a.user_ratings_total || a.reviews_count || 0;
            const reviewsB = b.user_ratings_total || b.reviews_count || 0;
            if (reviewsB !== reviewsA) return reviewsB - reviewsA;

            // Sort by price (ascending - cheaper is better as tiebreaker)
            const extractPrice = (priceStr) => {
              if (!priceStr) return 99999;
              const match = String(priceStr).match(/₱?([\d,]+)/);
              return match ? parseInt(match[1].replace(/,/g, "")) : 99999;
            };
            const priceA = extractPrice(
              a.pricePerNight || a.priceRange || a.price_range
            );
            const priceB = extractPrice(
              b.pricePerNight || b.priceRange || b.price_range
            );
            return priceA - priceB;
          });

          sortedHotelData.hotels = sortedHotels;

          console.log("✅ Hotels sorted by quality for AI:", {
            total: sortedHotels.length,
            topHotel: sortedHotels[0]?.name || sortedHotels[0]?.hotelName,
            topRating: sortedHotels[0]?.rating,
            topReviews:
              sortedHotels[0]?.user_ratings_total ||
              sortedHotels[0]?.reviews_count,
          });
        }

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
            ...sortedHotelData, // ✅ Use sorted hotels
            checkInDate: travelDates.hotelCheckInDate,
            checkOutDate: travelDates.hotelCheckOutDate,
          },
          travelDates: travelDates,
          userProfile: userProfile,
        };

        langGraphResults = await langGraphAgent.orchestrateTrip(tripParams);

        // ✅ FIXED: Update transport mode state (non-blocking)
        if (langGraphResults?.transport_mode) {
          setTransportModeResult(langGraphResults.transport_mode);
          setTransportAnalysisComplete(true);

          console.log("✅ Transport mode analysis complete:", {
            mode: langGraphResults.transport_mode.mode,
            searchFlights: langGraphResults.transport_mode.search_flights,
            groundPreferred:
              langGraphResults.transport_mode.mode === "ground_preferred",
          });
        } else {
          // ✅ NEW: Set flag even if analysis unavailable (non-blocking)
          // Transport analysis is optional - trip generation continues regardless
          setTransportAnalysisComplete(true);
          console.warn(
            "⚠️ Transport mode analysis not available (backend may have skipped it). " +
              "This is non-critical - proceeding with trip generation."
          );
        }

        // 🔍 DEBUG: Check if transport_mode is in response
        console.log(
          "%c🚌 ═══════════════════════════════════════════════════════",
          "color: #10b981; font-weight: bold; font-size: 14px;"
        );
        console.log(
          "%c🚌 TRANSPORT MODE CHECK",
          "color: #10b981; font-weight: bold; font-size: 16px;"
        );
        console.log("🚌 TRANSPORT MODE CHECK:", {
          hasTransportMode: !!langGraphResults?.transport_mode,
          mode: langGraphResults?.transport_mode?.mode,
          searchFlights: langGraphResults?.transport_mode?.search_flights,
          recommendation: langGraphResults?.transport_mode?.recommendation,
          groundTransport: langGraphResults?.transport_mode?.ground_transport,
          fullData: langGraphResults?.transport_mode,
        });
        console.log(
          "%c🚌 ═══════════════════════════════════════════════════════",
          "color: #10b981; font-weight: bold; font-size: 14px;"
        );

        flightResults = langGraphResults.flights;
        hotelResults = langGraphResults.hotels;

        // 🔍 DEBUG: Log received flight data structure
        console.log("🔍 DEBUG langGraphResults.flights structure:", {
          exists: !!flightResults,
          keys: flightResults ? Object.keys(flightResults) : "N/A",
          hasFlightsArray: flightResults?.flights ? "YES" : "NO",
          flightsArrayLength: flightResults?.flights?.length || 0,
          success: flightResults?.success,
          rerouted: flightResults?.rerouted,
          fullData: flightResults,
        });

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

        // ✅ VALIDATION: Ensure transport analysis is complete before proceeding
        if (flightData.includeFlights && !transportAnalysisComplete) {
          console.warn(
            "⚠️ Transport analysis not completed, but continuing with generation"
          );
        }

        // 🚀 OPTIMIZED PROMPT SYSTEM
        console.log("🎯 Building optimized prompt with reduced token usage...");

        let combinedRequests = formData?.specificRequests || "";

        if (formData.categoryFocus && formData.categoryName) {
          const categoryInstructions = {
            Adventure:
              "70%+ outdoor/adventure activities, hiking, extreme sports",
            Beach:
              "70%+ coastal/island activities, water sports, beach resorts",
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

        // 💰 Calculate numeric budget amount for enforcement
        // ✅ FIXED: Get actual calculated tier amounts instead of hardcoded values
        let budgetAmount;

        if (customBudget) {
          // Use custom budget if provided
          budgetAmount = calculateBudgetAmount(formData.budget, customBudget);
        } else if (formData.budget) {
          // Calculate tier budget based on trip parameters
          const budgetEstimates = getBudgetRecommendations({
            destination: formData.location,
            departureLocation:
              flightData.departureCity || "Manila, Philippines",
            duration: formData.duration,
            travelers: formData.travelers || 1,
            includeFlights: flightData.includeFlights || false,
            startDate: formData.startDate,
          });

          // Map tier name to calculated amount
          const tierKey = formData.budget.toLowerCase().replace(/[-\s]/g, "");
          const tierData =
            budgetEstimates?.[tierKey] ||
            budgetEstimates?.["budgetfriendly"] ||
            budgetEstimates?.["moderate"];

          if (tierData?.total) {
            // ✅ CRITICAL FIX: Use .total field (numeric) instead of .range (formatted string)
            // This prevents parsing issues and ensures accurate budget caps
            budgetAmount = tierData.total;
            console.log(
              `💰 Budget from ${formData.budget} tier (TOTAL):`,
              budgetAmount,
              `(per person: ₱${Math.round(
                budgetAmount / (formData.travelers || 1)
              ).toLocaleString()})`
            );
          } else if (tierData?.range) {
            // Fallback to parsing range if total not available
            budgetAmount = parseInt(tierData.range.replace(/[^0-9]/g, ""));
            console.warn(`⚠️ Using .range fallback for budget:`, budgetAmount);
          } else {
            // Fallback to old method if estimates not available
            budgetAmount = calculateBudgetAmount(formData.budget, customBudget);
            console.warn(
              `⚠️ Using calculateBudgetAmount fallback:`,
              budgetAmount
            );
          }
        } else {
          budgetAmount = 20000; // Default fallback
        }

        console.log(
          `💰 Budget cap enforced: ₱${budgetAmount.toLocaleString()} for ${
            formData.travelers || 1
          } traveler(s), ${formData.duration} day(s)`
        );

        // ✅ ENHANCED: Tiered minimums based on group size (economies of scale)
        // Large groups benefit from shared accommodations, bulk bookings, and group discounts
        const getMinPerPersonPerDay = (travelers) => {
          if (travelers >= 11) return 600; // Large groups (11+): Bulk bookings, shared dorms, communal cooking
          if (travelers >= 6) return 700; // Medium groups (6-10): Group discounts, shared transport
          if (travelers >= 3) return 800; // Small groups (3-5): Shared rooms, split costs
          return 1000; // Solo/couples (1-2): No economies of scale
        };

        const minReasonableBudget = getMinPerPersonPerDay(
          formData.travelers || 1
        );
        const calculatedMinimum =
          minReasonableBudget * formData.duration * (formData.travelers || 1);

        if (budgetAmount < calculatedMinimum) {
          const groupContext =
            formData.travelers >= 11
              ? " Large groups can achieve ₱600/day/person with shared accommodations, communal meals, and bulk bookings."
              : formData.travelers >= 6
              ? " Medium-sized groups benefit from group discounts and shared transport costs."
              : formData.travelers >= 3
              ? " Small groups can share rooms and split transportation costs."
              : " Solo travelers and couples have higher per-person costs.";

          toast.error("Budget Too Low", {
            description: `Your budget (₱${budgetAmount.toLocaleString()}) is too low for ${
              formData.duration
            } day${formData.duration > 1 ? "s" : ""} and ${
              formData.travelers
            } traveler${
              formData.travelers > 1 ? "s" : ""
            }. Minimum recommended: ₱${calculatedMinimum.toLocaleString()} (₱${minReasonableBudget}/day/person).${groupContext}`,
            duration: 12000,
          });
          setLangGraphLoading(false);
          setLoading(false);
          return;
        }

        const enhancedPrompt = buildOptimizedPrompt({
          location: formData?.location,
          duration: `${formData?.duration} days`,
          travelers: formatTravelersDisplay(formData?.travelers),
          budget: customBudget ? `Custom: ₱${customBudget}` : formData?.budget,
          budgetAmount: `₱${budgetAmount.toLocaleString()}`, // 🔥 NEW: Explicit budget cap
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
          transportMode: langGraphResults?.transport_mode || null, // ✅ NEW: Ground transport context
          customBudget,
          flightData,
          hotelData,
          langGraphResults,
          // ✅ NEW: Category-specific context for AI
          categoryContext: formData?.selectedCategory
            ? {
                type: formData.selectedCategory,
                name: formData.categoryName,
                keywords: formData.categoryKeywords,
                activities: formData.categoryActivities,
              }
            : null,
        });

        console.log(
          "📝 Optimized prompt generated:",
          enhancedPrompt.length,
          "characters"
        );
        console.log(
          "📊 Estimated tokens:",
          Math.ceil(enhancedPrompt.length / 4)
        );

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

            // ✅ Pass trip duration and ground transport context to chatSession
            const result = await chatSession.sendMessage(enhancedPrompt, {
              tripDuration: formData.duration,
              ground_transport_context:
                langGraphResults?.transport_mode?.ground_transport || null,
            });
            console.log(`✅ [DEBUG] chatSession.sendMessage completed, extracting text...`);
            
            const rawResponse = result?.response.text();
            console.log(`✅ [DEBUG] Extracted raw response (${rawResponse?.length || 0} chars)`);

            console.log(
              `🎉 AI Raw Response (Attempt ${attempt}):`,
              rawResponse?.substring(0, 200) + "..."
            );

            console.log(`🔄 [DEBUG] Starting sanitizeJSONString...`);
            const cleanedResponse = sanitizeJSONString(rawResponse);
            console.log(`✅ [DEBUG] sanitizeJSONString completed (${cleanedResponse?.length || 0} chars)`);

            if (!cleanedResponse) {
              throw new Error("Failed to extract valid JSON from AI response");
            }

            console.log(`🔄 [DEBUG] Starting safeJsonParse...`);
            const testParse = safeJsonParse(cleanedResponse);
            console.log(`✅ [DEBUG] safeJsonParse completed, validating...`);
            
            const validationError = validateAIResponse(testParse);
            console.log(`✅ [DEBUG] validateAIResponse completed, error:`, validationError || 'none');

            if (validationError) {
              throw new Error(validationError);
            }

            // ✅ NEW: Check if itinerary has activities
            console.log(`🔄 [DEBUG] Checking for activities in itinerary...`);
            const hasActivities = testParse?.itinerary?.some((day) =>
              day?.plan?.some(
                (activity) =>
                  activity?.placeName &&
                  !activity.placeName
                    .toLowerCase()
                    .includes("return to hotel") &&
                  !activity.placeName.toLowerCase().includes("check-in") &&
                  !activity.placeName.toLowerCase().includes("check-out") &&
                  !activity.placeName.toLowerCase().includes("flight")
              )
            );
            console.log(`✅ [DEBUG] hasActivities:`, hasActivities);

            if (!hasActivities) {
              console.warn(
                `⚠️ Attempt ${attempt}: Itinerary has no activities, retrying...`
              );
              if (attempt < VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                continue;
              }
              throw new Error("Generated itinerary contains no activities");
            }

            console.log(`🔄 [DEBUG] Validating budget compliance...`);
            //  AUTO-FIX: Correct grand total if it doesn't match calculated sum
            if (testParse.dailyCosts && Array.isArray(testParse.dailyCosts)) {
              const calculatedGrandTotal = testParse.dailyCosts.reduce(
                (sum, day) => sum + (day.breakdown?.subtotal || 0),
                0
              );

              // If grand total doesn't match (off by more than ₱1), auto-correct it
              if (Math.abs(testParse.grandTotal - calculatedGrandTotal) > 1) {
                console.warn(
                  `⚠️ Auto-correcting grand total: ₱${testParse.grandTotal.toLocaleString()} → ₱${calculatedGrandTotal.toLocaleString()}`
                );
                testParse.grandTotal = calculatedGrandTotal;

                // Also update budgetCompliance.totalCost if present
                if (testParse.budgetCompliance) {
                  testParse.budgetCompliance.totalCost = calculatedGrandTotal;

                  // Recalculate remaining
                  if (testParse.budgetCompliance.userBudget) {
                    testParse.budgetCompliance.remaining =
                      testParse.budgetCompliance.userBudget -
                      calculatedGrandTotal;
                    testParse.budgetCompliance.withinBudget =
                      calculatedGrandTotal <=
                      testParse.budgetCompliance.userBudget;
                  }
                }

                // ✅ OPTIMIZED: Only show toast if correction is SIGNIFICANT (>5% difference)
                const percentDiff = Math.abs(
                  ((testParse.grandTotal - calculatedGrandTotal) /
                    calculatedGrandTotal) *
                    100
                );

                if (percentDiff > 5) {
                  // Significant correction - user should know
                  toast.info("Budget Adjusted", {
                    description: `Total updated to ₱${calculatedGrandTotal.toLocaleString()} to match daily costs.`,
                    duration: 4000,
                  });
                } else {
                  // Minor correction - silent fix
                  console.log(
                    `✅ Budget auto-corrected (${percentDiff.toFixed(
                      1
                    )}% difference)`
                  );
                }
              }
            }

            console.log(`🔄 [DEBUG] Running validateBudgetCompliance...`);
            // �💰 Validate budget compliance (after auto-correction)
            const budgetValidation = validateBudgetCompliance(testParse);
            console.log(`✅ [DEBUG] Budget validation result:`, {
              isValid: budgetValidation.isValid,
              errors: budgetValidation.errors?.length || 0,
              warnings: budgetValidation.warnings?.length || 0
            });
            
            if (!budgetValidation.isValid) {
              console.error(
                "❌ Budget validation failed:",
                budgetValidation.errors
              );
              throw new Error(
                `Budget compliance check failed: ${budgetValidation.errors.join(
                  "; "
                )}`
              );
            }

            // ⚠️ Check for warnings (unrealistic pricing, missing data)
            // ✅ OPTIMIZED: Consolidate pricing warnings into single toast
            const allPricingIssues = [];

            if (
              budgetValidation.warnings &&
              budgetValidation.warnings.length > 0
            ) {
              console.warn(
                "⚠️ Budget validation warnings:",
                budgetValidation.warnings
              );
              allPricingIssues.push(...budgetValidation.warnings);
            }

            // 🔍 Detect unrealistic pricing patterns
            const pricingCheck = detectUnrealisticPricing(testParse);
            if (pricingCheck.hasIssues) {
              console.warn("⚠️ Pricing issues detected:", pricingCheck.issues);
              allPricingIssues.push(...pricingCheck.issues);
            }

            // ✅ Smart filtering: Separate critical issues from informational notes
            const criticalPricingIssues = allPricingIssues.filter(
              (issue) =>
                typeof issue === "string" &&
                !issue.toLowerCase().includes("estimated") &&
                !issue.toLowerCase().includes("typical") &&
                !issue.toLowerCase().includes("based on") &&
                issue.startsWith("⚠️") // Only show warnings, not info (ℹ️)
            );

            const infoNotes = allPricingIssues.filter(
              (issue) => typeof issue === "string" && issue.startsWith("ℹ️")
            );

            if (criticalPricingIssues.length > 0) {
              // Show user-friendly message that explains what to do
              toast.info("💡 Quick Price Check", {
                description: `We found ${criticalPricingIssues.length} ${
                  criticalPricingIssues.length === 1 ? "item" : "items"
                } to review in your itinerary. Your trip total is accurate for ${
                  formData.location
                }. Check the details if you'd like to adjust pricing.`,
                duration: 6000,
              });
              console.log("💰 Pricing items to review:", criticalPricingIssues);
            }

            // Log informational notes (don't show toast - not urgent)
            if (infoNotes.length > 0) {
              console.log("ℹ️ Pricing info notes:", infoNotes);
            }

            console.log("✅ Budget compliance validated:", {
              totalCost: testParse.budgetCompliance?.totalCost,
              userBudget: testParse.budgetCompliance?.userBudget,
              remaining: testParse.budgetCompliance?.remaining,
              withinBudget: testParse.budgetCompliance?.withinBudget,
              uncertainPrices: testParse.missingPrices?.length || 0,
              pricingSource: testParse.pricingNotes,
            });

            aiResponseText = cleanedResponse;
            console.log(`✅ AI Generation successful on attempt ${attempt}`);
            break;
          } catch (error) {
            console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
            lastError = error;

            // ✨ SMART RETRY: Detect budget compliance errors and provide better UX
            const isBudgetError = error.message?.includes(
              "Budget compliance check failed"
            );

            if (
              isBudgetError &&
              attempt < VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS
            ) {
              const retryMessage =
                BUDGET_RETRY_STRATEGY.RETRY_MESSAGES[attempt] ||
                "🔄 Optimizing your plan...";

              console.log(`💡 Budget optimization on attempt ${attempt}:`);
              console.log(`   ${retryMessage}`);
              console.log(
                `   Budget target: ≤ ₱${
                  budgetAmount *
                  (
                    1 -
                    BUDGET_RETRY_STRATEGY.BUDGET_TARGETS[attempt] * 0.2
                  )?.toLocaleString()
                }`
              );

              // Show user-friendly message (not technical error)
              toast.info("Optimizing Your Plan", {
                description: retryMessage,
                duration: 3000,
              });

              await new Promise((resolve) => setTimeout(resolve, 2000));
            } else if (
              attempt < VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS
            ) {
              console.log("🔄 Retrying with enhanced prompt...");
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        if (!aiResponseText) {
          // ✨ Better error messaging for budget failures
          const isBudgetError = lastError?.message?.includes(
            "Budget compliance check failed"
          );
          const errorContext = isBudgetError
            ? `Your trip exceeds the ₱${budgetAmount?.toLocaleString()} budget + 15% buffer. Try:\n• Select a cheaper hotel tier\n• Reduce activities\n• Increase trip duration (more days = lower daily cost)`
            : lastError?.message || "Unknown generation error";

          throw new Error(
            `AI generation failed after ${VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS} attempts:\n${errorContext}`
          );
        }

        console.log(
          "🧹 Final cleaned Response:",
          aiResponseText?.substring(0, 200) + "..."
        );

        // ✅ FINAL PRE-SAVE VALIDATION CHECKLIST
        console.log("🔍 Pre-Save Validation Checklist:");
        const validationChecklist = {
          aiResponseGenerated: !!aiResponseText,
          transportAnalysisComplete:
            !flightData.includeFlights || transportAnalysisComplete,
          flightResultsReady: !flightData.includeFlights || !!flightResults,
          hotelResultsReady: !hotelData.includeHotels || !!hotelResults,
          langGraphComplete:
            (!flightData.includeFlights && !hotelData.includeHotels) ||
            !!langGraphResults,
        };

        console.table(validationChecklist);

        const allChecksPassed = Object.values(validationChecklist).every(
          (v) => v === true
        );
        if (!allChecksPassed) {
          console.warn(
            "⚠️ Some validation checks failed, but proceeding with save"
          );
        } else {
          console.log("✅ All pre-save validation checks passed!");
        }

        console.log(`🚀 [DEBUG] Calling SaveAiTrip with:`, {
          aiResponseLength: aiResponseText?.length || 0,
          hasFlightResults: !!flightResults,
          hasHotelResults: !!hotelResults,
          hasLangGraphResults: !!langGraphResults,
          budgetAmount
        });
        
        SaveAiTrip(
          aiResponseText,
          flightResults,
          hotelResults,
          langGraphResults,
          budgetAmount
        );
      } catch (error) {
        console.error("❌ Trip generation error:", error);
        console.error("❌ Error stack:", error.stack);

        // ✅ Immediately stop all loading states and reset transport analysis
        setLoading(false);
        setFlightLoading(false);
        setHotelLoading(false);
        setLangGraphLoading(false);
        setTransportModeResult(null);
        setTransportAnalysisComplete(false);

        // ✨ IMPROVED: Handle budget compliance errors with actionable guidance
        if (error.message?.includes("Budget compliance check failed")) {
          toast.error("Trip Exceeds Budget", {
            description: `Your selected options exceed the budget. Try:\n• Choose Budget or Moderate hotel tier\n• Reduce daily activities\n• Extend trip duration (more days = lower daily costs)\n• Use local transport instead of flights`,
            duration: 8000,
          });
          return;
        }

        // ✅ NEW: Handle rate limit errors silently - user doesn't need technical details
        if (
          error.message?.includes("Rate limit") ||
          error.message?.includes("429") ||
          error.message?.includes("quota")
        ) {
          // Extract wait time if available
          const retryMatch =
            error.message.match(/retry in (\d+)/i) ||
            error.message.match(/wait (\d+)/i);
          const waitTime = retryMatch ? parseInt(retryMatch[1]) : null;

          toast.error("Processing Delayed", {
            description: waitTime
              ? `Your request is being processed. This may take up to ${waitTime} seconds. Please wait...`
              : "Your request is being processed. This may take a moment. Please wait and try again shortly.",
            duration: 8000,
          });
          return;
        }

        // ✅ Timeout errors - suggest optimization
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          toast.error("Request Timeout", {
            description:
              "The generation took too long. Try reducing the trip duration or simplifying requirements.",
            duration: 6000,
          });
          return;
        }

        // ✅ Network errors - check server
        if (
          error.code === "ERR_NETWORK" ||
          error.message?.includes("Network Error")
        ) {
          toast.error("Connection Failed", {
            description:
              "Unable to reach the backend server. Ensure Django is running on http://localhost:8000",
            duration: 6000,
          });
        } else if (error.response?.status === 500) {
          toast.error("Server Error", {
            description:
              error.response?.data?.error ||
              "Internal server error. Check Django logs for details.",
            duration: 6000,
          });
        } else if (error.response?.status === 408) {
          toast.error("Invalid API Configuration", {
            description:
              "AI service timeout. Please check your Gemini API key in Django settings.",
            duration: 6000,
          });
        } else {
          toast.error("Unable to create your trip", {
            description:
              error.message ||
              "Something went wrong while generating your itinerary. Please try again.",
            duration: 6000,
          });
        }
      }
    }); // Close deduplicateTripGeneration wrapper
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
            // ✅ FIX: Preserve critical arrays (itinerary, hotels, flights) as actual arrays
            if (key === "itinerary" || key === "hotels" || key === "flights") {
              sanitized[key] = value
                .map((item) => sanitizeForFirebase(item))
                .filter((item) => item !== null);
            } else if (key === "plan" && value.length > 0) {
              // Keep 'plan' as array too (day activities)
              sanitized[key] = value
                .map((item) => sanitizeForFirebase(item))
                .filter((item) => item !== null);
              // Also create text version for backward compatibility
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
            } else if (value.length > 0) {
              // Other arrays: convert to comma-separated string
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
    langGraphResults = null,
    budgetAmountParam = null
  ) => {
    console.log(`🚀 [DEBUG] SaveAiTrip called`);
    setLoading(true);

    try {
      console.log(`🔄 [DEBUG] Getting user from localStorage...`);
      const user = JSON.parse(localStorage.getItem("user"));
      console.log(`✅ [DEBUG] User retrieved:`, !!user);
      
      const docId = Date.now().toString();
      console.log(`✅ [DEBUG] Generated docId:`, docId);

      const activeServices = getActiveServices(flightData, hotelData);
      console.log(`✅ [DEBUG] Active services:`, activeServices);

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

      setValidationPhase("parsing"); // 🆕 Track progress for user
      console.log(`🔄 [DEBUG] Parsing TripData JSON...`);
      let parsedTripData;
      try {
        parsedTripData = JSON.parse(TripData);
        console.log(`✅ [DEBUG] JSON parse successful:`, {
          hasTripName: !!parsedTripData.tripName,
          hasItinerary: !!parsedTripData.itinerary,
          itineraryDays: parsedTripData.itinerary?.length || 0,
          hasHotels: !!parsedTripData.hotels,
          hotelCount: parsedTripData.hotels?.length || 0
        });
      } catch (e) {
        console.error("❌ [DEBUG] Initial parse failed:", e.message);
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

      // 🏨 NEW: EARLY HOTEL NAME VALIDATION (Catch AI hallucinations immediately)
      console.log("🏨 Running early hotel name validation...");
      try {
        // ✅ CRITICAL: Always use real hotels from hotelResults, not AI's hallucinated hotels
        // AI sometimes generates its own hotels array which may contain wrong hotel names
        if (hotelResults?.hotels) {
          console.log(
            `🏨 Using ${hotelResults.hotels.length} hotel(s) from LangGraph recommendations`
          );
          parsedTripData.hotels = hotelResults.hotels;
        } else {
          console.warn(
            "⚠️ No hotel recommendations available - skipping early validation"
          );
        }

        const { validateAndFixHotelNames, reportEarlyValidation } =
          await import("../utils/earlyHotelNameValidator");

        const earlyValidation = validateAndFixHotelNames(parsedTripData);

        if (!earlyValidation.isValid && earlyValidation.fixedData) {
          console.warn(
            `⚠️ Found ${earlyValidation.totalMismatches} hotel name mismatch(es) - auto-fixing...`
          );
          parsedTripData = earlyValidation.fixedData;

          // Report fixes (console only - silent correction for users)
          reportEarlyValidation(earlyValidation);

          // ✅ Verify the fix was applied
          const primaryHotelName =
            parsedTripData.hotels?.[0]?.name ||
            parsedTripData.hotels?.[0]?.hotelName;
          if (primaryHotelName && parsedTripData.itinerary?.[0]?.plan) {
            const day1CheckIn = parsedTripData.itinerary[0].plan.find(
              (act) =>
                act.placeName?.toLowerCase().includes("check") &&
                act.placeName?.toLowerCase().includes("in")
            );
            if (day1CheckIn) {
              console.log(
                `✅ VERIFICATION: Day 1 check-in after fix: "${day1CheckIn.placeName}"`
              );
              console.log(
                `✅ VERIFICATION: Primary hotel: "${primaryHotelName}"`
              );
              console.log(
                `✅ VERIFICATION: Match status: ${
                  day1CheckIn.placeName.includes(primaryHotelName)
                    ? "CORRECT ✓"
                    : "MISMATCH ✗"
                }`
              );
            }
          }

          // ✅ Silent fix - users just want correct itinerary, not technical details
        } else {
          console.log("✅ All hotel names match recommendations!");
        }
      } catch (earlyValidationError) {
        console.error(
          "❌ Early hotel validation failed:",
          earlyValidationError
        );
        // Non-blocking - continue without early validation if it fails
      }

      // 🔧 AUTO-FIX: Ensure activity counts meet constraints before validation
      setValidationPhase("autofix"); // 🆕 Track progress
      console.log("🔧 Running auto-fix on itinerary...");
      console.log("📦 Trip data structure:", {
        hasItinerary: !!parsedTripData?.itinerary,
        days: parsedTripData?.itinerary?.length || 0,
        firstDayPlan: parsedTripData?.itinerary?.[0]?.plan?.length || 0,
      });

      try {
        const originalData = JSON.stringify(parsedTripData);
        console.log("🔧 Running initial auto-fix (Pass 1)...");
        parsedTripData = autoFixItinerary(parsedTripData, formData);
        const wasModified = originalData !== JSON.stringify(parsedTripData);

        if (wasModified) {
          console.log("✅ Auto-fix Pass 1 completed - Itinerary was modified");
          // ✅ OPTIMIZED: Silent auto-fix - no toast needed (user expects valid itinerary)
        } else {
          console.log("✅ Auto-fix Pass 1 completed - No modifications needed");
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
      setValidationPhase("validation"); // 🆕 Track progress
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

      // 🆕 DEBUG: Show detailed activity breakdown per day
      console.log("\n📊 DETAILED ACTIVITY BREAKDOWN:");
      parsedTripData?.itinerary?.forEach((day, index) => {
        const dayNum = day.day || index + 1;
        const { activities, logistics, activityCount } = classifyActivities(
          day.plan || []
        );
        const isFirstDay = dayNum === 1;
        const isLastDay = dayNum === parsedTripData.itinerary.length;
        const constraints = getActivityConstraints(
          isFirstDay,
          isLastDay,
          formData.activityPreference || 2
        );

        console.log(
          `\nDay ${dayNum} (${
            isFirstDay ? "Arrival" : isLastDay ? "Departure" : "Middle"
          }):`
        );
        console.log(`  Total Items: ${day.plan?.length || 0}`);
        console.log(
          `  Tourist Activities: ${activityCount} (Target: ${constraints.min}-${constraints.max})`
        );
        console.log(
          `    ✅ Activities:`,
          activities.map((a) => a.placeName || a)
        );
        console.log(`  Logistics Items: ${logistics.length}`);
        console.log(
          `    📦 Logistics:`,
          logistics.map((a) => a.placeName || a)
        );
        console.log(
          `  Status: ${
            activityCount <= constraints.max ? "✅ VALID" : "❌ EXCEEDS LIMIT"
          }`
        );
      });
      console.log("\n");

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

        // 🔧 SMART RETRY: Try one more aggressive auto-fix before giving up
        console.log("🔄 Attempting aggressive auto-fix (Pass 2)...");
        console.warn(
          "⚠️ Note: Auto-fix running TWICE - duplicate prevention is critical!"
        );

        try {
          // Force-fix all day activity counts to strict limits
          const { autoFixItinerary } = await import(
            "../utils/itineraryAutoFix"
          );
          const aggressiveFixed = autoFixItinerary(parsedTripData, {
            ...formData,
            activityPreference: Math.max(1, formData.activityPreference - 1), // Lower preference
          });

          // Re-validate after aggressive fix
          const revalidation = validateActivityCount(
            aggressiveFixed.tripData || parsedTripData,
            formData
          );

          if (revalidation.isValid) {
            console.log("✅ Aggressive auto-fix Pass 2 succeeded!");
            parsedTripData = aggressiveFixed.tripData || parsedTripData;

            toast.success("Itinerary Optimized", {
              description:
                "We've adjusted your itinerary to ensure a comfortable pace. You can modify activities later.",
              duration: 4000,
            });
          } else {
            throw new Error("Aggressive fix failed");
          }
        } catch (fixError) {
          console.error("❌ Aggressive auto-fix failed:", fixError);

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
      }

      if (activityValidation.warnings.length > 0) {
        console.warn(
          "⚠️ Activity count has warnings:",
          activityValidation.warnings
        );
      }

      // 🗺️ NEW: Travel Time Validation & Correction
      console.log("🗺️ Validating and correcting travel times...");
      try {
        const correctionResult = correctItineraryTravelTimes(parsedTripData, {
          autoCorrect: true, // Automatically fix inaccurate times
          threshold: 30, // Correct if >30% difference from calculated
          verbose: true, // Log detailed corrections
        });

        // Update parsed data with corrected times
        parsedTripData = correctionResult.tripData;

        // ✅ FIX: Check if report exists before accessing properties
        if (!correctionResult.report) {
          console.warn("⚠️ Travel time validation skipped - no itinerary data");
        } else {
          // Log and notify user of corrections
          if (correctionResult.wasModified) {
            console.log(
              "✏️ Travel times corrected:",
              correctionResult.report.summary
            );
            console.table(correctionResult.report.corrections);

            // ✅ OPTIMIZED: Silent correction - no toast needed (automatic quality assurance)
            // Users expect accurate travel times by default
          } else {
            console.log("✅ All AI-generated travel times are accurate!");
          }

          // Log validation statistics
          console.log("📊 Travel Time Validation Stats:", {
            totalChecked: correctionResult.report.totalChecks,
            accurate: correctionResult.report.accurate,
            corrected: correctionResult.report.corrected,
            skipped: correctionResult.report.skipped,
            accuracyRate:
              correctionResult.report.totalChecks > 0
                ? `${(
                    (correctionResult.report.accurate /
                      correctionResult.report.totalChecks) *
                    100
                  ).toFixed(1)}%`
                : "N/A",
          });

          // Warn if many locations are missing coordinates
          if (correctionResult.report.warnings?.length > 0) {
            console.warn(
              "⚠️ Travel time validation warnings:",
              correctionResult.report.warnings
            );
          }
        }
      } catch (travelTimeError) {
        console.error("❌ Travel time validation failed:", travelTimeError);
        // Non-blocking - continue with original times if validation fails
        toast.warning("Travel Time Validation Skipped", {
          description: "Unable to validate travel times. Using AI estimates.",
          duration: 3000,
        });
      }

      // 🏨 NEW: Hotel Itinerary Consistency Validation & Auto-Fix
      console.log("🏨 Validating hotel references consistency...");
      try {
        // Build trip data with hotel info for validation
        const tripDataWithHotels = {
          ...parsedTripData,
          hotels: hotelResults?.hotels || [],
          recommended_hotel:
            langGraphResults?.merged_data?.recommended_hotel || null,
        };

        const hotelValidation =
          validateHotelItineraryConsistency(tripDataWithHotels);

        if (!hotelValidation.isValid) {
          console.warn(
            `⚠️ Found ${hotelValidation.totalIssues} generic hotel reference(s) across ${hotelValidation.issuesByDay.length} day(s)`
          );

          // Auto-fix hotel references
          const fixResult =
            autoFixHotelItineraryConsistency(tripDataWithHotels);

          if (fixResult.fixed) {
            // Apply corrections to parsed data
            parsedTripData = fixResult.data;

            console.log("✅ Auto-fixed hotel references:");
            fixResult.fixes.forEach((fix) => {
              console.log(
                `  ✓ Day ${fix.day}, Activity ${fix.activity}: ${fix.message}`
              );
            });

            // ✅ OPTIMIZED: Silent fix - no toast needed (internal data normalization)
            // Users don't need to know about hotel reference formatting
          }
        } else {
          console.log(
            "✅ All hotel references are specific - no generic references found!"
          );
        }

        // Report validation results
        reportHotelItineraryValidation(hotelValidation);
      } catch (hotelValidationError) {
        console.error("❌ Hotel validation failed:", hotelValidationError);
        // Non-blocking - continue without hotel validation if it fails
        toast.warning("Hotel Validation Skipped", {
          description:
            "Unable to validate hotel references. Proceeding with itinerary.",
          duration: 3000,
        });
      }

      if (itineraryValidation.warnings.length > 0) {
        console.warn(
          "⚠️ Itinerary has warnings:",
          itineraryValidation.warnings
        );

        // Only show critical warnings (not minor suggestions)
        const criticalWarnings = itineraryValidation.warnings.filter(
          (warn) => warn.severity === "high" || warn.severity === "critical"
        );

        if (criticalWarnings.length > 0) {
          const warningMessages = criticalWarnings
            .slice(0, 3)
            .map((warn) => warn.message)
            .join("\n");

          toast.info("📋 Itinerary Checklist", {
            description: `We noticed a few things you might want to review:\n${warningMessages}`,
            duration: 7000,
          });
        }
      } else {
        console.log("✅ Itinerary structure validated successfully");
      }

      // 🆕 Hotel-Itinerary Consistency Validation
      console.log("🏨 Validating hotel-itinerary consistency...");
      const hotelItineraryResult =
        autoFixHotelItineraryConsistency(parsedTripData);

      if (hotelItineraryResult.fixed) {
        console.log(
          "🔧 Hotel-itinerary issues auto-fixed:",
          hotelItineraryResult.fixes
        );
        parsedTripData = hotelItineraryResult.data; // Use corrected data

        toast.success("Auto-Fixed Hotel References", {
          description: `Day 1 check-in now correctly references the first recommended hotel.`,
          duration: 5000,
        });
      } else if (hotelItineraryResult.issues.length > 0) {
        console.warn(
          "⚠️ Hotel-itinerary validation issues:",
          hotelItineraryResult.issues
        );
      } else {
        console.log("✅ Hotel-itinerary consistency validated");
      }

      // 🆕 MERGE RECOMMENDED FLIGHT & HOTEL INTO ITINERARY TIMELINE
      console.log("✈️🏨 Merging recommended flight & hotel into itinerary...");
      try {
        // Extract recommended items from LangGraph results
        const recommendedFlight =
          langGraphResults?.merged_data?.recommended_flight;
        const recommendedHotel =
          langGraphResults?.merged_data?.recommended_hotel ||
          hotelResults?.hotels?.[0]; // Fallback to first hotel

        console.log("📦 Recommended items:", {
          flight: recommendedFlight?.name || "None",
          hotel:
            recommendedHotel?.name || recommendedHotel?.hotelName || "None",
        });

        if (parsedTripData?.itinerary?.length > 0) {
          // ===== DAY 1: Add flight arrival & ensure hotel check-in =====
          const day1 = parsedTripData.itinerary[0];

          // Add flight arrival at the beginning (if flights enabled)
          if (recommendedFlight && flightData.includeFlights) {
            const flightArrivalTime =
              recommendedFlight.departure || formData.startDate || "08:00 AM";

            const arrivalActivity = {
              time: flightArrivalTime,
              placeName: `✈️ Flight Arrival - ${
                recommendedFlight.name || "Inbound Flight"
              }`,
              placeDetails: `Arrive at ${formData.location} from ${
                flightData.departureCity || "departure city"
              }. Flight: ${recommendedFlight.name || "N/A"}, Duration: ${
                recommendedFlight.duration || "N/A"
              }.`,
              ticketPricing: recommendedFlight.price || "₱???",
              timeTravel: "Flight arrival (included in ticket)",
              geoCoordinates: { lat: 0, lng: 0 }, // Airport coordinates
              isFlightActivity: true, // Flag for special handling
            };

            // Check if flight arrival already exists
            const hasFlightArrival = day1.plan.some(
              (activity) =>
                activity.placeName?.toLowerCase().includes("flight") &&
                activity.placeName?.toLowerCase().includes("arrival")
            );

            if (!hasFlightArrival) {
              day1.plan.unshift(arrivalActivity);
              console.log(
                "✅ Added flight arrival to Day 1:",
                recommendedFlight.name
              );
            } else {
              console.log("ℹ️ Day 1 already has flight arrival activity");
            }
          }

          // Ensure hotel check-in uses specific hotel name (not generic)
          if (recommendedHotel) {
            const hotelName =
              recommendedHotel.name ||
              recommendedHotel.hotelName ||
              recommendedHotel.hotel_name;

            if (hotelName) {
              // Find check-in activity (handles both generic and specific hotel names)
              const checkInIndex = day1.plan.findIndex((activity) => {
                const placeName = (activity.placeName || "").toLowerCase();
                const placeDetails = (
                  activity.placeDetails || ""
                ).toLowerCase();
                // Match any activity containing both "check" and "in" keywords
                return (
                  (placeName.includes("check") && placeName.includes("in")) ||
                  placeDetails.includes("check-in") ||
                  placeDetails.includes("check in")
                );
              });

              if (checkInIndex >= 0) {
                // Update existing check-in to use specific hotel name
                const originalName = day1.plan[checkInIndex].placeName;
                day1.plan[
                  checkInIndex
                ].placeName = `🏨 Check-in at ${hotelName}`;
                day1.plan[checkInIndex].placeDetails =
                  `Check-in at ${hotelName}, settle into your room and freshen up. ${
                    recommendedHotel.description || ""
                  }`.trim();

                if (originalName !== day1.plan[checkInIndex].placeName) {
                  console.log(
                    `✅ Updated Day 1 check-in: "${originalName}" → "Check-in at ${hotelName}"`
                  );
                }
              } else {
                // Fallback: Check if first activity is likely a check-in (mentions hotel)
                let fallbackCheckIn = -1;
                if (day1.plan.length > 0) {
                  const firstActivity = day1.plan[0];
                  const firstText = `${firstActivity.placeName || ""} ${
                    firstActivity.placeDetails || ""
                  }`.toLowerCase();
                  if (
                    firstText.includes("hotel") &&
                    !firstText.includes("departure") &&
                    !firstText.includes("flight")
                  ) {
                    fallbackCheckIn = 0;
                    console.log(
                      `ℹ️ Using first activity as check-in fallback: "${firstActivity.placeName}"`
                    );
                  }
                }

                if (fallbackCheckIn >= 0) {
                  // Update first activity to use recommended hotel name
                  const originalName = day1.plan[fallbackCheckIn].placeName;
                  day1.plan[
                    fallbackCheckIn
                  ].placeName = `🏨 Check-in at ${hotelName}`;
                  day1.plan[fallbackCheckIn].placeDetails =
                    `Check-in at ${hotelName}, settle into your room and freshen up. ${
                      recommendedHotel.description || ""
                    }`.trim();
                  day1.plan[fallbackCheckIn].isHotelActivity = true;

                  console.log(
                    `✅ Updated fallback check-in: "${originalName}" → "Check-in at ${hotelName}"`
                  );
                } else {
                  // Add check-in if still missing
                  console.warn(
                    "⚠️ Day 1 missing check-in activity, adding it..."
                  );
                  day1.plan.splice(1, 0, {
                    time: "02:00 PM",
                    placeName: `🏨 Check-in at ${hotelName}`,
                    placeDetails: `Check-in at ${hotelName}, settle into your room and freshen up.`,
                    ticketPricing: "Included in accommodation",
                    timeTravel: "At hotel",
                    geoCoordinates: { lat: 0, lng: 0 },
                    isHotelActivity: true,
                  });
                  console.log(`✅ Added check-in at ${hotelName} to Day 1`);
                }
              }
            }
          }

          // ===== LAST DAY: Add hotel checkout & departure flight =====
          const lastDayIndex = parsedTripData.itinerary.length - 1;
          const lastDay = parsedTripData.itinerary[lastDayIndex];

          // Add hotel checkout if not present
          if (recommendedHotel) {
            const hotelName =
              recommendedHotel.name ||
              recommendedHotel.hotelName ||
              recommendedHotel.hotel_name;

            if (hotelName) {
              const hasCheckout = lastDay.plan.some((activity) =>
                /check.?out|checkout/i.test(activity.placeName || "")
              );

              if (!hasCheckout) {
                // Insert checkout before last activity (usually airport departure)
                const checkoutPosition = Math.max(0, lastDay.plan.length - 1);
                lastDay.plan.splice(checkoutPosition, 0, {
                  time: "11:00 AM",
                  placeName: `🏨 Check-out from ${hotelName}`,
                  placeDetails: `Check-out from ${hotelName} and prepare for departure. Ensure all belongings are packed.`,
                  ticketPricing: "Free",
                  timeTravel: "At hotel",
                  geoCoordinates: { lat: 0, lng: 0 },
                  isHotelActivity: true,
                });
                console.log(
                  `✅ Added checkout from ${hotelName} to last day (Day ${
                    lastDayIndex + 1
                  })`
                );
              } else {
                console.log("ℹ️ Last day already has checkout activity");
              }
            }
          }

          // Add departure flight at the end (if flights enabled)
          if (recommendedFlight && flightData.includeFlights) {
            const flightDepartureTime =
              recommendedFlight.arrival || formData.endDate || "06:00 PM";

            const departureActivity = {
              time: flightDepartureTime,
              placeName: `✈️ Departure Flight - ${
                recommendedFlight.name || "Return Flight"
              }`,
              placeDetails: `Return flight to ${
                flightData.departureCity || "home"
              }. Flight: ${recommendedFlight.name || "N/A"}, Duration: ${
                recommendedFlight.duration || "N/A"
              }.`,
              ticketPricing: recommendedFlight.price || "₱???",
              timeTravel: "Flight departure (included in ticket)",
              geoCoordinates: { lat: 0, lng: 0 },
              isFlightActivity: true,
            };

            // Check if departure flight already exists
            const hasDepartureFlight = lastDay.plan.some(
              (activity) =>
                activity.placeName?.toLowerCase().includes("flight") &&
                (activity.placeName?.toLowerCase().includes("departure") ||
                  activity.placeName?.toLowerCase().includes("return"))
            );

            if (!hasDepartureFlight) {
              lastDay.plan.push(departureActivity);
              console.log(
                `✅ Added departure flight to last day (Day ${
                  lastDayIndex + 1
                }):`,
                recommendedFlight.name
              );
            } else {
              console.log("ℹ️ Last day already has departure flight activity");
            }
          }

          // Summary
          console.log("✅ Flight & Hotel integration completed successfully");
          toast.success("Itinerary Enhanced", {
            description:
              "Your recommended flight and hotel are now integrated into your daily schedule!",
            duration: 4000,
          });
        }
      } catch (mergeError) {
        console.error(
          "❌ Failed to merge flight/hotel into itinerary:",
          mergeError
        );
        console.error("Stack trace:", mergeError.stack);
        // Non-blocking - continue with itinerary even if merge fails
        toast.warning("Flight/Hotel Integration Skipped", {
          description:
            "Unable to add flight/hotel to timeline. They're still available in booking sections.",
          duration: 4000,
        });
      }

      // ✅ LAYER 3 DEFENSE: Final deduplication before Firebase save
      // This guarantees no duplicates make it to the database
      console.log("🧹 Running final pre-save deduplication...");
      const { cleanItinerary } = await import("../utils/itineraryDeduplicator");
      if (parsedTripData?.itinerary) {
        parsedTripData.itinerary = cleanItinerary(parsedTripData.itinerary);
        console.log("✅ Final deduplication complete - itinerary is clean");
      }

      // ✅ NEW: Validate dietary restrictions in meals
      console.log("🍽️ Validating dietary restrictions in meal activities...");
      const { validateWithSuggestions } = await import("../utils/dietaryValidator");
      if (parsedTripData?.itinerary && userProfile?.dietaryRestrictions?.length > 0) {
        const dietaryValidation = validateWithSuggestions(
          parsedTripData.itinerary,
          userProfile,
          formData.location
        );

        if (!dietaryValidation.validation.isValid) {
          console.warn(
            `⚠️ Dietary validation found ${dietaryValidation.validation.violationCount} potential issues`,
            dietaryValidation.validation.violations
          );
          
          // Show warning toast with details
          toast.warning(dietaryValidation.warningMessage, {
            description: "Review meal activities in your itinerary and modify if needed.",
            duration: 6000,
          });

          // Store dietary warnings in trip document for display in view-trip
          parsedTripData.dietaryWarnings = {
            hasViolations: true,
            violationCount: dietaryValidation.validation.violationCount,
            violations: dietaryValidation.validation.violations,
            suggestions: dietaryValidation.suggestions,
            warningMessage: dietaryValidation.warningMessage
          };
        } else {
          console.log("✅ All meal activities comply with dietary restrictions");
          parsedTripData.dietaryWarnings = { hasViolations: false };
        }
      }

      // ✅ FIX 1: Ensure budget field is always included in userSelection with multiple formats
      setValidationPhase("saving"); // 🆕 Track final phase
      console.log("💾 Preparing trip document for Firebase...");
      const budgetValue = customBudget
        ? `Custom: ₱${customBudget}`
        : formData.budget || "Moderate";

      // ✅ CRITICAL FIX: Use the SAME budgetAmount calculated earlier for prompt enforcement
      // This ensures consistency between budget cap enforcement and saved budget
      const numericBudgetAmount =
        budgetAmountParam ||
        (customBudget
          ? parseFloat(String(customBudget).replace(/[^0-9.]/g, ""))
          : calculateBudgetAmount(formData.budget, null));

      console.log(
        `💾 Saving budget to Firebase: ₱${numericBudgetAmount.toLocaleString()} (${
          budgetAmountParam ? "from budget cap" : "fallback calculation"
        })`
      );

      // ✅ FIX 2: Flatten nested tripData if it exists (prevents tripData.tripData structure)
      let finalTripData = parsedTripData;
      if (
        parsedTripData?.tripData &&
        typeof parsedTripData.tripData === "object"
      ) {
        console.warn(
          "⚠️ Detected nested tripData.tripData structure during save - flattening..."
        );
        finalTripData = parsedTripData.tripData;
        console.log("✅ Flattened tripData structure before saving");
      }

      // ✅ FIX 3: Ensure string fields are properly serialized for Firebase
      if (finalTripData) {
        // Convert arrays to JSON strings if needed (Firebase Firestore handles arrays natively, but check for edge cases)
        if (Array.isArray(finalTripData.placesToVisit)) {
          console.log("✅ placesToVisit is already an array");
        } else if (typeof finalTripData.placesToVisit === "string") {
          console.warn("⚠️ placesToVisit is a string - will be parsed on read");
        }

        if (Array.isArray(finalTripData.dailyCosts)) {
          console.log("✅ dailyCosts is already an array");
        } else if (typeof finalTripData.dailyCosts === "string") {
          console.warn("⚠️ dailyCosts is a string - will be parsed on read");
        }
      }

      const tripDocument = {
        userSelection: {
          ...formData,
          budget: budgetValue, // ✅ Display format: "Custom: ₱18990" or "Moderate"
          customBudget: customBudget, // ✅ Raw input: "18990"
          budgetAmount: numericBudgetAmount, // ✅ NEW: Parsed numeric: 18990 (for easy access)
        },
        flightPreferences: flightData,
        hotelPreferences: hotelData,
        tripPreferences: sanitizeTripPreferences(flightData, hotelData),
        langGraphResults: cleanLangGraphResults,
        userProfile: userProfile,
        tripData: finalTripData, // ✅ Use flattened tripData
        realFlightData: flightResults || null,
        realHotelData: hotelResults || null,

        // ⭐ NEW: Ground Transport Integration - Extract to top level for ViewTrip
        transportMode: langGraphResults?.transport_mode || null,
        costBreakdown: langGraphResults?.merged_data?.cost_breakdown || null,

        // 🔍 DEBUG: Log transport mode data before Firebase save
        ...(console.log(
          "%c� ═══════════════════════════════════════════════════════",
          "color: #3b82f6; font-weight: bold; font-size: 14px;"
        ) || {}),
        ...(console.log(
          "%c💾 FIREBASE SAVE - TRANSPORT MODE DATA",
          "color: #3b82f6; font-weight: bold; font-size: 16px;"
        ) || {}),
        ...(console.log("💾 Transport Mode Data:", {
          hasTransportMode: !!langGraphResults?.transport_mode,
          mode: langGraphResults?.transport_mode?.mode,
          searchFlights: langGraphResults?.transport_mode?.search_flights,
          hasCostBreakdown: !!langGraphResults?.merged_data?.cost_breakdown,
          costBreakdown: langGraphResults?.merged_data?.cost_breakdown,
          fullTransportMode: langGraphResults?.transport_mode,
        }) || {}),
        ...(console.log(
          "%c💾 ═══════════════════════════════════════════════════════",
          "color: #3b82f6; font-weight: bold; font-size: 14px;"
        ) || {}),

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
      console.log("🚗 Ground Transport Data Being Saved:", {
        transportMode: sanitizedTripDocument.transportMode,
        costBreakdown: sanitizedTripDocument.costBreakdown,
        hasTransportMode: !!sanitizedTripDocument.transportMode,
        hasCostBreakdown: !!sanitizedTripDocument.costBreakdown,
      });

      // ✅ Validate document size before saving to Firebase
      const sizeValidation = validateFirebaseDocSize(sanitizedTripDocument);
      console.log(
        `📊 Document Size: ${sizeValidation.sizeFormatted} (${sizeValidation.percentOfLimit}% of limit)`
      );

      if (sizeValidation.warning) {
        console.warn(`⚠️ ${sizeValidation.warningMessage}`);
      }

      // Use safe save with automatic optimization if needed
      const saveResult = await safeFirebaseSave(
        async (data) => await setDoc(doc(db, "AITrips", docId), data),
        sanitizedTripDocument,
        {
          autoOptimize: true,
          onSizeWarning: (validation) => {
            toast.warning("Large Trip Data", {
              description: `Your trip data is ${validation.sizeFormatted}. We've optimized it for storage.`,
            });
          },
        }
      );

      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save trip document");
      }

      // ✅ NEW: Clear draft after successful trip creation
      clearDraft();
      console.log("🗑️ Draft cleared after successful trip creation");

      console.log("✅ All validations complete. Preparing for redirect...");
      console.log("📊 Final completion checklist:", {
        tripSaved: true,
        firebaseDocId: docId,
        transportAnalysisComplete:
          transportAnalysisComplete || !flightData.includeFlights,
        itineraryValidated: true,
        activitiesValidated: true,
        travelTimesValidated: true,
        hotelConsistencyValidated: true,
        locationValidated: true,
        budgetValidated: true,
      });

      toast.success("🎉 Your Amazing Trip is Ready!", {
        description: `Your personalized itinerary for ${formData.location} has been created and saved. Get ready for an incredible adventure!`,
        duration: 6000,
      });

      // ✅ Small delay to ensure toast displays and all state updates complete before navigation
      console.log(`🚀 Navigating to /view-trip/${docId} in 100ms...`);
      setTimeout(() => {
        console.log("🎯 Executing navigation now...");
        navigate("/view-trip/" + docId);
      }, 100);
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
        // Destination & Dates
        return (
          <div className="space-y-8">
            <LocationSelector
              place={place}
              onPlaceChange={setPlace}
              isPreFilled={!!place}
              categoryData={
                formData.selectedCategory
                  ? {
                      name: formData.categoryName,
                      recommendedDestinations: formData.recommendedDestinations,
                    }
                  : null
              }
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
        // Group Size (Travelers only)
        return (
          <TravelerSelector
            selectedTravelers={formData?.travelers}
            onTravelersChange={handleTravelersChange}
            formData={formData}
            flightData={flightData}
          />
        );

      case 3:
        // Activity Pace
        return (
          <ActivityPreferenceSelector
            activityPreference={activityPreference}
            onActivityPreferenceChange={setActivityPreference}
            formData={formData}
            userProfile={userProfile}
          />
        );

      case 4:
        // Travel Services (Flights + Hotels combined)
        return (
          <TravelServicesSelector
            flightData={flightData}
            onFlightDataChange={handleFlightDataChange}
            hotelData={hotelData}
            onHotelDataChange={handleHotelDataChange}
            formData={formData}
            userProfile={userProfile}
          />
        );

      case 5:
        // Budget (now comes AFTER services are selected)
        return (
          <BudgetSelector
            value={formData?.budget}
            customValue={customBudget}
            onBudgetChange={handleBudgetChange}
            onCustomBudgetChange={setCustomBudget}
            error={null}
            formData={formData}
            flightData={flightData}
            hotelData={hotelData}
            userProfile={userProfile}
            activityPreference={activityPreference}
          />
        );

      case 6:
        // Review & Generate
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
            categoryData={
              formData.selectedCategory
                ? {
                    name: formData.categoryName,
                    recommendedDestinations: formData.recommendedDestinations,
                  }
                : null
            }
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
        onRetry={() => navigate("/set-profile")}
        onCreateNew={() => navigate("/")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Create Your Perfect Trip
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
              Plan personalized travel experiences tailored just for you
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6 lg:p-8">
          {/* Progress Steps */}
          <div className="mb-6 sm:mb-8">
            {/* Step Circles - Responsive Layout */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 overflow-x-auto pb-2">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div
                    key={step.id}
                    className="flex items-center shrink-0"
                  >
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
                        className={`w-3 sm:w-6 md:w-10 lg:w-14 h-0.5 mx-0.5 sm:mx-1 md:mx-2 transition-all ${
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
            <div className="text-center mb-4 sm:mb-6 px-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                {STEPS[currentStep - 1].description}
              </p>
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="w-full h-2 sm:h-3 mb-2" />
            <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep} of {STEPS.length}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8 sm:mb-12">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 pt-6 border-t border-gray-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 w-full sm:w-auto cursor-pointer border-sky-200 dark:border-sky-700 text-gray-700 dark:text-gray-200 hover:bg-sky-50 dark:hover:bg-sky-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowLeft />
              Previous
            </Button>

            <div className="flex gap-3 w-full sm:w-auto">
              {currentStep < STEPS.length ? (
                <Button
                  onClick={nextStep}
                  className="brand-button cursor-pointer flex items-center justify-center gap-2 px-6 sm:px-8 py-3 w-full sm:w-auto"
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
        isOpen={
          loading ||
          flightLoading ||
          hotelLoading ||
          langGraphLoading ||
          (flightData.includeFlights &&
            !transportAnalysisComplete &&
            langGraphLoading)
        }
        loading={loading}
        flightLoading={flightLoading}
        hotelLoading={hotelLoading}
        langGraphLoading={langGraphLoading}
        validationPhase={validationPhase} // 🆕 Pass validation phase
        destination={formData?.location}
        duration={formData?.duration}
        includeFlights={flightData.includeFlights}
        includeHotels={hotelData.includeHotels}
        groundTransportPreferred={
          transportModeResult?.mode === "ground_preferred"
        }
        transportAnalysis={{
          hasAirport: transportModeResult?.has_airport,
          groundTransport: transportModeResult?.ground_transport,
          recommendation: transportModeResult?.recommendation,
        }}
      />
    </div>
  );
}

export default CreateTrip;
