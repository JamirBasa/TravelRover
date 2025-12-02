/**
 * Hotel Quality Tier System
 * 
 * Categorizes hotels by verification confidence level
 * Implements progressive filtering to show highest quality hotels
 */

/**
 * Quality Tier Definitions
 */
export const QUALITY_TIERS = {
  PERFECT: {
    level: 1,
    name: 'Verified',
    userFriendlyName: 'Fully Verified Hotel',
    minScore: 1.0,
    maxScore: 1.0,
    color: 'emerald',
    icon: '✓',
    badge: '✓ Verified',
    description: 'Confirmed match with our hotel database',
    userExplanation: 'This hotel has been verified against our database and can be directly booked on Agoda with confidence.',
    canBook: true,
    showByDefault: true
  },
  EXCELLENT: {
    level: 2,
    name: 'Trusted',
    userFriendlyName: 'Trusted Match',
    minScore: 0.90,
    maxScore: 0.99,
    color: 'blue',
    icon: '✓',
    badge: '✓ Trusted',
    description: 'High-confidence verified hotel',
    userExplanation: 'This hotel closely matches our database records and has been verified for booking.',
    canBook: true,
    showByDefault: true
  },
  GOOD: {
    level: 3,
    name: 'Confirmed',
    userFriendlyName: 'Confirmed Hotel',
    minScore: 0.85,
    maxScore: 0.89,
    color: 'sky',
    icon: '✓',
    badge: '~ Confirmed',
    description: 'Good match with database',
    userExplanation: 'This hotel has been matched with our database. We recommend verifying the hotel name and details on the booking site.',
    canBook: true,
    showByDefault: false // Only show if insufficient Tier 1-2 hotels
  },
  MODERATE: {
    level: 4,
    name: 'Found',
    userFriendlyName: 'Found in Database',
    minScore: 0.75,
    maxScore: 0.84,
    color: 'amber',
    icon: '~',
    badge: '~ Found',
    description: 'Matched hotel - please verify',
    userExplanation: 'This hotel was found in our database but may have slight name differences. Please check the hotel details carefully before booking.',
    canBook: true,
    showByDefault: false
  },
  LOW: {
    level: 5,
    name: 'AI Recommendation',
    userFriendlyName: 'AI-Suggested Hotel',
    minScore: 0.65,
    maxScore: 0.74,
    color: 'orange',
    icon: 'AI',
    badge: 'AI Estimate',
    description: 'AI-generated recommendation',
    userExplanation: 'This hotel is an AI-generated suggestion. You can search for it on Agoda, but details may vary.',
    canBook: false,
    showByDefault: false
  },
  UNVERIFIED: {
    level: 6,
    name: 'Search Only',
    userFriendlyName: 'Search Agoda',
    minScore: 0,
    maxScore: 0.64,
    color: 'gray',
    icon: '🔍',
    badge: 'Search Only',
    description: 'Not in our database',
    userExplanation: 'This hotel is not in our verified database. Click to search similar hotels in your destination on Agoda.',
    canBook: false,
    showByDefault: false
  }
};

/**
 * Get quality tier for a hotel based on match score
 * @param {Object} hotel - Hotel object with matchScore and verified status
 * @returns {Object} Quality tier information
 */
export function getHotelQualityTier(hotel) {
  // No hotel_id = cannot book directly
  const hasValidHotelId = hotel?.hotel_id && /^\d+$/.test(String(hotel.hotel_id));
  
  // Not verified or no match score = unverified
  if (!hotel?.verified || hotel.matchScore === undefined || hotel.matchScore === null) {
    return {
      ...QUALITY_TIERS.UNVERIFIED,
      hotel,
      hasValidHotelId: false
    };
  }

  const score = hotel.matchScore;

  // Find matching tier
  for (const [key, tier] of Object.entries(QUALITY_TIERS)) {
    if (score >= tier.minScore && score <= tier.maxScore) {
      return {
        ...tier,
        hotel,
        hasValidHotelId,
        actualScore: score
      };
    }
  }

  // Fallback to unverified
  return {
    ...QUALITY_TIERS.UNVERIFIED,
    hotel,
    hasValidHotelId: false,
    actualScore: score
  };
}

