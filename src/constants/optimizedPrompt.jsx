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

import { TRIP_DURATION } from "./tripDurationLimits";

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
   • Calculate travel time using realistic distance estimates. Apply circuity factor (Urban: 1.3-1.5x, Mountainous: 1.8x) and realistic speeds (Manila peak: 12-15km/h, provincial: 60km/h).
   • timeTravel FORMAT: "[X] minutes by [transport] (₱[cost])". MUST include time, transport, and cost.
   • Example: "20 minutes by taxi (₱135)". Adjacent locations (<500m) are "5 minutes walking distance (free)".
   • Use actual knowledge of {location} geography and distances between landmarks.

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
   • geoCoordinates FORMAT: {"latitude": 6.9214, "longitude": 122.0790} - Use actual coordinates of the place.
   • Each hotel: hotelName, hotelAddress, pricePerNight, description, amenities, rating, reviews_count, geoCoordinates.

6. BUDGET ENFORCEMENT (CRITICAL) 🚨
   USER BUDGET TARGET: {budgetAmount}. Aim to stay within this, with 15% tolerance allowed for real-world pricing.
   • All items must have a numeric PHP price ("₱500", "₱0 (free)"). Use "₱??? (needs confirmation)" if unknown and add to 'missingPrices' array.
   • Use realistic 2025 prices. Adjust for region (e.g., Baguio is ~0.7x Manila prices, Makati is ~1.4x).
   • Accommodation (Manila base): Budget ₱800-1.5k, Mid ₱1.5-3k, Luxury ₱5k+.
   • Meals (per person): Budget ₱150-300, Mid ₱300-600, Luxury ₱600+.
   • Transport: Use actual fares (Jeepney ~₱15, Taxi flagdown ₱40).
   • MANDATORY: Include 'dailyCosts', 'grandTotal', and 'budgetCompliance' in root JSON.
   
   ⚠️ BUDGET CALCULATION ACCURACY:
   • Calculate each day's subtotal: accommodation + meals + activities + transport
   • Verify grand total = sum of all daily subtotals
   • TARGET MAXIMUM: Keep grandTotal at or BELOW ₱{budgetAmount} * 1.10 (aiming for 10% under actual budget to leave margin)
   • Hard limit: grandTotal must NOT exceed ₱{budgetAmount} * 1.15 (15% buffer = failure point)
   • If plan would exceed 15% buffer, REVISE immediately:
     1. Switch to cheaper hotels (₱800-1,000 range)
     2. Replace paid activities with FREE alternatives
     3. Use public transport (jeepney/bus) instead of taxis
     4. Choose budget eateries (₱150-200/meal)
   • STRATEGY: Better to undershoot budget slightly than overshoot. Travelers prefer savings over premium options when budget-conscious.
   • Set "withinBudget": true if grandTotal <= {budgetAmount} * 1.10 (PREFERRED: actual under-budget)
   • Set "withinBudget": true if grandTotal <= {budgetAmount} * 1.15 (ACCEPTABLE: within tolerance)
   • Set "withinBudget": false only if grandTotal > {budgetAmount} * 1.15 (triggers regeneration)

7. REQUIRED ITINERARY ELEMENTS
   • Arrival Day Structure (choose based on flight data context):
     
     🏠 IF "SAME-CITY TRIP" (see FLIGHTS section):
       - START DIRECTLY with "Check-in at [Hotel Name]"
       - User is already in destination, no arrival/departure logistics needed
       - DO NOT add "Departure from origin" or "Arrival in city" activities
     
     ✈️ IF FLIGHT DATA PROVIDED (actual flight recommendations):
       FOR DIRECT FLIGHTS:
       - "Arrival at [Destination Airport]" (₱0 - flight booked separately)
       - "Check-in at [Hotel Name]"
       - "Rest" or 1-2 activities if time permits
       
       FOR REROUTED FLIGHTS (destination has no airport):
       - "Arrival at [Alternative Airport]" (₱0 - flight booked separately)
       - "[Bus/Van] from [Airport] to [Destination]" (₱X-Y per person, Z hours)
       - "Check-in at [Hotel Name]"
     
     🚫 IF "No flight data available" (independent travel):
       - START with "Check-in at [Hotel Name]"
       - DO NOT add inter-city transport unless explicitly provided in transport context
       - User may be traveling from another city, but transport is self-managed
     
   • Last Day: "Check-out from [Hotel Name]", then departure/airport activities ONLY if flights were provided.
   • Meals: Include breakfast, lunch, dinner with cost estimates.
   • Ground Transport: Include as separate activities ONLY when specified in flight/transport data.
   
