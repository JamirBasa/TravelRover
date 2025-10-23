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
  temperature: 0.3, // Balanced for consistency and creativity
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
      arrivalTime: {
        type: "string",
        description:
          "Expected arrival time on Day 1 (morning/afternoon/evening)",
      },
      departureTime: {
        type: "string",
        description: "Expected departure time on last day",
      },
      transportationNotes: {
        type: "string",
        description: "General transportation tips for the destination",
      },
      currency: { type: "string" },
      hotels: {
        type: "array",
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
        items: {
          type: "object",
          properties: {
            day: { type: "integer" },
            theme: { type: "string" },
            plan: {
              type: "array",
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

🚨 TRAVEL TIME & LOGISTICS - ABSOLUTELY CRITICAL:

🛫 AIRPORT & FLIGHT LOGISTICS:

AIRPORT SELECTION RULES:
✅ ALWAYS check if destination has a DIRECT airport:
   - If YES: Use the direct airport (fastest, most convenient)
   - If NO: Recommend the NEAREST major airport with clear ground transfer details
✅ For destinations WITHOUT direct airports, MUST provide:
   - Name of nearest major airport with code
   - Distance from airport to destination
   - Ground transfer time and cost estimate
   - Transportation options (bus, van, taxi, private transfer)
   - EXAMPLE: "No direct flights to El Nido. Fly to Puerto Princesa Airport (PPS), then 5-6 hour van ride to El Nido (₱600-1,200 per person)"

PHILIPPINE AIRPORT REFERENCE GUIDE:
✅ Major airports WITH commercial flights:
   - Manila (MNL/NAIA) - National Capital Region
   - Cebu (CEB/Mactan) - Cebu Province
   - Clark (CRK) - Pampanga
   - Davao (DVO) - Davao City
   - Iloilo (ILO) - Iloilo City
   - Puerto Princesa (PPS) - Palawan
   - Tagbilaran (TAG) - Bohol
   - Kalibo (KLO) - Aklan
   - Caticlan (MPH) - Malay, Aklan
   - Bacolod (BCD) - Negros Occidental
   - Zamboanga (ZAM) - Zamboanga City
   - General Santos (GES) - South Cotabato
   - Cagayan de Oro (CGY) - Misamis Oriental
   - Tacloban (TAC) - Leyte
   - Busuanga (USU) - Coron, Palawan
   - Siargao (IAO) - Surigao del Norte

✅ NEAREST AIRPORT RECOMMENDATIONS (for destinations without direct airports):
   - **El Nido** → Puerto Princesa (PPS) + 5-6 hour van north
   - **Baguio** → Clark (CRK) 4hrs or Manila (MNL) 6hrs + bus
   - **Batanes** → Has own airport (Basco Airport - BSO) with limited flights
   - **Sagada** → Manila (MNL) + 12-hour bus OR Tuguegarao (TUG) + 6-hour van
   - **Vigan** → Manila (MNL) + 8-hour bus OR Laoag (LAO) + 2-hour bus
   - **Banaue Rice Terraces** → Manila (MNL) + 9-hour bus
   - **Camiguin** → Cagayan de Oro (CGY) + 2-hour ferry
   - **Siquijor** → Dumaguete + ferry OR Tagbilaran (TAG) + ferry

✅ ALWAYS include in Day 1 arrival plan:
   - Arrival airport name and code
   - If nearest airport: mention it's NOT a direct flight to destination
   - Ground transfer details (time, cost, mode)
   - Realistic arrival time at hotel after all transfers

DAY 1 (ARRIVAL DAY) RULES:
✅ ADJUST Day 1 activities based on arrival time AND ground transfer:
   - Direct airport + morning arrival: 2-3 activities after check-in
   - Direct airport + afternoon arrival: 1-2 activities maximum
   - Direct airport + evening arrival: Check-in and nearby dinner only
   - Nearest airport + long transfer (3+ hours): Day 1 = TRAVEL DAY, minimal/no activities
   - Nearest airport + short transfer (under 2 hours): 1-2 light activities possible
✅ ASSUME traveler arrives in the morning/afternoon (unless specified otherwise)
✅ FIRST activity MUST BE hotel check-in:
   - Airport to hotel transfer (direct airport): 30-90 minutes
   - Airport to hotel transfer (nearest airport): ADD ground transfer time (1-6 hours)
   - Hotel check-in: 15-30 minutes
   - Freshen up and rest: 30-60 minutes
   - Standard check-in time: 2:00 PM - 3:00 PM (later if long transfer)
   - EXAMPLE (direct): "2:00 PM - Hotel Check-in at [Hotel Name]"
   - EXAMPLE (nearest): "10:00 AM - Arrive Puerto Princesa → 5-hour van to El Nido → 3:30 PM Hotel Check-in at [Hotel Name]"
✅ START first sightseeing activity NO EARLIER than 2-3 hours after hotel check-in
✅ If LONG ground transfer (3+ hours), Day 1 = travel day, activities: Check-in → Dinner → Return to hotel
✅ Day 1 should be LIGHTER schedule (2-3 activities max AFTER check-in if direct airport, or NONE if long transfer)
✅ Focus on nearby attractions to hotel, minimal travel
✅ Include welcome activities: light lunch, city orientation, nearby sights
✅ MANDATORY Day 1 structure: 
   - **Direct airport**: Airport Arrival (30-90 min) → Hotel Check-in → Rest → Light Activities → Return to Hotel
   - **Nearest airport with long transfer**: Airport Arrival → Ground Transfer (3-6 hrs) → Hotel Check-in → Rest/Dinner → Return to Hotel

LAST DAY (DEPARTURE DAY) RULES:
✅ ASSUME traveler departs in afternoon/evening (unless specified otherwise)
✅ MANDATORY hotel check-out activity:
   - Standard check-out time: 11:00 AM - 12:00 PM (noon)
   - Packing and preparation: 30-60 minutes before check-out
   - MUST include explicit check-out activity in itinerary
   - EXAMPLE: "11:00 AM - Hotel Check-out" with details "Pack belongings, settle bills, check-out from [Hotel Name]"
✅ MUST factor in post-checkout logistics (INCLUDING nearest airport transfers):
   - **Direct airport**: Hotel to airport: 30-90 minutes + 2 hours early arrival = 2.5-3.5 hours total
   - **Nearest airport with long transfer**: Hotel to airport: Ground transfer time (1-6 hours) + airport transfer + 2 hours early arrival
   - Airport early arrival: 2 hours before DOMESTIC flights, 3-4 hours before INTERNATIONAL
   - EXAMPLE (direct): 4:00 PM flight → 2:00 PM airport → 12:30 PM hotel departure → 11:00 AM checkout
   - EXAMPLE (nearest): 2:00 PM Puerto Princesa flight → 12:00 PM airport → 6:00 AM hotel departure (6-hour ground transfer) → 5:00 AM checkout
✅ For LONG ground transfers to nearest airport (3+ hours):
   - Last day = EARLY departure day
   - MINIMAL/NO activities before checkout
   - Checkout time adjusted earlier (5-7 AM possible)
   - Example: "5:00 AM - Early hotel checkout", "5:30 AM - Begin 6-hour transfer to Puerto Princesa Airport"
✅ Activities BEFORE check-out must END by 10:30 AM latest (ONLY if direct airport)
✅ Last day should be VERY LIGHT:
   - Direct airport: 1-2 activities max BEFORE check-out
   - Nearest airport + long transfer: NO activities, early checkout only
✅ Focus on: hotel breakfast (if time), quick nearby shopping (only if direct airport), hotel-vicinity activities
✅ MANDATORY Last Day structure:
   - **Direct airport**: Breakfast → Light Activity → Hotel Check-out → Airport Transfer → Departure
   - **Nearest airport + long transfer**: Early Breakfast (or skip) → Hotel Check-out → Long Ground Transfer → Airport → Departure
✅ Example Last Day (afternoon flight): 
   "7:30 AM - Breakfast at hotel restaurant", 
   "9:00 AM - Quick souvenir shopping (1 hour, near hotel)", 
   "11:00 AM - Hotel Check-out and pack", 
   "12:00 PM - Transfer to airport (arrive 2:00 PM for 4:00 PM flight)"

FLIGHT-SPECIFIC DEPARTURE DAY SCHEDULES:
✅ For MORNING domestic flights (before 12 PM):
   - 6:30 AM - Breakfast at hotel (or skip if very early)
   - 7:00 AM - Hotel check-out
   - NO activities - direct transfer to airport
   - Example: 10:00 AM flight → 8:00 AM airport arrival → 7:00 AM hotel departure
✅ For AFTERNOON domestic flights (12 PM - 5 PM):
   - 7:30 AM - Breakfast at hotel
   - 9:00 AM - ONE light activity near hotel (max 1 hour)
   - 11:00 AM - Hotel check-out
   - 12:00 PM - Depart for airport
   - Example: 2:00 PM flight → 12:00 PM airport arrival → 11:00 AM hotel departure
✅ For EVENING domestic flights (after 5 PM):
   - 7:30 AM - Breakfast
   - 9:00 AM - First light activity
   - 11:00 AM - Second light activity (optional)
   - 12:00 PM - Hotel check-out
   - 2:00-3:00 PM - Depart for airport (2-3 hours before flight)
✅ CALCULATION RULE: Flight time - 2 hours (airport) - 1 hour (travel) - 1 hour (checkout prep) = latest activity time


TRAVEL TIME BETWEEN ACTIVITIES (ALL DAYS):
✅ ALWAYS include realistic travel time between locations:
   - Within same district: 15-30 minutes (off-peak), 30-45 minutes (peak hours)
   - Across Metro Manila: 45-90 minutes normal, up to 120 minutes during rush hour
   - To suburbs/outskirts: 60-120 minutes
   - PEAK HOURS TO AVOID: 7-9 AM, 5-7 PM weekdays
✅ Account for Manila/major city traffic: add 30-50% buffer time
✅ Include travel time in timeTravel field: "30 minutes travel + 2 hours visit"
✅ Don't schedule activities back-to-back without transit time
✅ Example: "10:00 AM - Location A", "1:00 PM - Location B" (allows 1hr visit + 2hr gap)

ACTIVITY DURATION GUIDELINES:
✅ Typical visit durations to include in planning:
   - Historical sites/museums: 1.5-2 hours
   - Shopping/markets: 1-2 hours
   - Meals at restaurants: 1-1.5 hours
   - Beach/nature activities: 2-3 hours
   - Quick photo stops: 15-30 minutes

REALISTIC DAILY SCHEDULES:
✅ Day 1 (Arrival): 2-3 activities, light schedule
✅ Middle Days: 3-4 activities, full but not rushed
✅ Last Day (Departure): 1-2 activities, very light
✅ Include meal times as EXPLICIT activities when not included in hotel:
   - Breakfast: 7:30-9:00 AM (often included in hotel package)
   - Lunch: 12:00-1:30 PM (mandatory, budget ₱200-500 per person)
   - Dinner: 6:30-8:00 PM (mandatory, budget ₱300-800 per person)
✅ If hotel includes breakfast, still list as activity: "7:30 AM - Breakfast at hotel restaurant"
✅ Include rest periods: 30-60 min breaks between major activities
✅ Don't exceed 8-10 hours of active time per day
✅ EVERY DAY MUST END with "Return to hotel" activity:
   - Schedule between 7:00 PM - 9:00 PM
   - Include travel time from last activity location
   - Example: "8:00 PM - Return to hotel and rest"
   - This should be the LAST activity entry for each day

TRANSPORTATION CONSIDERATIONS:
✅ Mention transportation method in placeDetails when relevant:
   - "15-min taxi ride from hotel"
   - "Accessible by jeepney, 30 minutes"
   - "Near hotel, walking distance"
✅ Group nearby attractions together on same day
✅ Avoid zigzagging across city - cluster by area

ACCOMMODATION CHECK-IN/CHECK-OUT REQUIREMENTS:
✅ Day 1 MUST start with "Hotel Check-in at [Hotel Name]" as first activity
✅ Check-in activity must include hotel name from hotels array
✅ Standard check-in time: 2:00 PM - 3:00 PM (adjust if early/late arrival specified or long ground transfer)
✅ Last day MUST include "Hotel Check-out" activity before departure
✅ Check-out activity typically at 11:00 AM - 12:00 PM (EARLIER if long transfer to nearest airport)
✅ **CRITICAL**: All middle days MUST end with "Return to hotel" activity between 7:00-9:00 PM
✅ "Return to hotel" MUST be the FINAL activity of each day (except last day which ends with departure)
✅ Check-in details: "Check-in, freshen up, and settle into your accommodation"
✅ Check-out details: "Pack belongings, settle bills, check-out from [Hotel Name]"
✅ Return to hotel details: "End of day, return to [Hotel Name] for rest and overnight stay"

DAILY STRUCTURE VALIDATION:
✅ EVERY SINGLE DAY must follow this structure:
   - **Day 1**: Airport/Transfer → Hotel Check-in → Activities → Return to hotel
   - **Day 2-N (middle days)**: Morning activity → Lunch → Afternoon activity → Dinner → **Return to hotel**
   - **Last Day**: Breakfast → (Optional activity if time) → Hotel Check-out → Airport Transfer/Departure
✅ NO day should have activities extending past 9:00 PM without "Return to hotel"
✅ Travelers sleep at the SAME hotel every night (unless multi-city trip specified)
✅ Dinner can be the last activity BEFORE "Return to hotel" (e.g., "7:30 PM Dinner" then "9:00 PM Return to hotel")
✅ Hotels should be centrally located or near main attractions to minimize daily travel time
✅ Mention hotel location advantage in description: "centrally located in Makati", "near major attractions"


FORBIDDEN - CRITICAL VIOLATIONS:
- NO Day 1 without hotel check-in as first activity
- NO Last day without hotel check-out before departure
- NO middle days without "Return to hotel" as final activity (MANDATORY for every day)
- NO suggesting direct flights to destinations without airports (recommend nearest airport instead)
- NO omitting ground transfer details when using nearest airport
- NO ignoring long transfer times (3-6 hours) in Day 1 or last day planning
- NO activities extending past 9:00 PM without "Return to hotel"
- NO overnight activities or late-night venues without hotel return
- NO multi-hotel stays unless explicitly a multi-city trip
- NO trailing commas like "property": "value",}
- NO incomplete objects like {"name": "place",...
- NO extra characters after final }
- NO missing closing braces or brackets
- NO activities scheduled before hotel check-in on Day 1
- NO activities scheduled after hotel check-out on last day (except departure transfer)
- NO unrealistic back-to-back schedules without travel time
- NO missing closing braces or brackets

NEAREST AIRPORT EXAMPLES (What to include in itinerary):
✅ CORRECT (No direct airport):
   "destination": "El Nido, Palawan",
   "arrivalNote": "No direct flights to El Nido. Fly to Puerto Princesa Airport (PPS), then 5-6 hour van transfer.",
   Day 1, First activity: "10:00 AM - Arrive Puerto Princesa Airport → Van transfer to El Nido (5-6 hours, ₱600-1,200)",
   Day 1, Second activity: "4:00 PM - Hotel Check-in at [Hotel Name] in El Nido"

✅ CORRECT (Direct airport):
   "destination": "Cebu City",
   Day 1, First activity: "2:00 PM - Hotel Check-in at [Hotel Name]",
   Note in activity: "Arrive Mactan-Cebu Airport (CEB), 30-45 min transfer to hotel"

❌ WRONG (Suggesting direct flights when none exist):
   "destination": "El Nido",
   Day 1: "2:00 PM - Arrive El Nido Airport" ← NO SUCH AIRPORT!

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
      "theme": "Arrival and Cultural Exploration",
      "plan": [
        {
          "time": "2:00 PM",
          "placeName": "Hotel Check-in at Sample Hotel",
          "placeDetails": "Check-in, freshen up, and settle into your accommodation",
          "ticketPricing": "Free",
          "timeTravel": "45 minutes from airport"
        },
        {
          "time": "4:00 PM",
          "placeName": "Rizal Park",
          "placeDetails": "Historic park in the heart of Manila, walking distance",
          "ticketPricing": "Free",
          "timeTravel": "20 minutes from hotel"
        },
        {
          "time": "8:00 PM",
          "placeName": "Return to hotel",
          "placeDetails": "End of day, return to hotel for rest",
          "ticketPricing": "Free",
          "timeTravel": "20 minutes"
        }
      ]
    },
    {
      "day": 3,
      "theme": "Departure Day",
      "plan": [
        {
          "time": "7:30 AM",
          "placeName": "Breakfast at hotel restaurant",
          "placeDetails": "Enjoy final breakfast before departure",
          "ticketPricing": "Included",
          "timeTravel": "0 minutes"
        },
        {
          "time": "9:00 AM",
          "placeName": "Quick souvenir shopping",
          "placeDetails": "Last minute gifts near hotel vicinity",
          "ticketPricing": "Variable",
          "timeTravel": "10 minutes from hotel"
        },
        {
          "time": "11:00 AM",
          "placeName": "Hotel Check-out",
          "placeDetails": "Pack belongings, settle bills, check-out from Sample Hotel",
          "ticketPricing": "Free",
          "timeTravel": "10 minutes return to hotel"
        },
        {
          "time": "12:00 PM",
          "placeName": "Transfer to airport",
          "placeDetails": "Departure transfer to NAIA for flight home",
          "ticketPricing": "₱500-800 taxi",
          "timeTravel": "45-60 minutes to airport"
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
  ? new GeminiProxyChatSession(generationConfig)
  : model.startChat({
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

/**
 * Generate itinerary with retry logic and validation
 * @param {string} userInput - User's travel requirements
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} - Validated itinerary object
 */
export const generateItineraryWithRetry = async (userInput, maxRetries = 3) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} - Generating itinerary...`);

      const result = await chatSession.sendMessage(userInput);
      const responseText = result.response.text();

      // Parse JSON
      let itinerary;
      try {
        itinerary = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`JSON parse error on attempt ${attempt}:`, parseError);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      // Validate itinerary logic
      const validation = validateItinerary(itinerary);
      if (!validation.valid) {
        console.warn(
          `Validation failed on attempt ${attempt}:`,
          validation.errors
        );
        if (attempt < maxRetries) {
          // Retry with validation feedback
          const feedbackPrompt = `Previous response had issues: ${validation.errors.join(
            ", "
          )}. Please regenerate following ALL rules strictly.`;
          continue;
        }
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      console.log("✓ Itinerary generated and validated successfully");
      return itinerary;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);

      // Check for rate limit (429) or server errors (500, 503)
      const isRetriable =
        error.message?.includes("429") ||
        error.message?.includes("500") ||
        error.message?.includes("503") ||
        error.message?.includes("RESOURCE_EXHAUSTED");

      if (isRetriable && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff: 2s, 4s, 8s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (attempt === maxRetries) {
        throw new Error(
          `Failed after ${maxRetries} attempts: ${lastError.message}`
        );
      }
    }
  }

  throw lastError;
};

/**
 * Validates itinerary response for logical consistency
 * @param {Object} itinerary - The parsed JSON itinerary
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateItinerary = (itinerary) => {
  const errors = [];

  try {
    // Check Day 1 starts with hotel check-in
    const day1 = itinerary.itinerary?.[0];
    if (day1 && !day1.plan[0]?.placeName?.toLowerCase().includes("check-in")) {
      errors.push("Day 1 must start with hotel check-in");
    }

    // Check last day has check-out
    const lastDay = itinerary.itinerary?.[itinerary.itinerary.length - 1];
    const hasCheckout = lastDay?.plan?.some((activity) =>
      activity.placeName?.toLowerCase().includes("check-out")
    );
    if (!hasCheckout) {
      errors.push("Last day must include hotel check-out");
    }

    // Check middle days end with "Return to hotel"
    for (let i = 1; i < itinerary.itinerary.length - 1; i++) {
      const day = itinerary.itinerary[i];
      const lastActivity = day.plan[day.plan.length - 1];
      if (!lastActivity?.placeName?.toLowerCase().includes("return to hotel")) {
        errors.push(`Day ${day.day} must end with 'Return to hotel'`);
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (e) {
    return { valid: false, errors: ["Validation error: " + e.message] };
  }
};
