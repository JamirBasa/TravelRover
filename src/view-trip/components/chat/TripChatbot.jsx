import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Brain, Zap } from "lucide-react";
import { toast } from "sonner";
import { logDebug, logError } from "@/utils/productionLogger";
import { GeminiProxyChatSession } from "@/config/geminiProxyService";
import { LongCatService } from "@/config/longcatService";

/**
 * TripChatbot Component
 * AI-powered travel assistant with dual AI provider support
 *
 * Providers:
 * - Gemini 2.5 Flash: Fast, excellent Philippine knowledge (default)
 * - LongCat: Free 500K tokens/day, thinking mode for complex questions
 *
 * Architecture:
 * - Smart model selection based on question complexity
 * - API keys stay secure on backend server
 * - Built-in caching, rate limit handling, auto-retry
 * - Seamless fallback between providers
 *
 * Backend Setup:
 * 1. Start Django server: cd travel-backend && python manage.py runserver
 * 2. Configure GEMINI_API_KEY and LONGCAT_API_KEY in travel-backend/.env
 * 3. Backend handles all AI requests securely
 *
 * Benefits:
 * - 🔒 Secure: API keys never exposed to browser
 * - 🧠 Smart: Thinking mode for complex planning
 * - ⚡ Fast: Optimized model selection
 * - � Reliable: Multi-provider fallback
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
  const [isLongCatOnline, setIsLongCatOnline] = useState(null);

  // AI Provider selection ('gemini' or 'longcat')
  const [aiProvider, setAiProvider] = useState("gemini");
  const [useThinkingMode, setUseThinkingMode] = useState(false);
  const [suggestedProvider, setSuggestedProvider] = useState(null); // null, 'gemini', or 'longcat'

  // ✅ FIX: Create persistent chat session (maintains conversation history)
  const chatSessionRef = useRef(null);
  const longcatServiceRef = useRef(null);

  // ✅ NEW: Request lock to prevent duplicate API calls
  const isRequestInProgressRef = useRef(false);

  // Initialize services once when component mounts
  useEffect(() => {
    chatSessionRef.current = new GeminiProxyChatSession({
      temperature: 0.7,
      maxOutputTokens: 800,
      model: "gemini-2.5-flash",
    });
    longcatServiceRef.current = new LongCatService();
    logDebug("TripChatbot", "Chat services initialized");
  }, []); // Empty dependency array = runs once on mount

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: `Hey there! 👋 Welcome to your AI travel assistants!

**Meet Your Travel Team:**

🚀 **Rover (Fast Mode)** - Your quick-response buddy
   • Best for: Quick questions, local tips, directions
   • Specializes in: Philippine destinations, real-time help
   • Speed: Lightning fast ⚡

🧠 **Eva (Thinking Mode)** - Your strategic planner
   • Best for: Complex decisions, budget planning, comparisons
   • Specializes in: Deep analysis, itinerary optimization
   • Power: Advanced reasoning 💭

**Your trip to ${trip?.userSelection?.location || "your destination"}:**
📅 ${trip?.userSelection?.duration || 0} days | 👥 ${
        trip?.userSelection?.travelers || "Not specified"
      } | 💰 ${
        trip?.userSelection?.customBudget
          ? `₱${trip.userSelection.customBudget.toLocaleString()}`
          : trip?.userSelection?.budget || "Not set"
      }

**Try asking:**
• "What are the must-visit spots in ${
        trip?.userSelection?.location || "my destination"
      }?" (Rover 🚀)
• "Compare hotel options and help me decide" (Eva 🧠)
• "Where's the best local food?" (Rover 🚀)
• "Optimize my budget for activities vs accommodation" (Eva 🧠)

Which assistant would you like to chat with? 😊`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Smart AI suggestion based on input
  useEffect(() => {
    if (input.trim().length > 10 && isLongCatOnline) {
      // Analyze input to suggest best AI
      const shouldUseEva = LongCatService.shouldUseThinking(input);
      setSuggestedProvider(shouldUseEva ? "longcat" : "gemini");
    } else {
      setSuggestedProvider(null);
    }
  }, [input, isLongCatOnline]);

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
    checkLongCatHealth();
  }, []);

  // Health check function for Gemini
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

  // Health check function for LongCat
  const checkLongCatHealth = async () => {
    try {
      console.log("🔍 TripChatbot: Starting LongCat health check...");
      console.log("🔍 TripChatbot: longcatServiceRef.current exists?", !!longcatServiceRef.current);

      const health = await longcatServiceRef.current?.checkHealth();
      
      console.log("📦 TripChatbot: Received health data:", health);
      console.log("📦 TripChatbot: health.configured =", health?.configured);
      console.log("📦 TripChatbot: health.valid =", health?.valid);

      if (health && health.configured && health.valid) {
        setIsLongCatOnline(true);
        console.log("✅ TripChatbot: LongCat marked as ONLINE");
        logDebug("TripChatbot", "LongCat health check completed", health);
      } else {
        setIsLongCatOnline(false);
        console.log("⚠️ TripChatbot: LongCat marked as OFFLINE");
        console.log("⚠️ TripChatbot: Reason:", {
          healthExists: !!health,
          configured: health?.configured,
          valid: health?.valid
        });
        logDebug("TripChatbot", "LongCat not available", health);
      }
    } catch (error) {
      setIsLongCatOnline(false);
      console.error("❌ TripChatbot: LongCat Health Check Failed:", error);
      logError("TripChatbot", "LongCat health check error", error);
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

  // Send message using Gemini
  const sendGeminiMessage = async (userMessage, tripContext) => {
    const isFirstUserMessage = messages.length === 1;

    let fullPrompt;
    if (isFirstUserMessage) {
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
      fullPrompt = userMessage;
    }

    if (!chatSessionRef.current) {
      throw new Error("Gemini chat session not initialized");
    }

    const result = await chatSessionRef.current.sendMessage(fullPrompt, {
      requestType: "simple_query",
      chat_mode: true,
    });

    const response = result.response;
    return (
      response.text() ||
      "I couldn't generate a response right now. Please try again! 😊"
    );
  };

  // Send message using LongCat
  const sendLongCatMessage = async (userMessage, tripContext, useThinking) => {
    // Build conversation history for LongCat
    const conversationMessages = [
      {
        role: "system",
        content: `You are Rover, a friendly AI travel assistant for TravelRover. Help travelers with their trip to ${
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

BE: Conversational, friendly, helpful - like a travel buddy! Keep responses 2-4 paragraphs max. Use emojis naturally.`,
      },
      // Add recent conversation history (last 10 messages)
      ...messages.slice(-10).map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ];

    const result = await longcatServiceRef.current.chat(conversationMessages, {
      model: useThinking ? "thinking" : "chat",
      temperature: 0.7,
      maxTokens: 2000,
      enableThinking: useThinking,
    });

    return result.content;
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

    // Auto-detect if thinking mode should be used
    const shouldUseThinking = LongCatService.shouldUseThinking(userMessage);

    // ✅ Set lock to prevent concurrent requests
    isRequestInProgressRef.current = true;

    try {
      logDebug("TripChatbot", "Sending message", {
        messageLength: userMessage.length,
        conversationLength: messages.length,
        provider: aiProvider,
        thinkingMode: shouldUseThinking && aiProvider === "longcat",
      });

      const tripContext = getTripContext();
      let assistantMessage;

      // Route to appropriate AI provider
      if (aiProvider === "longcat" && isLongCatOnline) {
        // Use LongCat
        assistantMessage = await sendLongCatMessage(
          userMessage,
          tripContext,
          shouldUseThinking
        );
      } else {
        // ✅ IMPROVED: Notify user if Eva was selected but unavailable
        if (aiProvider === "longcat" && !isLongCatOnline) {
          toast.info("Eva Thinking Mode is currently unavailable. Rover is helping you instead! 🚀", {
            duration: 4000,
          });
          logDebug("TripChatbot", "Fallback to Gemini: LongCat offline");
        }
        
        // Use Gemini (default)
        assistantMessage = await sendGeminiMessage(userMessage, tripContext);
      }

      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date(),
        provider: aiProvider,
        thinkingMode: shouldUseThinking && aiProvider === "longcat",
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
      {/* Chat Header - Enhanced Premium Design with Dual AI Display */}
      <div className="relative flex items-center gap-4 px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-sky-50 via-blue-50/80 to-sky-50 dark:from-sky-950/50 dark:via-blue-950/40 dark:to-sky-950/50">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]"></div>

        {/* Active AI Avatar - Switches based on selection */}
        <div
          className={`relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden ring-2 transition-all duration-300 hover:scale-105 ${
            aiProvider === "longcat"
              ? "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 ring-purple-200/50 dark:ring-purple-700/50"
              : "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 ring-sky-200/50 dark:ring-sky-700/50"
          }`}
        >
          {/* Glow effect */}
          <div
            className={`absolute inset-0 blur-md ${
              aiProvider === "longcat"
                ? "bg-gradient-to-br from-purple-400/20 to-pink-600/20"
                : "bg-gradient-to-br from-sky-400/20 to-blue-600/20"
            }`}
          ></div>

          {aiProvider === "longcat" ? (
            <>
              <img
                src="/eva-avatar.png"
                alt="Eva"
                className="relative z-10 w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <Brain
                className="relative z-10 h-7 w-7 text-purple-600 dark:text-purple-400"
                style={{ display: "none" }}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Header Content - Dynamic based on selected AI */}
        <div className="flex-1 relative z-10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-0.5">
            {aiProvider === "longcat" ? (
              <>
                Eva
                <Brain className="h-4 w-4 text-purple-500 animate-pulse" />
              </>
            ) : (
              <>
                Rover
                <Zap className="h-4 w-4 text-sky-500 animate-pulse" />
              </>
            )}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {aiProvider === "longcat"
              ? "AI Strategic Planner • Deep Thinking Mode"
              : "AI Travel Buddy • Fast Response Mode"}{" "}
            • {trip?.userSelection?.location || "Ready to help"}
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
                  : message.provider === "longcat"
                  ? "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 ring-2 ring-purple-200/30 dark:ring-purple-700/30"
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
                  {/* Show Eva avatar for LongCat messages, Rover for Gemini */}
                  {message.provider === "longcat" ? (
                    <>
                      <img
                        src="/eva-avatar.png"
                        alt="Eva"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <Brain
                        className="h-5 w-5 text-purple-600 dark:text-purple-400"
                        style={{ display: "none" }}
                      />
                    </>
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
                {/* AI Provider Badge for assistant messages */}
                {message.role === "assistant" && message.provider && (
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                    {message.provider === "longcat" ? (
                      <>
                        <Brain className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                          Eva {message.thinkingMode ? "Thinking" : "AI"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                          Rover Fast
                        </span>
                      </>
                    )}
                  </div>
                )}
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
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden shadow-md ring-2 ${
                aiProvider === "longcat"
                  ? "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 ring-purple-200/30 dark:ring-purple-700/30"
                  : "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 ring-sky-200/30 dark:ring-sky-700/30"
              }`}
            >
              {aiProvider === "longcat" ? (
                <>
                  <img
                    src="/eva-avatar.png"
                    alt="Eva"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <Brain
                    className="h-6 w-6 text-purple-600 dark:text-purple-400"
                    style={{ display: "none" }}
                  />
                </>
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
                    className="h-6 w-6 text-sky-600 dark:text-sky-400"
                    style={{ display: "none" }}
                  />
                </>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 px-5 py-3.5 rounded-2xl shadow-sm border border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div style={{ animation: "spin 1s linear infinite" }}>
                  <Loader2
                    className={`h-5 w-5 ${
                      aiProvider === "longcat"
                        ? "text-purple-500"
                        : "text-sky-500"
                    }`}
                  />
                </div>
                <span className="text-[15px] text-gray-600 dark:text-gray-400 font-medium">
                  {aiProvider === "longcat"
                    ? "Eva is thinking"
                    : "Rover is thinking"}
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

        {/* Quick Start Example Questions - Only show for first-time users */}
        {messages.length === 1 && (
          <div className="mt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 text-center">
              ✨ Try these example questions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Rover Examples - Always available */}
              <button
                onClick={() => {
                  setAiProvider("gemini");
                  setInput(
                    `What are the must-visit spots in ${
                      trip?.userSelection?.location || "my destination"
                    }?`
                  );
                  inputRef.current?.focus();
                }}
                className="group flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md transition-all duration-300 text-left cursor-pointer"
              >
                <Zap className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sky-900 dark:text-sky-100 mb-0.5">
                    Must-visit spots
                  </p>
                  <p className="text-xs text-sky-700 dark:text-sky-300 line-clamp-2">
                    Quick local recommendations
                  </p>
                </div>
              </button>

              {/* Eva Example - Show with availability indicator */}
              <button
                onClick={() => {
                  if (isLongCatOnline) {
                    setAiProvider("longcat");
                    setInput(
                      "Compare hotel options and help me decide which is best for my budget"
                    );
                  } else {
                    setAiProvider("gemini");
                    setInput(
                      "Compare hotel options and help me decide which is best for my budget"
                    );
                    toast.info("Rover will help you compare hotels! 🚀");
                  }
                  inputRef.current?.focus();
                }}
                className={`group flex items-start gap-2.5 p-3 rounded-xl ${
                  isLongCatOnline
                    ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600"
                    : "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600"
                } hover:shadow-md transition-all duration-300 text-left cursor-pointer`}
              >
                {isLongCatOnline ? (
                  <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                ) : (
                  <Zap className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold mb-0.5 ${
                    isLongCatOnline
                      ? "text-purple-900 dark:text-purple-100"
                      : "text-sky-900 dark:text-sky-100"
                  }`}>
                    Compare hotels {!isLongCatOnline && "(via Rover)"}
                  </p>
                  <p className={`text-xs line-clamp-2 ${
                    isLongCatOnline
                      ? "text-purple-700 dark:text-purple-300"
                      : "text-sky-700 dark:text-sky-300"
                  }`}>
                    {isLongCatOnline ? "Deep analysis & recommendations" : "Analysis & recommendations"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setAiProvider("gemini");
                  setInput(
                    "Where can I find the best local food and restaurants?"
                  );
                  inputRef.current?.focus();
                }}
                className="group flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md transition-all duration-300 text-left cursor-pointer"
              >
                <Zap className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sky-900 dark:text-sky-100 mb-0.5">
                    Best local food
                  </p>
                  <p className="text-xs text-sky-700 dark:text-sky-300 line-clamp-2">
                    Fast restaurant suggestions
                  </p>
                </div>
              </button>

              {/* Eva Budget Example - Show with availability indicator */}
              <button
                onClick={() => {
                  if (isLongCatOnline) {
                    setAiProvider("longcat");
                    setInput(
                      "Help me optimize my budget between activities and accommodation"
                    );
                  } else {
                    setAiProvider("gemini");
                    setInput(
                      "Help me optimize my budget between activities and accommodation"
                    );
                    toast.info("Rover will help with budget planning! 🚀");
                  }
                  inputRef.current?.focus();
                }}
                className={`group flex items-start gap-2.5 p-3 rounded-xl ${
                  isLongCatOnline
                    ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600"
                    : "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600"
                } hover:shadow-md transition-all duration-300 text-left cursor-pointer`}
              >
                {isLongCatOnline ? (
                  <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                ) : (
                  <Zap className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold mb-0.5 ${
                    isLongCatOnline
                      ? "text-purple-900 dark:text-purple-100"
                      : "text-sky-900 dark:text-sky-100"
                  }`}>
                    Optimize budget {!isLongCatOnline && "(via Rover)"}
                  </p>
                  <p className={`text-xs line-clamp-2 ${
                    isLongCatOnline
                      ? "text-purple-700 dark:text-purple-300"
                      : "text-sky-700 dark:text-sky-300"
                  }`}>
                    {isLongCatOnline ? "Strategic planning & allocation" : "Planning & allocation"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Floating design with enhanced visual hierarchy */}
      <div className="relative px-5 py-4 border-t border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        {/* Subtle top shadow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent"></div>

        {/* AI Provider Selector - Enhanced Professional Design */}
        <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              Choose Your AI Assistant
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {aiProvider === "gemini" ? "⚡ Fast" : "🧠 Thinking"}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Rover Fast Button - Always available */}
            <button
              onClick={() => setAiProvider("gemini")}
              disabled={isBackendOnline === false}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                aiProvider === "gemini"
                  ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200 dark:shadow-sky-900/50 scale-105"
                  : "bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600"
              } ${isBackendOnline === false ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-2">
                <Zap
                  className={`h-4 w-4 ${
                    aiProvider === "gemini" ? "text-white" : "text-sky-500"
                  }`}
                />
                <span className="font-bold text-sm">Rover Fast</span>
                {isBackendOnline === true && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <span
                className={`text-xs ${
                  aiProvider === "gemini"
                    ? "text-white/90"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Quick answers & local tips
              </span>
            </button>

            {/* Eva Thinking Button - Show status */}
            <button
              onClick={() => {
                if (isLongCatOnline) {
                  setAiProvider("longcat");
                } else {
                  toast.warning("Eva Thinking Mode isn't available right now. Rover Fast is ready to help! 🚀", {
                    duration: 4000,
                  });
                }
              }}
              disabled={!isLongCatOnline}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                aiProvider === "longcat"
                  ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/50 scale-105"
                  : isLongCatOnline
                  ? "bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 cursor-pointer"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 border border-gray-300 dark:border-slate-700 cursor-not-allowed opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain
                  className={`h-4 w-4 ${
                    aiProvider === "longcat"
                      ? "text-white"
                      : isLongCatOnline
                      ? "text-purple-500"
                      : "text-gray-400"
                  }`}
                />
                <span className="font-bold text-sm">Eva Thinking</span>
                {isLongCatOnline === true && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
                {isLongCatOnline === false && (
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
              <span
                className={`text-xs ${
                  aiProvider === "longcat"
                    ? "text-white/90"
                    : isLongCatOnline
                    ? "text-gray-500 dark:text-gray-400"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {isLongCatOnline === false ? "Currently unavailable" : "Deep analysis & planning"}
              </span>
            </button>
          </div>

          {/* Status explanation when Eva is offline */}
          {isLongCatOnline === false && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <span>ℹ️</span>
                <span>Eva is taking a break. Rover is ready to help with all your travel questions!</span>
              </p>
            </div>
          )}
        </div>

        {/* Smart Suggestion Banner - Shows when AI recommendation differs from current selection */}
        {suggestedProvider &&
          suggestedProvider !== aiProvider &&
          input.trim().length > 10 &&
          // ✅ IMPROVED: Only show Eva suggestion if it's actually available
          (suggestedProvider !== "longcat" || isLongCatOnline) && (
            <div
              className={`mb-3 p-3 rounded-xl border-2 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                suggestedProvider === "longcat"
                  ? "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-300 dark:border-purple-700"
                  : "bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-sky-300 dark:border-sky-700"
              }`}
            >
              <div className="flex items-center gap-3">
                {suggestedProvider === "longcat" ? (
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                ) : (
                  <Zap className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                )}

                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold mb-0.5 ${
                      suggestedProvider === "longcat"
                        ? "text-purple-900 dark:text-purple-100"
                        : "text-sky-900 dark:text-sky-100"
                    }`}
                  >
                    💡{" "}
                    {suggestedProvider === "longcat"
                      ? "Eva Thinking"
                      : "Rover Fast"}{" "}
                    recommended
                  </p>
                  <p
                    className={`text-xs ${
                      suggestedProvider === "longcat"
                        ? "text-purple-700 dark:text-purple-300"
                        : "text-sky-700 dark:text-sky-300"
                    }`}
                  >
                    {suggestedProvider === "longcat"
                      ? "This question needs deep analysis or comparison"
                      : "This is a quick question - Rover can answer faster"}
                  </p>
                </div>

                <button
                  onClick={() => setAiProvider(suggestedProvider)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm ${
                    suggestedProvider === "longcat"
                      ? "bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                      : "bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
                  }`}
                >
                  Switch →
                </button>
              </div>
            </div>
          )}

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
              <div style={{ animation: "spin 1s linear infinite" }}>
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
