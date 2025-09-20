import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;

// Add error checking for API key
if (!apiKey) {
  throw new Error("VITE_GOOGLE_GEMINI_AI_API_KEY is not defined in environment variables");
}

console.log("API KEY configured:", apiKey ? "✓" : "✗");

const genAI = new GoogleGenerativeAI(apiKey);

// Improved generation config with better settings for structured JSON output
const generationConfig = {
  temperature: 0.7, // Reduced for more consistent structured output
  topP: 0.8, // Slightly reduced for better consistency
  topK: 40, // Reduced for more focused responses
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// Add safety settings to prevent harmful content
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
  model: "gemini-1.5-flash",
  safetySettings,
});

// Enhanced system prompt for better structured output
const systemPrompt = `You are a travel planning assistant that generates detailed travel plans in JSON format. 

IMPORTANT REQUIREMENTS:
1. Always return valid JSON with the exact structure requested
2. For hotel recommendations, provide realistic prices in the local currency
3. Use placeholder image URLs (https://images.unsplash.com/...) for all imageUrl fields
4. Provide accurate geo coordinates for real locations
5. For daily accommodations in itinerary, always include complete hotel details - never use references
6. Include realistic time estimates and pricing
7. Consider the specified budget level when making recommendations
8. Ensure all places and hotels are real and exist in the specified location

Structure your response with:
- travelPlan: basic trip information
- tripData: containing hotels array and itinerary array
- Each hotel must have: hotelName, hotelAddress, pricePerNight, imageUrl, geoCoordinates, rating, description
- Each itinerary day must have: day, theme, plan array with detailed place information`;

