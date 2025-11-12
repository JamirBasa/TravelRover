/**
 * Flight Recommendations Utility
 * Smart logic for flight suggestions based on user context
 */

// Complete list of Philippine airports with regular commercial flights (October 2025)
const AIRPORTS_WITH_COMMERCIAL_FLIGHTS = [
  // International Airports (8)
  "MNL", "CRK", "CEB", "DVO", "ILO", "KLO", "PPS",
  
  // Principal Class 1 Airports with scheduled service
  "BCD", "TAG", "BXU", "CYZ", "CBO", "TAC", "DPL", "DGT", 
  "GES", "MPH", "OZC", "CGY", "WNP", "PAG", "RXS", "TWT", 
  "SJI", "SFS", "TUG", "ZAM", "DRP",
  
  // Principal Class 2 Airports with scheduled service
  "BSO", "CYP", "CGM", "CRM", "CYU", "EUQ", "USU", "JOL", 
  "MBT", "OMC", "SWL", "IAO", "SUG", "TDG", "TBH", "VRC", "LGP"
];

// Special cases: Destinations with limited/no regular commercial service
const LIMITED_SERVICE_AIRPORTS = {
  // === NORTHERN LUZON ===
  "BAG": {
    name: "Baguio",
    alternatives: ["CRK", "MNL"],
    alternativeNames: ["Clark", "Manila"],
    transport: "bus",
    travelTime: "4-6 hours from Manila, 3-4 hours from Clark",
    notes: "Loakan Airport suspended commercial flights in July 2024",
    recommendation: "Take a bus from Pasay or Cubao (Manila) or from Dau Terminal (Clark)"
  },
  "VIG": {
    name: "Vigan",
    alternatives: ["LAO", "MNL"],
    alternativeNames: ["Laoag", "Manila"],
    transport: "bus",
    travelTime: "2 hours from Laoag, 8-9 hours from Manila",
    recommendation: "Fly to Laoag, then bus to Vigan (most convenient)"
  },
  "SAG": {
    name: "Sagada",
    alternatives: ["TUG", "MNL"],
    alternativeNames: ["Tuguegarao", "Manila"],
    transport: "bus/van",
    travelTime: "8-10 hours from Manila, 6 hours from Baguio",
    recommendation: "Travel to Baguio first, then local bus/van to Sagada"
  },
  "BAN": {
    name: "Banaue",
    alternatives: ["TUG", "MNL"],
    alternativeNames: ["Tuguegarao", "Manila"],
    transport: "bus/van",
    travelTime: "9-10 hours from Manila",
    recommendation: "Direct overnight bus from Manila or via Baguio"
  },
  // NOTE: Pagudpud has NO airport - PAG code reserved for Pagadian Airport (Zamboanga del Sur)
  "PAGUDPUD": {
    name: "Pagudpud",
    alternatives: ["LAO"],
    alternativeNames: ["Laoag"],
    transport: "bus/van",
    travelTime: "2 hours from Laoag",
    recommendation: "Fly to Laoag, then bus/van to Pagudpud"
  },
  "HUN": {
    name: "Hundred Islands (Alaminos)",
    alternatives: ["MNL"],
    alternativeNames: ["Manila"],
    transport: "bus",
    travelTime: "4-5 hours from Manila",
    recommendation: "Bus from Manila to Alaminos, Pangasinan"
  },
  
  // === CENTRAL LUZON ===
  "SFE": {
    name: "San Fernando, La Union",
    alternatives: ["MNL"],
    alternativeNames: ["Manila"],
    transport: "bus",
    travelTime: "4-5 hours from Manila",
    recommendation: "Direct bus from Manila to La Union (surfing destination)"
  },
  "ANC": {
    name: "Anilao",
    alternatives: ["MNL"],
    alternativeNames: ["Manila"],
    transport: "bus/van",
    travelTime: "2-3 hours from Manila",
    recommendation: "Bus to Batangas, then tricycle to Anilao (diving destination)"
  },
  
  // === SOUTHERN LUZON / BICOL ===
  "LGZ": {
    name: "Legaspi/Legazpi",
    alternatives: ["LGP", "MNL"],
    alternativeNames: ["Legazpi Airport", "Manila"],
    transport: "flight/bus",
    travelTime: "1 hour flight or 10-12 hours bus from Manila",
    recommendation: "Fly to Legazpi Airport (gateway to Mayon Volcano)"
  },
  "DAR": {
    name: "Daet/Camarines Norte",
    alternatives: ["LGP", "MNL"],
    alternativeNames: ["Legazpi", "Manila"],
    transport: "bus",
    travelTime: "8-10 hours from Manila",
    recommendation: "Bus from Manila to Daet (gateway to Calaguas)"
  },
  "CAL": {
    name: "Calaguas Island",
    alternatives: ["LGP", "MNL"],
    alternativeNames: ["Legazpi", "Manila"],
    transport: "bus + boat",
    travelTime: "8-10 hours bus to Daet, then 2 hours boat",
    recommendation: "Travel to Daet, then boat to Calaguas"
  },
  "DON": {
    name: "Donsol",
    alternatives: ["LGP"],
    alternativeNames: ["Legazpi"],
    transport: "bus/van",
    travelTime: "2 hours from Legazpi",
    recommendation: "Fly to Legazpi, then bus to Donsol (whale shark watching)"
  },
  "MSB": {
    name: "Masbate",
    alternatives: ["MBT"],
    alternativeNames: ["Masbate Airport"],
    transport: "flight/ferry",
    travelTime: "1 hour flight from Manila or ferry from various ports",
    recommendation: "Fly to Masbate or take ferry from Lucena/Pilar"
  },
  
  // === MINDORO ===
  "SJO": {
    name: "San Jose, Occidental Mindoro",
    alternatives: ["MNL"],
    alternativeNames: ["Manila"],
    transport: "bus + ferry",
    travelTime: "6-8 hours from Manila",
    recommendation: "Bus to Batangas Pier, then ferry to San Jose"
  },
  "PUG": {
    name: "Puerto Galera",
    alternatives: ["MNL"],
    alternativeNames: ["Manila"],
    transport: "bus + ferry",
    travelTime: "4-5 hours from Manila",
    recommendation: "Bus to Batangas, then ferry to Puerto Galera"
  },
  
  // === PALAWAN ===
  "ELN": {
    name: "El Nido",
    alternatives: ["PPS"],
    alternativeNames: ["Puerto Princesa"],
    transport: "bus/van",
    travelTime: "5-6 hours from Puerto Princesa",
    recommendation: "Fly to Puerto Princesa, then shuttle van to El Nido"
  },
  "COR": {
    name: "Coron",
    alternatives: ["USU", "PPS"],
    alternativeNames: ["Busuanga (Coron)", "Puerto Princesa"],
    transport: "ferry/flight",
    travelTime: "30min flight to Busuanga or 14-16 hours overnight ferry from Manila",
    recommendation: "Fly to Busuanga (Coron) Airport or take overnight ferry from Manila"
  },
  "SAB": {
    name: "Sabang (Underground River)",
    alternatives: ["PPS"],
    alternativeNames: ["Puerto Princesa"],
    transport: "van",
    travelTime: "2 hours from Puerto Princesa",
    recommendation: "Fly to Puerto Princesa, then van to Sabang"
  },
  "BAL": {
    name: "Balabac",
    alternatives: ["PPS"],
    alternativeNames: ["Puerto Princesa"],
    transport: "bus + boat",
    travelTime: "10-12 hours from Puerto Princesa",
    recommendation: "Fly to Puerto Princesa, then bus + boat to Balabac"
  },
  
  // === VISAYAS - PANAY ===
  "BOR": {
    name: "Boracay",
    alternatives: ["KLO", "MPH"],
    alternativeNames: ["Kalibo", "Caticlan"],
    transport: "flight + boat",
    travelTime: "2 hours from Kalibo or 30min from Caticlan + 15min boat",
    recommendation: "Fly to Caticlan (closest) or Kalibo, then boat to Boracay"
  },
  "GIM": {
    name: "Guimaras",
    alternatives: ["ILO"],
    alternativeNames: ["Iloilo"],
    transport: "ferry",
    travelTime: "15-20 minutes ferry from Iloilo",
    recommendation: "Fly to Iloilo, then ferry to Guimaras"
  },
  "ANT": {
    name: "Antique",
    alternatives: ["ILO"],
    alternativeNames: ["Iloilo"],
    transport: "bus",
    travelTime: "2-3 hours from Iloilo",
    recommendation: "Fly to Iloilo, then bus to Antique towns"
  },
  
  // === VISAYAS - NEGROS ===
  "DUM": {
    name: "Dumaguete",
    alternatives: ["DGT"],
    alternativeNames: ["Dumaguete Airport"],
    transport: "flight",
    travelTime: "1 hour from Manila/Cebu",
    recommendation: "Fly direct to Dumaguete (Sibulan Airport)"
  },
  "SIQ": {
    name: "Siquijor",
    alternatives: ["DGT", "TAG"],
    alternativeNames: ["Dumaguete", "Tagbilaran (Bohol)"],
    transport: "ferry",
    travelTime: "1 hour ferry from Dumaguete",
    recommendation: "Fly to Dumaguete, then fast ferry to Siquijor"
  },
  "DAU": {
    name: "Dauin (Apo Island)",
    alternatives: ["DGT"],
    alternativeNames: ["Dumaguete"],
    transport: "ferry/van",
    travelTime: "30min from Dumaguete + 30min boat to Apo Island",
    recommendation: "Fly to Dumaguete, then van to Dauin pier for Apo Island"
  },
  
  // === VISAYAS - BOHOL ===
  "PAN": {
    name: "Panglao Island",
    alternatives: ["TAG"],
    alternativeNames: ["Tagbilaran"],
    transport: "flight",
    travelTime: "Direct flights to Panglao Airport",
    recommendation: "Fly direct to Panglao-Bohol International Airport"
  },
  "CHO": {
    name: "Chocolate Hills",
    alternatives: ["TAG"],
    alternativeNames: ["Tagbilaran"],
    transport: "van",
    travelTime: "2 hours from Tagbilaran",
    recommendation: "Fly to Tagbilaran/Panglao, then van to Carmen for Chocolate Hills"
  },
  "AMO": {
    name: "Anda",
    alternatives: ["TAG"],
    alternativeNames: ["Tagbilaran"],
    transport: "van",
    travelTime: "3 hours from Tagbilaran",
    recommendation: "Fly to Tagbilaran, then van to Anda (off-the-beaten-path beaches)"
  },
  
  // === VISAYAS - CEBU ===
  "BANT": {
    name: "Bantayan Island",
    alternatives: ["CEB"],
    alternativeNames: ["Cebu"],
    transport: "bus + ferry",
    travelTime: "4 hours from Cebu City",
    recommendation: "Fly to Cebu, then bus to Hagnaya Port + ferry to Bantayan"
  },
  "MAL": {
    name: "Malapascua Island",
    alternatives: ["CEB"],
    alternativeNames: ["Cebu"],
    transport: "bus + boat",
    travelTime: "4 hours from Cebu City",
    recommendation: "Fly to Cebu, then bus to Maya Port + boat to Malapascua"
  },
  "OSL": {
    name: "Oslob (Whale Sharks)",
    alternatives: ["CEB"],
    alternativeNames: ["Cebu"],
    transport: "bus",
    travelTime: "3 hours from Cebu City",
    recommendation: "Fly to Cebu, then bus to Oslob for whale shark watching"
  },
  "MOA": {
    name: "Moalboal",
    alternatives: ["CEB"],
    alternativeNames: ["Cebu"],
    transport: "bus",
    travelTime: "2.5 hours from Cebu City",
    recommendation: "Fly to Cebu, then bus to Moalboal (sardine run diving)"
  },
  
  // === VISAYAS - LEYTE/SAMAR ===
  "TUB": {
    name: "Tubigon/Padre Burgos",
    alternatives: ["TAC"],
    alternativeNames: ["Tacloban"],
    transport: "van",
    travelTime: "2 hours from Tacloban",
    recommendation: "Fly to Tacloban, then van to Padre Burgos (diving)"
  },
  "SOH": {
    name: "Sohoton Cave",
    alternatives: ["TAC"],
    alternativeNames: ["Tacloban"],
    transport: "van + boat",
    travelTime: "4 hours from Tacloban",
    recommendation: "Fly to Tacloban, then van + boat to Sohoton, Samar"
  },
  "KAL": {
    name: "Kalanggaman Island",
    alternatives: ["TAC"],
    alternativeNames: ["Tacloban"],
    transport: "van + boat",
    travelTime: "3 hours from Tacloban",
    recommendation: "Fly to Tacloban, then van to Palompon + boat to Kalanggaman"
  },
  
  // === MINDANAO - NORTHERN ===
  "CAM": {
    name: "Camiguin",
    alternatives: ["CGY"],
    alternativeNames: ["Cagayan de Oro"],
    transport: "ferry",
    travelTime: "2 hours ferry from Balingoan Port",
    recommendation: "Fly to Cagayan de Oro, then 2-hour bus + ferry to Camiguin"
  },
  "BUK": {
    name: "Bukidnon (Dahilayan)",
    alternatives: ["CGY"],
    alternativeNames: ["Cagayan de Oro"],
    transport: "van",
    travelTime: "2 hours from Cagayan de Oro",
    recommendation: "Fly to Cagayan de Oro, then van to Manolo Fortich/Dahilayan"
  },
  "ILG": {
    name: "Iligan (Tinago Falls)",
    alternatives: ["CGY"],
    alternativeNames: ["Cagayan de Oro"],
    transport: "bus",
    travelTime: "2 hours from Cagayan de Oro",
    recommendation: "Fly to Cagayan de Oro, then bus to Iligan"
  },
  
  // === MINDANAO - CARAGA (SIARGAO) ===
  "GLE": {
    name: "General Luna (Siargao)",
    alternatives: ["IAO", "DGT"],
    alternativeNames: ["Siargao Airport", "Siargao Airport"],
    transport: "flight",
    travelTime: "Direct flights available",
    recommendation: "Fly direct to Siargao (Sayak Airport)"
  },
  "BUR": {
    name: "Burgos (Siargao)",
    alternatives: ["IAO"],
    alternativeNames: ["Siargao Airport"],
    transport: "van",
    travelTime: "1 hour from Siargao Airport",
    recommendation: "Fly to Siargao, then van to Burgos (Magpupungko Rock Pools)"
  },
  "BIS": {
    name: "Bislig (Tinuy-an Falls)",
    alternatives: ["DVO", "BXU"],
    alternativeNames: ["Davao", "Butuan"],
    transport: "bus",
    travelTime: "4-5 hours from Davao or Butuan",
    recommendation: "Fly to Davao or Butuan, then bus to Bislig"
  },
  "BRI": {
    name: "Britania Islands",
    alternatives: ["BXU"],
    alternativeNames: ["Butuan"],
    transport: "van + boat",
    travelTime: "4 hours from Butuan",
    recommendation: "Fly to Butuan, then van + boat to Britania Islands"
  },
  
  // === MINDANAO - DAVAO REGION ===
  "SAM": {
    name: "Samal Island",
    alternatives: ["DVO"],
    alternativeNames: ["Davao"],
    transport: "ferry",
    travelTime: "15 minutes from Davao City",
    recommendation: "Fly to Davao, then ferry to Samal Island"
  },
  "MAT": {
    name: "Mati (Dahican Beach)",
    alternatives: ["DVO"],
    alternativeNames: ["Davao"],
    transport: "bus",
    travelTime: "3 hours from Davao City",
    recommendation: "Fly to Davao, then bus to Mati"
  },
  "TBL": {
    name: "Lake Sebu",
    alternatives: ["GES"],
    alternativeNames: ["General Santos"],
    transport: "van",
    travelTime: "2.5 hours from General Santos",
    recommendation: "Fly to General Santos, then van to Lake Sebu"
  },
  
  // === MINDANAO - WESTERN (ZAMBOANGA) ===
  "SAN": {
    name: "Santa Cruz Island (Pink Beach)",
    alternatives: ["ZAM"],
    alternativeNames: ["Zamboanga"],
    transport: "boat",
    travelTime: "30 minutes from Zamboanga City",
    recommendation: "Fly to Zamboanga, then boat to Santa Cruz Island"
  },
  "BAS": {
    name: "Basilan",
    alternatives: ["ZAM"],
    alternativeNames: ["Zamboanga"],
    transport: "ferry",
    travelTime: "2 hours from Zamboanga",
    recommendation: "Fly to Zamboanga, then ferry to Basilan (check travel advisories)"
  },
  
  // === MINDANAO - SOUTHERN (SULU/TAWI-TAWI) ===
  "TAW": {
    name: "Tawi-Tawi",
    alternatives: ["TWT"],
    alternativeNames: ["Tawi-Tawi Airport"],
    transport: "flight",
    travelTime: "Direct flights from Manila/Zamboanga",
    recommendation: "Fly direct to Tawi-Tawi (southernmost Philippines)"
  },
  "SIT": {
    name: "Sitangkai",
    alternatives: ["TWT"],
    alternativeNames: ["Tawi-Tawi"],
    transport: "boat",
    travelTime: "3-4 hours from Bongao",
    recommendation: "Fly to Tawi-Tawi, then boat to Sitangkai (Venice of the South)"
  }
};

