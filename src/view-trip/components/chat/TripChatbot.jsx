import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { logDebug, logError } from "@/utils/productionLogger";
import { GeminiProxyChatSession } from "@/config/geminiProxyService";

/**
 * TripChatbot Component
 * AI-powered travel assistant using Gemini Proxy Service
 * Provides trip-specific guidance and answers
 *
 * Architecture:
 * - Uses GeminiProxyChatSession (same as trip generation)
 * - API key stays secure on backend server
 * - Built-in caching, rate limit handling, auto-retry
 * - Consistent with existing TravelRover infrastructure
 *
 * Backend Setup:
 * 1. Start Django server: cd travel-backend && python manage.py runserver
 * 2. Configure GEMINI_API_KEY in travel-backend/.env
 * 3. Backend handles all AI requests securely
 *
 * Benefits:
 * - 🔒 Secure: API key never exposed to browser
 * - ⚡ Fast: 5-min caching for common questions
 * - 🔄 Reliable: Auto-retry with exponential backoff
 * - 📊 Smart: Adaptive timeout based on request type
 */
function TripChatbot({ trip }) {
  // Get logged-in user from localStorage
  const currentUser = React.useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logError("Failed to parse user from localStorage", error);
      return null;
    }
  }, []);

  // Backend status tracking (null = checking, true = online, false = offline)
  const [isBackendOnline, setIsBackendOnline] = useState(null);

  // ✅ FIX: Create persistent chat session (maintains conversation history)
  const chatSessionRef = useRef(null);

  // ✅ NEW: Request lock to prevent duplicate API calls
  const isRequestInProgressRef = useRef(false);

  // Initialize chat session once when component mounts
  useEffect(() => {
    chatSessionRef.current = new GeminiProxyChatSession({
      temperature: 0.7,
      maxOutputTokens: 800,
      model: "gemini-2.5-flash",
    });
    logDebug("TripChatbot", "Chat session initialized");
  }, []); // Empty dependency array = runs once on mount

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: `Hey there! 👋 I'm Rover, your personal AI travel buddy for your trip to ${
        trip?.userSelection?.location || "your destination"
      }! 

I'm here to help make your trip amazing. Ask me anything:
• 🎒 What should I pack?
• 🍜 Where are the best local restaurants?
• 🎭 What activities would you recommend?
• 🚕 How do I get around?
• 💡 Any insider tips for ${trip?.userSelection?.location || "my destination"}?

What would you like to know? 😊`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  // ✅ FIX: Use setTimeout to ensure DOM is fully rendered before scrolling
  const scrollToBottom = () => {
    // Wait for next tick to ensure DOM updates are complete
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }, 100); // Small delay ensures React has rendered new message
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Triggers whenever messages array changes

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Check backend health status on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Health check function
  const checkBackendHealth = async () => {
    try {
      console.log("🔍 Starting backend health check...");
      logDebug("TripChatbot", "Checking backend health status");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout (health endpoint validates API key)

      const response = await fetch(
        "http://localhost:8000/api/langgraph/gemini/health/",
        {
          method: "GET",
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const isOnline = data.api_key_configured && data.api_key_valid;
        setIsBackendOnline(isOnline);

        console.log("✅ Health Check Success:", {
          status: isOnline ? "online" : "offline",
          apiKeyConfigured: data.api_key_configured,
          apiKeyValid: data.api_key_valid,
        });

        logDebug("TripChatbot", "Backend health check completed", {
          status: isOnline ? "online" : "offline",
          apiKeyConfigured: data.api_key_configured,
          apiKeyValid: data.api_key_valid,
        });
      } else {
        setIsBackendOnline(false);
        logError("TripChatbot", "Backend health check failed", {
          status: response.status,
        });
      }
    } catch (error) {
      setIsBackendOnline(false);

      // Enhanced error logging for debugging
      const errorDetails = {
        message: error?.message || "Unknown error",
        name: error?.name || "UnknownError",
        isAborted: error?.name === "AbortError",
        isNetworkError: error?.message?.includes("Failed to fetch"),
        errorType: typeof error,
        errorString: String(error),
      };

      logError("TripChatbot", "Backend health check error", errorDetails);

      // Log to console for immediate debugging
      console.error("❌ Health Check Failed:", errorDetails);
    }
  };

  // Get trip context for AI
  const getTripContext = () => {
    const context = {
      destination: trip?.userSelection?.location || "Unknown",
      duration: trip?.userSelection?.duration || 0,
      travelers: trip?.userSelection?.travelers || "Not specified",
      budget: trip?.userSelection?.customBudget
        ? `₱${trip.userSelection.customBudget.toLocaleString()}`
        : trip?.userSelection?.budget || "Not set",
      travelDates:
        trip?.userSelection?.startDate && trip?.userSelection?.endDate
          ? `${trip.userSelection.startDate} to ${trip.userSelection.endDate}`
          : "Not specified",
      hasItinerary: !!trip?.tripData?.itinerary,
      hasHotels: !!trip?.tripData?.hotels && trip.tripData.hotels.length > 0,
      hasFlights: !!trip?.hasRealFlights || !!trip?.realFlightData?.success,
      transportMode: trip?.transportMode?.mode || "Not specified",
    };
    return context;
  };

  // Send message to AI chat
  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    // ✅ CRITICAL FIX: Prevent duplicate API calls with request lock
    if (isRequestInProgressRef.current) {
      logDebug(
        "TripChatbot",
        "Request already in progress, ignoring duplicate call"
      );
      return;
    }

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // ✅ Set lock to prevent concurrent requests
    isRequestInProgressRef.current = true;

    try {
      logDebug("TripChatbot", "Sending message", {
        messageLength: userMessage.length,
        conversationLength: messages.length,
      });

      const tripContext = getTripContext();

      // ✅ IMPROVED: Check if this is the first user message
      // (Skip welcome message at index 0, so first user message is when length === 1)
      const isFirstUserMessage = messages.length === 1;

      let fullPrompt;

      if (isFirstUserMessage) {
        // First message: Send full system prompt with trip context
        const systemPrompt = `You are Rover, a friendly AI travel assistant for TravelRover. Help travelers with their trip to ${
          tripContext.destination
        }!

TRIP DETAILS:
🌍 Destination: ${tripContext.destination}
📅 Duration: ${tripContext.duration} days (${tripContext.travelDates})
👥 Travelers: ${tripContext.travelers}
💰 Budget: ${tripContext.budget}
${
  tripContext.hasItinerary
    ? "✅ Itinerary: Planned"
    : "📝 Itinerary: Not created yet"
}
${tripContext.hasHotels ? "✅ Hotels: Arranged" : "🏨 Hotels: Not arranged"}
${tripContext.hasFlights ? "✅ Flights: Arranged" : "✈️ Flights: Not arranged"}
🚗 Transport: ${tripContext.transportMode}

BE: Conversational, friendly, helpful - like a travel buddy! Keep responses 2-4 paragraphs max. Use emojis naturally.`;

        fullPrompt = `${systemPrompt}\n\nTraveler: ${userMessage}`;
      } else {
        // Subsequent messages: Just send the new message
        // (The persistent session maintains context automatically)
        fullPrompt = userMessage;
      }

      logDebug("TripChatbot", "Using chat session", {
        isFirstMessage: isFirstUserMessage,
        messageCount: messages.length,
      });

      // ✅ FIX: Use persistent chat session (maintains conversation context)
      if (!chatSessionRef.current) {
        throw new Error("Chat session not initialized");
      }

      // Send message through persistent session
      const result = await chatSessionRef.current.sendMessage(fullPrompt, {
        requestType: "simple_query",
        chat_mode: true,
      });

      const response = result.response;
      const assistantMessage =
        response.text() ||
        "I couldn't generate a response right now. Please try again! 😊";

      logDebug("TripChatbot", "Received response", {
        responseLength: assistantMessage.length,
      });

      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      logError("TripChatbot", "Error sending message", {
        error: error.message,
        stack: error.stack,
      });

      // ✅ IMPROVED: User-friendly error messages (no technical jargon)
      let errorContent =
        "Hmm, I'm having trouble right now. Mind trying again? 😊";
      let toastDescription = "Please try again";

      // Connection issues
      if (
        error.message?.includes("Backend server not running") ||
        error.message?.includes("ERR_CONNECTION_REFUSED") ||
        error.message?.includes("Network Error") ||
        error.code === "ERR_NETWORK"
      ) {
        errorContent =
          "Oops! I can't connect right now. Please refresh this page and try again. 🔄";
        toastDescription = "Connection lost - please refresh";
      } else if (!navigator.onLine) {
        errorContent =
          "Looks like you're offline. Check your internet and try again! 📡";
        toastDescription = "No internet connection";
      }
      // Too many requests
      else if (
        error.message?.includes("429") ||
        error.message?.includes("Too Many Requests") ||
        error.message?.includes("RESOURCE_EXHAUSTED")
      ) {
        errorContent =
          "Whoa, slow down there! 😊 Give me a moment to catch up, then let's continue.";
        toastDescription = "Please wait a moment";
      }
      // Service issues
      else if (
        error.message?.includes("Invalid API key") ||
        error.message?.includes("API_KEY_INVALID") ||
        error.message?.includes("unauthorized") ||
        error.message?.includes("403") ||
        error.message?.includes("500") ||
        error.message?.includes("503")
      ) {
        errorContent =
          "I'm having some technical difficulties. Try refreshing the page! 🔧";
        toastDescription = "Try refreshing the page";
      }
      // Session issues
      else if (error.message?.includes("Chat session not initialized")) {
        errorContent =
          "Something went wrong with our chat. Please refresh the page to start fresh! �";
        toastDescription = "Please refresh the page";
      }

      const errorMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);

      // ✅ IMPROVED: Friendlier error notification
      toast.error("Oops!", {
        description: toastDescription,
        duration: 5000,
      });

      // Re-check connection status after network errors
      if (
        error.message?.includes("Backend server not running") ||
        error.message?.includes("ERR_CONNECTION_REFUSED") ||
        error.message?.includes("Network Error") ||
        error.message?.includes("Chat session not initialized") ||
        error.code === "ERR_NETWORK"
      ) {
        setTimeout(() => checkBackendHealth(), 1000);

        // Reinitialize chat session if it was lost
        if (error.message?.includes("Chat session not initialized")) {
          chatSessionRef.current = new GeminiProxyChatSession({
            temperature: 0.7,
            maxOutputTokens: 800,
            model: "gemini-2.5-flash",
          });
          logDebug("TripChatbot", "Chat session reinitialized after error");
        }
      }
    } finally {
      setIsLoading(false);
      // ✅ Release lock after request completes (success or error)
      isRequestInProgressRef.current = false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // ✅ Prevent submission if already loading
    if (isLoading || !input.trim()) return;
    sendMessage(input);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // ✅ Prevent duplicate submission on Enter key
      if (isLoading || !input.trim()) return;
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
      {/* Chat Header - Enhanced Premium Design */}
      <div className="relative flex items-center gap-4 px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-sky-50 via-blue-50/80 to-sky-50 dark:from-sky-950/50 dark:via-blue-950/40 dark:to-sky-950/50">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]"></div>

        {/* Rover Avatar - Larger with glow effect */}
        <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 ring-2 ring-sky-200/50 dark:ring-sky-700/50 transition-transform hover:scale-105 duration-300">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-blue-600/20 blur-md"></div>
          <img
            src="/rover-avatar.png"
            alt="Rover"
            className="relative z-10 w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <Bot
            className="relative z-10 h-7 w-7 text-sky-600 dark:text-sky-400"
            style={{ display: "none" }}
          />
        </div>

        {/* Header Content */}
        <div className="flex-1 relative z-10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-0.5">
            Rover
            <Sparkles className="h-4 w-4 text-sky-500 animate-pulse" />
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Your AI Travel Buddy •{" "}
            {trip?.userSelection?.location || "Ready to help"}
          </p>
        </div>

        {/* Status removed - kept internal for error handling only */}
      </div>

      {/* Messages Container - Enhanced spacing and styling */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent bg-gradient-to-b from-gray-50/40 to-white dark:from-slate-800/30 dark:to-slate-900">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Avatar - Larger and more prominent */}
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                message.role === "user"
                  ? "ring-2 ring-sky-300/50 dark:ring-sky-600/50 bg-white dark:bg-slate-800"
                  : message.isError
                  ? "bg-red-500 ring-2 ring-red-300"
                  : "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 ring-2 ring-sky-200/30 dark:ring-sky-700/30"
              }`}
            >
              {message.role === "user" ? (
                // User's profile picture from Google OAuth
                currentUser?.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to User icon if image fails to load
                      e.target.style.display = "none";
                      const fallback = e.target.nextSibling;
                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />
                ) : null
              ) : message.isError ? (
                <Bot className="h-5 w-5 text-white" />
              ) : (
                <>
                  <img
                    src="/rover-avatar.png"
                    alt="Rover"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <Bot
                    className="h-5 w-5 text-sky-600 dark:text-sky-400"
                    style={{ display: "none" }}
                  />
                </>
              )}
              {/* Fallback User icon (always rendered but hidden unless image fails) */}
              {message.role === "user" && (
                <div
                  className="w-full h-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center"
                  style={{ display: currentUser?.picture ? "none" : "flex" }}
                >
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
            </div>

            {/* Message Bubble - Enhanced with better typography and spacing */}
            <div
              className={`flex flex-col max-w-[88%] ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`group px-5 py-3.5 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 text-white shadow-sky-200/50 dark:shadow-sky-900/50"
                    : message.isError
                    ? "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-red-100 dark:shadow-red-900/20"
                    : "bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-slate-700/50 shadow-gray-100 dark:shadow-slate-900/20"
                }`}
              >
                <p className="text-[15px] leading-loose whitespace-pre-wrap font-normal">
                  {message.content}
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-3 font-medium">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator - Enhanced animation */}
        {isLoading && (
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 flex items-center justify-center overflow-hidden shadow-md ring-2 ring-sky-200/30 dark:ring-sky-700/30">
              <img
                src="/rover-avatar.png"
                alt="Rover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <Bot
                className="h-6 w-6 text-sky-600 dark:text-sky-400"
                style={{ display: "none" }}
              />
            </div>
            <div className="bg-white dark:bg-slate-800 px-5 py-3.5 rounded-2xl shadow-sm border border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div style={{ animation: 'spin 1s linear infinite' }}>
                  <Loader2 className="h-5 w-5 text-sky-500" />
                </div>
                <span className="text-[15px] text-gray-600 dark:text-gray-400 font-medium">
                  Rover is thinking
                  <span className="inline-flex">
                    <span className="animate-pulse delay-0">.</span>
                    <span className="animate-pulse delay-100">.</span>
                    <span className="animate-pulse delay-200">.</span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Floating design with enhanced visual hierarchy */}
      <div className="relative px-5 py-4 border-t border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        {/* Subtle top shadow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent"></div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-3">
          <div className="flex-1 relative group">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your trip..."
              disabled={isLoading}
              className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-500 focus:border-sky-400 dark:focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-[15px] font-normal shadow-sm transition-all duration-300 hover:shadow-md focus:shadow-lg group-hover:border-gray-400 dark:group-hover:border-slate-500"
            />
            {/* Typing indicator line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 rounded-full"></div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim() || isBackendOnline === false}
            className="px-6 py-3.5 bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:via-sky-700 hover:to-blue-700 active:scale-95 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 shadow-lg shadow-sky-200/50 dark:shadow-sky-900/50 hover:shadow-xl hover:shadow-sky-300/60 dark:hover:shadow-sky-800/60 group"
            title={
              isBackendOnline === false
                ? "Can't connect right now. Please refresh the page."
                : ""
            }
          >
            {isLoading ? (
              <div style={{ animation: 'spin 1s linear infinite' }}>
                <Loader2 className="h-5 w-5" />
              </div>
            ) : (
              <Send className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
            <span className="hidden sm:inline text-sm">Send</span>
          </button>
        </form>

        {/* Helpful tip for travelers */}
        {isBackendOnline === false ? (
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                💬 Can't connect right now. Please refresh the page!
              </span>
              <button
                onClick={checkBackendHealth}
                className="ml-2 px-2 py-1 text-xs font-semibold rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            <p className="font-medium">
              Ask about activities, local tips, budget advice, or anything about
              your trip
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripChatbot;
