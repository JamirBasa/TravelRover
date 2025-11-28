/**
 * Hotel Pricing Validator
 * Validates hotels against user's selected budget tier and provides intelligent scoring
 * for multi-criteria sorting (price + rating + reviews)
 */

// Budget tier configuration (matches TravelServicesSelector.jsx)
export const BUDGET_TIER_CONFIG = {
  1: { label: "Budget", min: 500, max: 1500, icon: "💰" },
  2: { label: "Economy", min: 1500, max: 2500, icon: "🏷️" },
  3: { label: "Mid-Range", min: 2500, max: 5000, icon: "⭐" },
  4: { label: "Upscale", min: 5000, max: 10000, icon: "✨" },
  5: { label: "Luxury", min: 10000, max: 20000, icon: "💎" },
  6: { label: "Ultra-Luxury", min: 20000, max: Infinity, icon: "👑" },
};

/**
 * Extract numeric price from hotel data
 * Handles formats: "₱3,500", "₱2,500 - ₱5,000", 3500, etc.
 * @param {string|number} priceStr - Price string or number
 * @returns {number} - Numeric price value (uses lower bound for ranges)
 */
export const extractPrice = (priceStr) => {
  if (!priceStr && priceStr !== 0) return 0;

  const priceString = String(priceStr);

  // Handle range format: "₱2,500 - ₱5,000"
  if (priceString.includes("-")) {
    const rangeMatch = priceString.match(/[\d,]+/g);
    if (rangeMatch && rangeMatch.length >= 1) {
      return parseFloat(rangeMatch[0].replace(/,/g, ""));
    }
  }

  // Handle single price: "₱3,500" or "3500"
  const numPrice = parseFloat(priceString.replace(/[₱$€£,]/g, ""));
  return isNaN(numPrice) ? 0 : numPrice;
};

/**
 * Validate hotel price against user's selected budget tier
 * @param {number} hotelPrice - Hotel price per night
 * @param {number} budgetLevel - User's selected budget tier (1-6)
 * @returns {object} - { isCompliant, status, tier, message }
 */
export const validateBudgetTier = (hotelPrice, budgetLevel) => {
  const tier = BUDGET_TIER_CONFIG[budgetLevel] || BUDGET_TIER_CONFIG[3]; // Default to Mid-Range

  const isCompliant = hotelPrice >= tier.min && hotelPrice <= tier.max;

  let status = "withinBudget";
  let message = `✓ Matches your ${tier.label} budget (₱${tier.min.toLocaleString()}-${tier.max.toLocaleString()})`;

  if (hotelPrice < tier.min) {
    status = "belowBudget";
    message = `💚 Below your ${tier.label} budget (saves ₱${(tier.min - hotelPrice).toLocaleString()})`;
  } else if (hotelPrice > tier.max) {
    status = "aboveBudget";
    message = `⚠️ Above your ${tier.label} budget (costs +₱${(hotelPrice - tier.max).toLocaleString()})`;
  }

  return {
    isCompliant,
    status,
    tier,
    message,
    tierLabel: tier.label,
    tierRange: { min: tier.min, max: tier.max },
  };
};

/**
 * Calculate intelligent "Value Score" for multi-criteria sorting
 * Balances price, rating, and review count
 * Formula: (Rating * 10) + (ReviewWeight * 5) - (Price / 100)
 * Higher score = better value (cheapest + highest rated)
 *
 * @param {object} hotel - Hotel object with price, rating, reviews
 * @param {object} options - Sorting options
 * @returns {number} - Value score (0-100+)
 */
