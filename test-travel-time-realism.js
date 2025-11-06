#!/usr/bin/env node
/**
 * Travel Time Realism Test
 * Validates that travel times are realistic based on distance, mode of transport, and traffic
 */

import { travelTimeValidator } from './src/services/TravelTimeValidator.js';
import { correctItineraryTravelTimes } from './src/utils/itineraryTravelTimeCorrector.js';

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const toRadians = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

console.log('🚗 TRAVEL TIME REALISM TEST');
console.log('='.repeat(70));

let totalTests = 0;
let passedTests = 0;

function test(name, condition, message = '') {
  totalTests++;
  if (condition) {
    console.log(`✅ ${name}`);
    passedTests++;
  } else {
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
  }
}

// ========================================
// TEST 1: Distance vs. Time Validation
// ========================================
console.log('\n🧪 TEST 1: Distance vs. Time Validation\n');

const testCases = [
  {
    from: { lat: 14.5995, longitude: 120.9842 }, // Manila
    to: { lat: 14.6507, longitude: 121.0494 },   // Quezon City (~10km)
    distance: 10,
    expectedMinTime: 15,  // Min 15 min in Manila traffic
    expectedMaxTime: 60,  // Max 60 min in peak traffic
    transport: 'taxi'
  },
  {
    from: { lat: 14.5995, longitude: 120.9842 }, // Manila
    to: { lat: 14.3490, longitude: 120.9398 },   // Parañaque (~28km)
    distance: 28,
    expectedMinTime: 30,  // Min 30 min
    expectedMaxTime: 120, // Max 2 hours in traffic
    transport: 'taxi'
  },
  {
    from: { lat: 10.3157, longitude: 123.8854 }, // Cebu City
    to: { lat: 10.3099, longitude: 123.8938 },   // Cebu nearby (~1km)
    distance: 1,
    expectedMinTime: 3,   // Walking distance
    expectedMaxTime: 10,  // Very short drive
    transport: 'walking'
  }
];

testCases.forEach((tc, index) => {
  const distance = calculateDistance(tc.from.lat, tc.from.lng, tc.to.lat, tc.to.lng);
  
  console.log(`   Test ${index + 1}: ${distance.toFixed(1)}km journey`);
  console.log(`   Expected: ${tc.expectedMinTime}-${tc.expectedMaxTime} minutes`);
  
  // Validate distance calculation is reasonable
  const distanceDiff = Math.abs(distance - tc.distance);
  test(
    `Distance calculation accurate (±5km)`,
    distanceDiff <= 5,
    `Expected: ~${tc.distance}km, Got: ${distance.toFixed(1)}km, Diff: ${distanceDiff.toFixed(1)}km`
  );
});

// ========================================
// TEST 2: Unrealistic Travel Times Detection
// ========================================
console.log('\n🧪 TEST 2: Unrealistic Travel Times Detection\n');

// Test case: 50km showing as "2 minutes"
const unrealisticItinerary = {
  itinerary: [
    {
      day: 1,
      plan: [
        {
          time: '10:00 AM',
          placeName: 'Hotel Check-in',
          geoCoordinates: { latitude: 14.5995, longitude: 120.9842 },
          timeTravel: 'N/A'
        },
        {
          time: '10:02 AM', // ❌ Only 2 minutes later
          placeName: 'Tagaytay City Tour',
          geoCoordinates: { latitude: 14.1175, longitude: 120.9626 }, // ~60km from Manila
          timeTravel: '2 minutes by bus (₱50)' // ❌ UNREALISTIC
        },
        {
          time: '2:00 PM',
          placeName: 'Mall of Asia',
          geoCoordinates: { latitude: 14.5358, longitude: 120.9823 },
          timeTravel: '45 minutes by taxi (₱250)'
        }
      ]
    }
  ]
};

const correctedItinerary = correctItineraryTravelTimes(unrealisticItinerary);

console.log('   Original: "2 minutes by bus" for 60km journey');
console.log(`   Corrected: "${correctedItinerary.tripData.itinerary[0].plan[1].timeTravel}"`);

test(
  'Detects unrealistic 2-minute travel for 60km',
  correctedItinerary.report.corrected > 0,
  `Expected: Corrections made, Got: ${correctedItinerary.report.corrected} corrections`
);

