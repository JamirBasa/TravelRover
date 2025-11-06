// src/config/flightAgent.js
import { buildApiUrl } from "./apiConfig";
import { FLIGHT_CONFIG } from "../constants/options";
import { getAirportCode } from "../data/airports";

// ⚙️ Configuration
const API_BASE_URL = buildApiUrl("");
const USE_MOCK_DATA = false; // 🎭 Set to false when backend server is running

// 🛠️ Development Note:
// When USE_MOCK_DATA = true: Uses realistic mock flight data
// When USE_MOCK_DATA = false: Connects to Django backend at localhost:8000
// Falls back to mock data automatically if backend connection fails

// Mock flight data for development
const generateMockFlights = (params) => {
  const airlines = [
    { name: "Philippine Airlines", code: "PR" },
    { name: "Cebu Pacific", code: "5J" },
    { name: "AirAsia Philippines", code: "Z2" },
    { name: "Philippines AirAsia", code: "Z2" },
  ];

  const mockFlights = [];

  for (let i = 0; i < 3; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const basePrice = 3000 + Math.random() * 8000; // ₱3,000 - ₱11,000
    const duration = `${2 + Math.floor(Math.random() * 4)}h ${Math.floor(
      Math.random() * 60
    )}m`;
    const stops = Math.random() > 0.6 ? 0 : 1;

    mockFlights.push({
      id: `${airline.code}${Math.floor(Math.random() * 1000)}`,
      name: `${airline.name} ${airline.code}${
        Math.floor(Math.random() * 900) + 100
      }`,
      price: `₱${Math.floor(basePrice).toLocaleString()}`,
      departure: `${6 + Math.floor(Math.random() * 12)}:${Math.floor(
        Math.random() * 60
      )
        .toString()
        .padStart(2, "0")} ${Math.random() > 0.5 ? "AM" : "PM"}`,
      arrival: `${8 + Math.floor(Math.random() * 10)}:${Math.floor(
        Math.random() * 60
      )
        .toString()
        .padStart(2, "0")} ${Math.random() > 0.5 ? "AM" : "PM"}`,
      duration: duration,
      stops: stops,
      aircraft: "Airbus A320",
      is_best: i === 0, // First flight is "best"
      class: "Economy",
    });
  }

  return mockFlights.sort((a, b) => {
    // Sort by price (remove ₱ and commas, then compare)
    const priceA = parseInt(a.price.replace(/₱|,/g, ""));
    const priceB = parseInt(b.price.replace(/₱|,/g, ""));
    return priceA - priceB;
  });
};

export const FlightAgent = {
  async searchFlights(params) {
    if (USE_MOCK_DATA) {
      console.log("🎭 Using mock flight data (backend not available)");
      console.log("🔍 Mock search params:", params);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockFlights = generateMockFlights(params);

      const mockResponse = {
        success: true,
        flights: mockFlights,
        current_price: mockFlights.length > 0 ? "Normal" : "High",
        search_params: params,
        message: "Mock flight data - backend not connected",
      };

      console.log("✈️ Mock flight results:", mockResponse);
      return mockResponse;
    }

    try {
      console.log("🔍 Searching flights with params:", params);

      const response = await fetch(`${API_BASE_URL}/search-flights/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✈️ Flight search results:", data);
      return data;
    } catch (error) {
      console.error("❌ Flight search failed:", error);

      // Fallback to mock data if backend fails
      console.log("🎭 Falling back to mock flight data");
      const mockFlights = generateMockFlights(params);

      return {
        success: true,
        flights: mockFlights,
        current_price: "Normal",
        fallback: true,
        message: "Using mock data - backend unavailable",
      };
    }
  },

  async searchAirports(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/airports/?q=${query}`);
      const data = await response.json();
      return data.airports;
    } catch (error) {
      console.error("Airport search failed:", error);
      return [];
    }
  },

  extractAirportCode(location) {
    // ✅ Use centralized airport data from src/data/airports.js
    return getAirportCode(location);
  },

  parseAdults(travelers) {
    const mapping = {
      "Just Me": 1,
      "A Couple": 2,
      Family: 4,
      Friends: 3,
    };
    return mapping[travelers] || 1;
  },

  calculateDates(duration) {
    const today = new Date();

    // Create departure date 7 days from now using local date construction
    const departureDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 7,
      0,
      0,
      0,
      0
    );

    // Create return date based on duration
    const durationDays = parseInt(duration) || 3;
    const returnDate = new Date(
      departureDate.getFullYear(),
      departureDate.getMonth(),
      departureDate.getDate() + durationDays,
      0,
      0,
      0,
      0
    );

    // Format as YYYY-MM-DD without timezone conversion
    const formatDateLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      departure: formatDateLocal(departureDate),
      return: formatDateLocal(returnDate),
    };
  },

  // Helper method to extract flight parameters from user profile and trip data
  buildFlightSearchParams(userProfile, tripData, destination) {
    console.log("🔧 Building flight search params from:", {
      userProfile,
      tripData,
      destination,
    });

    // Extract departure location from user profile
    const departureCity = userProfile?.address?.city || "Manila";
    const departureAirport = this.extractAirportCode(departureCity);

    // Extract destination airport
    const destinationAirport = this.extractAirportCode(destination);

    // Extract travel dates
    const dates = tripData.duration
      ? this.calculateDates(tripData.duration)
      : {
          departure: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          return: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        };

    // Extract number of travelers
    const adults = this.parseAdults(tripData.travelers || "Just Me");

    const params = {
      from_airport: departureAirport,
      to_airport: destinationAirport,
      departure_date: dates.departure,
      return_date: dates.return,
      adults: adults,
      trip_type: "round-trip", // Default to round trip
    };

    console.log("✈️ Generated flight search params:", params);
    return params;
  },
};
