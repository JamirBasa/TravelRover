import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Brain, Zap, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import MarkdownMessage from "./MarkdownMessage";
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
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll-to-bottom button state
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageCountRef = useRef(messages.length);

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
      setUnreadCount(0); // Reset unread count when scrolling to bottom
      setShowScrollButton(false);
    }, 100); // Small delay ensures React has rendered new message
  };

  // Handle scroll event to show/hide scroll button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
    
    setShowScrollButton(!isNearBottom);
    
    if (isNearBottom) {
      setUnreadCount(0); // Clear unread count if user manually scrolls to bottom
    }
  };

  useEffect(() => {
    // Check if new messages were added
    if (messages.length > lastMessageCountRef.current) {
      const newMessageCount = messages.length - lastMessageCountRef.current;
      
      // Only proceed if there's actually a new message (not initial render)
      if (newMessageCount > 0 && lastMessageCountRef.current > 0) {
        // Check if user is scrolled up
        if (messagesContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
          
          if (!isNearBottom) {
            // User scrolled up - show unread badge instead of auto-scrolling
            setUnreadCount(prev => prev + newMessageCount);
            setShowScrollButton(true);
          } else {
            // User at bottom - auto-scroll to new message
            scrollToBottom();
          }
        } else {
          // Container not ready yet - just scroll
          scrollToBottom();
        }
      } else if (lastMessageCountRef.current === 0) {
        // Initial load - scroll to bottom
        scrollToBottom();
      }
    }
    
    lastMessageCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]); // Only depend on messages array

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
    if (!chatSessionRef.current) {
      throw new Error("Gemini chat session not initialized");
    }

    // Build conversation context with recent messages (last 6 for context)
    const recentMessages = messages
      .slice(-6)
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? 'Traveler' : 'Rover'}: ${msg.content}`)
      .join('\n\n');

    const systemPrompt = `You are Rover, a friendly AI travel assistant for TravelRover helping plan a trip to ${tripContext.destination}.

TRIP CONTEXT:
🌍 Destination: ${tripContext.destination}
📅 Duration: ${tripContext.duration} days
👥 Travelers: ${tripContext.travelers}
💰 Budget: ${tripContext.budget}
${tripContext.hasItinerary ? '✅ Itinerary planned' : '📝 No itinerary yet'}
${tripContext.hasHotels ? '✅ Hotels arranged' : '🏨 No hotels yet'}

INSTRUCTIONS: Answer naturally and conversationally. Keep responses concise (2-4 paragraphs). Use emojis appropriately. Consider the conversation history below.

${recentMessages ? `RECENT CONVERSATION:\n${recentMessages}\n\n` : ''}CURRENT QUESTION: ${userMessage}

