/**
 * Budget Compliance Utilities
 * Ensures strict budget enforcement for trip planning with ACTUAL Filipino pricing
 */

// 2025 Filipino Market Price Ranges (Manila baseline)
export const FILIPINO_PRICE_RANGES = {
  ACCOMMODATION: {
    BUDGET_FRIENDLY: { min: 800, max: 1500, label: "Budget-friendly hostels/guesthouses" },
    MID_RANGE: { min: 1500, max: 3000, label: "Mid-range hotels (3-star)" },
    UPSCALE: { min: 3000, max: 5000, label: "Upscale hotels (4-star)" },
    LUXURY: { min: 5000, max: 15000, label: "Luxury hotels (5-star)" },
  },
  
  // Regional price multipliers (Manila = 1.0 baseline)
  REGIONAL_MULTIPLIERS: {
    // Metro Manila & surrounding
    "Metro Manila": { region: 1.0, cities: {
      "Manila": 1.0,
      "Makati": 1.4,     // Business district premium
      "BGC": 1.5,        // Bonifacio Global City premium
      "Quezon City": 1.1,
      "Pasay": 1.0,
      "Mandaluyong": 1.2,
    }},
    
    // Luzon regions
    "Cordillera": { region: 0.75, cities: {
      "Baguio": 0.8,     // Tourist destination (₱2,000 × 0.75 × 0.8 = ₱1,200)
      "Sagada": 0.6,     // Remote mountain town
    }},
    "Calabarzon": { region: 0.85, cities: {
      "Tagaytay": 0.9,   // Weekend tourist spot
      "Batangas City": 0.7,
    }},
    "Ilocos": { region: 0.65, cities: {
      "Vigan": 0.8,      // Heritage tourist spot
      "Laoag": 0.7,
    }},
    
    // Visayas regions
    "Central Visayas": { region: 0.80, cities: {
      "Cebu City": 1.1,  // Major city premium (₱2,000 × 0.80 × 1.1 = ₱1,760)
      "Mactan": 1.0,     // Island resort area
      "Bohol": 0.7,
    }},
    
    // Mindanao regions
    "Davao": { region: 0.75, cities: {
      "Davao City": 0.9,
    }},
    
    // Island destinations
    "Palawan": { region: 0.70, cities: {
      "El Nido": 1.2,    // Premium tourist destination (₱2,000 × 0.70 × 1.2 = ₱1,680)
      "Coron": 1.1,
      "Puerto Princesa": 0.8,
    }},
    "Boracay": { region: 1.0, cities: {
      "White Beach": 1.3, // Premium beach resort
    }},
  },
  MEALS: {
    STREET_FOOD: { min: 50, max: 120, label: "Carinderia/street food" },
    FAST_FOOD: { min: 150, max: 250, label: "Fast food (Jollibee, McDonald's)" },
    CASUAL: { min: 250, max: 500, label: "Casual dining" },
    MID_RANGE: { min: 400, max: 800, label: "Mid-range restaurant" },
    FINE_DINING: { min: 800, max: 2000, label: "Fine dining" },
  },
  TRANSPORT: {
    JEEPNEY: { min: 13, max: 25, label: "Jeepney (city)" },
    BUS_CITY: { min: 15, max: 25, label: "Bus (city)" },
    BUS_PROVINCIAL_PER_100KM: { min: 150, max: 300, label: "Provincial bus per 100km" },
    TRICYCLE: { min: 20, max: 50, label: "Tricycle (short)" },
    TAXI_BASE: { base: 40, perKm: 13.5, label: "Taxi" },
    GRAB_AIRPORT: { min: 200, max: 500, label: "Grab/taxi (airport to city)" },
  },
  ATTRACTIONS: {
    FREE: { min: 0, max: 0, label: "Free entry" },
    GOVERNMENT: { min: 50, max: 150, label: "Government museums/sites" },
    THEME_PARK: { min: 800, max: 1200, label: "Theme parks" },
    ISLAND_TOUR: { min: 800, max: 2500, label: "Island hopping" },
    DIVING: { min: 2500, max: 4500, label: "Scuba diving" },
  },
};

/**
 * Calculate numeric budget amount from budget tier or custom value
 * @param {string} budgetTier - Budget tier (Budget, Moderate, Luxury)
 * @param {string|number} customBudget - Custom budget amount
 * @returns {number} Numeric budget amount in PHP
 */
