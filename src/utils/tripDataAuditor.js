/**
 * TRIP DATA FLOW AUDITOR
 * 
 * Systematic approach for auditing data flow in ViewTrip components.
 * This utility helps validate that trip data is correctly passed and 
 * rendered across all child components.
 * 
 * Usage:
 * import { auditTripData } from '@/utils/tripDataAuditor';
 * const auditReport = auditTripData(trip);
 * console.log(auditReport);
 */

// ============================================
// 1. DATA STRUCTURE VALIDATION
// ============================================

/**
 * Validates the core trip data structure from Firebase
 */
export const validateTripStructure = (trip) => {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    structure: {}
  };

  // Check if trip exists
  if (!trip) {
    validation.valid = false;
    validation.errors.push('Trip object is null or undefined');
    return validation;
  }

  // Validate top-level structure
  validation.structure.hasUserSelection = !!trip.userSelection;
  validation.structure.hasTripData = !!trip.tripData;
  validation.structure.hasRealFlightData = !!trip.realFlightData;
  validation.structure.hasRealHotelData = !!trip.realHotelData;
  validation.structure.hasFlightResults = !!trip.flightResults;
  validation.structure.hasRouteOptimization = !!trip.routeOptimization;

  // Check userSelection fields
  if (trip.userSelection) {
    const requiredFields = ['location', 'duration', 'travelers'];
    requiredFields.forEach(field => {
      if (!trip.userSelection[field]) {
        validation.warnings.push(`Missing userSelection.${field}`);
      }
    });
    
    // ✅ FIX: Budget can be in either 'budget' or 'customBudget' field
    const hasBudget = trip.userSelection.budget || trip.userSelection.customBudget;
    if (!hasBudget) {
      validation.warnings.push(`Missing userSelection.budget (both budget and customBudget are empty)`);
    }
    
    validation.structure.userSelection = {
      location: trip.userSelection.location || 'missing',
      duration: trip.userSelection.duration || 'missing',
      travelers: trip.userSelection.travelers || 'missing',
      budget: trip.userSelection.budget || trip.userSelection.customBudget || 'missing',
      customBudget: trip.userSelection.customBudget || null,
      startDate: trip.userSelection.startDate || 'missing',
      endDate: trip.userSelection.endDate || 'missing'
    };
  }

  // Check tripData structure (AI-generated content)
  if (trip.tripData) {
    const tripDataType = typeof trip.tripData;
    validation.structure.tripDataType = tripDataType;

    // Handle string tripData (needs parsing)
    if (tripDataType === 'string') {
      validation.warnings.push('tripData is a string - may need JSON parsing');
      try {
        const parsed = JSON.parse(trip.tripData);
        validation.structure.tripDataParsed = true;
        validation.structure.tripDataKeys = Object.keys(parsed);
      } catch (e) {
        validation.errors.push('Failed to parse tripData string: ' + e.message);
        validation.structure.tripDataParsed = false;
      }
    } else if (tripDataType === 'object') {
      validation.structure.tripDataKeys = Object.keys(trip.tripData);
      
      // ✅ UPDATED: Handle nested tripData.tripData structure (common in LangGraph results)
      let actualTripData = trip.tripData;
      if (trip.tripData.tripData && typeof trip.tripData.tripData === 'object') {
        // Only warn if this is unexpected (should be fixed at save time now)
        validation.errors.push('CRITICAL: Nested tripData.tripData structure detected - this should have been flattened during save!');
        actualTripData = trip.tripData.tripData;
        validation.structure.isNestedStructure = true;
      }
      
      // Check for critical AI-generated fields
      const criticalFields = ['hotels', 'itinerary', 'placesToVisit', 'dailyCosts'];
      criticalFields.forEach(field => {
        if (!actualTripData[field]) {
          validation.warnings.push(`Missing tripData.${field}`);
        } else {
          const fieldType = Array.isArray(actualTripData[field]) ? 'array' : typeof actualTripData[field];
          const fieldLength = Array.isArray(actualTripData[field]) ? actualTripData[field].length : 'N/A';
          validation.structure[`tripData_${field}`] = { type: fieldType, length: fieldLength };
          
          // ✅ REMOVED: Don't warn about string fields - Firestore can store strings fine
          // The extraction functions will handle parsing when needed
        }
      });
    }
  } else {
    validation.errors.push('tripData is missing - AI content not available');
  }

  // Check flight data
  if (trip.hasRealFlights || trip.flightSearchRequested) {
    if (!trip.realFlightData && !trip.flightResults) {
      validation.errors.push('Flight search was requested but no flight data found - API may have failed');
    } else {
      const flightData = trip.realFlightData || trip.flightResults;
      validation.structure.flightData = {
        success: flightData.success || false,
        flightsCount: Array.isArray(flightData.flights) ? flightData.flights.length : 0
      };
    }
  }

  // Check hotel data
  if (trip.hasRealHotels || trip.hotelSearchRequested) {
    if (!trip.realHotelData) {
      validation.errors.push('Hotel search was requested but no hotel data found - API may have failed');
    } else {
      validation.structure.hotelData = {
        hotelsCount: Array.isArray(trip.realHotelData.hotels) 
          ? trip.realHotelData.hotels.length 
          : (typeof trip.realHotelData.hotels === 'string' ? 'string_needs_parsing' : 0)
      };
    }
  }

  return validation;
};

