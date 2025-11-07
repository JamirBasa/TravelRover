// src/config/langGraphAgent.jsx - Client-side adapter for Django LangGraph
import {
  API_CONFIG,
  API_ENDPOINTS,
  buildApiUrl,
  getTimeout,
} from "./apiConfig";

/**
 * LangGraph Travel Agent - Client Adapter for Django Backend
 * This class communicates with the Django LangGraph API instead of running locally
 */
export class LangGraphTravelAgent {
  constructor() {
    this.baseUrl = buildApiUrl("/langgraph");
    this.timeout = getTimeout("max"); // Use maximum timeout for complex LangGraph operations
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

      // ✅ Build the request URL using canonical endpoints to avoid env mismatch
      const requestUrl = buildApiUrl(API_ENDPOINTS.LANGGRAPH.EXECUTE);
      console.log("🔍 Request URL:", requestUrl);
      console.log("🔍 Request Data:", requestData);

      // Create a promise that races between fetch and timeout
      const fetchPromise = fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${this.timeout}ms`)),
          this.timeout
        )
      );

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        // ✅ Try to get detailed error from response body
        let errorDetail = `${response.status} ${response.statusText}`;
        let errorData = null;

        try {
          errorData = await response.json();
          errorDetail = errorData.error || errorData.message || errorDetail;
          console.error("🔍 Django API Error Details:", {
            status: response.status,
            statusText: response.statusText,
            url: requestUrl,
            errorData: errorData,
          });
        } catch (parseError) {
          // If response is not JSON, log raw response
          console.error("🔍 Non-JSON Error Response:", {
            status: response.status,
            statusText: response.statusText,
            url: requestUrl,
            message: "Response body is not JSON",
            parseError: parseError.message,
          });
        }

        // ✅ SPECIFIC 404 ERROR HANDLING
        if (response.status === 404) {
          throw new Error(
            `LangGraph endpoint not found (404).\n` +
              `URL: ${requestUrl}\n` +
              `Make sure Django server is running on http://localhost:8000\n` +
              `Error: ${errorDetail}`
          );
        }

        throw new Error(`LangGraph API error: ${errorDetail}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error("🔍 Django Response Error:", data);
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

      const errorMessage = error.message || "Unknown error occurred";

      // Return error result instead of fallback
      return {
        success: false,
        error: errorMessage,
        flights: { success: false, flights: [], error: errorMessage },
        hotels: { success: false, hotels: [], error: errorMessage },
        merged_data: null,
        optimized_plan: null,
        errors: [{ agent: "coordinator", error: errorMessage }],
      };
    }
  }

  /**
   * Prepare request data for Django API
   */
  prepareRequestData(tripParams) {
    // ✅ Normalize budget value for Django backend
    const normalizeBudget = (budget) => {
      if (!budget) return "moderate"; // Default fallback

      // If already starts with "Custom:", pass through
      if (budget.startsWith("Custom:")) {
        return budget;
      }

      // Map frontend budget names to backend expected values
      const budgetMap = {
        "Budget-Friendly": "budget",
        Budget: "budget",
        "budget-friendly": "budget",
        budgetfriendly: "budget",
        Moderate: "moderate",
        moderate: "moderate",
        Luxury: "luxury",
        luxury: "luxury",
      };

      // Try exact match first
      if (budgetMap[budget]) {
        console.log(`💰 Budget mapped: "${budget}" → "${budgetMap[budget]}"`);
        return budgetMap[budget];
      }

      // Try case-insensitive match
      const lowerBudget = budget.toLowerCase();
      if (
        lowerBudget.includes("budget") ||
        lowerBudget.includes("cheap") ||
        lowerBudget.includes("affordable")
      ) {
        console.log(
          `💰 Budget mapped (contains 'budget'): "${budget}" → "budget"`
        );
        return "budget";
      }
      if (
        lowerBudget.includes("luxury") ||
        lowerBudget.includes("premium") ||
        lowerBudget.includes("upscale")
      ) {
        console.log(
          `💰 Budget mapped (contains 'luxury'): "${budget}" → "luxury"`
        );
        return "luxury";
      }

      // Default to moderate
      console.log(`💰 Budget defaulted: "${budget}" → "moderate"`);
      return "moderate";
    };

    // ✅ FIXED: Send both camelCase and snake_case for backend compatibility
    const flightData = tripParams.flightData || {};
    const hotelData = tripParams.hotelData || {};
    const userEmail = this.getCurrentUserEmail();

    return {
      destination: tripParams.destination,
      start_date: tripParams.startDate,
      end_date: tripParams.endDate,
      startDate: tripParams.startDate, // Keep camelCase for backward compatibility
      endDate: tripParams.endDate, // Keep camelCase for backward compatibility
      duration: tripParams.duration || 3,
      travelers: tripParams.travelers,
      budget: normalizeBudget(tripParams.budget),

      // ✅ CRITICAL: Send email in BOTH formats (Django backend checks both)
      user_email: userEmail,
      userEmail: userEmail,

      // Send flight data in both formats
      flight_data: flightData,
      flightData: flightData,

      // Send hotel data in both formats
      hotel_data: hotelData,
      hotelData: hotelData,

      // User profile
      user_profile: tripParams.userProfile || {},
      userProfile: tripParams.userProfile || {},

      // Travel dates
      travelDates: tripParams.travelDates || {},
    };
  }

  /**
   * Get current user email from localStorage or Firebase
   * ✅ FIXED: Comprehensive email extraction with multiple fallbacks
   */
  getCurrentUserEmail() {
    try {
      // Try multiple sources in priority order
      let email = null;

      // 1. Try localStorage 'user' object (Firebase format)
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log("🔍 Parsed localStorage user:", user);

          // Try multiple nested paths
          email =
            user.email ||
            user.user?.email ||
            user.providerData?.[0]?.email ||
            user.reloadUserInfo?.email;
        } catch (parseError) {
          console.warn("⚠️ Could not parse localStorage user:", parseError);
        }
      }

      // 2. Try direct email storage
      if (!email) {
        email = localStorage.getItem("userEmail");
      }

      // 3. Try session storage as fallback
      if (!email) {
        const sessionUser = sessionStorage.getItem("user");
        if (sessionUser) {
          try {
            const parsed = JSON.parse(sessionUser);
            email = parsed.email || parsed.user?.email;
          } catch {
            console.warn("⚠️ Could not parse sessionStorage user");
          }
        }
      }

      // 4. Validate and sanitize email
      if (email && typeof email === "string") {
        email = email.trim().toLowerCase();

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email)) {
          console.log("✅ Valid email found:", email);
          return email;
        } else {
          console.warn("⚠️ Invalid email format:", email);
        }
      }

      // 5. Use fallback for development/testing
      console.warn(
        "⚠️ No valid user email found, using fallback for development"
      );
      console.warn(
        "💡 TIP: Make sure user is logged in via Firebase Authentication"
      );
      return "guest@travelrover.com"; // Valid format fallback
    } catch (error) {
      console.error("❌ Error getting user email:", error);
      return "guest@travelrover.com"; // Valid format fallback
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

      // Extract route optimization results
      route_optimization: results.route_optimization
        ? {
            applied: results.route_optimization.applied || false,
            efficiency_score: results.route_optimization.efficiency_score || 0,
            total_travel_time_minutes:
              results.route_optimization.total_travel_time_minutes || 0,
            optimization_summary:
              results.route_optimization.optimization_summary || {},
            recommendations: results.route_optimization.recommendations || [],
            error: results.route_optimization.error,
          }
        : null,

      // Extract optimized itinerary (enhanced with route data)
      optimized_itinerary:
        results.optimized_itinerary || results.itinerary_data,

      // Error handling
      errors: results.agent_errors || [],
    };
  }
}

export default LangGraphTravelAgent;