export const calculateBudgetAmount = (budgetTier, customBudget) => {
  if (customBudget) {
    const cleaned =
      typeof customBudget === "string"
        ? customBudget.replace(/[^0-9]/g, "")
        : customBudget;
    return parseInt(cleaned) || 50000;
  }

  // Budget tier ranges (using upper bound for safety margin)
  const budgetMap = {
    Budget: 8000, // ₱2,000-8,000 per day range
    Moderate: 20000, // ₱8,000-20,000 per day range
    Luxury: 100000, // ₱20,000+ per day range
  };

  return budgetMap[budgetTier] || 50000;
};

/**
 * Validate AI response includes proper budget compliance data
 * @param {object} tripData - Parsed trip data from AI
 * @returns {object} { isValid: boolean, errors: string[] }
 */
export const validateBudgetCompliance = (tripData) => {
  const errors = [];
  const warnings = [];

  if (!tripData) {
    return { isValid: false, errors: ["No trip data provided"], warnings: [] };
  }

  // Check budgetCompliance object exists and is valid
  if (!tripData.budgetCompliance) {
    errors.push("❌ Missing budgetCompliance object");
  } else {
    const { totalCost, userBudget, withinBudget } =
      tripData.budgetCompliance;

    if (typeof totalCost !== "number") {
      errors.push("❌ Missing or invalid totalCost (must be a number)");
    }

    if (typeof userBudget !== "number") {
      errors.push("❌ Missing or invalid userBudget (must be a number)");
    }

    if (typeof withinBudget !== "boolean") {
      errors.push("❌ Missing or invalid withinBudget flag");
    }

    // ✅ IMPROVED: Allow small budget buffer (5% tolerance for real-world pricing variations)
    // Real Filipino market prices don't align perfectly with round budget numbers
    const BUDGET_TOLERANCE_PERCENT = 0.05; // 5% tolerance
    const toleranceAmount = Math.round(userBudget * BUDGET_TOLERANCE_PERCENT);
    const exceedsWithTolerance = totalCost > (userBudget + toleranceAmount);

    if (withinBudget !== true && exceedsWithTolerance) {
      const overage = totalCost - userBudget;
      const overagePercent = ((overage / userBudget) * 100).toFixed(1);
      
      errors.push(
        `❌ BUDGET EXCEEDED: Total ₱${totalCost?.toLocaleString()} > Budget ₱${userBudget?.toLocaleString()} + 5% buffer (₱${overage.toLocaleString()} or ${overagePercent}% over)`
      );
    } else if (withinBudget !== true && !exceedsWithTolerance) {
      // Within tolerance - convert to warning instead of error
      const overage = totalCost - userBudget;
      const overagePercent = ((overage / userBudget) * 100).toFixed(1);
      
      warnings.push(
        `⚠️ Slightly over budget: Total ₱${totalCost?.toLocaleString()} vs Budget ₱${userBudget?.toLocaleString()} (${overagePercent}% over, within 5% tolerance)`
      );
    }

    if (totalCost && userBudget && exceedsWithTolerance) {
      const overage = totalCost - userBudget;
      errors.push(
        `❌ Plan exceeds budget+buffer by ₱${overage.toLocaleString()} (more than 5% tolerance)`
      );
    }
  }

  // Check daily costs exist
  if (!tripData.dailyCosts || !Array.isArray(tripData.dailyCosts)) {
    errors.push("❌ Missing dailyCosts array");
  } else if (tripData.dailyCosts.length === 0) {
    errors.push("❌ dailyCosts array is empty");
  } else {
    // Validate each day's breakdown
    tripData.dailyCosts.forEach((dayCost, index) => {
      if (!dayCost.breakdown) {
        errors.push(`❌ Day ${index + 1}: Missing cost breakdown`);
      } else {
        const { accommodation, meals, activities, transport, subtotal } =
          dayCost.breakdown;

        if (typeof accommodation !== "number")
          errors.push(`❌ Day ${index + 1}: Invalid accommodation cost`);
        if (typeof meals !== "number")
          errors.push(`❌ Day ${index + 1}: Invalid meals cost`);
        if (typeof activities !== "number")
          errors.push(`❌ Day ${index + 1}: Invalid activities cost`);
        if (typeof transport !== "number")
          errors.push(`❌ Day ${index + 1}: Invalid transport cost`);
        if (typeof subtotal !== "number")
          errors.push(`❌ Day ${index + 1}: Invalid subtotal`);

        // Verify subtotal calculation
        const calculatedSubtotal =
          accommodation + meals + activities + transport;
        if (Math.abs(subtotal - calculatedSubtotal) > 1) {
          errors.push(
            `❌ Day ${index + 1}: Subtotal mismatch (calculated: ₱${calculatedSubtotal}, provided: ₱${subtotal})`
          );
        }

        // Validate realistic pricing for Filipino market
        if (accommodation > 0 && accommodation < 500) {
          warnings.push(
            `⚠️ Day ${index + 1}: Accommodation ₱${accommodation} seems unrealistically low (expected ₱800-15,000)`
          );
        }
        if (meals > 0 && meals < 100) {
          warnings.push(
            `⚠️ Day ${index + 1}: Daily meals ₱${meals} too low (expected ₱150-1,500 for 3 meals)`
          );
        }
      }
    });
  }

  // Check for missing/uncertain prices
  if (tripData.missingPrices && Array.isArray(tripData.missingPrices)) {
    if (tripData.missingPrices.length > 0) {
      warnings.push(
        `⚠️ UNCERTAIN PRICES: ${tripData.missingPrices.length} items need confirmation - ${tripData.missingPrices.join(", ")}`
      );
    }
  } else {
    warnings.push("⚠️ Missing missingPrices array (should track uncertain pricing)");
  }

  // Check pricing notes
  if (!tripData.pricingNotes || tripData.pricingNotes.trim() === "") {
    warnings.push("⚠️ Missing pricingNotes - should explain source of pricing data");
  }

  // Check grand total exists and matches daily totals
  if (typeof tripData.grandTotal !== "number") {
    errors.push("❌ Missing or invalid grandTotal");
  } else if (tripData.dailyCosts && Array.isArray(tripData.dailyCosts)) {
    const calculatedGrandTotal = tripData.dailyCosts.reduce(
      (sum, day) => sum + (day.breakdown?.subtotal || 0),
      0
    );

    // ✅ LENIENT: Allow up to ₱100 discrepancy (rounding errors, fees, etc.)
    const discrepancy = Math.abs(tripData.grandTotal - calculatedGrandTotal);
    
    if (discrepancy > 100) {
      errors.push(
        `❌ Grand total mismatch (calculated: ₱${calculatedGrandTotal.toLocaleString()}, provided: ₱${tripData.grandTotal.toLocaleString()}, difference: ₱${discrepancy.toLocaleString()})`
      );
    } else if (discrepancy > 1) {
      warnings.push(
        `⚠️ Minor grand total difference: ₱${discrepancy.toLocaleString()} (acceptable for rounding)`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Extract numeric value from price string
 * @param {string} priceString - Price string (e.g., "₱500", "₱200-350", "Free")
 * @returns {number} Numeric price value
 */
export const extractNumericPrice = (priceString) => {
  if (!priceString) return 0;

  const str = String(priceString).toLowerCase();

  // Handle free/zero cases
  if (
    str.includes("free") ||
    str.includes("₱0") ||
    str === "0" ||
    str === "n/a"
  ) {
    return 0;
  }

  // Extract numbers from string
  const numbers = str.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);

  if (!numbers || numbers.length === 0) return 0;

  // If range (e.g., "₱200-350"), use upper bound for safety
  if (numbers.length > 1) {
    return Math.max(...numbers.map((n) => parseFloat(n.replace(/,/g, ""))));
  }

  return parseFloat(numbers[0].replace(/,/g, ""));
};

/**
 * Format budget summary for display
 * @param {object} budgetCompliance - Budget compliance data
 * @returns {string} Formatted budget summary
 */
export const formatBudgetSummary = (budgetCompliance) => {
  if (!budgetCompliance) return "Budget information not available";

  const { userBudget, totalCost, remaining, withinBudget } = budgetCompliance;

  const status = withinBudget ? "✅ Within Budget" : "❌ Over Budget";

  return `
    ${status}
    Budget: ₱${userBudget?.toLocaleString()}
    Total Cost: ₱${totalCost?.toLocaleString()}
    ${remaining >= 0 ? "Remaining" : "Over"}: ₱${Math.abs(remaining)?.toLocaleString()}
  `.trim();
};

/**
 * Get budget tier from amount
 * @param {number} amount - Budget amount
 * @returns {string} Budget tier (Budget-Friendly, Moderate, Luxury)
 */
export const getBudgetTier = (amount) => {
  if (amount <= 8000) return "Budget-Friendly";
  if (amount <= 20000) return "Moderate";
  return "Luxury";
};

/**
 * Adjust price for regional and city differences
 * @param {number} basePrice - Base price (Manila baseline)
 * @param {string} destination - Destination city (e.g., "Baguio", "Makati")
 * @returns {object} { adjustedPrice: number, multiplier: number, breakdown: object }
 * 
 * @example
 * // Get Baguio hotel price
 * const manilaHotelPrice = 2000;
 * const baguioPrice = adjustPriceForCity(manilaHotelPrice, "Baguio");
 * // Returns: { adjustedPrice: 1200, multiplier: 0.6, breakdown: { region: 0.75, city: 0.8 } }
 * 
 * @example
 * // Get Makati hotel price
 * const makatiPrice = adjustPriceForCity(manilaHotelPrice, "Makati");
 * // Returns: { adjustedPrice: 2800, multiplier: 1.4, breakdown: { region: 1.0, city: 1.4 } }
 */
export const adjustPriceForCity = (basePrice, destination) => {
  if (!destination || !basePrice || basePrice <= 0) {
    return { 
      adjustedPrice: basePrice, 
      multiplier: 1.0,
      breakdown: { region: 1.0, city: 1.0 },
      note: "Invalid input - using base price"
    };
  }

  const destLower = destination.toLowerCase();
  
  // Find matching region and city
  let regionMultiplier = 1.0;
  let cityMultiplier = 1.0;
  let matchedRegion = null;
  let matchedCity = null;

  for (const [regionName, regionData] of Object.entries(FILIPINO_PRICE_RANGES.REGIONAL_MULTIPLIERS || {})) {
    regionMultiplier = regionData.region || 1.0;
    
    // Check if destination matches any city in this region
    for (const [cityName, cityMult] of Object.entries(regionData.cities || {})) {
      if (destLower.includes(cityName.toLowerCase())) {
        cityMultiplier = cityMult;
        matchedRegion = regionName;
        matchedCity = cityName;
        break;
      }
    }
    
    if (matchedCity) break;
    
    // Reset if no city match in this region
    regionMultiplier = 1.0;
  }

  const totalMultiplier = regionMultiplier * cityMultiplier;
  const adjustedPrice = Math.round(basePrice * totalMultiplier);

  return {
    adjustedPrice,
    multiplier: totalMultiplier,
    breakdown: {
      region: regionMultiplier,
      city: cityMultiplier,
    },
    location: {
      matched: matchedCity ? `${matchedCity}, ${matchedRegion}` : "Manila (default)",
      original: destination,
    }
  };
};

/**
 * Get expected price range for destination (validates AI pricing)
 * @param {string} accommodationType - "Budget-Friendly", "Mid-Range", "Upscale", "Luxury"
 * @param {string} destination - Destination city
 * @returns {object} { min: number, max: number, label: string }
 * 
 * @example
 * const range = getExpectedPriceRange("Mid-Range", "Baguio");
 * // Returns: { min: 900, max: 1800, label: "Mid-range hotels (3-star) in Baguio" }
 */
export const getExpectedPriceRange = (accommodationType, destination) => {
  const typeKey = accommodationType.toUpperCase().replace(/-/g, "_");
  const baseRange = FILIPINO_PRICE_RANGES.ACCOMMODATION[typeKey];
  
  if (!baseRange) {
    return { min: 800, max: 15000, label: "Unknown type - full range" };
  }

  // Adjust range for destination
  const adjustment = adjustPriceForCity(baseRange.max, destination);
  const minAdjusted = Math.round(baseRange.min * adjustment.multiplier);
  const maxAdjusted = adjustment.adjustedPrice;

  return {
    min: minAdjusted,
    max: maxAdjusted,
    label: `${baseRange.label} in ${adjustment.location.matched}`,
    multiplier: adjustment.multiplier,
  };
};

/**
 * Validate itinerary items have prices
 * @param {object} tripData - Parsed trip data
 * @returns {object} { isValid: boolean, missingPrices: string[] }
 */
export const validateItineraryPrices = (tripData) => {
  const missingPrices = [];

  if (!tripData.itinerary || !Array.isArray(tripData.itinerary)) {
    return { isValid: false, missingPrices: ["No itinerary data"] };
  }

  tripData.itinerary.forEach((day, dayIndex) => {
    if (!day.plan || !Array.isArray(day.plan)) return;

    day.plan.forEach((activity, activityIndex) => {
      const price = activity.ticketPricing;

      // Check if price is missing or invalid
      if (
        !price ||
        price.toLowerCase().includes("varies") ||
        (price.toLowerCase().includes("free") && !price.includes("₱0"))
      ) {
        missingPrices.push(
          `Day ${dayIndex + 1}, Activity ${activityIndex + 1}: ${activity.placeName || "Unnamed"}`
        );
      }

      // Check if price is numeric
      const numericPrice = extractNumericPrice(price);
      if (
        price &&
        !price.includes("₱0") &&
        !price.toLowerCase().includes("free") &&
        !price.includes("₱???") &&
        numericPrice === 0
      ) {
        missingPrices.push(
          `Day ${dayIndex + 1}, Activity ${activityIndex + 1}: ${activity.placeName || "Unnamed"} - invalid price format`
        );
      }
    });
  });

  return {
    isValid: missingPrices.length === 0,
    missingPrices,
  };
};

/**
 * Detect generic or unrealistic pricing patterns (AI hallucination check)
 * @param {object} tripData - Parsed trip data
 * @returns {object} { hasIssues: boolean, issues: string[] }
 */
export const detectUnrealisticPricing = (tripData) => {
  const issues = [];
  const priceOccurrences = {};
  const destination = tripData?.destination || tripData?.userSelection?.location || "Manila";

  if (!tripData.itinerary || !Array.isArray(tripData.itinerary)) {
    return { hasIssues: false, issues: [] };
  }

  // Check for repeated generic prices
  tripData.itinerary.forEach((day) => {
    if (!day.plan || !Array.isArray(day.plan)) return;

    day.plan.forEach((activity) => {
      const numericPrice = extractNumericPrice(activity.ticketPricing);
      if (numericPrice > 0) {
        priceOccurrences[numericPrice] = (priceOccurrences[numericPrice] || 0) + 1;
      }
    });
  });

  // Flag if same price appears 5+ times (likely generic)
  Object.entries(priceOccurrences).forEach(([price, count]) => {
    if (count >= 5) {
      issues.push(
        `⚠️ Price ₱${parseInt(price).toLocaleString()} appears ${count} times - may be generic placeholder`
      );
    }
  });

  // Check for suspiciously round numbers used repeatedly
  const suspiciousRoundPrices = [100, 200, 500, 1000];
  suspiciousRoundPrices.forEach((roundPrice) => {
    if ((priceOccurrences[roundPrice] || 0) >= 3) {
      issues.push(
        `⚠️ Generic round price ₱${roundPrice} used ${priceOccurrences[roundPrice]} times - likely not actual pricing`
      );
    }
  });

  // Check hotel prices against destination-adjusted ranges
  if (tripData.hotels && Array.isArray(tripData.hotels)) {
    tripData.hotels.forEach((hotel, index) => {
      const hotelPrice = extractNumericPrice(hotel.pricePerNight);
      
      // Get expected range for this destination
      const budgetRange = getExpectedPriceRange("Budget-Friendly", destination);
      const luxuryRange = getExpectedPriceRange("Luxury", destination);
      
      if (hotelPrice > 0 && hotelPrice < budgetRange.min * 0.6) {
        issues.push(
          `⚠️ Hotel ${index + 1}: ₱${hotelPrice}/night too low for ${destination} (expected ≥₱${Math.round(budgetRange.min)})`
        );
      }
      
      if (hotelPrice > luxuryRange.max * 1.5) {
        issues.push(
          `⚠️ Hotel ${index + 1}: ₱${hotelPrice}/night unusually high for ${destination} (verify ultra-luxury pricing)`
        );
      }
    });
  }

  // Check daily costs for unrealistic patterns with destination context
  if (tripData.dailyCosts && Array.isArray(tripData.dailyCosts)) {
    const budgetMin = getExpectedPriceRange("Budget-Friendly", destination).min;
    
    tripData.dailyCosts.forEach((dayCost, index) => {
      const { accommodation, meals, activities, transport } = dayCost.breakdown || {};

      // Hotels shouldn't be under minimum for destination
      if (accommodation > 0 && accommodation < budgetMin * 0.6) {
        issues.push(
          `⚠️ Day ${index + 1}: Accommodation ₱${accommodation} below market minimum for ${destination} (expected ≥₱${Math.round(budgetMin)})`
        );
      }

      // Meals for full day shouldn't be under ₱100
      if (meals > 0 && meals < 100) {
        issues.push(
          `⚠️ Day ${index + 1}: Total meals ₱${meals} too low (3 meals expected ₱150-1,500)`
        );
      }

      // Check for zero transport on non-arrival/departure days
      if (transport === 0 && activities > 0) {
        issues.push(
          `⚠️ Day ${index + 1}: ₱0 transport cost with activities (jeepney/bus fares missing?)`
        );
      }
    });
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
};