// ============================================
// 2. COMPONENT DATA EXTRACTION
// ============================================

/**
 * Extracts data for Hotels component
 */
export const extractHotelsData = (trip) => {
  const extraction = {
    component: 'Hotels',
    aiHotels: [],
    realHotels: [],
    displayMode: 'unknown',
    errors: []
  };

  try {
    // Parse tripData if string
    let tripData = trip.tripData;
    if (typeof tripData === 'string') {
      try {
        tripData = JSON.parse(tripData);
      } catch (e) {
        extraction.errors.push('Failed to parse tripData: ' + e.message);
        return extraction;
      }
    }

    // ✅ UPDATED: Handle nested tripData.tripData structure with auto-flattening
    if (tripData?.tripData && typeof tripData.tripData === 'object') {
      console.warn('⚠️ Hotels extraction: Found nested tripData.tripData - auto-flattening');
      tripData = tripData.tripData;
    }

    // Get AI hotels
    const aiHotelsRaw = tripData?.hotels || tripData?.accommodations || [];
    extraction.aiHotels = Array.isArray(aiHotelsRaw) ? aiHotelsRaw : [aiHotelsRaw];

    // Get real hotels
    let realHotelsRaw = trip.realHotelData?.hotels || [];
    if (typeof realHotelsRaw === 'string') {
      try {
        realHotelsRaw = JSON.parse(realHotelsRaw);
      } catch (e) {
        extraction.errors.push('Failed to parse realHotelData: ' + e.message);
        realHotelsRaw = [];
      }
    }
    extraction.realHotels = Array.isArray(realHotelsRaw) ? realHotelsRaw : [realHotelsRaw];

    // Determine display mode
    const hotelSearchRequested = trip.hotelSearchRequested || false;
    const hasRealHotels = trip.hasRealHotels || false;

    if (!hotelSearchRequested) {
      extraction.displayMode = 'ai_only';
    } else if (hotelSearchRequested && hasRealHotels && extraction.realHotels.length > 0) {
      extraction.displayMode = 'real_only';
    } else {
      extraction.displayMode = 'ai_fallback';
    }

  } catch (error) {
    extraction.errors.push('Extraction error: ' + error.message);
  }

  return extraction;
};

/**
 * Extracts data for FlightBooking component
 */