🏨 CRITICAL: DAY 1 HOTEL CHECK-IN
   • hotels[0] is the RECOMMENDED hotel (highest quality - best rating, most reviews)
   • Day 1 check-in MUST use hotels[0].name or hotels[0].hotelName EXACTLY
   • Example: "Check-in at Bayfront Hotel Manila". NEVER "Check-in at Hotel"
   • All "return to hotel" activities MUST use hotels[0] name consistently
   • Only use hotels[1], hotels[2]... if user specifically requests alternatives

📊 TRIP CONTEXT
Dates: {travelDates}
Profile: {userName} from {userHomeLocation}
Interests: {tripTypes} | Style: {travelStyle}
🎯 Style Focus: {travelStyleInfluence}
Dietary: {dietary} | Cultural: {cultural}

💡 AVAILABLE OPTIONS
{flightSummary}
{hotelSummary}

🎯 SPECIAL REQUESTS
{specialRequests}

🚨 VALIDATION RULES
• Respect all user preferences (dietary, cultural, travel style focus).
• Activities between {activityStartDate} and {activityEndDate}.
• FINAL CHECK: Day 1 activities ≤ 2. Middle days = {activityPreference}.

Generate complete JSON: {"tripName":"...","destination":"{location}","hotels":[{...},{...},{...}],"itinerary":[{day:1,...},{day:2,...}],"placesToVisit":[{placeName:"...",...},{placeName:"...",...}],"dailyCosts":[{day:1,breakdown:{...}},{day:2,breakdown:{...}}],"grandTotal":0,"budgetCompliance":{...},"missingPrices":[],"pricingNotes":"Prices based on actual 2025 Filipino market rates"}`;

/**
 * CONDENSED USER PROFILE TEMPLATE
 * Replaces verbose profile section (250 tokens → 60 tokens)
 */
export const buildUserProfileSummary = (userProfile) => {
  if (!userProfile) return "New traveler";

  // Get travel style context for better recommendations
  const travelStyleContext = getTravelStyleInfluence(userProfile.travelStyle);

  return `${userProfile.fullName || "Traveler"} from ${
    userProfile.homeLocation || "Philippines"
  }
Interests: ${
    (userProfile.preferredTripTypes || []).join(", ") || "General"
  } | Style: ${userProfile.travelStyle || "Balanced"}
