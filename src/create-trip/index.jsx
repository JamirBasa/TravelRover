// src/create-trip/index.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { chatSession } from "../config/aimodel";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AI_PROMPT,
  STEP_CONFIGS,
  DEFAULT_VALUES,
  MESSAGES,
  VALIDATION_RULES,
  calculateProgress,
  calculateDuration,
  validateAIResponse,
  sanitizeJSONString,
} from "../constants/options";
import { FlightAgent } from "../config/flightAgent";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { formatTripTypes } from "../config/formatUserPreferences";
import { safeJsonParse } from "../utils/jsonParsers";
import { getValidationExamples } from "../data/philippineRegions";
import {
  validateItinerary,
  getValidationSuggestion,
  getNearestAirportInfo,
} from "../utils/itineraryValidator";
import {
  FaCalendarAlt,
  FaArrowRight,
  FaArrowLeft,
  FaUser,
  FaCheck,
} from "react-icons/fa";

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
  validateHotelData,
  getActiveServices,
  getServiceDescriptions,
  sanitizeTripPreferences,
} from "../utils/tripPreferences";
import { UserProfileService } from "../services/userProfileService";
import {
  calculateTravelDates,
  getDateExplanation,
  getActivityGuidance,
  validateTravelDates,
} from "../utils/travelDateManager";

// Use centralized step configuration
const STEPS = STEP_CONFIGS.CREATE_TRIP;

