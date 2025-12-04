/**
 * Travel Time Parser Utility
 * Parses and formats travel time strings for activity-to-activity transitions
 * 
 * Supported formats:
 * - "15 minutes by taxi from hotel"
 * - "5 minutes walking distance (free)"
 * - "30 minutes by jeepney"
 * - "1 hour by bus (₱25)"
 * - "2-3 hours" (range format)
 */

import { TRANSPORT_COSTS } from '@/constants/budgetConstants';

/**
 * Transport mode configuration
 */
export const TRANSPORT_MODES = [
  { 
    value: 'walking', 
    label: 'Walking', 
    icon: '🚶', 
    cost: 0,
    color: 'emerald',
  },
  { 
    value: 'jeepney', 
    label: 'Jeepney', 
    icon: '🚍', 
    costRange: [13, 25],
    color: 'orange',
  },
  { 
    value: 'tricycle', 
    label: 'Tricycle', 
    icon: '🛺', 
    costRange: [20, 50],
    color: 'amber',
  },
  { 
    value: 'taxi', 
    label: 'Taxi', 
    icon: '🚕', 
    costRange: [40, 200],
    color: 'blue',
  },
  { 
    value: 'bus', 
    label: 'Bus', 
    icon: '🚌', 
    costRange: [15, 25],
    color: 'sky',
  },
  { 
    value: 'car', 
    label: 'Private Car', 
    icon: '🚗', 
    cost: 0,
    color: 'violet',
  },
  { 
    value: 'van', 
    label: 'Van/Shuttle', 
    icon: '🚐', 
    costRange: [50, 150],
    color: 'indigo',
  },
];

/**
 * Parse travel time string into structured data
 * @param {string} timeTravel - Raw timeTravel string
 * @returns {object} Parsed travel data
 */
