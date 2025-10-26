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
  // VERIFY ALL HOTELS
  // ========================================
  const verifyAllHotels = useCallback(async () => {
    const hotelsData = getHotelsData();

    if (hotelsData.length === 0) {
      console.warn("⚠️  No hotels found in trip data");
      setVerifiedHotels([]);
      return;
    }

    setIsVerifying(true);
    console.log(`🔍 Starting verification of ${hotelsData.length} hotels`);

    // Batch process in chunks of 5 for better performance
    const BATCH_SIZE = 5;
    const verified = [];

    for (let i = 0; i < hotelsData.length; i += BATCH_SIZE) {
      const batch = hotelsData.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((hotel) => verifySingleHotel(hotel))
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
    const unverifiedCount = verified.filter((h) => !h.verified).length;

    setVerifiedHotels(verified);
    setIsVerifying(false);

    console.log("📊 Verification complete:", {
      total: verified.length,
      verified: verifiedCount,
      unverified: unverifiedCount,
      percentage: ((verifiedCount / verified.length) * 100).toFixed(1) + "%",
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
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-bold mb-2">Verifying Hotels...</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Checking hotel availability and accuracy
        </p>
      </div>
    );
  }

  // ========================================
  // EMPTY STATE
  // ========================================
  if (!hotels || hotels.allHotels.length === 0) {
    const hotelSearchRequested = trip?.hotelSearchRequested || false;
    const hasRealHotels = trip?.hasRealHotels || false;

    // 🔍 DEBUG: Log detailed empty state analysis
    console.log("🏨 EMPTY STATE ANALYSIS:", {
      hotelSearchRequested,
      hasRealHotels,
      realHotelDataExists: !!trip?.realHotelData,
      realHotelDataType: typeof trip?.realHotelData?.hotels,
      realHotelDataIsString: typeof trip?.realHotelData?.hotels === "string",
      realHotelDataLength: trip?.realHotelData?.hotels?.length || 0,
      aiHotelsExists: !!trip?.tripData?.hotels,
      aiHotelsType: typeof trip?.tripData?.hotels,
      aiHotelsCount: Array.isArray(trip?.tripData?.hotels)
        ? trip.tripData.hotels.length
        : 0,
      verifiedHotelsCount: verifiedHotels.length,
      allHotelsCount: hotels?.allHotels?.length || 0,
    });

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-sky-100 dark:bg-sky-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-sky-600 dark:text-sky-400">🏨</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          No Hotels Found
        </h3>

        {!hotelSearchRequested ? (
          <div className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto space-y-3">
            <p>Hotel search was not enabled when this trip was created.</p>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
                💡 Want hotel recommendations?
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Create a new trip and enable "Include Hotel Search" in Step 5 to
                get personalized hotel recommendations.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto space-y-3">
            <p>We couldn't find hotels for this destination.</p>
            {hasRealHotels && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Real hotel data was requested but couldn't be retrieved. This
                may be due to API limitations or the destination not being in
                our database.
              </p>
            )}
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
                🔍 Troubleshooting
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 text-left space-y-1">
                <li>• Check browser console for error messages</li>
                <li>• Try regenerating the trip</li>
                <li>• Search for hotels manually on Agoda or Booking.com</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Header Section */}
        <div className="brand-gradient px-4 sm:px-6 py-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white dark:bg-white/10 opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white dark:bg-white/10 opacity-5 rounded-full translate-y-2 -translate-x-2"></div>

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🏨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white mb-1">
                    {hotels.realHotels.length > 0
                      ? "Best Value Hotels"
                      : "Hotel Recommendations"}
                  </h2>
                  <p className="text-white/90 text-xs flex items-center gap-2 flex-wrap">
                    {hotels.realHotels.length > 0 ? (
                      <>
                        <span>Top {hotels.allHotels.length} most affordable options</span>
                        {hotels.totalAllHotels > hotels.allHotels.length && (
                          <>
                            <span>•</span>
                            <span>{hotels.totalAllHotels} hotels found</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span>{hotels.allHotels.length} carefully selected for your trip</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {avgPrice > 0 && (
                <div className="hidden sm:flex items-center gap-3 text-white">
                  <div className="text-center">
                    <div className="text-base font-bold">
                      ₱{Math.round(avgPrice).toLocaleString()}
                    </div>
                    <div className="text-xs text-white/80">avg/night</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hotels List */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 space-y-8">
          {/* Real Hotels Section (Google Places API) */}
          {hotels.realHotels.length > 0 && (
            <div>
              <div className="grid gap-6">
                {hotels.realHotels.map((hotel, index) => (
                  <div
                    key={hotel?.hotel_id || hotel?.id || `real-hotel-${index}`}
                    className="group relative"
                  >
                    {/* Rank Badge */}
                    <div className="absolute -top-3 -left-3 z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                          index === 0
                            ? "bg-gradient-to-br from-amber-400 to-amber-600"
                            : index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-500"
                            : index === 2
                            ? "bg-gradient-to-br from-orange-400 to-orange-600"
                            : "brand-gradient"
                        }`}
                      >
                        #{index + 1}
                      </div>
                    </div>
                    <HotelCardItem
                      hotel={hotel}
                      onBookHotel={handleBookHotel}
                    />
                    {index < hotels.realHotels.length - 1 && (
                      <div className="mt-6 border-b border-gray-100 dark:border-slate-800"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Generated Hotels Section */}
          {hotels.aiHotels.length > 0 && (
            <div>
              {/* Show divider only if real hotels exist above */}
              {hotels.realHotels.length > 0 && (
                <div className="border-t-2 border-dashed border-gray-200 dark:border-slate-700 mb-6 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-sky-100 dark:bg-sky-950/50 px-3 py-1.5 rounded-full">
                      <span className="text-sky-700 dark:text-sky-400 text-sm font-semibold flex items-center gap-1.5">
                        <span>✨</span>
                        <span>AI Recommendations</span>
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Alternative options & hidden gems
                    </span>
                  </div>
                </div>
              )}

              {/* Show warning only if hotel search was requested but failed */}
              {hotels.realHotels.length === 0 && trip?.hotelSearchRequested && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-amber-100 dark:bg-amber-950/50 px-3 py-1.5 rounded-full">
                      <span className="text-amber-700 dark:text-amber-400 text-sm font-semibold flex items-center gap-1.5">
                        <span>✨</span>
                        <span>AI Recommendations</span>
                      </span>
                    </div>
                    <span className="text-amber-600 dark:text-amber-400 text-xs">
                      Real hotel data unavailable - using AI suggestions
                    </span>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800 mb-4">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      💡 <strong>Note:</strong> These are AI-generated
                      recommendations. For real-time availability and pricing,
                      click "Book Hotel" to search on Agoda.
                    </p>
                  </div>
                </div>
              )}

              {/* Show simple header if hotel search was NOT requested (normal AI hotels) */}
              {hotels.realHotels.length === 0 &&
                !trip?.hotelSearchRequested && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-sky-100 dark:bg-sky-950/50 px-3 py-1.5 rounded-full">
                        <span className="text-sky-700 dark:text-sky-400 text-sm font-semibold flex items-center gap-1.5">
                          <span>🏨</span>
                          <span>Recommended Hotels</span>
                        </span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Curated by AI • Sorted by best value
                      </span>
                    </div>
                  </div>
                )}

              <div className="grid gap-6">
                {hotels.aiHotels.map((hotel, index) => (
                  <div
                    key={hotel?.hotel_id || hotel?.id || `ai-hotel-${index}`}
                    className="group relative"
                  >
                    {/* Rank Badge */}
                    <div className="absolute -top-3 -left-3 z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                          index === 0
                            ? "bg-gradient-to-br from-amber-400 to-amber-600"
                            : index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-500"
                            : index === 2
                            ? "bg-gradient-to-br from-orange-400 to-orange-600"
                            : "brand-gradient"
                        }`}
                      >
                        #{index + 1}
                      </div>
                    </div>
                    <HotelCardItem
                      hotel={hotel}
                      onBookHotel={handleBookHotel}
                    />
                    {index < hotels.aiHotels.length - 1 && (
                      <div className="mt-6 border-b border-gray-100 dark:border-slate-800"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Tips */}
          <div className="mt-8 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-sky-200 dark:border-sky-800 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-sky-100 dark:bg-sky-950/50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sky-600 dark:text-sky-400 text-xs">
                  💡
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sky-900 dark:text-sky-300 mb-2 text-sm">
                  Booking Tips
                </h4>
                <ul className="text-xs text-sky-800 dark:text-sky-400 space-y-1.5 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                      •
                    </span>
                    <span>Click "Book Hotel" to view prices on Agoda</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                      •
                    </span>
                    <span>Compare prices and amenities before booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                      •
                    </span>
                    <span>Check cancellation policies for flexibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                      •
                    </span>
                    <span>Book early for better rates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hotels;
