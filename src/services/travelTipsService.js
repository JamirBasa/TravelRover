/**
 * AI-Powered Travel Tips Service
 * Generates destination-specific, personalized travel tips using Gemini AI
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GeminiProxyChatSession } from "../config/geminiProxyService";
import { logDebug, logError } from "../utils/productionLogger";

// Use proxy or direct API (match aimodel.jsx configuration)
const USE_PROXY = import.meta.env.VITE_USE_GEMINI_PROXY === "true" || true;
const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;

// Initialize AI for travel tips (JSON mode without strict schema)
const genAI = USE_PROXY ? null : new GoogleGenerativeAI(apiKey);
const model = USE_PROXY
  ? null
  : genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

// Lightweight generation config for tips
const tipsGenerationConfig = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// Create chat session for tips
const tipsChatSession = USE_PROXY
  ? new GeminiProxyChatSession(tipsGenerationConfig)
  : model.startChat({
      generationConfig: tipsGenerationConfig,
    });

/**
 * Generate personalized travel tips for a specific destination
 * @param {Object} tripContext - Trip and user context
 * @returns {Promise<Object>} Generated tips organized by category
 */
export const generateTravelTips = async (tripContext) => {
  const { location, duration } = tripContext;

  logDebug("TravelTipsService", "Generating tips for destination", {
    location,
    duration,
    hasContext: !!tripContext,
  });

  // Build context-aware prompt
  const prompt = buildTipsPrompt(tripContext);

  logDebug("TravelTipsService", "Sending prompt to AI", {
    promptLength: prompt.length,
    useProxy: USE_PROXY,
  });

  try {
    const result = await tipsChatSession.sendMessage(prompt);
    
    if (!result || !result.response) {
      throw new Error("Empty response from AI");
    }
    
    const responseText = result.response.text();

    logDebug("TravelTipsService", "Raw AI response received", {
      responseLength: responseText.length,
    });

    // Parse JSON response
    const tipsData = JSON.parse(responseText);

    // Validate structure
    if (!tipsData.tips || !Array.isArray(tipsData.tips)) {
      throw new Error("Invalid tips structure received from AI");
    }

    logDebug("TravelTipsService", "Tips generated successfully", {
      tipsCount: tipsData.tips.length,
      categories: tipsData.tips.map((t) => t.category),
    });

    return {
      success: true,
      data: {
        ...tipsData,
        generatedAt: new Date().toISOString(),
        location,
      },
    };
  } catch (error) {
    const errorMessage = error?.message || String(error);
    logError("TravelTipsService", "Failed to generate tips", {
      error: errorMessage,
      errorName: error?.name,
      errorType: typeof error,
      location,
      stack: error?.stack?.substring(0, 500),
    });

    return {
      success: false,
      error: errorMessage,
      fallback: getGenericTips(location),
    };
  }
};

/**
 * Build optimized prompt for travel tips generation
 */
