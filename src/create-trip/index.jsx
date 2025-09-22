// src/create-trip/index.jsx
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { chatSession } from "../config/aimodel";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { AI_PROMPT } from "../constants/options";
import { FlightAgent } from "../config/flightAgent";

// Import components
import LocationSelector from "./components/LocationSelector";
import DateRangePicker from "./components/DateRangePicker";
import BudgetSelector from "./components/BugetSelector";
import TravelerSelector from "./components/TravelerSelector";
import SpecificRequests from "./components/SpecificRequests";
import GenerateTripButton from "./components/GenerateTripButton";
import LoginDialog from "./components/LoginDialog";

function CreateTrip() {
  // State management
  const [place, setPlace] = useState(null);
  const [formData, setFormData] = useState({});
  const [customBudget, setCustomBudget] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flightLoading, setFlightLoading] = useState(false);

  const navigate = useNavigate();

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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setFlightLoading(true);

    try {
      console.log("🔍 Starting flight search...");

      const flightResults = await FlightAgent.searchFlights({
        from_airport: "MNL",
        to_airport: FlightAgent.extractAirportCode(formData.location),
        departure_date: formData.startDate,
        return_date: formData.endDate,
        adults: FlightAgent.parseAdults(formData.travelers),
        trip_type: "round-trip",
      });

      setFlightLoading(false);

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

      enhancedPrompt += `

📅 TRAVEL DATES:
Start Date: ${formData.startDate}
End Date: ${formData.endDate}
Duration: ${formData.duration} days

Please create the itinerary for these exact dates.`;

      if (flightResults.success && flightResults.flights.length > 0) {
        const flightInfo = `

🛫 REAL FLIGHT OPTIONS AVAILABLE:
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

⚠️ Note: Real-time flight data unavailable. Please provide estimated flight costs for ${formData.location}.
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

  const SaveAiTrip = async (TripData, flightData = null) => {
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
          const jsonMatch = TripData.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const cleanedJson = jsonMatch[0];
            parsedTripData = JSON.parse(cleanedJson);
          } else {
            throw new Error("No valid JSON found in response");
          }
        } catch (cleanupError) {
          console.error("JSON cleanup failed:", cleanupError);

          try {
            let fixedJson = TripData.replace(/,(\s*[}```])/g, "$1")
              .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
              .trim();

            const jsonStart = fixedJson.indexOf("{");
            const jsonEnd = fixedJson.lastIndexOf("}") + 1;

            if (jsonStart !== -1 && jsonEnd > jsonStart) {
              fixedJson = fixedJson.substring(jsonStart, jsonEnd);
              parsedTripData = JSON.parse(fixedJson);
            } else {
              throw new Error("Could not extract valid JSON");
            }
          } catch (finalError) {
            console.error("All JSON parsing attempts failed:", finalError);
            toast("The AI generated an invalid response. Please try again.");
            setLoading(false);
            return;
          }
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
        tripData: parsedTripData,
        realFlightData: flightData || null,
        userEmail: user?.email,
        id: docId,
        createdAt: new Date().toISOString(),
        hasRealFlights: flightData?.success || false,
      };

      await setDoc(doc(db, "AITrips", docId), tripDocument);

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

  return (
    <div className="sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5 mt-10">
      <h2 className="text-3xl font-bold">Customize your adventure</h2>
      <p className="mt-3 text-gray-500 text-xl">
        Tell us a little about yourself, and Travel Rover will craft a
        personalized itinerary designed around your preferences.
      </p>

      <div className="mt-20 flex flex-col gap-10">
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

        <SpecificRequests
          value={formData?.specificRequests}
          onChange={handleSpecificRequestsChange}
        />

        <GenerateTripButton
          loading={loading}
          flightLoading={flightLoading}
          onClick={OnGenerateTrip}
        />

        <LoginDialog open={openDialog} onGoogleLogin={() => googleLogin()} />
      </div>
    </div>
  );
}

export default CreateTrip;
