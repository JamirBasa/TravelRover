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
   
   ⚠️ BUDGET CALCULATION ACCURACY:
   • Calculate each day's subtotal correctly: sum ALL costs (accommodation, meals, activities, transport)
   • Verify grand total = sum of all daily subtotals
   • BEFORE finalizing, check: grandTotal < {budgetAmount}
   • If grandTotal exceeds budget, REVISE the plan:
     1. Switch to cheaper hotels (₱800-1,000 range)
     2. Replace paid activities with FREE alternatives
     3. Use public transport (jeepney/bus) instead of taxis
     4. Choose budget eateries (₱150-200/meal)
   • Keep revising until grandTotal is BELOW {budgetAmount}

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
 * DURATION-BASED DETAIL LEVEL SYSTEM
 * Prevents MAX_TOKENS errors for long trips
 */
const getDetailLevelForDuration = (durationDays, budgetAmount) => {
  // Calculate daily budget for budget enforcement
  const dailyBudget = budgetAmount
    ? Math.floor(parseInt(budgetAmount.replace(/[₱,]/g, "")) / durationDays)
    : 2000;

  if (durationDays <= 7) {
    return {
      level: "FULL",
      activityCount: "normal", // Use user preference
      descriptionLimit: 80,
      instructions: "",
    };
  } else if (durationDays <= 14) {
    return {
      level: "MODERATE",
      activityCount: "reduced", // Max 2-3 activities per day
      descriptionLimit: 60,
      instructions: `
⚠️ MODERATE DETAIL MODE (${durationDays} days):
• Limit to 2-3 key activities per day (ignore activityPreference if > 3)
• Keep descriptions concise (max 60 characters)
• Focus on must-see attractions only
• Combine similar activities when possible
• BUDGET: Target ₱${dailyBudget.toLocaleString()}/day to stay within total budget`,
    };
  } else {
    return {
      level: "OVERVIEW",
      activityCount: "minimal", // Max 1-2 highlights per day
      descriptionLimit: 40,
      instructions: `
🚨 OVERVIEW MODE (${durationDays} days - TOKEN LIMIT PROTECTION):
• MAXIMUM 1-2 key highlights per day
• Descriptions: 40 characters max
• Focus on daily themes, not detailed schedules
• Example format:
  Day 1: Arrival + City Center Tour
  Day 2: Cultural Heritage Sites
  Day 3: Nature & Hiking
• Group similar activities: "Historic District Tour (3 sites)" instead of listing each
• Meals: Just mention "Breakfast/Lunch/Dinner included" without detailed pricing
• Travel times: Estimate ranges "10-15 min" instead of exact calculations

🚨 CRITICAL BUDGET CONSTRAINT FOR LONG TRIPS:
• Daily budget target: ₱${dailyBudget.toLocaleString()} (STRICT - do NOT exceed)
• Prioritize FREE or low-cost activities
• Use budget accommodations (₱800-1,500/night)
• Minimize paid attractions - focus on parks, beaches, free viewpoints
• Transport: Use jeepneys/buses over taxis
• Meals: Budget eateries (₱150-250/meal per person)
• If day total exceeds ₱${dailyBudget.toLocaleString()}, CUT activities or use free alternatives
• CALCULATE grand total and ensure it's BELOW the budget cap`,
    };
  }
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

  console.log(`📊 Trip Duration: ${durationDays} days`);
  console.log(`🎯 Detail Level: ${detailLevel.level}`);
  console.log(
    `🎨 Activity Preference: ${activityPreference} → ${adjustedActivityPreference}`
  );
  if (durationDays > 14) {
    const dailyBudget = budgetAmount
      ? Math.floor(parseInt(budgetAmount.replace(/[₱,]/g, "")) / durationDays)
      : 2000;
    console.log(
      `💰 Daily Budget Target: ₱${dailyBudget.toLocaleString()} (STRICT)`
    );
  }

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
    .replace("{flightSummary}", buildFlightSummary(flightRecommendations))
    .replace("{hotelSummary}", buildHotelSummary(hotelRecommendations))
    .replace("{specialRequests}", specialRequests || "None")
    .replace("{activityStartDate}", dateInfo?.activitiesStartDate || "")
    .replace("{activityEndDate}", dateInfo?.activitiesEndDate || "")
    .replace("{checkoutDate}", dateInfo?.checkoutDate || "");

  // Add duration-specific instructions
  if (detailLevel.instructions) {
    prompt += detailLevel.instructions;
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
