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
    if (!location) return "MNL";

    const airportMap = {
      Manila: "MNL",
      "Metro Manila": "MNL",
      "Manila City": "MNL",
      Cebu: "CEB",
      "Cebu City": "CEB",
      Davao: "DVO",
      "Davao City": "DVO",
      Palawan: "PPS",
      "Puerto Princesa": "PPS",
      "El Nido": "PPS",
      Coron: "PPS",
      Boracay: "KLO",
      Malay: "KLO", // Boracay's actual municipality
      Kalibo: "KLO",
      Bohol: "TAG",
      Tagbilaran: "TAG",
      "Tagbilaran City": "TAG",
      Siargao: "IAO",
      "General Luna": "IAO",
      Clark: "CRK",
      Angeles: "CRK",
      "Angeles City": "CRK",
      Iloilo: "ILO",
      "Iloilo City": "ILO",
      Bacolod: "BCD",
      "Bacolod City": "BCD",
      Dumaguete: "DGT",
      "Dumaguete City": "DGT",
      Cagayan: "CGY",
      "Cagayan de Oro": "CGY",
      Butuan: "BXU",
      Surigao: "SUG",
      Zamboanga: "ZAM",
    };

    // Clean the location string - handle various formats
    const locationLower = location.toLowerCase();
    const city = location.split(",")[0].trim();
    const cityLower = city.toLowerCase();

    console.log(
      `🔍 Extracting airport code for: "${location}" -> City: "${city}"`
    );

    // Direct exact matches first
    for (const [key, code] of Object.entries(airportMap)) {
      const keyLower = key.toLowerCase();

      // Check if the key matches the full location or city part
      if (cityLower === keyLower || locationLower.includes(keyLower)) {
        console.log(`✅ Found exact match: ${key} -> ${code}`);
        return code;
      }
    }

    // Partial matches - check if any airport city is contained in the location
    for (const [key, code] of Object.entries(airportMap)) {
      const keyLower = key.toLowerCase();

      if (
        cityLower.includes(keyLower) ||
        keyLower.includes(cityLower) ||
        locationLower.includes(keyLower)
      ) {
        console.log(`✅ Found partial match: ${key} -> ${code}`);
        return code;
      }
    }

    console.log(
      `⚠️ No airport code found for "${location}", defaulting to MNL`
    );
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
    departureDate.setDate(today.getDate() + 7);

    const returnDate = new Date(departureDate);
    returnDate.setDate(departureDate.getDate() + parseInt(duration));

    return {
      departure: departureDate.toISOString().split("T")[0],
      return: returnDate.toISOString().split("T")[0],
    };
  },
};
