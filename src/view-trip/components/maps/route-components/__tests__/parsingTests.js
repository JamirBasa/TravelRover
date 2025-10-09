/**
 * Test Suite for Data Parsing and Validation
 * Run this in browser console to test parsing logic
 */

// Test data from actual itinerary
const testCases = [
  {
    name: "Simple pricing with duration",
    input: "(₱75, 2 hours, Rating: N/A)",
    expected: { price: "₱75", duration: "2 hours", rating: "N/A" }
  },
  {
    name: "Price range with comma in numbers",
    input: "(₱800 - ₱1,500, 30 minutes, Rating: N/A)",
    expected: { price: "₱800 - ₱1,500", duration: "30 minutes", rating: "N/A" }
  },
  {
    name: "Decimal hours",
    input: "(₱1,200, 2.5 hours, Rating: N/A)",
    expected: { price: "₱1,200", duration: "2.5 hours", rating: "N/A" }
  },
  {
    name: "Free admission",
    input: "(Free, 2 hours, Rating: N/A)",
    expected: { price: "Free", duration: "2 hours", rating: "N/A" }
  },
  {
    name: "Varies pricing",
    input: "(Varies, 3 hours, Rating: N/A)",
    expected: { price: "Varies", duration: "3 hours", rating: "N/A" }
  },
  {
    name: "Multiple comma price range",
    input: "(₱2,000 - ₱5,000, 2 hours, Rating: N/A)",
    expected: { price: "₱2,000 - ₱5,000", duration: "2 hours", rating: "N/A" }
  },
  {
    name: "45 minutes duration",
    input: "(₱2,000 - ₱4,000, 45 minutes, Rating: N/A)",
    expected: { price: "₱2,000 - ₱4,000", duration: "45 minutes", rating: "N/A" }
  }
];

// Smart parsing function (copy from OptimizedRouteMap.jsx)
function parseParenthesesContent(innerContent) {
  const parts = [];
  let currentPart = "";
  
  for (let i = 0; i < innerContent.length; i++) {
    const char = innerContent[i];
    const prevChars = innerContent.substring(Math.max(0, i - 3), i);
    const nextChars = innerContent.substring(i + 1, Math.min(innerContent.length, i + 5));
    
    // Detect if we're in a price range (has ₱ or dash before/after)
    if (char === ',' && (prevChars.includes('₱') || nextChars.includes('₱') || 
                         prevChars.includes('-') || /^\d/.test(nextChars))) {
      // Keep comma if it's part of a number (₱1,500) or price range
      currentPart += char;
    } else if (char === ',') {
      // This comma is a separator
      parts.push(currentPart.trim());
      currentPart = "";
    } else {
      currentPart += char;
    }
  }
  if (currentPart) parts.push(currentPart.trim());
  
  let price = "N/A";
  let duration = "Varies";
  let rating = null;
  
  parts.forEach(part => {
    if (part.toLowerCase().includes("rating:")) {
      rating = part.replace(/rating:\s*/i, "").trim();
    } else if (part.match(/^\d+(\.\d+)?\s*(minutes?|hours?|min|mins|hr|hrs|h)/i)) {
      duration = part;
    } else if (part.match(/^(₱|PHP|free|varies)/i)) {
      price = part;
    }
  });
  
  return { price, duration, rating, parts };
}

// Run tests
console.log("🧪 Running Data Parsing Tests...\n");

let passedTests = 0;
let failedTests = 0;

testCases.forEach((test, index) => {
  const content = test.input.replace(/^\(|\)$/g, ''); // Remove parentheses
  const result = parseParenthesesContent(content);
  
  const passed = 
    result.price === test.expected.price &&
    result.duration === test.expected.duration &&
    result.rating === test.expected.rating;
  
  if (passed) {
    console.log(`✅ Test ${index + 1}: ${test.name} - PASSED`);
    passedTests++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.name} - FAILED`);
    console.log("   Expected:", test.expected);
    console.log("   Got:", { price: result.price, duration: result.duration, rating: result.rating });
    console.log("   Parts:", result.parts);
    failedTests++;
  }
});

console.log(`\n📊 Test Results: ${passedTests}/${testCases.length} passed`);

// Validation tests
console.log("\n🛡️ Running Validation Tests...\n");

const validationTests = [
  { value: "₱75", validator: "isValidPricing", expected: true },
  { value: "₱1,500", validator: "isValidPricing", expected: true },
  { value: "₱800 - ₱1,500", validator: "isValidPricing", expected: true },
  { value: "Free", validator: "isValidPricing", expected: true },
  { value: "N/A", validator: "isValidPricing", expected: false },
  { value: "₱0", validator: "isValidPricing", expected: false },
  { value: "Varies", validator: "isValidPricing", expected: false },
  { value: "₱800, 30 minutes", validator: "isValidPricing", expected: false },
  
  { value: "2 hours", validator: "isValidDuration", expected: true },
  { value: "2.5 hours", validator: "isValidDuration", expected: true },
  { value: "30 minutes", validator: "isValidDuration", expected: true },
  { value: "45 minutes", validator: "isValidDuration", expected: true },
  { value: "1 hour", validator: "isValidDuration", expected: true },
  { value: "Varies", validator: "isValidDuration", expected: false },
  { value: "N/A", validator: "isValidDuration", expected: false },
];

// Validation functions (copy from locationDataValidator.js)
function isValidPricing(pricing) {
  if (!pricing || pricing === "N/A" || pricing === "₱0") return false;
  if (/^(free|varies)$/i.test(pricing.trim())) {
    return pricing.toLowerCase() === "free";
  }
  if (/,\s+[a-zA-Z]/.test(pricing)) return false;
  const pricingPattern = /^(₱|PHP|P)?\s*[\d,]+(\s*-\s*(₱|PHP|P)?\s*[\d,]+)?$/;
  return pricingPattern.test(pricing.trim());
}

function isValidDuration(duration) {
  if (!duration || duration === "Varies" || duration === "N/A") return false;
  const durationPattern = /^\d+(\.\d+)?\s*(minutes?|hours?|min|mins|hr|hrs|h)$/i;
  return durationPattern.test(duration.trim());
}

validationTests.forEach(test => {
  const validator = test.validator === "isValidPricing" ? isValidPricing : isValidDuration;
  const result = validator(test.value);
  const passed = result === test.expected;
  
  if (passed) {
    console.log(`✅ ${test.validator}("${test.value}") = ${result}`);
  } else {
    console.log(`❌ ${test.validator}("${test.value}") = ${result} (expected ${test.expected})`);
  }
});

console.log("\n✨ Testing complete!");
