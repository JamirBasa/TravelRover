/**
 * Test: Zamboanga → Sagada Flight Routing
 * 
 * Validates that destinations without airports (like Sagada) 
 * correctly route through the nearest commercial airport (TUG)
 * instead of defaulting to Manila.
 */

import { getAirportCode } from '../src/data/airports.js';

console.log('\n🧪 Testing Flight Routing for Non-Airport Destinations\n');
console.log('=' .repeat(60));

// Test cases: [origin, destination, expected_route]
const testCases = [
  {
    name: 'Zamboanga to Sagada',
    origin: 'Zamboanga City',
    destination: 'Sagada',
    expectedDestinationAirport: 'TUG',
    reasoning: 'Sagada has no airport; nearest is Tuguegarao (TUG)'
  },
  {
    name: 'Manila to Sagada',
    origin: 'Manila',
    destination: 'Sagada',
    expectedDestinationAirport: 'TUG',
    reasoning: 'Sagada has no airport; nearest is Tuguegarao (TUG)'
  },
  {
    name: 'Cebu to Banaue',
    origin: 'Cebu',
    destination: 'Banaue',
    expectedDestinationAirport: 'TUG',
    reasoning: 'Banaue has no airport; nearest is Tuguegarao (TUG)'
  },
  {
    name: 'Davao to Vigan',
    origin: 'Davao',
    destination: 'Vigan',
    expectedDestinationAirport: 'LAO',
    reasoning: 'Vigan has no airport; nearest is Laoag (LAO)'
  },
  {
    name: 'Manila to Pagudpud',
    origin: 'Manila',
    destination: 'Pagudpud',
    expectedDestinationAirport: 'LAO',
    reasoning: 'Pagudpud has no airport; nearest is Laoag (LAO)'
  },
  {
    name: 'Zamboanga to Bontoc',
    origin: 'Zamboanga City',
    destination: 'Bontoc',
    expectedDestinationAirport: 'TUG',
    reasoning: 'Bontoc has no airport; nearest is Tuguegarao (TUG)'
  },
  {
    name: 'Manila to Batad',
    origin: 'Manila',
    destination: 'Batad',
    expectedDestinationAirport: 'TUG',
    reasoning: 'Batad has no airport; nearest is Tuguegarao (TUG)'
  }
];

let passed = 0;
let failed = 0;

console.log('\n📋 Running Test Cases:\n');

testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log(`   Route: ${test.origin} → ${test.destination}`);
  
  const originCode = getAirportCode(test.origin);
  const destinationCode = getAirportCode(test.destination);
  
  console.log(`   Resolved: ${originCode} → ${destinationCode}`);
  console.log(`   Expected: ${destinationCode} = ${test.expectedDestinationAirport}`);
  
  if (destinationCode === test.expectedDestinationAirport) {
    console.log(`   ✅ PASS - ${test.reasoning}`);
    passed++;
  } else {
    console.log(`   ❌ FAIL - Got ${destinationCode}, expected ${test.expectedDestinationAirport}`);
    console.log(`   Reason: ${test.reasoning}`);
    failed++;
  }
});

console.log('\n' + '=' .repeat(60));
console.log('\n📊 Test Results:');
console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('🎉 All tests passed! Flight routing is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️ Some tests failed. Please review the airport mappings.\n');
  process.exit(1);
}
