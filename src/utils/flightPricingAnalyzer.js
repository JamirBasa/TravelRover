/**
 * Flight Pricing Analyzer
 * Analyzes booking timing and provides smart pricing insights
 * Helps users understand flight cost dynamics and make better decisions
 */

/**
 * Calculate days until departure
 * ✅ FIXED: Timezone-safe date parsing
 */
export const getDaysUntilDeparture = (startDate) => {
  if (!startDate) return null;
  
  // Parse date as local date without timezone conversion
  const [year, month, day] = startDate.split('-').map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const departure = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  // Validate date
  if (isNaN(departure.getTime())) {
    console.warn('Invalid date provided to getDaysUntilDeparture:', startDate);
    return null;
  }
  
  const diffTime = departure - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Get booking timing category
 */
export const getBookingTimingCategory = (daysUntilDeparture) => {
  if (daysUntilDeparture === null) return null;
  if (daysUntilDeparture < 0) return 'past';
  if (daysUntilDeparture === 0) return 'today';
  if (daysUntilDeparture === 1) return 'tomorrow';
  if (daysUntilDeparture <= 3) return 'very-last-minute';
  if (daysUntilDeparture <= 7) return 'last-minute';
  if (daysUntilDeparture <= 14) return 'short-notice';
  if (daysUntilDeparture <= 30) return 'moderate';
  if (daysUntilDeparture <= 60) return 'good';
  return 'optimal';
};

/**
 * Calculate price multiplier based on booking timing
 */
export const getTimingPriceMultiplier = (daysUntilDeparture) => {
  const category = getBookingTimingCategory(daysUntilDeparture);
  
  const multipliers = {
    'past': 0,
    'today': 4.0,
    'tomorrow': 3.2,
    'very-last-minute': 2.8,
    'last-minute': 2.2,
    'short-notice': 1.4,
    'moderate': 1.1,
    'good': 0.95,
    'optimal': 0.75,
  };
  
  return multipliers[category] || 1.0;
};

/**
 * Get Philippine airline seat availability insights
 */
export const getSeatAvailabilityInsight = (daysUntilDeparture) => {
  const category = getBookingTimingCategory(daysUntilDeparture);
  
  const insights = {
    'today': {
      availability: 'very-limited',
      message: 'Very limited seats available. Most flights may be sold out.',
      icon: '🚨'
    },
    'tomorrow': {
      availability: 'limited',
      message: 'Limited seats remaining. Popular routes may be fully booked.',
      icon: '⚠️'
    },
    'very-last-minute': {
      availability: 'limited',
      message: 'Seat selection limited. Peak hours likely sold out.',
      icon: '⚠️'
    },
    'last-minute': {
      availability: 'moderate',
      message: 'Moderate seat availability. Book soon for better selection.',
      icon: '⏰'
    },
    'short-notice': {
      availability: 'good',
      message: 'Good seat availability. Some promotional fares may still be available.',
      icon: '✓'
    },
    'moderate': {
      availability: 'excellent',
      message: 'Excellent availability with promotional fares possible.',
      icon: '✅'
    },
    'good': {
      availability: 'excellent',
      message: 'Full seat selection and promo fares available.',
      icon: '✅'
    },
    'optimal': {
      availability: 'excellent',
      message: 'Best selection with lowest promo fares.',
      icon: '🎯'
    },
  };
  
  return insights[category] || insights['moderate'];
};

/**
 * Get detailed booking timing analysis
 */
export const analyzeBookingTiming = (startDate, endDate, includeFlights) => {
  if (!startDate || !includeFlights) return null;
  
  const daysUntil = getDaysUntilDeparture(startDate);
  if (daysUntil === null) return null;
  
  const category = getBookingTimingCategory(daysUntil);
  const priceMultiplier = getTimingPriceMultiplier(daysUntil);
  const seatAvailability = getSeatAvailabilityInsight(daysUntil);
  
  return {
    daysUntilDeparture: daysUntil,
    category,
    priceMultiplier,
    seatAvailability,
    isLastMinute: ['today', 'tomorrow', 'very-last-minute', 'last-minute'].includes(category),
    isExpensive: priceMultiplier >= 1.5,
    isPast: category === 'past',
  };
};

/**
 * Calculate estimated flight cost with timing multiplier
 */
export const calculateTimingAdjustedFlightCost = (baseCost, daysUntilDeparture) => {
  const multiplier = getTimingPriceMultiplier(daysUntilDeparture);
  return Math.round(baseCost * multiplier);
};

/**
 * Get flexible date suggestions (cheaper alternatives)
 * ✅ FIXED: Timezone-safe date calculations
 */
export const getFlexibleDateSuggestions = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  
  const suggestions = [];
  
  // Parse dates as local dates
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  
  const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  // Helper to format date properly
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 1 week later
  const oneWeekLater = new Date(start);
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);
  const oneWeekEnd = new Date(oneWeekLater);
  oneWeekEnd.setDate(oneWeekEnd.getDate() + duration - 1);
  
  suggestions.push({
    label: "+1 Week Later",
    startDate: formatDateLocal(oneWeekLater),
    endDate: formatDateLocal(oneWeekEnd),
    savingsPercent: 20,
    reason: "More time to find deals"
  });
  
  // 2 weeks later
  const twoWeeksLater = new Date(start);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  const twoWeeksEnd = new Date(twoWeeksLater);
  twoWeeksEnd.setDate(twoWeeksEnd.getDate() + duration - 1);
  
  suggestions.push({
    label: "+2 Weeks Later",
    startDate: formatDateLocal(twoWeeksLater),
    endDate: formatDateLocal(twoWeeksEnd),
    savingsPercent: 35,
    reason: "Optimal booking window"
  });
  
  // Weekday alternative
  const startDayOfWeek = start.getDay();
  if (startDayOfWeek === 0 || startDayOfWeek === 6) { // Weekend
    const weekdayStart = new Date(start);
    const daysToAdd = startDayOfWeek === 0 ? 2 : 3; // Sunday->Tuesday, Saturday->Tuesday
    weekdayStart.setDate(weekdayStart.getDate() + daysToAdd);
    const weekdayEnd = new Date(weekdayStart);
    weekdayEnd.setDate(weekdayEnd.getDate() + duration - 1);
    
    suggestions.push({
      label: "Weekday Travel",
      startDate: formatDateLocal(weekdayStart),
      endDate: formatDateLocal(weekdayEnd),
      savingsPercent: 15,
      reason: "Weekday flights are cheaper"
    });
  }
  
  return suggestions;
};

