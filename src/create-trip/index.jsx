// src/create-trip/index.jsx
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { chatSession } from "../config/aimodel";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { AI_PROMPT } from "../constants/options";
import { FlightAgent } from "../config/flightAgent";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCog,
  FaPlane,
  FaCheck,
  FaArrowRight,
  FaArrowLeft,
  FaUser,
} from "react-icons/fa";

// Import components
import LocationSelector from "./components/LocationSelector";
import DateRangePicker from "./components/DateRangePicker";
import BudgetSelector from "./components/BugetSelector";
import TravelerSelector from "./components/TravelerSelector";
import SpecificRequests from "./components/SpecificRequests";
import FlightPreferences from "./components/FlightPreferences";
import ReviewTripStep from "./components/ReviewTripStep";
import GenerateTripButton from "./components/GenerateTripButton";
import LoginDialog from "./components/LoginDialog";

const STEPS = [
  {
    id: 1,
    title: "Destination & Dates",
    description: "Where, when, and special requests for your trip",
    icon: FaMapMarkerAlt,
  },
  {
    id: 2,
    title: "Travel Preferences",
    description: "Budget and group size preferences",
    icon: FaCog,
  },
  {
    id: 3,
    title: "Flight Options",
    description: "Include flights in your itinerary",
    icon: FaPlane,
  },
  {
    id: 4,
    title: "Review & Generate",
    description: "Confirm details and create your trip",
    icon: FaCheck,
  },
];