export const extractFlightsData = (trip) => {
  const extraction = {
    component: 'FlightBooking',
    flights: [],
    searchInfo: {},
    displayCondition: false,
    errors: []
  };

  try {
    // Check if flight tab should be shown
    extraction.displayCondition = !!(
      trip?.hasRealFlights ||
      trip?.realFlightData?.success ||
      trip?.flightResults?.success
    );

    if (!extraction.displayCondition) {
      extraction.errors.push('Flight data not available or search not successful');
      return extraction;
    }

    // ✅ UPDATED: Get flight data from multiple possible sources with priority
    const flightData = 
      trip.realFlightData || 
      trip.flightResults || 
      trip.flightData ||
      {};
    
    extraction.searchInfo = {
      success: flightData.success || false,
      origin: flightData.origin || 
              flightData.departureCity || 
              trip.userSelection?.flightData?.departureCity || 
              trip.flightPreferences?.departureCity ||
              'unknown',
      destination: flightData.destination || 
                   flightData.arrivalCity ||
                   trip.userSelection?.location || 
                   'unknown',
      departureDate: flightData.departureDate || 
                     trip.userSelection?.startDate || 
                     'unknown',
      returnDate: flightData.returnDate || 
                  trip.userSelection?.endDate || 
                  'unknown'
    };

    // Parse flights with better handling
    let flightsRaw = flightData.flights || [];
    
    // Handle nested flights object
    if (typeof flightData.flights === 'object' && !Array.isArray(flightData.flights)) {
      // Check if flights is an object with a flights property
      if (Array.isArray(flightData.flights?.flights)) {
        flightsRaw = flightData.flights.flights;
      }
    }
    
    if (typeof flightsRaw === 'string') {
      try {
        flightsRaw = JSON.parse(flightsRaw);
      } catch (e) {
        extraction.errors.push('Failed to parse flights: ' + e.message);
        flightsRaw = [];
      }
    }
    extraction.flights = Array.isArray(flightsRaw) ? flightsRaw : [];

    console.log('✈️ Flights extraction complete:', {
      displayCondition: extraction.displayCondition,
      flightsCount: extraction.flights.length,
      searchSuccess: extraction.searchInfo.success,
    });

  } catch (error) {
    extraction.errors.push('Extraction error: ' + error.message);
  }

  return extraction;
};

/**
 * Extracts data for PlacesToVisit (Itinerary) component
 */
export const extractItineraryData = (trip) => {
  const extraction = {
    component: 'PlacesToVisit',
    itinerary: [],
    placesToVisit: [],
    dailyCosts: [],
    budgetInfo: {},
    errors: [],
    warnings: []
  };

  try {
    // Parse tripData if string
    let tripData = trip.tripData;
    if (typeof tripData === 'string') {
      try {
        tripData = JSON.parse(tripData);
      } catch (e) {
        extraction.errors.push('Failed to parse tripData: ' + e.message);
        return extraction;
      }
    }

    // ✅ UPDATED: Handle nested tripData.tripData structure with auto-flattening
    if (tripData?.tripData && typeof tripData.tripData === 'object') {
      console.warn('⚠️ Itinerary extraction: Found nested tripData.tripData - auto-flattening');
      tripData = tripData.tripData;
    }

    // Get itinerary
    let itineraryRaw = tripData?.itinerary || [];
    if (typeof itineraryRaw === 'string') {
      try {
        itineraryRaw = JSON.parse(itineraryRaw);
      } catch (e) {
        extraction.errors.push('Failed to parse itinerary: ' + e.message);
        itineraryRaw = [];
      }
    }
    extraction.itinerary = Array.isArray(itineraryRaw) ? itineraryRaw : [];

    // Get places to visit
    let placesRaw = tripData?.placesToVisit || [];
    if (typeof placesRaw === 'string') {
      try {
        // ✅ FIXED: Handle comma-separated JSON objects (common AI generation issue)
        // Format: "{"place":"..."},{"place":"..."}" needs to be wrapped in array
        let cleanedPlaces = placesRaw.trim();
        if (cleanedPlaces && !cleanedPlaces.startsWith('[')) {
          // Wrap in array brackets if not already an array
          cleanedPlaces = '[' + cleanedPlaces + ']';
        }
        placesRaw = JSON.parse(cleanedPlaces);
        console.log('✅ Successfully parsed placesToVisit string to array');
      } catch {
        extraction.warnings.push('Failed to parse placesToVisit as wrapped array, trying recovery...');
        // Try alternate parsing: split by '},{'
        try {
          const placesStr = tripData.placesToVisit.trim();
          const placesArray = placesStr.split(/\},\s*\{/).map((item, index, arr) => {
            // Add back the brackets removed by split
            if (index === 0 && !item.startsWith('{')) item = '{' + item;
            if (index === arr.length - 1 && !item.endsWith('}')) item = item + '}';
            if (index > 0 && index < arr.length - 1) item = '{' + item + '}';
            return JSON.parse(item);
          });
          placesRaw = placesArray;
          extraction.warnings.push('✅ Successfully recovered placesToVisit from malformed JSON');
        } catch (finalError) {
          extraction.errors.push('Failed to parse placesToVisit: ' + finalError.message);
          placesRaw = [];
        }
      }
    }
    extraction.placesToVisit = Array.isArray(placesRaw) ? placesRaw : [];

    // Get budget information with string parsing for dailyCosts
    let dailyCostsRaw = tripData?.dailyCosts || [];
    if (typeof dailyCostsRaw === 'string') {
      try {
        // ✅ FIXED: Handle comma-separated JSON objects for daily costs
        let cleanedCosts = dailyCostsRaw.trim();
        if (cleanedCosts && !cleanedCosts.startsWith('[')) {
          cleanedCosts = '[' + cleanedCosts + ']';
        }
        dailyCostsRaw = JSON.parse(cleanedCosts);
        console.log('✅ Successfully parsed dailyCosts string to array');
      } catch {
        extraction.warnings.push('Failed to parse dailyCosts as wrapped array, trying recovery...');
        // Try alternate parsing: split by '},{'
        try {
          const costsStr = tripData.dailyCosts.trim();
          const costsArray = costsStr.split(/\},\s*\{/).map((item, index, arr) => {
            if (index === 0 && !item.startsWith('{')) item = '{' + item;
            if (index === arr.length - 1 && !item.endsWith('}')) item = item + '}';
            if (index > 0 && index < arr.length - 1) item = '{' + item + '}';
            return JSON.parse(item);
          });
          dailyCostsRaw = costsArray;
          extraction.warnings.push('✅ Successfully recovered dailyCosts from malformed JSON');
        } catch (finalError) {
          extraction.errors.push('Failed to parse dailyCosts: ' + finalError.message);
          dailyCostsRaw = [];
        }
      }
    }

    extraction.budgetInfo = {
      userBudget: trip.userSelection?.customBudget || trip.userSelection?.budget || 'Not set',
      dailyCosts: Array.isArray(dailyCostsRaw) ? dailyCostsRaw : [],
      grandTotal: tripData?.grandTotal || 0,
      budgetCompliance: tripData?.budgetCompliance || {}
    };

  } catch (error) {
    extraction.errors.push('Extraction error: ' + error.message);
  }

  return extraction;
};