${travelStyleContext ? `🎯 Focus: ${travelStyleContext}` : ""}
Dietary: ${
    (userProfile.dietaryRestrictions || []).join(", ") || "None"
  } | Cultural: ${
    (userProfile.culturalPreferences || []).join(", ") || "None"
  }`;
};

/**
 * Get travel style influence text for AI recommendations
 * @param {string} travelStyle - Travel style (solo, duo, family, group, business)
 * @returns {string} Actionable guidance for AI
 */
const getTravelStyleInfluence = (travelStyle) => {
  const influences = {
    solo: "Solo-friendly cafes, safe walkable areas, co-working spaces, social opportunities",
    duo: "Romantic restaurants, intimate venues, couple activities, scenic viewpoints, privacy",
    family:
      "Kid-friendly parks, educational sites, family restaurants, safe outdoor spaces, age-appropriate activities",
    group:
      "Group activities, large capacity venues, adventure sports, social dining, nightlife",
    business:
      "Business districts, efficient transport, quiet workspaces, quick service dining, meeting venues",
  };

  return influences[travelStyle] || null;
};

/**
 * CONDENSED FLIGHT SUMMARY
 * Replaces verbose flight section (600 tokens → 100 tokens)
 * ✅ ENHANCED: Now includes arrival airport information for accurate Day 1 itinerary
 */
export const buildFlightSummary = (
  flightRecommendations,
  userHomeLocation = null,
  destination = null
) => {
  // ✅ SAME-CITY DETECTION: Check if user is already at destination
  if (userHomeLocation && destination) {
    const normalizeCity = (city) =>
      city
        .toLowerCase()
        .trim()
        .split(",")[0] // Extract "Zamboanga City" from "Zamboanga City, Philippines"
        .replace(/\s+(city|metro|province)\b/gi, "") // Remove "City", "Metro", "Province"
        .replace(/\s+/g, " ")
        .trim();

    const homeLower = normalizeCity(userHomeLocation);
    const destLower = normalizeCity(destination);

    // User is already at destination - no flights needed
    if (homeLower === destLower) {
      return "🏠 SAME-CITY TRIP: User is already at destination. No flights or inter-city transport needed.";
    }
  }

  if (
    !flightRecommendations?.flights ||
    flightRecommendations.flights.length === 0
  ) {
    return "No flight data available";
  }

  const flights = flightRecommendations.flights.slice(0, 3);
  const recommendedFlight = flights[0]; // Primary recommendation

  // ✅ Extract arrival airport code and name (prioritize reroute_info if available)
  let arrivalAirportCode, arrivalAirportName, departureAirportCode;

  if (flightRecommendations.rerouted && flightRecommendations.reroute_info) {
    // Use reroute_info for alternative airport details
    arrivalAirportCode = flightRecommendations.reroute_info.alternative_airport;
    arrivalAirportName = flightRecommendations.reroute_info.alternative_name;
    departureAirportCode =
      recommendedFlight.departure_airport ||
      recommendedFlight.departureAirport ||
      "origin";
  } else {
    // Use flight object data
    arrivalAirportCode =
      recommendedFlight.arrival_airport ||
      recommendedFlight.arrivalAirport ||
      "destination";
    departureAirportCode =
      recommendedFlight.departure_airport ||
      recommendedFlight.departureAirport ||
      "origin";
    arrivalAirportName = arrivalAirportCode;
  }

  // Get full airport name from code (if not already set by reroute_info)
  if (!arrivalAirportName || arrivalAirportName === arrivalAirportCode) {
    try {
      // Import getAirportByCode if available
      const { getAirportByCode } = require("@/data/airports");
      const airportData = getAirportByCode(arrivalAirportCode);
      if (airportData) {
        arrivalAirportName = `${airportData.name} (${arrivalAirportCode})`;
      } else {
        arrivalAirportName = arrivalAirportCode;
      }
    } catch (e) {
      // Fallback to code only if import fails
      arrivalAirportName = arrivalAirportCode;
    }
  }

  const flightLines = flights.map((f, index) => {
    const prefix = index === 0 ? "⭐ RECOMMENDED:" : "  Alt:";
    return `${prefix} ${f.airline} (${f.flightNumber || "TBD"}) | ₱${
      f.estimatedPrice
    } | ${f.departureTime} → ${f.arrivalTime} | ${f.stops || "Non-stop"}`;
  });

  // Build reroute context if applicable
  let rerouteNote = "";
  if (flightRecommendations.rerouted && flightRecommendations.reroute_info) {
    const ri = flightRecommendations.reroute_info;
    rerouteNote = `\n\n🚌 REROUTE NOTE: ${
      ri.original_destination
    } has no direct flights. Passengers arrive at ${arrivalAirportName}, then take ${
      ri.ground_transport?.mode || "bus"
    } to ${ri.original_destination} (${
      ri.ground_transport?.travel_time || "travel time varies"
    }).`;
  }

  return `✈️ FLIGHTS (${departureAirportCode} → ${arrivalAirportCode}):