// Airport code to city name mapping
const AIRPORT_CITIES = {
  "MNL": "Manila",
  "CRK": "Clark",
  "CEB": "Cebu",
  "DVO": "Davao",
  "ILO": "Iloilo",
  "BAG": "Baguio",
  "ZAM": "Zamboanga",
  "BCD": "Bacolod",
  "TAG": "Bohol",
  "CGY": "Cagayan de Oro",
  "PPS": "Puerto Princesa",
  "KLO": "Kalibo",
  "TAC": "Tacloban",
  "DGT": "Siargao",
  "GES": "General Santos",
  "TUG": "Tuguegarao"
};

// Helper to get city name from airport code
function getAirportCity(code) {
  return AIRPORT_CITIES[code] || code;
}

// Helper to check if airport has commercial flights
function hasCommercialFlights(airportCode) {
  if (!airportCode) return false;
  return AIRPORTS_WITH_COMMERCIAL_FLIGHTS.includes(airportCode.toUpperCase());
}

// Helper to check if airport has limited service
function hasLimitedService(airportCode) {
  if (!airportCode) return false;
  return airportCode.toUpperCase() in LIMITED_SERVICE_AIRPORTS;
}

/**
 * Check if user is in the same city/region as destination
 */
export function isSameCity(departureCity, destination) {
  if (!departureCity || !destination) return false;

  const normalizeName = (name) =>
    name
      .toLowerCase()
      .normalize("NFD") // Handle accented characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b(city|province|metro)\b/gi, "")
      .trim();

  const departure = normalizeName(departureCity);
  const dest = normalizeName(destination);

  // ✅ FIX: Extract city name from "City, Province, Country" format FIRST
  // This prevents "Pagadian City, Zamboanga del Sur" from matching "Zamboanga City"
  const destCityOnly = dest.split(',')[0].trim();
  const depCityOnly = departure.split(',')[0].trim();

  // Check exact match on city names only
  if (depCityOnly === destCityOnly) return true;
  
  // Check if one city name contains the other (for abbreviations/variations)
  // BUT only if they're both in the SAME part (not province in destination)
  if (destCityOnly.includes(depCityOnly) || depCityOnly.includes(destCityOnly)) return true;

  // Metro area matching
  const metroMatches = {
    manila: ["quezon city", "makati", "taguig", "pasig", "mandaluyong", "pasay", "paranaque"],
    cebu: ["cebu city", "lapu-lapu", "mandaue"],
    davao: ["davao city"],
    bacolod: ["silay"],
    iloilo: ["cabatuan"]
  };

  for (const [metro, cities] of Object.entries(metroMatches)) {
    if (
      (departure.includes(metro) || cities.some((c) => departure.includes(c))) &&
      (dest.includes(metro) || cities.some((c) => dest.includes(c)))
    ) {
      return true;
    }
  }

  return false;
}

