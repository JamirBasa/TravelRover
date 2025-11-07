/**
 * Itinerary Travel Time Corrector
 * Post-processes AI-generated itineraries to correct inaccurate travel times
 * Uses coordinate-based validation and Philippines-specific travel patterns
 */

import { travelTimeValidator } from '../services/TravelTimeValidator.js';
import { isLogisticsItem } from './activityClassifier.js';

/**
 * Correct travel times in an itinerary based on actual coordinates
 * @param {Object} tripData - Full trip data from AI
 * @param {Object} options - Correction options
 * @returns {Object} - Corrected trip data + validation report
 */
export const correctItineraryTravelTimes = (tripData, options = {}) => {
  const {
    autoCorrect = true, // Automatically apply corrections
    threshold = 30, // Percentage difference threshold to trigger correction
    verbose = false, // Log detailed corrections
  } = options;

  if (!tripData?.itinerary || !Array.isArray(tripData.itinerary)) {
    console.warn('⚠️ No valid itinerary found for travel time correction');
    return { tripData, report: null };
  }

  console.log('🔍 Validating travel times in itinerary...');

  const report = {
    totalChecks: 0,
    corrected: 0,
    accurate: 0,
    skipped: 0,
    corrections: [],
    warnings: [],
  };

  const correctedItinerary = tripData.itinerary.map((day, dayIndex) => {
    const activities = day.plan || [];
    const correctedActivities = [];

    for (let i = 0; i < activities.length; i++) {
      const activity = { ...activities[i] };
      correctedActivities.push(activity);

      // Only check travel time for non-first activities
      if (i === 0) continue;

      const from = activities[i - 1];
      const to = activity;

      // Skip logistics items (should have 0 or minimal travel time)
      if (isLogisticsItem(to)) {
        if (verbose) {
          console.log(`⏭️  Skipping logistics item: ${to.placeName}`);
        }
        report.skipped++;
        continue;
      }

      // Skip if no travel time specified
      if (!to.timeTravel || to.timeTravel === 'N/A') {
        report.skipped++;
        continue;
      }

      report.totalChecks++;

      // Extract transport mode from existing timeTravel
      const transportMode = extractTransportMode(to.timeTravel);

      // Calculate actual travel time
      const calculatedTime = travelTimeValidator.calculateTravelTime(
        from,
        to,
        transportMode
      );

      if (!calculatedTime) {
        report.warnings.push({
          day: dayIndex + 1,
          activity: to.placeName,
          issue: 'Missing coordinates for validation',
        });
        report.skipped++;
        continue;
      }

      // Validate against AI time
      const validation = travelTimeValidator.validateTravelTime(
        to.timeTravel,
        calculatedTime
      );

      if (verbose) {
        console.log(`📊 Day ${dayIndex + 1}: ${from.placeName} → ${to.placeName}`);
        console.log(`   AI: ${to.timeTravel}`);
        console.log(`   Calculated: ${calculatedTime.minutes} min`);
        console.log(`   Status: ${validation.isAccurate ? '✅ Accurate' : '⚠️ Needs correction'}`);
      }

      if (validation.isAccurate === false) {
        const percentDiff = parseFloat(validation.percentDiff);

        // Apply correction if above threshold
        if (autoCorrect && percentDiff > threshold) {
          const cost = travelTimeValidator.estimateCost(calculatedTime);
          const costText = cost > 0 ? ` (₱${cost})` : ' (free)';

          activity.timeTravel = `${calculatedTime.minutes} minutes by ${transportMode}${costText}`;

          report.corrected++;
          report.corrections.push({
            day: dayIndex + 1,
            from: from.placeName,
            to: to.placeName,
            original: to.timeTravel,
            corrected: activity.timeTravel,
            difference: `${validation.difference} min (${validation.percentDiff}% error)`,
            reason: percentDiff > 50 ? 'Major discrepancy' : 'Moderate adjustment',
          });

          if (verbose) {
            console.log(`   ✏️ CORRECTED: ${activity.timeTravel}`);
          }
        } else {
          report.accurate++; // Within acceptable threshold
        }
      } else {
        report.accurate++;
      }
    }

    return {
      ...day,
      plan: correctedActivities,
    };
  });

  // Generate summary
  report.summary = generateCorrectionSummary(report);

  console.log(`✅ Travel time validation complete: ${report.corrected} corrections applied`);
  if (report.corrections.length > 0 && verbose) {
    console.table(report.corrections);
  }

  return {
    tripData: {
      ...tripData,
      itinerary: correctedItinerary,
    },
    report,
    wasModified: report.corrected > 0,
  };
};

