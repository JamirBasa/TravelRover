// JSON Parsing Validation Test for AI Response Handling
import { parseDataArray, safeJsonParse, cleanJSON, aggressiveJSONClean } from './jsonParsers.js';

// Test cases for common AI response issues
const testCases = [
  {
    name: "Trailing Comma Object",
    input: `{"tripName": "Test Trip", "destination": "Paris",}`,
    expected: { tripName: "Test Trip", destination: "Paris" }
  },
  {
    name: "Trailing Comma Array",
    input: `{"places": ["Paris", "London",]}`,
    expected: { places: ["Paris", "London"] }
  },
  {
    name: "Incomplete Object",
    input: `{"tripName": "Test Trip", "destination": "Paris", "hotels": [{"name": "Hotel 1",...`,
    expected: null // Should fail gracefully
  },
  {
    name: "Code Block Wrapped",
    input: "```json\n{\"tripName\": \"Test Trip\"}\n```",
    expected: { tripName: "Test Trip" }
  },
  {
    name: "Extra Text Before",
    input: "Here's your itinerary:\n{\"tripName\": \"Test Trip\"}",
    expected: { tripName: "Test Trip" }
  },
  {
    name: "Multiple Trailing Commas",
    input: `{"trip": {"name": "Test",}, "places": [{"id": 1,},],}`,
    expected: { trip: { name: "Test" }, places: [{ id: 1 }] }
  }
];

export const validateJSONParsing = () => {
  console.log("🧪 Starting JSON Parsing Validation Tests...");
  
  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`\n📝 Test ${index + 1}: ${testCase.name}`);
    console.log("Input:", testCase.input);

    try {
      // Test with cleanJSON first
      const cleaned = cleanJSON(testCase.input);
      console.log("Cleaned:", cleaned?.substring(0, 100) + "...");

      // Test with safeJsonParse
      const result = safeJsonParse(cleaned);
      console.log("Result:", result);

      if (result && testCase.expected) {
        console.log("✅ PASSED - Valid JSON parsed");
        passed++;
      } else if (!result && !testCase.expected) {
        console.log("✅ PASSED - Correctly failed for invalid input");
        passed++;
      } else {
        console.log("❌ FAILED - Unexpected result");
        failed++;
      }
    } catch (error) {
      console.log("❌ ERROR:", error.message);
      failed++;
    }
  });

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
  return { passed, failed, total: testCases.length };
};

// Test specific parsing functions
export const testParseDataArray = () => {
  const testData = `[
    {"name": "Place 1", "rating": 4.5,},
    {"name": "Place 2", "rating": 4.0,}
  ]`;

  console.log("🧪 Testing parseDataArray...");
  try {
    const result = parseDataArray(testData, "test");
    console.log("Result:", result);
    return result;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

// Manual test runner
if (typeof window !== 'undefined') {
  window.testJSONParsing = validateJSONParsing;
  window.testParseDataArray = testParseDataArray;
}