/**
 * Transport Mode Detector
 * Intelligently determines the most appropriate transport mode for a route
 * Integrates ground transport routes with flight availability analysis
 * Enhanced with direct flight checking for optimal recommendations
 */

import { getAirportCode, getNearestMajorAirport, PHILIPPINE_AIRPORTS } from "../data/airports.js";
import { findGroundRoute } from "../data/groundTransportRoutes.js";
import { hasDirectFlight } from "../data/directFlightRoutes.js";
import { classifyTransportConvenience } from "./transportConvenience.js";
import {
  isRegionalTransportPractical,
  checkGeographicBoundaries,
} from "../data/regionalTransportContext.js";
import { analyzeTransportMode as callBackendAPI } from "../services/transportModeApi.js";

/**
 * Calculate Haversine distance between two coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Estimate flight time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Estimated flight time (e.g., "1.5 hours")
 */
const estimateFlightTime = (distanceKm) => {
  // Average cruise speed: 800 km/h
  // Add 15 min taxi/takeoff/landing
  const cruiseTimeHours = distanceKm / 800;
  const totalTimeHours = cruiseTimeHours + 0.25; // 15 min = 0.25 hours
  
  if (totalTimeHours < 1) {
    return `${Math.round(totalTimeHours * 60)} minutes`;
  } else {
    const hours = Math.floor(totalTimeHours);
    const minutes = Math.round((totalTimeHours - hours) * 60);
    return minutes > 0 ? `${hours}.5 hours` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
};

/**
 * Estimate ground transport time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Estimated ground transport time
 */
const estimateGroundTime = (distanceKm) => {
  // Average bus speed: 50-60 km/h including stops
  const avgSpeed = 55;
  const hours = distanceKm / avgSpeed;
  
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else {
    const wholePart = Math.floor(hours);
    const fraction = hours - wholePart;
    if (fraction < 0.25) return `${wholePart} hours`;
    if (fraction < 0.75) return `${wholePart}-${wholePart + 1} hours`;
    return `${wholePart + 1} hours`;
  }
};

/**
 * Transport mode constants
 */
export const TRANSPORT_MODE = {
  FLIGHT: "flight",
  BUS: "bus",
  FERRY: "ferry",
  VAN: "van",
  PRIVATE_TRANSFER: "private_transfer",
  COMBINATION: "combination", // Flight + ground transfer
  RORO: "roro", // Roll-on/roll-off ferry
  GROUND_PREFERRED: "ground_preferred", // Ground transport is best option
  FLIGHT_REQUIRED: "flight_required", // Flight is necessary
};

/**
 * Determine the most appropriate transport mode for a route (async version with backend API)
 * @param {string} destination - Destination city
 * @param {string} departureCity - Departure city
 * @param {boolean} includeFlights - Whether user wants flight search
 * @param {boolean} useBackend - Whether to try backend API first (default: true)
 * @returns {Promise<Object>} Transport mode analysis with recommendations
 */
export const determineTransportModeAsync = async (
  destination,
  departureCity,
  includeFlights = true,
  useBackend = true
) => {
  // Extract city names from full address format
  const extractCityName = (location) => {
    if (!location) return location;
    return location.split(',')[0].trim();
  };

  const normDestination = extractCityName(destination);
  const normDeparture = extractCityName(departureCity);

  // Try backend API first if enabled
  if (useBackend) {
    try {
      console.log(`🔄 Trying backend API for: ${normDeparture} → ${normDestination}`);
      const backendResult = await callBackendAPI(normDeparture, normDestination, includeFlights);
      
      if (backendResult.success && backendResult.data) {
        console.log(`✅ Backend API success - using enhanced data`);
        
        // Transform backend response to match frontend format
        const apiData = backendResult.data;
        
        // Map backend mode to frontend mode constants
        const modeMap = {
          'ground_preferred': TRANSPORT_MODE.GROUND_PREFERRED,
          'flight_required': TRANSPORT_MODE.FLIGHT_REQUIRED,
          'bus': TRANSPORT_MODE.BUS,
          'ferry': TRANSPORT_MODE.FERRY,
          'van': TRANSPORT_MODE.VAN,
          'private_transfer': TRANSPORT_MODE.PRIVATE_TRANSFER,
          'flight': TRANSPORT_MODE.FLIGHT,
        };
        
        const mode = modeMap[apiData.mode] || apiData.mode;
        const groundRoute = apiData.ground_route;
        
        // Build comprehensive response with backend data
        const result = {
          mode: mode,
          searchFlights: apiData.search_flights !== undefined ? apiData.search_flights : includeFlights,
          hasAirport: apiData.has_airport || false,
          recommendation: apiData.recommendation || "",
          source: 'backend', // Indicate data source
        };
        
        // Add ground transport info if available
        if (groundRoute) {
          result.groundTransport = {
            available: groundRoute.available !== undefined ? groundRoute.available : true,
            practical: groundRoute.practical !== undefined ? groundRoute.practical : true,
            preferred: mode === TRANSPORT_MODE.GROUND_PREFERRED,
            travelTime: `${groundRoute.travel_time} hours`,
            distance: `${groundRoute.distance} km`,
            modes: groundRoute.modes || [],
            cost: groundRoute.cost?.min && groundRoute.cost?.max 
              ? `₱${groundRoute.cost.min.toLocaleString()}-${groundRoute.cost.max.toLocaleString()}`
              : (typeof groundRoute.cost === 'string' ? groundRoute.cost : 'N/A'),
            frequency: groundRoute.frequency || 'N/A',
            operators: groundRoute.operators || [],
            scenic: groundRoute.scenic || false,
            hasFerry: groundRoute.has_ferry || false,
            hasOvernightOption: groundRoute.has_overnight_option || false,
            notes: groundRoute.notes || '',
            calculated: groundRoute.calculated || false,
            confidence: groundRoute.confidence || 'unknown',
            convenienceLevel: groundRoute.convenience_level || 'UNKNOWN',
          };
          
          // Set primary mode based on transport modes
          if (groundRoute.has_ferry || groundRoute.modes?.includes('ferry')) {
            result.primaryMode = TRANSPORT_MODE.FERRY;
          } else if (groundRoute.modes?.includes('van')) {
            result.primaryMode = TRANSPORT_MODE.VAN;
          } else if (groundRoute.modes?.includes('roro')) {
            result.primaryMode = TRANSPORT_MODE.RORO;
          } else {
            result.primaryMode = TRANSPORT_MODE.BUS;
          }
        }
        
        // Add ground transport notice for impractical routes
        if (apiData.ground_transport_notice) {
          result.groundTransportNotice = apiData.ground_transport_notice;
        }
        
        // Add regional context if available
        if (apiData.regional_context) {
          result.regionalContext = apiData.regional_context;
        }
        
        // Add warning if present
        if (apiData.warning) {
          result.warning = apiData.warning;
        }
        
        return result;
      }
    } catch (error) {
      console.warn(`⚠️ Backend API failed, falling back to local logic:`, error);
    }
  }
  
  // Fallback to existing local logic
  console.log(`📍 Using local transport mode logic`);
  return determineTransportModeLocal(destination, departureCity, includeFlights);
};

/**
 * Determine the most appropriate transport mode for a route (local logic)
 * @param {string} destination - Destination city
 * @param {string} departureCity - Departure city
 * @param {boolean} includeFlights - Whether user wants flight search
 * @returns {Object} Transport mode analysis with recommendations
 */
export const determineTransportModeLocal = (
  destination,
  departureCity,
  includeFlights = true
) => {
  // Validate inputs
  if (!destination || !departureCity) {
    return {
      mode: null,
      searchFlights: includeFlights,
      recommendation: "Please select both departure and destination cities",
    };
  }

  // ✅ FIX: Extract city name from "City, Province, Country" format
  // This ensures ground routes can be found even with full address strings
  const extractCityName = (location) => {
    if (!location) return location;
    // Extract first part before comma (e.g., "Pagadian City" from "Pagadian City, Zamboanga del Sur, Philippines")
    return location.split(',')[0].trim();
  };

  // Normalize city names - extract just the city part
  const normDestination = extractCityName(destination);
  const normDeparture = extractCityName(departureCity);

  // Check if same city (no transport needed)
  if (normDestination.toLowerCase() === normDeparture.toLowerCase()) {
    return {
      mode: TRANSPORT_MODE.PRIVATE_TRANSFER,
      searchFlights: false,
      recommendation:
        "No inter-city transport needed - you're already at the destination!",
      travelTime: "N/A",
      estimatedCost: "Minimal (local transport only)",
    };
  }

  // Step 0: Check airport availability FIRST (needed for direct flight check)
  const departureAirport =
    getAirportCode(normDeparture) || getNearestMajorAirport(normDeparture);
  const destinationAirport =
    getAirportCode(normDestination) || getNearestMajorAirport(normDestination);

  // Get airport data to check service status
  const depAirportData = departureAirport ? PHILIPPINE_AIRPORTS[departureAirport] : null;
  const destAirportData = destinationAirport ? PHILIPPINE_AIRPORTS[destinationAirport] : null;
  
  // Check if airports exist AND have active service OR limited service with direct flights
  const hasDepartureAirport = !!departureAirport && (depAirportData?.status === 'active' || depAirportData?.status === 'limited');
  const hasDestinationAirport = !!destinationAirport && (destAirportData?.status === 'active' || destAirportData?.status === 'limited');
  const bothHaveAirports = hasDepartureAirport && hasDestinationAirport;
  
  // Track if destination has LIMITED or no service (check later, after ground routes)
  const destHasLimitedService = destinationAirport && destAirportData?.status === 'limited';

  // Step 0b: Check direct flight availability (needed for later logic)
  let directFlightInfo = null;
  if (bothHaveAirports) {
    directFlightInfo = hasDirectFlight(departureAirport, destinationAirport);
  }

  // Step 1: Check ground transport availability FIRST
  const groundRoute = findGroundRoute(normDeparture, normDestination);

  // Step 1a: PRIORITY CHECK - Handle LIMITED/NO service airports
  // ✨ NEW LOGIC: Prioritize ground routes over alternative airports
  if (destHasLimitedService && destAirportData) {
    // CHECK 1: If ground route exists to destination → USE IT (preferred over flights to alternatives)
    if (groundRoute) {
      // Ground route exists - return as primary option
      // (convenience classification not needed here since we're defaulting to ground)
      return {
        mode: TRANSPORT_MODE.GROUND_PREFERRED,
        primaryMode: groundRoute.modes?.[0] === 'ferry' ? TRANSPORT_MODE.FERRY : TRANSPORT_MODE.BUS,
        searchFlights: false, // Don't auto-search flights - ground is best option
        hasAirport: false, // Destination has no practical airport service
        recommendation: `${groundRoute.modes.join("/")} recommended to ${normDestination}. ${groundRoute.notes || 'Available regularly.'}`,
        groundTransport: {
          available: true,
          practical: true,
          preferred: true,
          travelTime: `${groundRoute.travelTime} hours`,
          distance: `${groundRoute.distance} km`,
          modes: groundRoute.modes,
          cost: `₱${groundRoute.cost.min.toLocaleString()}-${groundRoute.cost.max.toLocaleString()}`,
          frequency: groundRoute.frequency,
          operators: groundRoute.operators,
          scenic: groundRoute.scenic || false,
          notes: groundRoute.notes,
          hasOvernightOption: groundRoute.hasOvernightOption,
        },
        flightAlternative: bothHaveAirports && departureAirport ? {
          available: true,
          fromAirport: departureAirport,
          reason: "Flights available to major hubs, but ground transport is more direct to your destination"
        } : null,
        warning: `${normDestination}: Limited airport service. Ground transport is most direct option.`
      };
    }

    // CHECK 2: If no ground route but airport has direct flights → use them
    const limitedFlightCheck = hasDirectFlight(departureAirport, destinationAirport);
    if (limitedFlightCheck?.direct) {
      // Don't return early - fall through to normal flight logic below
    } else {
      // CHECK 3: No ground route AND no direct flights → suggest alternative airport
      const alternative = destAirportData.alternatives?.[0];
      const alternativeName = destAirportData.alternativeNames?.[0];
      
      // Check if there's a ground route from the alternative airport
      let groundRouteInfo = null;
      if (alternative) {
        // Get the city name for the alternative airport
        const altAirportData = PHILIPPINE_AIRPORTS[alternative];
        const altCityName = altAirportData?.city || alternative;
        
        const groundRoute = findGroundRoute(altCityName, normDestination);
        if (groundRoute) {
          groundRouteInfo = {
            from: alternativeName || altCityName,
            travelTime: `${groundRoute.travelTime} hours`,
            cost: `₱${groundRoute.cost.min.toLocaleString()}-${groundRoute.cost.max.toLocaleString()}`,
            modes: groundRoute.modes.join('/'),
            operators: groundRoute.operators?.[0] || 'Multiple operators'
          };
        }
      }
    
      // Build detailed recommendation - CONCISE & ACTIONABLE
      let detailedRecommendation = destAirportData.recommendation;
      
      // If we have ground route info, create SCANNABLE recommendation
      if (groundRouteInfo && alternative) {
        const altCityName = PHILIPPINE_AIRPORTS[alternative]?.city || alternative;
        // OPTIMIZED: Single sentence, action-oriented
        detailedRecommendation = `Fly to ${altCityName} (${alternative}), then ${groundRouteInfo.modes} to ${normDestination} (${groundRouteInfo.travelTime}, ${groundRouteInfo.cost}).`;
      } else if (!detailedRecommendation && alternative) {
        // Fallback if no ground route info - still concise
        detailedRecommendation = `Fly to ${alternativeName || alternative}, then ground transport to ${normDestination}.`;
      }
      
      return {
        mode: TRANSPORT_MODE.FLIGHT_REQUIRED,
        searchFlights: includeFlights,
        hasAirport: false,
        recommendation: detailedRecommendation || `${normDestination} has limited airport service. Fly to nearby hub instead.`,
        warning: groundRouteInfo 
          ? `${normDestination}: No direct flights. ${alternative} + ${groundRouteInfo.travelTime} transfer.`
          : `${normDestination}: Limited airport service. Use nearby hub.`,
        alternative: alternative,
        alternativeName: alternativeName,
        destinationAirport: destinationAirport,
        notes: destAirportData.notes,
        groundRouteFromAlternative: groundRouteInfo
      };
    }
  }

  // Step 2: Check regional context
  const regionalContext = isRegionalTransportPractical(
    normDeparture,
    normDestination
  );

  // Step 3: Check if crossing major geographic boundaries
  const boundaryCheck = checkGeographicBoundaries(
    normDeparture,
    normDestination
  );

  // ========== INTELLIGENT DECISION LOGIC ==========
  // Priority: Direct flights > Ground transport (if practical) > Connecting flights

  // Case 1: Ground route exists and is documented
  if (groundRoute) {
    const convenience = classifyTransportConvenience({
      travelTimeHours: groundRoute.travelTime,
      distanceKm: groundRoute.distance,
      hasOvernightOption: groundRoute.hasOvernightOption,
      hasFerry: groundRoute.hasFerry,
      scenic: groundRoute.scenic,
    });

    // Sub-case 1a-PRIORITY: Routes with preferOverFlight flag
    // These are long routes where overnight bus is MORE practical than connecting flights
    // (e.g., ZAM-CGY: 11hr overnight bus vs 7-11hr daytime flight journey with layovers)
    if (groundRoute.preferOverFlight) {
      return {
        mode: TRANSPORT_MODE.GROUND_PREFERRED,
        primaryMode: TRANSPORT_MODE.BUS,
        searchFlights: false, // Don't auto-search flights - ground is primary
        hasAirport: bothHaveAirports,
        recommendation: `Overnight ${groundRoute.modes.join("/")} recommended. ${groundRoute.notes || 'Sleep during travel, arrive refreshed.'}`,
        groundTransport: {
          available: true,
          practical: true,
          preferred: true,
          travelTime: `${groundRoute.travelTime} hours`,
          distance: `${groundRoute.distance} km`,
          modes: groundRoute.modes,
          cost: `₱${groundRoute.cost.min.toLocaleString()}-${groundRoute.cost.max.toLocaleString()}`,
          frequency: groundRoute.frequency,
          operators: groundRoute.operators,
          scenic: groundRoute.scenic || false,
          notes: groundRoute.notes,
          hasOvernightOption: groundRoute.hasOvernightOption,
          convenienceLevel: "OVERNIGHT_OPTIMIZED", // Special category
        },
        flightAlternative: bothHaveAirports && directFlightInfo ? {
          available: true,
          direct: directFlightInfo.direct,
          connecting: !directFlightInfo.direct,
          suggestedHubs: directFlightInfo.suggestedHubs,
          note: directFlightInfo.direct 
            ? `Direct flights available but overnight bus more time-efficient (sleep during travel).`
            : `Connecting flights available (${directFlightInfo.suggestedHubs?.[0]?.hub}) but with 2-4hr layovers. Overnight bus recommended for better time efficiency.`
        } : null,
        regionalContext: regionalContext.sameRegion ? regionalContext : null,
      };
    }

    // Sub-case 1b: Ground transport is IMPRACTICAL
    // BUT: Explicit practical flag overrides automatic classification
    // (e.g., routes marked practical despite long distance)
    const isImpractical = (convenience.level === "IMPRACTICAL" || groundRoute.impractical) && !groundRoute.practical;
    
    if (isImpractical) {
      // Calculate flight metrics if airports available
      let flightRecommendation = "Flight strongly recommended.";
      let flightMetrics = {};
      
      if (bothHaveAirports) {
        const depAirport = PHILIPPINE_AIRPORTS[departureAirport];
        const destAirport = PHILIPPINE_AIRPORTS[destinationAirport];
        
        if (depAirport?.coordinates && destAirport?.coordinates) {
          const distanceKm = calculateDistance(
            depAirport.coordinates.lat,
            depAirport.coordinates.lng,
            destAirport.coordinates.lat,
            destAirport.coordinates.lng
          );
          
          flightMetrics.distance = `${Math.round(distanceKm)} km`;
          flightMetrics.estimated_flight_time = estimateFlightTime(distanceKm);
          
          // Enhanced with direct flight information
          if (directFlightInfo?.direct) {
            flightRecommendation = `Direct flights available (~${flightMetrics.estimated_flight_time} vs ${groundRoute.travelTime} hours by ground). Airlines: ${directFlightInfo.airlines?.join(', ')}.`;
            flightMetrics.direct_flight = true;
            flightMetrics.airlines = directFlightInfo.airlines;
            flightMetrics.frequency = directFlightInfo.frequency;
          } else if (directFlightInfo?.suggestedHubs?.length > 0) {
            flightRecommendation = `Connecting flight via ${directFlightInfo.suggestedHubs[0].hub} (~${flightMetrics.estimated_flight_time} flight time vs ${groundRoute.travelTime} hours by ground).`;
            flightMetrics.direct_flight = false;
            flightMetrics.connecting_via = directFlightInfo.suggestedHubs[0].hub;
          } else {
            flightRecommendation = `Flight is the best option (~${flightMetrics.estimated_flight_time} vs ${groundRoute.travelTime} hours by ground).`;
          }
        }
      }
      
      return {
        mode: TRANSPORT_MODE.FLIGHT_REQUIRED,
        searchFlights: true,
        hasAirport: bothHaveAirports,
        recommendation: `Ground travel takes ${groundRoute.travelTime}+ hours. ${
          bothHaveAirports
            ? flightRecommendation
            : "Consider breaking journey into multiple stops."
        }`,
        ...flightMetrics,
        groundTransportNotice: {
          available: true,
          practical: false,
          travelTime: `${groundRoute.travelTime} hours`,
          distance: `${groundRoute.distance} km`,
          cost: `₱${groundRoute.cost.min.toLocaleString()}-${groundRoute.cost.max.toLocaleString()}`,
          modes: groundRoute.modes,
          warning: convenience.userMessage,
          hasOvernightOption: groundRoute.hasOvernightOption || false,
          notes: groundRoute.notes,
        },
        regionalContext: regionalContext.sameRegion ? regionalContext : null,
      };
    }

    // Sub-case 1b: Ground transport is PRACTICAL (e.g., Zamboanga-Pagadian, Manila-Tagaytay)
    if (
      convenience.level === "VERY_CONVENIENT" ||
      convenience.level === "CONVENIENT"
    ) {
      // Determine primary mode icon
      let primaryMode = TRANSPORT_MODE.BUS;
      if (groundRoute.hasFerry) {
        primaryMode = TRANSPORT_MODE.FERRY;
      } else if (groundRoute.modes.includes("van")) {
        primaryMode = TRANSPORT_MODE.VAN;
      } else if (groundRoute.modes.includes("roro")) {
        primaryMode = TRANSPORT_MODE.RORO;
      }

      // Check if direct flights also available for this practical ground route
      let flightAlternative = null;
      if (directFlightInfo?.direct) {
        flightAlternative = {
          available: true,
          direct: true,
          airlines: directFlightInfo.airlines,
          frequency: directFlightInfo.frequency,
          note: `Direct flights also available (${directFlightInfo.frequency}) if you prefer faster travel.`
        };
      }

      return {
        mode: TRANSPORT_MODE.GROUND_PREFERRED,
        primaryMode: primaryMode,
        searchFlights: false, // Don't search flights by default for practical ground routes
        hasAirport: bothHaveAirports,
        recommendation: `${convenience.userMessage}. ${groundRoute.modes.join("/")} is the most convenient option.`,
        groundTransport: {
          available: true,
          practical: true,
          preferred: true,
          travelTime: `${groundRoute.travelTime} hours`,
          distance: `${groundRoute.distance} km`,
          modes: groundRoute.modes,
          cost: `₱${groundRoute.cost.min.toLocaleString()}-${groundRoute.cost.max.toLocaleString()}`,
          frequency: groundRoute.frequency,
          operators: groundRoute.operators,
          scenic: groundRoute.scenic || false,
          notes: groundRoute.notes,
          convenienceLevel: convenience.level,
        },
        flightAlternative: flightAlternative,
        regionalContext: regionalContext.sameRegion
          ? {
              region: regionalContext.region,
              characteristics: regionalContext.characteristics,
              hub: regionalContext.hub,
            }
          : null,
        alternativeMode: bothHaveAirports ? "flight" : null,
        alternativeNote: bothHaveAirports
          ? "Flights available but ground transport is more convenient and economical"
          : null,
      };
    }

    // Sub-case 1c: Ground transport is ACCEPTABLE (e.g., Manila-Baguio)
    if (convenience.level === "ACCEPTABLE") {
      let primaryMode = TRANSPORT_MODE.BUS;
      if (groundRoute.hasFerry) {
        primaryMode = TRANSPORT_MODE.FERRY;
      } else if (groundRoute.modes.includes("van")) {
        primaryMode = TRANSPORT_MODE.VAN;
      }

      return {
        mode: primaryMode,
        searchFlights: includeFlights && bothHaveAirports, // Allow flight search if user wants
        hasAirport: bothHaveAirports,
        recommendation: `${convenience.userMessage}. ${groundRoute.modes.join("/")} available.`,
        groundTransport: {
          available: true,
          practical: true,
          preferred: false,
          travelTime: `${groundRoute.travelTime} hours`,
          distance: `${groundRoute.distance} km`,
          modes: groundRoute.modes,
          cost: `₱${groundRoute.cost.min.toLocaleString()}-${groundRoute.cost.max.toLocaleString()}`,
          frequency: groundRoute.frequency,
          operators: groundRoute.operators,
          scenic: groundRoute.scenic || false,
          notes: groundRoute.notes,
          convenienceLevel: convenience.level,
          warning: convenience.warning,
        },
        regionalContext: regionalContext.sameRegion ? regionalContext : null,
        warning: convenience.warning,
        alternativeMode: bothHaveAirports ? "flight" : null,
      };
    }
  }

  // Case 2: Crossing major geographic boundaries (inter-island without documented route)
  if (boundaryCheck.crossesBoundary) {
    // Calculate flight metrics if airports available
    let flightRecommendation = "Flight is the most practical option.";
    let flightMetrics = {};
    
    if (bothHaveAirports) {
      const depAirport = PHILIPPINE_AIRPORTS[departureAirport];
      const destAirport = PHILIPPINE_AIRPORTS[destinationAirport];
      
      if (depAirport?.coordinates && destAirport?.coordinates) {
        const distanceKm = calculateDistance(
          depAirport.coordinates.lat,
          depAirport.coordinates.lng,
          destAirport.coordinates.lat,
          destAirport.coordinates.lng
        );
        
        flightMetrics.distance = `${Math.round(distanceKm)} km`;
        flightMetrics.estimated_flight_time = estimateFlightTime(distanceKm);
        
        // Enhanced with direct flight availability
        if (directFlightInfo?.direct) {
          flightRecommendation = `Direct flights available for this ${flightMetrics.distance} inter-island route (~${flightMetrics.estimated_flight_time}). Airlines: ${directFlightInfo.airlines?.join(', ')}, Frequency: ${directFlightInfo.frequency}.`;
          flightMetrics.direct_flight = true;
          flightMetrics.airlines = directFlightInfo.airlines;
          flightMetrics.frequency = directFlightInfo.frequency;
        } else if (directFlightInfo?.suggestedHubs?.length > 0) {
          flightRecommendation = `Connecting flight via ${directFlightInfo.suggestedHubs[0].hub} recommended for this ${flightMetrics.distance} inter-island route (~${flightMetrics.estimated_flight_time} flight time).`;
          flightMetrics.direct_flight = false;
          flightMetrics.connecting_via = directFlightInfo.suggestedHubs[0].hub;
          flightMetrics.connecting_route = directFlightInfo.suggestedHubs[0].route;
        } else {
          flightRecommendation = `Flight is the most practical option for this ${flightMetrics.distance} inter-island route (~${flightMetrics.estimated_flight_time}).`;
        }
      }
    }
    
    return {
      mode: TRANSPORT_MODE.FLIGHT_REQUIRED,
      searchFlights: true,
      hasAirport: bothHaveAirports,
      recommendation: `${boundaryCheck.recommendation}. ${
        bothHaveAirports
          ? flightRecommendation
          : "Limited transport options available."
      }`,
      ...flightMetrics,
      boundaryInfo: boundaryCheck,
      warning: !bothHaveAirports
        ? "One or both cities have limited airport service"
        : null,
    };
  }

  // Case 3: Same region but no documented route
  if (regionalContext.sameRegion) {
    // If same region and both have airports, suggest flight
    if (bothHaveAirports) {
      return {
        mode: TRANSPORT_MODE.FLIGHT,
        searchFlights: includeFlights,
        hasAirport: true,
        recommendation: `${regionalContext.recommendation}. Check with local operators for ground transport schedules.`,
        regionalContext: regionalContext,
        alternativeNote:
          "Ground transport may be available - check locally for schedules",
      };
    }

    // Same region but no airports - suggest checking local transport
    return {
      mode: TRANSPORT_MODE.BUS,
      searchFlights: false,
      hasAirport: false,
      recommendation: `Local ground transport likely available within ${regionalContext.region}. Check with local operators.`,
      regionalContext: regionalContext,
    };
  }

  // Case 4: Default - check if airports available and calculate flight metrics
  if (bothHaveAirports) {
    // Get airport coordinates from database
    const depAirport = PHILIPPINE_AIRPORTS[departureAirport];
    const destAirport = PHILIPPINE_AIRPORTS[destinationAirport];
    
    let distance = null;
    let flightTime = null;
    let groundTime = null;
    let recommendation = `Flight recommended for travel between ${normDeparture} and ${normDestination}.`;
    let flightMetrics = {};
    
    // Calculate metrics if coordinates available
    if (depAirport?.coordinates && destAirport?.coordinates) {
      const distanceKm = calculateDistance(
        depAirport.coordinates.lat,
        depAirport.coordinates.lng,
        destAirport.coordinates.lat,
        destAirport.coordinates.lng
      );
      
      distance = `${Math.round(distanceKm)} km`;
      flightTime = estimateFlightTime(distanceKm);
      groundTime = estimateGroundTime(distanceKm);
      
      // Enhanced recommendation with direct flight availability
      if (directFlightInfo?.direct) {
        recommendation = `Direct flights available for this ${distance} route (~${flightTime} flight time). Airlines: ${directFlightInfo.airlines?.join(', ')}, Frequency: ${directFlightInfo.frequency}.`;
        flightMetrics.direct_flight = true;
        flightMetrics.airlines = directFlightInfo.airlines;
        flightMetrics.frequency = directFlightInfo.frequency;
      } else if (directFlightInfo?.suggestedHubs?.length > 0) {
        recommendation = `Connecting flight via ${directFlightInfo.suggestedHubs[0].hub} for this ${distance} route (~${flightTime} flight time). Route: ${directFlightInfo.suggestedHubs[0].route}.`;
        flightMetrics.direct_flight = false;
        flightMetrics.connecting_via = directFlightInfo.suggestedHubs[0].hub;
        flightMetrics.connecting_route = directFlightInfo.suggestedHubs[0].route;
      } else {
        recommendation = `Flight is the most efficient option for this ${distance} route (~${flightTime} flight time).`;
      }
      
      // Add time savings context
      if (distanceKm > 250) {
        recommendation += ` Flying saves significant time compared to ${groundTime} by ground transport.`;
      }
    }
    
    return {
      mode: TRANSPORT_MODE.FLIGHT,
      searchFlights: includeFlights,
      hasAirport: true,
      recommendation,
      ...flightMetrics,
      distance,
      estimated_flight_time: flightTime,
      departureAirport: departureAirport.code,
      destinationAirport: destinationAirport.code,
      reason: recommendation, // Alias for backend compatibility
    };
  }

  // Case 5: No airports, no documented route
  return {
    mode: null,
    searchFlights: false,
    hasAirport: false,
    recommendation:
      "Limited transport information available. Please check with local transport operators.",
    warning: "Route information not in database",
  };
};

/**
 * Get transport mode icon
 * @param {string} mode - Transport mode constant
 * @returns {string} Emoji icon
 */
export const getTransportModeIcon = (mode) => {
  const icons = {
    [TRANSPORT_MODE.FLIGHT]: "✈️",
    [TRANSPORT_MODE.BUS]: "🚌",
    [TRANSPORT_MODE.FERRY]: "⛴️",
    [TRANSPORT_MODE.VAN]: "🚐",
    [TRANSPORT_MODE.PRIVATE_TRANSFER]: "🚕",
    [TRANSPORT_MODE.COMBINATION]: "✈️+🚌",
    [TRANSPORT_MODE.RORO]: "🚢",
    [TRANSPORT_MODE.GROUND_PREFERRED]: "🚌✅",
    [TRANSPORT_MODE.FLIGHT_REQUIRED]: "✈️",
  };

  return icons[mode] || "🗺️";
};

/**
 * Get user-friendly transport mode label
 * @param {string} mode - Transport mode constant
 * @returns {string} Display label
 */
export const getTransportModeLabel = (mode) => {
  const labels = {
    [TRANSPORT_MODE.FLIGHT]: "Flight",
    [TRANSPORT_MODE.BUS]: "Bus",
    [TRANSPORT_MODE.FERRY]: "Ferry",
    [TRANSPORT_MODE.VAN]: "Van/Shuttle",
    [TRANSPORT_MODE.PRIVATE_TRANSFER]: "Local Transport",
    [TRANSPORT_MODE.COMBINATION]: "Flight + Ground Transfer",
    [TRANSPORT_MODE.RORO]: "RORO Ferry",
    [TRANSPORT_MODE.GROUND_PREFERRED]: "Ground Transport (Recommended)",
    [TRANSPORT_MODE.FLIGHT_REQUIRED]: "Flight (Required)",
  };

  return labels[mode] || "Transport";
};

/**
 * Synchronous wrapper for backward compatibility
 * Uses local logic only (no backend API call)
 * @param {string} destination - Destination city
 * @param {string} departureCity - Departure city
 * @param {boolean} includeFlights - Whether user wants flight search
 * @returns {Object} Transport mode analysis with recommendations
 */
export const determineTransportMode = (destination, departureCity, includeFlights = true) => {
  return determineTransportModeLocal(destination, departureCity, includeFlights);
};

export default {
  TRANSPORT_MODE,
  determineTransportMode,
  determineTransportModeAsync,
  determineTransportModeLocal,
  getTransportModeIcon,
  getTransportModeLabel,
};
