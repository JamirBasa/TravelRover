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
import BudgetSelector from "./components/BugetSelector";
import TravelerSelector from "./components/TravelerSelector";
import SpecificRequests from "./components/SpecificRequests";
import FlightPreferences from "./components/FlightPreferences";
import HotelPreferences from "./components/HotelPreferences";
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
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          toast.error("Invalid start date", {
            description:
              "Your trip cannot start in the past. Please choose a future date.",
          });
          return false;
        }
        if (endDate <= startDate) {
          toast.error("Invalid end date", {
            description:
              "Your return date should be after your departure date.",
          });
          return false;
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
        console.log("� Starting LangGraph GA-First itinerary generation (no flights/hotels)...");
      }

      const langGraphAgent = new LangGraphTravelAgent();

      const tripParams = {
        destination: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: formData.duration,
        travelers: formData.travelers,
        budget: customBudget ? `Custom: ₱${customBudget}` : formData.budget,
        flightData: flightData,
        hotelData: hotelData,
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
      let enhancedPrompt = AI_PROMPT.replace("{location}", formData?.location)
        .replace("{duration}", formData?.duration + " days")
        .replace("{travelers}", formData?.travelers)
        .replace(
          "{budget}",
          customBudget ? `Custom: ₱${customBudget}` : formData?.budget
        )
        .replace(
          "{specificRequests}",
          formData?.specificRequests ||
            "No specific requests - create a balanced itinerary"
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

      enhancedPrompt += `

👤 USER PROFILE INFORMATION:
- Full Name: ${userFullName}
- Location: ${userProfile.address?.city || "Manila"}, ${
        userProfile.address?.province ||
        userProfile.address?.region ||
        "Philippines"
      }
- Preferred Trip Types: ${
        userProfile.preferredTripTypes?.join(", ") || "General travel"
      }
- Travel Style: ${userProfile.travelStyle || "Not specified"}
- Budget Range: ${userProfile.budgetRange || "Moderate"}
- Accommodation Preference: ${
        userProfile.accommodationPreference || "Not specified"
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

📅 TRAVEL DATES:
Start Date: ${formData.startDate}
End Date: ${formData.endDate}
Duration: ${formData.duration} days

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

🚨 CRITICAL JSON REQUIREMENTS:
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
            />
            <SpecificRequests
              value={formData?.specificRequests}
              onChange={handleSpecificRequestsChange}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <BudgetSelector
              value={formData?.budget}
              customValue={customBudget}
              onBudgetChange={handleBudgetChange}
              onCustomBudgetChange={setCustomBudget}
              error={null}
            />
            <TravelerSelector
              selectedTravelers={formData?.travelers}
              onTravelersChange={handleTravelersChange}
            />
          </div>
        );
      case 3:
        return (
          <FlightPreferences
            flightData={flightData}
            onFlightDataChange={handleFlightDataChange}
            userProfile={userProfile}
          />
        );
      case 4:
        return (
          <HotelPreferences
            hotelData={hotelData}
            onHotelDataChange={handleHotelDataChange}
            formData={formData}
            userProfile={userProfile}
          />
        );
      case 5:
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Create Your Perfect Trip
            </h1>
            <p className="text-gray-600 text-lg">
              Plan personalized travel experiences tailored just for you
            </p>
          </div>

          {/* User Profile Summary */}
          {userProfile &&
            (() => {
              const profileSummary =
                UserProfileService.getProfileDisplaySummary(userProfile);
              return (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <FaUser className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900 text-lg">
                          Welcome back, {profileSummary.name}!
                        </h3>
                        <p className="text-blue-700 text-sm font-medium mt-1">
                          Creating personalized trips based on your preferences:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profileSummary.preferredTripTypes
                            ?.slice(0, 2)
                            .map((typeLabel, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {typeLabel}
                              </span>
                            ))}
                          {profileSummary.preferredTripTypes?.length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              +{profileSummary.preferredTripTypes.length - 2}{" "}
                              more
                            </span>
                          )}
                        </div>
                        {profileSummary.travelStyle && (
                          <p className="text-blue-600 text-xs mt-2">
                            <span className="font-medium">Travel Style:</span>{" "}
                            {profileSummary.travelStyle}
                          </p>
                        )}
                        {profileSummary.hasLocationData && (
                          <p className="text-blue-600 text-xs mt-1">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
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
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
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
                        className={`hidden sm:block w-16 lg:w-24 h-0.5 mx-3 transition-all ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-gray-600">
                {STEPS[currentStep - 1].description}
              </p>
            </div>

            <Progress value={progress} className="w-full h-3 mb-2" />
            <div className="text-center text-sm text-gray-500">
              Step {currentStep} of {STEPS.length}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-12">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-8 py-3"
            >
              <FaArrowLeft />
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStep < STEPS.length ? (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-black hover:bg-gray-800 px-8 py-3"
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
