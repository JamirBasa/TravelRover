// src/config/flightAgent.js
const API_BASE_URL = "http://localhost:8000/api";

export const FlightAgent = {
  async searchFlights(params) {
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
      return {
        success: false,
        error: error.message,
        flights: [],
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
    const airportMap = {
      Manila: "MNL",
      Cebu: "CEB",
      Davao: "DVO",
      Palawan: "PPS",
      "Puerto Princesa": "PPS",
      Boracay: "KLO",
      Kalibo: "KLO",
      Bohol: "TAG",
      Tagbilaran: "TAG",
      Siargao: "IAO",
      Clark: "CRK",
      Iloilo: "ILO",
      Bacolod: "BCD",
    };

    const city = location.split(",")[0].trim();

    for (const [key, code] of Object.entries(airportMap)) {
      if (
        city.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(city.toLowerCase())
      ) {
        return code;
      }
    }

    return "MNL"; // Default to Manila
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
    const departureDate = new Date(today);
    departureDate.setDate(today.getDate() + 7); // Start trip in 7 days

    const returnDate = new Date(departureDate);
    returnDate.setDate(departureDate.getDate() + parseInt(duration));

    return {
      departure: departureDate.toISOString().split("T")[0],
      return: returnDate.toISOString().split("T")[0],
    };
  },
};