/**
 * Get comprehensive booking advice
 */
export const getBookingAdvice = (startDate, endDate, includeFlights, departureCity, destination) => {
  if (!startDate || !includeFlights) return null;
  
  const analysis = analyzeBookingTiming(startDate, endDate, includeFlights);
  if (!analysis) return null;
  
  const { daysUntilDeparture, category, priceMultiplier, seatAvailability, isLastMinute } = analysis;
  
  const advice = {
    timing: {
      daysUntil: daysUntilDeparture,
      category,
      description: getCategoryDescription(category),
    },
    pricing: {
      multiplier: priceMultiplier,
      impact: getPriceImpactDescription(priceMultiplier),
      estimatedIncrease: Math.round((priceMultiplier - 1) * 100),
    },
    availability: seatAvailability,
    recommendations: getRecommendations(category, departureCity, destination),
    flexibleDates: isLastMinute ? getFlexibleDateSuggestions(startDate, endDate) : [],
    warnings: getWarnings(category, priceMultiplier),
    tips: getTimingTips(category),
  };
  
  return advice;
};

const getCategoryDescription = (category) => {
  const descriptions = {
    'today': 'Departing Today',
    'tomorrow': 'Departing Tomorrow',
    'very-last-minute': '2-3 Days Away',
    'last-minute': '4-7 Days Away',
    'short-notice': '1-2 Weeks Away',
    'moderate': '2-4 Weeks Away',
    'good': '1-2 Months Away',
    'optimal': '2+ Months Away',
  };
  return descriptions[category] || 'Unknown';
};

const getPriceImpactDescription = (multiplier) => {
  if (multiplier >= 3.5) return 'Extremely High Prices';
  if (multiplier >= 2.5) return 'Very High Prices';
  if (multiplier >= 2.0) return 'High Prices';
  if (multiplier >= 1.5) return 'Elevated Prices';
  if (multiplier >= 1.2) return 'Slightly Higher';
  if (multiplier >= 1.0) return 'Normal Prices';
  if (multiplier >= 0.9) return 'Good Prices';
  return 'Best Prices';
};