const buildTipsPrompt = (context) => {
  const {
    location,
    duration,
    travelers,
    budget,
    startDate,
    transportMode,
    userProfile,
    specificRequests,
  } = context;

  // Calculate months until trip for time-sensitive tips
  const tripDate = startDate ? new Date(startDate) : null;
  const monthsUntilTrip = tripDate
    ? Math.ceil((tripDate - new Date()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  // Build user context
  const userContext = buildUserContext(userProfile);
  const budgetContext = buildBudgetContext(budget);

  return `Generate 6-8 HIGHLY SPECIFIC and ACTIONABLE travel tips for ${location}, Philippines.

**Trip Context:**
- Duration: ${duration} days
- Travelers: ${travelers}
- Budget: ${budgetContext}
- Transport: ${transportMode === "ground_preferred" ? "Bus/Van" : "Flight"}
${monthsUntilTrip ? `- Departure: ${monthsUntilTrip} month(s) from now` : ""}
${specificRequests ? `- Special Requests: ${specificRequests}` : ""}

**User Profile:**
${userContext}

**Critical Requirements:**
1. **DESTINATION-SPECIFIC**: Mention ACTUAL places, addresses, emergency numbers, local customs for ${location}
2. **ACTIONABLE**: Each tip must have concrete steps (e.g., "Download GCash app for ₱50 rides" not "Have payment options")
3. **CURRENT 2025 INFO**: Use latest prices, phone numbers, regulations for Philippines
4. **BUDGET-ALIGNED**: Match ${budgetContext} spending level
5. **TIME-RELEVANT**: ${monthsUntilTrip ? `Include booking windows for ${monthsUntilTrip}-month advance` : "Include last-minute tips"}

**Categories (assign each tip):**
- safety: Emergency contacts, health precautions, safety zones for ${location}
- cultural: Dress codes, etiquette, local customs specific to ${location}
- practical: Transport apps, SIM cards, ATMs, currency exchange in ${location}
- budget: Cost-saving hacks, affordable eats, free activities in ${location}
- transport: ${transportMode === "ground_preferred" ? "Bus terminals, van schedules, routes to ${location}" : "Airport tips, transfers, local transport in ${location}"}
- activities: Hidden gems, best times to visit attractions, booking tips for ${location}

**Format (JSON only, no markdown):**
{
  "destination": "${location}",
  "tips": [
    {
      "category": "safety|cultural|practical|budget|transport|activities",
      "title": "Short title (5-8 words)",
      "description": "Detailed, actionable advice with SPECIFIC names/numbers/prices for ${location}",
      "icon": "emoji"
    }
  ],
  "emergencyContacts": {
    "police": "Actual ${location} police number",
    "hospital": "Nearest hospital name and number",
    "tourism": "${location} tourism office contact"
  },
  "localInsights": [
    "2-3 insider tips that only locals know about ${location}"
  ]
}

Generate now:`;
};

/**
 * Build user context from profile
 */
const buildUserContext = (userProfile) => {
  if (!userProfile) return "Standard traveler preferences";

  const parts = [];

  if (userProfile.dietaryRestrictions?.length > 0) {
    parts.push(`Dietary: ${userProfile.dietaryRestrictions.join(", ")}`);
  }

  if (userProfile.culturalPreferences?.length > 0) {
    parts.push(`Cultural: ${userProfile.culturalPreferences.join(", ")}`);
  }

  if (userProfile.languagePreferences?.length > 0) {
    parts.push(`Languages: ${userProfile.languagePreferences.join(", ")}`);
  }

  if (userProfile.travelStyle) {
    parts.push(`Style: ${userProfile.travelStyle}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Standard traveler preferences";
};

/**
 * Build budget context
 */
const buildBudgetContext = (budget) => {
  if (!budget) return "Moderate budget";

  if (typeof budget === "string") {
    if (budget.includes("Custom:")) {
      return budget.replace("Custom:", "₱");
    }
    return budget;
  }

  if (typeof budget === "number") {
    return `₱${budget.toLocaleString()}`;
  }

  return "Moderate budget";
};

/**
 * Get generic fallback tips when AI fails
 */
export const getGenericTips = (location) => {
  return {
    destination: location,
    tips: [
      {
        category: "safety",
        title: "Keep Important Documents Safe",
        description:
          "Store digital and physical copies of passport, IDs, and travel insurance. Keep emergency contacts accessible.",
        icon: "🛡️",
      },
      {
        category: "cultural",
        title: "Learn Basic Local Phrases",
        description:
          'Practice "Salamat" (Thank you), "Magkano?" (How much?), and "Saan ang..." (Where is...) to connect with locals.',
        icon: "🌏",
      },
      {
        category: "practical",
        title: "Download Essential Apps",
        description:
          "Install Google Maps (offline), Grab/GCash for transport, and translation apps before departure.",
        icon: "📱",
      },
      {
        category: "budget",
        title: "Cash and Payment Mix",
        description:
          "Carry ₱1,000-2,000 in small bills. Many local eateries and transports are cash-only.",
        icon: "💰",
      },
      {
        category: "transport",
        title: "Book Transport Early",
        description:
          "Reserve buses/vans or flights 2-4 weeks ahead for better prices and availability.",
        icon: "🚌",
      },
      {
        category: "activities",
        title: "Check Weather and Season",
        description:
          "Philippines has wet (June-Nov) and dry seasons. Plan beach activities accordingly.",
        icon: "🌤️",
      },
    ],
    emergencyContacts: {
      police: "117 (National Emergency)",
      hospital: "Call 911 for medical emergencies",
      tourism: "Department of Tourism Hotline: (02) 8524-1728",
    },
    localInsights: [
      "Filipinos are known for hospitality - don't hesitate to ask locals for help",
      "Tipping 10% is appreciated but not mandatory in restaurants",
      "Best exchange rates are usually at malls, not airports",
    ],
    generatedAt: new Date().toISOString(),
    location,
    isFallback: true,
  };
};

/**
 * Category metadata for UI rendering
 */
export const TIPS_CATEGORIES = {
  safety: {
    label: "Safety & Health",
    icon: "🛡️",
    color: "red",
    description: "Emergency contacts and safety precautions",
  },
  cultural: {
    label: "Cultural Etiquette",
    icon: "🌏",
    color: "purple",
    description: "Local customs and respectful practices",
  },
  practical: {
    label: "Practical Info",
    icon: "📱",
    color: "blue",
    description: "Apps, SIM cards, and daily essentials",
  },
  budget: {
    label: "Money Matters",
    icon: "💰",
    color: "green",
    description: "Cost-saving tips and payment advice",
  },
  transport: {
    label: "Getting Around",
    icon: "🚌",
    color: "orange",
    description: "Transportation and navigation tips",
  },
  activities: {
    label: "Activities & Attractions",
    icon: "🎯",
    color: "cyan",
    description: "Things to do and insider recommendations",
  },
};
