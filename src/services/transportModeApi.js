/**
 * Transport Mode API Service
 * Calls the Django backend transport mode analysis endpoint
 */

const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const TRANSPORT_MODE_URL = `${BACKEND_BASE_URL}/langgraph/transport-mode/`;

/**
 * Analyze transport mode using Django backend
 * @param {string} departureCity - Departure city name
 * @param {string} destination - Destination city name
 * @param {boolean} includeFlights - Whether to include flight options
 * @returns {Promise<Object>} Transport mode analysis result
 */
export const analyzeTransportMode = async (
  departureCity,
  destination,
  includeFlights = true
) => {
  try {
    console.log(`🚌 Calling transport mode API: ${departureCity} → ${destination}`);
    
    const response = await fetch(TRANSPORT_MODE_URL, {
      method: "POST",
      mode: "cors",
      credentials: "omit",  // Use 'omit' for simpler CORS, can change to 'include' if needed
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        departure_city: departureCity,
        destination: destination,
        include_flights: includeFlights,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Transport mode analysis failed");
    }

    console.log(`✅ Transport mode API response:`, data);
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(`❌ Transport mode API error:`, error);
    return {
      success: false,
      error: error.message,
      fallback: true,
    };
  }
};

/**
 * Check if Django backend is available
 * @returns {Promise<boolean>} True if backend is healthy
 */
export const checkBackendHealth = async () => {
  try {
    const healthUrl = `${BACKEND_BASE_URL}/langgraph/health/`;
    const response = await fetch(healthUrl, { timeout: 3000 });
    return response.ok;
  } catch (error) {
    console.warn("⚠️ Django backend not available:", error.message);
    return false;
  }
};

export default {
  analyzeTransportMode,
  checkBackendHealth,
};