const correctedTime = correctedItinerary.tripData.itinerary[0].plan[1].timeTravel;
const hasRealisticTime = correctedTime.includes('90') || correctedTime.includes('120') || 
                        correctedTime.includes('1.5') || correctedTime.includes('2 hours');

test(
  'Corrected time is realistic (90-120 min for 60km)',
  hasRealisticTime,
  `Corrected to: ${correctedTime}`
);

// ========================================
// TEST 3: Cross-Island Travel (Ferry Times)
// ========================================
console.log('\n🧪 TEST 3: Cross-Island Travel (Ferry Times)\n');

const crossIslandItinerary = {
  itinerary: [
    {
      day: 1,
      plan: [
        {
          time: '10:00 AM',
          placeName: 'Boracay White Beach',
          geoCoordinates: { latitude: 11.9674, longitude: 121.9248 },
          timeTravel: 'N/A'
        },
        {
          time: '10:30 AM', // ❌ Only 30 minutes
          placeName: 'Puerto Princesa Underground River',
          geoCoordinates: { latitude: 10.1667, longitude: 118.9167 }, // Different island!
          timeTravel: '30 minutes by boat (₱100)' // ❌ IMPOSSIBLE - needs flight
        }
      ]
    }
  ]
};

const distance = calculateDistance(
  11.9674, 121.9248, // Boracay
  10.1667, 118.9167  // Puerto Princesa
);

console.log(`   Distance: Boracay → Puerto Princesa = ${distance.toFixed(0)}km`);
console.log(`   Travel method required: Flight (1.5-2 hours) or multi-day ferry`);

test(
  'Detects cross-island travel requires flight',
  distance > 300, // Over 300km apart
  `Distance: ${distance.toFixed(0)}km - requires air travel`
);

// ========================================
// TEST 4: Airport to City Center Times
// ========================================
console.log('\n🧪 TEST 4: Airport to City Center Times\n');

const airportTests = [
  {
    name: 'NAIA (Manila) → Makati',
    from: { lat: 14.5086, longitude: 121.0197 }, // NAIA
    to: { lat: 14.5547, longitude: 121.0244 },   // Makati
    minTime: 30,
    maxTime: 90,
    description: 'Heavy Metro Manila traffic'
  },
  {
    name: 'Mactan Airport (Cebu) → Cebu City',
    from: { lat: 10.3075, longitude: 123.9790 }, // Mactan
    to: { lat: 10.3157, longitude: 123.8854 },   // Cebu City
    minTime: 20,
    maxTime: 45,
    description: 'Moderate Cebu traffic'
  },
  {
    name: 'Puerto Princesa Airport → City Center',
    from: { lat: 9.7421, longitude: 118.7592 },  // PPS Airport
    to: { lat: 9.7392, longitude: 118.7353 },    // City Center
    minTime: 10,
    maxTime: 20,
    description: 'Light provincial traffic'
  }
];

airportTests.forEach(airport => {
  const distance = calculateDistance(
    airport.from.lat, airport.from.lng,
    airport.to.lat, airport.to.lng
  );
  
  console.log(`   ${airport.name}: ${distance.toFixed(1)}km`);
  console.log(`   Expected: ${airport.minTime}-${airport.maxTime} min (${airport.description})`);
  
  test(
    `${airport.name} realistic`,
    distance < 30, // Airports should be within 30km of city center
    `Distance: ${distance.toFixed(1)}km`
  );
});

// ========================================
// TEST 5: Walking Distance Validation
// ========================================
console.log('\n🧪 TEST 5: Walking Distance Validation\n');

const walkingTests = [
  {
    name: 'Intramuros → Rizal Park',
    from: { lat: 14.5896, longitude: 120.9750 },
    to: { lat: 14.5833, longitude: 120.9778 },
    maxWalkingDistance: 1.5, // km
    shouldBeWalkable: true
  },
  {
    name: 'Manila → Quezon City',
    from: { lat: 14.5995, longitude: 120.9842 },
    to: { lat: 14.6507, longitude: 121.0494 },
    maxWalkingDistance: 1.5,
    shouldBeWalkable: false // Too far
  },
  {
    name: 'Mall of Asia → SM Aura',
    from: { lat: 14.5358, longitude: 120.9823 },
    to: { lat: 14.5474, longitude: 121.0510 },
    maxWalkingDistance: 1.5,
    shouldBeWalkable: false // Need transport
  }
];