// Remote destinations requiring early departure (updated with ALL regions)
const REMOTE_DESTINATIONS = [
  // Northern Luzon
  "batanes", "basco", "itbayat", "baguio", "sagada", "banaue", "vigan", "pagudpud",
  "hundred islands", "alaminos",
  
  // Central Luzon
  "san fernando", "la union", "anilao",
  
  // Southern Luzon / Bicol
  "legaspi", "legazpi", "donsol", "calaguas", "camarines", "daet", "masbate",
  
  // Mindoro
  "puerto galera", "san jose", "occidental mindoro",
  
  // Palawan
  "palawan", "puerto princesa", "el nido", "coron", "busuanga", "balabac", "sabang",
  
  // Panay
  "boracay", "guimaras", "antique",
  
  // Negros
  "siquijor", "dauin", "apo island",
  
  // Bohol
  "anda", "chocolate hills",
  
  // Cebu Islands
  "bantayan", "malapascua", "moalboal",
  
  // Leyte/Samar
  "kalanggaman", "sohoton", "padre burgos",
  
  // Mindanao North
  "camiguin", "bukidnon", "dahilayan",
  
  // Caraga
  "siargao", "burgos", "britania", "bislig", "tinuy-an",
  
  // Davao Region
  "samal", "mati", "dahican", "lake sebu",
  
  // Western/Southern Mindanao
  "zamboanga", "basilan", "sulu", "tawi-tawi", "sitangkai", "santa cruz island"
];