export const chatSession = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {
          text: systemPrompt
        }
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: "I understand. I will generate detailed travel plans in the exact JSON format specified, with complete hotel information for each day, realistic pricing, and proper structure. I'll ensure all locations are real and provide comprehensive details for hotels and attractions."
        }
      ],
    },
    {
      role: "user",
      parts: [
        {
          text: "Generate Travel Plan for Location: Cebu Philippines, Currency PHP, for 3 Days for Couple with a Cheap budget. Give me multiple Hotels options (at least 3-5 hotels) with HotelName, Hotel address, Price, hotel image url, geo coordinates, rating, descriptions and suggest itinerary with placeName, Place Details, Place Image Url, Geo Coordinates, rating, ticket Pricing, Time travel each of the location for 3 days with each day plan with best time to visit in JSON format. Structure the response with 'hotels' array at the top level of tripData, and also include accommodation recommendations for each day in the itinerary. IMPORTANT: For daily accommodations, always provide full hotel details (name, address, price, etc.) even if it's the same hotel across multiple days. Avoid using references like 'Same as Day 1' - instead repeat the complete accommodation information."
        }
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: `{
  "travelPlan": {
    "location": "Cebu, Philippines",
    "currency": "PHP",
    "days": 3,
    "travelers": "Couple",
    "budget": "Cheap"
  },
  "tripData": {
    "hotels": [
      {
        "hotelName": "Mad Monkey Hostel Cebu City",
        "hotelAddress": "Don Julio Llorente Street, Lahug, Cebu City, 6000 Cebu",
        "pricePerNight": "PHP 900 - 1300",
        "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        "geoCoordinates": {
          "latitude": 10.3124,
          "longitude": 123.8969
        },
        "rating": 8.4,
        "description": "Popular backpacker hostel with private rooms perfect for couples. Features rooftop bar, common areas, and walking distance to IT Park."
      },
      {
        "hotelName": "Z Hostel",
        "hotelAddress": "Salinas Drive, Lahug, Cebu City, 6000 Cebu",
        "pricePerNight": "PHP 800 - 1200",
        "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
        "geoCoordinates": {
          "latitude": 10.3156,
          "longitude": 123.8943
        },
        "rating": 8.1,
        "description": "Modern hostel in IT Park area with comfortable private rooms, co-working spaces, and good security."
      },
      {
        "hotelName": "Sugbutel Family Hotel",
        "hotelAddress": "Escario Street, Cebu City, 6000 Cebu",
        "pricePerNight": "PHP 1000 - 1500",
        "imageUrl": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        "geoCoordinates": {
          "latitude": 10.3098,
          "longitude": 123.8912
        },
        "rating": 7.8,
        "description": "Family-run budget hotel offering clean, basic rooms with AC and private bathrooms. Good value for couples."
      },
      {
        "hotelName": "OYO 106 Hotel Elizabeth",
        "hotelAddress": "Juan Luna Avenue, Mabolo, Cebu City, 6000 Cebu",
        "pricePerNight": "PHP 700 - 1100",
        "imageUrl": "https://images.unsplash.com/photo-1568084680786-a84f91d1153c",
        "geoCoordinates": {
          "latitude": 10.3267,
          "longitude": 123.9066
        },
        "rating": 7.5,
        "description": "Budget hotel with basic amenities, clean rooms, and good location near shopping centers."
      },
      {
        "hotelName": "GV Capitol Hills Hotel",
        "hotelAddress": "Gorordo Avenue, Lahug, Cebu City, 6000 Cebu",
        "pricePerNight": "PHP 1200 - 1800",
        "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
        "geoCoordinates": {
          "latitude": 10.3201,
          "longitude": 123.8945
        },
        "rating": 8.0,
        "description": "Mid-range hotel offering good value with comfortable rooms, restaurant, and central location."
      }
    ],
    "itinerary": [
      {
        "day": 1,
        "theme": "Historical Cebu City Tour",
        "accommodation": {
          "hotelName": "Mad Monkey Hostel Cebu City",
          "hotelAddress": "Don Julio Llorente Street, Lahug, Cebu City, 6000 Cebu",
          "pricePerNight": "PHP 900 - 1300",
          "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945",
          "geoCoordinates": {
            "latitude": 10.3124,
            "longitude": 123.8969
          },
          "rating": 8.4,
          "description": "Popular backpacker hostel with private rooms perfect for couples. Features rooftop bar, common areas, and walking distance to IT Park."
        },
        "plan": [
          {
            "placeName": "Magellan's Cross",
            "placeDetails": "Historic cross planted by Ferdinand Magellan in 1521, housed in a chapel next to Basilica del Santo Niño. Symbol of Christianity's arrival in the Philippines.",
            "imageUrl": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe",
            "geoCoordinates": {
              "latitude": 10.2933,
              "longitude": 123.9025
            },
            "rating": 4.2,
            "ticketPricing": "Free",
            "timeTravel": "30 minutes",
            "bestTimeToVisit": "8:00 AM - 9:00 AM (avoid crowds)"
          },
          {
            "placeName": "Basilica del Santo Niño",
            "placeDetails": "Oldest Roman Catholic church in the Philippines, housing the miraculous image of Santo Niño. Major pilgrimage site with rich history.",
            "imageUrl": "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
            "geoCoordinates": {
              "latitude": 10.2934,
              "longitude": 123.9023
            },
            "rating": 4.6,
            "ticketPricing": "Free (donations welcome)",
            "timeTravel": "1-2 hours",
            "bestTimeToVisit": "9:00 AM - 11:00 AM"
          },
          {
            "placeName": "Cebu Heritage Monument",
            "placeDetails": "Sculptures depicting important events in Cebu's history, from pre-Spanish era to modern times. Great for photos and learning local history.",
            "imageUrl": "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce",
            "geoCoordinates": {
              "latitude": 10.2952,
              "longitude": 123.9030
            },
            "rating": 4.0,
            "ticketPricing": "Free",
            "timeTravel": "45 minutes",
            "bestTimeToVisit": "11:30 AM - 12:15 PM"
          },
          {
            "placeName": "Fort San Pedro",
            "placeDetails": "Oldest triangular fort in the Philippines, built by Spanish conquistadors. Small museum with artifacts and great views of the harbor.",
            "imageUrl": "https://images.unsplash.com/photo-1588436706487-9d55d73a39e3",
            "geoCoordinates": {
              "latitude": 10.2917,
              "longitude": 123.9034
            },
            "rating": 3.8,
            "ticketPricing": "PHP 30 per person",
            "timeTravel": "1 hour",
            "bestTimeToVisit": "2:00 PM - 3:00 PM"
          },
          {
            "placeName": "Colon Street",
            "placeDetails": "Oldest street in the Philippines, bustling with local shops, street food, and historical significance. Perfect for budget shopping and local experience.",
            "imageUrl": "https://images.unsplash.com/photo-1601970250265-1c0c9d36899f",
            "geoCoordinates": {
              "latitude": 10.2961,
              "longitude": 123.9048
            },
            "rating": 3.5,
            "ticketPricing": "Free (shopping extra)",
            "timeTravel": "1-2 hours",
            "bestTimeToVisit": "3:30 PM - 5:30 PM"
          }
        ]
      },
      {
        "day": 2,
        "theme": "Island Hopping Adventure",
        "accommodation": {
          "hotelName": "Mad Monkey Hostel Cebu City",
          "hotelAddress": "Don Julio Llorente Street, Lahug, Cebu City, 6000 Cebu",
          "pricePerNight": "PHP 900 - 1300",
          "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945",
          "geoCoordinates": {
            "latitude": 10.3124,
            "longitude": 123.8969
          },
          "rating": 8.4,
          "description": "Popular backpacker hostel with private rooms perfect for couples. Features rooftop bar, common areas, and walking distance to IT Park."
        },
        "plan": [
          {
            "placeName": "Mactan Island Hopping Tour",
            "placeDetails": "Full day island hopping visiting Hilutungan Island for snorkeling, Nalusuan Island for relaxation, and other nearby islands. Includes lunch and equipment.",
            "imageUrl": "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
            "geoCoordinates": {
              "latitude": 10.2996,
              "longitude": 124.0170
            },
            "rating": 4.7,
            "ticketPricing": "PHP 1500-2000 per person (includes lunch, snorkel gear, boat)",
            "timeTravel": "8-9 hours (6:00 AM - 3:00 PM)",
            "bestTimeToVisit": "Early morning departure (6:00 AM)"
          },
          {
            "placeName": "Lapu-Lapu Monument",
            "placeDetails": "Monument honoring Datu Lapu-Lapu, the first Filipino hero who defeated Magellan. Located in Mactan Island with historical significance.",
            "imageUrl": "https://images.unsplash.com/photo-1613595000936-4ed9c0b5b334",
            "geoCoordinates": {
              "latitude": 10.3100,
              "longitude": 124.0044
            },
            "rating": 4.1,
            "ticketPricing": "Free",
            "timeTravel": "30-45 minutes",
            "bestTimeToVisit": "4:00 PM - 4:45 PM (after island hopping)"
          }
        ]
      },
      {
        "day": 3,
        "theme": "Nature and Scenic Views",
        "accommodation": {
          "hotelName": "Mad Monkey Hostel Cebu City",
          "hotelAddress": "Don Julio Llorente Street, Lahug, Cebu City, 6000 Cebu",
          "pricePerNight": "PHP 900 - 1300",
          "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945",
          "geoCoordinates": {
            "latitude": 10.3124,
            "longitude": 123.8969
          },
          "rating": 8.4,
          "description": "Popular backpacker hostel with private rooms perfect for couples. Features rooftop bar, common areas, and walking distance to IT Park."
        },
        "plan": [
          {
            "placeName": "Temple of Leah",
            "placeDetails": "Roman-inspired temple built as a symbol of undying love, offering panoramic views of Cebu City. Perfect for couples with beautiful architecture and sunset views.",
            "imageUrl": "https://images.unsplash.com/photo-1580837119756-563d608dd119",
            "geoCoordinates": {
              "latitude": 10.3643,
              "longitude": 123.8741
            },
            "rating": 4.5,
            "ticketPricing": "PHP 100 per person",
            "timeTravel": "2-3 hours",
            "bestTimeToVisit": "2:00 PM - 5:00 PM (for sunset)"
          },
          {
            "placeName": "Sirao Flower Garden",
            "placeDetails": "Beautiful flower garden with colorful celosia flowers, perfect for photos. Known as 'Little Amsterdam' of Cebu with scenic mountain views.",
            "imageUrl": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b",
            "geoCoordinates": {
              "latitude": 10.3701,
              "longitude": 123.8654
            },
            "rating": 4.2,
            "ticketPricing": "PHP 60 per person",
            "timeTravel": "1-2 hours",
            "bestTimeToVisit": "10:00 AM - 12:00 PM (good lighting)"
          },
          {
            "placeName": "Cebu Taoist Temple",
            "placeDetails": "Ornate Chinese temple in Beverly Hills subdivision, featuring beautiful architecture, dragon statues, and city views. Free to visit and explore.",
            "imageUrl": "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
            "geoCoordinates": {
              "latitude": 10.3456,
              "longitude": 123.8789
            },
            "rating": 4.3,
            "ticketPricing": "Free",
            "timeTravel": "1-1.5 hours",
            "bestTimeToVisit": "12:30 PM - 2:00 PM"
          }
        ]
      }
    ]
  }
}`
        }
      ]
    }
  ]
});