const getRecommendations = (category, departureCity, destination) => {
  const baseRecommendations = {
    'today': [
      'Check airline counters for last-minute availability',
      'Consider alternative airports (Clark, Subic for Manila area)',
      'Be flexible with departure times',
      'Prepare for premium pricing',
    ],
    'tomorrow': [
      'Book immediately - prices won\'t drop',
      'Check multiple airlines (PAL, Cebu Pacific, AirAsia)',
      'Consider early morning or late night flights (slightly cheaper)',
      'Pack light to avoid extra baggage fees',
    ],
    'very-last-minute': [
      'Book within 24 hours to avoid further increases',
      'Compare all airlines\' direct flights',
      'Consider flying midweek vs weekend',
      'Join airline loyalty programs for better rates',
    ],
    'last-minute': [
      'Book this week to secure reasonable rates',
      'Set price alerts on booking sites',
      'Check for flash sales (Cebu Pacific, AirAsia)',
      'Consider connecting flights if direct is expensive',
    ],
    'short-notice': [
      'Good time to book - rates still reasonable',
      'Watch for airline promo codes',
      'Book round-trip for better deals',
      'Subscribe to airline newsletters for deals',
    ],
    'moderate': [
      'Excellent booking window - shop around',
      'Compare prices across platforms',
      'Look for seat sales (often 2-3 weeks before)',
      'Consider package deals with hotels',
    ],
    'good': [
      'Great timing! You have flexibility',
      'Wait for monthly seat sales (mid-month)',
      'Book when you find a good price',
      'Consider travel insurance',
    ],
    'optimal': [
      'Perfect timing for best prices!',
      'Wait for Cebu Pacific Piso Fares or AirAsia promos',
      'You have time to find the best deals',
      'Consider booking hotels separately for flexibility',
    ],
  };
  
  return baseRecommendations[category] || [];
};

const getWarnings = (category, multiplier) => {
  const warnings = [];
  
  if (category === 'today' || category === 'tomorrow') {
    warnings.push({
      level: 'critical',
      message: `Flight prices are ${Math.round((multiplier - 1) * 100)}% higher than normal. Consider postponing if possible.`,
    });
    warnings.push({
      level: 'critical',
      message: 'Limited or no seat availability on popular routes.',
    });
  }
  
  if (category === 'very-last-minute' || category === 'last-minute') {
    warnings.push({
      level: 'warning',
      message: `Expect ${Math.round((multiplier - 1) * 100)}% higher flight costs compared to advance booking.`,
    });
    warnings.push({
      level: 'warning',
      message: 'Seat selection may be limited, especially for peak hours.',
    });
  }
  
  if (category === 'short-notice') {
    warnings.push({
      level: 'info',
      message: 'Booking now gives you good rates, but waiting may risk price increases.',
    });
  }
  
  return warnings;
};

const getTimingTips = (category) => {
  const tips = {
    'today': [
      '💡 Walk-in at airline counters sometimes has better availability than online',
      '💡 Check if ferries/buses are viable alternatives',
      '💡 Some airlines release last-minute seats at airport',
    ],
    'tomorrow': [
      '💡 Red-eye flights (late night/early morning) are usually cheaper',
      '💡 Consider starting your trip from a nearby airport',
      '💡 Travel insurance is recommended for tight schedules',
    ],
    'very-last-minute': [
      '💡 Tuesday and Wednesday flights are typically 15-20% cheaper',
      '💡 Check if your credit card offers flight insurance',
      '💡 Pack carry-on only to save time and fees',
    ],
    'last-minute': [
      '💡 Airlines often have flash sales 5-7 days before departure',
      '💡 Booking at midnight sometimes shows better rates',
      '💡 Consider alternative dates within same week',
    ],
    'short-notice': [
      '💡 This is still a good booking window for domestic flights',
      '💡 Price comparison sites update rates multiple times daily',
      '💡 Bundle hotel + flight for potential savings',
    ],
    'moderate': [
      '💡 Watch for "Piso Sales" and promotional campaigns',
      '💡 Booking 3-4 weeks ahead gives you flexibility',
      '💡 Consider travel insurance for peace of mind',
    ],
    'good': [
      '💡 Monthly seat sales happen mid-month - perfect timing!',
      '💡 Sign up for Cebu Pacific, PAL, AirAsia newsletters',
      '💡 Book when you find a price 30% below average',
    ],
    'optimal': [
      '💡 Monthly seat sales from all major airlines at this range',
      '💡 Booking 60+ days ahead gives you maximum savings',
      '💡 Cebu Pacific "Piso Fares" are common at 2+ months',
    ],
  };
  
  return tips[category] || [];
};

/**
 * Format date for display
 * ✅ FIXED: Timezone-safe date formatting
 */
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default {
  getDaysUntilDeparture,
  getBookingTimingCategory,
  getTimingPriceMultiplier,
  analyzeBookingTiming,
  calculateTimingAdjustedFlightCost,
  getFlexibleDateSuggestions,
  getBookingAdvice,
  formatDateDisplay,
};