${flightLines.join("\n")}${rerouteNote}

🚨 CRITICAL FLIGHT & ARRIVAL RULES:
1. ALWAYS use the RECOMMENDED flight: "${recommendedFlight.airline} (${
    recommendedFlight.flightNumber || "Flight " + recommendedFlight.airline
  })"
2. 🎯 ARRIVAL AIRPORT: Day 1 MUST show "Arrival at ${arrivalAirportName}"
3. ⚠️ NEVER use departure airport (${departureAirportCode}) for arrival activity - flights land at ${arrivalAirportCode}!
4. For rerouted trips: Create THREE activities (Arrival at ${arrivalAirportCode} → Ground transport → Check-in)
5. CORRECT format: "Departure: ${recommendedFlight.airline} (${
    recommendedFlight.flightNumber || "PR123"
  }) - ${recommendedFlight.departureTime}"
6. WRONG format: "Flight to destination" or "Depart via commercial airline"
7. For return flights, use the same airline: "${
    recommendedFlight.airline
  } (return flight)"`;
};

/**
 * CONDENSED HOTEL SUMMARY
 * Replaces verbose hotel section (600 tokens → 120 tokens)
 * EMPHASIZES first hotel as the default check-in hotel
 * ENFORCES specific hotel name usage in itinerary
 * ✅ NEW: Enforces budget tier constraints
 */
export const buildHotelSummary = (hotelRecommendations, budgetLevel) => {
  if (
    !hotelRecommendations?.hotels ||
    hotelRecommendations.hotels.length === 0
  ) {
    return "No hotel data available";
  }

  // ✅ Budget tier configuration (must match hotelPricingValidator.js)
  const BUDGET_TIER_CONFIG = {
    1: { label: "Budget", min: 500, max: 1500 },
    2: { label: "Economy", min: 1500, max: 2500 },
    3: { label: "Mid-Range", min: 2500, max: 5000 },
    4: { label: "Upscale", min: 5000, max: 10000 },
    5: { label: "Luxury", min: 10000, max: 20000 },
    6: { label: "Ultra-Luxury", min: 20000, max: Infinity },
  };

  const tier = BUDGET_TIER_CONFIG[budgetLevel] || BUDGET_TIER_CONFIG[3];

  // ✅ CRITICAL FIX: ONLY show PRIMARY hotel to AI (hotels[0])
  // Showing multiple hotels causes AI to hallucinate and mention wrong hotels
  // User will see 3-5 hotel options AFTER generation, but AI should only use ONE
  const primaryHotel = hotelRecommendations.hotels[0]; // ONLY hotel AI knows about

  return `🏨 HOTEL ASSIGNMENT - User's Selected Budget Tier: ${
    tier.label
  } (₱${tier.min.toLocaleString()}-${tier.max.toLocaleString()}/night)

⭐ YOUR ASSIGNED HOTEL (Use for ALL activities):
Name: ${primaryHotel.name}
Price: ₱${primaryHotel.price || "N/A"}/night
Location: ${primaryHotel.location || ""}

🚨 CRITICAL HOTEL RULES:
1. ⚠️ YOU MUST USE THIS HOTEL ONLY: "${primaryHotel.name}"
   • This is the ONLY hotel you should mention in the entire itinerary
   • DO NOT create, invent, or mention ANY other hotel names
   • DO NOT say "or similar alternatives" or suggest other hotels

2. ⚠️ STRICT BUDGET ENFORCEMENT: ONLY generate hotels within ${
    tier.label
  } tier (₱${tier.min.toLocaleString()}-${tier.max.toLocaleString()}/night)
   • WRONG: Tier 3 (Mid-Range) user but recommending ₱6,000/night hotels (that's Upscale/Tier 4)
   • CORRECT: Tier 3 user = ₱2,500-5,000/night ONLY. NO exceptions.

3. ALWAYS use "${primaryHotel.name}" for ALL activities
   • NEVER write generic references like "Hotel Check-in" or "Return to hotel"

4. CORRECT format examples:
   • "Check-in at ${primaryHotel.name}"
   • "Breakfast at ${primaryHotel.name}"
   • "Return to ${primaryHotel.name}"
   • "Rest at ${primaryHotel.name}"
   • "Check-out from ${primaryHotel.name}"

5. WRONG format examples (DO NOT USE):
   • "Check-in at hotel" ❌
   • "Hotel breakfast" ❌
   • "Back to accommodation" ❌
   • "Check-in at Grand View Hotel" ❌ (if that's not the assigned hotel)
   • "Stay at Greenfields Inn" ❌ (if that's not the assigned hotel)

6. REMINDER: The ONLY hotel name you should write is "${primaryHotel.name}"`;
};

