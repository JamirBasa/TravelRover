/**
 * Comprehensive Test: ALL Philippine Tourist Destinations
 * 
 * Validates flight routing for 50+ popular destinations across
 * Luzon, Visayas, and Mindanao
 */

import { getAirportCode } from '../src/data/airports.js';

console.log('\n🧪 COMPREHENSIVE FLIGHT ROUTING TEST - Philippine Destinations\n');
console.log('=' .repeat(70));

// Comprehensive test cases covering ALL major Philippine tourist destinations
const testCases = [
  // === LUZON - NORTHERN ===
  { origin: 'Manila', destination: 'Sagada', expected: 'TUG', region: 'Cordillera' },
  { origin: 'Manila', destination: 'Banaue', expected: 'TUG', region: 'Cordillera' },
  { origin: 'Manila', destination: 'Bontoc', expected: 'TUG', region: 'Cordillera' },
  { origin: 'Manila', destination: 'Batad', expected: 'TUG', region: 'Cordillera' },
  { origin: 'Manila', destination: 'Vigan', expected: 'LAO', region: 'Ilocos' },
  { origin: 'Manila', destination: 'Pagudpud', expected: 'LAO', region: 'Ilocos' },
  { origin: 'Manila', destination: 'Laoag', expected: 'LAO', region: 'Ilocos' },
  { origin: 'Manila', destination: 'Baguio', expected: 'BAG', region: 'Cordillera' },
  
  // === LUZON - CENTRAL ===
  { origin: 'Manila', destination: 'La Union', expected: 'MNL', region: 'Ilocos' },
  { origin: 'Manila', destination: 'Hundred Islands', expected: 'MNL', region: 'Pangasinan' },
  { origin: 'Manila', destination: 'Alaminos', expected: 'MNL', region: 'Pangasinan' },
  { origin: 'Manila', destination: 'Anilao', expected: 'MNL', region: 'Batangas' },
  { origin: 'Manila', destination: 'Nasugbu', expected: 'MNL', region: 'Batangas' },
  { origin: 'Manila', destination: 'Puerto Galera', expected: 'MNL', region: 'Mindoro' },
  
  // === LUZON - SOUTHERN (BICOL) ===
  { origin: 'Manila', destination: 'Legazpi', expected: 'LGP', region: 'Bicol' },
  { origin: 'Manila', destination: 'Donsol', expected: 'LGP', region: 'Bicol' },
  { origin: 'Manila', destination: 'Calaguas', expected: 'LGP', region: 'Bicol' },
  { origin: 'Manila', destination: 'Daet', expected: 'LGP', region: 'Bicol' },
  { origin: 'Manila', destination: 'Naga', expected: 'WNP', region: 'Bicol' },
  { origin: 'Manila', destination: 'Masbate', expected: 'MBT', region: 'Bicol' },
  
  // === VISAYAS - CEBU ===
  { origin: 'Manila', destination: 'Cebu City', expected: 'CEB', region: 'Cebu' },
  { origin: 'Manila', destination: 'Moalboal', expected: 'CEB', region: 'Cebu' },
  { origin: 'Manila', destination: 'Oslob', expected: 'CEB', region: 'Cebu' },
  { origin: 'Manila', destination: 'Malapascua', expected: 'CEB', region: 'Cebu' },
  { origin: 'Manila', destination: 'Bantayan Island', expected: 'CEB', region: 'Cebu' },
  { origin: 'Manila', destination: 'Camotes Islands', expected: 'CEB', region: 'Cebu' },
  
  // === VISAYAS - BOHOL ===
  { origin: 'Manila', destination: 'Bohol', expected: 'TAG', region: 'Bohol' },
  { origin: 'Manila', destination: 'Panglao', expected: 'TAG', region: 'Bohol' },
  { origin: 'Manila', destination: 'Chocolate Hills', expected: 'TAG', region: 'Bohol' },
  { origin: 'Manila', destination: 'Anda', expected: 'TAG', region: 'Bohol' },
  
  // === VISAYAS - NEGROS ===
  { origin: 'Manila', destination: 'Dumaguete', expected: 'DGT', region: 'Negros Oriental' },
  { origin: 'Manila', destination: 'Siquijor', expected: 'DGT', region: 'Negros Oriental' },
  { origin: 'Manila', destination: 'Apo Island', expected: 'DGT', region: 'Negros Oriental' },
  { origin: 'Manila', destination: 'Dauin', expected: 'DGT', region: 'Negros Oriental' },
  { origin: 'Manila', destination: 'Bacolod', expected: 'BCD', region: 'Negros Occidental' },
  
  // === VISAYAS - PANAY ===
  { origin: 'Manila', destination: 'Boracay', expected: 'MPH', region: 'Aklan' },
  { origin: 'Manila', destination: 'Caticlan', expected: 'MPH', region: 'Aklan' },
  { origin: 'Manila', destination: 'Kalibo', expected: 'KLO', region: 'Aklan' },
  { origin: 'Manila', destination: 'Iloilo', expected: 'ILO', region: 'Iloilo' },
  { origin: 'Manila', destination: 'Guimaras', expected: 'ILO', region: 'Iloilo' },
  { origin: 'Manila', destination: 'Antique', expected: 'ILO', region: 'Panay' },
  
  // === PALAWAN ===
  { origin: 'Manila', destination: 'Puerto Princesa', expected: 'PPS', region: 'Palawan' },
  { origin: 'Manila', destination: 'El Nido', expected: 'PPS', region: 'Palawan' },
  { origin: 'Manila', destination: 'Coron', expected: 'USU', region: 'Palawan' },
  { origin: 'Manila', destination: 'Sabang', expected: 'PPS', region: 'Palawan' },
  { origin: 'Manila', destination: 'Port Barton', expected: 'PPS', region: 'Palawan' },
  { origin: 'Manila', destination: 'Balabac', expected: 'PPS', region: 'Palawan' },
  
  // === MINDANAO - DAVAO ===
  { origin: 'Manila', destination: 'Davao City', expected: 'DVO', region: 'Davao' },
  { origin: 'Manila', destination: 'Samal Island', expected: 'DVO', region: 'Davao' },
  { origin: 'Manila', destination: 'Mati', expected: 'DVO', region: 'Davao' },
  
  // === MINDANAO - NORTHERN ===
  { origin: 'Manila', destination: 'Cagayan de Oro', expected: 'CGY', region: 'Northern Mindanao' },
  { origin: 'Manila', destination: 'Camiguin', expected: 'CGY', region: 'Northern Mindanao' },
  { origin: 'Manila', destination: 'Bukidnon', expected: 'CGY', region: 'Northern Mindanao' },
  { origin: 'Manila', destination: 'Iligan', expected: 'CGY', region: 'Northern Mindanao' },
  
  // === MINDANAO - CARAGA ===
  { origin: 'Manila', destination: 'Siargao', expected: 'IAO', region: 'Caraga' },
  { origin: 'Manila', destination: 'General Luna', expected: 'IAO', region: 'Caraga' },
  { origin: 'Manila', destination: 'Cloud 9', expected: 'IAO', region: 'Caraga' },
  { origin: 'Manila', destination: 'Butuan', expected: 'BXU', region: 'Caraga' },
  { origin: 'Manila', destination: 'Surigao', expected: 'SUG', region: 'Caraga' },
  
  // === MINDANAO - ZAMBOANGA ===
  { origin: 'Manila', destination: 'Zamboanga City', expected: 'ZAM', region: 'Zamboanga' },
  { origin: 'Manila', destination: 'Pagadian', expected: 'PAG', region: 'Zamboanga' },
  { origin: 'Manila', destination: 'Dipolog', expected: 'DPL', region: 'Zamboanga' },
  
  // === MINDANAO - SOCCSKSARGEN ===
  { origin: 'Manila', destination: 'General Santos', expected: 'GES', region: 'SOCCSKSARGEN' },
  { origin: 'Manila', destination: 'Lake Sebu', expected: 'GES', region: 'SOCCSKSARGEN' },
  { origin: 'Manila', destination: 'Cotabato', expected: 'CBO', region: 'BARMM' },
  
  // === CROSS-REGION TESTS (Non-Manila Origins) ===
  { origin: 'Zamboanga City', destination: 'Sagada', expected: 'TUG', region: 'Cross-Region' },
  { origin: 'Cebu', destination: 'Siargao', expected: 'IAO', region: 'Cross-Region' },
  { origin: 'Davao', destination: 'El Nido', expected: 'PPS', region: 'Cross-Region' },
  { origin: 'Iloilo', destination: 'Boracay', expected: 'MPH', region: 'Cross-Region' },
  { origin: 'Cagayan de Oro', destination: 'Vigan', expected: 'LAO', region: 'Cross-Region' },
];

