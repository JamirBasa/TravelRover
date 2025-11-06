/**
 * Smart Budget Tier Recommendation System
 * Recommends appropriate budget tier based on trip parameters
 */

/**
 * Get recommended budget tier based on trip parameters
 * @param {Object} params - Trip parameters
 * @returns {string} - Recommended tier: 'Budget-Friendly', 'Moderate', or 'Luxury'
 */
export const getRecommendedBudgetTier = (params) => {
  const {
    duration = 3,
    travelers = 1,
    includeFlights = false,
    includeHotels = false,
    destination = '',
    activityPreference = 2
  } = params;

  let score = 0;
  let reasons = [];

  // Factor 1: Trip Duration
  if (duration <= 3) {
    score += 0; // Short trips can be budget
    reasons.push('Short trip allows budget flexibility');
  } else if (duration <= 7) {
    score += 1; // Medium trips need moderate budget
    reasons.push('Week-long trip requires moderate budget');
  } else {
    score += 2; // Long trips need more budget
    reasons.push('Extended trip benefits from comfortable budget');
  }

  // Factor 2: Services Included
  if (includeFlights && includeHotels) {
    score += 2; // Both services need higher budget
    reasons.push('Flights + hotels increase cost significantly');
  } else if (includeFlights || includeHotels) {
    score += 1; // One service needs moderate budget
    reasons.push(includeFlights ? 'Flight costs require moderate budget' : 'Hotel costs require moderate budget');
  } else {
    reasons.push('No transport/accommodation costs - budget flexible');
  }

  // Factor 3: Traveler Count
  const travelerCount = typeof travelers === 'number' ? travelers : 1;
  if (travelerCount > 4) {
    score += 1; // Large groups need more budget
    reasons.push('Group size requires larger budget');
  }

  // Factor 4: Activity Intensity
  if (activityPreference >= 3) {
    score += 1; // High activity needs more budget
    reasons.push('Active pace means more activity costs');
  }

  // Factor 5: Destination Premium (if implemented)
  const premiumDestinations = ['Boracay', 'Palawan', 'Siargao', 'El Nido', 'Coron'];
  if (premiumDestinations.some(dest => destination.includes(dest))) {
    score += 1;
    reasons.push('Premium destination has higher costs');
  }

  // Determine recommendation based on score
  let recommendation;
  if (score <= 2) {
    recommendation = 'Budget-Friendly';
  } else if (score <= 4) {
    recommendation = 'Moderate';
  } else {
    recommendation = 'Luxury';
  }

  return {
    tier: recommendation,
    score,
    reasons,
    confidence: calculateConfidence(score)
  };
};

/**
 * Calculate confidence level of recommendation
 */
const calculateConfidence = (score) => {
  if (score <= 1 || score >= 5) return 'high';
  if (score === 2 || score === 4) return 'medium';
  return 'low'; // score === 3 (borderline)
};

/**
 * Get minimum recommended budget amount
 */
export const getMinimumBudget = (params) => {
  const {
    duration = 3,
    travelers = 1,
    includeFlights = false,
    includeHotels = false
  } = params;

  const travelerCount = typeof travelers === 'number' ? travelers : 1;
  
  // Base daily cost per person
  let dailyCostPerPerson = 1500; // Base budget-friendly rate
  
  // Adjust for services
  if (includeHotels) {
    dailyCostPerPerson += 1500; // Add hotel cost
  }
  
  // Flight costs (one-time)
  const flightCost = includeFlights ? 3000 * travelerCount : 0;
  
  // Calculate total
  const dailyTotal = dailyCostPerPerson * duration * travelerCount;
  const total = dailyTotal + flightCost;
  
  return Math.ceil(total / 1000) * 1000; // Round up to nearest 1000
};

/**
 * Validate if user's budget is adequate
 */
export const validateBudgetAdequacy = (userBudget, params) => {
  const minimum = getMinimumBudget(params);
  const recommended = getRecommendedBudgetTier(params);
  
  const tierBudgets = {
    'Budget-Friendly': minimum,
    'Moderate': minimum * 1.5,
    'Luxury': minimum * 2.5
  };
  
  const recommendedAmount = tierBudgets[recommended.tier];
  
  return {
    isAboveMinimum: userBudget >= minimum,
    meetsRecommended: userBudget >= recommendedAmount,
    minimum,
    recommendedAmount,
    difference: userBudget - recommendedAmount,
    status: getBudgetStatus(userBudget, minimum, recommendedAmount)
  };
};

/**
 * Get budget adequacy status
 */
const getBudgetStatus = (userBudget, minimum, recommended) => {
  if (userBudget < minimum) return 'too-low';
  if (userBudget < recommended * 0.8) return 'tight';
  if (userBudget < recommended * 1.2) return 'adequate';
  return 'comfortable';
};

/**
 * Get user-friendly budget message
 */
export const getBudgetMessage = (validation) => {
  const messages = {
    'too-low': {
      type: 'error',
      title: 'Budget Too Low',
      message: `Minimum budget for this trip is ₱${validation.minimum.toLocaleString()}. Please increase your budget or adjust trip parameters.`
    },
    'tight': {
      type: 'warning',
      title: 'Tight Budget',
      message: `Your budget is workable but tight. Consider ₱${validation.recommendedAmount.toLocaleString()} for a more comfortable trip.`
    },
    'adequate': {
      type: 'success',
      title: 'Good Budget',
      message: 'Your budget is appropriate for this trip. You should have a comfortable experience.'
    },
    'comfortable': {
      type: 'success',
      title: 'Comfortable Budget',
      message: 'Your budget allows for flexibility and upgrades. You can enjoy premium options!'
    }
  };
  
  return messages[validation.status] || messages.adequate;
};