function CreateTrip() {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [place, setPlace] = useState(null);
  const [formData, setFormData] = useState({});
  const [customBudget, setCustomBudget] = useState("");
  const [flightData, setFlightData] = useState({
    includeFlights: false,
    departureCity: "",
    departureRegion: "",
    departureRegionCode: "",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flightLoading, setFlightLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const navigate = useNavigate();
  const progress = (currentStep / STEPS.length) * 100;

  // Check user profile on component mount
  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.email) {
        setProfileLoading(false);
        return;
      }

      const docRef = doc(db, "UserProfiles", user.email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data();
        setUserProfile(profile);
        // Pre-fill form data with user preferences
        setFormData((prev) => ({
          ...prev,
          budget: profile.budgetRange || "",
          travelers: profile.travelStyle || "",
        }));
      } else {
        // Profile doesn't exist, redirect to profile setup
        navigate("/user-profile");
        return;
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
    setProfileLoading(false);
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

  // Step validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Destination & Dates
        if (!formData?.location) {
          toast.error("Please select your destination");
          return false;
        }
        if (!formData?.startDate || !formData?.endDate) {
          toast.error("Please select your travel dates");
          return false;
        }
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          toast.error("Start date cannot be in the past");
          return false;
        }
        if (endDate <= startDate) {
          toast.error("End date must be after start date");
          return false;
        }
        break;

      case 2: // Travel Preferences
        if (!formData?.travelers) {
          toast.error("Please select your group size");
          return false;
        }
        if (!formData?.budget && !customBudget) {
          toast.error("Please select or enter your budget");
          return false;
        }
        break;

      case 3: // Flight Options
        if (flightData.includeFlights && !flightData.departureCity) {
          toast.error("Please specify your departure city for flight search");
          return false;
        }
        break;

      case 4: // Review & Generate - no additional validation needed
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
      toast("Please fill all the details including travel dates.");
      return false;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      toast("Start date cannot be in the past.");
      return false;
    }

    if (endDate <= startDate) {
      toast("End date must be after start date.");
      return false;
    }

    if (!formData?.budget && !customBudget) {
      toast("Please select or enter your budget.");
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
      toast("Please complete your profile first");
      navigate("/user-profile");
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);

    let flightResults = null;

    try {
      // Only search for flights if user requested it
      if (flightData.includeFlights) {
        setFlightLoading(true);
        console.log("🔍 Starting flight search...");
        console.log("📍 Departure City:", flightData.departureCity);
        console.log("📍 Destination:", formData.location);

        const fromAirport = FlightAgent.extractAirportCode(
          flightData.departureCity
        );
        const toAirport = FlightAgent.extractAirportCode(formData.location);

        console.log("✈️ Airport Codes:", { from: fromAirport, to: toAirport });

        flightResults = await FlightAgent.searchFlights({
          from_airport: fromAirport,
          to_airport: toAirport,
          departure_date: formData.startDate,
          return_date: formData.endDate,
          adults: FlightAgent.parseAdults(formData.travelers),
          trip_type: "round-trip",
        });

        setFlightLoading(false);
      } else {
        console.log("🚫 Skipping flight search - user opted out");
      }

      // Enhanced prompt with user profile data
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

      // Add user profile context to the prompt
      enhancedPrompt += `

👤 USER PROFILE INFORMATION:
- Full Name: ${userProfile.fullName}
- Location: ${userProfile.address?.city}, ${userProfile.address?.province}
- Preferred Trip Types: ${userProfile.preferredTripTypes?.join(", ")}
- Travel Style: ${userProfile.travelStyle}
- Budget Range: ${userProfile.budgetRange}
- Accommodation Preference: ${userProfile.accommodationPreference}

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

Please create a highly personalized itinerary for these exact dates.`;

      // Handle flight information in prompt
      if (flightData.includeFlights) {
        if (flightResults?.success && flightResults.flights.length > 0) {
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

      console.log("📝 Final prompt:", enhancedPrompt);

      const result = await chatSession.sendMessage(enhancedPrompt);
      console.log("🎉 Generated trip:", result?.response.text());

      SaveAiTrip(result?.response.text(), flightResults);
    } catch (error) {
      console.error("❌ Trip generation error:", error);
      toast("Error generating trip: " + error.message);
      setLoading(false);
      setFlightLoading(false);
    }
  };

  // Function to sanitize data for Firebase (no nested arrays)
  const sanitizeForFirebase = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      // Convert array to a serialized string representation for Firebase
      return obj.map((item) => sanitizeForFirebase(item));
    }

    if (typeof obj === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          // Handle specific known nested array structures
          if (key === "plan" && value.length > 0) {
            // Convert plan array to formatted text
            sanitized[`${key}Text`] = value
              .map(
                (item) =>
                  `${item.time || ""} - ${item.placeName || ""} - ${
                    item.placeDetails || ""
                  } (${item.ticketPricing || ""}, ${
                    item.timeTravel || ""
                  }, Rating: ${item.rating || "N/A"})`
              )
              .join(" | ");
          } else if (key === "flights" && value.length > 0) {
            // Keep flights array but sanitize each flight
            sanitized[key] = value.map((flight) => sanitizeForFirebase(flight));
          } else {
            // For other arrays, convert to comma-separated string
            sanitized[key] = value
              .map((item) =>
                typeof item === "object"
                  ? JSON.stringify(sanitizeForFirebase(item))
                  : String(item)
              )
              .join(", ");
          }
        } else {
          sanitized[key] = sanitizeForFirebase(value);
        }
      }
      return sanitized;
    }

    return obj;
  };

  const SaveAiTrip = async (TripData, flightResults = null) => {
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const docId = Date.now().toString();

      let parsedTripData;
      try {
        parsedTripData = JSON.parse(TripData);
      } catch (e) {
        console.error("Initial parse failed, attempting to clean JSON:", e);

        try {
          // More aggressive JSON cleaning
          let cleanedJson = TripData;

          // Remove any markdown code blocks
          cleanedJson = cleanedJson
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "");

          // Find JSON boundaries
          const jsonStart = cleanedJson.indexOf("{");
          const jsonEnd = cleanedJson.lastIndexOf("}") + 1;

          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            cleanedJson = cleanedJson.substring(jsonStart, jsonEnd);

            // Fix common JSON issues
            cleanedJson = cleanedJson
              .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
              .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote unquoted keys
              .replace(/,\s*,/g, ",") // Remove double commas
              .replace(/'/g, '"'); // Replace single quotes with double quotes

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
        userProfile: userProfile, // Will be sanitized below
        tripData: parsedTripData, // Will be sanitized below
        realFlightData: flightResults || null, // Will be sanitized below
        userEmail: user?.email,
        id: docId,
        createdAt: new Date().toISOString(),
        hasRealFlights: flightResults?.success || false,
        flightSearchRequested: flightData.includeFlights, // Track if user wanted flights
        isPersonalized: true, // Flag to indicate this trip was created with profile data
      };

      // Sanitize the entire document to ensure Firebase compatibility
      const sanitizedTripDocument = sanitizeForFirebase(tripDocument);

      console.log("📋 Saving sanitized trip document:", sanitizedTripDocument);

      await setDoc(doc(db, "AITrips", docId), sanitizedTripDocument);

      toast("🎉 Trip saved successfully with real flight data!");
      navigate("/view-trip/" + docId);
    } catch (error) {
      console.error("Error saving trip: ", error);
      toast("Failed to save trip: " + (error.message || "Permission denied"));
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
        toast("Failed to get user profile");
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
              onLocationChange={handleLocationChange}
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
          <ReviewTripStep
            formData={formData}
            customBudget={customBudget}
            flightData={flightData}
            userProfile={userProfile}
            place={place}
          />
        );
      default:
        return (
          <LocationSelector
            place={place}
            onPlaceChange={setPlace}
            onLocationChange={handleLocationChange}
          />
        );
    }
  };

  // Show loading while checking profile
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // Show message if profile not found
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Complete Your Profile First
          </h2>
          <p className="text-gray-600 mb-6">
            To create personalized travel itineraries, we need to know your
            preferences, dietary requirements, and travel style.
          </p>
          <button
            onClick={() => navigate("/user-profile")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
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
          {userProfile && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaUser className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800">
                      Welcome back,{" "}
                      {userProfile.firstName || userProfile.fullName}!
                    </h3>
                    <p className="text-blue-600 text-sm">
                      Creating personalized trips based on your preferences:{" "}
                      {userProfile.preferredTripTypes?.slice(0, 2).join(", ")}
                      {userProfile.preferredTripTypes?.length > 2 &&
                        ` +${userProfile.preferredTripTypes.length - 2} more`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/user-profile")}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Update Profile
                </button>
              </div>
            </div>
          )}
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
                  onClick={OnGenerateTrip}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginDialog open={openDialog} onGoogleLogin={() => googleLogin()} />
    </div>
  );
}

export default CreateTrip;