let passed = 0;
let failed = 0;
const failures = [];

console.log(`\n📋 Testing ${testCases.length} Routes Across Philippine Regions:\n`);

// Group by region for better readability
const byRegion = {};
testCases.forEach(test => {
  if (!byRegion[test.region]) byRegion[test.region] = [];
  byRegion[test.region].push(test);
});

Object.entries(byRegion).forEach(([region, tests]) => {
  console.log(`\n🏝️  ${region.toUpperCase()}`);
  console.log('-'.repeat(70));
  
  tests.forEach(test => {
    const originCode = getAirportCode(test.origin);
    const destinationCode = getAirportCode(test.destination);
    const success = destinationCode === test.expected;
    
    if (success) {
      console.log(`   ✅ ${test.origin} → ${test.destination}: ${destinationCode}`);
      passed++;
    } else {
      console.log(`   ❌ ${test.origin} → ${test.destination}: Got ${destinationCode}, expected ${test.expected}`);
      failures.push({ ...test, got: destinationCode });
      failed++;
    }
  });
});

console.log('\n' + '='.repeat(70));
console.log('\n📊 Test Results:');
console.log(`   ✅ Passed: ${passed}/${testCases.length} (${((passed / testCases.length) * 100).toFixed(1)}%)`);
console.log(`   ❌ Failed: ${failed}/${testCases.length}`);

if (failed > 0) {
  console.log('\n⚠️  Failed Routes:');
  failures.forEach(f => {
    console.log(`   • ${f.origin} → ${f.destination}: Expected ${f.expected}, got ${f.got}`);
  });
}

console.log('\n' + '='.repeat(70));

if (failed === 0) {
  console.log('\n🎉 SUCCESS! All Philippine destinations route correctly!\n');
  console.log('✈️  Coverage includes:');
  console.log('   • Luzon: Cordillera, Ilocos, Central, Bicol');
  console.log('   • Visayas: Cebu, Bohol, Negros, Panay');
  console.log('   • Palawan: Puerto Princesa, El Nido, Coron');
  console.log('   • Mindanao: Davao, Northern, Caraga, Zamboanga, SOCCSKSARGEN\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some destinations need airport mapping fixes.\n');
  process.exit(1);
}
