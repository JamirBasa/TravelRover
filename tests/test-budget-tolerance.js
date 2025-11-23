/**
 * Test: Budget Tolerance Validation
 * 
 * Validates that the new 15% budget tolerance correctly handles
 * real-world pricing scenarios without unnecessary failures.
 */

import { validateBudgetCompliance } from '../src/utils/budgetCompliance.js';

console.log('\n🧪 Testing Budget Tolerance (15% Buffer)\n');
console.log('='.repeat(60));

// Test the exact scenario from the user's error
const userBudget = 20800;
const actualCost = 23020;
const overage = actualCost - userBudget; // 2,220
const overagePercent = ((overage / userBudget) * 100).toFixed(1); // 10.7%

console.log('\n📊 User\'s Scenario:');
console.log(`   Budget: ₱${userBudget.toLocaleString()}`);
console.log(`   Actual Cost: ₱${actualCost.toLocaleString()}`);
console.log(`   Overage: ₱${overage.toLocaleString()} (${overagePercent}%)`);
console.log(`   15% Buffer: ₱${(userBudget * 0.15).toLocaleString()} (allows up to ₱${(userBudget * 1.15).toLocaleString()})`);
console.log(`   Within tolerance? ${actualCost <= userBudget * 1.15 ? '✅ YES' : '❌ NO'}`);

// Mock trip data matching user's scenario
const mockTripData = {
  userBudget: userBudget,
  grandTotal: {
    totalCost: actualCost
  },
  withinBudget: false, // AI marked as false because it exceeded strict budget
  dailyCosts: [
    { day: 1, breakdown: { accommodation: 2000, meals: 500, activities: 1000, transport: 300, subtotal: 3800 } },
    { day: 2, breakdown: { accommodation: 2000, meals: 500, activities: 1000, transport: 300, subtotal: 3800 } },
    { day: 3, breakdown: { accommodation: 2000, meals: 500, activities: 1000, transport: 300, subtotal: 3800 } },
    { day: 4, breakdown: { accommodation: 2000, meals: 500, activities: 1000, transport: 300, subtotal: 3800 } },
    { day: 5, breakdown: { accommodation: 2000, meals: 500, activities: 1000, transport: 300, subtotal: 3800 } },
    { day: 6, breakdown: { accommodation: 2000, meals: 520, activities: 1000, transport: 300, subtotal: 3820 } }
  ]
};

console.log('\n\n🔍 Validation Test Cases:\n');

// Test Case 1: User's exact scenario (10.7% over - should PASS with new tolerance)
console.log('1️⃣ User\'s Scenario (₱23,020 / ₱20,800 budget = 10.7% over)');
const result1 = validateBudgetCompliance(mockTripData);
console.log(`   Result: ${result1.isValid ? '✅ PASS' : '❌ FAIL'}`);
if (!result1.isValid) {
  console.log(`   Errors: ${result1.errors.join('; ')}`);
}
if (result1.warnings.length > 0) {
  console.log(`   Warnings: ${result1.warnings.join('; ')}`);
}

// Test Case 2: Within budget (should PASS)
console.log('\n2️⃣ Within Budget (₱20,000 / ₱20,800 budget = 3.8% under)');
const mockWithinBudget = { ...mockTripData, grandTotal: { totalCost: 20000 }, withinBudget: true };
const result2 = validateBudgetCompliance(mockWithinBudget);
console.log(`   Result: ${result2.isValid ? '✅ PASS' : '❌ FAIL'}`);

// Test Case 3: Exactly 15% over (should PASS at boundary)
const buffer15Percent = Math.round(userBudget * 1.15);
console.log(`\n3️⃣ Exactly 15% Over (₱${buffer15Percent.toLocaleString()} / ₱20,800 budget = 15.0% over)`);
const mockAt15Percent = { ...mockTripData, grandTotal: { totalCost: buffer15Percent }, withinBudget: false };
const result3 = validateBudgetCompliance(mockAt15Percent);
console.log(`   Result: ${result3.isValid ? '✅ PASS (within tolerance)' : '❌ FAIL'}`);

// Test Case 4: 16% over (should FAIL - exceeds tolerance)
const over16Percent = Math.round(userBudget * 1.16);
console.log(`\n4️⃣ 16% Over Budget (₱${over16Percent.toLocaleString()} / ₱20,800 budget = 16.0% over)`);
const mockOver16Percent = { ...mockTripData, grandTotal: { totalCost: over16Percent }, withinBudget: false };
const result4 = validateBudgetCompliance(mockOver16Percent);
console.log(`   Result: ${result4.isValid ? '✅ PASS' : '❌ FAIL (expected)'}`);
if (!result4.isValid) {
  console.log(`   Errors: ${result4.errors[0]}`);
}

// Test Case 5: Slightly over budget (8% - should PASS with warning)
const over8Percent = Math.round(userBudget * 1.08);
console.log(`\n5️⃣ 8% Over Budget (₱${over8Percent.toLocaleString()} / ₱20,800 budget = 8.0% over)`);
const mockOver8Percent = { ...mockTripData, grandTotal: { totalCost: over8Percent }, withinBudget: false };
const result5 = validateBudgetCompliance(mockOver8Percent);
console.log(`   Result: ${result5.isValid ? '✅ PASS' : '❌ FAIL'}`);
if (result5.warnings.length > 0) {
  console.log(`   Warnings: ${result5.warnings[0]}`);
}

console.log('\n' + '='.repeat(60));
console.log('\n📈 Summary:');
console.log(`   Old tolerance (5%): Would reject at ${(userBudget * 1.05).toLocaleString()}`);
console.log(`   New tolerance (15%): Accepts up to ${(userBudget * 1.15).toLocaleString()}`);
console.log(`   User's cost (${actualCost.toLocaleString()}): ${actualCost <= userBudget * 1.15 ? '✅ NOW ACCEPTED' : '❌ Still rejected'}`);
console.log('\n✨ Expected: User\'s scenario (10.7% over) should now PASS validation\n');

// Exit with appropriate code
if (result1.isValid && !result4.isValid) {
  console.log('🎉 All tests behaving as expected!\n');
  process.exit(0);
} else {
  console.log('⚠️ Unexpected behavior detected\n');
  process.exit(1);
}
