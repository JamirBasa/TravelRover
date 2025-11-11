/**
 * Regional Transport Context for the Philippines
 * Provides intelligence about regional transport corridors and connectivity
 */

/**
 * Regional transport corridor definitions
 * Groups cities by transport connectivity and infrastructure quality
 */
export const REGIONAL_TRANSPORT_CONTEXT = {
  METRO_MANILA: {
    name: "Metro Manila & Nearby",
    cities: ["Manila", "Quezon City", "Makati", "Pasig", "Taguig", "Caloocan"],
    characteristics: {
      primary_mode: "within_metro",
      infrastructure_quality: "excellent",
      tourist_friendly: true,
      notes: "Within metro - local transport only",
    },
  },

  LUZON_SOUTH: {
    name: "Southern Luzon",
    cities: ["Tagaytay", "Batangas", "Lipa", "Lucena", "Naga"],
    hub: "Manila",
    characteristics: {
      primary_mode: "bus",
      infrastructure_quality: "excellent",
      tourist_friendly: true,
      scenic_routes: true,
    },
    recommended_routes: [
      "Manila-Tagaytay",
      "Manila-Batangas",
      "Manila-Lucena",
    ],
  },

  LUZON_NORTH: {
    name: "Northern Luzon",
    cities: [
      "Baguio",
      "Banaue",
      "Sagada",
      "Vigan",
      "Laoag",
      "La Union",
      "Bontoc",
    ],
    hub: "Manila",
    characteristics: {
      primary_mode: "bus",
      infrastructure_quality: "good",
      tourist_friendly: true,
      scenic_routes: true,
      mountain_routes: true,
    },
    recommended_routes: ["Manila-Baguio", "Baguio-Sagada"],
    avoid_routes: [], // Long routes still manageable
  },

  LUZON_CENTRAL: {
    name: "Central Luzon",
    cities: ["Angeles", "Clark", "Olongapo", "Subic", "Tarlac", "Cabanatuan"],
    hub: "Manila",
    characteristics: {
      primary_mode: "bus",
      infrastructure_quality: "excellent",
      tourist_friendly: true,
    },
    recommended_routes: ["Manila-Subic", "Manila-Clark"],
  },

  MINDANAO_WEST: {
    name: "Western Mindanao Corridor",
    cities: ["Zamboanga", "Pagadian", "Dipolog", "Ozamis"],
    hub: "Zamboanga",
    characteristics: {
      primary_mode: "bus",
      infrastructure_quality: "good",
      tourist_friendly: true,
      scenic_routes: true,
      coastal_highway: true,
    },
    recommended_routes: [
      "Zamboanga-Pagadian",
      "Pagadian-Dipolog",
      "Dipolog-Ozamis",
    ],
    avoid_routes: [
      "Zamboanga-Cagayan de Oro", // Too long (11+ hours)
    ],
    notes:
      "Well-connected coastal corridor. Avoid cross-island routes to Northern Mindanao.",
  },

  MINDANAO_SOUTH: {
    name: "Southern Mindanao Corridor",
    cities: [
      "Davao",
      "General Santos",
      "Digos",
      "Tagum",
      "Koronadal",
      "Kidapawan",
    ],
    hub: "Davao",
    characteristics: {
      primary_mode: "bus",
      infrastructure_quality: "excellent",
      tourist_friendly: true,
    },
    recommended_routes: [
      "Davao-General Santos",
      "Davao-Tagum",
      "Davao-Digos",
    ],
  },

  MINDANAO_NORTH: {
    name: "Northern Mindanao Corridor",
    cities: ["Cagayan de Oro", "Iligan", "Butuan", "Valencia", "Malaybalay"],
    hub: "Cagayan de Oro",
    characteristics: {
      primary_mode: "bus",
      infrastructure_quality: "good",
      tourist_friendly: true,
    },
    recommended_routes: [
      "Cagayan de Oro-Iligan",
      "Cagayan de Oro-Valencia",
      "Cagayan de Oro-Butuan",
    ],
  },

  VISAYAS_CENTRAL: {
    name: "Central Visayas",
    cities: [
      "Cebu",
      "Mandaue",
      "Lapu-Lapu",
      "Tagbilaran",
      "Dumaguete",
      "Bohol",
    ],
    hub: "Cebu",
    characteristics: {
      primary_mode: "ferry",
      infrastructure_quality: "excellent",
      tourist_friendly: true,
      island_hopping: true,
      scenic_routes: true,
    },
    recommended_routes: ["Cebu-Bohol", "Cebu-Dumaguete"],
    notes: "Ferry connections are the norm - fast and tourist-friendly",
  },

  VISAYAS_WESTERN: {
    name: "Western Visayas",
    cities: ["Iloilo", "Bacolod", "Kalibo", "Boracay", "Roxas"],
    hub: "Iloilo",
    characteristics: {
      primary_mode: "ferry",
      infrastructure_quality: "good",
      tourist_friendly: true,
      island_hopping: true,
    },
    recommended_routes: ["Iloilo-Bacolod"],
  },

  VISAYAS_EASTERN: {
    name: "Eastern Visayas",
    cities: ["Tacloban", "Ormoc", "Catbalogan"],
    hub: "Tacloban",
    characteristics: {
      primary_mode: "ferry",
      infrastructure_quality: "good",
      tourist_friendly: true,
    },
    recommended_routes: ["Cebu-Ormoc"],
  },

  PALAWAN: {
    name: "Palawan",
    cities: ["Puerto Princesa", "El Nido", "Coron", "San Vicente"],
    hub: "Puerto Princesa",
    characteristics: {
      primary_mode: "van",
      infrastructure_quality: "fair",
      tourist_friendly: true,
      scenic_routes: true,
      limited_service: true,
    },
    notes:
      "Long van rides common. Puerto Princesa to El Nido = 5-6 hours but scenic.",
  },
};

