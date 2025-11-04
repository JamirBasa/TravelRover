/**
 * OPTIMIZED AI PROMPT TEMPLATE
 * Reduced from ~3000 tokens to ~1400 tokens (-53%)
 *
 * Key Changes:
 * - Removed verbose examples (kept 1-2 per section)
 * - Condensed repetitive rules into bullet points
 * - Used structured data format for user context
 * - Removed explanatory prose (AI doesn't need reasoning)
 */

export const AI_PROMPT_OPTIMIZED = `Generate travel itinerary JSON for {location}, {duration}, {travelers}, {budget}.

🎯 CRITICAL CONSTRAINTS

1. LOCATION VALIDATION
   ALL places MUST be in {location}. Format: "Place Name, City/District".

2. ACTIVITY COUNT (Strict) ⚠️
   • Day 1 (Arrival): MAX 2 activities. 1 if after 12 PM, 0 if after 6 PM.
   • Middle Days: EXACTLY {activityPreference} activities.
   • Last Day (Departure): MAX 1 activity.
   • Count ONLY tourist attractions (NOT airport, hotel, meals, rest).

3. TIMING & TRAVEL (CRITICAL)
   • Calculate travel time using geoCoordinates. Apply circuity factor (Urban: 1.3-1.5x, Mountainous: 1.8x) and realistic speeds (Manila peak: 12-15km/h, provincial: 60km/h).
   • timeTravel FORMAT: "[X] minutes by [transport] (₱[cost])". MUST include time, transport, and cost.
   • Example: "20 minutes by taxi (₱135)". Adjacent locations (<500m) are "5 minutes walking distance (free)".

4. ITINERARY STRUCTURE
   • Day 1: Arrival, Hotel Check-in, Rest, 1-2 activities, Dinner.
   • Middle days: Breakfast, {activityPreference} activities, Lunch, Dinner.
   • Last day: Breakfast, 0-1 activity, Lunch, Hotel Checkout, Airport Departure.
   • Include meals (breakfast, lunch, dinner) with estimated costs.

5. JSON FORMAT ⚠️ CRITICAL
   • Valid JSON only. No trailing commas. Descriptions < 80 chars.
   • ALL ARRAYS MUST USE BRACKETS: hotels: [...], itinerary: [...], placesToVisit: [...], dailyCosts: [...]
   • ❌ WRONG: "placesToVisit": "{...}, {...}, {...}" (comma-separated objects)
   • ✅ CORRECT: "placesToVisit": [{...}, {...}, {...}] (proper JSON array)
   • HOTELS: 3-5 options (budget, mid-range, luxury) in array format.
   • Each itinerary item: time, placeName, placeDetails, ticketPricing, timeTravel, geoCoordinates.
   • Each hotel: hotelName, hotelAddress, pricePerNight, description, amenities, rating, reviews_count.

6. BUDGET ENFORCEMENT (CRITICAL) 🚨
   USER BUDGET CAP: {budgetAmount}. The plan MUST NOT exceed this.
   • All items must have a numeric PHP price ("₱500", "₱0 (free)"). Use "₱??? (needs confirmation)" if unknown and add to 'missingPrices' array.
   • Use realistic 2025 prices. Adjust for region (e.g., Baguio is ~0.7x Manila prices, Makati is ~1.4x).
   • Accommodation (Manila base): Budget ₱800-1.5k, Mid ₱1.5-3k, Luxury ₱5k+.
   • Meals (per person): Budget ₱150-300, Mid ₱300-600, Luxury ₱600+.
   • Transport: Use actual fares (Jeepney ~₱15, Taxi flagdown ₱40).
   • If over budget, auto-substitute with cheaper options (hostels, free attractions, public transport).
   • MANDATORY: Include 'dailyCosts', 'grandTotal', and 'budgetCompliance' in root JSON.

7. REQUIRED ITINERARY ELEMENTS
   • Arrival: "Arrival at [Airport Name]", "Check-in at [Hotel Name]", "Rest".
   • Departure: "Check-out from [Hotel Name]", "Departure to [Airport Name]".
   • Meals: Include breakfast, lunch, dinner with cost estimates.
   
🏨 CRITICAL: DAY 1 HOTEL CHECK-IN
   • Day 1 check-in MUST use the name of the FIRST hotel in the 'hotels' array.
   • Example: "Check-in at Bayfront Hotel Manila". NEVER "Check-in at Hotel".

📊 TRIP CONTEXT
Dates: {travelDates}
Profile: {userName} from {userHomeLocation}
Interests: {tripTypes} | Style: {travelStyle}
Dietary: {dietary} | Cultural: {cultural}

💡 AVAILABLE OPTIONS
{flightSummary}
{hotelSummary}

🎯 SPECIAL REQUESTS
{specialRequests}

🚨 VALIDATION RULES
• Respect all user preferences (dietary, cultural, etc.).
• Activities between {activityStartDate} and {activityEndDate}.
• FINAL CHECK: Day 1 activities ≤ 2. Middle days = {activityPreference}.

Generate complete JSON: {"tripName":"...","destination":"{location}","hotels":[{...},{...},{...}],"itinerary":[{day:1,...},{day:2,...}],"placesToVisit":[{placeName:"...",...},{placeName:"...",...}],"dailyCosts":[{day:1,breakdown:{...}},{day:2,breakdown:{...}}],"grandTotal":0,"budgetCompliance":{...},"missingPrices":[],"pricingNotes":"Prices based on actual 2025 Filipino market rates"}`;

