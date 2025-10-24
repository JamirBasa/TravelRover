/**
 * Gemini AI Proxy Service - UPDATED VERSION
 * Fixed timeout issues for large itinerary generation
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class GeminiProxyService {
  // Timeout constants - INCREASED for large prompts
  static TIMEOUT_SHORT = 60000; // 60s
  static TIMEOUT_MEDIUM = 120000; // 120s (2min)
  static TIMEOUT_LONG = 180000; // 180s (3min)
  static TIMEOUT_EXTRA_LONG = 300000; // 300s (5min)

  /**
   * Determine timeout based on prompt size
   */
  static getOptimalTimeout(prompt) {
    const length = prompt.length;

    if (length < 5000) return this.TIMEOUT_SHORT;
    if (length < 10000) return this.TIMEOUT_MEDIUM;
    if (length < 15000) return this.TIMEOUT_LONG;
    return this.TIMEOUT_EXTRA_LONG;
  }

  /**
   * Generate content with smart timeout
   */
  static async generateContent(prompt, options = {}) {
    const {
      schema = null,
      generationConfig = {},
      timeout = this.getOptimalTimeout(prompt), // AUTO-CALCULATE
    } = options;

    console.log("🤖 Calling Gemini proxy endpoint...");
    console.log("📝 Prompt length:", prompt.length, "characters");
    console.log("⏱️ Using timeout:", timeout / 1000, "seconds");

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
            maxOutputTokens: 16384,
            model: generationConfig.model || "gemini-2.5-flash",
          },
        },
        {
          timeout, // Using calculated timeout
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const executionTime = Date.now() - startTime;

      if (response.data.success) {
        console.log(`✅ Completed in ${(executionTime / 1000).toFixed(2)}s`);
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
        console.error("❌ Error:", response.data.error);
        return {
          success: false,
          error: response.data.error,
          errorType: response.data.error_type,
        };
      }
    } catch (error) {
      console.error("❌ Request failed:", error);

      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          error: `Timeout after ${
            timeout / 1000
          }s. Try reducing itinerary complexity.`,
          errorType: "timeout",
        };
      }

      if (error.code === "ERR_NETWORK") {
        return {
          success: false,
          error:
            "Backend server not running. Start with: python manage.py runserver",
          errorType: "network_error",
        };
      }

      if (error.response) {
        return {
          success: false,
          error: error.response.data?.error || `Server error: ${error.message}`,
          errorType: error.response.data?.error_type || "server_error",
        };
      }

      return {
        success: false,
        error: error.message || "Unknown error occurred",
        errorType: "client_error",
      };
    }
  }

  /**
   * Health check
   */
  static async checkHealth() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/langgraph/gemini/health/`,
        { timeout: 10000 }
      );

      return {
        success: true,
        status: response.data.status,
        ...response.data,
      };
    } catch (error) {
      return {
        success: false,
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  /**
   * Generate with retry
   */
  static async generateWithRetry(prompt, options = {}, maxRetries = 2) {
    let lastError = null;
    const baseTimeout = options.timeout || this.getOptimalTimeout(prompt);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`🔄 Retry ${attempt}/${maxRetries}...`);
        // Increase timeout on retry
        options.timeout = baseTimeout + attempt * 60000; // +60s per retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const result = await this.generateContent(prompt, options);

      if (result.success) {
        return result;
      }

      lastError = result;

      // Don't retry these errors
      const noRetry = ["validation_error", "network_error", "max_tokens"];
      if (noRetry.includes(result.errorType)) {
        break;
      }
    }

    return {
      ...lastError,
      attemptsExhausted: true,
      totalAttempts: maxRetries + 1,
    };
  }
}

/**
 * Legacy wrapper
 */
export class GeminiProxyChatSession {
  constructor(generationConfig = {}) {
    this.generationConfig = generationConfig;
  }

  async sendMessage(prompt) {
    const result = await GeminiProxyService.generateWithRetry(prompt, {
      schema: this.generationConfig.responseSchema,
      generationConfig: this.generationConfig,
    });

    if (!result.success) {
      throw new Error(result.error || "Generation failed");
    }

    return {
      response: {
        text: () => {
          if (typeof result.data === "object") {
            return JSON.stringify(result.data);
          }
          return result.data;
        },
      },
    };
  }
}