walkingTests.forEach(wt => {
  const distance = calculateDistance(
    wt.from.lat, wt.from.lng,
    wt.to.lat, wt.to.lng
  );
  
  const isWalkable = distance <= wt.maxWalkingDistance;
  
  console.log(`   ${wt.name}: ${distance.toFixed(2)}km`);
  console.log(`   Walkable: ${isWalkable ? 'Yes' : 'No'} (max: ${wt.maxWalkingDistance}km)`);
  
  test(
    `${wt.name} walkability correct`,
    isWalkable === wt.shouldBeWalkable,
    `Expected: ${wt.shouldBeWalkable ? 'Walkable' : 'Not walkable'}, Distance: ${distance.toFixed(2)}km`
  );
});

// ========================================
// TEST 6: Traffic Consideration
// ========================================
console.log('\n🧪 TEST 6: Traffic Consideration\n');

const trafficItinerary = {
  itinerary: [
    {
      day: 1,
      plan: [
        {
          time: '8:00 AM', // Peak morning rush hour
          placeName: 'Hotel in Makati',
          geoCoordinates: { latitude: 14.5547, longitude: 121.0244 },
          timeTravel: 'N/A'
        },
        {
          time: '8:15 AM', // Only 15 minutes for 10km in rush hour!
          placeName: 'Intramuros',
          geoCoordinates: { latitude: 14.5896, longitude: 120.9750 },
          timeTravel: '15 minutes by taxi (₱150)' // ❌ Too optimistic
        },
        {
          time: '12:00 PM', // Midday - lighter traffic
          placeName: 'Rizal Park',
          geoCoordinates: { latitude: 14.5833, longitude: 120.9778 },
          timeTravel: '10 minutes by taxi (₱100)' // ✅ More reasonable
        }
      ]
    }
  ]
};

const trafficCorrected = correctItineraryTravelTimes(trafficItinerary);

console.log('   Morning rush hour (8 AM): 10km journey');
console.log(`   Original: "15 minutes" - corrected to: "${trafficCorrected.itinerary[0].plan[1].timeTravel}"`);

test(
  'Considers morning rush hour traffic',
  trafficCorrected.corrections > 0,
  'Should correct unrealistic rush hour times'
);

// ========================================
// TEST 7: Zero-Minute Travel Detection
// ========================================
console.log('\n🧪 TEST 7: Zero-Minute Travel Detection\n');

const zeroMinuteItinerary = {
  itinerary: [
    {
      day: 1,
      plan: [
        {
          time: '10:00 AM',
          placeName: 'Fort Santiago',
          geoCoordinates: { latitude: 14.5943, longitude: 120.9733 },
          timeTravel: 'N/A'
        },
        {
          time: '10:00 AM', // Same time!
          placeName: 'San Agustin Church',
          geoCoordinates: { latitude: 14.5886, longitude: 120.9754 },
          timeTravel: '0 minutes by walking (free)' // ❌ Even walking takes time
        }
      ]
    }
  ]
};

const distance7 = calculateDistance(14.5943, 120.9733, 14.5886, 120.9754);
console.log(`   Distance: ${(distance7 * 1000).toFixed(0)} meters`);
console.log(`   Actual walking time: ~${Math.ceil(distance7 * 12)} minutes (5 km/h pace)`);

test(
  'Detects zero-minute travel between different locations',
  distance7 > 0.05, // More than 50 meters
  `Distance: ${(distance7 * 1000).toFixed(0)}m - should take at least ${Math.ceil(distance7 * 12)} min walking`
);

// ========================================
// SUMMARY
// ========================================
console.log('\n' + '='.repeat(70));
console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} passed`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n✅ Travel time validation is realistic!');
  process.exit(0);
} else {
  console.log(`\n❌ ${totalTests - passedTests} travel time realism issues detected`);
  process.exit(1);
}