/**
 * Filter hotels by quality tiers
 * @param {Array} hotels - Array of hotel objects
 * @param {Object} options - Filtering options
 * @returns {Object} Filtered hotels categorized by tier
 */
export function filterHotelsByQuality(hotels, options = {}) {
  const {
    minTierLevel = 3,           // Show Tier 1-3 by default (Perfect, Excellent, Good)
    maxTierLevel = 6,           // Don't show beyond this
    requireValidHotelId = true, // Only show bookable hotels
    minHotelsThreshold = 3      // Minimum hotels before relaxing criteria
  } = options;

  // Categorize all hotels by tier
  const hotelsByTier = {
    tier1: [], // Perfect (100%)
    tier2: [], // Excellent (90-99%)
    tier3: [], // Good (85-89%)
    tier4: [], // Moderate (75-84%)
    tier5: [], // Low (65-74%)
    tier6: []  // Unverified (<65%)
  };

  hotels.forEach(hotel => {
    const tier = getHotelQualityTier(hotel);
    
    // Filter by hotel_id requirement
    if (requireValidHotelId && !tier.hasValidHotelId) {
      hotelsByTier.tier6.push({ hotel, tier });
      return;
    }

    // Categorize by tier level
    const tierKey = `tier${tier.level}`;
    if (hotelsByTier[tierKey]) {
      hotelsByTier[tierKey].push({ hotel, tier });
    }
  });

  // Progressive selection strategy
  let selectedHotels = [];
  
  // Step 1: Start with Tier 1 (Perfect matches)
  selectedHotels.push(...hotelsByTier.tier1);

  // Step 2: Add Tier 2 if needed
  if (selectedHotels.length < minHotelsThreshold) {
    selectedHotels.push(...hotelsByTier.tier2);
  }

  // Step 3: Add Tier 3 if still insufficient
  if (selectedHotels.length < minHotelsThreshold && minTierLevel >= 3) {
    selectedHotels.push(...hotelsByTier.tier3);
  }

  // Step 4: Add Tier 4 only if explicitly allowed AND still insufficient
  if (selectedHotels.length < minHotelsThreshold && minTierLevel >= 4) {
    selectedHotels.push(...hotelsByTier.tier4);
  }

  // Extract just the hotel objects with tier metadata
  const filteredHotels = selectedHotels.map(item => ({
    ...item.hotel,
    qualityTier: item.tier.level,
    qualityTierName: item.tier.name,
    qualityTierColor: item.tier.color,
    qualityTierIcon: item.tier.icon,
    qualityTierDescription: item.tier.description,
    canBookDirect: item.tier.canBook && item.tier.hasValidHotelId
  }));

  return {
    filteredHotels,
    hotelsByTier,
    stats: {
      total: hotels.length,
      tier1Count: hotelsByTier.tier1.length,
      tier2Count: hotelsByTier.tier2.length,
      tier3Count: hotelsByTier.tier3.length,
      tier4Count: hotelsByTier.tier4.length,
      tier5Count: hotelsByTier.tier5.length,
      tier6Count: hotelsByTier.tier6.length,
      filtered: filteredHotels.length,
      excluded: hotels.length - filteredHotels.length
    },
    summary: {
      hasHighQuality: hotelsByTier.tier1.length + hotelsByTier.tier2.length > 0,
      onlyPerfect: hotelsByTier.tier1.length > 0 && hotelsByTier.tier2.length === 0,
      needsRelaxing: selectedHotels.length < minHotelsThreshold,
      lowestTierShown: selectedHotels.length > 0 
        ? Math.max(...selectedHotels.map(item => item.tier.level))
        : null
    }
  };
}

