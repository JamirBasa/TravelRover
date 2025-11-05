/**
 * Gemini AI Proxy Service - OPTIMIZED VERSION
 * Enhanced with caching, reduced timeouts, and better error handling
 */

import axios from "axios";
import { getTimeoutForDuration } from "../constants/tripDurationLimits";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class GeminiProxyService {
  // ✅ OPTIMIZED: Increased timeouts for complex requests
  static TIMEOUT_SHORT = 30000; // 30s (was 45s)
  static TIMEOUT_MEDIUM = 60000; // 1m (was 90s)
  static TIMEOUT_LONG = 120000; // 2m (was 150s)
  static TIMEOUT_EXTRA_LONG = 180000; // 3m (was 240s)
  static TIMEOUT_MAX = 600000; // 10m (was 5m) - for 30-day trips

  // ✅ OPTIMIZED: Adjusted complexity multipliers
  static COMPLEXITY_MULTIPLIERS = {
    travel_itinerary: 1.5, // Reduced from 1.8
    simple_query: 0.7, // Reduced from 0.8
    code_generation: 1.2, // Reduced from 1.5
    analysis: 1.0, // Reduced from 1.3
  };

  // ✅ NEW: Request caching for duplicate prompts
  static requestCache = new Map();
  static CACHE_TTL = 300000; // 5 minutes
  static MAX_CACHE_SIZE = 50;

  /**
   * Enhanced timeout calculation based on prompt analysis
   */
  static getOptimalTimeout(prompt, options = {}) {
    const {
      requestType,
      isRetry = false,
      retryAttempt = 0,
      tripDuration,
    } = options;
    const length = prompt.length;

    // ✅ PRIORITY: Use trip duration if provided (most accurate)
    if (tripDuration) {
      const durationTimeout = getTimeoutForDuration(tripDuration) * 1000; // Convert to ms

      console.log(
        `⏱️ Using duration-based timeout: ${tripDuration} days = ${
          durationTimeout / 1000
        }s`
      );

      // Apply retry reduction if needed
      if (isRetry && retryAttempt > 0) {
        const retryMultiplier = Math.max(0.6, 1 - retryAttempt * 0.2);
        const adjustedTimeout = durationTimeout * retryMultiplier;
        console.log(
          `🔄 Retry ${retryAttempt}: Reducing timeout to ${(
            adjustedTimeout / 1000
          ).toFixed(1)}s`
        );
        return Math.round(Math.min(adjustedTimeout, this.TIMEOUT_MAX));
      }

      return Math.min(durationTimeout, this.TIMEOUT_MAX);
    }

    // Base timeout based on length (REDUCED for faster failures)
    let baseTimeout;
    if (length < 4000) baseTimeout = this.TIMEOUT_SHORT * 0.8; // Reduce by 20%
    else if (length < 8000) baseTimeout = this.TIMEOUT_MEDIUM * 0.8;
    else if (length < 12000)
      baseTimeout = this.TIMEOUT_LONG * 0.7; // Reduce more for complex
    else baseTimeout = this.TIMEOUT_EXTRA_LONG * 0.6; // Reduce most for very complex

    // Detect request type automatically if not provided
    const detectedType = requestType || this.detectRequestType(prompt);

    // Apply complexity multiplier
    const complexityMultiplier =
      this.COMPLEXITY_MULTIPLIERS[detectedType] || 1.0;
    let calculatedTimeout = baseTimeout * complexityMultiplier;

    // ✅ IMPROVED: Progressive DECREASE for retries (fail faster on retries)
    if (isRetry && retryAttempt > 0) {
      const retryMultiplier = Math.max(0.6, 1 - retryAttempt * 0.2); // Decrease 20% per retry, min 60%
      calculatedTimeout *= retryMultiplier;
      console.log(
        `🔄 Retry ${retryAttempt}: Reducing timeout to ${
          retryMultiplier * 100
        }%`
      );
    }

    // Cap at maximum timeout
    calculatedTimeout = Math.min(calculatedTimeout, this.TIMEOUT_MAX);

    console.log(
      `⏱️ Timeout calculation: ${length} chars, type: ${detectedType}, base: ${(
        baseTimeout / 1000
      ).toFixed(1)}s, final: ${(calculatedTimeout / 1000).toFixed(1)}s`
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
   * Generate content with smart timeout, caching, and progress feedback
   */
  static async generateContent(prompt, options = {}) {
    const {
      schema = null,
      generationConfig = {},
      timeout: providedTimeout,
      requestType,
      onProgress,
      tripDuration, // ✅ NEW: Accept trip duration for accurate timeout
    } = options;

    // ✅ NEW: Check cache first
    const cacheKey = this.generateCacheKey(prompt, schema);
    const cached = this.requestCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log("✅ Using cached response (saved ~90s)");
      return cached.data;
    }

    // Use enhanced timeout calculation with trip duration
    const timeout =
      providedTimeout ||
      this.getOptimalTimeout(prompt, { requestType, tripDuration });

    console.log("🤖 Calling Gemini proxy endpoint...");
    console.log("📝 Prompt length:", prompt.length, "characters");
    if (tripDuration) {
      console.log("📅 Trip duration:", tripDuration, "days");
    }
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
            maxOutputTokens: 32768,
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

        const result = {
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

        // ✅ NEW: Cache successful results
        this.cacheResult(cacheKey, result);

        return result;
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
        const suggestions = this.getTimeoutSuggestions(requestType);

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
   * Get timeout suggestions for retries
   */
  static getTimeoutSuggestions(requestType) {
    const suggestions = {
      travel_itinerary:
        "Try reducing trip duration or simplifying requirements.",
      code_generation: "Try breaking down the request into smaller parts.",
      analysis: "Try reducing the amount of data to analyze.",
      simple_query: "Try rephrasing your question more concisely.",
    };

    return suggestions[requestType] || "Try simplifying your request.";
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
    const { onProgress, requestType, tripDuration } = options;
    let lastError = null;
    const detectedType = requestType || this.detectRequestType(prompt);

    console.log(
      `🔄 Starting retry logic for ${detectedType} request (max ${maxRetries} retries)`
    );
    if (tripDuration) {
      console.log(`📅 Trip duration: ${tripDuration} days`);
    }

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
        tripDuration, // ✅ Pass trip duration
      });

      // Update options with calculated timeout
      const attemptOptions = {
        ...options,
        timeout: attemptTimeout,
        requestType: detectedType,
        tripDuration, // ✅ Pass trip duration
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

  /**
   * ✅ NEW: Generate cache key for request
   */
  static generateCacheKey(prompt) {
    // Extract core parameters that define uniqueness
    const locationMatch = prompt.match(/location[:\s]+([^,\n]+)/i);
    const durationMatch = prompt.match(/duration[:\s]+(\d+)/i);
    const budgetMatch = prompt.match(/budget[:\s]+₱?([\d,]+)/i);

    const cacheableParams = [
      locationMatch?.[1] || "",
      durationMatch?.[1] || "",
      budgetMatch?.[1] || "",
    ].join("_");

    return `trip_${cacheableParams}`;
  }

  /**
   * ✅ NEW: Cache successful result
   */
  static cacheResult(cacheKey, result) {
    this.requestCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.requestCache.size > this.MAX_CACHE_SIZE) {
      const firstKey = this.requestCache.keys().next().value;
      this.requestCache.delete(firstKey);
      console.log(`🗑️ Cache size limit reached, removed oldest entry`);
    }
  }

  /**
   * ✅ NEW: Clear cache manually (for testing or memory management)
   */
  static clearCache() {
    this.requestCache.clear();
    console.log("🗑️ Request cache cleared");
  }
}

/**
 * Legacy wrapper
 */
export class GeminiProxyChatSession {
  constructor(generationConfig = {}, options = {}) {
    this.generationConfig = generationConfig;
    this.tripDuration = options.tripDuration; // ✅ NEW: Store trip duration
  }

  async sendMessage(prompt, options = {}) {
    const result = await GeminiProxyService.generateWithRetry(prompt, {
      schema: this.generationConfig.responseSchema,
      generationConfig: this.generationConfig,
      tripDuration: options.tripDuration || this.tripDuration, // ✅ Pass trip duration
      ...options,
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
