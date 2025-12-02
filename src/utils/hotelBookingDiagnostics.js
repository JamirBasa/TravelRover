/**
 * Hotel Booking Diagnostics Utility
 * 
 * Validates Agoda-Google integration and booking flow
 * Usage: window.debugHotelBooking(trip) in browser console
 */

import { logDebug, logError } from './productionLogger';

/**
 * Comprehensive hotel booking validation
 * @param {Object} trip - Trip object from Firebase
 * @returns {Object} Diagnostic report with issues and recommendations
 */
export function runHotelBookingDiagnostics(trip) {
  console.log('🏨 === HOTEL BOOKING DIAGNOSTICS ===');
  console.log('Trip ID:', trip?.id);
  console.log('Destination:', trip?.userSelection?.location);
  
  const report = {
    summary: {},
    issues: [],
    warnings: [],
    recommendations: [],
    hotels: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Extract hotels data
    const realHotels = extractRealHotels(trip);
    const aiHotels = extractAIHotels(trip);
    const allHotels = [...realHotels, ...aiHotels];

    console.log(`\n📊 Hotels Found: ${allHotels.length} total (Real: ${realHotels.length}, AI: ${aiHotels.length})`);

    // Summary statistics
    report.summary = {
      totalHotels: allHotels.length,
      realHotels: realHotels.length,
      aiHotels: aiHotels.length,
      hotelSearchRequested: trip?.hotelSearchRequested || false,
      hasRealHotels: trip?.hasRealHotels || false
    };

    // Analyze each hotel
    allHotels.forEach((hotel, index) => {
      const hotelAnalysis = analyzeHotel(hotel, index + 1, trip);
      report.hotels.push(hotelAnalysis);

      // Collect issues
      if (hotelAnalysis.issues.length > 0) {
        report.issues.push(...hotelAnalysis.issues);
      }
      if (hotelAnalysis.warnings.length > 0) {
        report.warnings.push(...hotelAnalysis.warnings);
      }
    });

    // Generate recommendations
    report.recommendations = generateRecommendations(report);

    // Console output
    displayReport(report);

    return report;

  } catch (error) {
    logError('HotelBookingDiagnostics', 'Diagnostic failed', error);
    console.error('❌ Diagnostic error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Extract real hotels from trip data
 */
function extractRealHotels(trip) {
  let realHotelsRaw = trip?.realHotelData?.hotels || [];
  
  // Handle JSON string
  if (typeof realHotelsRaw === 'string' && realHotelsRaw.trim()) {
    try {
      realHotelsRaw = JSON.parse(realHotelsRaw);
    } catch (e) {
      logError('HotelDiagnostics', 'Failed to parse realHotelData', e);
      return [];
    }
  }

  const hotels = Array.isArray(realHotelsRaw) ? realHotelsRaw : [];
  return hotels.map(h => ({ ...h, source: 'real', isRealHotel: true }));
}

/**
 * Extract AI-generated hotels from trip data
 */
function extractAIHotels(trip) {
  const possiblePaths = [
    trip?.tripData?.hotels,
    trip?.tripData?.accommodations,
    trip?.tripData?.tripData?.hotels,
    trip?.tripData?.tripData?.accommodations,
  ];

  const aiHotelsRaw = possiblePaths.find(path => path !== undefined) || [];
  const hotels = Array.isArray(aiHotelsRaw) ? aiHotelsRaw : [];
  return hotels.map(h => ({ ...h, source: 'ai', isRealHotel: false }));
}

/**
 * Analyze individual hotel for booking capability
 */
function analyzeHotel(hotel, index, trip) {
  const hotelName = hotel?.name || hotel?.hotelName || 'Unknown';
  const analysis = {
    index,
    name: hotelName,
    source: hotel?.source || 'unknown',
    issues: [],
    warnings: [],
    status: 'unknown',
    ids: {},
    bookingCapability: 'unknown',
    verification: {},
    qualityTier: hotel?.qualityTier || null,
    qualityTierName: hotel?.qualityTierName || null,
    agodaUrl: null
  };

  // Extract all ID fields
  analysis.ids = {
    hotel_id: hotel?.hotel_id || null,
    hotelId: hotel?.hotelId || null,
    id: hotel?.id || null,
    place_id: hotel?.place_id || null,
    google_place_id: hotel?.google_place_id || null
  };

  // Check verification status
  analysis.verification = {
    verified: hotel?.verified || false,
    matchScore: hotel?.matchScore || null,
    matchMethod: hotel?.matchMethod || null
  };

  // Validate Agoda hotel_id
  const agodaId = analysis.ids.hotel_id || analysis.ids.hotelId || analysis.ids.id;
  const isValidAgodaId = agodaId && /^\d+$/.test(String(agodaId));
  const isGooglePlaceId = agodaId && String(agodaId).startsWith('ChIJ');

  if (!agodaId) {
    analysis.issues.push(`❌ No hotel_id found - booking will fallback to city search`);
    analysis.bookingCapability = 'city-search-only';
    analysis.status = 'unbookable';
  } else if (isGooglePlaceId) {
    analysis.issues.push(`❌ hotel_id is Google Place ID (${String(agodaId).substring(0, 15)}...) - invalid for Agoda`);
    analysis.bookingCapability = 'city-search-only';
    analysis.status = 'invalid-id';
  } else if (!isValidAgodaId) {
    analysis.issues.push(`❌ hotel_id is not numeric (${agodaId}) - invalid for Agoda`);
    analysis.bookingCapability = 'city-search-only';
    analysis.status = 'invalid-id';
  } else {
    analysis.bookingCapability = 'direct-booking';
    analysis.status = 'bookable';
    
    // Generate Agoda URL
    try {
      analysis.agodaUrl = generateTestAgodaURL(agodaId, trip);
    } catch (e) {
      analysis.warnings.push(`⚠️ Failed to generate Agoda URL: ${e.message}`);
    }
  }

  // Verification warnings
  if (!analysis.verification.verified && hotel?.source === 'real') {
    analysis.warnings.push(`⚠️ Real hotel but not verified - may have matching issues`);
  }

  if (analysis.verification.matchScore && analysis.verification.matchScore < 0.75) {
    analysis.warnings.push(`⚠️ Low match confidence (${(analysis.verification.matchScore * 100).toFixed(0)}%) - possible incorrect match`);
  }

  // Quality tier warnings
  if (hotel?.qualityTier && hotel.qualityTier >= 4) {
    analysis.warnings.push(`⚠️ Quality Tier ${hotel.qualityTier} (${hotel.qualityTierName}) - May be hidden by quality filter`);
  }

  // Check for price data
  if (!hotel?.pricePerNight && !hotel?.priceNumeric && !hotel?.priceRange && !hotel?.price_range) {
    analysis.warnings.push(`⚠️ No price information available`);
  }

  return analysis;
}

/**
 * Generate test Agoda URL (without opening)
 */
function generateTestAgodaURL(hotelId, trip) {
  const checkIn = trip?.userSelection?.startDate || '2025-12-01';
  const checkOut = trip?.userSelection?.endDate || '2025-12-05';
  const adults = trip?.userSelection?.travelers || 1;

  const params = new URLSearchParams({
    pcs: '1',
    cid: '1952350',
    hl: 'en-us',
    currency: 'PHP',
    hid: hotelId,
    checkin: checkIn,
    checkout: checkOut,
    NumberofAdults: adults,
    NumberofChildren: '0',
    Rooms: '1',
  });

  return `https://www.agoda.com/partners/partnersearch.aspx?${params.toString()}`;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(report) {
  const recommendations = [];
  const unbookableCount = report.hotels.filter(h => h.status === 'unbookable' || h.status === 'invalid-id').length;
  const lowConfidenceCount = report.hotels.filter(h => 
    h.verification.matchScore && h.verification.matchScore < 0.75
  ).length;

  if (unbookableCount > 0) {
    recommendations.push({
      severity: 'critical',
      message: `${unbookableCount} hotel(s) cannot be directly booked on Agoda (missing/invalid hotel_id)`,
      action: 'Enable hotel search during trip creation to get verified hotel_id from database'
    });
  }

  if (lowConfidenceCount > 0) {
    recommendations.push({
      severity: 'warning',
      message: `${lowConfidenceCount} hotel(s) have low match confidence (<75%)`,
      action: 'Manually verify hotel names match between Google and Agoda'
    });
  }

  if (!report.summary.hotelSearchRequested && report.summary.realHotels === 0) {
    recommendations.push({
      severity: 'info',
      message: 'Trip uses AI-generated hotels without real data verification',
      action: 'Create new trip with "Include Accommodation Search" enabled for verified hotels'
    });
  }

  if (report.hotels.length > 5) {
    recommendations.push({
      severity: 'info',
      message: `${report.hotels.length} hotels shown - consider filtering to top 5 for better UX`,
      action: 'Frontend already limits to 5, but backend returned more'
    });
  }

  return recommendations;
}

/**
 * Display formatted report in console
 */
function displayReport(report) {
  console.log('\n📋 === SUMMARY ===');
  console.table({
    'Total Hotels': report.summary.totalHotels,
    'Real Hotels': report.summary.realHotels,
    'AI Hotels': report.summary.aiHotels,
    'Hotel Search Requested': report.summary.hotelSearchRequested ? 'Yes' : 'No',
    'Has Real Hotels': report.summary.hasRealHotels ? 'Yes' : 'No'
  });

  console.log('\n🏨 === HOTEL ANALYSIS ===');
  report.hotels.forEach(hotel => {
    const icon = hotel.status === 'bookable' ? '✅' : 
                 hotel.status === 'unbookable' ? '❌' : '⚠️';
    console.log(`\n${icon} Hotel ${hotel.index}: ${hotel.name}`);
    console.log(`   Source: ${hotel.source}`);
    console.log(`   Status: ${hotel.status}`);
    console.log(`   Booking: ${hotel.bookingCapability}`);
    
    if (hotel.qualityTier) {
      const tierEmoji = hotel.qualityTier === 1 ? '⭐⭐' : hotel.qualityTier === 2 ? '⭐' : hotel.qualityTier === 3 ? '~' : '!';
      console.log(`   Quality: ${tierEmoji} Tier ${hotel.qualityTier} (${hotel.qualityTierName})`);
    }
    
    if (hotel.ids.hotel_id) {
      console.log(`   Agoda ID: ${hotel.ids.hotel_id}`);
    }
    
    if (hotel.verification.verified) {
      console.log(`   Verified: Yes (${hotel.verification.matchMethod}, ${(hotel.verification.matchScore * 100).toFixed(0)}% match)`);
    }
    
    if (hotel.agodaUrl) {
      console.log(`   Agoda URL: ${hotel.agodaUrl.substring(0, 80)}...`);
    }

    if (hotel.issues.length > 0) {
      hotel.issues.forEach(issue => console.log(`   ${issue}`));
    }
    if (hotel.warnings.length > 0) {
      hotel.warnings.forEach(warning => console.log(`   ${warning}`));
    }
  });

  if (report.issues.length > 0) {
    console.log('\n❌ === CRITICAL ISSUES ===');
    const uniqueIssues = [...new Set(report.issues)];
    uniqueIssues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
  }

  if (report.warnings.length > 0) {
    console.log('\n⚠️ === WARNINGS ===');
    const uniqueWarnings = [...new Set(report.warnings)];
    uniqueWarnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`));
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 === RECOMMENDATIONS ===');
    report.recommendations.forEach((rec, i) => {
      const icon = rec.severity === 'critical' ? '🔴' : 
                   rec.severity === 'warning' ? '🟡' : '🔵';
      console.log(`${i + 1}. ${icon} ${rec.message}`);
      console.log(`   → ${rec.action}`);
    });
  }

  console.log('\n✅ Diagnostics complete!');
  console.log('💾 Full report available in return value');
}

/**
 * Quick validation check (returns boolean)
 */
export function validateHotelBooking(hotel) {
  const agodaId = hotel?.hotel_id || hotel?.hotelId || hotel?.id;
  const isValidAgodaId = agodaId && /^\d+$/.test(String(agodaId));
  const isGooglePlaceId = agodaId && String(agodaId).startsWith('ChIJ');
  
  return {
    canBook: isValidAgodaId && !isGooglePlaceId,
    hasHotelId: !!agodaId,
    isVerified: hotel?.verified || false,
    agodaId: isValidAgodaId ? agodaId : null,
    reason: !agodaId ? 'No hotel_id found' :
            isGooglePlaceId ? 'Google Place ID (not Agoda ID)' :
            !isValidAgodaId ? 'Invalid hotel_id format' :
            'Valid for booking'
  };
}

/**
 * Test if Agoda URL is correctly formatted
 */
export function testAgodaURL(url) {
  try {
    const urlObj = new URL(url);
    
    const checks = {
      domain: urlObj.hostname === 'www.agoda.com',
      path: urlObj.pathname === '/partners/partnersearch.aspx',
      hasHotelId: urlObj.searchParams.has('hid'),
      hasCheckIn: urlObj.searchParams.has('checkin'),
      hasCheckOut: urlObj.searchParams.has('checkout'),
      hasAffiliateId: urlObj.searchParams.has('cid'),
      hotelId: urlObj.searchParams.get('hid'),
      isNumericId: /^\d+$/.test(urlObj.searchParams.get('hid') || '')
    };

    const isValid = checks.domain && checks.path && checks.hasHotelId && checks.isNumericId;

    console.log('🔗 Agoda URL Validation:');
    console.table(checks);
    
    return {
      valid: isValid,
      checks,
      url: url
    };
  } catch (e) {
    return {
      valid: false,
      error: e.message,
      url: url
    };
  }
}

// Export to window for browser console access
if (typeof window !== 'undefined') {
  window.debugHotelBooking = runHotelBookingDiagnostics;
  window.validateHotelBooking = validateHotelBooking;
  window.testAgodaURL = testAgodaURL;
}

export default {
  runHotelBookingDiagnostics,
  validateHotelBooking,
  testAgodaURL
};
