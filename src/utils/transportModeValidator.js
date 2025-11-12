/**
 * Transport Mode Validator
 * 
 * Validates transport mode consistency across trip data and identifies
 * potential issues or optimization opportunities for traveler convenience.
 * 
 * KEY STRATEGY FOR PHILIPPINE TRANSPORT:
 * ========================================
 * 
 * Google Maps API Limitations:
 * ❌ No jeepney routes (not in their database)
 * ❌ No tricycle routes (informal, neighborhood transport)
 * ❌ Limited provincial bus schedules
 * ❌ Incomplete walking infrastructure (sidewalks, pedestrian paths)
 * ❌ No bicycle lane data in most cities
 * 
 * Our Solution:
 * ✅ Trust AI-generated transport modes (Gemini trained on Philippine context)
 * ✅ Use TravelTimeValidator (Haversine + Philippine speed profiles)
 * ✅ Only use Google Maps for standard modes (car, some major buses)
 * ✅ Validate for consistency and traveler convenience (not Google accuracy)
 * 
 * Result: Better accuracy for Philippine travelers!
 * 
 * @module transportModeValidator
 */

/**
 * Extract transport mode from timeTravel string
 * @param {string} timeTravelString - The timeTravel field from activity
 * @returns {string|null} Extracted transport mode or null
 */
const extractTransportMode = (timeTravelString) => {
  if (!timeTravelString) return null;
  
  const lower = timeTravelString.toLowerCase();
  
  if (lower.includes('walking') || lower.includes('walk')) return 'walking';
  if (lower.includes('jeepney')) return 'jeepney';
  if (lower.includes('tricycle')) return 'tricycle';
  if (lower.includes('bus')) return 'bus';
  if (lower.includes('taxi') || lower.includes('grab')) return 'taxi';
  if (lower.includes('van')) return 'van';
  if (lower.includes('car')) return 'car';
  
  return null;
};

/**
 * Extract cost from timeTravel string
 * @param {string} timeTravelString - The timeTravel field from activity
 * @returns {number|null} Cost in PHP or null
 */
const extractCost = (timeTravelString) => {
  if (!timeTravelString) return null;
  
  const costMatch = timeTravelString.match(/₱(\d+)/);
  return costMatch ? parseInt(costMatch[1]) : null;
};

/**
 * Extract duration in minutes from timeTravel string
 * @param {string} timeTravelString - The timeTravel field from activity
 * @returns {number|null} Duration in minutes or null
 */
const extractDuration = (timeTravelString) => {
  if (!timeTravelString) return null;
  
  // Match various time formats
  const minuteMatch = timeTravelString.match(/(\d+)\s*(minute|min)/i);
  if (minuteMatch) {
    return parseInt(minuteMatch[1]);
  }
  
  const hourMatch = timeTravelString.match(/(\d+)\s*(hour|hr)/i);
  if (hourMatch) {
    return parseInt(hourMatch[1]) * 60;
  }
  
  return null;
};

/**
 * Validate transport mode consistency across trip data
 * @param {Object} tripData - Complete trip data with itinerary
 * @returns {Object} Validation report
 */
export function validateTransportModes(tripData) {
  const report = {
    totalActivities: 0,
    totalTravelSegments: 0,
    modeDistribution: {},
    inconsistencies: [],
    warnings: [],
    suggestions: [],
    summary: '',
  };

  if (!tripData?.itinerary) {
    report.summary = '⚠️ No itinerary data found';
    return report;
  }

  // Analyze each day's activities
  tripData.itinerary.forEach((day, dayIndex) => {
    if (!day.plan) return;
    
    day.plan.forEach((activity, actIndex) => {
      if (!activity.timeTravel) return;
      
      report.totalActivities++;
      report.totalTravelSegments++;
      
      const mode = extractTransportMode(activity.timeTravel);
      const cost = extractCost(activity.timeTravel);
      const duration = extractDuration(activity.timeTravel);
      
      // Track mode distribution
      if (mode) {
        report.modeDistribution[mode] = (report.modeDistribution[mode] || 0) + 1;
      }
      
      // Check for inconsistencies
      
      // 1. Free transport should be walking
      if (activity.timeTravel.toLowerCase().includes('free') && mode !== 'walking') {
        report.inconsistencies.push({
          day: dayIndex + 1,
          activityIndex: actIndex,
          activity: activity.placeName,
          issue: 'Free transport should be walking',
          current: activity.timeTravel,
          suggestion: `${duration || '5'} minutes walking distance (free)`,
        });
      }
      
      // 2. Short distances with high costs (likely wrong mode)
      if (duration && cost && duration <= 5 && cost > 50) {
        report.warnings.push({
          day: dayIndex + 1,
          activityIndex: actIndex,
          activity: activity.placeName,
          issue: 'Very short distance with high cost',
          current: activity.timeTravel,
          suggestion: `Consider walking (${duration} minutes) - saves ₱${cost}`,
        });
      }
      
      // 3. Long walking distances (> 30 min)
      if (mode === 'walking' && duration && duration > 30) {
        report.warnings.push({
          day: dayIndex + 1,
          activityIndex: actIndex,
          activity: activity.placeName,
          issue: 'Long walking distance may be tiring',
          current: activity.timeTravel,
          suggestion: `Consider jeepney or tricycle for ${duration}-minute journey`,
        });
      }
      
      // 4. Missing transport mode (has cost but no mode)
      if (cost && !mode) {
        report.inconsistencies.push({
          day: dayIndex + 1,
          activityIndex: actIndex,
          activity: activity.placeName,
          issue: 'Transport cost without mode specified',
          current: activity.timeTravel,
          suggestion: 'Specify transport mode (taxi, jeepney, etc.)',
        });
      }
      
      // 5. Very expensive for short duration (likely taxi when jeepney would work)
      if (mode === 'taxi' && duration && duration <= 15 && cost && cost > 100) {
        report.suggestions.push({
          day: dayIndex + 1,
          activityIndex: actIndex,
          activity: activity.placeName,
          tip: 'Cost optimization opportunity',
          current: activity.timeTravel,
          suggestion: `Jeepney might be cheaper (₱15-30) for this ${duration}-minute trip`,
          savings: `Save ~₱${cost - 25}`,
        });
      }
    });
  });

  // Generate summary
  report.summary = generateValidationSummary(report);
  
  return report;
}