export function isRemoteDestination(destination) {
  if (!destination) return false;
  
  // Extract city name from "City, Province" format to avoid false positives
  // e.g., "Pagadian City, Zamboanga del Sur" should NOT match "zamboanga" in array
  let cityName = destination.split(',')[0].trim().toLowerCase();
  
  // Normalize common city name variations
  cityName = cityName.replace(/\s+city$/, '').replace(/\s+town$/, ''); // "Zamboanga City" → "zamboanga"
  
  // Match against extracted and normalized city name only
  return REMOTE_DESTINATIONS.some((remote) => cityName === remote);
}

/**
 * Calculate flight dates with timezone-safe date handling
 */
export function calculateFlightDates(startDate, endDate, destination) {
  if (!startDate || !endDate) {
    return {
      outboundDate: null,
      returnDate: null,
      flyOutEarly: false,
      reason: null,
    };
  }

  // Fix timezone issues by forcing local midnight
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const isRemote = isRemoteDestination(destination);

  if (isRemote) {
    const dayBefore = new Date(start);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayBeforeStr = dayBefore.toISOString().split("T")[0];

    return {
      outboundDate: dayBeforeStr,
      returnDate: endDate,
      flyOutEarly: true,
      reason: `${destination || "This destination"} is remote. We recommend flying out the day before (${dayBeforeStr}) to arrive fresh and maximize your ${Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1} days.`,
    };
  }

  return {
    outboundDate: startDate,
    returnDate: endDate,
    flyOutEarly: false,
    reason: null,
  };
}