/**
 * Extracts data for InfoSection (Overview) component
 */
export const extractOverviewData = (trip) => {
  const extraction = {
    component: 'InfoSection',
    tripName: null,
    destination: null,
    duration: null,
    dates: {},
    budget: null,
    travelers: null,
    errors: []
  };

  try {
    // Parse tripData if string
    let tripData = trip.tripData;
    if (typeof tripData === 'string') {
      try {
        tripData = JSON.parse(tripData);
      } catch (e) {
        extraction.errors.push('Failed to parse tripData: ' + e.message);
        tripData = {};
      }
    }

    extraction.tripName = tripData?.tripName || 'Untitled Trip';
    extraction.destination = trip.userSelection?.location || tripData?.destination || 'Unknown';
    extraction.duration = trip.userSelection?.duration || tripData?.duration || 0;
    extraction.dates = {
      startDate: trip.userSelection?.startDate || tripData?.startDate || 'Not set',
      endDate: trip.userSelection?.endDate || tripData?.endDate || 'Not set'
    };
    extraction.budget = trip.userSelection?.customBudget || trip.userSelection?.budget || 'Not set';
    extraction.travelers = trip.userSelection?.travelers || 'Not specified';

  } catch (error) {
    extraction.errors.push('Extraction error: ' + error.message);
  }

  return extraction;
};

// ============================================
// 3. COMPREHENSIVE AUDIT FUNCTION
// ============================================

/**
 * Performs complete audit of trip data flow
 */
