/**
 * Budget Diagnostics Utility
 * 
 * Comprehensive diagnostic tools for debugging budget calculation issues
 * Use in browser console: import { runBudgetDiagnostics } from '@/utils/budgetDiagnostics'
 * Or call window.debugBudget(trip) after importing
 */

import { calculateTotalBudget, getUserBudget, parsePrice } from './budgetCalculator';

/**
 * Run comprehensive budget diagnostics on a trip object
 * @param {Object} trip - Trip object from Firebase
 * @returns {Object} - Diagnostic report with issues and recommendations
 */
export const runBudgetDiagnostics = (trip) => {
  console.group('💰 BUDGET DIAGNOSTICS REPORT');
  console.log('Trip ID:', trip?.id);
  console.log('Destination:', trip?.userSelection?.destination);
  
  const report = {
    tripId: trip?.id,
    timestamp: new Date().toISOString(),
    issues: [],
    warnings: [],
    recommendations: [],
    summary: {}
  };
  
  // ========================================
  // 1. USER BUDGET VALIDATION
  // ========================================
  console.group('1️⃣ User Budget Validation');
  
  const userBudget = getUserBudget(trip);
  const budgetAmount = trip?.userSelection?.budgetAmount;
  const customBudget = trip?.userSelection?.customBudget;
  
  console.log('Budget Amount Field:', budgetAmount, typeof budgetAmount);
  console.log('Custom Budget Field:', customBudget, typeof customBudget);
  console.log('Retrieved User Budget:', userBudget);
  
  if (!userBudget) {
    report.issues.push('❌ No user budget found - check budgetAmount or customBudget fields');
  } else if (userBudget < 1000) {
    report.warnings.push(`⚠️ User budget (₱${userBudget}) is very low - verify this is correct`);
  }
  
  report.summary.userBudget = userBudget;
  console.groupEnd();
  
  // ========================================
  // 2. TRAVELERS VALIDATION
  // ========================================
  console.group('2️⃣ Travelers Validation');
  
  const travelers = trip?.userSelection?.travelers;
  const travelersType = typeof travelers;
  const travelersNum = typeof travelers === 'number' ? travelers : 
                       typeof travelers === 'string' ? parseInt(travelers) || 1 : 1;
  
  console.log('Travelers Field:', travelers, travelersType);
  console.log('Parsed Travelers:', travelersNum);
  
  if (travelersType !== 'number') {
    report.warnings.push(`⚠️ Travelers stored as ${travelersType} instead of number - may cause calculation issues`);
    report.recommendations.push('Store travelers as numeric value in Firebase');
  }
  
  if (travelersNum < 1 || travelersNum > 20) {
    report.warnings.push(`⚠️ Travelers count (${travelersNum}) seems unusual`);
  }
  
  report.summary.travelers = travelersNum;
  console.groupEnd();
  
  // ========================================
  // 3. FLIGHTS COST ANALYSIS
  // ========================================
  console.group('3️⃣ Flights Cost Analysis');
  
  const realFlights = trip?.realFlightData?.flights;
  const aiFlights = trip?.tripData?.flights;
  
  console.log('Real Flight Data:', realFlights);
  console.log('AI Flight Data:', aiFlights);
  
  if (realFlights && Array.isArray(realFlights)) {
    let flightTotal = 0;
    
    realFlights.forEach((flight, index) => {
      console.group(`Flight ${index + 1}: ${flight.name || 'Unknown'}`);
      
      const flightReport = {
        name: flight.name,
        price: flight.price,
        numeric_price: flight.numeric_price,
        total_for_group: flight.total_for_group,
        price_per_person: flight.price_per_person,
        travelers: flight.travelers,
        is_group_total: flight.is_group_total,
        pricing_note: flight.pricing_note
      };
      
      console.table(flightReport);
      
      // Check which field will be used for calculation
      if (flight.total_for_group) {
        const total = parsePrice(flight.total_for_group);
        console.log('✅ Will use total_for_group:', total);
        flightTotal += total;
      } else if (flight.price_per_person && flight.travelers) {
        const perPerson = parsePrice(flight.price_per_person);
        const total = perPerson * flight.travelers;
        console.log(`⚠️ Will use price_per_person × travelers: ₱${perPerson} × ${flight.travelers} = ₱${total}`);
        flightTotal += total;
        report.warnings.push(`Flight "${flight.name}" missing total_for_group - using calculated value`);
      } else if (flight.numeric_price && flight.travelers) {
        const total = flight.numeric_price * flight.travelers;
        console.log(`⚠️ Will use numeric_price × travelers: ₱${flight.numeric_price} × ${flight.travelers} = ₱${total}`);
        flightTotal += total;
        report.warnings.push(`Flight "${flight.name}" using numeric_price fallback - verify per-person pricing`);
      } else {
        console.error('❌ No valid pricing field found!');
        report.issues.push(`Flight "${flight.name}" has no valid pricing metadata`);
      }
      
      console.groupEnd();
    });
    
    const flightPerPerson = flightTotal / travelersNum;
    console.log('Total Flights Cost:', `₱${flightTotal.toLocaleString()}`);
    console.log('Per Person:', `₱${Math.round(flightPerPerson).toLocaleString()}`);
    
    report.summary.flightsCost = flightTotal;
    report.summary.flightsPerPerson = Math.round(flightPerPerson);
    
    if (flightPerPerson > 20000) {
      report.warnings.push(`⚠️ Flight cost per person (₱${Math.round(flightPerPerson).toLocaleString()}) is very high for domestic travel`);
      report.recommendations.push('Verify flight pricing - may indicate double-multiplication error');
    }
    
    if (flightPerPerson < 500 && flightTotal > 0) {
      report.warnings.push(`⚠️ Flight cost per person (₱${Math.round(flightPerPerson).toLocaleString()}) is unrealistically low`);
      report.recommendations.push('Check if flight prices are missing or incorrectly parsed');
    }
  } else {
    console.log('No real flight data found');
    report.summary.flightsCost = 0;
  }
  
  console.groupEnd();
  
  // ========================================
  // 4. HOTELS COST ANALYSIS
  // ========================================
  console.group('4️⃣ Hotels Cost Analysis');
  
  const realHotels = trip?.realHotelData?.hotels;
  const aiHotels = trip?.tripData?.hotels;
  const duration = trip?.userSelection?.duration || trip?.userSelection?.noOfDays || 1;
  const numNights = Math.max(1, duration - 1);
  
  console.log('Real Hotel Data:', realHotels);
  console.log('AI Hotel Data:', aiHotels);
  console.log('Duration:', duration, 'days');
  console.log('Nights:', numNights);
  
  if (realHotels && Array.isArray(realHotels) && realHotels.length > 0) {
    const selectedHotel = realHotels[0];
    
    console.group(`Selected Hotel: ${selectedHotel.hotelName || 'Unknown'}`);
    
    const hotelReport = {
      hotelName: selectedHotel.hotelName,
      pricePerNight: selectedHotel.pricePerNight,
      priceNumeric: selectedHotel.priceNumeric,
      priceRange: selectedHotel.priceRange,
      price_range: selectedHotel.price_range,
      pricing_type: selectedHotel.pricing_type,
      is_per_room: selectedHotel.is_per_room
    };
    
    console.table(hotelReport);
    
    const priceField = selectedHotel?.pricePerNight || 
                       selectedHotel?.priceRange || 
                       selectedHotel?.price_range ||
                       selectedHotel?.priceNumeric;
    
    const pricePerNight = parsePrice(priceField);
    const hotelTotal = pricePerNight * numNights;
    
    console.log('Price Per Night:', `₱${pricePerNight.toLocaleString()}`);
    console.log('Total Hotel Cost:', `₱${hotelTotal.toLocaleString()}`);
    
    report.summary.hotelsCost = hotelTotal;
    report.summary.hotelPerNight = pricePerNight;
    
    // Check for per-person vs per-room confusion
    const isPricingPerRoom = selectedHotel?.pricing_type === 'per_room' || 
                             selectedHotel?.is_per_room === true ||
                             !selectedHotel?.pricing_type;
    
    if (!isPricingPerRoom) {
      report.warnings.push(`⚠️ Hotel "${selectedHotel.hotelName}" may use per-person pricing`);
      report.recommendations.push(`Multiply hotel cost by ${travelersNum} travelers if per-person`);
    }
    
    if (pricePerNight > 10000) {
      report.warnings.push(`⚠️ Hotel price per night (₱${pricePerNight.toLocaleString()}) is very high`);
    }
    
    if (pricePerNight === 0 && priceField) {
      report.issues.push(`❌ Hotel has pricing field but parsed to ₱0: "${priceField}"`);
    }
    
    console.groupEnd();
  } else {
    console.log('No real hotel data found');
    report.summary.hotelsCost = 0;
  }
  
  console.groupEnd();
  
  // ========================================
  // 5. ACTIVITIES COST ANALYSIS
  // ========================================
  console.group('5️⃣ Activities Cost Analysis');
  
  const itinerary = trip?.tripData?.itinerary_data || trip?.tripData?.itinerary || [];
  let activitiesTotal = 0;
  let activitiesCount = 0;
  
  console.log('Itinerary Days:', itinerary?.length);
  
  if (Array.isArray(itinerary)) {
    itinerary.forEach((day, dayIndex) => {
      if (Array.isArray(day?.plan)) {
        day.plan.forEach((activity, actIndex) => {
          const price = parsePrice(activity?.ticketPricing);
          if (price > 0) {
            activitiesTotal += price;
            activitiesCount++;
            console.log(`Day ${dayIndex + 1}, Activity ${actIndex + 1}: ${activity.placeName || 'Unknown'} - ₱${price.toLocaleString()}`);
          }
        });
      }
    });
  }
  
  console.log('Total Activities Cost:', `₱${activitiesTotal.toLocaleString()}`);
  console.log('Activities Count:', activitiesCount);
  
  report.summary.activitiesCost = activitiesTotal;
  report.summary.activitiesCount = activitiesCount;
  
  console.groupEnd();
  
  // ========================================
  // 6. TOTAL CALCULATION & COMPARISON
  // ========================================
  console.group('6️⃣ Total Calculation & Budget Comparison');
  
  const budgetInfo = calculateTotalBudget(trip);
  
  console.log('Calculated Breakdown:', budgetInfo.breakdown);
  console.log('Calculated Total:', `₱${budgetInfo.total.toLocaleString()}`);
  console.log('User Budget:', userBudget ? `₱${userBudget.toLocaleString()}` : 'Not Set');
  
  if (userBudget) {
    const difference = userBudget - budgetInfo.total;
    const percentDiff = (difference / userBudget) * 100;
    
    console.log('Difference:', `₱${difference.toLocaleString()}`, `(${percentDiff.toFixed(1)}%)`);
    
    if (difference < 0) {
      console.log('🚨 OVER BUDGET by', `₱${Math.abs(difference).toLocaleString()}`);
      
      if (Math.abs(percentDiff) > 50) {
        report.issues.push(`❌ Estimated cost exceeds budget by ${Math.abs(percentDiff).toFixed(1)}%`);
        report.recommendations.push('Investigate potential double-counting in flights or hotels');
        report.recommendations.push('Verify total_for_group is being used correctly for flights');
      }
    } else {
      console.log('✅ WITHIN BUDGET with', `₱${difference.toLocaleString()} remaining`);
    }
  }
  
  report.summary.calculatedTotal = budgetInfo.total;
  report.summary.budgetDifference = userBudget ? userBudget - budgetInfo.total : null;
  
  console.groupEnd();
  
  // ========================================
  // 7. RECOMMENDATIONS SUMMARY
  // ========================================
  console.group('7️⃣ Summary & Recommendations');
  
  console.log('Issues Found:', report.issues.length);
  console.log('Warnings:', report.warnings.length);
  console.log('Recommendations:', report.recommendations.length);
  
  if (report.issues.length > 0) {
    console.group('❌ ISSUES');
    report.issues.forEach(issue => console.error(issue));
    console.groupEnd();
  }
  
  if (report.warnings.length > 0) {
    console.group('⚠️ WARNINGS');
    report.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  if (report.recommendations.length > 0) {
    console.group('💡 RECOMMENDATIONS');
    report.recommendations.forEach(rec => console.info(rec));
    console.groupEnd();
  }
  
  console.groupEnd();
  console.groupEnd();
  
  return report;
};

/**
 * Quick budget summary (less verbose than full diagnostics)
 */
export const quickBudgetCheck = (trip) => {
  const budgetInfo = calculateTotalBudget(trip);
  const userBudget = getUserBudget(trip);
  
  console.table({
    'User Budget': userBudget ? `₱${userBudget.toLocaleString()}` : 'Not Set',
    'Activities': `₱${budgetInfo.breakdown.activities.toLocaleString()}`,
    'Hotels': `₱${budgetInfo.breakdown.hotels.toLocaleString()}`,
    'Flights': `₱${budgetInfo.breakdown.flights.toLocaleString()}`,
    'Ground Transport': `₱${budgetInfo.breakdown.groundTransport.toLocaleString()}`,
    'Total Cost': `₱${budgetInfo.total.toLocaleString()}`,
    'Difference': userBudget ? `₱${(userBudget - budgetInfo.total).toLocaleString()}` : 'N/A',
    'Status': userBudget ? (budgetInfo.total <= userBudget ? '✅ Within Budget' : '🚨 Over Budget') : 'No Budget Set'
  });
  
  return budgetInfo;
};

/**
 * Compare real vs AI pricing data
 */
export const compareRealVsAIPricing = (trip) => {
  console.group('🔄 Real vs AI Pricing Comparison');
  
  // Flights comparison
  console.group('✈️ Flights');
  const realFlights = trip?.realFlightData?.flights || [];
  const aiFlights = trip?.tripData?.flights || [];
  
  console.log('Real Flight Count:', realFlights.length);
  console.log('AI Flight Count:', aiFlights.length);
  
  if (realFlights.length > 0 && aiFlights.length > 0) {
    console.table({
      'Data Source': ['Real (SerpAPI)', 'AI (Gemini)'],
      'Count': [realFlights.length, aiFlights.length],
      'First Price': [
        realFlights[0]?.total_for_group || realFlights[0]?.price,
        aiFlights[0]?.price
      ]
    });
  }
  console.groupEnd();
  
  // Hotels comparison
  console.group('🏨 Hotels');
  const realHotels = trip?.realHotelData?.hotels || [];
  const aiHotels = trip?.tripData?.hotels || [];
  
  console.log('Real Hotel Count:', realHotels.length);
  console.log('AI Hotel Count:', aiHotels.length);
  
  if (realHotels.length > 0 && aiHotels.length > 0) {
    console.table({
      'Data Source': ['Real (Google Places)', 'AI (Gemini)'],
      'Count': [realHotels.length, aiHotels.length],
      'First Price': [
        realHotels[0]?.pricePerNight || realHotels[0]?.priceRange,
        aiHotels[0]?.priceRange
      ]
    });
  }
  console.groupEnd();
  
  console.groupEnd();
};

// Make available globally for easy debugging in console
if (typeof window !== 'undefined') {
  window.debugBudget = runBudgetDiagnostics;
  window.quickBudgetCheck = quickBudgetCheck;
  window.compareRealVsAIPricing = compareRealVsAIPricing;
  console.log('💰 Budget diagnostics loaded. Use window.debugBudget(trip) to run diagnostics.');
}

export default {
  runBudgetDiagnostics,
  quickBudgetCheck,
  compareRealVsAIPricing
};