/**
 * Get airport status (for UI to determine what to display)
 */
export function getAirportStatus(airportCode) {
  if (!airportCode) {
    return { exists: false, hasService: false, limited: false };
  }
  
  const code = airportCode.toUpperCase();
  
  if (hasLimitedService(code)) {
    return { 
      exists: true, 
      hasService: false, 
      limited: true,
      info: LIMITED_SERVICE_AIRPORTS[code]
    };
  }
  
  if (hasCommercialFlights(code)) {
    return { exists: true, hasService: true, limited: false };
  }
  
  return { exists: true, hasService: false, limited: false };
}

/**
 * Generate flight recommendation message
 */
export function getFlightRecommendationMessage({
  departureCity,
  destination,
  startDate,
  endDate,
  includeFlights,
  destinationAirportCode,
}) {
  if (!includeFlights) return null;

  // Validate airport code
  if (!destinationAirportCode) {
    return {
      type: "missing-airport",
      message: "⚠️ Unable to determine destination airport. Please verify your destination.",
      recommendation: "verify-destination",
    };
  }

  const airportCode = destinationAirportCode.toUpperCase();

  // Check if same city
  if (isSameCity(departureCity, destination)) {
    return {
      type: "same-city",
      message: `✈️ You're already in ${destination}! No flights needed - you can start exploring right away.`,
      recommendation: "disable-flights",
    };
  }

  // Check for limited service airports (like BAG)
  if (hasLimitedService(airportCode)) {
    const airportInfo = LIMITED_SERVICE_AIRPORTS[airportCode];
    const altCities = airportInfo.alternatives.map(code => getAirportCity(code)).join(" or ");
    
    return {
      type: "limited-service",
      message: `✈️→🚌 Fly to ${altCities}, then ${airportInfo.transport} (${airportInfo.travelTime})`,
      recommendation: "connect-via-major-hub",
      alternativeAirports: airportInfo.alternatives,
      groundTransport: airportInfo.transport,
      travelTime: airportInfo.travelTime,
      notes: airportInfo.notes
    };
  }

  // Check for commercial flights to destination airport
  if (!hasCommercialFlights(airportCode)) {
    return {
      type: "no-direct-flights",
      message: `✈️→🚌 No direct flights. Fly to nearby hub + ground transfer.`,
      recommendation: "connect-via-nearby-hub",
      alternativeAirports: ["MNL", "CRK", "CEB"],
    };
  }

  // Get flight date recommendations
  const flightDates = calculateFlightDates(startDate, endDate, destination);

  if (flightDates.flyOutEarly) {
    return {
      type: "remote-destination",
      message: `✈️ ${flightDates.reason}`,
      recommendation: "fly-early",
      outboundDate: flightDates.outboundDate,
      returnDate: flightDates.returnDate,
    };
  }

  // Standard flight recommendation
  if (startDate && endDate) {
    return {
      type: "standard",
      message: `✈️ Recommended flights: Depart ${formatFlightDate(startDate)}, return ${formatFlightDate(endDate)}.`,
      recommendation: "standard-flight",
      outboundDate: startDate,
      returnDate: endDate,
    };
  }

  return null;
}

