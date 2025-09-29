// src/config/langGraphAgent.jsx - Client-side adapter for Django LangGraph
import { API_CONFIG } from "../constants/options";

/**
 * LangGraph Travel Agent - Client Adapter for Django Backend
 * This class communicates with the Django LangGraph API instead of running locally
 */
export class LangGraphTravelAgent {
  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/langgraph`;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Main orchestration method - calls Django LangGraph API
   * @param {Object} tripParams - Trip planning parameters
   * @returns {Object} Comprehensive travel plan with flights and hotels
   */
  async orchestrateTrip(tripParams) {
    console.log(
      "🤖 LangGraph: Starting Django backend orchestration",
      tripParams
    );

    try {
      // Prepare request data for Django API
      const requestData = this.prepareRequestData(tripParams);

      // Call Django LangGraph API
      const response = await fetch(`${this.baseUrl}/execute/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(
          `LangGraph API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "LangGraph execution failed");
      }

      // Transform Django response to expected format
      const transformedResults = this.transformDjangoResponse(data);

      console.log(
        "✅ LangGraph Django orchestration completed",
        transformedResults
      );
      return transformedResults;
    } catch (error) {
      console.error("❌ LangGraph Django orchestration failed:", error);

      // Return error result instead of fallback
      return {
        success: false,
        error: error.message,
        flights: { success: false, flights: [], error: error.message },
        hotels: { success: false, hotels: [], error: error.message },
        merged_data: null,
        optimized_plan: null,
        errors: [{ agent: "coordinator", error: error.message }],
      };
    }
  }

  /**
   * Prepare request data for Django API
   */
  prepareRequestData(tripParams) {
    return {
      destination: tripParams.destination,
      startDate: tripParams.startDate,
      endDate: tripParams.endDate,
      duration: tripParams.duration || 3,
      travelers: tripParams.travelers,
      budget: tripParams.budget,
      user_email: this.getCurrentUserEmail(),
      flightData: tripParams.flightData || {},
      hotelData: tripParams.hotelData || {},
      userProfile: tripParams.userProfile || {},
    };
  }

  /**
   * Get current user email from localStorage
   */
  getCurrentUserEmail() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.email || "anonymous@example.com";
    } catch {
      return "anonymous@example.com";
    }
  }

  /**
   * Transform Django API response to expected frontend format
   */
  transformDjangoResponse(data) {
    const results = data.results || {};

    return {
      success: true,
      session_id: data.session_id,

      // Extract flight results
      flights: results.flights
        ? {
            success: results.flights.success || false,
            flights: results.flights.flights || [],
            current_price: results.flights.current_price || "typical",
            source: "django_langgraph",
            langgraph_analysis: results.flights.langgraph_analysis,
          }
        : null,

      // Extract hotel results
      hotels: results.hotels
        ? {
            success: results.hotels.success || false,
            hotels: results.hotels.hotels || [],
            location: results.hotels.location,
            source: "django_langgraph",
            langgraph_analysis: results.hotels.langgraph_analysis,
          }
        : null,

      // Extract merged/optimized data
      merged_data: {
        destination: results.trip_params?.destination,
        dateRange: {
          start: results.trip_params?.start_date,
          end: results.trip_params?.end_date,
        },
        travelers: results.trip_params?.travelers,
        budget: results.trip_params?.budget,
        total_estimated_cost: results.total_estimated_cost || 0,
        cost_breakdown: results.cost_breakdown || {},
        recommended_flight: results.recommended_flight,
        recommended_hotel: results.recommended_hotel,
      },

      // Extract optimization results
      optimized_plan: {
        optimization_score: results.optimization_score || 0,
        cost_efficiency: results.cost_efficiency || "unknown",
        convenience_score: results.convenience_score || 0,
        personalization_match: results.personalization_score || 0,
        final_recommendations: results.recommendations || [],
      },

      // Error handling
      errors: results.agent_errors || [],
    };
  }
}

export default LangGraphTravelAgent;
