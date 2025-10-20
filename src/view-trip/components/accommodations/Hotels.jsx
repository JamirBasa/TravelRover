import React, { useEffect } from "react";
import HotelCardItem from "./HotelCardItem";

function Hotels({ trip }) {
  // Trip.com affiliate integration using your tp.media tracking
  // Affiliate parameters: shmarker=621043, promo_id=8989, campaign_id=121, trs=405102
  // Base affiliate URL: https://tp.media/click?shmarker=621043&promo_id=8989&source_type=link&type=click&campaign_id=121&trs=405102

  // Helper function to generate Trip.com hotel booking URL
  const generateHotelBookingURL = (options = {}) => {
    console.log("🏨 Trip.com hotel booking URL generation:", {
      hotelName: options.hotelName,
      tripLocation: trip?.userSelection?.location,
      options: options,
    });

    // Use ONLY hotel name for specific hotel search - no fallback to destination
    const searchQuery = options.hotelName || "";

    // Log hotel search details for debugging
    console.log("🔍 Hotel Search Details:", {
      hotelName: options.hotelName,
      searchQuery: searchQuery,
      willSearchForSpecificHotel: !!searchQuery.trim(),
    });

    // If no hotel name provided, warn but continue with location search
    if (!searchQuery.trim()) {
      console.warn("⚠️ No hotel name provided - will search by location only");
    } // Parse dates
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toISOString().split("T")[0];
    };

    const checkIn = formatDate(
      options.checkIn || trip?.userSelection?.startDate
    );
    const checkOut = formatDate(
      options.checkOut || trip?.userSelection?.endDate
    );

    // Parse traveler count
    const parseTravelerCount = (travelers) => {
      if (!travelers) return "2";

      const travelerMap = {
        "Just Me": "1",
        "A Couple": "2",
        Family: "4",
        Friends: "3",
      };

      if (travelerMap[travelers]) {
        return travelerMap[travelers];
      }

      const match = travelers.toString().match(/(\d+)/);
      return match ? match[1] : "2";
    };

    const adults = parseTravelerCount(
      options.adults || trip?.userSelection?.travelers
    );

    // Get dynamic destination information from trip data (NOT hotel name)
    const rawDestination =
      trip?.userSelection?.location || options.destination || "Default City";

    // Clean up URL-encoded destination (replace + with spaces and decode)
    const destination = decodeURIComponent(rawDestination.replace(/\+/g, " "));
    const destinationParts = destination.split(",").map((part) => part.trim());
    const cityName = destinationParts[0] || "Default City";
    const countryName = destinationParts[destinationParts.length - 1] || "";

    // Trip.com URL parameters - optimized for hotel-specific search
    const params = new URLSearchParams({
      // Hotel-first search parameters
      searchWord: searchQuery, // Hotel name as primary search
      destName: cityName, // Just city name, not full address
      cityName: cityName,
      searchType: "H", // Hotel search type
      checkin: checkIn,
      checkout: checkOut,
      crn: "1", // Number of rooms
      adult: adults,
      curr: "PHP", // Philippine Peso
      locale: "en-XX", // International English
      // Your actual Trip.com affiliate tracking parameters
      shmarker: "621043", // Your affiliate marker
      promo_id: "8989", // Your promo ID
      campaign_id: "121", // Your campaign ID
      trs: "405102", // Your tracking ID
      source_type: "link",
      type: "click",
    });

    // Only add optional parameters if they have values
    if (searchQuery) {
      params.set("searchValue", `H|${searchQuery}`);
    }

    // Add hotel-specific parameters if available
    if (options.hotelId || options.optionId) {
      const hotelId = options.hotelId || options.optionId;
      params.set("optionId", hotelId);
      params.set("searchValue", `31|${hotelId}*31*${hotelId}`);
      console.log("🎯 Using Trip.com hotel ID:", hotelId);
    }

    // Build URL manually and keep spaces as %20 (proper URL encoding)
    const buildCleanUrl = (baseUrl, parameters) => {
      const paramPairs = [];
      for (const [key, value] of Object.entries(parameters)) {
        if (value) {
          // Only add parameters that have values
          const encodedKey = encodeURIComponent(key);
          // Keep proper URL encoding with %20 for spaces (no + or commas)
          const encodedValue = encodeURIComponent(value).replace(/\+/g, "%20");
          paramPairs.push(`${encodedKey}=${encodedValue}`);
        }
      }
      return `${baseUrl}?${paramPairs.join("&")}`;
    };

    // Use Trip.com's hotel search URL format with clean encoding
    let finalUrl;

    if (searchQuery && searchQuery.trim()) {
      // Hotel-specific search parameters - format: "Hotel Name, City"
      const cleanParams = {
        destName: `${searchQuery}, ${cityName}`, // Format: "The Manila Hotel, Manila"
        cityName: cityName, // City context for location
        checkin: checkIn,
        checkout: checkOut,
        adult: adults,
        crn: "1",
        curr: "PHP",
        locale: "en-XX",
        // Your affiliate parameters
        shmarker: "621043",
        promo_id: "8989",
        campaign_id: "121",
        trs: "405102",
        source_type: "link",
        type: "click",
      };

      finalUrl = buildCleanUrl("https://www.trip.com/hotels/list", cleanParams);
    } else {
      // Fallback to URLSearchParams for location-only search
      finalUrl = `https://www.trip.com/hotels/list?${params.toString()}`;
    }

    console.log("🔗 Final Trip.com URL components:", {
      searchStrategy: searchQuery ? "Hotel-specific search" : "Location search",
      searchWord: searchQuery,
      cityName: cityName,
      fullUrl: finalUrl,
    });

    return finalUrl;
  };

  // Clean data parsing utility (same as PlacesToVisit for consistency)
  const parseDataArray = (data, fieldName) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        // Smart parsing for malformed JSON
        try {
          const cleanedData = data.trim();

          if (cleanedData.startsWith("{") && !cleanedData.startsWith("[")) {
            const parts = [];
            let currentObject = "";
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = 0; i < cleanedData.length; i++) {
              const char = cleanedData[i];

              if (escapeNext) {
                currentObject += char;
                escapeNext = false;
                continue;
              }

              if (char === "\\") {
                escapeNext = true;
                currentObject += char;
                continue;
              }

              if (char === '"' && !escapeNext) {
                inString = !inString;
              }

              if (!inString) {
                if (char === "{") {
                  braceCount++;
                } else if (char === "}") {
                  braceCount--;
                }
              }

              currentObject += char;

              if (
                !inString &&
                braceCount === 0 &&
                currentObject.trim().endsWith("}")
              ) {
                const nextNonWhitespace = cleanedData
                  .substring(i + 1)
                  .match(/^\s*,\s*/);
                if (nextNonWhitespace) {
                  parts.push(currentObject.trim());
                  currentObject = "";
                  i += nextNonWhitespace[0].length;
                }
              }
            }

            if (currentObject.trim()) {
              parts.push(currentObject.trim());
            }

            const parsedObjects = [];
            parts.forEach((part) => {
              try {
                const obj = JSON.parse(part);
                parsedObjects.push(obj);
              } catch (e) {
                // Skip malformed objects silently
              }
            });

            if (parsedObjects.length > 0) {
              return parsedObjects;
            }
          }
        } catch (regexError) {
          // Fall through to final fallback
        }

        // Final cleanup attempt
        try {
          const cleaned = data
            .replace(/^\"+|\"+$/g, "")
            .replace(/\n|\r/g, "")
            .replace(/\\/g, "")
            .trim();

          const cleanedParsed = JSON.parse(cleaned);
          return Array.isArray(cleanedParsed) ? cleanedParsed : [cleanedParsed];
        } catch (cleanError) {
          return [];
        }
      }
    }

    if (typeof data === "object" && data !== null) {
      return [data];
    }

    return [];
  };

  // Parse hotel data from multiple possible paths
  const hotelsRaw =
    trip?.tripData?.hotels ||
    trip?.tripData?.accommodations ||
    trip?.tripData?.tripData?.hotels ||
    trip?.tripData?.tripData?.accommodations ||
    [];

  const hotels = parseDataArray(hotelsRaw, "hotels");

  // Handle hotel booking
  const handleBookHotel = (hotel) => {
    console.log("Hotel booking attempt:", hotel);

    // Only proceed if this is real hotel data (has place_id)
    if (!hotel?.place_id) {
      console.warn("⚠️ Cannot book AI-generated hotel without place_id");
      return;
    }

    // Extract hotel details matching your API structure
    const extractedHotelName =
      hotel?.hotelName || hotel?.name || hotel?.title || "";
    const extractedAddress = hotel?.hotelAddress || hotel?.address || "";

    console.log("🏨 Extracted hotel details:", {
      hotelObject: hotel,
      hotelName: hotel?.hotelName,
      hotelAddress: hotel?.hotelAddress,
      geoCoordinates: hotel?.geoCoordinates,
      description: hotel?.description,
      finalName: extractedHotelName,
      finalAddress: extractedAddress,
    });

    // Generate Trip.com affiliate URL using hotel name for specific search
    const bookingUrl = generateHotelBookingURL({
      hotelName: extractedHotelName,
      destination:
        trip?.userSelection?.location || extractedAddress || "manila",
      hotelId: hotel?.id || hotel?.hotelId || hotel?.place_id,
    });
    console.log("🔗 Generated Trip.com booking URL:", bookingUrl);

    // Open booking URL
    window.open(bookingUrl, "_blank");
  };

  // Calculate average price ONLY for real hotels with place_id
  const realHotels = hotels.filter((hotel) => hotel?.place_id);
  const avgPrice =
    realHotels.length > 0
      ? realHotels.reduce((sum, hotel) => {
          const price = hotel?.pricePerNight || hotel?.priceRange || "0";
          const numPrice = parseFloat(price.replace(/[₱$€£,]/g, ""));
          return sum + (isNaN(numPrice) ? 0 : numPrice);
        }, 0) /
        realHotels.filter((hotel) => {
          const price = hotel?.pricePerNight || hotel?.priceRange || "0";
          const numPrice = parseFloat(price.replace(/[₱$€£,]/g, ""));
          return !isNaN(numPrice);
        }).length
      : 0;

  // Empty state - High Contrast Design
  if (!hotels || hotels.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-sky-500/5 border border-gray-200 dark:border-slate-700 p-12 text-center">
        <div className="w-16 h-16 bg-sky-100 dark:bg-sky-950/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <span className="text-2xl text-sky-600 dark:text-sky-400">🏨</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          No Hotels Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto font-medium">
          We're still finding the perfect accommodations for your trip. Please
          check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md dark:shadow-sky-500/5 border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Consistent Header Section */}
        <div className="brand-gradient px-4 sm:px-6 py-4 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white dark:bg-white/10 opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white dark:bg-white/10 opacity-5 rounded-full translate-y-2 -translate-x-2"></div>

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-white/20 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🏨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white mb-1 break-words">
                    Available Hotels
                  </h2>
                  <p className="text-white/90 text-xs flex items-center gap-2 flex-wrap">
                    <span>🏨</span>
                    <span>{hotels.length} accommodations found</span>
                    <span>•</span>
                    <span>🎯 AI-recommended</span>
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
              {/* Show hotel count badge for AI-generated hotels */}
              {!avgPrice && hotels.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 bg-white/20 dark:bg-white/10 px-3 py-1.5 rounded-lg">
                  <span className="text-white/90 text-xs font-medium">
                    AI-Recommended
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hotels List */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950">
          <div className="grid gap-6">
            {hotels.map((hotel, index) => (
              <div
                key={
                  hotel?.id ||
                  hotel?.hotelName ||
                  hotel?.name ||
                  `hotel-${index}`
                }
                className="group"
              >
                <HotelCardItem hotel={hotel} onBookHotel={handleBookHotel} />
                {/* Add separator except for last item */}
                {index < hotels.length - 1 && (
                  <div className="mt-6 border-b border-gray-100 dark:border-slate-800"></div>
                )}
              </div>
            ))}
          </div>

          {/* Compact Hotel Selection Tips */}
          <div className="mt-6 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-sky-200 dark:border-sky-800 shadow-sm dark:shadow-sky-500/5">
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
                    <span>
                      Click on any hotel to view location on Google Maps
                    </span>
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
                    <span>
                      Check cancellation policies for flexible travel plans
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 dark:text-sky-500 mt-0.5 flex-shrink-0">
                      •
                    </span>
                    <span>Book early for better rates and availability</span>
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
