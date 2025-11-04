/**
 * Test Philippine Time (PHT) Utilities
 * Run this in browser console to verify PHT implementation
 */

import { 
  getPHTNow, 
  calculatePHTDays, 
  isPastDatePHT, 
  formatPHTDate,
  getMinDatePHT,
  getPHTInfo
} from './src/utils/philippineTime.js';

console.log('🕐 Philippine Time (PHT) Implementation Test');
console.log('='.repeat(50));

// Test 1: Current PHT Time
const now = getPHTNow();
console.log('\n✅ Test 1: Current PHT Time');
console.log('Current PHT:', now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
console.log('ISO Format:', now.toISOString());

// Test 2: Date Formatting
console.log('\n✅ Test 2: Date Formatting');
const testDate = '2024-12-25';
console.log('Input:', testDate);
console.log('Formatted:', formatPHTDate(testDate));

// Test 3: Date Calculations
console.log('\n✅ Test 3: Date Calculations (Inclusive)');
const start = '2024-12-20';
const end = '2024-12-25';
const days = calculatePHTDays(start, end);
console.log(`${start} to ${end} = ${days} days`);
console.log('Expected: 6 days (inclusive)');

// Test 4: Past Date Check
console.log('\n✅ Test 4: Past Date Validation');
console.log('2024-01-01 is past?', isPastDatePHT('2024-01-01')); // true
console.log('2025-12-31 is past?', isPastDatePHT('2025-12-31')); // false

// Test 5: Minimum Date (Tomorrow)
console.log('\n✅ Test 5: Minimum Date for Date Picker');
const minDate = getMinDatePHT();
console.log('Tomorrow (PHT):', minDate);

// Test 6: Timezone Info
console.log('\n✅ Test 6: Timezone Information');
const tzInfo = getPHTInfo();
console.log('Timezone:', tzInfo.timezone);
console.log('Offset:', tzInfo.offset);
console.log('Name:', tzInfo.name);

// Test 7: Edge Cases
console.log('\n✅ Test 7: Edge Cases');
console.log('Same day duration:', calculatePHTDays('2024-12-20', '2024-12-20')); // 1
console.log('Invalid date:', formatPHTDate('invalid')); // ''
console.log('Null date:', isPastDatePHT(null)); // false

console.log('\n' + '='.repeat(50));
console.log('✅ All PHT tests completed!');
console.log('📍 All dates are now processed in Philippine Time (UTC+8)');