export function parseTravelTime(timeTravel) {
  if (!timeTravel || typeof timeTravel !== 'string') {
    return getDefaultTravelData();
  }

  const result = {
    duration: null,
    unit: 'minutes',
    mode: 'walking',
    origin: null,
    cost: 0,
    raw: timeTravel,
  };

  const lowerCase = timeTravel.toLowerCase();

  // Extract duration and unit
  // Patterns: "15 minutes", "1 hour", "2-3 hours", "30 min"
  const durationMatch = lowerCase.match(/(\d+)(?:-\d+)?\s*(minute|minutes|min|hour|hours|hr|h)\b/);
  if (durationMatch) {
    result.duration = parseInt(durationMatch[1], 10);
    const unitStr = durationMatch[2];
    result.unit = unitStr.includes('hour') || unitStr.includes('hr') || unitStr === 'h' 
      ? 'hours' 
      : 'minutes';
  }

  // Extract transport mode
  // Patterns: "by taxi", "by jeepney", "walking distance"
  const modePatterns = [
    { pattern: /walking|walk/i, mode: 'walking' },
    { pattern: /jeepney/i, mode: 'jeepney' },
    { pattern: /tricycle|trike/i, mode: 'tricycle' },
    { pattern: /taxi|grab/i, mode: 'taxi' },
    { pattern: /\bbus\b/i, mode: 'bus' },
    { pattern: /\bcar\b|private/i, mode: 'car' },
    { pattern: /van|shuttle/i, mode: 'van' },
  ];

  for (const { pattern, mode } of modePatterns) {
    if (pattern.test(lowerCase)) {
      result.mode = mode;
      break;
    }
  }

  // Extract cost
  // Patterns: "(₱150)", "(P150)", "₱150", "(free)"
  const costMatch = timeTravel.match(/[₱P](\d+)/);
  if (costMatch) {
    result.cost = parseInt(costMatch[1], 10);
  } else if (lowerCase.includes('free')) {
    result.cost = 0;
    result.mode = 'walking'; // Free implies walking
  }

  // Extract origin
  // Patterns: "from hotel", "from Burnham Park"
  const originMatch = timeTravel.match(/from\s+([^()\d]+?)(?:\s*\(|$)/i);
  if (originMatch) {
    result.origin = originMatch[1].trim();
  }

  // If no duration found, try to parse time ranges like "Varies", "1 hour", etc.
  if (!result.duration) {
    if (lowerCase === 'varies' || lowerCase === 'flexible') {
      result.duration = 30; // Default to 30 minutes
    } else {
      result.duration = 15; // Fallback default
    }
  }

  return result;
}

/**
 * Format travel data back into string
 * @param {object} travelData - Structured travel data
 * @returns {string} Formatted timeTravel string
 */
export function formatTravelTime(travelData) {
  const { duration, unit, mode, origin, cost } = travelData;

  if (!duration || !mode) {
    return '15 minutes walking distance (free)';
  }

  // Build time part
  const timePart = `${duration} ${duration === 1 ? unit.slice(0, -1) : unit}`;

  // Build mode part
  const modePart = mode === 'walking' ? 'walking distance' : `by ${mode}`;

  // Build origin part
  const originPart = origin ? ` from ${origin}` : '';

  // Build cost part
  const costPart = cost === 0 || mode === 'walking' 
    ? ' (free)' 
    : ` (₱${cost})`;

  return `${timePart} ${modePart}${originPart}${costPart}`;
}

/**
 * Calculate travel cost based on mode and duration
 * @param {string} mode - Transport mode
 * @param {number} duration - Travel duration
 * @param {string} unit - Time unit (minutes/hours)
 * @returns {number} Estimated cost in PHP
 */
export function calculateTravelCost(mode, duration, unit) {
  if (!mode || !duration) return 0;
  
  // Free modes
  if (mode === 'walking' || mode === 'car') return 0;

  const durationMinutes = unit === 'hours' ? duration * 60 : duration;

  switch (mode) {
    case 'jeepney':
      // Add per-stop increments for longer rides
      if (durationMinutes <= 15) return 13;
      if (durationMinutes <= 30) return 19;
      return 25;

    case 'bus':
      // City bus pricing based on distance/stops
      if (durationMinutes <= 20) return 15;
      if (durationMinutes <= 40) return 20;
      return 25;

    case 'tricycle': {
      // Realistic distance-based tricycle pricing
      // ≤5 min: Barangay/community rate
      // 5-15 min: Typical short trip
      // 15-30 min: Medium distance + negotiation
      // >30 min: Long trip
      if (durationMinutes <= 5) return 20;
      if (durationMinutes <= 15) return 40;
      if (durationMinutes <= 30) return 70;
      return Math.min(100 + Math.floor((durationMinutes - 30) / 10) * 20, 200);
    }

    case 'taxi': {
      // Enhanced taxi calculation with traffic consideration
      // City traffic speed: 20 km/h (conservative)
      // Highway speed: 40 km/h
      const avgSpeed = durationMinutes <= 30 ? 20 : 30;
      const estimatedKm = (durationMinutes / 60) * avgSpeed;
      const base = TRANSPORT_COSTS.TAXI?.base || 40;
      const perKm = TRANSPORT_COSTS.TAXI?.perKm || 13.5;
      
      // Add traffic/waiting time buffer for longer trips
      const trafficBuffer = durationMinutes > 30 ? 50 : 0;
      return Math.round(base + (estimatedKm * perKm) + trafficBuffer);
    }

    case 'van':
      // Van/shuttle pricing tiers
      if (durationMinutes <= 20) return 50;
      if (durationMinutes <= 45) return 100;
      if (durationMinutes <= 90) return 150;
      return 200;

    default:
      return 0;
  }
}

/**
 * Calculate cost range for a transport mode
 * @param {string} mode - Transport mode
 * @param {number} duration - Travel duration
 * @param {string} unit - Time unit (minutes/hours)
 * @returns {object} { min, max, average }
 */
export function calculateCostRange(mode, duration, unit) {
  const baseCost = calculateTravelCost(mode, duration, unit);
  
  if (baseCost === 0) {
    return { min: 0, max: 0, average: 0 };
  }

  // Calculate reasonable variance based on mode
  let variance = 0;
  switch (mode) {
    case 'tricycle':
      variance = 0.3; // ±30% (high negotiation variance)
      break;
    case 'taxi':
      variance = 0.25; // ±25% (traffic/route variance)
      break;
    case 'van':
      variance = 0.2; // ±20%
      break;
    case 'jeepney':
    case 'bus':
      variance = 0.15; // ±15% (more fixed)
      break;
    default:
      variance = 0.2;
  }

  const min = Math.round(baseCost * (1 - variance));
  const max = Math.round(baseCost * (1 + variance));

  return { min, max, average: baseCost };
}

/**
 * Get default travel data structure
 * @returns {object} Default travel data
 */
export function getDefaultTravelData() {
  return {
    duration: 15,
    unit: 'minutes',
    mode: 'walking',
    origin: null,
    cost: 0,
    raw: '15 minutes walking distance (free)',
  };
}

/**
 * Validate travel data
 * @param {object} travelData - Travel data to validate
 * @returns {object} { isValid, errors }
 */
export function validateTravelData(travelData) {
  const errors = [];

  if (!travelData.duration || travelData.duration <= 0) {
    errors.push('Duration must be greater than 0');
  }

  if (travelData.duration > 480) { // 8 hours
    errors.push('Duration seems too long (max 8 hours)');
  }

  if (!travelData.mode) {
    errors.push('Transport mode is required');
  }

  const validModes = TRANSPORT_MODES.map(m => m.value);
  if (travelData.mode && !validModes.includes(travelData.mode)) {
    errors.push('Invalid transport mode');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get transport mode config by value
 * @param {string} modeValue - Transport mode value
 * @returns {object|null} Transport mode config
 */
export function getTransportModeConfig(modeValue) {
  return TRANSPORT_MODES.find(m => m.value === modeValue) || null;
}

/**
 * Validate if a manual cost entry is realistic
 * @param {string} mode - Transport mode
 * @param {number} cost - Manual cost entry
 * @param {number} duration - Travel duration
 * @param {string} unit - Time unit
 * @returns {object} { isValid, warning, suggestion }
 */
export function validateManualCost(mode, cost, duration, unit) {
  if (cost === 0 && (mode === 'walking' || mode === 'car')) {
    return { isValid: true, warning: null, suggestion: null };
  }

  const costRange = calculateCostRange(mode, duration, unit);
  const { min, max, average } = costRange;

  // Check if cost is way outside reasonable range
  const veryLowThreshold = min * 0.5;
  const veryHighThreshold = max * 2;

  if (cost < veryLowThreshold) {
    return {
      isValid: false,
      warning: `⚠️ This seems very low for ${mode}. Typical range: ₱${min}-${max}`,
      suggestion: average,
    };
  }

  if (cost > veryHighThreshold) {
    return {
      isValid: false,
      warning: `⚠️ This seems very high for ${mode}. Typical range: ₱${min}-${max}`,
      suggestion: average,
    };
  }

  // Within acceptable range
  if (cost >= min && cost <= max) {
    return { isValid: true, warning: null, suggestion: null };
  }

  // Slightly outside range but not unrealistic
  return {
    isValid: true,
    warning: `ℹ️ Typical range: ₱${min}-${max}`,
    suggestion: null,
  };
}
