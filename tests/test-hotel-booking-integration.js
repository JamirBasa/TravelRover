/**
 * Hotel Booking Integration Test Suite
 * 
 * Tests the Agoda-Google Places integration and booking flow
 * 
 * Run in browser console:
 * const tests = await import('/tests/test-hotel-booking-integration.js');
 * tests.runAllTests();
 */

/**
 * Test Case 1: Verified Hotel with valid hotel_id
 */
export function testVerifiedHotelBooking() {
  console.log('\n🧪 TEST 1: Verified Hotel Booking');
  
  const mockHotel = {
    name: 'The Heritage Hotel Manila',
    hotel_id: 5610,
    verified: true,
    matchScore: 1.0,
    matchMethod: 'Exact Name Match',
    rating: 4.5,
    pricePerNight: '₱3,500'
  };

  // Test validation
  const { validateHotelBooking } = window;
  const result = validateHotelBooking(mockHotel);

  console.log('Input:', mockHotel);
  console.log('Validation Result:', result);

  const passed = 
    result.canBook === true &&
    result.hasHotelId === true &&
    result.isVerified === true &&
    result.agodaId === 5610;

  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  return { test: 'Verified Hotel Booking', passed, result };
}

/**
 * Test Case 2: Unverified Hotel (no hotel_id)
 */
export function testUnverifiedHotelBooking() {
  console.log('\n🧪 TEST 2: Unverified Hotel (No hotel_id)');
  
  const mockHotel = {
    name: 'Boutique Inn Manila',
    verified: false,
    rating: 4.2,
    priceRange: '₱2,000-3,000',
    source: 'ai'
  };

  const { validateHotelBooking } = window;
  const result = validateHotelBooking(mockHotel);

  console.log('Input:', mockHotel);
  console.log('Validation Result:', result);

  const passed = 
    result.canBook === false &&
    result.hasHotelId === false &&
    result.reason === 'No hotel_id found';

  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  return { test: 'Unverified Hotel', passed, result };
}

/**
 * Test Case 3: Google Place ID (invalid for Agoda)
 */
export function testGooglePlaceIdRejection() {
  console.log('\n🧪 TEST 3: Google Place ID Rejection');
  
  const mockHotel = {
    name: 'Sample Hotel',
    id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    verified: true,
    rating: 4.3
  };

  const { validateHotelBooking } = window;
  const result = validateHotelBooking(mockHotel);

  console.log('Input:', mockHotel);
  console.log('Validation Result:', result);

  const passed = 
    result.canBook === false &&
    result.hasHotelId === true &&
    result.reason === 'Google Place ID (not Agoda ID)';

  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  return { test: 'Google Place ID Rejection', passed, result };
}

/**
 * Test Case 4: Low Confidence Match (65-75%)
 */
export function testLowConfidenceMatch() {
  console.log('\n🧪 TEST 4: Low Confidence Match');
  
  const mockHotel = {
    name: 'Manila Grand Hotel',
    hotel_id: 1234,
    verified: true,
    matchScore: 0.68, // 68% similarity
    matchMethod: 'Fuzzy Name Match',
    rating: 4.0
  };

  const { validateHotelBooking } = window;
  const result = validateHotelBooking(mockHotel);

  console.log('Input:', mockHotel);
  console.log('Validation Result:', result);
  console.log('⚠️ This should trigger a warning but still allow booking');

  const passed = 
    result.canBook === true &&
    result.agodaId === 1234 &&
    mockHotel.matchScore < 0.75; // Should show warning badge

  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  return { test: 'Low Confidence Match', passed, result };
}

/**
 * Test Case 5: Agoda URL Generation
 */
export function testAgodaURLGeneration() {
  console.log('\n🧪 TEST 5: Agoda URL Generation');
  
  const testUrl = 'https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=1952350&hl=en-us&currency=PHP&hid=5610&checkin=2025-12-01&checkout=2025-12-05&NumberofAdults=2&NumberofChildren=0&Rooms=1';

  const { testAgodaURL } = window;
  const result = testAgodaURL(testUrl);

  console.log('Test URL:', testUrl);
  console.log('Validation Result:', result);

  const passed = 
    result.valid === true &&
    result.checks.domain === true &&
    result.checks.hasHotelId === true &&
    result.checks.isNumericId === true &&
    result.checks.hotelId === '5610';

  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  return { test: 'Agoda URL Generation', passed, result };
}