YOUR RESPONSE:`;

    const fullPrompt = systemPrompt;

    const result = await chatSessionRef.current.sendMessage(fullPrompt, {
      requestType: "simple_query",
      chat_mode: true,
    });

    const response = result.response;
    let responseText = response.text();
    
    // Handle backend responses with _raw_text field (when JSON parsing fails)
    if (typeof responseText === 'string') {
      try {
        const parsed = JSON.parse(responseText);
        if (parsed._raw_text && parsed._is_raw) {
          responseText = parsed._raw_text;
        }
      } catch (e) {
        // Not JSON, use as-is
      }
    }
    
    return (
      responseText ||
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

    let content = result.content;
    
    // Handle responses with _raw_text field (when JSON parsing fails)
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (parsed._raw_text && parsed._is_raw) {
          content = parsed._raw_text;
        }
      } catch (e) {
        // Not JSON, use as-is
      }
    } else if (typeof content === 'object' && content._raw_text && content._is_raw) {
      content = content._raw_text;
    }
    
    return content;
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

      setMessages((prev) => {
        // Prevent duplicate messages (check last message)
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.content === assistantMessage && 
            lastMsg.role === "assistant" && 
            Date.now() - lastMsg.id < 1000) {
          logDebug("TripChatbot", "Duplicate message detected, skipping");
          return prev;
        }
        return [...prev, assistantMsg];
      });
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
    <div className="flex flex-col h-full min-h-[600px] max-h-[800px] bg-white dark:bg-slate-950 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Chat Header - Minimalist Clean Design */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        {/* Left: AI Info */}
        <div className="flex items-center gap-3">
          {/* Simple Avatar - No rings or gradients */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              aiProvider === "longcat"
                ? "bg-purple-100 dark:bg-purple-950/50"
                : "bg-sky-100 dark:bg-sky-950/50"
            }`}
          >
            {aiProvider === "longcat" ? (
              <>
                <img
                  src="/eva-avatar.png"
                  alt="Eva"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
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
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <Zap
                  className="h-5 w-5 text-sky-600 dark:text-sky-400"
                  style={{ display: "none" }}
                />
              </>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {aiProvider === "longcat" ? "Eva" : "Rover"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {aiProvider === "longcat" ? "Strategic Planner" : "Quick Answers"}
            </p>
          </div>
        </div>

        {/* Right: Simple AI Toggle */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-900 rounded-full">
          <button
            onClick={() => setAiProvider("gemini")}
            disabled={isBackendOnline === false}
            className={`p-1.5 rounded-full transition-all ${
              aiProvider === "gemini"
                ? "bg-white dark:bg-slate-800 shadow-sm"
                : "hover:bg-gray-100 dark:hover:bg-slate-800"
            } ${isBackendOnline === false ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
            title="Rover - Quick Answers"
          >
            <Zap className={`h-4 w-4 ${
              aiProvider === "gemini" ? "text-sky-600 dark:text-sky-400" : "text-gray-400"
            }`} />
          </button>
          <button
            onClick={() => {
              if (isLongCatOnline) {
                setAiProvider("longcat");
              } else {
                toast.info("Eva is currently unavailable. Using Rover instead.");
              }
            }}
            disabled={!isLongCatOnline}
            className={`p-1.5 rounded-full transition-all ${
              aiProvider === "longcat"
                ? "bg-white dark:bg-slate-800 shadow-sm"
                : isLongCatOnline
                ? "hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                : "opacity-30 cursor-not-allowed"
            }`}
            title={isLongCatOnline ? "Eva - Deep Analysis" : "Eva - Unavailable"}
          >
            <Brain className={`h-4 w-4 ${
              aiProvider === "longcat" ? "text-purple-600 dark:text-purple-400" : "text-gray-400"
            }`} />
          </button>
        </div>
      </div>

      {/* Messages Container - Minimalist Clean Design */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent bg-white dark:bg-slate-950 relative"
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-in fade-in duration-300 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar - Minimal Design */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                message.role === "user"
                  ? "bg-gray-100 dark:bg-slate-900"
                  : message.isError
                  ? "bg-red-100 dark:bg-red-950"
                  : message.provider === "longcat"
                  ? "bg-purple-100 dark:bg-purple-950/50"
                  : "bg-sky-100 dark:bg-sky-950/50"
              }`}
            >
              {message.role === "user" ? (
                currentUser?.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.nextSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null
              ) : message.isError ? (
                <Bot className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <>
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
                        className="h-4 w-4 text-purple-600 dark:text-purple-400"
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
                      <Zap
                        className="h-4 w-4 text-sky-600 dark:text-sky-400"
                        style={{ display: "none" }}
                      />
                    </>
                  )}
                </>
              )}
              {message.role === "user" && (
                <div
                  className="w-full h-full bg-sky-500 dark:bg-sky-600 flex items-center justify-center"
                  style={{ display: currentUser?.picture ? "none" : "flex" }}
                >
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            {/* Message Bubble - Clean Minimal Design */}
            <div className={`flex flex-col max-w-[75%] sm:max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`px-4 py-2.5 rounded-2xl ${
                  message.role === "user"
                    ? "bg-sky-500 dark:bg-sky-600 text-white"
                    : message.isError
                    ? "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-900"
                    : "bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-slate-800"
                }`}
              >
                <div className="text-sm">
                  <MarkdownMessage 
                    content={message.content} 
                    isUser={message.role === "user"}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-600 mt-1 px-2">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator - Minimal */}
        {isLoading && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                aiProvider === "longcat"
                  ? "bg-purple-100 dark:bg-purple-950/50"
                  : "bg-sky-100 dark:bg-sky-950/50"
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
                    className="h-4 w-4 text-purple-600 dark:text-purple-400"
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
                  <Zap
                    className="h-4 w-4 text-sky-600 dark:text-sky-400"
                    style={{ display: "none" }}
                  />
                </>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div style={{ animation: "spin 1s linear infinite" }}>
                  <Loader2
                    className={`h-4 w-4 ${
                      aiProvider === "longcat"
                        ? "text-purple-500"
                        : "text-sky-500"
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {aiProvider === "longcat" ? "Thinking" : "Thinking"}
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
        
        {/* Scroll to Bottom Button - Centered at bottom */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 w-12 h-12 bg-white dark:bg-slate-800 border-2 border-sky-500 dark:border-sky-400 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-10 group"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-5 w-5 text-sky-600 dark:text-sky-400 group-hover:translate-y-0.5 transition-transform" />
            
            {/* Unread message badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Input Area - Minimalist Clean Design */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        {/* Smart Suggestion - Minimal Design */}
        {suggestedProvider &&
          suggestedProvider !== aiProvider &&
          input.trim().length > 10 &&
          (suggestedProvider !== "longcat" || isLongCatOnline) && (
            <div className={`mb-3 p-3 rounded-lg border flex items-center gap-3 ${
              suggestedProvider === "longcat"
                ? "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900"
                : "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900"
            }`}>
              {suggestedProvider === "longcat" ? (
                <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              ) : (
                <Zap className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              )}
              <p className="flex-1 text-xs text-gray-600 dark:text-gray-400">
                Try <strong>{suggestedProvider === "longcat" ? "Eva" : "Rover"}</strong> for better results
              </p>
              <button
                onClick={() => setAiProvider(suggestedProvider)}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Switch
              </button>
            </div>
          )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your trip..."
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-300 dark:focus:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim() || isBackendOnline === false}
            className="px-5 py-3 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 dark:hover:bg-sky-700 active:scale-95 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={isBackendOnline === false ? "Connection unavailable" : ""}
          >
            {isLoading ? (
              <div style={{ animation: "spin 1s linear infinite" }}>
                <Loader2 className="h-4 w-4" />
              </div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline text-sm">Send</span>
          </button>
        </form>

        {/* Connection Status - Minimal */}
        {isBackendOnline === false && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <span>Connection unavailable</span>
            <button
              onClick={checkBackendHealth}
              className="font-medium underline cursor-pointer hover:text-amber-700 dark:hover:text-amber-300"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripChatbot;
