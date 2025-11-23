import React, { useEffect, useState, useCallback, useMemo } from "react";
import HotelCardItem from "./HotelCardItem";
import {
  verifySingleHotel,
  getDatabaseStats,
} from "../../../services/AccommodationVerification";
import { logDebug } from "../../../utils/productionLogger";
import { parseDataArray } from "../../../utils/jsonParsers";
import {
  extractPrice,
  calculateValueScore,
  validateBudgetTier,
  identifySpecialHotels,
  enrichHotelWithValidation,
} from "../../../utils/hotelPricingValidator";

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
    const aiHotels = parseDataArray(aiHotelsRaw, "hotels");

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
    // CASE 2: User requested hotel search AND real hotels available → Show ONLY real hotels
    else if (hotelSearchRequested && hasRealHotels && realHotels.length > 0) {
      logDebug(
        "Hotels",
        `User requested hotel search - Showing ONLY ${realHotels.length} verified real hotels (hiding ${aiHotels.length} AI recommendations)`
      );
      finalAiHotels = []; // Hide AI hotels - user wants real data
      finalRealHotels = realHotels; // Show real hotels
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
  // SORT HOTELS BY VALUE SCORE + BUDGET TIER (MEMOIZED)
  // ========================================
  const hotels = useMemo(() => {
    // Separate real and AI hotels
    const realHotels = verifiedHotels.filter((h) => h.isRealHotel);
    const aiHotels = verifiedHotels.filter((h) => !h.isRealHotel);

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

    // ✅ Determine default hotel for itinerary (best value within budget, then cheapest)
    const defaultHotel =
      specialHotels.budgetCompliantHotels.length > 0
        ? specialHotels.budgetCompliantHotels[0] // First budget-compliant = best value within budget
        : allSorted[0]; // Fallback to first hotel

    // Mark the default hotel
    const hotelsWithDefault = enrichedHotels.map((h) => ({
      ...h,
      isDefaultHotel:
        h.name === defaultHotel.name || h.hotelName === defaultHotel.hotelName,
    }));

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
    };
  }, [verifiedHotels, trip?.userSelection?.hotelData?.budgetLevel]);

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

      // Check hotel_id first
      if (hotel?.hotel_id && !String(hotel.hotel_id).startsWith("ChIJ")) {
        hotelId = hotel.hotel_id;
        logDebug("Hotels", "Using hotel.hotel_id", { hotelId });
      }
      // Check hotelId (camelCase)
      else if (hotel?.hotelId && !String(hotel.hotelId).startsWith("ChIJ")) {
        hotelId = hotel.hotelId;
        logDebug("Hotels", "Using hotel.hotelId", { hotelId });
      }
      // Check id (but verify it's not a Google Place ID)
      else if (hotel?.id && !String(hotel.id).startsWith("ChIJ")) {
        hotelId = hotel.id;
        logDebug("Hotels", "Using hotel.id", { hotelId });
      }

      // ✅ VALIDATION: Ensure we have a valid numeric Agoda hotel ID
      const isValidAgodaId = hotelId && /^\d+$/.test(String(hotelId));

      if (!hotelId || !isValidAgodaId) {
        logDebug("Hotels", "No valid Agoda hotel ID available", {
          foundId: hotelId,
          isNumeric: /^\d+$/.test(String(hotelId)),
          verified: hotel?.verified,
          hotelName: hotel?.hotel_name || hotel?.name,
          availableKeys: Object.keys(hotel).join(", "),
        });

        // ✅ Fallback: Search by city if no hotel ID
        const cityName =
          hotel?.city || trip?.userSelection?.location?.split(",")[0] || "";
        logDebug("Hotels", `Falling back to city search: ${cityName}`);
        return generateCitySearchURL(cityName);
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
        hotelName: hotel?.hotel_name || hotel?.name,
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
  // HANDLE BOOKING
  // ========================================
  const handleBookHotel = useCallback(
    (hotel) => {
      logDebug("Hotels", "Booking clicked", {
        hotelName: hotel.hotel_name || hotel.name,
        hotelId: hotel.hotel_id,
        verified: hotel.verified,
      });

      const bookingUrl = generateAgodaBookingURL(hotel);
      window.open(bookingUrl, "_blank");
    },
    [generateAgodaBookingURL]
  );

  // ========================================
  // EFFECTS
  // ========================================
  useEffect(() => {
    const stats = getDatabaseStats();
    logDebug("Hotels", "Hotel Database Stats", stats);
  }, []);

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
  // EMPTY STATE
  // ========================================
  if (!hotels || hotels.allHotels.length === 0) {
    const hotelSearchRequested = trip?.hotelSearchRequested || false;

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
            <span className="text-4xl">🏨</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            No Hotels Available
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