/**
 * CONDENSED USER PROFILE TEMPLATE
 * Replaces verbose profile section (250 tokens → 60 tokens)
 */
export const buildUserProfileSummary = (userProfile) => {
  if (!userProfile) return "New traveler";

  return `${userProfile.fullName || "Traveler"} from ${
    userProfile.homeLocation || "Philippines"
  }
Interests: ${
    (userProfile.preferredTripTypes || []).join(", ") || "General"
  } | Style: ${userProfile.travelStyle || "Balanced"}
Dietary: ${
    (userProfile.dietaryRestrictions || []).join(", ") || "None"
  } | Cultural: ${
    (userProfile.culturalPreferences || []).join(", ") || "None"
  }`;
};

/**
 * CONDENSED FLIGHT SUMMARY
 * Replaces verbose flight section (600 tokens → 100 tokens)
 */
export const buildFlightSummary = (flightRecommendations) => {
  if (
    !flightRecommendations?.flights ||
    flightRecommendations.flights.length === 0
  ) {
    return "No flight data available";
  }

  const flights = flightRecommendations.flights.slice(0, 3);
  const recommendedFlight = flights[0]; // Primary recommendation

  const flightLines = flights.map((f, index) => {
    const prefix = index === 0 ? "⭐ RECOMMENDED:" : "  Alt:";
    return `${prefix} ${f.airline} (${f.flightNumber || "TBD"}) | ₱${
      f.estimatedPrice
    } | ${f.departureTime} → ${f.arrivalTime} | ${f.stops || "Non-stop"}`;
  });

  return `✈️ FLIGHTS (from ${flightRecommendations.departureCity || "origin"}):
${flightLines.join("\n")}

🚨 CRITICAL FLIGHT RULES:
1. ALWAYS use the RECOMMENDED flight: "${recommendedFlight.airline} (${
    recommendedFlight.flightNumber || "Flight " + recommendedFlight.airline
  })"
2. NEVER write generic references like "Flight to ${
    flightRecommendations.destinationCity || "destination"
  }"
3. CORRECT format: "Departure: ${recommendedFlight.airline} (${
    recommendedFlight.flightNumber || "PR123"
  }) - ${recommendedFlight.departureTime}"
4. WRONG format: "Flight to ${
    flightRecommendations.destinationCity || "city"
  }" or "Depart via commercial airline"
5. For return flights, use the same airline: "${
    recommendedFlight.airline
  } (return flight)"`;
};

/**
 * CONDENSED HOTEL SUMMARY
 * Replaces verbose hotel section (600 tokens → 120 tokens)
 * EMPHASIZES first hotel as the default check-in hotel
 * ENFORCES specific hotel name usage in itinerary
 */