export const auditTripData = (trip) => {
  const audit = {
    timestamp: new Date().toISOString(),
    tripId: trip?.id || 'unknown',
    overallStatus: 'unknown',
    validation: null,
    components: {}
  };

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          TRIP DATA FLOW AUDIT REPORT                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // 1. Validate structure
  console.log('📋 STEP 1: Validating Trip Data Structure');
  console.log('─────────────────────────────────────────');
  audit.validation = validateTripStructure(trip);
  
  if (audit.validation.errors.length > 0) {
    console.log('❌ ERRORS:', audit.validation.errors);
    audit.overallStatus = 'error';
  }
  
  if (audit.validation.warnings.length > 0) {
    // Categorize warnings for better readability
    const structuralWarnings = audit.validation.warnings.filter(w => 
      w.includes('nested') || w.includes('stored as string')
    );
    const missingDataWarnings = audit.validation.warnings.filter(w => 
      w.includes('Missing') || w.includes('not found')
    );
    
    if (structuralWarnings.length > 0) {
      console.log('⚠️  STRUCTURAL NOTES:', structuralWarnings);
    }
    if (missingDataWarnings.length > 0) {
      console.log('⚠️  MISSING DATA:', missingDataWarnings);
    }
    
    if (audit.overallStatus !== 'error') {
      audit.overallStatus = 'warning';
    }
  }
  
  console.log('✅ Structure:', audit.validation.structure);
  console.log('');

  // 2. Extract component data
  console.log('🔍 STEP 2: Extracting Data for Each Component');
  console.log('─────────────────────────────────────────────');

  // Hotels
  console.log('\n🏨 Hotels Component:');
  audit.components.hotels = extractHotelsData(trip);
  console.log('   AI Hotels:', audit.components.hotels.aiHotels.length);
  console.log('   Real Hotels:', audit.components.hotels.realHotels.length);
  console.log('   Display Mode:', audit.components.hotels.displayMode);
  if (audit.components.hotels.errors.length > 0) {
    console.log('   Errors:', audit.components.hotels.errors);
  }

  // Flights
  console.log('\n✈️  FlightBooking Component:');
  audit.components.flights = extractFlightsData(trip);
  console.log('   Display Condition:', audit.components.flights.displayCondition);
  console.log('   Flights Count:', audit.components.flights.flights.length);
  console.log('   Search Info:', audit.components.flights.searchInfo);
  if (audit.components.flights.errors.length > 0) {
    console.log('   Errors:', audit.components.flights.errors);
  }

  // Itinerary
  console.log('\n📅 PlacesToVisit (Itinerary) Component:');
  audit.components.itinerary = extractItineraryData(trip);
  console.log('   Itinerary Days:', audit.components.itinerary.itinerary.length);
  console.log('   Places to Visit:', audit.components.itinerary.placesToVisit.length);
  console.log('   Budget Info:', audit.components.itinerary.budgetInfo);
  if (audit.components.itinerary.errors.length > 0) {
    console.log('   Errors:', audit.components.itinerary.errors);
  }

  // Overview
  console.log('\nℹ️  InfoSection (Overview) Component:');
  audit.components.overview = extractOverviewData(trip);
  console.log('   Trip Name:', audit.components.overview.tripName);
  console.log('   Destination:', audit.components.overview.destination);
  console.log('   Duration:', audit.components.overview.duration, 'days');
  console.log('   Dates:', audit.components.overview.dates);
  console.log('   Budget:', audit.components.overview.budget);
  console.log('   Travelers:', audit.components.overview.travelers);
  if (audit.components.overview.errors.length > 0) {
    console.log('   Errors:', audit.components.overview.errors);
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          AUDIT COMPLETE                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('Overall Status:', audit.overallStatus === 'error' ? '❌ ERROR' : 
                                  audit.overallStatus === 'warning' ? '⚠️  WARNING' : 
                                  '✅ HEALTHY');
  console.log('');

  // Set overall status if not already set
  if (audit.overallStatus === 'unknown') {
    audit.overallStatus = 'healthy';
  }

  return audit;
};

// ============================================
// 4. PROP VALIDATION HELPERS
// ============================================

/**
 * Validates props received by a component
 */
export const validateComponentProps = (componentName, props, requiredProps) => {
  const validation = {
    component: componentName,
    valid: true,
    missing: [],
    present: []
  };

  requiredProps.forEach(propName => {
    if (props[propName] === undefined || props[propName] === null) {
      validation.missing.push(propName);
      validation.valid = false;
    } else {
      validation.present.push(propName);
    }
  });

  console.log(`🔍 ${componentName} Props Validation:`, validation);
  return validation;
};

/**
 * Deep comparison utility for debugging prop changes
 */
export const compareProps = (oldProps, newProps, propName = 'props') => {
  const changes = [];

  const allKeys = new Set([...Object.keys(oldProps || {}), ...Object.keys(newProps || {})]);

  allKeys.forEach(key => {
    const oldValue = oldProps?.[key];
    const newValue = newProps?.[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        key,
        oldValue,
        newValue,
        type: typeof newValue
      });
    }
  });

  if (changes.length > 0) {
    console.log(`🔄 ${propName} changed:`, changes);
  }

  return changes;
};

// ============================================
// 5. EXPORT UTILITY
// ============================================

export default {
  auditTripData,
  validateTripStructure,
  extractHotelsData,
  extractFlightsData,
  extractItineraryData,
  extractOverviewData,
  validateComponentProps,
  compareProps
};
