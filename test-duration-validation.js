/**
 * 🧪 Trip Duration Validation Test Suite
 * Tests 1-15 day limits with validation logic
 */

// Mock the tripDurationLimits module
const TRIP_DURATION = {
  MIN_DAYS: 1,
  MAX_DAYS: 30,
  CATEGORIES: {
    DAY_TRIP: { min: 1, max: 1, label: "Day Trip", emoji: "☀️", shortLabel: "Day" },
    WEEKEND: { min: 2, max: 3, label: "Weekend Getaway", emoji: "🎒", shortLabel: "Weekend" },
    SHORT: { min: 4, max: 7, label: "Short Trip", emoji: "✈️", shortLabel: "Short" },
    STANDARD: { min: 8, max: 14, label: "Standard Trip", emoji: "�", shortLabel: "Standard" },
    EXTENDED: { min: 15, max: 21, label: "Extended Trip", emoji: "🌍", shortLabel: "Extended" },
    LONG: { min: 22, max: 30, label: "Long Vacation", emoji: "�️", shortLabel: "Long" }
  },
  TIMEOUT_BASE: { 
    1: 60, 2: 80, 3: 100, 4: 110, 5: 120, 6: 130, 7: 140, 8: 160, 9: 180, 10: 200,
    11: 220, 12: 240, 13: 260, 14: 280, 15: 300, 16: 320, 17: 340, 18: 360, 19: 380, 20: 400,
    21: 420, 22: 440, 23: 460, 24: 480, 25: 500, 26: 520, 27: 540, 28: 560, 29: 580, 30: 600
  }
};

function validateDuration(days) {
  const numDays = parseInt(days);
  
  if (isNaN(numDays) || numDays < 1) {
    return {
      valid: false,
      error: "Trip duration must be at least 1 day.",
      suggestion: "Please select valid travel dates."
    };
  }
  
  if (numDays > TRIP_DURATION.MAX_DAYS) {
    return {
      valid: false,
      error: `Trip duration cannot exceed ${TRIP_DURATION.MAX_DAYS} days.`,
      suggestion: `For longer trips, consider breaking it into multiple ${TRIP_DURATION.MAX_DAYS}-day segments.`
    };
  }
  
  return { valid: true };
}

function getDurationCategory(days) {
  const numDays = parseInt(days);
  for (const [key, cat] of Object.entries(TRIP_DURATION.CATEGORIES)) {
    if (numDays >= cat.min && numDays <= cat.max) {
      return { key, ...cat };
    }
  }
  return null;
}

function getTimeoutForDuration(days) {
  const numDays = parseInt(days);
  return TRIP_DURATION.TIMEOUT_BASE[numDays] || 300;
}

function calculateMinBudget(days, travelers) {
  const MIN_PER_DAY_PER_PERSON = 1000;
  return MIN_PER_DAY_PER_PERSON * days * travelers;
}

// Test Cases
console.log("🧪 TRIP DURATION VALIDATION TEST SUITE");
console.log("=" .repeat(60));

const testCases = [
  // Edge cases
  { days: 0, travelers: 1, budget: 5000, expected: "INVALID", reason: "0 days" },
  { days: -1, travelers: 1, budget: 5000, expected: "INVALID", reason: "Negative days" },
  
  // Valid cases - all categories
  { days: 1, travelers: 1, budget: 1000, expected: "VALID", reason: "Day Trip (1 day)" },
  { days: 2, travelers: 2, budget: 4000, expected: "VALID", reason: "Weekend (2 days)" },
  { days: 3, travelers: 1, budget: 3000, expected: "VALID", reason: "Weekend (3 days)" },
  { days: 4, travelers: 1, budget: 4000, expected: "VALID", reason: "Short Trip (4 days)" },
  { days: 5, travelers: 2, budget: 10000, expected: "VALID", reason: "Short Trip (5 days)" },
  { days: 6, travelers: 1, budget: 6000, expected: "VALID", reason: "Standard (6 days)" },
  { days: 7, travelers: 2, budget: 14000, expected: "VALID", reason: "Standard (7 days)" },
  { days: 8, travelers: 1, budget: 8000, expected: "VALID", reason: "Extended (8 days)" },
  { days: 10, travelers: 2, budget: 20000, expected: "VALID", reason: "Extended (10 days)" },
  { days: 15, travelers: 1, budget: 15000, expected: "VALID", reason: "Extended (15 days)" },
  { days: 20, travelers: 2, budget: 40000, expected: "VALID", reason: "Extended (20 days)" },
  { days: 25, travelers: 1, budget: 25000, expected: "VALID", reason: "Long Vacation (25 days)" },
  { days: 30, travelers: 2, budget: 60000, expected: "VALID", reason: "Long Vacation (30 days max)" },
  
  // Budget validation
  { days: 7, travelers: 2, budget: 100, expected: "BUDGET_TOO_LOW", reason: "₱100 for 7 days/2 travelers" },
  { days: 1, travelers: 1, budget: 500, expected: "BUDGET_TOO_LOW", reason: "₱500 for 1 day/1 traveler" },
  { days: 5, travelers: 3, budget: 10000, expected: "BUDGET_TOO_LOW", reason: "₱10k for 5 days/3 travelers (need ₱15k)" },
  
  // Over limit
  { days: 31, travelers: 1, budget: 50000, expected: "INVALID", reason: "31 days (over max)" },
  { days: 40, travelers: 2, budget: 100000, expected: "INVALID", reason: "40 days (over max)" },
  { days: 60, travelers: 1, budget: 150000, expected: "INVALID", reason: "60 days (over max)" },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const durationValidation = validateDuration(test.days);
  const minBudget = calculateMinBudget(test.days, test.travelers);
  const category = getDurationCategory(test.days);
  const timeout = getTimeoutForDuration(test.days);
  
  let result = "UNKNOWN";
  let details = "";
  
  if (!durationValidation.valid) {
    result = "INVALID";
    details = durationValidation.error;
  } else if (test.budget < minBudget) {
    result = "BUDGET_TOO_LOW";
    details = `Budget ₱${test.budget.toLocaleString()} < Required ₱${minBudget.toLocaleString()}`;
  } else {
    result = "VALID";
    details = `${category.emoji} ${category.label} | Timeout: ${timeout}s`;
  }
  
  const testPassed = result === test.expected;
  
  if (testPassed) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.reason}`);
    console.log(`   Result: ${result} - ${details}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.reason}`);
    console.log(`   Expected: ${test.expected}, Got: ${result}`);
    console.log(`   Details: ${details}`);
  }
  console.log("");
});

console.log("=" .repeat(60));
console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

// Timeout Table
console.log("\n⏱️  TIMEOUT CONFIGURATION TABLE");
console.log("=" .repeat(60));
console.log("Days | Category         | Timeout | Budget (1p) | Budget (2p)");
console.log("-" .repeat(60));
for (let days = 1; days <= 30; days++) {
  const category = getDurationCategory(days);
  const timeout = getTimeoutForDuration(days);
  const budget1 = calculateMinBudget(days, 1);
  const budget2 = calculateMinBudget(days, 2);
  console.log(
    `${days.toString().padStart(4)} | ${(category.emoji + " " + category.label).padEnd(16)} | ${timeout.toString().padStart(4)}s | ₱${budget1.toLocaleString().padStart(7)} | ₱${budget2.toLocaleString().padStart(7)}`
  );
}

console.log("\n✅ Duration validation test suite complete!");