/**
 * GROUND TRANSPORT SUMMARY
 * Builds ground transport context for AI itinerary generation
 */
export const buildGroundTransportSummary = (transportMode) => {
  if (!transportMode || !transportMode.ground_transport) {
    return "";
  }

  const gt = transportMode.ground_transport;

  // Build transport summary
  let summary = `\n🚌 GROUND TRANSPORT AVAILABLE:`;
  summary += `\nMode: ${
    transportMode.primary_mode || gt.modes?.[0] || "bus/van"
  }`;
  summary += `\nTravel Time: ${gt.travel_time || "N/A"}`;
  summary += `\nCost: ₱${gt.cost?.min || "N/A"}-${gt.cost?.max || "N/A"}`;

  if (gt.operators && gt.operators.length > 0) {
    summary += `\nOperators: ${gt.operators.join(", ")}`;
  }

  if (gt.frequency) {
    summary += `\nSchedule: ${gt.frequency}`;
  }

  if (gt.scenic) {
    summary += `\n⭐ SCENIC ROUTE - Mention scenic views in itinerary!`;
  }

  if (gt.notes) {
    summary += `\nNotes: ${gt.notes}`;
  }

  // Add critical instructions with proper context
  summary += `\n\n🚨 CRITICAL: Add ground transport as SEPARATE ACTIVITY in Day 1!`;

  if (transportMode.mode === "ground_preferred") {
    summary += `\n✅ DIRECT GROUND TRANSPORT: Create TWO activities:`;
    summary += `\n1. "Departure from [user's origin]" (time based on travel duration)`;
    summary += `\n2. "${
      transportMode.primary_mode || "Bus"
    } to [destination]" - ${gt.travel_time}, ₱${gt.cost?.min}-${
      gt.cost?.max
    } per person`;
    summary += `\n(Flight search was SKIPPED - ground transport is preferred for this route)`;
  } else {
    summary += `\n✅ AIRPORT REROUTE: Create THREE activities:`;
    summary += `\n1. "Arrival at [alternative airport]" (₱0 - flight booked separately)`;
    summary += `\n2. "${
      transportMode.primary_mode || "Bus"
    } from [airport] to [destination]" - ${gt.travel_time}, ticketPricing: "₱${
      gt.cost?.min
    }-${gt.cost?.max} per person"`;
    summary += `\n3. "Check-in at [hotel]" (arrival time = airport arrival + travel time + 30min buffer)`;
    summary += `\nIMPORTANT: Bus activity MUST have proper ticketPricing field for budget tracking!`;
  }

  return summary;
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
 * DURATION-BASED DETAIL LEVEL SYSTEM
 * Prevents MAX_TOKENS errors for long trips
 * ✅ ENFORCES 7-DAY MAXIMUM (TRIP_DURATION.MAX)
 */
const getDetailLevelForDuration = (durationDays, budgetAmount) => {
  // ✅ Enforce maximum duration limit
  if (durationDays > TRIP_DURATION.MAX) {
    throw new Error(
      `Trip duration exceeds maximum of ${TRIP_DURATION.MAX} days. ` +
        `Please split into shorter trips or reduce duration to ${TRIP_DURATION.MAX} days.`
    );
  }

  // Calculate daily budget for budget enforcement
  const dailyBudget = budgetAmount
    ? Math.floor(parseInt(budgetAmount.replace(/[₱,]/g, "")) / durationDays)
    : 2000;

  // All trips 1-7 days use FULL detail mode
  return {
    level: "FULL",
    activityCount: "normal", // Use user preference
    descriptionLimit: 80,
    instructions: "",
    dailyBudget,
  };
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
  hotelBudgetLevel, // ✅ NEW: User's selected hotel budget tier (1-6)
  specialRequests,
  transportMode, // ✅ NEW: Ground transport recommendations
}) => {
  // Extract numeric duration for detail level calculation
  const durationDays = parseInt(duration) || 1;
  const detailLevel = getDetailLevelForDuration(durationDays, budgetAmount);

  // Adjust activity preference based on duration
  let adjustedActivityPreference = activityPreference;
  if (detailLevel.activityCount === "reduced") {
    adjustedActivityPreference = Math.min(
      parseInt(activityPreference) || 2,
      3
    ).toString();
  } else if (detailLevel.activityCount === "minimal") {
    adjustedActivityPreference = "2"; // Force max 2 for long trips
  }

  console.log(
    `📊 Trip Duration: ${durationDays} days (MAX: ${TRIP_DURATION.MAX})`
  );
  console.log(`🎯 Detail Level: ${detailLevel.level}`);
  console.log(
    `🎨 Activity Preference: ${activityPreference} → ${adjustedActivityPreference}`
  );

  // Get travel style influence text
  const travelStyleInfluence = getTravelStyleInfluence(
    userProfile?.travelStyle
  );

  let prompt = AI_PROMPT_OPTIMIZED.replace("{location}", location)
    .replace("{duration}", duration)
    .replace("{travelers}", travelers)
    .replace("{budget}", budget)
    .replace(/{budgetAmount}/g, budgetAmount || "₱50,000") // Replace all instances
    .replace("{activityPreference}", adjustedActivityPreference)
    .replace("{userName}", userProfile?.fullName || "Traveler")
    .replace("{userHomeLocation}", userProfile?.homeLocation || "Philippines")
    .replace(
      "{tripTypes}",
      (userProfile?.preferredTripTypes || []).join(", ") ||
        "General exploration"
    )
    .replace("{travelStyle}", userProfile?.travelStyle || "Balanced")
    .replace(
      "{travelStyleInfluence}",
      travelStyleInfluence || "Balanced mix of activities"
    )
    .replace(
      "{dietary}",
      (userProfile?.dietaryRestrictions || []).join(", ") || "None"
    )
    .replace(
      "{cultural}",
      (userProfile?.culturalPreferences || []).join(", ") || "None"
    )
    .replace("{travelDates}", buildTravelDatesSummary(dateInfo))
    .replace(
      "{flightSummary}",
      buildFlightSummary(
        flightRecommendations,
        userProfile?.homeLocation,
        location // destination
      )
    )
    .replace(
      "{hotelSummary}",
      buildHotelSummary(hotelRecommendations, hotelBudgetLevel || 3)
    ) // ✅ Pass budgetLevel with fallback
    .replace("{specialRequests}", specialRequests || "None")
    .replace("{activityStartDate}", dateInfo?.activitiesStartDate || "")
    .replace("{activityEndDate}", dateInfo?.activitiesEndDate || "")
    .replace("{checkoutDate}", dateInfo?.checkoutDate || "");

  // Add ground transport context if available
  const groundTransportSummary = buildGroundTransportSummary(transportMode);
  if (groundTransportSummary) {
    prompt += groundTransportSummary;
    console.log("✅ Ground transport context added to prompt");
  }

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