/**
 * Generate human-readable validation summary
 * @param {Object} report - Validation report
 * @returns {string} Summary text
 */
function generateValidationSummary(report) {
  const { totalTravelSegments, inconsistencies, warnings, suggestions, modeDistribution } = report;
  
  if (totalTravelSegments === 0) {
    return '⚠️ No travel segments found in trip data';
  }
  
  const lines = [];
  
  // Header
  lines.push(`📊 Transport Mode Validation Report`);
  lines.push(`   • ${totalTravelSegments} travel segments analyzed`);
  lines.push('');
  
  // Mode distribution
  if (Object.keys(modeDistribution).length > 0) {
    lines.push('🚗 Transport Modes:');
    Object.entries(modeDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([mode, count]) => {
        const emoji = getModeEmoji(mode);
        lines.push(`   ${emoji} ${mode}: ${count} times`);
      });
    lines.push('');
  }
  
  // Issues
  if (inconsistencies.length > 0) {
    lines.push(`❌ ${inconsistencies.length} inconsistencies found:`);
    inconsistencies.slice(0, 3).forEach(issue => {
      lines.push(`   Day ${issue.day}: ${issue.issue}`);
    });
    if (inconsistencies.length > 3) {
      lines.push(`   ... and ${inconsistencies.length - 3} more`);
    }
    lines.push('');
  }
  
  // Warnings
  if (warnings.length > 0) {
    lines.push(`⚠️ ${warnings.length} warnings:`);
    warnings.slice(0, 3).forEach(warning => {
      lines.push(`   Day ${warning.day}: ${warning.issue}`);
    });
    if (warnings.length > 3) {
      lines.push(`   ... and ${warnings.length - 3} more`);
    }
    lines.push('');
  }
  
  // Optimization suggestions
  if (suggestions.length > 0) {
    lines.push(`💡 ${suggestions.length} optimization suggestions:`);
    const totalSavings = suggestions.reduce((sum, s) => {
      const match = s.savings?.match(/₱(\d+)/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
    lines.push(`   Potential savings: ₱${totalSavings}`);
    lines.push('');
  }
  
  // Overall assessment
  if (inconsistencies.length === 0 && warnings.length === 0) {
    lines.push('✅ All transport modes are consistent and appropriate!');
  } else {
    lines.push('📝 Review the issues above to optimize your trip');
  }
  
  return lines.join('\n');
}

/**
 * Get emoji for transport mode
 * @param {string} mode - Transport mode
 * @returns {string} Emoji
 */
function getModeEmoji(mode) {
  const emojis = {
    'taxi': '🚕',
    'jeepney': '🚌',
    'bus': '🚌',
    'car': '🚗',
    'van': '🚐',
    'tricycle': '🛺',
    'walking': '🚶',
    'walk': '🚶',
  };
  return emojis[mode] || '🚗';
}

/**
 * Quick validation check - returns true if there are critical issues
 * @param {Object} tripData - Complete trip data
 * @returns {boolean} True if there are critical inconsistencies
 */
export function hasTransportModeIssues(tripData) {
  const report = validateTransportModes(tripData);
  return report.inconsistencies.length > 0 || report.warnings.length > 3;
}

/**
 * Get transport mode statistics for analytics
 * @param {Object} tripData - Complete trip data
 * @returns {Object} Statistics
 */
export function getTransportModeStats(tripData) {
  const report = validateTransportModes(tripData);
  
  return {
    totalSegments: report.totalTravelSegments,
    modes: report.modeDistribution,
    issueCount: report.inconsistencies.length + report.warnings.length,
    hasIssues: report.inconsistencies.length > 0,
  };
}

export default {
  validateTransportModes,
  hasTransportModeIssues,
  getTransportModeStats,
};
