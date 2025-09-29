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

// Simplified generation config for better reliability
const generationConfig = {
  temperature: 0.1,
  topP: 0.8,
  topK: 20,
  maxOutputTokens: 4096,
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
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            address: { type: "string" },
            price: { type: "string" },
            imageUrl: { type: "string" },
            rating: { type: "number" },
            description: { type: "string" },
          },
          required: ["name", "address", "price", "rating"],
        },
      },
      itinerary: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            day: { type: "integer" },
            theme: { type: "string" },
            activities: {
              type: "array",
              maxItems: 6,
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  place: { type: "string" },
                  details: { type: "string" },
                  cost: { type: "string" },
                  duration: { type: "string" },
                },
                required: ["time", "place", "details"],
              },
            },
          },
          required: ["day", "theme", "activities"],
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

// Minimal, focused system prompt
const systemPrompt = `You are a travel planning assistant. Return ONLY valid JSON matching the exact schema provided. No additional text or markdown formatting.

Requirements:
- Use realistic prices in the specified currency
- Provide 3-5 hotel options
- Create detailed daily itineraries
- Include specific places, times, and costs
- All JSON must be properly formatted with no syntax errors`;

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
          text: "I understand. I will generate travel plans as valid JSON following the exact schema, with no additional formatting or text.",
        },
      ],
    },
  ],
});