/**
 * Test Case 6: Invalid Agoda URL (missing hotel_id)
 */
export function testInvalidAgodaURL() {
  console.log('\n🧪 TEST 6: Invalid Agoda URL (Missing hotel_id)');
  
  const testUrl = 'https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=1952350&hl=en-us&currency=PHP&checkin=2025-12-01&checkout=2025-12-05';

  const { testAgodaURL } = window;
  const result = testAgodaURL(testUrl);

  console.log('Test URL:', testUrl);
  console.log('Validation Result:', result);

  const passed = 
    result.valid === false &&
    result.checks.hasHotelId === false;

  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  return { test: 'Invalid Agoda URL', passed, result };
}

/**
 * Test Case 7: Multiple ID Fields Priority
 */
export function testIDFieldPriority() {
  console.log('\n🧪 TEST 7: ID Field Priority (hotel_id > hotelId > id)');
  
  const mockHotel = {
    name: 'Test Hotel',
    hotel_id: 9999,        // Priority 1
    hotelId: 8888,         // Priority 2
    id: 7777,              // Priority 3
    place_id: 'ChIJ_abc', // Should be ignored
    verified: true
  };

  const { validateHotelBooking } = window;
  const result = validateHotelBooking(mockHotel);

  console.log('Input:', mockHotel);
  console.log('Validation Result:', result);

  const passed = 
    result.canBook === true &&
    result.agodaId === 9999; // Should pick hotel_id

  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  return { test: 'ID Field Priority', passed, result };
}

/**
 * Test Case 8: Real Trip Data Diagnostics
 */
export async function testRealTripDiagnostics(trip) {
  console.log('\n🧪 TEST 8: Real Trip Data Diagnostics');
  
  if (!trip) {
    console.log('❌ No trip data provided. Usage: testRealTripDiagnostics(trip)');
    return { test: 'Real Trip Diagnostics', passed: false, error: 'No trip data' };
  }

  const { debugHotelBooking } = window;
  const report = debugHotelBooking(trip);

  console.log('Trip ID:', trip.id);
  console.log('Destination:', trip.userSelection?.location);
  
  const passed = 
    report.summary &&
    report.hotels &&
    report.hotels.length > 0;

  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  return { test: 'Real Trip Diagnostics', passed, report };
}

/**
 * Run all tests
 */
export function runAllTests(tripData = null) {
  console.log('🚀 === HOTEL BOOKING INTEGRATION TEST SUITE ===\n');
  
  const results = [
    testVerifiedHotelBooking(),
    testUnverifiedHotelBooking(),
    testGooglePlaceIdRejection(),
    testLowConfidenceMatch(),
    testAgodaURLGeneration(),
    testInvalidAgodaURL(),
    testIDFieldPriority()
  ];

  // Add real trip test if data provided
  if (tripData) {
    results.push(testRealTripDiagnostics(tripData));
  }

  // Summary
  console.log('\n📊 === TEST SUMMARY ===');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${total - passed}/${total}`);
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);
  });

  const allPassed = passed === total;
  console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
  
  return {
    allPassed,
    passed,
    total,
    results
  };
}

/**
 * Export test runner
 */
if (typeof window !== 'undefined') {
  window.runHotelBookingTests = runAllTests;
  console.log('✅ Hotel booking test suite loaded!');
  console.log('📝 Usage: window.runHotelBookingTests() or window.runHotelBookingTests(trip)');
}

export default {
  runAllTests,
  testVerifiedHotelBooking,
  testUnverifiedHotelBooking,
  testGooglePlaceIdRejection,
  testLowConfidenceMatch,
  testAgodaURLGeneration,
  testInvalidAgodaURL,
  testIDFieldPriority,
  testRealTripDiagnostics
};