export const calculateValueScore = (
  hotel,
  options = { priceWeight: 0.6, ratingWeight: 0.3, reviewWeight: 0.1 }
) => {
  const price = extractPrice(hotel?.pricePerNight || hotel?.price_range || 0) || 5000; // Default to mid-range
  const rating = parseFloat(hotel?.rating) || 3.5;
  const reviews = parseInt(hotel?.user_ratings_total || hotel?.reviews_count) || 0;

  // Normalize metrics to 0-100 scale
  // Price: Lower is better (normalize inversely, max ₱20k = worst)
  const priceScore = Math.max(0, 100 - (price / 200)); // ₱20k = 0 points, ₱0 = 100 points

  // Rating: Higher is better (normalize by 5.0 max)
  const ratingScore = (rating / 5.0) * 100;

  // Review confidence: More reviews = higher weight (log scale for diminishing returns)
  const reviewScore = Math.log(Math.max(1, reviews + 1)) * 10; // 1 review = ~7 points, 100+ = ~50+ points

  // Weighted combination
  const valueScore =
    priceScore * options.priceWeight +
    ratingScore * options.ratingWeight +
    reviewScore * options.reviewWeight;

  return Math.round(valueScore * 10) / 10; // Round to 1 decimal
};

/**
 * Identify special hotel indicators in a hotel list
 * @param {array} hotels - Array of hotel objects
 * @param {number} budgetLevel - User's selected budget tier
 * @returns {object} - { cheapestHotel, topRatedHotel, bestValueHotel, budgetCompliantHotels }
 */
export const identifySpecialHotels = (hotels, budgetLevel) => {
  if (!hotels || hotels.length === 0) {
    return {
      cheapestHotel: null,
      topRatedHotel: null,
      bestValueHotel: null,
      budgetCompliantHotels: [],
    };
  }

  // Find cheapest hotel (lowest absolute price)
  let cheapestHotel = hotels[0];
  let cheapestPrice = extractPrice(hotels[0]?.pricePerNight || hotels[0]?.price_range || Infinity);

  // Find top-rated hotel (highest rating + reviews)
  let topRatedHotel = hotels[0];
  let topRating = parseFloat(hotels[0]?.rating) || 0;
  let topReviews = parseInt(hotels[0]?.user_ratings_total || hotels[0]?.reviews_count) || 0;

  // Find best value hotel (highest value score)
  let bestValueHotel = hotels[0];
  let bestValueScore = calculateValueScore(hotels[0]);

  // Budget-compliant hotels
  const budgetCompliantHotels = [];

  hotels.forEach((hotel) => {
    const price = extractPrice(hotel?.pricePerNight || hotel?.price_range || Infinity);
    const rating = parseFloat(hotel?.rating) || 0;
    const reviews = parseInt(hotel?.user_ratings_total || hotel?.reviews_count) || 0;
    const valueScore = calculateValueScore(hotel);

    // Update cheapest
    if (price > 0 && price < cheapestPrice) {
      cheapestHotel = hotel;
      cheapestPrice = price;
    }

    // Update top-rated (heavily prioritize review count for credibility)
    // Formula: (Rating * Review Count) + (Review Count * 0.5)
    // This ensures hotels with more reviews are favored when ratings are similar
    const ratingWeight = (rating * reviews) + (reviews * 0.5);
    const currentTopWeight = (topRating * topReviews) + (topReviews * 0.5);
    if (ratingWeight > currentTopWeight) {
      topRatedHotel = hotel;
      topRating = rating;
      topReviews = reviews;
    }

    // Update best value score
    if (valueScore > bestValueScore) {
      bestValueHotel = hotel;
      bestValueScore = valueScore;
    }

    // Track budget compliance
    const compliance = validateBudgetTier(price, budgetLevel);
    if (compliance.isCompliant) {
      budgetCompliantHotels.push(hotel);
    }
  });

  return {
    cheapestHotel,
    topRatedHotel,
    bestValueHotel,
    budgetCompliantHotels,
    cheapestPrice,
    topRating,
    bestValueScore,
  };
};

/**
 * Enrich hotel object with validation and scoring data
 * @param {object} hotel - Hotel object to enrich
 * @param {number} budgetLevel - User's selected budget tier
 * @param {object} specialHotels - Result from identifySpecialHotels()
 * @returns {object} - Enriched hotel with badges and compliance data
 */
