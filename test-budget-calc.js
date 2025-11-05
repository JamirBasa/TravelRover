// Test Budget Calculation for 8-day trip
// This verifies if ₱13,280 minimum is accurate

const BASE_DAILY_COSTS = {
  'budget-friendly': {
    accommodation: 800,      // ₱800/night
    food: 600,              // ₱600/day
    activities: 400,        // ₱400/day
    transport: 300,         // ₱300/day
    miscellaneous: 200,     // ₱200/day
  },
};

// Example: 8-day trip to Cebu, 1 traveler, no flights
const destination = "Cebu";
const duration = 8;
const travelers = 1;
const includeFlights = false;

// Cost factors
const regionCode = 'r07'; // Central Visayas (Cebu)
const costIndex = 95; // Cebu cost of living (relative to Manila = 100)
const destMultiplier = 1.15; // Cebu city multiplier (tourist destination)

// Calculate daily cost
const dailyCosts = BASE_DAILY_COSTS['budget-friendly'];
let dailyCostPerPerson = Object.values(dailyCosts).reduce((sum, cost) => sum + cost, 0);

console.log("📊 STEP-BY-STEP BUDGET CALCULATION FOR 8-DAY CEBU TRIP");
console.log("=" .repeat(60));
console.log("\n1️⃣ BASE DAILY COSTS (Budget-Friendly):");
console.log(`   Accommodation: ₱${dailyCosts.accommodation}`);
console.log(`   Food: ₱${dailyCosts.food}`);
console.log(`   Activities: ₱${dailyCosts.activities}`);
console.log(`   Transport: ₱${dailyCosts.transport}`);
console.log(`   Miscellaneous: ₱${dailyCosts.miscellaneous}`);
console.log(`   ───────────────────────────`);
console.log(`   Subtotal: ₱${dailyCostPerPerson}/day`);

// Apply regional adjustments
dailyCostPerPerson = dailyCostPerPerson * (costIndex / 100) * destMultiplier;
console.log(`\n2️⃣ REGIONAL ADJUSTMENTS:`);
console.log(`   Base cost: ₱${Object.values(dailyCosts).reduce((sum, cost) => sum + cost, 0)}`);
console.log(`   × Cost index: ${costIndex}/100 = ${costIndex/100}`);
console.log(`   × Destination multiplier: ${destMultiplier}`);
console.log(`   = ₱${Math.round(dailyCostPerPerson)}/day per person`);

// Calculate total
let totalCost = dailyCostPerPerson * duration * travelers;
totalCost = Math.round(totalCost / 100) * 100; // Round to nearest 100

console.log(`\n3️⃣ TOTAL BUDGET (Budget-Friendly Tier):`);
console.log(`   ₱${Math.round(dailyCostPerPerson)}/day × ${duration} days × ${travelers} traveler(s)`);
console.log(`   = ₱${totalCost.toLocaleString()}`);

// Calculate minimum (80%)
const minimumBudget = Math.floor(totalCost * 0.8);

console.log(`\n4️⃣ MINIMUM RECOMMENDED BUDGET:`);
console.log(`   Budget-friendly tier: ₱${totalCost.toLocaleString()}`);
console.log(`   × 0.8 (80% threshold)`);
console.log(`   = ₱${minimumBudget.toLocaleString()}`);

// Breakdown of what minimum covers
const minAccommodation = Math.floor(dailyCosts.accommodation * (costIndex / 100) * destMultiplier * 0.8 * duration);
const minFood = Math.floor(dailyCosts.food * (costIndex / 100) * destMultiplier * 0.8 * duration);
const minActivities = Math.floor(dailyCosts.activities * (costIndex / 100) * destMultiplier * 0.8 * duration);
const minTransport = Math.floor(dailyCosts.transport * (costIndex / 100) * destMultiplier * 0.8 * duration);
const minMisc = Math.floor(dailyCosts.miscellaneous * (costIndex / 100) * destMultiplier * 0.8 * duration);

console.log(`\n5️⃣ WHAT ₱${minimumBudget.toLocaleString()} COVERS (8 days):`);
console.log(`   🏨 Accommodation: ₱${minAccommodation.toLocaleString()} (₱${Math.round(minAccommodation/duration)}/night)`);
console.log(`   🍽️  Food: ₱${minFood.toLocaleString()} (₱${Math.round(minFood/duration)}/day)`);
console.log(`   🎯 Activities: ₱${minActivities.toLocaleString()} (₱${Math.round(minActivities/duration)}/day)`);
console.log(`   🚌 Transport: ₱${minTransport.toLocaleString()} (₱${Math.round(minTransport/duration)}/day)`);
console.log(`   💰 Miscellaneous: ₱${minMisc.toLocaleString()} (₱${Math.round(minMisc/duration)}/day)`);

console.log(`\n6️⃣ ANALYSIS:`);
console.log(`   ✅ Is ₱${minimumBudget.toLocaleString()} realistic?`);

const perNight = Math.round(minAccommodation/duration);
const perMeal = Math.round(minFood/duration/3); // 3 meals per day
const perDay = Math.round(minimumBudget/duration);

if (perNight < 500) {
  console.log(`   ⚠️  ${perNight}/night accommodation might be TOO LOW (hostels usually ₱500-800)`);
} else if (perNight < 700) {
  console.log(`   ⚠️  ₱${perNight}/night is TIGHT (basic hostels/budget hotels)`);
} else {
  console.log(`   ✅ ₱${perNight}/night is reasonable for budget accommodation`);
}

if (perMeal < 100) {
  console.log(`   ⚠️  ₱${perMeal}/meal is VERY TIGHT (street food only)`);
} else if (perMeal < 150) {
  console.log(`   ⚠️  ₱${perMeal}/meal is TIGHT (carinderia/street food)`);
} else {
  console.log(`   ✅ ₱${perMeal}/meal allows local restaurants`);
}

console.log(`\n7️⃣ RECOMMENDATIONS:`);
if (minimumBudget < 15000 && duration >= 8) {
  console.log(`   💡 For an 8-day trip, consider raising minimum to ₱15,000-18,000`);
  console.log(`   💡 This ensures comfortable budget-friendly experience`);
  console.log(`   💡 Current minimum assumes VERY tight budget (hostels + street food)`);
} else {
  console.log(`   ✅ Minimum budget appears reasonable for very budget-conscious travelers`);
}

console.log("\n" + "=".repeat(60));
console.log(`\n✨ VERDICT: ${minimumBudget < 15000 && duration >= 8 ? 'MINIMUM TOO LOW - SHOULD BE ADJUSTED' : 'MINIMUM REASONABLE'}`);
