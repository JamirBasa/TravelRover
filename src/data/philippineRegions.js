/**
 * Philippine Geographic Regions Database
 * Used for validating that generated places belong to the correct destination
 */

export const PHILIPPINE_REGIONS = {
  // National Capital Region
  "Manila": {
    region: "NCR",
    province: "Metro Manila",
    nearbyAreas: ["Quezon City", "Makati", "Pasay", "Taguig", "Mandaluyong", "Pasig", "Parañaque", "Las Piñas", "Muntinlupa", "Caloocan"],
    keywords: ["manila", "intramuros", "ermita", "malate", "binondo", "quiapo", "sampaloc", "tondo", "sta. cruz"],
    famousAttractions: ["Intramuros", "Rizal Park", "Manila Ocean Park", "Manila Bay", "Binondo Chinatown", "Fort Santiago", "San Agustin Church"]
  },
  "Quezon City": {
    region: "NCR",
    province: "Metro Manila",
    nearbyAreas: ["Manila", "Makati", "Pasig", "Marikina", "Caloocan", "Valenzuela"],
    keywords: ["quezon city", "qc", "diliman", "cubao", "novaliches", "commonwealth"],
    famousAttractions: ["UP Diliman", "Quezon Memorial Circle", "La Mesa Dam", "SM North EDSA", "Araneta Coliseum"]
  },
  
  // Luzon Major Cities
  "Baguio": {
    region: "CAR",
    province: "Benguet",
    nearbyAreas: ["La Trinidad", "Tuba", "Itogon", "Sablan"],
    keywords: ["baguio", "benguet", "burnham park", "session road", "camp john hay"],
    famousAttractions: ["Burnham Park", "Session Road", "Camp John Hay", "Mines View Park", "The Mansion", "Botanical Garden", "Bell Church"]
  },
  "Vigan": {
    region: "Region I",
    province: "Ilocos Sur",
    nearbyAreas: ["Bantay", "Santa Catalina", "Caoayan"],
    keywords: ["vigan", "ilocos sur", "calle crisologo", "bantay", "syquia mansion"],
    famousAttractions: ["Calle Crisologo", "Bantay Bell Tower", "Syquia Mansion", "St. Paul's Cathedral", "Pagburnayan Jar Factory"]
  },
  "Batangas": {
    region: "Region IV-A",
    province: "Batangas",
    nearbyAreas: ["Lipa", "Tanauan", "Taal", "Lemery", "Nasugbu", "Mabini", "San Juan"],
    keywords: ["batangas", "taal", "nasugbu", "anilao", "mabini", "laiya"],
    famousAttractions: ["Taal Volcano", "Anilao Diving Sites", "Laiya Beach", "Fortune Island", "Sombrero Island", "Mount Maculot"]
  },
  "Tagaytay": {
    region: "Region IV-A",
    province: "Cavite",
    nearbyAreas: ["Alfonso", "Mendez", "Silang", "Amadeo"],
    keywords: ["tagaytay", "taal lake", "people's park", "picnic grove"],
    famousAttractions: ["Taal Lake View", "People's Park in the Sky", "Picnic Grove", "Sky Ranch", "Twin Lakes"]
  },
  
  // Visayas Major Cities
  "Cebu": {
    region: "Region VII",
    province: "Cebu",
    nearbyAreas: ["Mandaue", "Lapu-Lapu", "Talisay", "Toledo", "Danao", "Carcar", "Oslob", "Moalboal", "Badian", "Malapascua", "Bantayan"],
    keywords: ["cebu", "cebu city", "mactan", "lapu-lapu", "mandaue", "oslob", "moalboal", "kawasan", "malapascua", "bantayan"],
    famousAttractions: ["Magellan's Cross", "Basilica del Santo Niño", "Fort San Pedro", "Tops Lookout", "Kawasan Falls", "Oslob Whale Sharks", "Malapascua Island", "Bantayan Island"]
  },
  "Bohol": {
    region: "Region VII",
    province: "Bohol",
    nearbyAreas: ["Tagbilaran", "Panglao", "Anda", "Carmen", "Loboc", "Dauis"],
    keywords: ["bohol", "tagbilaran", "panglao", "chocolate hills", "loboc", "anda"],
    famousAttractions: ["Chocolate Hills", "Panglao Beach", "Loboc River Cruise", "Tarsier Sanctuary", "Alona Beach", "Hinagdanan Cave"]
  },
  "Boracay": {
    region: "Region VI",
    province: "Aklan",
    nearbyAreas: ["Caticlan", "Kalibo"],
    keywords: ["boracay", "white beach", "bulabog", "diniwid", "puka shell"],
    famousAttractions: ["White Beach", "Puka Shell Beach", "Bulabog Beach", "Mount Luho", "Willy's Rock", "Diniwid Beach"]
  },
  "Iloilo": {
    region: "Region VI",
    province: "Iloilo",
    nearbyAreas: ["Oton", "Pavia", "Tigbauan", "Guimaras"],
    keywords: ["iloilo", "iloilo city", "guimaras", "jaro", "molo"],
    famousAttractions: ["Molo Church", "Jaro Cathedral", "Miag-ao Church", "Esplanade", "Museo Iloilo", "Guimaras Island"]
  },
  "Bacolod": {
    region: "Region VI",
    province: "Negros Occidental",
    nearbyAreas: ["Talisay", "Silay", "Victorias", "Murcia", "Don Salvador Benedicto"],
    keywords: ["bacolod", "negros", "silay", "the ruins", "mambukal"],
    famousAttractions: ["The Ruins", "San Sebastian Cathedral", "Mambukal Resort", "Campuestohan Highland Resort", "Negros Museum"]
  },
  
  // Mindanao Major Cities
  "Davao": {
    region: "Region XI",
    province: "Davao del Sur",
    nearbyAreas: ["Davao City", "Samal Island", "Digos", "Tagum", "Panabo"],
    keywords: ["davao", "davao city", "samal", "eden nature park", "mount apo"],
    famousAttractions: ["Mount Apo", "Eden Nature Park", "Samal Island", "Philippine Eagle Center", "People's Park", "Jack's Ridge", "Maxima Aqua Fun"]
  },
  "Cagayan de Oro": {
    region: "Region X",
    province: "Misamis Oriental",
    nearbyAreas: ["Opol", "Tagoloan", "Claveria", "Bukidnon"],
    keywords: ["cagayan de oro", "cdo", "white water rafting", "mapawa", "missamis oriental"],
    famousAttractions: ["White Water Rafting", "Mapawa Nature Park", "Gardens of Malasag", "Divine Mercy Shrine", "Macahambus Adventure Park"]
  },
  "Siargao": {
    region: "Region XIII",
    province: "Surigao del Norte",
    nearbyAreas: ["General Luna", "Del Carmen", "Pilar", "Dapa"],
    keywords: ["siargao", "cloud 9", "general luna", "sugba lagoon", "magpupungko"],
    famousAttractions: ["Cloud 9 Surfing", "Sugba Lagoon", "Magpupungko Rock Pools", "Naked Island", "Daku Island", "Guyam Island", "Sohoton Cove"]
  },
  "Zamboanga": {
    region: "Region IX",
    province: "Zamboanga City (Independent Chartered City)",
    nearbyAreas: ["Pagadian", "Dipolog", "Zamboanga del Sur", "Zamboanga del Norte"],
    keywords: ["zamboanga", "zamboanga city", "fort pilar", "pink sand beach", "pink beach"],
    famousAttractions: ["Fort Pilar", "Great Santa Cruz Island (Pink Beach)", "Pasonanca Park", "Yakan Weaving Village", "Merloquet Falls"]
  },
  
  // Island Destinations
  "Palawan": {
    region: "Region IV-B",
    province: "Palawan",
    nearbyAreas: ["Puerto Princesa", "El Nido", "Coron", "San Vicente", "Port Barton"],
    keywords: ["palawan", "el nido", "coron", "puerto princesa", "underground river", "nacpan", "kayangan"],
    famousAttractions: ["El Nido Lagoons", "Puerto Princesa Underground River", "Coron Island", "Kayangan Lake", "Twin Lagoon", "Nacpan Beach", "Port Barton"]
  },
  "Camiguin": {
    region: "Region X",
    province: "Camiguin",
    nearbyAreas: ["Mambajao", "Catarman", "Mahinog"],
    keywords: ["camiguin", "sunken cemetery", "white island", "katibawasan falls"],
    famousAttractions: ["Sunken Cemetery", "White Island", "Katibawasan Falls", "Ardent Hot Springs", "Old Volcano", "Mantigue Island"]
  }
};

