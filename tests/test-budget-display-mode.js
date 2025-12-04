/**
 * Test Budget Estimator with Display Mode
 * Verifies that budget estimates match expected user-facing values
 */

import { getBudgetRecommendations, calculateEstimatedBudget } from '../src/utils/budgetEstimator.js';

// Test Case 1: 5 days, 1 traveler, Cebu (matching user's example)
console.log('TEST CASE 1: 5 days, 1 traveler (User\'s Example)');
console.log('=' . repeat(70));

const testCase1 = {
  destination: 'Cebu City, Philippines',
  departureLocation: 'Manila, Philippines',
  duration: 5,
  travelers: 1,
  includeFlights: false,
};

const results1 = getBudgetRecommendations(testCase1);

const expected = {
  'budget-friendly': { total: 5800, perDay: 1160 },
  'moderate': { total: 19700, perDay: 3940 },
  'luxury': { total: 58400, perDay: 11680 }
};

console.log('\nRESULTS:');
for (const tier of ['budget-friendly', 'moderate', 'luxury']) {
  const result = results1[tier];
  const exp = expected[tier];
  const totalMatch = result.total === exp.total;
  const perDayMatch = Math.abs(result.total / testCase1.duration - exp.perDay) < 10; // Allow ±10 rounding
  
  console.log(`\n${tier.toUpperCase()}:`);
  console.log(`  Expected: ₱${exp.total.toLocaleString()} (₱${exp.perDay.toLocaleString()}/day)`);
  console.log(`  Actual:   ${result.range} (${result.perDay}/day)`);
  console.log(`  Match: ${totalMatch && perDayMatch ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!totalMatch || !perDayMatch) {
    console.log(`  Difference: ₱${(result.total - exp.total).toLocaleString()}`);
  }
}

// Test Case 2: Verify display mode vs generation mode
console.log('\n\n' + '='.repeat(70));
console.log('TEST CASE 2: Display Mode vs Generation Mode Comparison');
console.log('='.repeat(70));

const testCase2 = {
  destination: 'Cebu City, Philippines',
  duration: 5,
  travelers: 1,
  budgetLevel: 'moderate',
};

const displayMode = calculateEstimatedBudget({ ...testCase2, calculationMode: 'display' });
const generationMode = calculateEstimatedBudget({ ...testCase2, calculationMode: 'generation' });

console.log('\nMODERATE TIER (5 days, 1 traveler):');
console.log(`  Display Mode:    ₱${displayMode.total.toLocaleString()} (for UI)`);
console.log(`  Generation Mode: ₱${generationMode.total.toLocaleString()} (for AI trip creation)`);
console.log(`  Difference:      ₱${(generationMode.total - displayMode.total).toLocaleString()}`);
console.log(`  Ratio:           ${(generationMode.total / displayMode.total).toFixed(2)}x`);

// Test Case 3: Different durations
console.log('\n\n' + '='.repeat(70));
console.log('TEST CASE 3: Different Trip Durations');
console.log('='.repeat(70));

const durations = [3, 5, 7];
for (const duration of durations) {
  const result = getBudgetRecommendations({
    destination: 'Cebu City, Philippines',
    duration,
    travelers: 1,
    includeFlights: false,
  });
  
  console.log(`\n${duration} DAYS:`);
  console.log(`  Budget-Friendly: ${result['budget-friendly'].range} (${result['budget-friendly'].perDay}/day)`);
  console.log(`  Moderate:        ${result.moderate.range} (${result.moderate.perDay}/day)`);
  console.log(`  Luxury:          ${result.luxury.range} (${result.luxury.perDay}/day)`);
}

// Test Case 4: Different group sizes
console.log('\n\n' + '='.repeat(70));
console.log('TEST CASE 4: Different Group Sizes (5 days)');
console.log('='.repeat(70));

const groupSizes = [1, 2, 4, 6, 10];
for (const travelers of groupSizes) {
  const result = getBudgetRecommendations({
    destination: 'Cebu City, Philippines',
    duration: 5,
    travelers,
    includeFlights: false,
  });
  
  const perPerson = Math.round(result.moderate.total / travelers);
  console.log(`\n${travelers} TRAVELER${travelers > 1 ? 'S' : ''}:`);
  console.log(`  Total:      ${result.moderate.range}`);
  console.log(`  Per Person: ₱${perPerson.toLocaleString()}`);
}

console.log('\n\n' + '='.repeat(70));
console.log('✅ ALL TESTS COMPLETED');
console.log('='.repeat(70));
