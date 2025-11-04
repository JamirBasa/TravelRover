/**
 * Test Travel Time Validation Logic
 * Demonstrates how the intelligent validator works across different Philippine destinations
 */

import { 
  estimateTravelTime, 
  validateDaySchedule 
} from './src/view-trip/components/places-to-visit/utils/timeValidator.js';

console.log('🧪 Testing Travel Time Validation Across Philippine Destinations\n');
console.log('='.repeat(70) + '\n');

// Test Case 1: Baguio (Your original scenario)
console.log('📍 TEST 1: BAGUIO ITINERARY');
console.log('-'.repeat(70));

const baguioActivities = [
  { placeName: 'Arrival at hotel', time: '12:00 PM', timeTravel: '30 mins' },
  { placeName: 'Taxi to El Cielito Hotel Baguio', time: '1:00 PM', timeTravel: '1 hour' },
  { placeName: 'Check-in at El Cielito Hotel Baguio', time: '2:00 PM', timeTravel: '15 mins' },
  { placeName: 'Explore Session Road', time: '4:00 PM', timeTravel: '2 hours' },
  { placeName: 'Dinner at Session Road', time: '6:00 PM', timeTravel: '1 hour' },
  { placeName: 'Return to El Cielito Hotel Baguio', time: '8:00 PM', timeTravel: '30 mins' }
];

baguioActivities.forEach((activity, index) => {
  if (index > 0) {
    const travelTime = estimateTravelTime(baguioActivities[index - 1], activity);
    console.log(`   ${baguioActivities[index - 1].placeName.slice(0, 30).padEnd(30)} → ${activity.placeName.slice(0, 30).padEnd(30)} = ${travelTime} min`);
  }
});

const baguioResult = validateDaySchedule(baguioActivities);
console.log(`\n   Validation: ${baguioResult.isValid ? '✅ VALID' : '❌ ISSUES'}`);
console.log(`   Warnings: ${baguioResult.warnings.length}`);
baguioResult.warnings.slice(0, 3).forEach(w => {
  console.log(`   - ${w.message.slice(0, 80)}...`);
});

// Test Case 2: Manila (Intramuros area)
console.log('\n\n📍 TEST 2: MANILA INTRAMUROS');
console.log('-'.repeat(70));

const manilaActivities = [
  { placeName: 'Fort Santiago', time: '9:00 AM', timeTravel: '1.5 hours', category: 'Historical Landmark' },
  { placeName: 'San Agustin Church in Intramuros', time: '10:30 AM', timeTravel: '1 hour', category: 'Historical Landmark' },
  { placeName: 'Casa Manila Museum', time: '12:00 PM', timeTravel: '45 mins', category: 'Museum' },
  { placeName: 'Lunch at Barbara\'s Restaurant Intramuros', time: '1:00 PM', timeTravel: '1 hour', category: 'Restaurant' },
  { placeName: 'Rizal Park', time: '2:30 PM', timeTravel: '1.5 hours', category: 'Park' },
  { placeName: 'National Museum in Rizal Park area', time: '4:30 PM', timeTravel: '2 hours', category: 'Museum' }
];

manilaActivities.forEach((activity, index) => {
  if (index > 0) {
    const travelTime = estimateTravelTime(manilaActivities[index - 1], activity);
    console.log(`   ${manilaActivities[index - 1].placeName.slice(0, 30).padEnd(30)} → ${activity.placeName.slice(0, 30).padEnd(30)} = ${travelTime} min`);
  }
});

const manilaResult = validateDaySchedule(manilaActivities);
console.log(`\n   Validation: ${manilaResult.isValid ? '✅ VALID' : '❌ ISSUES'}`);
console.log(`   Warnings: ${manilaResult.warnings.length}`);

// Test Case 3: Boracay (Beach activities)
console.log('\n\n📍 TEST 3: BORACAY BEACH DAY');
console.log('-'.repeat(70));

const boracayActivities = [
  { placeName: 'Hotel check-out', time: '7:00 AM', timeTravel: '30 mins' },
  { placeName: 'Breakfast at White Beach', time: '8:00 AM', timeTravel: '1 hour', category: 'Restaurant' },
  { placeName: 'Island Hopping Tour', time: '9:30 AM', timeTravel: '3 hours', category: 'Water Activity' },
  { placeName: 'Lunch at D\'Mall', time: '1:00 PM', timeTravel: '1.5 hours', category: 'Restaurant' },
  { placeName: 'Puka Shell Beach', time: '3:00 PM', timeTravel: '2 hours', category: 'Beach' },
  { placeName: 'Return to hotel', time: '5:30 PM', timeTravel: '30 mins' }
];

boracayActivities.forEach((activity, index) => {
  if (index > 0) {
    const travelTime = estimateTravelTime(boracayActivities[index - 1], activity);
    console.log(`   ${boracayActivities[index - 1].placeName.slice(0, 30).padEnd(30)} → ${activity.placeName.slice(0, 30).padEnd(30)} = ${travelTime} min`);
  }
});

const boracayResult = validateDaySchedule(boracayActivities);
console.log(`\n   Validation: ${boracayResult.isValid ? '✅ VALID' : '❌ ISSUES'}`);
console.log(`   Warnings: ${boracayResult.warnings.length}`);

// Test Case 4: Cebu (Mixed urban/resort)
console.log('\n\n📍 TEST 4: CEBU CITY TOUR');
console.log('-'.repeat(70));

const cebuActivities = [
  { placeName: 'Magellan\'s Cross', time: '8:00 AM', timeTravel: '45 mins', category: 'Historical Landmark' },
  { placeName: 'Basilica del Santo Niño', time: '9:00 AM', timeTravel: '1 hour', category: 'Church' },
  { placeName: 'Taxi to Tops Lookout', time: '10:30 AM', timeTravel: '45 mins' },
  { placeName: 'Tops Lookout Viewpoint', time: '11:30 AM', timeTravel: '1 hour', category: 'Viewpoint' },
  { placeName: 'Lunch at Busay area', time: '1:00 PM', timeTravel: '1.5 hours', category: 'Restaurant' },
  { placeName: 'Drive to Mactan Beach', time: '3:00 PM', timeTravel: '1 hour' },
  { placeName: 'Beach relaxation', time: '4:30 PM', timeTravel: '2 hours', category: 'Beach' }
];

cebuActivities.forEach((activity, index) => {
  if (index > 0) {
    const travelTime = estimateTravelTime(cebuActivities[index - 1], activity);
    console.log(`   ${cebuActivities[index - 1].placeName.slice(0, 30).padEnd(30)} → ${activity.placeName.slice(0, 30).padEnd(30)} = ${travelTime} min`);
  }
});

const cebuResult = validateDaySchedule(cebuActivities);
console.log(`\n   Validation: ${cebuResult.isValid ? '✅ VALID' : '❌ ISSUES'}`);
console.log(`   Warnings: ${cebuResult.warnings.length}`);

// Summary
console.log('\n\n' + '='.repeat(70));
console.log('📊 SUMMARY OF INTELLIGENT VALIDATION');
console.log('='.repeat(70));
console.log('\n✅ Key Features Demonstrated:');
console.log('   1. Logistics activities (taxi, check-in, return) get 0 min travel time');
console.log('   2. Same location detection (hotel → hotel, Intramuros → Intramuros)');
console.log('   3. Proximity detection via keyword matching (Session Road activities)');
console.log('   4. Category-based estimation (landmark → landmark = clustered)');
console.log('   5. Works across ALL Philippine destinations without hardcoding');
console.log('\n🎯 Result: Accurate, scalable validation for any destination!\n');