export const enrichHotelWithValidation = (hotel, budgetLevel, specialHotels) => {
  const price = extractPrice(hotel?.pricePerNight || hotel?.price_range || 0);
  const budgetValidation = validateBudgetTier(price, budgetLevel);
  const valueScore = calculateValueScore(hotel);

  // Determine which special badges apply
  const isCheapest = specialHotels?.cheapestHotel?.name === hotel.name || 
                     specialHotels?.cheapestHotel?.hotelName === hotel.hotelName;
  const isTopRated = specialHotels?.topRatedHotel?.name === hotel.name || 
                     specialHotels?.topRatedHotel?.hotelName === hotel.hotelName;
  const isBestValue = specialHotels?.bestValueHotel?.name === hotel.name || 
                      specialHotels?.bestValueHotel?.hotelName === hotel.hotelName;

  return {
    ...hotel,
    // Pricing validation
    priceNumeric: price,
    budgetCompliance: {
      status: budgetValidation.status, // withinBudget, belowBudget, aboveBudget
      isCompliant: budgetValidation.isCompliant,
      message: budgetValidation.message,
      tierLabel: budgetValidation.tierLabel,
      tierRange: budgetValidation.tierRange,
    },
    // Scoring
    valueScore,
    // Special badges
    badges: {
      isCheapest,
      isTopRated,
      isBestValue,
      isVerified: (hotel?.user_ratings_total || hotel?.reviews_count || 0) > 0,
      isAiEstimate: (hotel?.user_ratings_total || hotel?.reviews_count || 0) === 0,
    },
  };
};

/**
 * Sort hotels by multiple criteria
 * @param {array} hotels - Array of hotels to sort
 * @param {number} budgetLevel - User's selected budget tier
 * @param {string} sortBy - Sort strategy: 'value' (default), 'price', 'rating', 'budget'
 * @returns {array} - Sorted hotels
 */
export const sortHotels = (hotels, budgetLevel = 3, sortBy = "value") => {
  if (!hotels || hotels.length === 0) return [];

  const hotelsCopy = [...hotels];

  switch (sortBy) {
    case "price":
      // Sort by lowest price
      return hotelsCopy.sort((a, b) => {
        const priceA = extractPrice(a?.pricePerNight || a?.price_range || Infinity);
        const priceB = extractPrice(b?.pricePerNight || b?.price_range || Infinity);
        if (priceA === Infinity) return 1;
        if (priceB === Infinity) return -1;
        return priceA - priceB;
      });

    case "rating":
      // Sort by highest rating, then by review count
      return hotelsCopy.sort((a, b) => {
        const ratingA = parseFloat(a?.rating) || 0;
        const ratingB = parseFloat(b?.rating) || 0;
        if (ratingA !== ratingB) return ratingB - ratingA;
        const reviewsA = parseInt(a?.user_ratings_total || a?.reviews_count) || 0;
        const reviewsB = parseInt(b?.user_ratings_total || b?.reviews_count) || 0;
        return reviewsB - reviewsA;
      });

    case "budget":
      // Sort by budget compliance first, then by value score
      return hotelsCopy.sort((a, b) => {
        const complianceA = validateBudgetTier(
          extractPrice(a?.pricePerNight || a?.price_range || 0),
          budgetLevel
        ).isCompliant;
        const complianceB = validateBudgetTier(
          extractPrice(b?.pricePerNight || b?.price_range || 0),
          budgetLevel
        ).isCompliant;
        if (complianceA !== complianceB) return complianceA ? -1 : 1;
        return calculateValueScore(b) - calculateValueScore(a);
      });

    case "value":
    default:
      // Sort by value score (price + rating + reviews)
      return hotelsCopy.sort((a, b) => {
        const scoreA = calculateValueScore(a);
        const scoreB = calculateValueScore(b);
        return scoreB - scoreA; // Highest score first
      });
  }
};
