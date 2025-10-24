/**
 * Gemini AI Proxy Service - UPDATED VERSION
 * Fixed timeout issues for large itinerary generation
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class GeminiProxyService {
  // Enhanced timeout constants with better granularity
  static TIMEOUT_SHORT = 45000; // 45s - reduced for faster feedback
  static TIMEOUT_MEDIUM = 90000; // 90s (1.5min) - balanced
  static TIMEOUT_LONG = 150000; // 150s (2.5min) - extended
  static TIMEOUT_EXTRA_LONG = 240000; // 240s (4min) - reduced from 5min
  static TIMEOUT_MAX = 360000; // 360s (6min) - absolute maximum

  // Complexity multipliers
  static COMPLEXITY_MULTIPLIERS = {
    travel_itinerary: 1.8, // Travel planning is complex
    simple_query: 0.8, // Simple queries are faster
    code_generation: 1.5, // Code generation needs time
    analysis: 1.3, // Analysis tasks
  };

  /**
   * Enhanced timeout calculation based on prompt analysis
   */
  static getOptimalTimeout(prompt, options = {}) {
    const { requestType, isRetry = false, retryAttempt = 0 } = options;
    const length = prompt.length;

    // Base timeout based on length
    let baseTimeout;
    if (length < 4000) baseTimeout = this.TIMEOUT_SHORT;
    else if (length < 8000) baseTimeout = this.TIMEOUT_MEDIUM;
    else if (length < 12000) baseTimeout = this.TIMEOUT_LONG;
    else baseTimeout = this.TIMEOUT_EXTRA_LONG;

    // Detect request type automatically if not provided
    const detectedType = requestType || this.detectRequestType(prompt);

    // Apply complexity multiplier
    const complexityMultiplier =
      this.COMPLEXITY_MULTIPLIERS[detectedType] || 1.0;
    let calculatedTimeout = baseTimeout * complexityMultiplier;

    // Progressive increase for retries (more aggressive scaling)
    if (isRetry && retryAttempt > 0) {
      const retryMultiplier = 1 + retryAttempt * 0.4; // 40% increase per retry
      calculatedTimeout *= retryMultiplier;
    }

    // Cap at maximum timeout
    calculatedTimeout = Math.min(calculatedTimeout, this.TIMEOUT_MAX);

    console.log(
      `⏱️ Timeout calculation: ${length} chars, type: ${detectedType}, base: ${
        baseTimeout / 1000
      }s, final: ${calculatedTimeout / 1000}s`
    );

    return Math.round(calculatedTimeout);
  }

  /**
   * Detect request type from prompt content
   */
  static detectRequestType(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Travel planning keywords
    const travelKeywords = [
      "itinerary",
      "trip",
      "travel",
      "destination",
      "hotel",
      "flight",
      "budget",
      "travelers",
      "places to visit",
      "duration",
      "accommodation",
    ];
    const travelScore = travelKeywords.filter((keyword) =>
      lowerPrompt.includes(keyword)
    ).length;

    // Code generation keywords
    const codeKeywords = [
      "function",
      "class",
      "code",
      "programming",
      "javascript",
      "python",
      "react",
      "component",
      "api",
      "database",
    ];
    const codeScore = codeKeywords.filter((keyword) =>
      lowerPrompt.includes(keyword)
    ).length;

    // Analysis keywords
    const analysisKeywords = [
      "analyze",
      "review",
      "evaluate",
      "assess",
      "compare",
      "summary",
      "insights",
    ];
    const analysisScore = analysisKeywords.filter((keyword) =>
      lowerPrompt.includes(keyword)
    ).length;

    // Determine type based on scores
    if (travelScore >= 2) return "travel_itinerary";
    if (codeScore >= 2) return "code_generation";
    if (analysisScore >= 2) return "analysis";

    return "simple_query";
  }

  /**
   * Generate content with smart timeout and progress feedback
   */
  static async generateContent(prompt, options = {}) {
    const {
      schema = null,
      generationConfig = {},
      timeout: providedTimeout,
      requestType,
      onProgress,
    } = options;

    // Use enhanced timeout calculation
    const timeout =
      providedTimeout || this.getOptimalTimeout(prompt, { requestType });

    console.log("🤖 Calling Gemini proxy endpoint...");
    console.log("📝 Prompt length:", prompt.length, "characters");
    console.log("🎯 Request type:", this.detectRequestType(prompt));
    console.log("⏱️ Timeout:", timeout / 1000, "seconds");

    // Provide user feedback for long requests
    if (timeout > 120000) {
      // > 2 minutes
      console.log("⏳ This is a complex request. Please wait...");
      if (onProgress)
        onProgress({
          stage: "starting",
          message: "Initializing AI generation...",
        });
    }

    try {
      const startTime = Date.now();

      // Progress callback for long requests
      let progressInterval;
      if (timeout > 180000 && onProgress) {
        // > 3 minutes
        progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / timeout) * 100, 95);
          onProgress({
            stage: "processing",
            message: `Processing... ${Math.round(progress)}%`,
            elapsed: Math.round(elapsed / 1000),
          });
        }, 10000); // Update every 10 seconds
      }

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
          timeout,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Clear progress interval
      if (progressInterval) clearInterval(progressInterval);

      const executionTime = Date.now() - startTime;

      if (response.data.success) {
        console.log(`✅ Completed in ${(executionTime / 1000).toFixed(2)}s`);
        if (onProgress)
          onProgress({ stage: "completed", message: "Generation completed!" });

        return {
          success: true,
          data: response.data.data,
          rawResponse: response.data.raw_response,
          metadata: {
            ...response.data.metadata,
            clientExecutionTime: executionTime,
            timeoutUsed: timeout,
            requestType: this.detectRequestType(prompt),
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
        const requestType = this.detectRequestType(prompt);
        const suggestions = this.getTimeoutSuggestions(requestType, timeout);

        return {
          success: false,
          error: `Request timed out after ${timeout / 1000}s. ${suggestions}`,
          errorType: "timeout",
          timeoutUsed: timeout,
          requestType,
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
   * Get estimated completion time for a request
   */
  static getEstimatedTime(prompt, options = {}) {
    const { requestType } = options;
    const timeout = this.getOptimalTimeout(prompt, { requestType });

    // Estimate based on historical data and complexity
    const detectedType = requestType || this.detectRequestType(prompt);
    const baseEstimate = this.getBaseEstimate(detectedType);

    return {
      estimatedSeconds: Math.round((timeout / 1000) * 0.7), // 70% of timeout as estimate
      timeoutSeconds: Math.round(timeout / 1000),
      requestType: detectedType,
      complexity: this.getComplexityLevel(prompt),
    };
  }

  /**
   * Get base time estimate by request type
   */
  static getBaseEstimate(requestType) {
    const estimates = {
      travel_itinerary: 90, // 1.5 minutes average
      code_generation: 60, // 1 minute average
      analysis: 45, // 45 seconds average
      simple_query: 15, // 15 seconds average
    };
    return estimates[requestType] || 30;
  }

  /**
   * Get complexity level description
   */
  static getComplexityLevel(prompt) {
    const length = prompt.length;
    if (length < 2000) return "Low";
    if (length < 5000) return "Medium";
    if (length < 10000) return "High";
    return "Very High";
  }

  /**
   * Generate with enhanced retry logic and adaptive timeouts
   */
  static async generateWithRetry(prompt, options = {}, maxRetries = 2) {
    const { onProgress, requestType } = options;
    let lastError = null;
    const detectedType = requestType || this.detectRequestType(prompt);

    console.log(
      `🔄 Starting retry logic for ${detectedType} request (max ${maxRetries} retries)`
    );

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const isRetry = attempt > 0;

      if (isRetry) {
        console.log(`🔄 Retry ${attempt}/${maxRetries}...`);
        if (onProgress)
          onProgress({
            stage: "retrying",
            message: `Retrying request (attempt ${attempt + 1}/${
              maxRetries + 1
            })...`,
            attempt: attempt + 1,
            maxAttempts: maxRetries + 1,
          });

        // Progressive delay before retry (exponential backoff)
        const delayMs = Math.min(2000 * Math.pow(1.5, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Calculate timeout for this attempt
      const attemptTimeout = this.getOptimalTimeout(prompt, {
        requestType: detectedType,
        isRetry,
        retryAttempt: attempt,
      });

      // Update options with calculated timeout
      const attemptOptions = {
        ...options,
        timeout: attemptTimeout,
        requestType: detectedType,
        onProgress: isRetry ? undefined : onProgress, // Only show progress on first attempt
      };

      const result = await this.generateContent(prompt, attemptOptions);

      if (result.success) {
        console.log(`✅ Success on attempt ${attempt + 1}`);
        return {
          ...result,
          attempts: attempt + 1,
          totalAttempts: attempt + 1,
        };
      }

      lastError = result;

      // Enhanced retry decision logic
      const shouldRetry = this.shouldRetryError(
        result.errorType,
        attempt,
        maxRetries
      );

      if (!shouldRetry) {
        console.log(`❌ Not retrying error type: ${result.errorType}`);
        break;
      }

      console.log(
        `⚠️ Attempt ${attempt + 1} failed (${result.errorType}), will retry...`
      );
    }

    console.log(`❌ All ${maxRetries + 1} attempts failed`);
    return {
      ...lastError,
      attemptsExhausted: true,
      totalAttempts: maxRetries + 1,
      requestType: detectedType,
    };
  }

  /**
   * Determine if an error should trigger a retry
   */
  static shouldRetryError(errorType, currentAttempt, maxRetries) {
    // Never retry these error types
    const noRetryTypes = ["validation_error", "network_error", "auth_error"];
    if (noRetryTypes.includes(errorType)) {
      return false;
    }

    // Always retry timeouts (they might work with more time)
    if (errorType === "timeout") {
      return currentAttempt < maxRetries;
    }

    // Retry server errors and rate limits with backoff
    const retryableTypes = ["server_error", "rate_limit", "internal_error"];
    return retryableTypes.includes(errorType) && currentAttempt < maxRetries;
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
