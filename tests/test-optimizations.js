#!/usr/bin/env node
/**
 * Comprehensive Test Suite for Production Optimizations
 * Validates all new utilities and consolidations
 * 
 * Run: node tests/test-optimizations.js
 */

console.log('🚀 TravelRover Production Optimizations Test Suite\n');
console.log('=' .repeat(60));

let passedTests = 0;
let failedTests = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
    results.push({ name, status: 'PASS' });
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${error.message}`);
    failedTests++;
    results.push({ name, status: 'FAIL', error: error.message });
  }
}

// ==========================================
// TEST 1: Request Deduplicator
// ==========================================
console.log('\n📋 Testing Request Deduplicator...\n');

test('RequestDeduplicator - Basic deduplication', async () => {
  const { RequestDeduplicator } = await import('../src/utils/requestDeduplicator.js');
  const deduplicator = new RequestDeduplicator();
  
  let callCount = 0;
  const mockFn = async () => {
    callCount++;
    return 'result';
  };
  
  // Make 3 identical requests
  const promises = [
    deduplicator.deduplicate('test-key', mockFn),
    deduplicator.deduplicate('test-key', mockFn),
    deduplicator.deduplicate('test-key', mockFn),
  ];
  
  await Promise.all(promises);
  
  if (callCount !== 1) {
    throw new Error(`Expected 1 call, got ${callCount}`);
  }
});

test('RequestDeduplicator - Generate key from params', async () => {
  const { RequestDeduplicator } = await import('../src/utils/requestDeduplicator.js');
  const deduplicator = new RequestDeduplicator();
  
  const key1 = deduplicator.generateKey({ location: 'Palawan', duration: 3 });
  const key2 = deduplicator.generateKey({ duration: 3, location: 'Palawan' });
  
  if (key1 !== key2) {
    throw new Error('Keys should be identical for same params');
  }
});

test('RequestDeduplicator - Statistics tracking', async () => {
  const { RequestDeduplicator } = await import('../src/utils/requestDeduplicator.js');
  const deduplicator = new RequestDeduplicator();
  
  const stats = deduplicator.getStats();
  
  if (!stats.hasOwnProperty('pendingRequests')) {
    throw new Error('Stats missing pendingRequests');
  }
  if (!stats.hasOwnProperty('maxCapacity')) {
    throw new Error('Stats missing maxCapacity');
  }
});

// ==========================================
// TEST 2: Error Handler
// ==========================================
console.log('\n📋 Testing Error Handler...\n');

test('ErrorHandler - API error categorization', async () => {
  const { ErrorHandler, ErrorCategory } = await import('../src/utils/errorHandler.js');
  
  const mockError = {
    response: {
      status: 429,
      data: { error: 'Rate limit exceeded' }
    }
  };
  
  const result = ErrorHandler.handleAPIError(mockError, { endpoint: '/test' });
  
  if (result.category !== ErrorCategory.RATE_LIMIT) {
    throw new Error(`Expected RATE_LIMIT category, got ${result.category}`);
  }
});

test('ErrorHandler - Timeout detection', async () => {
  const { ErrorHandler, ErrorCategory } = await import('../src/utils/errorHandler.js');
  
  const mockError = {
    code: 'ECONNABORTED',
    message: 'timeout'
  };
  
  const result = ErrorHandler.handleAPIError(mockError, { endpoint: '/test' });
  
  if (result.category !== ErrorCategory.TIMEOUT) {
    throw new Error(`Expected TIMEOUT category, got ${result.category}`);
  }
});

test('ErrorHandler - Network error detection', async () => {
  const { ErrorHandler, ErrorCategory } = await import('../src/utils/errorHandler.js');
  
  const mockError = {
    message: 'Network Error',
    // No response = network error
  };
  
  const result = ErrorHandler.handleAPIError(mockError, { endpoint: '/test' });
  
  if (result.category !== ErrorCategory.NETWORK) {
    throw new Error(`Expected NETWORK category, got ${result.category}`);
  }
});

// ==========================================
// TEST 3: Cache Manager
// ==========================================
console.log('\n📋 Testing Cache Manager...\n');

test('CacheManager - Basic caching', async () => {
  const { CacheManager } = await import('../src/utils/cacheManager.js');
  const cache = new CacheManager();
  
  let callCount = 0;
  const mockFn = async () => {
    callCount++;
    return 'data';
  };
  
  // First call - cache miss
  await cache.getOrFetch('key1', mockFn);
  
  // Second call - cache hit
  await cache.getOrFetch('key1', mockFn);
  
  if (callCount !== 1) {
    throw new Error(`Expected 1 call, got ${callCount}`);
  }
});

test('CacheManager - TTL expiration', async () => {
  const { CacheManager } = await import('../src/utils/cacheManager.js');
  const cache = new CacheManager();
  
  cache.set('test-key', 'test-value', 100); // 100ms TTL
  
  if (!cache.has('test-key')) {
    throw new Error('Key should exist immediately after set');
  }
  
  // Wait for TTL to expire
  await new Promise(resolve => setTimeout(resolve, 150));
  
  if (cache.has('test-key')) {
    throw new Error('Key should be expired after TTL');
  }
});

test('CacheManager - LRU eviction', async () => {
  const { CacheManager } = await import('../src/utils/cacheManager.js');
  const cache = new CacheManager({ maxSize: 2 });
  
  cache.set('key1', 'value1');
  cache.set('key2', 'value2');
  cache.set('key3', 'value3'); // Should evict key1
  
  if (cache.has('key1')) {
    throw new Error('key1 should have been evicted');
  }
  if (!cache.has('key2') || !cache.has('key3')) {
    throw new Error('key2 and key3 should still exist');
  }
});

test('CacheManager - Pattern invalidation', async () => {
  const { CacheManager } = await import('../src/utils/cacheManager.js');
  const cache = new CacheManager();
  
  cache.set('trip_123', 'data1');
  cache.set('trip_456', 'data2');
  cache.set('profile_789', 'data3');
  
  const invalidated = cache.invalidate('trip');
  
  if (invalidated !== 2) {
    throw new Error(`Expected 2 invalidations, got ${invalidated}`);
  }
  if (cache.has('trip_123') || cache.has('trip_456')) {
    throw new Error('Trip keys should be invalidated');
  }
  if (!cache.has('profile_789')) {
    throw new Error('Profile key should still exist');
  }
});

test('CacheManager - Statistics', async () => {
  const { CacheManager } = await import('../src/utils/cacheManager.js');
  const cache = new CacheManager();
  
  await cache.getOrFetch('key1', async () => 'value1'); // Miss
  await cache.getOrFetch('key1', async () => 'value1'); // Hit
  await cache.getOrFetch('key2', async () => 'value2'); // Miss
  
  const stats = cache.getStats();
  
  if (stats.hits !== 1) {
    throw new Error(`Expected 1 hit, got ${stats.hits}`);
  }
  if (stats.misses !== 2) {
    throw new Error(`Expected 2 misses, got ${stats.misses}`);
  }
});

// ==========================================
// TEST 4: JSON Parsers (Consolidated)
// ==========================================
console.log('\n📋 Testing JSON Parsers (Consolidated)...\n');

test('JSONParsers - sanitizeJSONString', async () => {
  const { sanitizeJSONString } = await import('../src/utils/jsonParsers.js');
  
  const input = '```json\n{"key": "value"}\n```';
  const result = sanitizeJSONString(input);
  
  if (result !== '{"key": "value"}') {
    throw new Error(`Expected clean JSON, got: ${result}`);
  }
});

test('JSONParsers - safeJsonParse with fallback', async () => {
  const { safeJsonParse } = await import('../src/utils/jsonParsers.js');
  
  const result = safeJsonParse('invalid json', { default: 'value' });
  
  if (result.default !== 'value') {
    throw new Error('Should return fallback for invalid JSON');
  }
});

test('JSONParsers - validateCoordinates', async () => {
  const { validateCoordinates } = await import('../src/utils/jsonParsers.js');
  
  const valid = validateCoordinates({ lat: 14.5995, lng: 120.9842 });
  
  if (valid.lat !== 14.5995 || valid.lng !== 120.9842) {
    throw new Error('Should return valid coordinates');
  }
  
  const fallback = { lat: 10.3157, lng: 123.8854 };
  const invalid = validateCoordinates({ lat: 'invalid', lng: 'invalid' }, fallback);
  
  if (invalid.lat !== fallback.lat || invalid.lng !== fallback.lng) {
    throw new Error('Should return fallback for invalid coordinates');
  }
});

// ==========================================
// TEST 5: Production Logger
// ==========================================
console.log('\n📋 Testing Production Logger...\n');

test('ProductionLogger - Error logging', async () => {
  const { logger } = await import('../src/utils/productionLogger.js');
  
  const error = new Error('Test error');
  const structured = logger.logError(error, { test: true });
  
  if (!structured.timestamp) {
    throw new Error('Structured error missing timestamp');
  }
  if (!structured.category) {
    throw new Error('Structured error missing category');
  }
});

test('ProductionLogger - Get statistics', async () => {
  const { logger } = await import('../src/utils/productionLogger.js');
  
  const stats = logger.getStats();
  
  if (!stats.hasOwnProperty('total')) {
    throw new Error('Stats missing total');
  }
  if (!stats.hasOwnProperty('byCategory')) {
    throw new Error('Stats missing byCategory');
  }
});

// ==========================================
// RESULTS SUMMARY
// ==========================================
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));

console.log(`\n✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%\n`);

if (failedTests > 0) {
  console.log('❌ FAILED TESTS:');
  results
    .filter(r => r.status === 'FAIL')
    .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  console.log('');
  process.exit(1);
} else {
  console.log('🎉 All tests passed! System is production-ready.\n');
  process.exit(0);
}
