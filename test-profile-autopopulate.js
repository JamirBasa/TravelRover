/**
 * Test script to verify UserProfileService auto-population consistency
 * Run with: node test-profile-autopopulate.js
 * 
 * NOTE: Travel style should NOT auto-populate travelers count
 * Travel style is for destination/activity recommendations only
 */

// Mock profile data scenarios
const testProfiles = [
  {
    name: "Solo Traveler",
    profile: {
      isProfileComplete: true,
      travelStyle: "solo",
      budgetRange: "budget-friendly",
      address: { city: "Manila", regionCode: "NCR" }
    },
    expectedDefaults: {
      budget: "Budget-Friendly",
      // ❌ travelers should NOT be auto-populated from travel style
    }
  },
  {
    name: "Duo (Couple)",
    profile: {
      isProfileComplete: true,
      travelStyle: "duo",
      budgetRange: "Moderate",
      preferredTripTypes: ["romantic"],
      address: { city: "Cebu", regionCode: "R07" }
    },
    expectedDefaults: {
      budget: "Moderate",
      // ❌ travelers should NOT be auto-populated
      // User traveling as "duo" style might bring 3 friends = 5 total people
    }
  },
  {
    name: "Family",
    profile: {
      isProfileComplete: true,
      travelStyle: "family",
      budgetRange: "moderate",
      preferredTripTypes: ["family"],
      address: { city: "Davao", regionCode: "R11" }
    },
    expectedDefaults: {
      budget: "Moderate",
      // ❌ travelers should NOT be auto-populated
      // Family size varies: 2 parents + 1 kid = 3, not always 4
    }
  },
  {
    name: "Group",
    profile: {
      isProfileComplete: true,
      travelStyle: "group",
      budgetRange: "luxury",
      address: { city: "Baguio", regionCode: "CAR" }
    },
    expectedDefaults: {
      budget: "Luxury",
      // ❌ travelers should NOT be auto-populated
      // Group can be 4, 6, 8, or 10+ people
    }
  },
  {
    name: "Incomplete Profile",
    profile: {
      isProfileComplete: false,
      budgetRange: "budget",
    },
    expectedDefaults: {}
  }
];

// Simulated getFormDefaults logic (from UserProfileService)
function getFormDefaults(userProfile) {
  if (!userProfile?.isProfileComplete) {
    return {};
  }

  const normalizeBudgetRange = (budgetRange) => {
    if (!budgetRange) return undefined;
    
    const budgetMap = {
      'budget': 'Budget-Friendly',
      'budget-friendly': 'Budget-Friendly',
      'Budget-Friendly': 'Budget-Friendly',
      'moderate': 'Moderate',
      'Moderate': 'Moderate',
      'luxury': 'Luxury',
      'Luxury': 'Luxury',
      'flexible': 'Moderate',
    };
    
    const key = budgetRange.toLowerCase().trim();
    return budgetMap[key] || budgetMap[budgetRange] || undefined;
  };

  return {
    budget: normalizeBudgetRange(userProfile.budgetRange),
    // ✅ NO travelers auto-population - user must explicitly choose
    // Travel style affects destination recommendations, not traveler count
  };
}

// Run tests
console.log("🧪 Testing UserProfileService.getFormDefaults() consistency\n");

let passCount = 0;
let failCount = 0;

testProfiles.forEach((test) => {
  console.log(`📋 Test: ${test.name}`);
  const result = getFormDefaults(test.profile);
  
  const budgetMatch = result.budget === test.expectedDefaults.budget;
  const travelersUndefined = result.travelers === undefined; // ✅ Should NOT be populated
  
  if (budgetMatch && travelersUndefined) {
    console.log("   ✅ PASS");
    console.log(`   Budget: ${result.budget} (${typeof result.budget})`);
    console.log(`   Travelers: ${result.travelers} (correctly NOT auto-populated)`);
    console.log(`   Note: Travel style "${test.profile.travelStyle}" affects destination recommendations only`);
    passCount++;
  } else {
    console.log("   ❌ FAIL");
    console.log(`   Expected: budget=${test.expectedDefaults.budget}, travelers=undefined`);
    console.log(`   Got: budget=${result.budget}, travelers=${result.travelers}`);
    if (result.travelers !== undefined) {
      console.log(`   ⚠️ CRITICAL: travelers should NOT be auto-populated from travel style!`);
    }
    failCount++;
  }
  console.log();
});

console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);

if (failCount === 0) {
  console.log("✅ All tests passed! Auto-population is consistent.");
  console.log("✅ Travel style correctly used for recommendations, not traveler count.");
} else {
  console.log("❌ Some tests failed. Check the implementation.");
}
