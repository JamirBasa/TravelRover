import React, { useEffect, useState, useCallback, useMemo } from "react";
import HotelCardItem from "./HotelCardItem";
import {
  verifySingleHotel,
  getDatabaseStats,
} from "../../../services/AccommodationVerification";

function Hotels({ trip }) {
  const [verifiedHotels, setVerifiedHotels] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // ========================================
  // PARSE DATA ARRAY UTILITY
  // ========================================
  const parseDataArray = useCallback((data, fieldName) => {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        console.error(`Failed to parse ${fieldName}:`, error);
        return [];
      }
    }
    if (typeof data === "object" && data !== null) return [data];
    return [];
  }, []);

  // ========================================
  // GET HOTELS DATA (Real + AI)
  // ========================================
  const getHotelsData = useCallback(() => {
    // Debug: Log the entire trip structure
    console.log("🔍 DEBUG: Full trip object:", trip);
    console.log("🔍 DEBUG: trip.tripData:", trip?.tripData);
    console.log("🔍 DEBUG: trip.realHotelData:", trip?.realHotelData);

    // Get AI-generated hotels from trip data
    const possiblePaths = [
      trip?.tripData?.hotels,
      trip?.tripData?.accommodations,
      trip?.tripData?.tripData?.hotels,
      trip?.tripData?.tripData?.accommodations,
    ];

    console.log("🔍 DEBUG: Possible paths:", possiblePaths);

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
          console.log(
            `🔧 Parsed ${parsed.length} hotels from JSON array string`
          );
        } else if (typeof parsed === "object") {
          realHotelsRaw = [parsed];
          console.log("🔧 Parsed single hotel from JSON object string");
        }
      } catch (error) {
        // If direct parsing fails, try wrapping in brackets (malformed JSON case)
        console.warn(
          "⚠️  Initial JSON parse failed, trying alternative format:",
          error.message
        );
        try {
          const wrappedParsed = JSON.parse(`[${realHotelsRaw}]`);
          if (Array.isArray(wrappedParsed)) {
            realHotelsRaw = wrappedParsed;
            console.log(
              `🔧 Parsed ${wrappedParsed.length} hotels from malformed JSON (added brackets)`
            );
          }
        } catch (error2) {
          console.error(
            "❌ Failed to parse realHotelData.hotels string after all attempts:",
            error2
          );
          console.error(
            "Raw string (first 500 chars):",
            realHotelsRaw.substring(0, 500)
          );
          realHotelsRaw = [];
        }
      }
    }

    const realHotels = parseDataArray(realHotelsRaw, "real hotels");

    console.log(
      `🏨 Hotels found - Real: ${realHotels.length}, AI: ${aiHotels.length}`
    );
    console.log("🔍 DEBUG: AI Hotels:", aiHotels);
    console.log("🔍 DEBUG: Real Hotels:", realHotels);

    // ========================================
    // PRIORITY LOGIC: Real Hotels vs AI Hotels
    // ========================================
    const hotelSearchRequested = trip?.hotelSearchRequested || false;
    const hasRealHotels = trip?.hasRealHotels || false;

    let finalRealHotels = realHotels;
    let finalAiHotels = aiHotels;

    // CASE 1: User did NOT request hotel search → Show ONLY AI hotels
    if (!hotelSearchRequested) {
      console.log(
        `ℹ️ Hotel search not requested - Showing ${aiHotels.length} AI-generated hotels from tripData.hotels`
      );
      finalRealHotels = []; // Don't show real hotels section
      finalAiHotels = aiHotels; // Show AI hotels
    }
    // CASE 2: User requested hotel search AND real hotels available → Show ONLY real hotels
    else if (hotelSearchRequested && hasRealHotels && realHotels.length > 0) {
      console.log(
        `✅ User requested hotel search - Showing ONLY ${realHotels.length} verified real hotels (hiding ${aiHotels.length} AI recommendations)`
      );
      finalAiHotels = []; // Hide AI hotels - user wants real data
      finalRealHotels = realHotels; // Show real hotels
    }
    // CASE 3: User requested hotel search BUT real hotels failed → Show AI hotels as fallback
    else if (
      hotelSearchRequested &&
      (!hasRealHotels || realHotels.length === 0)
    ) {
      console.log(
        `⚠️ Real hotel search requested but failed/empty - Showing ${aiHotels.length} AI recommendations as fallback`
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
  }, [trip, parseDataArray]);

  // ========================================
  // VERIFY ALL HOTELS (WITH SMART LIMITING)
  // ========================================
  const verifyAllHotels = useCallback(async () => {
    const hotelsData = getHotelsData();

    if (hotelsData.length === 0) {
      console.warn("⚠️  No hotels found in trip data");
      setVerifiedHotels([]);
      return;
    }

    // ✅ OPTIMIZATION: Limit hotels BEFORE verification to save API calls
    const MAX_HOTELS_TO_VERIFY = 5;
    
    // Separate real and AI hotels
    const realHotels = hotelsData.filter(h => h.isRealHotel);
    const aiHotels = hotelsData.filter(h => !h.isRealHotel);
    
    // Real hotels: Already verified, show all (no API calls needed)
    // AI hotels: Limit to MAX before verification (saves API calls)
    let hotelsToVerify = [];
    
    if (realHotels.length > 0) {
      console.log(`✅ Displaying ${realHotels.length} real hotels (pre-verified)`);
      hotelsToVerify = realHotels.slice(0, MAX_HOTELS_TO_VERIFY);
    } else if (aiHotels.length > 0) {
      const originalCount = aiHotels.length;
      const limitedCount = Math.min(aiHotels.length, MAX_HOTELS_TO_VERIFY);
      console.log(`🎯 Selecting top ${limitedCount} hotels from ${originalCount} AI recommendations`);
      hotelsToVerify = aiHotels.slice(0, MAX_HOTELS_TO_VERIFY);
    }
    
    if (hotelsToVerify.length === 0) {
      setVerifiedHotels([]);
      return;
    }

    setIsVerifying(true);
    console.log(`🔍 Verifying ${hotelsToVerify.length} hotels for quality and availability`);

    // Batch process in chunks of 5 for better performance
    const BATCH_SIZE = 5;
    const verified = [];

    for (let i = 0; i < hotelsToVerify.length; i += BATCH_SIZE) {
      const batch = hotelsToVerify.slice(i, i + BATCH_SIZE);
      
      // ✅ Only verify AI hotels (real hotels skip verification)
      const batchResults = await Promise.all(
        batch.map((hotel) => {
          if (hotel.isRealHotel) {
            // Real hotel - no verification needed, return as-is
            return Promise.resolve({
              verified: true,
              firestoreData: hotel,
              matchScore: 100,
              source: 'real'
            });
          } else {
            // AI hotel - verify with API call
            return verifySingleHotel(hotel);
          }
        })
      );

      batchResults.forEach((result, idx) => {
        const hotel = batch[idx];
        if (result.verified && result.firestoreData) {
          verified.push({
            ...result.firestoreData,
            ...hotel,
            verified: true,
            matchScore: result.matchScore,
            verificationResult: result,
          });
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

    console.log("✅ Hotel verification complete:", {
      displayed: verified.length,
      verified: verifiedCount,
      qualityScore: ((verifiedCount / verified.length) * 100).toFixed(0) + "%"
    });
  }, [getHotelsData]);

  // ========================================
  // EXTRACT PRICE
  // ========================================
  const extractPrice = useCallback((hotel) => {
    const priceStr =
      hotel?.pricePerNight || hotel?.priceRange || hotel?.price_range || "0";

    if (typeof priceStr === "string" && priceStr.includes("-")) {
      const rangeMatch = priceStr.match(/[\d,]+/g);
      if (rangeMatch && rangeMatch.length >= 1) {
        return parseFloat(rangeMatch[0].replace(/,/g, ""));
      }
    }

    const numPrice = parseFloat(String(priceStr).replace(/[₱$€£,]/g, ""));
    return isNaN(numPrice) ? 0 : numPrice;
  }, []);

  // ========================================
  // SORT HOTELS BY SOURCE & PRICE (MEMOIZED)
  // ========================================
  const hotels = useMemo(() => {
    // Separate real and AI hotels
    const realHotels = verifiedHotels.filter((h) => h.isRealHotel);
    const aiHotels = verifiedHotels.filter((h) => !h.isRealHotel);

    // Sort each group by price (lowest to highest)
    const sortByPrice = (a, b) => {
      const priceA = extractPrice(a);
      const priceB = extractPrice(b);
      if (priceA === 0 && priceB === 0) return 0;
      if (priceA === 0) return 1; // Hotels without price go to end
      if (priceB === 0) return -1;
      return priceA - priceB; // Ascending order (lowest first)
    };

    const sortedRealHotels = realHotels.sort(sortByPrice);
    const sortedAiHotels = aiHotels.sort(sortByPrice);
    const allSorted = [...realHotels, ...aiHotels].sort(sortByPrice);

    // ✅ LIMIT TO TOP 5 BEST VALUE HOTELS (lowest prices)
    const MAX_HOTELS_TO_SHOW = 5;

    return {
      realHotels: sortedRealHotels.slice(0, MAX_HOTELS_TO_SHOW),
      aiHotels: sortedAiHotels.slice(0, MAX_HOTELS_TO_SHOW),
      allHotels: allSorted.slice(0, MAX_HOTELS_TO_SHOW),
      // Store original counts for display
      totalRealHotels: realHotels.length,
      totalAiHotels: aiHotels.length,
      totalAllHotels: allSorted.length,
    };
  }, [verifiedHotels, extractPrice]);

  // ========================================
  // CALCULATE AVERAGE PRICE (MEMOIZED)
  // ========================================
  const avgPrice = useMemo(() => {
    const hotelsWithPrices = hotels.allHotels.filter(
      (hotel) => extractPrice(hotel) > 0
    );
    return hotelsWithPrices.length > 0
      ? hotelsWithPrices.reduce((sum, hotel) => sum + extractPrice(hotel), 0) /
          hotelsWithPrices.length
      : 0;
  }, [hotels, extractPrice]);

  // ========================================
  // GENERATE AGODA BOOKING URL
  // ========================================
  const generateAgodaBookingURL = useCallback(
    (hotel) => {
      const hotelId = hotel?.hotel_id || hotel?.hotelId || hotel?.id || "";

      if (!hotelId) {
        console.error("❌ No hotel ID available");
        const cityName =
          hotel?.city || trip?.userSelection?.location?.split(",")[0] || "";
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

      console.log("🔗 Generated Agoda URL:", {
        hotelId,
        hotelName: hotel?.hotel_name,
        verified: hotel?.verified ? "✅" : "❌",
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
      console.log("=== BOOKING CLICKED ===");
      console.log("🏨 Hotel:", hotel.hotel_name || hotel.name);
      console.log("🆔 Hotel ID:", hotel.hotel_id);
      console.log("✅ Verified:", hotel.verified);

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
    console.log("📚 Hotel Database Stats:", stats);
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
        <h3 className="text-lg font-bold mb-2">Finding the Best Hotels...</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We're selecting top accommodations for you
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
            <h2 className="text-xl font-bold text-white">Hotels</h2>
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
                Hotel search was not enabled when this trip was created.
              </p>
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-xl p-5 border-2 border-sky-200 dark:border-sky-800">
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sky-600 dark:text-sky-400">💡</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sky-900 dark:text-sky-300 text-sm mb-2">
                      Want Hotel Recommendations?
                    </h4>
                    <p className="text-sky-800 dark:text-sky-400 text-xs leading-relaxed">
                      Create a new trip and enable{" "}
                      <strong>"Include Hotel Search"</strong> in the preferences
                      step to get personalized hotel recommendations with real
                      data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                We couldn't retrieve hotels for this destination. This may be
                temporary.
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

          <div className="relative flex items-center justify-between gap-4">
            {/* Left: Title & Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white text-2xl">🏨</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1.5">
                  {hotels.realHotels.length > 0
                    ? "Verified Accommodations"
                    : "Recommended Hotels"}
                </h2>
                <div className="flex items-center gap-2 flex-wrap text-white/90 text-xs md:text-sm">
                  <span className="font-medium">
                    {hotels.allHotels.length} top choice{hotels.allHotels.length !== 1 ? "s" : ""}
                  </span>
                  {hotels.realHotels.length > 0 && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">
                        Sorted by best value
                      </span>
                    </>
                  )}
                  {hotels.totalAllHotels > hotels.allHotels.length && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline text-white/80">
                        Selected from {hotels.totalAllHotels} options
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Average Price Badge */}
            {avgPrice > 0 && (
              <div className="hidden md:flex flex-col items-end bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
                <div className="text-xs text-white/80 font-medium mb-0.5">
                  Average
                </div>
                <div className="text-xl font-bold text-white">
                  ₱{Math.round(avgPrice).toLocaleString()}
                </div>
                <div className="text-xs text-white/75">per night</div>
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
                    : "Booking Tips"}
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
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span>
                        Click "Book Now" to view current prices and availability
                        on Agoda
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span>
                        Compare amenities and guest reviews before booking
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