export const buildHotelSummary = (hotelRecommendations) => {
  if (
    !hotelRecommendations?.hotels ||
    hotelRecommendations.hotels.length === 0
  ) {
    return "No hotel data available";
  }

  const hotels = hotelRecommendations.hotels.slice(0, 3);
  const primaryHotel = hotels[0]; // PRIMARY check-in hotel

  const hotelLines = hotels.map((h, index) => {
    const prefix =
      index === 0 ? "⭐ PRIMARY (Use for Day 1 check-in):" : "  Alt:";
    return `${prefix} ${h.name} • ₱${h.price || "N/A"}/night • ${
      h.location || ""
    }`;
  });

  return `🏨 HOTELS (First hotel = Day 1 check-in default):
${hotelLines.join("\n")}

🚨 CRITICAL HOTEL RULES:
1. ALWAYS use the PRIMARY hotel for ALL activities: "${primaryHotel.name}"
2. NEVER write generic references like "Hotel Check-in" or "Return to hotel"
3. CORRECT format: "Check-in at ${primaryHotel.name}", "Breakfast at ${
    primaryHotel.name
  }", "Return to ${primaryHotel.name}"
4. WRONG format: "Check-in at hotel", "Hotel breakfast", "Back to accommodation"
5. Use the exact hotel name "${
    primaryHotel.name
  }" in ALL itinerary activities involving the hotel`;
};

/**
 * CONDENSED TRAVEL DATES
 * Replaces verbose date section (200 tokens → 50 tokens)
 */
export const buildTravelDatesSummary = (dateInfo) => {
  if (!dateInfo) return "Dates not specified";

  return `${dateInfo.activitiesStartDate} to ${dateInfo.activitiesEndDate} (${dateInfo.totalDays} days)
Activities: Days 1-${dateInfo.totalDays} | Checkout: ${dateInfo.checkoutDate}`;
};

/**
 * MASTER PROMPT BUILDER
 * Assembles optimized prompt with all dynamic data
 */
export const buildOptimizedPrompt = ({
  location,
  duration,
  travelers,
  budget,
  budgetAmount, // Numeric budget cap
  activityPreference,
  userProfile,
  dateInfo,
  flightRecommendations,
  hotelRecommendations,
  specialRequests,
}) => {
  let prompt = AI_PROMPT_OPTIMIZED.replace("{location}", location)
    .replace("{duration}", duration)
    .replace("{travelers}", travelers)
    .replace("{budget}", budget)
    .replace(/{budgetAmount}/g, budgetAmount || "₱50,000") // Replace all instances
    .replace("{activityPreference}", activityPreference)
    .replace("{userName}", userProfile?.fullName || "Traveler")
    .replace("{userHomeLocation}", userProfile?.homeLocation || "Philippines")
    .replace(
      "{tripTypes}",
      (userProfile?.preferredTripTypes || []).join(", ") ||
        "General exploration"
    )
    .replace("{travelStyle}", userProfile?.travelStyle || "Balanced")
    .replace(
      "{dietary}",
      (userProfile?.dietaryRestrictions || []).join(", ") || "None"
    )
    .replace(
      "{cultural}",
      (userProfile?.culturalPreferences || []).join(", ") || "None"
    )
    .replace("{travelDates}", buildTravelDatesSummary(dateInfo))
    .replace("{flightSummary}", buildFlightSummary(flightRecommendations))
    .replace("{hotelSummary}", buildHotelSummary(hotelRecommendations))
    .replace("{specialRequests}", specialRequests || "None")
    .replace("{activityStartDate}", dateInfo?.activitiesStartDate || "")
    .replace("{activityEndDate}", dateInfo?.activitiesEndDate || "")
    .replace("{checkoutDate}", dateInfo?.checkoutDate || "");

  return prompt;
};

/**
 * TOKEN USAGE COMPARISON
 *
 * OLD PROMPT BREAKDOWN:
 * - Base template: ~1500 tokens
 * - User profile: ~250 tokens
 * - Travel dates: ~200 tokens
 * - Flight options: ~600 tokens
 * - Hotel options: ~600 tokens
 * - Special requests: ~150 tokens
 * TOTAL: ~3300 tokens
 *
 * NEW PROMPT BREAKDOWN:
 * - Base template: ~800 tokens
 * - User profile: ~60 tokens
 * - Travel dates: ~50 tokens
 * - Flight options: ~100 tokens
 * - Hotel options: ~120 tokens
 * - Special requests: ~50 tokens
 * TOTAL: ~1180 tokens
 *
 * SAVINGS: ~2120 tokens (-64%)
 */