/**
 * Get display message based on filtering results
 * @param {Object} filterResults - Results from filterHotelsByQuality
 * @param {boolean} hotelSearchRequested - Whether user enabled hotel search
 * @returns {Object} Display message and type
 */
export function getQualityFilterMessage(filterResults, hotelSearchRequested) {
  const { stats, summary } = filterResults;

  if (stats.filtered === 0) {
    if (!hotelSearchRequested) {
      return {
        type: 'info',
        icon: '💡',
        title: 'Looking for Real Hotels?',
        message: 'These are AI-generated suggestions to give you an idea of accommodation options. For verified hotels you can book directly, create a new trip with "Include Accommodation Search" enabled.',
        action: 'Learn More'
      };
    } else {
      return {
        type: 'info',
        icon: 'ℹ️',
        title: 'Searching Wider',
        message: 'We couldn\'t find verified matches in our database for this destination. We\'ve included AI-generated options to help you plan your stay.',
        action: 'See Suggestions'
      };
    }
  }

  if (summary.onlyPerfect && stats.tier1Count >= 3) {
    return {
      type: 'success',
      icon: '✓',
      title: 'Fully Verified Hotels',
      message: `We found ${stats.tier1Count} ${stats.tier1Count === 1 ? 'hotel' : 'hotels'} that ${stats.tier1Count === 1 ? 'matches' : 'match'} our database perfectly. You can book with confidence.`,
      action: null
    };
  }

  if (summary.hasHighQuality) {
    const verifiedCount = stats.tier1Count;
    const trustedCount = stats.tier2Count;
    
    return {
      type: 'success',
      icon: '✓',
      title: 'Quality Hotels Found',
      message: `We found ${stats.filtered} verified ${stats.filtered === 1 ? 'hotel' : 'hotels'} for you${verifiedCount > 0 ? ` (${verifiedCount} fully verified${trustedCount > 0 ? `, ${trustedCount} trusted` : ''})` : ''}.`,
      action: null
    };
  }

  if (summary.needsRelaxing) {
    return {
      type: 'info',
      icon: 'ℹ️',
      title: 'Limited Options',
      message: `We found ${stats.filtered} ${stats.filtered === 1 ? 'hotel' : 'hotels'} in our database for this destination. Consider broadening your search on booking sites for more options.`,
      action: null
    };
  }

  return {
    type: 'success',
    icon: '✓',
    title: 'Hotels Ready',
    message: `${stats.filtered} verified ${stats.filtered === 1 ? 'hotel' : 'hotels'} available for booking.`,
    action: null
  };
}

/**
 * Log quality filtering stats for debugging
 * @param {Object} filterResults - Results from filterHotelsByQuality
 */
export function logQualityFilterStats(filterResults) {
  const { stats, summary } = filterResults;
  
  console.log('\n🎯 === HOTEL QUALITY FILTER STATS ===');
  console.table({
    'Total Hotels': stats.total,
    'Tier 1 (100%)': stats.tier1Count,
    'Tier 2 (90-99%)': stats.tier2Count,
    'Tier 3 (85-89%)': stats.tier3Count,
    'Tier 4 (75-84%)': stats.tier4Count,
    'Tier 5 (65-74%)': stats.tier5Count,
    'Tier 6 (<65%)': stats.tier6Count,
    'Shown': stats.filtered,
    'Hidden': stats.excluded
  });

  console.log('\n📊 Summary:');
  console.log(`   High Quality Available: ${summary.hasHighQuality ? 'Yes' : 'No'}`);
  console.log(`   Only Perfect Matches: ${summary.onlyPerfect ? 'Yes' : 'No'}`);
  console.log(`   Lowest Tier Shown: Tier ${summary.lowestTierShown || 'N/A'}`);

  if (stats.excluded > 0) {
    console.log(`\n⚠️  ${stats.excluded} hotel(s) hidden due to low quality/confidence`);
  }
}

export default {
  QUALITY_TIERS,
  getHotelQualityTier,
  filterHotelsByQuality,
  getQualityFilterMessage,
  logQualityFilterStats
};
