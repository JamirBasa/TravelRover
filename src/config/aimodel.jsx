import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;

if (!apiKey) {
  throw new Error(
    "VITE_GOOGLE_GEMINI_AI_API_KEY is not defined in environment variables"
  );
}

console.log("API KEY configured:", apiKey ? "✓" : "✗");

const genAI = new GoogleGenerativeAI(apiKey);

// Ultra-strict generation config for maximum JSON reliability
const generationConfig = {
  temperature: 0.05, // Extremely low for consistency
  topP: 0.9,
  topK: 10,
  maxOutputTokens: 16384, // Maximum possible tokens for complete responses
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
            imageUrl: { type: "string" },
            geoCoordinates: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" },
              },
              required: ["latitude", "longitude"],
            },
            rating: { type: "number", minimum: 1, maximum: 5 },
            description: { type: "string" },
          },
          required: [
            "hotelName",
            "hotelAddress",
            "pricePerNight",
            "imageUrl",
            "geoCoordinates",
            "rating",
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
                  imageUrl: { type: "string" },
                  geoCoordinates: {
                    type: "object",
                    properties: {
                      latitude: { type: "number" },
                      longitude: { type: "number" },
                    },
                    required: ["latitude", "longitude"],
                  },
                  ticketPricing: { type: "string" },
                  timeTravel: { type: "string" },
                  rating: { type: "number", minimum: 1, maximum: 5 },
                },
                required: [
                  "time",
                  "placeName",
                  "placeDetails",
                  "imageUrl",
                  "geoCoordinates",
                  "ticketPricing",
                  "timeTravel",
                  "rating",
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
            imageUrl: { type: "string" },
            geoCoordinates: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" },
              },
              required: ["latitude", "longitude"],
            },
            ticketPricing: { type: "string" },
            timeTravel: { type: "string" },
            rating: { type: "number", minimum: 1, maximum: 5 },
          },
          required: [
            "placeName",
            "placeDetails",
            "imageUrl",
            "geoCoordinates",
            "ticketPricing",
            "timeTravel",
            "rating",
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

export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  safetySettings,
});

// Extremely focused system prompt for JSON reliability
const systemPrompt = `Generate ONLY valid JSON for travel itineraries. 

CRITICAL REQUIREMENTS:
1. Return ONLY JSON - no extra text
2. Use double quotes for all strings  
3. Ensure complete JSON structure with all closing braces
4. Include 3-5 hotels, daily itinerary, and places to visit
5. Use realistic coordinates and pricing in PHP
6. Keep descriptions concise (max 100 chars each)
7. Must be parseable by JSON.parse()

Response must be complete and properly terminated JSON.`;

export const chatSession = model.startChat({
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