/**
 * Format flight date
 */
export function formatFlightDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get contextual flight tips
 */
export function getFlightContextTips({
  departureCity,
  destination,
  startDate,
  endDate,
  duration,
  destinationAirportCode,
}) {
  const tips = [];

  if (!destinationAirportCode) return tips;

  const airportCode = destinationAirportCode.toUpperCase();

  if (isSameCity(departureCity, destination)) {
    tips.push(
      "💡 You're already in the destination city - consider local transportation instead"
    );
    return tips;
  }

  if (hasLimitedService(airportCode)) {
    const airportInfo = LIMITED_SERVICE_AIRPORTS[airportCode];
    tips.push(
      `🧭 ${destination} has no regular commercial flights. Fly to ${airportInfo.alternatives.map(c => getAirportCity(c)).join(" or ")} and continue by ${airportInfo.transport}.`
    );
  } else if (!hasCommercialFlights(airportCode)) {
    tips.push(
      "🧭 No direct commercial flights to your destination. Consider flying to a nearby major airport."
    );
  }

  if (isRemoteDestination(destination)) {
    tips.push(
      "🏝️ Remote destination detected - flying out early is recommended"
    );
  }

  if (startDate && endDate) {
    const flightDates = calculateFlightDates(startDate, endDate, destination);
    if (flightDates.outboundDate) {
      tips.push(
        `📅 Recommended departure: ${formatFlightDate(flightDates.outboundDate)}`
      );
    }
    if (flightDates.returnDate) {
      tips.push(`📅 Return flight: ${formatFlightDate(flightDates.returnDate)}`);
    }
  }

  if (duration >= 7) {
    tips.push("⏰ Longer trip - consider flexible flight dates for better prices");
  }

  return tips;
}

/**
 * Get detailed info for a limited service airport
 * @param {string} airportCode - 3-letter airport code
 * @returns {Object|null} - Airport info object or null if not found
 */
export function getLimitedServiceInfo(airportCode) {
  if (!airportCode) return null;
  const code = airportCode.toUpperCase();
  return LIMITED_SERVICE_AIRPORTS[code] || null;
}

export default {
  isSameCity,
  isRemoteDestination,
  calculateFlightDates,
  getFlightRecommendationMessage,
  formatFlightDate,
  getFlightContextTips,
  hasCommercialFlights,
  hasLimitedService,
  getAirportStatus,
  getAirportCity,
  getLimitedServiceInfo,  // ✅ NEW: Export for other components
};
