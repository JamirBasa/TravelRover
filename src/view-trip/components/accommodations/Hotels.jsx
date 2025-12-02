import React, { useEffect, useState, useCallback, useMemo } from "react";
import HotelCardItem from "./HotelCardItem";
import {
  verifySingleHotel,
  getDatabaseStats,
} from "../../../services/AccommodationVerification";
import { logDebug, logError } from "../../../utils/productionLogger";
import { parseDataArray } from "../../../utils/jsonParsers";
import {
  extractPrice,
  calculateValueScore,
  validateBudgetTier,
  identifySpecialHotels,
  enrichHotelWithValidation,
} from "../../../utils/hotelPricingValidator";
import { validateHotelBooking } from "../../../utils/hotelBookingDiagnostics";
import {
  filterHotelsByQuality,
  getQualityFilterMessage,
  logQualityFilterStats,
} from "../../../utils/hotelQualityFilter";

/**
 * Extract hotels from itinerary activities when hotels array is missing
 * This ensures hotels always display even if AI forgot to create tripData.hotels
 *
 * @param {Array} itinerary - Trip itinerary with days and activities
 * @returns {Array} - Extracted hotel objects with {name, hotelName, pricePerNight, description, source}
 */
function extractHotelsFromItinerary(itinerary) {
  if (!itinerary || !Array.isArray(itinerary)) return [];

  const hotelNames = new Set();
  const hotels = [];

  // Patterns to match hotel check-in activities
  const checkInPatterns = [
    /🏨\s*check-in\s+at\s+(.+?)(?:\s*\(|$)/i,
    /check-in\s+at\s+(.+?)(?:\s*\(|$)/i,
    /check\s+in\s+at\s+(.+?)(?:\s*\(|$)/i,
  ];

  itinerary.forEach((day, dayIndex) => {
    if (!day.plan || !Array.isArray(day.plan)) return;

    day.plan.forEach((activity) => {
      const placeName = activity?.placeName || "";
      const placeDetails = activity?.placeDetails || "";

      // Try to extract hotel name using patterns
      for (const pattern of checkInPatterns) {
        const match = placeName.match(pattern);
        if (match && match[1]) {
          const hotelName = match[1].trim();

          // Avoid duplicates
          if (!hotelNames.has(hotelName)) {
            hotelNames.add(hotelName);

            // Extract price from activity if available
            const priceMatch = (
              activity.ticketPricing ||
              placeDetails ||
              ""
            ).match(/₱([\d,]+)/i);
            const pricePerNight = priceMatch
              ? `₱${priceMatch[1]}`
              : "Price varies";

            hotels.push({
              name: hotelName,
              hotelName: hotelName,
              hotel_name: hotelName,
              pricePerNight: pricePerNight,
              description: placeDetails || `Check-in at ${hotelName}`,
              source: "itinerary_extraction",
              isRealHotel: false,
              verified: false,
              // Additional metadata for transparency
              extractedFromDay: dayIndex + 1,
              extractedFromActivity: placeName,
            });

            console.log(
              `🏨 Extracted hotel from itinerary: "${hotelName}" (Day ${
                dayIndex + 1
              })`
            );
          }
          break; // Found a match, no need to try other patterns
        }
      }
    });
  });

  if (hotels.length > 0) {
    console.log(
      `✅ Successfully extracted ${hotels.length} hotel(s) from itinerary`
    );
  }

  return hotels;
}

function Hotels({ trip }) {
  const [verifiedHotels, setVerifiedHotels] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // ========================================
  // GET HOTELS DATA (Real + AI)
  // ========================================
  const getHotelsData = useCallback(() => {
    // Debug: Log the entire trip structure
    logDebug("Hotels", "Full trip object", trip);
    logDebug("Hotels", "trip.tripData", trip?.tripData);
    logDebug("Hotels", "trip.realHotelData", trip?.realHotelData);

    // Get AI-generated hotels from trip data
    const possiblePaths = [
      trip?.tripData?.hotels,
      trip?.tripData?.accommodations,
      trip?.tripData?.tripData?.hotels,
      trip?.tripData?.tripData?.accommodations,
    ];

    logDebug("Hotels", "Possible paths", possiblePaths);

    const aiHotelsRaw = possiblePaths.find((path) => path !== undefined) || [];
    let aiHotels = parseDataArray(aiHotelsRaw, "hotels");

    // ========================================
    // FALLBACK: Extract hotels from itinerary if hotels array is missing
    // ========================================
    if (aiHotels.length === 0 && trip?.tripData?.itinerary) {
      console.log(
        "🏨 No hotels array found - extracting from itinerary activities..."
      );
      const extractedHotels = extractHotelsFromItinerary(
        trip.tripData.itinerary
      );

      if (extractedHotels.length > 0) {
        logDebug(
          "Hotels",
          `Extracted ${extractedHotels.length} hotel(s) from check-in activities`,
          extractedHotels
        );
        aiHotels = extractedHotels;
      } else {
        console.log("⚠️ No hotels found in itinerary either");
      }
    }

    // Get real hotels from LangGraph results
    // Firebase may store this as a JSON string, so we need to handle that case
    let realHotelsRaw = trip?.realHotelData?.hotels || [];

    // If it's a string, try to parse it
    if (typeof realHotelsRaw === "string" && realHotelsRaw.trim()) {
      try {
        // First, try to parse as-is
        const parsed = JSON.parse(realHotelsRaw);

        if (Array.isArray(parsed)) {
          realHotelsRaw = parsed;
          logDebug(
            "Hotels",
            `Parsed ${parsed.length} hotels from JSON array string`
          );
        } else if (typeof parsed === "object") {
          realHotelsRaw = [parsed];
          logDebug("Hotels", "Parsed single hotel from JSON object string");
        }
      } catch (error) {
        // If direct parsing fails, try wrapping in brackets (malformed JSON case)
        logDebug(
          "Hotels",
          "Initial JSON parse failed, trying alternative format",
          { error: error.message }
        );
        try {
          const wrappedParsed = JSON.parse(`[${realHotelsRaw}]`);
          if (Array.isArray(wrappedParsed)) {
            realHotelsRaw = wrappedParsed;
            logDebug(
              "Hotels",
              `Parsed ${wrappedParsed.length} hotels from malformed JSON (added brackets)`
            );
          }
        } catch (error2) {
          logDebug(
            "Hotels",
            "Failed to parse realHotelData.hotels string after all attempts",
            {
              error: error2.message,
              rawPreview: realHotelsRaw.substring(0, 500),
            }
          );
          realHotelsRaw = [];
        }
      }
    }

    const realHotels = parseDataArray(realHotelsRaw, "real hotels");

    logDebug(
      "Hotels",
      `Hotels found - Real: ${realHotels.length}, AI: ${aiHotels.length}`
    );
    logDebug("Hotels", "AI Hotels", aiHotels);
    logDebug("Hotels", "Real Hotels", realHotels);

    // ========================================
    // PRIORITY LOGIC: Real Hotels vs AI Hotels
    // ========================================
    const hotelSearchRequested = trip?.hotelSearchRequested || false;
    const hasRealHotels = trip?.hasRealHotels || false;

    let finalRealHotels = realHotels;
    let finalAiHotels = aiHotels;

    // CASE 1: User did NOT request hotel search → Show ONLY AI hotels
    if (!hotelSearchRequested) {
      logDebug(
        "Hotels",
        `Hotel search not requested - Showing ${aiHotels.length} AI-generated hotels from tripData.hotels`
      );
      finalRealHotels = []; // Don't show real hotels section
      finalAiHotels = aiHotels; // Show AI hotels
    }
    // CASE 2: User requested hotel search AND real hotels available → Merge real + AI hotels
    else if (hotelSearchRequested && hasRealHotels && realHotels.length > 0) {
      logDebug(
        "Hotels",
        `User requested hotel search - Merging ${realHotels.length} verified real hotels + ${aiHotels.length} AI recommendations for maximum choice`
      );
      finalRealHotels = realHotels; // Show real hotels first (trusted)
      finalAiHotels = aiHotels; // Also show AI hotels (additional budget tiers)
    }
    // CASE 3: User requested hotel search BUT real hotels failed → Show AI hotels as fallback
    else if (
      hotelSearchRequested &&
      (!hasRealHotels || realHotels.length === 0)
    ) {
      logDebug(
        "Hotels",
        `Real hotel search requested but failed/empty - Showing ${aiHotels.length} AI recommendations as fallback`
      );
      finalRealHotels = []; // Don't show empty real section
      finalAiHotels = aiHotels; // Show AI fallback
    }

    // Mark hotels with their source
    const markedRealHotels = finalRealHotels.map((hotel) => ({
      ...hotel,
      source: "real",
      isRealHotel: true,
    }));

    const markedAiHotels = finalAiHotels.map((hotel) => ({
      ...hotel,
      source: "ai",
      isRealHotel: false,
    }));

    // Return real hotels first, then AI hotels
    return [...markedRealHotels, ...markedAiHotels];
  }, [trip]);

  // ========================================
  // VERIFY ALL HOTELS (WITH SMART LIMITING)
  // ========================================
  const verifyAllHotels = useCallback(async () => {
    const hotelsData = getHotelsData();

    if (hotelsData.length === 0) {
      logDebug("Hotels", "No hotels found in trip data");
      setVerifiedHotels([]);
      return;
    }

    // ✅ OPTIMIZATION: Limit hotels BEFORE verification to save API calls
    const MAX_HOTELS_TO_VERIFY = 5;

    // Separate real and AI hotels
    const realHotels = hotelsData.filter((h) => h.isRealHotel);
    const aiHotels = hotelsData.filter((h) => !h.isRealHotel);

    // Real hotels: Already verified, show all (no API calls needed)
    // AI hotels: Limit to MAX before verification (saves API calls)
    let hotelsToVerify = [];

    if (realHotels.length > 0) {
      logDebug(
        "Hotels",
        `Displaying ${realHotels.length} real hotels (pre-verified)`
      );
      hotelsToVerify = realHotels.slice(0, MAX_HOTELS_TO_VERIFY);
    } else if (aiHotels.length > 0) {
      const originalCount = aiHotels.length;
      const limitedCount = Math.min(aiHotels.length, MAX_HOTELS_TO_VERIFY);
      logDebug(
        "Hotels",
        `Selecting top ${limitedCount} hotels from ${originalCount} AI recommendations`
      );
      hotelsToVerify = aiHotels.slice(0, MAX_HOTELS_TO_VERIFY);
    }

    if (hotelsToVerify.length === 0) {
      setVerifiedHotels([]);
      return;
    }

    setIsVerifying(true);
    logDebug(
      "Hotels",
      `Verifying ${hotelsToVerify.length} hotels for quality and availability`
    );

    // Batch process in chunks of 5 for better performance
    const BATCH_SIZE = 5;
    const verified = [];

    for (let i = 0; i < hotelsToVerify.length; i += BATCH_SIZE) {
      const batch = hotelsToVerify.slice(i, i + BATCH_SIZE);

      // ✅ FIXED: ALL hotels need verification to get hotel_id from accommodations.json
      const batchResults = await Promise.all(
        batch.map((hotel) => {
          // ✅ Both real and AI hotels need to be matched against accommodations.json
          // to extract the Agoda hotel_id for booking links
          return verifySingleHotel(hotel);
        })
      );

      batchResults.forEach((result, idx) => {
        const hotel = batch[idx];
        if (result.verified && result.firestoreData) {
          // ✅ DEBUG: Check if hotel_id exists in firestoreData
          logDebug(
            "Hotels",
            `Merging hotel: ${hotel.hotelName || hotel.name}`,
            {
              originalHotelId: hotel.hotel_id,
              firestoreHotelId: result.firestoreData.hotel_id,
              firestoreKeys: Object.keys(result.firestoreData),
            }
          );

          // ✅ FIX: Spread firestoreData LAST to preserve hotel_id and other enriched data
          const mergedHotel = {
            ...hotel,
            ...result.firestoreData,
            verified: true,
            matchScore: result.matchScore,
            verificationResult: result,
          };

          logDebug("Hotels", "Merged hotel IDs", {
            hotel_id: mergedHotel.hotel_id,
            hotelId: mergedHotel.hotelId,
          });

          verified.push(mergedHotel);
        } else {
          verified.push({
            ...hotel,
            verified: false,
            verificationResult: result,
          });
        }
      });
    }

    const verifiedCount = verified.filter((h) => h.verified).length;

    setVerifiedHotels(verified);
    setIsVerifying(false);

    logDebug("Hotels", "Hotel verification complete", {
      displayed: verified.length,
      verified: verifiedCount,
      qualityScore: ((verifiedCount / verified.length) * 100).toFixed(0) + "%",
    });
  }, [getHotelsData]);

  // ========================================
  // QUALITY FILTER + SORT HOTELS (MEMOIZED)
  // ========================================
  const hotels = useMemo(() => {
    // ✅ STEP 1: Apply quality filtering to show only high-confidence hotels
    // ⚠️ RELAXED FILTER: Show ALL hotels from itinerary to prevent confusion
    // When itinerary says "Check-in at Hotel X", users expect to see Hotel X in this section
    // Quality badges (Tier 1-6) inform users about match confidence
    const filterResults = filterHotelsByQuality(verifiedHotels, {
      minTierLevel: 6, // Show ALL tiers (1-6) - let users decide based on badges
      requireValidHotelId: false, // Show hotels even without direct booking links
      minHotelsThreshold: 1, // Show at least 1 hotel always
    });

    // Log filtering stats for debugging
    logQualityFilterStats(filterResults);
    logDebug("Hotels", "Quality filter applied", {
      totalInput: verifiedHotels.length,
      filtered: filterResults.stats.filtered,
      excluded: filterResults.stats.excluded,
      tier1: filterResults.stats.tier1Count,
      tier2: filterResults.stats.tier2Count,
      tier3: filterResults.stats.tier3Count,
    });

    // Use filtered hotels instead of all verified hotels
    const qualityFilteredHotels = filterResults.filteredHotels;

    // Separate real and AI hotels from filtered results
    const realHotels = qualityFilteredHotels.filter((h) => h.isRealHotel);
    const aiHotels = qualityFilteredHotels.filter((h) => !h.isRealHotel);

    // Get user's budget level from trip
    const budgetLevel = trip?.userSelection?.hotelData?.budgetLevel || 3; // Default to Mid-Range

    // ✅ ENHANCED: Multi-criteria sorting algorithm
    // Priority: Budget compliance > Value Score (price + rating + reviews) > Price
    const sortByValueScore = (a, b) => {
      // Get prices
      const priceA = extractPrice(
        a?.pricePerNight || a?.priceRange || a?.price_range
      );
      const priceB = extractPrice(
        b?.pricePerNight || b?.priceRange || b?.price_range
      );

      // Handle missing prices
      if (priceA === 0 && priceB === 0) return 0;
      if (priceA === 0) return 1; // Hotels without price go to end
      if (priceB === 0) return -1;

      // Step 1: Sort by budget compliance (within budget = first)
      const complianceA = validateBudgetTier(priceA, budgetLevel);
      const complianceB = validateBudgetTier(priceB, budgetLevel);

      if (complianceA.isCompliant !== complianceB.isCompliant) {
        return complianceA.isCompliant ? -1 : 1; // Budget-compliant first
      }

      // Step 2: Sort by value score (rating + reviews + price balance)
      const scoreA = calculateValueScore(a);
      const scoreB = calculateValueScore(b);

      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher value score first
      }

      // Step 3: Sort by lowest price as tiebreaker
      return priceA - priceB;
    };

    const sortedRealHotels = [...realHotels].sort(sortByValueScore);
    const sortedAiHotels = [...aiHotels].sort(sortByValueScore);
    const allSorted = [...realHotels, ...aiHotels].sort(sortByValueScore);

    // ✅ Identify special hotels (cheapest, top-rated, best value)
    const specialHotels = identifySpecialHotels(allSorted, budgetLevel);

    // ✅ Enrich all hotels with validation and badge data
    const enrichedHotels = allSorted.map((hotel) =>
      enrichHotelWithValidation(hotel, budgetLevel, specialHotels)
    );

    // ✅ ENHANCED: Determine ACTUAL hotel used in itinerary (not best value)
    // Read Day 1 check-in hotel name from itinerary to mark correct hotel
    let actualItineraryHotel = null;

    if (trip?.tripData?.itinerary?.[0]?.plan) {
      const day1CheckIn = trip.tripData.itinerary[0].plan.find((activity) => {
        const placeName = (activity.placeName || "").toLowerCase();
        return placeName.includes("check") && placeName.includes("in");
      });

      if (day1CheckIn) {
        const checkInText = day1CheckIn.placeName;

        // Find which hotel from our list matches the check-in text
        actualItineraryHotel = allSorted.find((h) => {
          const hotelName = h.name || h.hotelName || h.hotel_name || "";
          const checkInLower = checkInText.toLowerCase();
          const hotelLower = hotelName.toLowerCase();

          // 1. EXACT SUBSTRING MATCH (most reliable)
          if (
            checkInLower.includes(hotelLower) ||
            hotelLower.includes(checkInLower)
          ) {
            return true;
          }

          // 2. STRICT WORD MATCHING (require multiple significant words to match)
          const nameParts = hotelName.toLowerCase().split(/\s+/);
          const checkInParts = checkInText.toLowerCase().split(/\s+/);

          // Filter out common words and location names (to prevent false positives)
          const commonWords = [
            "hotel",
            "inn",
            "resort",
            "lodge",
            "guesthouse",
            "guest",
            "house",
            "view",
            "grand",
            "the",
            "at",
            "and",
            "&",
          ];
          const significantHotelParts = nameParts.filter(
            (p) => p.length > 3 && !commonWords.includes(p)
          );
          const significantCheckInParts = checkInParts.filter(
            (p) => p.length > 3 && !commonWords.includes(p)
          );

          // Count how many significant words match
          const matchingWords = significantHotelParts.filter((part) =>
            significantCheckInParts.includes(part)
          );

          // Require at least 2 matching significant words OR 80% of hotel's significant words
          const matchThreshold = Math.max(
            2,
            Math.ceil(significantHotelParts.length * 0.8)
          );
          return matchingWords.length >= matchThreshold;
        });

        if (actualItineraryHotel) {
          console.log(
            `✅ Found itinerary hotel: "${
              actualItineraryHotel.name || actualItineraryHotel.hotelName
            }"`
          );
          console.log(`   Matches Day 1 check-in: "${checkInText}"`);
        } else {
          console.warn(
            `⚠️ Could not find hotel matching check-in: "${checkInText}"`
          );
          console.warn(
            `   Available hotels:`,
            allSorted.map((h) => h.name || h.hotelName)
          );
          console.warn(
            `   This indicates a hotel name mismatch between itinerary and hotels array!`
          );
          console.warn(
            `   The user may see different hotel names in itinerary vs booking section.`
          );
        }
      }
    }

    // ✅ FALLBACK: If we can't find actual hotel, use best value (old logic)
    const defaultHotel =
      actualItineraryHotel ||
      (specialHotels.budgetCompliantHotels.length > 0
        ? specialHotels.budgetCompliantHotels[0]
        : allSorted[0]);

    // Mark the default hotel (now based on actual itinerary)
    const hotelsWithDefault = enrichedHotels.map((h) => ({
      ...h,
      isDefaultHotel:
        h.name === defaultHotel.name || h.hotelName === defaultHotel.hotelName,
    }));

    // ✅ VALIDATION: Log if there's inconsistency
    if (actualItineraryHotel && trip?.tripData?.itinerary?.[0]?.plan) {
      const day1CheckIn = trip.tripData.itinerary[0].plan.find((activity) => {
        const placeName = (activity.placeName || "").toLowerCase();
        return placeName.includes("check") && placeName.includes("in");
      });

      if (day1CheckIn) {
        const checkInHotelName = day1CheckIn.placeName;
        const defaultHotelName = defaultHotel.name || defaultHotel.hotelName;

        console.log(
          `✅ Hotel badge assigned to: "${defaultHotelName}"\n` +
            `   Day 1 Check-in: "${checkInHotelName}"`
        );
      }
    }

    // ✅ LIMIT TO TOP 5 BEST VALUE HOTELS
    const MAX_HOTELS_TO_SHOW = 5;

    return {
      realHotels: sortedRealHotels.slice(0, MAX_HOTELS_TO_SHOW).map((h) => {
        const enriched = hotelsWithDefault.find(
          (eh) => eh.name === h.name || eh.hotelName === h.hotelName
        );
        return enriched || h;
      }),
      aiHotels: sortedAiHotels.slice(0, MAX_HOTELS_TO_SHOW).map((h) => {
        const enriched = hotelsWithDefault.find(
          (eh) => eh.name === h.name || eh.hotelName === h.hotelName
        );
        return enriched || h;
      }),
      allHotels: hotelsWithDefault.slice(0, MAX_HOTELS_TO_SHOW),
      // Store original counts for display
      totalRealHotels: realHotels.length,
      totalAiHotels: aiHotels.length,
      totalAllHotels: allSorted.length,
      // Special hotel indicators
      specialHotels,
      defaultHotel,
      budgetLevel,
      // ✅ NEW: Quality filter metadata
      qualityFilter: {
        results: filterResults,
        message: getQualityFilterMessage(
          filterResults,
          trip?.hotelSearchRequested || false
        ),
        stats: filterResults.stats,
      },
    };
  }, [
    verifiedHotels,
    trip?.userSelection?.hotelData?.budgetLevel,
    trip?.hotelSearchRequested,
  ]);

  // ========================================
  // CALCULATE AVERAGE PRICE (MEMOIZED)
  // ========================================
  const avgPrice = useMemo(() => {
    const hotelsWithPrices = hotels.allHotels.filter(
      (hotel) =>
        extractPrice(
          hotel?.pricePerNight || hotel?.priceRange || hotel?.price_range
        ) > 0
    );
    return hotelsWithPrices.length > 0
      ? hotelsWithPrices.reduce(
          (sum, hotel) =>
            sum +
            extractPrice(
              hotel?.pricePerNight || hotel?.priceRange || hotel?.price_range
            ),
          0
        ) / hotelsWithPrices.length
      : 0;
  }, [hotels.allHotels]);

  // ========================================
  // GENERATE GOOGLE HOTELS URL (for uncertain matches)
  // ========================================
  const generateGoogleHotelsURL = useCallback(
    (hotel) => {
      // ✅ CRITICAL: Use AI-generated name for Google search (not database name)
      // Prevents STAY Hotel → Star Hotel confusion when searching Google
      const hotelName =
        hotel?.ai_hotel_name ||
        hotel?.name ||
        hotel?.hotelName ||
        hotel?.hotel_name ||
        "";
      const cityName = trip?.userSelection?.location?.split(",")[0] || "";
      const checkIn = trip?.userSelection?.startDate || "";
      const checkOut = trip?.userSelection?.endDate || "";
      const adults = trip?.userSelection?.travelers || 1;

      // Google Hotels search URL with hotel name and location
      const searchQuery = `${hotelName} ${cityName}`.trim();

      const params = new URLSearchParams({
        q: searchQuery,
        ts: "CAEaAggA", // Google Hotels search mode
        qs: searchQuery,
        ap: "MAA", // Accommodation type: hotel
        hl: "en",
      });

      // Add dates if available
      if (checkIn) {
        params.append("check_in_date", checkIn);
      }
      if (checkOut) {
        params.append("check_out_date", checkOut);
      }

      // Add travelers count
      params.append("adults", adults);

      // Add Google Place ID if available for exact match
      if (hotel?.place_id || hotel?.google_place_id) {
        params.append("htidocid", hotel.place_id || hotel.google_place_id);
      }

      const googleUrl = `https://www.google.com/travel/hotels?${params.toString()}`;

      logDebug("Hotels", "Generated Google Hotels URL", {
        aiHotelName: hotel?.ai_hotel_name,
        databaseHotelName: hotel?.hotel_name,
        usedName: hotelName,
        cityName,
        hasPlaceId: !!(hotel?.place_id || hotel?.google_place_id),
        url: googleUrl,
      });

      return googleUrl;
    },
    [trip?.userSelection]
  );

  // ========================================
  // GENERATE AGODA BOOKING URL
  // ========================================
  const generateAgodaBookingURL = useCallback(
    (hotel) => {
      // Debug: Log the entire hotel object to see all available IDs
      logDebug("Hotels", "Full hotel object", hotel);
      logDebug("Hotels", "Hotel ID fields", {
        hotel_id: hotel?.hotel_id,
        hotelId: hotel?.hotelId,
        id: hotel?.id,
        place_id: hotel?.place_id,
        google_place_id: hotel?.google_place_id,
        verified: hotel?.verified,
        verificationResult: hotel?.verificationResult,
        firestoreHotelId: hotel?.verificationResult?.firestoreData?.hotel_id,
      });

      // ✅ CRITICAL: Extract hotel_id and validate it's numeric (Agoda format)
      // Priority order: hotel_id > hotelId > id (but only if numeric)
      let hotelId = null;
      let hotelIdSource = null;

      // Check hotel_id first
      if (hotel?.hotel_id && !String(hotel.hotel_id).startsWith("ChIJ")) {
        hotelId = hotel.hotel_id;
        hotelIdSource = "hotel.hotel_id";
        logDebug("Hotels", "Using hotel.hotel_id", { hotelId });
      }
      // Check hotelId (camelCase)
      else if (hotel?.hotelId && !String(hotel.hotelId).startsWith("ChIJ")) {
        hotelId = hotel.hotelId;
        hotelIdSource = "hotel.hotelId";
        logDebug("Hotels", "Using hotel.hotelId", { hotelId });
      }
      // Check id (but verify it's not a Google Place ID)
      else if (hotel?.id && !String(hotel.id).startsWith("ChIJ")) {
        hotelId = hotel.id;
        hotelIdSource = "hotel.id";
        logDebug("Hotels", "Using hotel.id", { hotelId });
      }

      // ✅ VALIDATION: Ensure we have a valid numeric Agoda hotel ID
      const isValidAgodaId = hotelId && /^\d+$/.test(String(hotelId));

      if (!hotelId || !isValidAgodaId) {
        logDebug("Hotels", "No valid Agoda hotel ID available", {
          foundId: hotelId,
          isNumeric: /^\d+$/.test(String(hotelId)),
          verified: hotel?.verified,
          hotelName: hotel?.ai_hotel_name || hotel?.name || hotel?.hotel_name,
          availableKeys: Object.keys(hotel).join(", "),
        });

        // ✅ Fallback: Search by city if no hotel ID
        const cityName =
          hotel?.city || trip?.userSelection?.location?.split(",")[0] || "";
        logDebug("Hotels", `Falling back to city search: ${cityName}`);
        return generateCitySearchURL(cityName);
      }

      // ⚠️ SAFETY CHECK: Verify hotel name matches before booking
      // Prevents wrong hotel redirect (e.g., STAY Hotel → Star Hotel)
      const hotelName = (
        hotel?.ai_hotel_name ||
        hotel?.name ||
        hotel?.hotel_name ||
        ""
      ).toLowerCase();
      const matchScore = hotel?.matchScore || 0;

      logDebug("Hotels", "Hotel booking details", {
        requestedHotel:
          hotel?.ai_hotel_name || hotel?.name || hotel?.hotel_name,
        databaseMatch: hotel?.hotel_name,
        hotelId: hotelId,
        idSource: hotelIdSource,
        matchScore: matchScore,
        qualityTier: hotel?.qualityTier,
        verified: hotel?.verified,
      });

      // ⚠️ CRITICAL FIX: Smart Hybrid Routing based on confidence and tier
      // - Tier 1 (Verified, 100%): Direct Agoda booking ✅
      // - Tier 2 (Trusted, 90-99%) with match >= 95%: Agoda with warning ✅
      // - Tier 2 (Trusted) with match < 95%: Google Hotels (safer) 🔍
      // - Tier 3-6 with match < 95%: Agoda city search 🔍

      const qualityTier = hotel?.qualityTier || 6;
      const isPerfectMatch = matchScore === 1.0 || qualityTier === 1;
      const isHighConfidenceTrusted = qualityTier === 2 && matchScore >= 0.95;
      const isLowConfidenceTrusted = qualityTier === 2 && matchScore < 0.95;

      // Route Tier 2 with low confidence to Google Hotels (prevents wrong hotel redirect)
      if (isLowConfidenceTrusted) {
        logDebug(
          "Hotels",
          "Trusted tier with match < 95% - routing to Google Hotels",
          {
            aiHotelName: hotel?.ai_hotel_name || hotel?.name,
            databaseMatch: hotel?.hotel_name,
            matchScore: matchScore,
            qualityTier: qualityTier,
            decision: "google_hotels",
            reason:
              "Safer for uncertain Trusted matches - uses exact Google Place ID",
          }
        );

        return generateGoogleHotelsURL(hotel);
      }

      // Route Tier 3-6 with low confidence to Agoda city search
      if (!isPerfectMatch && !isHighConfidenceTrusted) {
        logDebug(
          "Hotels",
          "Low confidence or lower tier - using Agoda city search",
          {
            aiHotelName: hotel?.ai_hotel_name || hotel?.name,
            databaseMatch: hotel?.hotel_name,
            matchScore: matchScore,
            qualityTier: qualityTier,
            decision: "agoda_city_search",
          }
        );

        const cityName = trip?.userSelection?.location?.split(",")[0] || "";
        const searchQuery = `${
          hotel?.ai_hotel_name || hotel?.name || hotel?.hotel_name
        }, ${cityName}`;

        return `https://www.agoda.com/search?city=${encodeURIComponent(
          cityName
        )}&checkIn=${trip?.userSelection?.startDate || ""}&checkOut=${
          trip?.userSelection?.endDate || ""
        }&rooms=1&adults=1&children=0&cid=1952350&tag=${encodeURIComponent(
          searchQuery
        )}`;
      }

      const baseParams = {
        pcs: "1",
        cid: "1952350",
        hl: "en-us",
        currency: "PHP",
        NumberofAdults: "1",
        NumberofChildren: "0",
        Rooms: "1",
      };

      // Only compute dates if needed
      const dateParams = trip?.userSelection?.startDate
        ? {
            checkin: new Date(trip.userSelection.startDate)
              .toISOString()
              .split("T")[0],
            checkout: trip.userSelection.endDate
              ? new Date(trip.userSelection.endDate).toISOString().split("T")[0]
              : undefined,
          }
        : {};

      const params = new URLSearchParams({
        ...baseParams,
        hid: hotelId,
        ...dateParams,
      });

      const finalUrl = `https://www.agoda.com/partners/partnersearch.aspx?${params.toString()}`;

      logDebug("Hotels", "Generated Agoda URL", {
        hotelId,
        aiHotelName: hotel?.ai_hotel_name || hotel?.name,
        databaseMatch: hotel?.hotel_name,
        verified: hotel?.verified,
        url: finalUrl,
      });

      return finalUrl;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trip?.userSelection]
  );

  // ========================================
  // FALLBACK CITY SEARCH
  // ========================================
  const generateCitySearchURL = useCallback(
    (cityName) => {
      const baseParams = {
        pcs: "1",
        cid: "1952350",
        hl: "en-us",
        city: cityName,
        currency: "PHP",
        adults: "1",
        rooms: "1",
      };

      const dateParams = trip?.userSelection?.startDate
        ? {
            checkin: new Date(trip.userSelection.startDate)
              .toISOString()
              .split("T")[0],
            checkout: trip.userSelection.endDate
              ? new Date(trip.userSelection.endDate).toISOString().split("T")[0]
              : undefined,
          }
        : {};

      const params = new URLSearchParams({
        ...baseParams,
        ...dateParams,
      });

      return `https://www.agoda.com/?${params.toString()}`;
    },
    [trip?.userSelection]
  );

  // ========================================
  // HANDLE BOOKING (ENHANCED WITH VALIDATION)
  // ========================================
  const handleBookHotel = useCallback(
    (hotel) => {
      // ✅ Use AI-generated name for display (prevents STAY→Star confusion)
      const hotelName =
        hotel?.ai_hotel_name ||
        hotel?.name ||
        hotel?.hotelName ||
        hotel?.hotel_name ||
        "Unknown Hotel";

      logDebug("Hotels", "Booking attempt", {
        aiHotelName: hotel?.ai_hotel_name,
        databaseHotelName: hotel?.hotel_name,
        displayName: hotelName,
        hotelId: hotel.hotel_id,
        verified: hotel.verified,
        source: hotel.source,
      });

      // ✅ CRITICAL: Validate hotel booking capability
      const validation = validateHotelBooking(hotel);

      logDebug("Hotels", "Booking validation result", validation);

      // ❌ CASE 1: Cannot book - missing or invalid hotel_id
      if (!validation.canBook) {
        logError("Hotels", "Booking validation failed", {
          hotel: hotelName,
          reason: validation.reason,
          hasHotelId: validation.hasHotelId,
          isVerified: validation.isVerified,
          qualityTier: hotel?.qualityTier,
          qualityTierName: hotel?.qualityTierName,
        });

        // ✅ ENHANCED: Different messaging for Trusted (Tier 2) vs unverified hotels
        const qualityTier = hotel?.qualityTier || 6;
        const matchScore = hotel?.matchScore || 0;
        const isTrustedOrVerified = hotel?.verified || qualityTier <= 2;
        const isLowConfidenceTrusted = qualityTier === 2 && matchScore < 0.95;
        const cityName =
          trip?.userSelection?.location?.split(",")[0] || "your destination";

        let confirmMessage;

        // ✅ NEW: Trusted hotel with low confidence → Google Hotels
        if (isLowConfidenceTrusted) {
          confirmMessage =
            `🔍 Smart Hotel Search via Google\n\n` +
            `We'll show "${hotelName}" on Google Hotels for:\n\n` +
            `✓ Exact hotel verification (prevents wrong hotel redirect)\n` +
            `✓ Price comparison across multiple booking sites\n` +
            `✓ Recent reviews from verified guests\n` +
            `✓ Real-time availability and rates\n\n` +
            `This ensures you book the correct hotel at the best price.\n\n` +
            `Continue to Google Hotels?`;
        }
        // ✅ Trusted/verified hotel → Agoda search
        else if (isTrustedOrVerified) {
          confirmMessage =
            `🔍 Smart Hotel Search\n\n` +
            `We'll search for "${hotelName}" on Agoda to show you:\n\n` +
            `✓ Live availability and current prices\n` +
            `✓ Recent guest reviews and ratings\n` +
            `✓ Similar hotels in ${cityName} for comparison\n\n` +
            `This ensures you get the most accurate information and best deals.\n\n` +
            `Ready to search?`;
        }
        // ✅ AI hotel → educational messaging
        else {
          confirmMessage =
            `🏨 Hotel Recommendations\n\n` +
            `This is an AI-generated suggestion. For the most accurate information, ` +
            `we'll search all hotels in ${cityName} on Agoda.\n\n` +
            `💡 Pro Tip: For verified hotels with direct booking:\n` +
            `Create a new trip → Enable "Include Accommodation Search"\n\n` +
            `Continue to Agoda?`;
        }

        if (!confirm(confirmMessage)) {
          logDebug("Hotels", "User cancelled booking");
          return;
        }

        // Fallback to city search
        const citySearchUrl = generateCitySearchURL(cityName);
        logDebug("Hotels", "Opening Agoda city search", { url: citySearchUrl });
        window.open(citySearchUrl, "_blank");
        return;
      }

      // ⚠️ CASE 2: Bookable but unverified or low confidence - show warning
      // BUT: Skip warning if routing to Google Hotels (already safe)
      const qualityTier = hotel?.qualityTier || 6;
      const matchScore = hotel?.matchScore || 0;
      const isLowConfidenceTrusted = qualityTier === 2 && matchScore < 0.95;

      // Only warn for Agoda routes with uncertain match (NOT for Google Hotels routes)
      const shouldWarnBeforeAgodaBooking =
        validation.canBook &&
        !isLowConfidenceTrusted && // Skip if routing to Google Hotels
        (!validation.isVerified || (matchScore >= 0.95 && matchScore < 1.0));

      if (shouldWarnBeforeAgodaBooking) {
        const matchPercentage = hotel?.matchScore
          ? Math.round(hotel.matchScore * 100)
          : "unknown";

        const confirmMessage =
          `⚠️ Double-Check Recommended\n\n` +
          `Hotel: ${hotelName}\n` +
          `Match Confidence: ${matchPercentage}%\n\n` +
          `There's a ${
            100 - matchPercentage
          }% chance this could redirect to a different hotel with a similar name.\n\n` +
          `🔍 Safer Option:\n` +
          `Click "Find on Agoda" button instead to manually verify the correct hotel.\n\n` +
          `Continue with automatic booking anyway?`;

        if (!confirm(confirmMessage)) {
          logDebug("Hotels", "User cancelled booking due to match uncertainty");
          // Fallback to city search for safer manual selection
          const cityName =
            trip?.userSelection?.location?.split(",")[0] || "your destination";
          const citySearchUrl = generateCitySearchURL(cityName);
          window.open(citySearchUrl, "_blank");
          return;
        }
      }

      // ✅ CASE 3: Valid booking - proceed
      try {
        const bookingUrl = generateAgodaBookingURL(hotel);

        // Determine platform for logging (Google Hotels vs Agoda)
        const isGoogleHotelsRoute = qualityTier === 2 && matchScore < 0.95;
        const platform = isGoogleHotelsRoute ? "Google Hotels" : "Agoda";

        logDebug("Hotels", `Opening ${platform} booking`, {
          hotelName,
          platform,
          qualityTier,
          matchScore,
          agodaId: validation.agodaId,
          url: bookingUrl.substring(0, 100) + "...",
        });

        window.open(bookingUrl, "_blank");

        // Show success feedback
        console.log(`✅ Opened ${platform} booking for: ${hotelName}`);
      } catch (error) {
        logError("Hotels", "Failed to open booking URL", {
          error: error.message,
          hotel: hotelName,
        });

        alert(
          `❌ BOOKING ERROR\n\n` +
            `Failed to open Agoda booking page.\n` +
            `Error: ${error.message}\n\n` +
            `Please try again or search directly on Agoda.com`
        );
      }
    },
    [generateAgodaBookingURL, generateCitySearchURL, trip?.userSelection]
  );

  // ========================================
  // EFFECTS
  // ========================================
  useEffect(() => {
    // Log database statistics
    const stats = getDatabaseStats();
    logDebug("Hotels", "Hotel Database Stats", stats);

    // ✅ NEW: Auto-run booking diagnostics on mount
    if (trip && typeof window !== "undefined" && window.debugHotelBooking) {
      logDebug("Hotels", "Running automatic hotel booking diagnostics");
      try {
        const diagnostics = window.debugHotelBooking(trip);

        // Log critical issues if any
        if (diagnostics.issues && diagnostics.issues.length > 0) {
          logError("Hotels", "Booking diagnostics found issues", {
            issueCount: diagnostics.issues.length,
            issues: diagnostics.issues.slice(0, 3), // First 3 issues
          });
        }

        // Log summary
        logDebug("Hotels", "Booking diagnostics summary", diagnostics.summary);
      } catch (error) {
        logError("Hotels", "Failed to run booking diagnostics", error);
      }
    }
  }, [trip]);

  useEffect(() => {
    if (trip?.tripData) {
      verifyAllHotels();
    }
  }, [trip?.tripData, verifyAllHotels]);

  // ========================================
  // LOADING STATE
  // ========================================
  if (isVerifying) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-sky-100 dark:bg-sky-950/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl">🏨</span>
        </div>
        <h3 className="text-lg font-bold mb-2">
          Finding the Best Accommodations...
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We're selecting top places to stay for you
        </p>
      </div>
    );
  }

  // ========================================
  // EMPTY STATE (ENHANCED WITH QUALITY FILTER MESSAGE)
  // ========================================
  if (!hotels || hotels.allHotels.length === 0) {
    const hotelSearchRequested = trip?.hotelSearchRequested || false;
    const qualityMessage = hotels?.qualityFilter?.message || null;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="brand-gradient px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🏨</span>
            </div>
            <h2 className="text-xl font-bold text-white">Accommodations</h2>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">{qualityMessage?.icon || "🏨"}</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {qualityMessage?.title || "No Hotels Available"}
          </h3>

          {!hotelSearchRequested ? (
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Accommodation search was not enabled when this trip was created.
              </p>
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-xl p-5 border-2 border-sky-200 dark:border-sky-800">
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sky-600 dark:text-sky-400">💡</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sky-900 dark:text-sky-300 text-sm mb-2">
                      Want Accommodation Recommendations?
                    </h4>
                    <p className="text-sky-800 dark:text-sky-400 text-xs leading-relaxed">
                      Create a new trip and enable{" "}
                      <strong>"Include Accommodation Search"</strong> in the
                      preferences step to get personalized recommendations with
                      real data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                We couldn't retrieve accommodations for this destination. This
                may be temporary.
              </p>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-5 border-2 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 dark:text-amber-400">
                      🔍
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-2">
                      What You Can Do
                    </h4>
                    <ul className="text-amber-800 dark:text-amber-400 text-xs space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>Try regenerating this trip</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>
                          Search manually on <strong>Agoda</strong> or{" "}
                          <strong>Booking.com</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>Contact support if the issue persists</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Unified Professional Header */}
        <div className="brand-gradient px-4 sm:px-6 py-5 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>

          <div className="relative flex items-center justify-between gap-6">
            {/* Left: Title & Count */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">
                  Accommodations
                </h2>
                <p className="text-sm text-white/80 font-medium">
                  {hotels.allHotels.length}{" "}
                  {hotels.allHotels.length === 1 ? "option" : "options"}{" "}
                  available
                </p>
              </div>
            </div>

            {/* Right: Average Price Badge */}
            {avgPrice > 0 && (
              <div className="flex flex-col items-end bg-white/15 backdrop-blur-sm rounded-lg px-5 py-3 border border-white/20">
                <div className="text-xs text-white/70 font-medium uppercase tracking-wide mb-0.5">
                  Average
                </div>
                <div className="text-2xl font-bold text-white leading-tight">
                  ₱{Math.round(avgPrice).toLocaleString()}
                </div>
                <div className="text-xs text-white/70 font-medium">
                  per night
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hotels List */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950">
          {/* Quality Filter Info Banner */}
          {hotels.qualityFilter?.message &&
            (hotels.qualityFilter.message.type === "success" ||
              hotels.qualityFilter.message.type === "info") && (
              <div
                className={`mb-6 ${
                  hotels.qualityFilter.message.type === "success"
                    ? "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800"
                } rounded-lg p-4 border-2`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 ${
                      hotels.qualityFilter.message.type === "success"
                        ? "bg-emerald-100 dark:bg-emerald-950/50"
                        : "bg-blue-100 dark:bg-blue-950/50"
                    } rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <span
                      className={`${
                        hotels.qualityFilter.message.type === "success"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                      } text-lg`}
                    >
                      {hotels.qualityFilter.message.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-semibold ${
                        hotels.qualityFilter.message.type === "success"
                          ? "text-emerald-900 dark:text-emerald-300"
                          : "text-blue-900 dark:text-blue-300"
                      } text-sm mb-1`}
                    >
                      {hotels.qualityFilter.message.title}
                    </h4>
                    <p
                      className={`${
                        hotels.qualityFilter.message.type === "success"
                          ? "text-emerald-800 dark:text-emerald-400"
                          : "text-blue-800 dark:text-blue-400"
                      } text-xs leading-relaxed`}
                    >
                      {hotels.qualityFilter.message.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-6">
            {/* Combined Hotels Display - No Separation Between Real/AI */}
            {hotels.allHotels.map((hotel, index) => {
              const isFirstHotel = index === 0;
              const isBestValue = isFirstHotel && hotels.allHotels.length > 1;

              return (
                <div
                  key={hotel?.hotel_id || hotel?.id || `hotel-${index}`}
                  className="group relative"
                >
                  {/* Best Value Badge - Only on #1 Hotel */}
                  {isBestValue && (
                    <div className="absolute -top-3 -left-3 z-10">
                      <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <span className="font-bold text-sm">Best Value</span>
                      </div>
                    </div>
                  )}

                  {/* Check-in Badge - Only on First Hotel Overall */}
                  {isFirstHotel && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <span>✓</span>
                        <span>Day 1 Check-in</span>
                      </div>
                    </div>
                  )}

                  <HotelCardItem hotel={hotel} onBookHotel={handleBookHotel} />

                  {/* Divider - Except Last Item */}
                  {index < hotels.allHotels.length - 1 && (
                    <div className="mt-6 border-b border-gray-200 dark:border-slate-800"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Context-Aware Booking Tips */}
          <div className="mt-8 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-xl p-5 border-2 border-sky-200 dark:border-sky-800 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sky-600 dark:text-sky-400 text-xl">
                  💡
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sky-900 dark:text-sky-300 mb-3 text-base">
                  {hotels.realHotels.length > 0
                    ? "Verified Hotels"
                    : "AI-Generated Recommendations"}
                </h4>

                {hotels.realHotels.length > 0 ? (
                  <ul className="text-sm text-sky-800 dark:text-sky-400 space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        ✓
                      </span>
                      <span>
                        These hotels are verified through Google Places API with
                        real ratings and reviews
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        ✓
                      </span>
                      <span>
                        Click "Book Now" to check live availability and prices
                        on Agoda
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        ✓
                      </span>
                      <span>
                        Hotels are sorted by best value - lower prices appear
                        first
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        ✓
                      </span>
                      <span>
                        Check cancellation policies before booking for
                        flexibility
                      </span>
                    </li>
                  </ul>
                ) : (
                  <ul className="text-sm text-sky-800 dark:text-sky-400 space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0">
                        ⚠️
                      </span>
                      <span>
                        These are <strong>AI-generated estimates</strong> -
                        ratings and prices may not reflect real hotels
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span>
                        Click "Book Now" to search real hotels on Agoda with
                        current prices
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span>
                        For verified hotels, create a new trip with{" "}
                        <strong>"Include Accommodation Search"</strong> enabled
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span>
                        Book early for better rates and more availability
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span>Check cancellation policies for flexibility</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hotels;