function CreateTrip() {
  // State management
  const [currentStep, setCurrentStep] = useState(1);

  // Set dynamic page title based on current step
  const currentStepTitle =
    STEPS.find((step) => step.id === currentStep)?.title || "Create Trip";
  usePageTitle(`${currentStepTitle} - Create Trip`);
  const [place, setPlace] = useState(null);
  const [formData, setFormData] = useState({});

  // Ref to prevent duplicate toasts from React Strict Mode
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
  const [activityPreference, setActivityPreference] = useState(2); // Default to moderate pace
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
  }, []);

  // Sync activity preference to formData
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      activityPreference,
    }));
  }, [activityPreference]);

  // Handle searched location from home page
  useEffect(() => {
    const hasLocation = location.state?.searchedLocation;
    const hasCategory = location.state?.selectedCategory;

    // Handle location data
    if (hasLocation) {
      const searchedLocation = location.state.searchedLocation;
      console.log("🏠 Received searched location from home:", searchedLocation);

      // Set the location in form data
      setFormData((prev) => ({
        ...prev,
        location: searchedLocation,
      }));

      // Create a place object for the location selector
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

    // Handle category data
    if (hasCategory) {
      const categoryData = {
        type: location.state.selectedCategory,
        name: location.state.categoryName,
        activities: location.state.categoryActivities,
        keywords: location.state.categoryKeywords,
        focus: location.state.categoryFocus,
      };

      console.log("🏠 Received selected category from home:", categoryData);

      // Set comprehensive category data in form
      setFormData((prev) => ({
        ...prev,
        selectedCategory: categoryData.type,
        categoryName: categoryData.name,
        categoryActivities: categoryData.activities,
        categoryKeywords: categoryData.keywords,
        categoryFocus: categoryData.focus,
      }));
    }

    // Show single consolidated toast notification (only once)
    if ((hasLocation || hasCategory) && !hasShownHomeToast.current) {
      const searchedLocation = location.state?.searchedLocation;
      const categoryName = location.state?.categoryName;
      const categoryKeywords = location.state?.categoryKeywords;

      if (hasLocation && hasCategory) {
        // Both location and category selected
        toast.success(
          `Perfect! Planning your ${categoryName} trip to ${searchedLocation}`,
          {
            description: `We'll focus on ${
              categoryKeywords?.split(",")[0] || "amazing experiences"
            }`,
          }
        );
      } else if (hasCategory) {
        // Only category selected
        toast.success(`Perfect! Let's plan your ${categoryName} trip`, {
          description: `We'll focus on ${
            categoryKeywords?.split(",")[0] || "relevant activities"
          }`,
        });
      } else {
        // Only location selected
        toast.success(
          `Great choice! Planning your trip to ${searchedLocation}`
        );
      }

      // Mark that we've shown the toast
      hasShownHomeToast.current = true;

      // Clear the location state to prevent re-triggering
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
  }, [place]);

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

      // Auto-populate form data with user preferences using centralized service
      const formDefaults = UserProfileService.getFormDefaults(profile);
      setFormData((prev) => ({
        ...prev,
        ...formDefaults,
      }));

      // Auto-populate flight data using centralized service
      const autoPopulatedFlightData = UserProfileService.autoPopulateFlightData(
        profile,
        flightData
      );

      if (autoPopulatedFlightData !== flightData) {
        setFlightData(autoPopulatedFlightData);
        console.log("🏠 Auto-populated flight departure from profile");
      }

      // Auto-populate hotel data using centralized service
      const autoPopulatedHotelData = UserProfileService.autoPopulateHotelData(
        profile,
        hotelData
      );

      if (autoPopulatedHotelData !== hotelData) {
        setHotelData(autoPopulatedHotelData);
        console.log("� Auto-populated hotel preferences from profile");
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

  // Note: getDefaultTravelers moved to UserProfileService

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

  const handleLocationChange = useCallback(
    (location) => {
      handleInputChange("location", location);
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
      case 1: // Destination & Dates
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

        // Smart date validation
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

        // Show warnings but allow to continue
        if (dateValidation.warnings.length > 0) {
          dateValidation.warnings.forEach((warning) => {
            toast.warning("Travel planning tip", {
              description: warning,
              duration: 6000,
            });
          });
        }
        break;

      case 2: // Travel Preferences
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
        // Validate custom budget if entered
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

      case 3: // Flight Options
        const flightValidation = validateFlightData(flightData);
        if (!flightValidation.isValid) {
          toast.error("Flight preferences incomplete", {
            description: flightValidation.errors[0],
          });
          return false;
        }
        break;

      case 4: // Hotel Options
        const hotelValidation = validateHotelData(hotelData);
        if (!hotelValidation.isValid) {
          toast.error("Hotel preferences incomplete", {
            description: hotelValidation.errors[0],
          });
          return false;
        }
        break;

      case 5: // Review & Generate - no additional validation needed
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

  // Validation helper
  const validateForm = () => {
    if (
      !formData?.location ||
      !formData?.startDate ||
      !formData?.endDate ||
      !formData?.travelers
    ) {
      toast.error("Missing required information", {
        description:
          "Please complete all fields including destination, dates, and number of travelers.",
      });
      return false;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      toast.error("Invalid travel date", {
        description:
          "Your trip start date cannot be in the past. Please choose a future date.",
      });
      return false;
    }

    if (endDate <= startDate) {
      toast.error("Invalid date range", {
        description: "Your return date must be after your departure date.",
      });
      return false;
    }

    if (!formData?.budget && !customBudget) {
      toast.error("Budget information needed", {
        description:
          "Please select a budget range or enter a custom amount to help us plan your trip.",
      });
      return false;
    }

    // Validate custom budget if entered
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

    return true;
  };

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

    // Initialize LangGraph results
    let langGraphResults = null;
    let flightResults = null;
    let hotelResults = null;

    try {
      // Validate flight and hotel preferences before proceeding
      const flightValidation = validateFlightData(flightData);
      const hotelValidation = validateHotelData(hotelData);
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

      // ✅ ALWAYS use LangGraph for GA-First itinerary generation
      // Even if flights/hotels are not requested, GA-First will optimize the itinerary
      setLangGraphLoading(true);

      if (activeServices.hasAnyAgent) {
        console.log("🤖 Starting LangGraph with flights/hotels search...");
      } else {
        console.log(
          "� Starting LangGraph GA-First itinerary generation (no flights/hotels)..."
        );
      }

      // Calculate smart travel dates with buffer logic
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
          // Use smart flight dates if flights are included
          searchDepartureDate: travelDates.flightDepartureDate,
          searchReturnDate: travelDates.flightReturnDate,
        },
        hotelData: {
          ...hotelData,
          // Use smart hotel dates
          checkInDate: travelDates.hotelCheckInDate,
          checkOutDate: travelDates.hotelCheckOutDate,
        },
        travelDates: travelDates, // Include full date calculation
        userProfile: userProfile,
      };

      langGraphResults = await langGraphAgent.orchestrateTrip(tripParams);

      // Extract individual results for compatibility
      flightResults = langGraphResults.flights;
      hotelResults = langGraphResults.hotels;

      // Log results for debugging (no toasts needed - info shown in loading modal)
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

      // Enhanced prompt with user profile data and category focus
      let enhancedPrompt = AI_PROMPT.replaceAll(
        "{location}",
        formData?.location
      )
        .replaceAll("{duration}", formData?.duration + " days")
        .replaceAll("{travelers}", formData?.travelers)
        .replaceAll(
          "{budget}",
          customBudget ? `Custom: ₱${customBudget}` : formData?.budget
        )
        .replaceAll(
          "{specificRequests}",
          formData?.specificRequests ||
            "No specific requests - create a balanced itinerary"
        )
        .replaceAll(
          "{activityPreference}",
          formData?.activityPreference || "2"
        );

      // Add category-specific focus if selected from home page
      if (formData.categoryFocus && formData.categoryName) {
        enhancedPrompt += `

🎯 CATEGORY-FOCUSED TRIP PLANNING:
This is a ${formData.categoryName?.toUpperCase()} focused trip!

🔥 PRIMARY FOCUS: ${formData.categoryName} Trip
Keywords: ${formData.categoryKeywords || "relevant activities"}

MANDATORY REQUIREMENTS:
- At least 70% of activities must be ${formData.categoryName}-related
- Include these specific activity types: ${
          formData.categoryActivities?.join(", ") || "relevant activities"
        }
- Prioritize destinations in ${formData.location} known for: ${
          formData.categoryKeywords || "this category"
        }
- Structure the entire itinerary around ${formData.categoryName} experiences

CATEGORY-SPECIFIC INSTRUCTIONS:
${
  formData.categoryName === "Adventure"
    ? `
- Focus on outdoor activities, mountain destinations, and adventure sports
- Include hiking trails, adventure parks, extreme sports venues
- Recommend gear rental shops and adventure tour operators
- Suggest early morning starts for optimal adventure conditions
- Prioritize destinations with natural landscapes and outdoor activities`
    : ""
}
${
  formData.categoryName === "Beach"
    ? `
- Prioritize coastal destinations, islands, and beach resorts
- Include water sports, island hopping, and beach activities
- Focus on beaches with different characteristics (white sand, diving spots, surfing)
- Include beachfront accommodations and seafood restaurants
- Suggest beach gear rentals and water activity operators`
    : ""
}
${
  formData.categoryName === "Cultural"
    ? `
- Focus on historical sites, museums, and cultural landmarks
- Include local festivals, traditional performances, and heritage tours
- Prioritize UNESCO sites, old churches, and historical districts
- Include interactions with local artisans and cultural centers
- Suggest cultural workshops and traditional craft experiences`
    : ""
}
${
  formData.categoryName === "Food Trip"
    ? `
- Focus on local restaurants, food markets, and culinary experiences
- Include famous local dishes, street food areas, and specialty restaurants
- Prioritize food tours, cooking classes, and local food festivals
- Include visits to food production sites (farms, breweries, local markets)
- Suggest food photography spots and Instagram-worthy dining locations`
    : ""
}

IMPORTANT: Every day should have a strong ${
          formData.categoryName
        } theme with relevant activities and destinations. Make sure the majority of recommendations align with the ${
          formData.categoryName
        } category.
`;
      }

      // Add user profile context to the prompt
      const userFullName =
        userProfile.fullName ||
        [userProfile.firstName, userProfile.middleName, userProfile.lastName]
          .filter(Boolean)
          .join(" ") ||
        "User";

      // Extract user's home region for geographic awareness
      const userHomeCity = userProfile.address?.city || "Manila";
      const userHomeRegion =
        userProfile.address?.province ||
        userProfile.address?.region ||
        "Philippines";
      const tripDestination = formData?.location || "Unknown";

      // Determine effective budget (trip-level overrides profile)
      const tripBudget = customBudget
        ? `Custom: ₱${customBudget}`
        : formData?.budget;
      const profileBudget = userProfile.budgetRange || "Moderate";
      const budgetOverridden =
        tripBudget &&
        profileBudget &&
        !tripBudget.toLowerCase().includes(profileBudget.toLowerCase());

      // Check if user is traveling to a different region
      const isDifferentRegion =
        !tripDestination.toLowerCase().includes(userHomeCity.toLowerCase()) &&
        !tripDestination.toLowerCase().includes(userHomeRegion.toLowerCase());

      enhancedPrompt += `

👤 USER PROFILE INFORMATION:
- Full Name: ${userFullName}
- Home Location: ${userHomeCity}, ${userHomeRegion}
- Trip Destination: ${tripDestination}
- Preferred Trip Types: ${
        userProfile.preferredTripTypes?.join(", ") || "General travel"
      }
- Travel Style: ${userProfile.travelStyle || "Not specified"}
- Accommodation Preference: ${
        userProfile.accommodationPreference || "Not specified"
      }

💰 BUDGET INFORMATION:
${
  budgetOverridden
    ? `
⚠️ BUDGET OVERRIDE ACTIVE:
- 🎯 THIS TRIP'S BUDGET: ${tripBudget} (USE THIS FOR ALL RECOMMENDATIONS)
- 📋 Profile Preference: ${profileBudget} (context only - user chose different budget for this trip)

CRITICAL: Recommend hotels and activities based on ${tripBudget} budget level, NOT the profile preference.
The user explicitly selected ${tripBudget} for this specific trip.
`
    : `
- 💵 Trip Budget: ${tripBudget || profileBudget}
${
  tripBudget && profileBudget && tripBudget !== profileBudget
    ? `- Note: Matches user's profile preference (${profileBudget})`
    : ""
}
`
}

${
  isDifferentRegion
    ? `
🗺️ GEOGRAPHIC AWARENESS - CRITICAL INSTRUCTIONS:
⚠️ The user is traveling FROM ${userHomeRegion} TO ${tripDestination}

STRICT REQUIREMENTS:
❌ DO NOT recommend places in or near ${userHomeCity}, ${userHomeRegion}
❌ DO NOT suggest "visiting ${userHomeCity}" or nearby cities in ${userHomeRegion}
❌ DO NOT include day trips back to the user's home region
❌ DO NOT recommend attractions near the user's origin area

✅ ONLY recommend places within ${tripDestination} and its immediate surroundings
✅ Focus ALL activities in the destination area: ${tripDestination}
✅ Suggest attractions, restaurants, and activities EXCLUSIVE to ${tripDestination}
✅ This is a DESTINATION-FOCUSED trip - user is exploring ${tripDestination}, not their home area

EXAMPLE OF WHAT NOT TO DO:
- If user is from Davao traveling to Manila → DON'T recommend "Visit Davao City" or "Eden Nature Park"
- If user is from Cebu traveling to Palawan → DON'T recommend "Visit Cebu" or "Magellan's Cross"
- If user is from Manila traveling to Baguio → DON'T recommend "Visit Manila" or "Intramuros"

The user wants to EXPLORE ${tripDestination}, not revisit their hometown!
`
    : `
🗺️ GEOGRAPHIC CONTEXT:
- User is exploring their local area: ${tripDestination}
- Include diverse attractions within ${tripDestination} and nearby areas
`
}

🍽️ DIETARY & CULTURAL REQUIREMENTS:
- Dietary Restrictions: ${userProfile.dietaryRestrictions?.join(", ") || "None"}
- Cultural Preferences: ${userProfile.culturalPreferences?.join(", ") || "None"}
${
  userProfile.dietaryRestrictions?.includes("halal")
    ? "- ⭐ IMPORTANT: Ensure ALL food recommendations are HALAL-certified"
    : ""
}
${
  userProfile.culturalPreferences?.includes("islamic")
    ? "- ⭐ IMPORTANT: Prioritize Islamic-friendly destinations and activities"
    : ""
}
${
  userProfile.culturalPreferences?.includes("prayer")
    ? "- ⭐ IMPORTANT: Include nearby mosque/prayer facility information"
    : ""
}

📅 TRAVEL DATES & TIMING:
Trip Dates (at destination): ${formData.startDate} to ${formData.endDate}
Duration: ${formData.duration} days

${
  travelDates.includesArrivalDay
    ? `
🛫 FLIGHT TIMING CONTEXT:
- Flight Departure: ${travelDates.flightDepartureDate} (${
        travelDates.travelInfo.recommendation
      })
- Flight Return: ${travelDates.flightReturnDate}
- User will arrive at destination on ${travelDates.tripStartDate}
- ${
        travelDates.travelInfo.isInternational
          ? "IMPORTANT: Day 1 activities should be FULL DAY (user arrives day before)"
          : "IMPORTANT: Day 1 activities should be AFTERNOON/EVENING only (morning arrival)"
      }
`
    : `
🏨 TRAVEL CONTEXT:
- Flight options provided below are recommendations for your convenience
- Plan full days of activities from ${travelDates.activitiesStartDate}
`
}

🏨 HOTEL BOOKING DATES:
- Check-in: ${travelDates.hotelCheckInDate}
- Check-out: ${travelDates.hotelCheckOutDate}
- Total nights: ${travelDates.totalNights}

📋 ACTIVITY PLANNING GUIDANCE:
${getActivityGuidance(travelDates)
  .map(
    (guide) =>
      `Day ${guide.day}: ${guide.timing} - ${guide.note} (Pace: ${guide.recommendedPace})`
  )
  .join("\n")}

CRITICAL ITINERARY INSTRUCTIONS:
- Last day (${travelDates.flightReturnDate}) activities can run until evening
- Hotel checkout is ${
        travelDates.hotelCheckOutDate
      } morning - plan departure accordingly
${
  flightData.includeFlights
    ? `- Return flight departs on ${travelDates.flightReturnDate} - ensure activities end by afternoon/evening for travel`
    : ""
}
${
  travelDates.travelInfo.isDomesticShort
    ? "- First day should have 2-3 activities starting AFTER 1PM (arrival time)"
    : ""
}
${
  travelDates.includesArrivalDay
    ? "- First day is a FULL day (user arrives evening before)"
    : ""
}
- Respect the activity timing guidance above for realistic planning

PERSONALIZATION INSTRUCTIONS:
- Tailor recommendations based on user's preferred trip types: ${userProfile.preferredTripTypes?.join(
        ", "
      )}
- Consider their travel style: ${userProfile.travelStyle}
- Suggest accommodations matching their preference: ${
        userProfile.accommodationPreference
      }
- Respect all dietary restrictions and cultural preferences
- Include specific tips relevant to travelers from ${userProfile.address?.city}

Please create a highly personalized itinerary for these exact dates.

� DESTINATION-SPECIFIC LOCATION VALIDATION:
${(() => {
  const validationExamples = getValidationExamples(formData.location);
  if (validationExamples) {
    return `
⚠️ CRITICAL: ALL places must be in ${
      formData.location
    } or its immediate vicinity!

✅ CORRECT EXAMPLES (Use these types of places):
${validationExamples.correctExamples.map((ex) => `   - ${ex}`).join("\n")}

❌ FORBIDDEN EXAMPLES (DO NOT include these):
${validationExamples.incorrectExamples
  .map(
    (ex) =>
      `   - ${ex.place} (This is in ${ex.actualLocation}, NOT ${formData.location})`
  )
  .join("\n")}

📍 NEARBY AREAS YOU CAN INCLUDE:
${validationExamples.nearbyAreas.map((area) => `   - ${area}`).join("\n")}

🔑 LOCATION KEYWORDS TO USE:
${validationExamples.keywords
  .slice(0, 5)
  .map((kw) => `   - ${kw}`)
  .join("\n")}

VALIDATION RULE: Every place name should include "${
      formData.location
    }" or one of the nearby areas in its name or description.
Example: "Magellan's Cross, Cebu City" NOT just "Magellan's Cross"
`;
  }
  return `\n⚠️ Ensure ALL places are within ${formData.location} region. Include city/area qualifiers in place names.\n`;
})()}

�🚨 CRITICAL JSON REQUIREMENTS:
- Return ONLY complete, valid JSON
- Ensure all braces {} and brackets [] are properly closed  
- Keep descriptions concise (under 100 characters each)
- Do not truncate the response - complete the entire JSON structure
- The response must be parseable by JSON.parse() without errors`;

      // Handle LangGraph Multi-Agent results in prompt
      if (langGraphResults?.success) {
        enhancedPrompt += `

🤖 LANGGRAPH MULTI-AGENT ANALYSIS:
Optimization Score: ${
          langGraphResults.optimized_plan?.optimization_score || "N/A"
        }
Cost Efficiency: ${
          langGraphResults.optimized_plan?.cost_efficiency || "Unknown"
        }
Total Estimated Cost: ₱${
          langGraphResults.merged_data?.total_estimated_cost?.toLocaleString() ||
          "N/A"
        }

📊 SMART RECOMMENDATIONS:
${
  langGraphResults.optimized_plan?.final_recommendations
    ?.map((rec) => `- ${rec.message} (${rec.priority} priority)`)
    .join("\n") || "No specific recommendations"
}
`;
      }

      // Handle flight information in prompt
      if (shouldIncludeFlights(flightData)) {
        if (flightResults?.success && flightResults.flights?.length > 0) {
          const flightInfo = `

🛫 REAL FLIGHT OPTIONS AVAILABLE:
Departure City: ${flightData.departureCity}
${flightResults.flights
  .slice(0, 3)
  .map(
    (flight, index) => `
✈️ Option ${index + 1}: ${flight.name}
   💰 Price: ${flight.price}
   🕐 Departure: ${flight.departure}
   🕑 Arrival: ${flight.arrival}
   ⏱️ Duration: ${flight.duration}
   🛑 Stops: ${flight.stops === 0 ? "Non-stop" : `${flight.stops} stop(s)`}
   ${flight.is_best ? "⭐ Best Value" : ""}
`
  )
  .join("")}

📊 Current Price Level: ${flightResults.current_price}

IMPORTANT: Please incorporate these ACTUAL flight options into the itinerary. 
Recommend the best flight based on the traveler's budget and preferences.
Include the real prices in your budget breakdown.
`;

          enhancedPrompt += flightInfo;
          console.log("✅ Enhanced prompt with real flight data");
        } else {
          console.log(
            "⚠️ No flight data available, using AI-generated suggestions"
          );
          enhancedPrompt += `

⚠️ Note: User requested flight information but real-time data unavailable. 
Please provide estimated flight costs from ${flightData.departureCity} to ${formData.location}.
`;
        }
      } else {
        enhancedPrompt += `

🚫 FLIGHT PREFERENCES: User opted NOT to include flight search in this itinerary.
Do not include flight recommendations, prices, or booking information.
Focus on accommodations, activities, dining, and ground transportation only.
`;
      }

      // Handle hotel information in prompt
      if (shouldIncludeHotels(hotelData)) {
        if (hotelResults?.success && hotelResults.hotels?.length > 0) {
          const hotelInfo = `

🏨 REAL HOTEL OPTIONS AVAILABLE:
Destination: ${formData.location}
Accommodation Preference: ${hotelData.preferredType}
Budget Level: ${hotelData.priceRange}

${hotelResults.hotels
  .slice(0, 3)
  .map(
    (hotel, index) => `
🏨 Option ${index + 1}: ${hotel.name}
   ⭐ Rating: ${hotel.rating}/5.0
   💰 Price Range: ${hotel.price_range}
   📍 Location: ${hotel.address}
   🛏️ Amenities: ${hotel.amenities?.join(", ") || "Basic amenities"}
   📏 Distance: ${hotel.distance}
   ${hotel.is_recommended ? "⭐ Highly Recommended" : ""}
`
  )
  .join("")}

IMPORTANT: Please incorporate these ACTUAL hotel options into the itinerary. 
Recommend the best hotel based on the traveler's preferences and budget.
Include the real prices and amenities in your recommendations.
`;

          enhancedPrompt += hotelInfo;
          console.log("✅ Enhanced prompt with real hotel data");
        } else {
          console.log(
            "⚠️ No hotel data available, using AI-generated suggestions"
          );
          enhancedPrompt += `

⚠️ Note: User requested hotel information but real-time data unavailable. 
Please provide estimated accommodation options for ${formData.location} matching ${hotelData.preferredType} preference.
`;
        }
      } else {
        enhancedPrompt += `

🚫 HOTEL PREFERENCES: User opted NOT to include hotel search in this itinerary.
Generate general accommodation recommendations without specific pricing or booking details.
`;
      }

      console.log("📝 Final prompt:", enhancedPrompt);

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

          // Pre-clean and validate the response
          const cleanedResponse = sanitizeJSONString(rawResponse);

          if (!cleanedResponse) {
            throw new Error("Failed to extract valid JSON from AI response");
          }

          // Test parse to ensure it's valid
          const testParse = safeJsonParse(cleanedResponse);
          const validationError = validateAIResponse(testParse);

          if (validationError) {
            throw new Error(validationError);
          }

          // Success! Use this response
          aiResponseText = cleanedResponse;
          console.log(`✅ AI Generation successful on attempt ${attempt}`);
          break;
        } catch (error) {
          console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
          lastError = error;

          if (attempt < VALIDATION_RULES.JSON_PARSING.MAX_RETRY_ATTEMPTS) {
            console.log("🔄 Retrying with enhanced prompt...");
            // Add stricter instructions for retry
            enhancedPrompt +=
              "\n\nIMPORTANT: Previous attempt failed. Generate ONLY valid JSON with no extra text or formatting.";
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief delay
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

      console.log("📊 Final AI Response Analysis:", {
        length: aiResponseText?.length || 0,
        startsWithBrace: aiResponseText?.trim().startsWith("{") || false,
        endsWithBrace: aiResponseText?.trim().endsWith("}") || false,
        hasRequiredFields:
          (aiResponseText?.includes('"placesToVisit"') &&
            aiResponseText?.includes('"tripName"')) ||
          false,
      });

      console.log("✅ All validations passed - proceeding with trip creation");

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

  // Function to sanitize data for Firebase (no nested arrays)
  const sanitizeForFirebase = (obj) => {
    if (obj === null || obj === undefined) return null; // Convert undefined to null

    if (Array.isArray(obj)) {
      // Convert array to a serialized string representation for Firebase
      return obj
        .map((item) => sanitizeForFirebase(item))
        .filter((item) => item !== null);
    }

    if (typeof obj === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedValue = sanitizeForFirebase(value);

        // Only add the field if it's not null (skip undefined/null values)
        if (sanitizedValue !== null) {
          if (Array.isArray(value)) {
            // Handle specific known nested array structures
            if (key === "plan" && value.length > 0) {
              // Convert plan array to formatted text
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
              // Keep flights array but sanitize each flight
              sanitized[key] = value
                .map((flight) => sanitizeForFirebase(flight))
                .filter((item) => item !== null);
            } else if (value.length > 0) {
              // For other arrays, convert to comma-separated string
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

      // Calculate activeServices for tracking LangGraph usage
      const activeServices = getActiveServices(flightData, hotelData);

      // Clean langGraphResults to remove undefined values
      const cleanLangGraphResults = langGraphResults
        ? {
            ...langGraphResults,
            merged_data: langGraphResults.merged_data
              ? {
                  ...langGraphResults.merged_data,
                  // Remove any undefined fields
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
        console.log(
          "Response length:",
          TripData.length,
          "| Last 200 chars:",
          TripData.slice(-200)
        );

        try {
          // Smart truncation recovery for incomplete JSON
          let cleanedJson = TripData;

          // First, check if this is a truncation issue
          if (
            cleanedJson.includes('"placesToVisit"') === false &&
            cleanedJson.length > 10000
          ) {
            console.log(
              "🔧 Detected truncated response, attempting smart completion..."
            );

            // Find the last complete object
            let lastCompletePos = -1;
            let braceCount = 0;
            let inString = false;

            for (let i = 0; i < cleanedJson.length; i++) {
              const char = cleanedJson[i];
              if (char === '"' && (i === 0 || cleanedJson[i - 1] !== "\\")) {
                inString = !inString;
              } else if (!inString) {
                if (char === "{") braceCount++;
                else if (char === "}") {
                  braceCount--;
                  if (braceCount === 1) lastCompletePos = i; // Mark position within main object
                }
              }
            }

            if (lastCompletePos > 0) {
              // Truncate at last complete position and close JSON properly
              cleanedJson = cleanedJson.substring(0, lastCompletePos + 1);

              // Add minimal placesToVisit array if missing
              if (!cleanedJson.includes('"placesToVisit"')) {
                cleanedJson =
                  cleanedJson.slice(0, -1) + ', "placesToVisit": []}';
              } else {
                cleanedJson += "}";
              }

              console.log("✅ Smart truncation recovery completed");
            }
          }

          // Standard JSON cleaning

          // Remove any markdown code blocks and extra text
          cleanedJson = cleanedJson
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .replace(/^[^{]*/, "") // Remove everything before first {
            .replace(/[^}]*$/, ""); // Remove everything after last }

          // Find JSON boundaries more carefully
          let jsonStart = -1;
          let braceCount = 0;
          let jsonEnd = -1;

          // Find the start of the JSON object
          for (let i = 0; i < cleanedJson.length; i++) {
            if (cleanedJson[i] === "{") {
              if (jsonStart === -1) jsonStart = i;
              braceCount++;
            } else if (cleanedJson[i] === "}") {
              braceCount--;
              if (braceCount === 0 && jsonStart !== -1) {
                jsonEnd = i + 1;
                break;
              }
            }
          }

          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            cleanedJson = cleanedJson.substring(jsonStart, jsonEnd);

            // Fix common JSON issues in order
            cleanedJson = cleanedJson
              .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
              .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote unquoted keys
              .replace(/,\s*,+/g, ",") // Remove multiple commas
              .replace(/([}\]]),(\s*[}\]])/g, "$1$2") // Remove comma before closing brackets
              .replace(/'/g, '"') // Replace single quotes with double quotes
              .replace(/(\w+):\s*([^",{\[\s][^,}]*[^,}\s])/g, '$1: "$2"') // Quote unquoted string values
              .replace(/"\s*\n\s*"/g, '" "') // Fix line breaks in strings
              .replace(/\n/g, " ") // Remove all line breaks
              .replace(/\s+/g, " "); // Normalize whitespace

            parsedTripData = JSON.parse(cleanedJson);
          } else {
            throw new Error("No valid JSON found in response");
          }
        } catch (cleanupError) {
          console.error("JSON cleanup failed:", cleanupError);

          // Create fallback data structure
          parsedTripData = {
            tripName: `Trip to ${formData.location}`,
            destination: formData.location,
            duration: `${formData.duration} days`,
            budget: formData.budget || `₱${customBudget}`,
            travelers: formData.travelers,
            startDate: formData.startDate,
            endDate: formData.endDate,
            currency: "PHP",
            hotels: [
              {
                hotelName: "Recommended Hotel",
                hotelAddress: `${formData.location}`,
                pricePerNight: "₱1,500 - ₱3,000",
                imageUrl:
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945",
                geoCoordinates: { latitude: 10.3157, longitude: 123.8854 },
                rating: 4.0,
                description:
                  "Basic itinerary created - regenerate for better results",
              },
            ],
            itinerary: Array.from(
              { length: parseInt(formData.duration) || 3 },
              (_, i) => ({
                day: i + 1,
                theme: `Day ${i + 1} Exploration`,
                planText:
                  "9:00 AM - Local Attraction - Detailed itinerary will be generated on retry (₱100 - ₱500, 2-3 hours, Rating: 4.0)",
                imageUrl:
                  "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
                geoCoordinates: { latitude: 10.3157, longitude: 123.8854 },
              })
            ),
            placesToVisit: [
              {
                placeName: "Popular Destination",
                placeDetails:
                  "Specific recommendations will be generated on retry",
                imageUrl:
                  "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
                geoCoordinates: { latitude: 10.3157, longitude: 123.8854 },
                ticketPricing: "₱100 - ₱500",
                timeTravel: "2-3 hours",
                rating: 4.0,
              },
            ],
            parseError: true,
          };

          toast(
            "⚠️ AI response had formatting issues. Created basic itinerary - please try generating again for better results."
          );
        }
      }

      if (!parsedTripData || typeof parsedTripData !== "object") {
        throw new Error("Parsed data is not a valid object");
      }

      // 🔍 GEOGRAPHIC VALIDATION - Check if places match destination
      console.log("🔍 Validating location consistency...");
      const { validateTripLocations, getValidationSummary } = await import(
        "../utils/locationValidator"
      );
      const locationValidation = validateTripLocations(
        parsedTripData,
        formData.location
      );

      // Log validation results
      console.log("📍 Location Validation Results:", locationValidation);
      console.log(getValidationSummary(locationValidation));

      // Warn about suspicious places (don't block, just notify)
      if (locationValidation.suspiciousPlaces.length > 0) {
        console.warn(
          `⚠️ Found ${locationValidation.suspiciousPlaces.length} places that may not be in ${formData.location}:`,
          locationValidation.suspiciousPlaces
        );

        // Optional: Toast warning to user
        if (locationValidation.errors.length > 0) {
          toast.warning("Location Verification", {
            description: `Some places in the itinerary may not be in ${formData.location}. Please review the trip details.`,
            duration: 5000,
          });
        }
      } else {
        console.log(`✅ All places validated for ${formData.location}`);
      }

      // 🏨✈️ ITINERARY VALIDATION - Check for hotel returns and airport logistics
      console.log(
        "🏨 Validating itinerary structure (hotel returns & airports)..."
      );
      const itineraryValidation = validateItinerary(parsedTripData, formData);

      // Log validation results
      console.log("📋 Itinerary Validation Results:", itineraryValidation);

      // Handle validation errors (critical issues)
      if (
        !itineraryValidation.isValid &&
        itineraryValidation.errors.length > 0
      ) {
        console.error(
          "❌ Itinerary validation failed:",
          itineraryValidation.errors
        );

        // Show specific error details to user
        const errorMessages = itineraryValidation.errors
          .map((err) => err.message)
          .join("\n");
        const suggestion = getValidationSuggestion(itineraryValidation);

        toast.error("Itinerary Validation Failed", {
          description: `The generated itinerary has critical issues:\n${errorMessages}\n\n${suggestion}`,
          duration: 10000,
        });

        // Log for debugging
        console.warn("🔍 Validation failed for trip:", {
          destination: formData.location,
          duration: formData.duration,
          errors: itineraryValidation.errors,
          warnings: itineraryValidation.warnings,
          suggestion: suggestion,
        });

        // Show retry option to user
        toast.info("Please Try Again", {
          description:
            "Click 'Generate Trip' to create a new itinerary with the correct structure.",
          duration: 8000,
        });

        setLoading(false);
        return; // Stop saving invalid itinerary
      }

      // Handle validation warnings (non-critical issues)
      if (itineraryValidation.warnings.length > 0) {
        console.warn(
          "⚠️ Itinerary has warnings:",
          itineraryValidation.warnings
        );

        // Show warnings but allow saving
        const warningMessages = itineraryValidation.warnings
          .slice(0, 3) // Show max 3 warnings
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
        flightPreferences: flightData, // Include flight preferences
        hotelPreferences: hotelData, // Include hotel preferences
        tripPreferences: sanitizeTripPreferences(flightData, hotelData), // Sanitized preferences summary
        langGraphResults: cleanLangGraphResults, // Use cleaned LangGraph results
        userProfile: userProfile, // Will be sanitized below
        tripData: parsedTripData, // Will be sanitized below
        realFlightData: flightResults || null, // Will be sanitized below
        realHotelData: hotelResults || null, // Include hotel data
        userEmail: user?.email,
        id: docId,
        createdAt: new Date().toISOString(),
        hasRealFlights: flightResults?.success || false,
        hasRealHotels: hotelResults?.success || false,
        flightSearchRequested: shouldIncludeFlights(flightData), // Track if user wanted flights
        hotelSearchRequested: shouldIncludeHotels(hotelData), // Track if user wanted hotels
        langGraphUsed: activeServices.hasAnyAgent, // Track LangGraph usage
        isPersonalized: true, // Flag to indicate this trip was created with profile data
      };

      // Sanitize the entire document to ensure Firebase compatibility
      const sanitizedTripDocument = sanitizeForFirebase(tripDocument);

      console.log("📋 Saving sanitized trip document:", sanitizedTripDocument);

      await setDoc(doc(db, "AITrips", docId), sanitizedTripDocument);

      const hasRealFlights =
        flightResults?.success &&
        !flightResults?.fallback &&
        !flightResults?.message?.includes("Mock");
      const hasRealHotels = hotelResults?.success && !hotelResults?.fallback;

      // Single celebratory success message - main notification user sees
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
              formData={formData} // Pass trip details for smart estimation
              flightData={flightData} // Pass flight info for cost calculation
              userProfile={userProfile} // Pass profile for budget override detection
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

  // Show loading while checking profile
  if (profileLoading) {
    return <ProfileLoading />;
  }

  // Show message if profile not found
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
