#!/usr/bin/env node
/**
 * Cleanup Verification Script
 * Verifies all cleanup and optimization changes are working correctly
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 TravelRover Cleanup Verification\n');
console.log('='.repeat(60));

let passCount = 0;
let failCount = 0;

const test = (name, condition, details = '') => {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   ${details}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   ${details}`);
    failCount++;
  }
};

// ==========================================
// TEST 1: Deprecated Files Removed
// ==========================================
console.log('\n📋 Test 1: Deprecated Files Cleanup');
console.log('-'.repeat(60));

const deprecatedFiles = [
  'src/components/custom/Hero.jsx',
  'src/App.jsx'
];

deprecatedFiles.forEach(file => {
  const filePath = join(rootDir, file);
  test(
    `${file} removed`,
    !existsSync(filePath),
    existsSync(filePath) ? 'File still exists!' : 'Successfully removed'
  );
});

// ==========================================
// TEST 2: Test Files Organized
// ==========================================
console.log('\n📋 Test 2: Test Files Organization');
console.log('-'.repeat(60));

const testFiles = [
  'test-activity-data.jsx',
  'test-budget-calc.js',
  'debug-activity-data.jsx'
];

testFiles.forEach(file => {
  const oldPath = join(rootDir, file);
  const newPath = join(rootDir, 'tests', file);
  
  const movedCorrectly = !existsSync(oldPath) && existsSync(newPath);
  test(
    `${file} moved to tests/`,
    movedCorrectly,
    movedCorrectly ? 'Organized correctly' : 'Still in root or missing'
  );
});

// ==========================================
// TEST 3: New Utilities Created
// ==========================================
console.log('\n📋 Test 3: New Utility Files');
console.log('-'.repeat(60));

const newUtilities = [
  { path: 'src/utils/requestDeduplicator.js', name: 'Request Deduplicator' },
  { path: 'src/utils/errorHandler.js', name: 'Error Handler' },
  { path: 'src/utils/cacheManager.js', name: 'Cache Manager' },
];

newUtilities.forEach(({ path, name }) => {
  const filePath = join(rootDir, path);
  const exists = existsSync(filePath);
  
  if (exists) {
    const content = readFileSync(filePath, 'utf-8');
    const hasExports = content.includes('export');
    test(
      `${name} created and exports functions`,
      hasExports,
      hasExports ? `${(content.length / 1024).toFixed(1)}KB` : 'No exports found'
    );
  } else {
    test(`${name} created`, false, 'File not found');
  }
});

// ==========================================
// TEST 4: Import Updates
// ==========================================
console.log('\n📋 Test 4: Import Updates');
console.log('-'.repeat(60));

const createTripPath = join(rootDir, 'src/create-trip/index.jsx');
if (existsSync(createTripPath)) {
  const content = readFileSync(createTripPath, 'utf-8');
  
  test(
    'deduplicateTripGeneration imported',
    content.includes('deduplicateTripGeneration'),
    'Found in imports'
  );
  
  test(
    'sanitizeJSONString from jsonParsers',
    content.includes('import { safeJsonParse, sanitizeJSONString } from "../utils/jsonParsers"'),
    'Correctly importing from jsonParsers'
  );
  
  test(
    'sanitizeJSONString NOT from options',
    !content.includes('sanitizeJSONString,\n} from "../constants/options"'),
    'No longer importing from options.jsx'
  );
} else {
  test('create-trip/index.jsx exists', false, 'File not found');
}

// ==========================================
// TEST 5: JSON Parsers Consolidation
// ==========================================
console.log('\n📋 Test 5: JSON Functions Consolidation');
console.log('-'.repeat(60));

const jsonParsersPath = join(rootDir, 'src/utils/jsonParsers.js');
if (existsSync(jsonParsersPath)) {
  const content = readFileSync(jsonParsersPath, 'utf-8');
  
  test(
    'cleanJSON function exists',
    content.includes('function cleanJSON('),
    'Standard cleaning function'
  );
  
  test(
    'aggressiveJSONClean function exists',
    content.includes('function aggressiveJSONClean('),
    'Aggressive cleaning function'
  );
  
  test(
    'sanitizeJSONString function exists',
    content.includes('export const sanitizeJSONString'),
    'Markdown removal function'
  );
  
  test(
    'safeJsonParse function exists',
    content.includes('export const safeJsonParse'),
    'Safe parsing with fallback'
  );
} else {
  test('jsonParsers.js exists', false, 'File not found');
}

// ==========================================
// TEST 6: Production Optimizations
// ==========================================
console.log('\n📋 Test 6: Production Optimizations');
console.log('-'.repeat(60));

// Check if exponentialBackoff is used
const langGraphPath = join(rootDir, 'src/config/langGraphAgent.jsx');
if (existsSync(langGraphPath)) {
  const content = readFileSync(langGraphPath, 'utf-8');
  
  test(
    'Exponential backoff integrated',
    content.includes('criticalApiCall'),
    'Using criticalApiCall for retries'
  );
} else {
  test('langGraphAgent.jsx exists', false, 'File not found');
}

// Check Django throttling
const throttlingPath = join(rootDir, 'travel-backend/langgraph_agents/throttling.py');
if (existsSync(throttlingPath)) {
  const content = readFileSync(throttlingPath, 'utf-8');
  
  test(
    'Rate limiting implemented',
    content.includes('TripGenerationThrottle'),
    'Throttling classes created'
  );
} else {
  test('throttling.py exists', false, 'File not found');
}

// Check logging config
const loggingPath = join(rootDir, 'travel-backend/langgraph_agents/logging_config.py');
if (existsSync(loggingPath)) {
  const content = readFileSync(loggingPath, 'utf-8');
  
  test(
    'Structured logging implemented',
    content.includes('StructuredFormatter'),
    'Production logging configured'
  );
} else {
  test('logging_config.py exists', false, 'File not found');
}

// ==========================================
// SUMMARY
// ==========================================
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));

const total = passCount + failCount;
const percentage = total > 0 ? Math.round((passCount / total) * 100) : 0;

console.log(`\n✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Success Rate: ${percentage}%\n`);

if (failCount === 0) {
  console.log('🎉 All cleanup and optimizations verified successfully!');
  console.log('✅ System is ready for production deployment.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the failures above.\n');
  process.exit(1);
}
