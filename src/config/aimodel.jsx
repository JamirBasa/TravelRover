import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GeminiProxyChatSession } from "./geminiProxyService";

// Configuration: Use proxy or direct API
const USE_PROXY = import.meta.env.VITE_USE_GEMINI_PROXY === "true" || true; // Default to proxy for security

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;

if (!USE_PROXY && !apiKey) {
  throw new Error(
    "VITE_GOOGLE_GEMINI_AI_API_KEY is not defined in environment variables"
  );
}

console.log("API KEY configured:", apiKey ? "✓" : "✗");
console.log(
  "Gemini Proxy Mode:",
  USE_PROXY ? "ENABLED (secure)" : "DISABLED (direct)"
);

const genAI = USE_PROXY ? null : new GoogleGenerativeAI(apiKey);

// Ultra-strict generation config for maximum JSON reliability
const generationConfig = {
  temperature: 0.2, // Balanced for consistency and creativity
  topP: 0.9,
  topK: 20,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      tripName: { type: "string" },
      destination: { type: "string" },
      duration: { type: "string" },
      budget: { type: "string" },
      travelers: { type: "string" },
      startDate: { type: "string" },
      endDate: { type: "string" },
      currency: { type: "string" },
      hotels: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            hotelName: { type: "string" },
            hotelAddress: { type: "string" },
            pricePerNight: { type: "string" },
            description: { type: "string" },
          },
          required: [
            "hotelName",
            "hotelAddress",
            "pricePerNight",
            "description",
          ],
        },
      },
      itinerary: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            day: { type: "integer", minimum: 1 },
            theme: { type: "string" },
            plan: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  placeName: { type: "string" },
                  placeDetails: { type: "string" },
                  ticketPricing: { type: "string" },
                  timeTravel: { type: "string" },
                },
                required: [
                  "time",
                  "placeName",
                  "placeDetails",
                  "ticketPricing",
                  "timeTravel",
                ],
              },
            },
          },
          required: ["day", "theme", "plan"],
        },
      },
      placesToVisit: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            placeName: { type: "string" },
            placeDetails: { type: "string" },
            ticketPricing: { type: "string" },
            timeTravel: { type: "string" },
          },
          required: [
            "placeName",
            "placeDetails",
            "ticketPricing",
            "timeTravel",
          ],
        },
      },
    },
    required: [
      "tripName",
      "destination",
      "duration",
      "budget",
      "travelers",
      "currency",
      "hotels",
      "itinerary",
      "placesToVisit",
    ],
  },
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const model = USE_PROXY
  ? null // Model not needed in proxy mode
  : genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings,
    });

const systemPrompt = `Generate ONLY valid JSON for travel itineraries. 

CRITICAL REQUIREMENTS:
1. Return ONLY JSON - no extra text, no markdown, no code blocks
2. Use double quotes for all strings  
3. NO TRAILING COMMAS - remove all commas before } or ]
4. Complete every object and array properly
5. Include 3-4 hotels, 2-4 activities per day, 5-8 places to visit
6. Use realistic pricing in PHP
7. Keep descriptions under 80 characters
8. Must be parseable by JSON.parse()
9. NEVER truncate - complete the entire JSON structure
10. Response must end with proper closing brace }

FORBIDDEN:
- NO trailing commas like "property": "value",}
- NO incomplete objects like {"name": "place",...
- NO extra characters after final }
- NO missing closing braces or brackets

EXAMPLE of CORRECT format:
{
  "tripName": "Manila Adventure",
  "destination": "Manila, Philippines",
  "duration": "3",
  "budget": "Moderate",
  "travelers": "A Couple",
  "currency": "PHP",
  "hotels": [
    {
      "hotelName": "Sample Hotel",
      "hotelAddress": "123 Street, Manila",
      "pricePerNight": "₱3,500",
      "description": "Modern hotel with great amenities"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "theme": "Cultural Exploration",
      "plan": [
        {
          "time": "9:00 AM",
          "placeName": "Rizal Park",
          "placeDetails": "Historic park in the heart of Manila",
          "ticketPricing": "Free",
          "timeTravel": "30 minutes"
        }
      ]
    }
  ],
  "placesToVisit": [
    {
      "placeName": "Intramuros",
      "placeDetails": "Historic walled city",
      "ticketPricing": "₱75",
      "timeTravel": "45 minutes"
    }
  ]
}

Response must be complete, valid JSON that ends properly.`;

export const chatSession = USE_PROXY
  ? new GeminiProxyChatSession(generationConfig) // Use proxy
  : model.startChat({
      // Use direct API
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I will generate only valid JSON that exactly matches the schema with no additional formatting or text.",
            },
          ],
        },
      ],
    });
