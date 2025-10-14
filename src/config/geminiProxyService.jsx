/**
 * Gemini AI Proxy Service
 *
 * Uses backend proxy endpoint to secure API key while maintaining
 * all frontend prompt building logic and flexibility
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class GeminiProxyService {
  /**
   * Generate content using backend Gemini proxy
   *
   * @param {string} prompt - Enhanced prompt built by frontend
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} AI response
   */
  static async generateContent(prompt, options = {}) {
    const {
      schema = null,
      generationConfig = {},
      timeout = 60000, // 60 seconds
    } = options;

    console.log("🤖 Calling Gemini proxy endpoint...");
    console.log("📝 Prompt length:", prompt.length, "characters");

    try {
      const startTime = Date.now();

      const response = await axios.post(
        `${API_BASE_URL}/api/langgraph/gemini/generate/`,
        {
          prompt,
          schema,
          generationConfig: {
            temperature: generationConfig.temperature || 0.2,
            topP: generationConfig.topP || 0.9,
            topK: generationConfig.topK || 20,
            maxOutputTokens: generationConfig.maxOutputTokens || 8192,
            model: generationConfig.model || "gemini-2.0-flash-exp",
          },
        },
        {
          timeout,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const executionTime = Date.now() - startTime;

      if (response.data.success) {
        console.log(`✅ Gemini proxy completed in ${executionTime}ms`);
        console.log("📊 Metadata:", response.data.metadata);

        return {
          success: true,
          data: response.data.data,
          rawResponse: response.data.raw_response,
          metadata: {
            ...response.data.metadata,
            clientExecutionTime: executionTime,
          },
        };
      } else {
        console.error("❌ Gemini proxy returned error:", response.data.error);
        return {
          success: false,
          error: response.data.error,
          errorType: response.data.error_type,
        };
      }
    } catch (error) {
      console.error("❌ Gemini proxy request failed:", error);

      // Handle timeout
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          error: "Request timed out. Please try again.",
          errorType: "timeout",
        };
      }

      // Handle network errors
      if (error.response) {
        // Server responded with error
        return {
          success: false,
          error:
            error.response.data?.error ||
            "Server error occurred. Please try again.",
          errorType: error.response.data?.error_type || "server_error",
          statusCode: error.response.status,
        };
      } else if (error.request) {
        // Request made but no response
        return {
          success: false,
          error: "Unable to connect to server. Please check your connection.",
          errorType: "network_error",
        };
      } else {
        // Error in request setup
        return {
          success: false,
          error: error.message || "An unexpected error occurred.",
          errorType: "client_error",
        };
      }
    }
  }

  /**
   * Check health of Gemini proxy endpoint
   *
   * @returns {Promise<Object>} Health status
   */
  static async checkHealth() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/langgraph/gemini/health/`,
        {
          timeout: 10000, // 10 seconds
        }
      );

      return {
        success: true,
        status: response.data.status,
        ...response.data,
      };
    } catch (error) {
      console.error("❌ Gemini proxy health check failed:", error);
      return {
        success: false,
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  /**
   * Generate with retry logic
   *
   * @param {string} prompt - Enhanced prompt
   * @param {Object} options - Generation options
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<Object>} AI response
   */
  static async generateWithRetry(prompt, options = {}, maxRetries = 2) {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }

      const result = await this.generateContent(prompt, options);

      if (result.success) {
        return result;
      }

      lastError = result;

      // Don't retry on validation errors
      if (result.errorType === "validation_error") {
        break;
      }
    }

    // All retries failed
    return lastError;
  }
}

/**
 * Legacy compatibility wrapper
 * Mimics the old chatSession.sendMessage() API
 */
export class GeminiProxyChatSession {
  constructor(generationConfig = {}) {
    this.generationConfig = generationConfig;
  }

  async sendMessage(prompt) {
    const result = await GeminiProxyService.generateContent(prompt, {
      schema: this.generationConfig.responseSchema,
      generationConfig: this.generationConfig,
    });

    if (!result.success) {
      throw new Error(result.error || "Gemini generation failed");
    }

    // Mimic old API response structure
    return {
      response: {
        text: () => {
          // If data is already parsed JSON, stringify it
          if (typeof result.data === "object") {
            return JSON.stringify(result.data);
          }
          return result.data;
        },
      },
    };
  }
}