/**
 * Extract transport mode from timeTravel string
 */
const extractTransportMode = (timeTravelString) => {
  const lowerStr = timeTravelString.toLowerCase();

  if (lowerStr.includes('walk')) return 'walking';
  if (lowerStr.includes('jeepney')) return 'jeepney';
  if (lowerStr.includes('taxi') || lowerStr.includes('grab')) return 'taxi';
  if (lowerStr.includes('tricycle')) return 'tricycle';
  if (lowerStr.includes('bus')) return 'bus';
  if (lowerStr.includes('car')) return 'car';

  return 'taxi'; // Default
};

/**
 * Generate human-readable correction summary
 */
const generateCorrectionSummary = (report) => {
  const { totalChecks, corrected, accurate, skipped } = report;

  if (totalChecks === 0) {
    return '⚠️ No travel times found to validate';
  }

  const accuracyRate = ((accurate / totalChecks) * 100).toFixed(1);
  const correctionRate = ((corrected / totalChecks) * 100).toFixed(1);

  let summary = `📊 Validation Results:\n`;
  summary += `   • ${totalChecks} travel times checked\n`;
  summary += `   • ${accurate} accurate (${accuracyRate}%)\n`;
  summary += `   • ${corrected} corrected (${correctionRate}%)\n`;
  
  if (skipped > 0) {
    summary += `   • ${skipped} skipped (missing data)\n`;
  }

  if (corrected > 0) {
    summary += `\n✏️ Applied ${corrected} corrections for better accuracy`;
  } else {
    summary += `\n✅ All travel times are accurate!`;
  }

  return summary;
};

/**
 * Validate itinerary without making corrections (read-only)
 */
export const validateItineraryTravelTimes = (tripData) => {
  const result = correctItineraryTravelTimes(tripData, {
    autoCorrect: false,
    verbose: false,
  });

  return result.report;
};

/**
 * Get detailed validation report for admin/debugging
 */
export const getDetailedTravelTimeReport = (tripData) => {
  const result = correctItineraryTravelTimes(tripData, {
    autoCorrect: false,
    verbose: true,
  });

  return {
    report: result.report,
    recommendations: generateRecommendations(result.report),
  };
};

/**
 * Generate recommendations based on validation results
 */
const generateRecommendations = (report) => {
  const recommendations = [];

  if (report.corrected > report.totalChecks * 0.5) {
    recommendations.push({
      priority: 'high',
      message: 'More than 50% of travel times need correction. Consider improving AI prompt with specific distance guidelines.',
    });
  }

  if (report.warnings.length > 0) {
    recommendations.push({
      priority: 'medium',
      message: `${report.warnings.length} activities missing coordinates. Ensure all locations have valid geoCoordinates.`,
    });
  }

  report.corrections.forEach((correction) => {
    const percentDiff = parseFloat(correction.difference.match(/\d+\.?\d*/)[0]);
    if (percentDiff > 100) {
      recommendations.push({
        priority: 'high',
        day: correction.day,
        message: `Day ${correction.day}: ${correction.from} → ${correction.to} has major time discrepancy (${percentDiff}% off). Verify coordinates are correct.`,
      });
    }
  });

  return recommendations;
};

export default correctItineraryTravelTimes;
