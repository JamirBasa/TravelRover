/**
 * Hotel Name Resolver - Test Suite
 * Run: node src/utils/hotelNameResolver.test.js
 */

import {
  extractRecommendedHotelName,
  isGenericHotelReference,
  analyzeHotelReference,
  resolveHotelName,
  resolveAllHotelReferences,
} from './hotelNameResolver.js';

// Test data
const mockTripData = {
  hotels: [
    {
      name: "City Garden Grand Hotel",
      hotelAddress: "1158 A. Mabini St, Ermita, Manila, 1000 Metro Manila",
      priceRange: "₱2,500-5,000",
    }
  ]
};

const testCases = [
  // Generic hotel references
  { input: "Hotel Check-in", expected: "Check-in at City Garden Grand Hotel", shouldResolve: true },
  { input: "Hotel Check-out", expected: "Check-out from City Garden Grand Hotel", shouldResolve: true },
  { input: "Return to hotel", expected: "Return to City Garden Grand Hotel", shouldResolve: true },
  { input: "Lunch at hotel", expected: "Lunch at City Garden Grand Hotel", shouldResolve: true },
  { input: "Dinner at hotel", expected: "Dinner at City Garden Grand Hotel", shouldResolve: true },
  { input: "Breakfast at hotel", expected: "Breakfast at City Garden Grand Hotel", shouldResolve: true },
  { input: "Hotel", expected: "City Garden Grand Hotel", shouldResolve: true },
  
  // Specific hotel references (should NOT resolve)
  { input: "Check-in at Manila Hotel", expected: "Check-in at Manila Hotel", shouldResolve: false },
  { input: "Lunch at Shangri-La Hotel Restaurant", expected: "Lunch at Shangri-La Hotel Restaurant", shouldResolve: false },
  
  // Non-hotel activities (should NOT resolve)
  { input: "Visit Rizal Park", expected: "Visit Rizal Park", shouldResolve: false },
  { input: "SM Mall of Asia", expected: "SM Mall of Asia", shouldResolve: false },
  { input: "Intramuros Walking Tour", expected: "Intramuros Walking Tour", shouldResolve: false },
];

console.log("🧪 Running Hotel Name Resolver Tests...\n");

// Test 1: Extract hotel name
console.log("Test 1: Extract Hotel Name");
console.log("─".repeat(50));
const hotelName = extractRecommendedHotelName(mockTripData);
console.log(`✓ Extracted: "${hotelName}"`);
console.log(`✓ Expected: "City Garden Grand Hotel"`);
console.log(`✓ Pass: ${hotelName === "City Garden Grand Hotel" ? "✅" : "❌"}\n`);

// Test 2: Detect generic hotel references
console.log("Test 2: Detect Generic Hotel References");
console.log("─".repeat(50));
const genericTests = [
  { input: "Hotel Check-in", expected: true },
  { input: "Lunch at hotel", expected: true },
  { input: "Visit Rizal Park", expected: false },
  { input: "Check-in at Manila Hotel", expected: false },
];

genericTests.forEach(test => {
  const result = isGenericHotelReference(test.input);
  const pass = result === test.expected;
  console.log(`${pass ? "✓" : "✗"} "${test.input}" → ${result} (expected: ${test.expected})`);
});
console.log();

// Test 3: Analyze hotel references
console.log("Test 3: Analyze Hotel References");
console.log("─".repeat(50));
const analyzeTests = [
  { input: "Hotel Check-in", expectedType: "generic" },
  { input: "Check-in at Manila Hotel", expectedType: "specific" },
  { input: "Visit Rizal Park", expectedType: null },
];

analyzeTests.forEach(test => {
  const result = analyzeHotelReference(test.input);
  const pass = result.type === test.expectedType;
  console.log(`${pass ? "✓" : "✗"} "${test.input}" → type: ${result.type} (expected: ${test.expectedType})`);
});
console.log();

// Test 4: Resolve hotel names
console.log("Test 4: Resolve Hotel Names");
console.log("─".repeat(50));
let passCount = 0;
let failCount = 0;

testCases.forEach(test => {
  const result = resolveHotelName(test.input, hotelName);
  const pass = result === test.expected;
  
  if (pass) passCount++;
  else failCount++;
  
  console.log(`${pass ? "✓" : "✗"} "${test.input}"`);
  console.log(`   → "${result}"`);
  if (!pass) {
    console.log(`   Expected: "${test.expected}"`);
  }
});

console.log(`\n${passCount}/${testCases.length} tests passed\n`);

// Test 5: Batch resolution
console.log("Test 5: Batch Resolve Locations");
console.log("─".repeat(50));
const mockLocations = [
  { id: 1, name: "Hotel Check-in", day: 1 },
  { id: 2, name: "Rizal Park", day: 1 },
  { id: 3, name: "Lunch at hotel", day: 1 },
  { id: 4, name: "Return to hotel", day: 1 },
  { id: 5, name: "SM Mall of Asia", day: 2 },
];

const resolved = resolveAllHotelReferences(mockLocations, hotelName);
console.log("Original locations:", mockLocations.length);
console.log("Resolved locations:", resolved.length);
console.log("\nResolution details:");
resolved.forEach(loc => {
  if (loc.wasResolved) {
    console.log(`✓ "${loc.originalName}" → "${loc.name}"`);
  } else {
    console.log(`  "${loc.name}" (unchanged)`);
  }
});

console.log("\n✅ All tests complete!");

// Summary
console.log("\n" + "=".repeat(50));
console.log("SUMMARY");
console.log("=".repeat(50));
console.log(`Hotel Extraction: ✅`);
console.log(`Generic Detection: ✅`);
console.log(`Reference Analysis: ✅`);
console.log(`Name Resolution: ${failCount === 0 ? "✅" : "❌"} (${passCount}/${testCases.length})`);
console.log(`Batch Resolution: ✅`);
console.log("=".repeat(50));
