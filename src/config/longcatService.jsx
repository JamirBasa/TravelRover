/**
 * LongCat API Service
 * Provides integration with LongCat.chat through Django backend proxy
 *
 * Features:
 * - 500K free tokens/day
 * - Two models: Chat (fast) and Thinking (reasoning)
 * - OpenAI-compatible API
 * - Secure API key on backend
 *
 * Usage:
 * const service = new LongCatService();
 * const response = await service.chat(messages, { model: 'thinking' });
 */

import { logDebug, logError } from "@/utils/productionLogger";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const BASE_URL = `${API_BASE}/langgraph/longcat`;

export class LongCatService {
  /**
   * Send chat request to LongCat API
   *
   * @param {Array} messages - Array of {role, content} objects
   * @param {Object} options - Configuration options
   * @param {string} options.model - 'chat' or 'thinking'
   * @param {number} options.temperature - 0-1, defaults to 0.7
   * @param {number} options.maxTokens - Max tokens, defaults to 2000
   * @param {boolean} options.enableThinking - Enable thinking mode (only for 'thinking' model)
   * @returns {Promise<Object>} Response with content and usage
   */
  async chat(messages, options = {}) {
    const {
      model = "chat",
      temperature = 0.7,
      maxTokens = 2000,
      enableThinking = false,
    } = options;

    try {
      logDebug("LongCatService", "Sending chat request", {
        model,
        messageCount: messages.length,
        enableThinking,
      });

      const response = await fetch(`${BASE_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model,
          temperature,
          max_tokens: maxTokens,
          enable_thinking: enableThinking,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || "LongCat request failed");
      }

      logDebug("LongCatService", "Chat response received", {
        model: data.data.model,
        usage: data.data.usage,
        thinkingEnabled: data.data.thinking_enabled,
      });

      return {
        content: data.data.content,
        model: data.data.model,
        usage: data.data.usage,
        thinkingEnabled: data.data.thinking_enabled,
      };
    } catch (error) {
      logError("LongCatService", "Chat request failed", error);
      throw error;
    }
  }

  /**
   * Check LongCat API health and configuration
   *
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      console.log('🔍 LongCatService: Fetching health from', `${BASE_URL}/health/`);
      
      const response = await fetch(`${BASE_URL}/health/`, {
        method: "GET",
      });

      console.log('📡 LongCatService: Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 LongCatService: Full response data:', data);
      console.log('📦 LongCatService: data.data:', data.data);

      if (!response.ok) {
        console.log('❌ LongCatService: Response not OK');
        return {
          configured: false,
          valid: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      console.log('✅ LongCatService: Returning health status:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ LongCatService: Health check exception:', error);
      logError("LongCatService", "Health check failed", error);
      return {
        configured: false,
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect if a user question requires thinking mode
   *
   * @param {string} question - User's question
   * @returns {boolean} True if thinking mode recommended
   */
  static shouldUseThinking(question) {
    const thinkingKeywords = [
      "compare",
      "optimize",
      "best way",
      "which is better",
      "analyze",
      "recommend",
      "plan",
      "budget",
      "calculate",
      "explain why",
      "reasoning",
      "consider",
      "evaluate",
      "decide",
    ];

    const lowerQuestion = question.toLowerCase();
    return thinkingKeywords.some((keyword) => lowerQuestion.includes(keyword));
  }
}

export default LongCatService;