/**
 * Find which regional corridor a city belongs to
 * @param {string} cityName - City to lookup
 * @returns {Object|null} Regional context or null
 */
export const findRegionalContext = (cityName) => {
  if (!cityName) return null;

  const normalizeCity = (city) =>
    city
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const normCity = normalizeCity(cityName);

  for (const [regionKey, regionData] of Object.entries(
    REGIONAL_TRANSPORT_CONTEXT
  )) {
    const hasCityMatch = regionData.cities.some(
      (city) => normalizeCity(city) === normCity
    );

    if (hasCityMatch) {
      return {
        regionKey,
        ...regionData,
      };
    }
  }

  return null;
};

/**
 * Check if two cities are in the same regional transport corridor
 * @param {string} city1 - First city
 * @param {string} city2 - Second city
 * @returns {Object} Regional relationship info
 */
export const isRegionalTransportPractical = (city1, city2) => {
  const region1 = findRegionalContext(city1);
  const region2 = findRegionalContext(city2);

  // If either city not in database
  if (!region1 || !region2) {
    return {
      sameRegion: false,
      recommendation:
        "Inter-regional travel - check specific route distances and times",
      bothRegionsFound: !!(region1 && region2),
    };
  }

  // Same region
  if (region1.regionKey === region2.regionKey) {
    // Check if route is in avoid list
    const routeKey = `${city1}-${city2}`;
    const reverseKey = `${city2}-${city1}`;

    const isAvoided = region1.avoid_routes?.some(
      (route) =>
        route.toLowerCase() === routeKey.toLowerCase() ||
        route.toLowerCase() === reverseKey.toLowerCase()
    );

    const isRecommended = region1.recommended_routes?.some(
      (route) =>
        route.toLowerCase() === routeKey.toLowerCase() ||
        route.toLowerCase() === reverseKey.toLowerCase()
    );

    return {
      sameRegion: true,
      region: region1.name,
      isRecommended: isRecommended || false,
      isAvoided: isAvoided || false,
      characteristics: region1.characteristics,
      recommendation: isAvoided
        ? `⚠️ Not recommended within ${region1.name} - consider flying or breaking journey`
        : isRecommended
        ? `✅ ${region1.characteristics.primary_mode} travel recommended within ${region1.name}`
        : `${region1.characteristics.primary_mode} travel available within ${region1.name}`,
      hub: region1.hub,
    };
  }

  // Different regions
  return {
    sameRegion: false,
    region1: region1.name,
    region2: region2.name,
    recommendation: `Inter-regional travel from ${region1.name} to ${region2.name} - check specific route or consider flying`,
    hub1: region1.hub,
    hub2: region2.hub,
  };
};

/**
 * Get transport recommendations for a specific region
 * @param {string} regionKey - Region identifier
 * @returns {Object|null} Region transport recommendations
 */
export const getRegionalRecommendations = (regionKey) => {
  return REGIONAL_TRANSPORT_CONTEXT[regionKey] || null;
};

/**
 * Check if route crosses major geographic boundaries (e.g., inter-island)
 * @param {string} city1 - First city
 * @param {string} city2 - Second city
 * @returns {Object} Boundary crossing info
 */
export const checkGeographicBoundaries = (city1, city2) => {
  const region1 = findRegionalContext(city1);
  const region2 = findRegionalContext(city2);

  if (!region1 || !region2) {
    return { crossesBoundary: false, boundaryType: null };
  }

  const r1Key = region1.regionKey;
  const r2Key = region2.regionKey;

  // Check if crossing major island groups
  const luzonRegions = [
    "METRO_MANILA",
    "LUZON_SOUTH",
    "LUZON_NORTH",
    "LUZON_CENTRAL",
  ];
  const visayasRegions = [
    "VISAYAS_CENTRAL",
    "VISAYAS_WESTERN",
    "VISAYAS_EASTERN",
  ];
  const mindanaoRegions = [
    "MINDANAO_WEST",
    "MINDANAO_SOUTH",
    "MINDANAO_NORTH",
  ];

  const isLuzon1 = luzonRegions.includes(r1Key);
  const isLuzon2 = luzonRegions.includes(r2Key);
  const isVisayas1 = visayasRegions.includes(r1Key);
  const isVisayas2 = visayasRegions.includes(r2Key);
  const isMindanao1 = mindanaoRegions.includes(r1Key);
  const isMindanao2 = mindanaoRegions.includes(r2Key);

  // Check for inter-island crossings
  if ((isLuzon1 && isVisayas2) || (isVisayas1 && isLuzon2)) {
    return {
      crossesBoundary: true,
      boundaryType: "Luzon-Visayas",
      recommendation: "Flight or long ferry required",
    };
  }

  if ((isLuzon1 && isMindanao2) || (isMindanao1 && isLuzon2)) {
    return {
      crossesBoundary: true,
      boundaryType: "Luzon-Mindanao",
      recommendation: "Flight required",
    };
  }

  if ((isVisayas1 && isMindanao2) || (isMindanao1 && isVisayas2)) {
    return {
      crossesBoundary: true,
      boundaryType: "Visayas-Mindanao",
      recommendation: "Flight or ferry required",
    };
  }

  return {
    crossesBoundary: false,
    boundaryType: "same-island-group",
    recommendation: "Ground transport may be available",
  };
};

export default {
  REGIONAL_TRANSPORT_CONTEXT,
  findRegionalContext,
  isRegionalTransportPractical,
  getRegionalRecommendations,
  checkGeographicBoundaries,
};