/**
 * Get region data for a destination
 */
export function getRegionData(destination) {
  // Return null if no destination provided
  if (!destination || typeof destination !== 'string') {
    return null;
  }

  // Normalize destination name
  const normalizedDestination = destination.trim();
  
  // Try exact match first
  if (PHILIPPINE_REGIONS[normalizedDestination]) {
    return PHILIPPINE_REGIONS[normalizedDestination];
  }
  
  // Try partial match
  const destinationLower = normalizedDestination.toLowerCase();
  for (const [key, value] of Object.entries(PHILIPPINE_REGIONS)) {
    if (destinationLower.includes(key.toLowerCase()) || 
        key.toLowerCase().includes(destinationLower)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Check if a place name is likely within the destination region
 */
export function validatePlaceLocation(placeName, destination) {
  const regionData = getRegionData(destination);
  if (!regionData) return { valid: true, confidence: "unknown" }; // Can't validate unknown destinations
  
  const placeNameLower = placeName.toLowerCase();
  const destinationLower = destination.toLowerCase();
  
  // High confidence checks
  if (placeNameLower.includes(destinationLower)) {
    return { valid: true, confidence: "high", reason: "Place name includes destination" };
  }
  
  // Check if place includes any keywords for this region
  const hasRegionKeyword = regionData.keywords.some(keyword => 
    placeNameLower.includes(keyword.toLowerCase())
  );
  
  if (hasRegionKeyword) {
    return { valid: true, confidence: "high", reason: "Place name includes region-specific keyword" };
  }
  
  // Check if it's a famous attraction
  const isFamousAttraction = regionData.famousAttractions.some(attraction =>
    placeNameLower.includes(attraction.toLowerCase()) || 
    attraction.toLowerCase().includes(placeNameLower)
  );
  
  if (isFamousAttraction) {
    return { valid: true, confidence: "high", reason: "Recognized famous attraction" };
  }
  
  // Check nearby areas
  const isNearbyArea = regionData.nearbyAreas.some(area =>
    placeNameLower.includes(area.toLowerCase())
  );
  
  if (isNearbyArea) {
    return { valid: true, confidence: "medium", reason: "Located in nearby area" };
  }
  
  // Check for conflicting location identifiers (other major cities)
  const otherDestinations = Object.keys(PHILIPPINE_REGIONS).filter(d => 
    d.toLowerCase() !== destinationLower
  );
  
  const hasConflictingLocation = otherDestinations.some(otherDest =>
    placeNameLower.includes(otherDest.toLowerCase())
  );
  
  if (hasConflictingLocation) {
    return { 
      valid: false, 
      confidence: "high", 
      reason: "Place name contains different Philippine destination" 
    };
  }
  
  // No strong indicators either way
  return { valid: true, confidence: "low", reason: "No strong geographic indicators found" };
}

/**
 * Get validation examples for a specific destination
 */
export function getValidationExamples(destination) {
  const regionData = getRegionData(destination);
  if (!regionData) return null;
  
  return {
    correctExamples: regionData.famousAttractions.slice(0, 3),
    incorrectExamples: getIncorrectExamples(destination),
    keywords: regionData.keywords,
    nearbyAreas: regionData.nearbyAreas.slice(0, 3)
  };
}

/**
 * Get examples of incorrect places (attractions from other regions)
 */
function getIncorrectExamples(destination) {
  const destinationLower = destination.toLowerCase();
  const incorrectExamples = [];
  
  for (const [region, data] of Object.entries(PHILIPPINE_REGIONS)) {
    if (region.toLowerCase() !== destinationLower && incorrectExamples.length < 3) {
      incorrectExamples.push({
        place: data.famousAttractions[0],
        actualLocation: region
      });
    }
  }
  
  return incorrectExamples;
}

export default PHILIPPINE_REGIONS;
