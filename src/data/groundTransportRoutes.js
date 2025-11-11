/**
 * Philippine Ground Transport Routes Database
 * Comprehensive data for bus, van, and ferry routes across the Philippines
 * Used to determine if ground transport is practical for a given route
 */

/**
 * Ground transport route data
 * Key format: "DepartureCity-DestinationCity" (bidirectional)
 */
export const GROUND_TRANSPORT_ROUTES = {
  // ==================== LUZON ROUTES ====================

  // Metro Manila to Nearby Destinations
  "Manila-Tagaytay": {
    distance: 60,
    travelTime: 1.5,
    modes: ["bus", "van"],
    operators: ["DLTB Co", "Alps The Bus"],
    cost: { min: 150, max: 300 },
    frequency: "every 30 mins",
    scenic: true,
    notes: "Popular weekend destination, frequent service",
  },

  "Manila-Batangas": {
    distance: 120,
    travelTime: 2.5,
    modes: ["bus"],
    operators: ["DLTB Co", "JAM Transit", "Ceres"],
    cost: { min: 200, max: 350 },
    frequency: "every 30 mins",
    notes: "Gateway to Batangas pier for Mindoro",
  },

  "Manila-Subic": {
    distance: 120,
    travelTime: 2.5,
    modes: ["bus", "van"],
    operators: ["Victory Liner", "Five Star Bus"],
    cost: { min: 250, max: 400 },
    frequency: "hourly",
    scenic: false,
  },

  // Northern Luzon Routes
  "Manila-Baguio": {
    distance: 250,
    travelTime: 6,
    modes: ["bus"],
    operators: ["Victory Liner", "Genesis Transport", "Joy Bus"],
    cost: { min: 450, max: 750 },
    frequency: "hourly (24/7 service)",
    scenic: true,
    notes: "Mountain route with scenic views, popular tourist destination",
  },

  "Manila-Vigan": {
    distance: 400,
    travelTime: 8,
    modes: ["bus"],
    operators: ["Partas", "Farinas Trans", "Viron Transit"],
    cost: { min: 600, max: 900 },
    frequency: "several daily",
    hasOvernightOption: true,
    scenic: true,
    notes: "UNESCO heritage city, overnight bus recommended",
  },

  "Baguio-Sagada": {
    distance: 150,
    travelTime: 5,
    modes: ["bus", "van"],
    operators: ["GL Trans", "Coda Lines"],
    cost: { min: 300, max: 500 },
    frequency: "few daily",
    scenic: true,
    notes: "Mountain route, scenic but winding roads",
  },

  // ==================== VISAYAS ROUTES ====================

  // Cebu Routes
  "Cebu-Bohol": {
    distance: 70,
    travelTime: 2,
    modes: ["ferry"],
    operators: ["OceanJet", "SuperCat", "FastCat"],
    cost: { min: 500, max: 800 },
    frequency: "multiple daily",
    hasFerry: true,
    scenic: true,
    notes: "Fast ferry service to Tagbilaran",
  },

  "Cebu-Dumaguete": {
    distance: 250,
    travelTime: 5,
    modes: ["ferry"],
    operators: ["OceanJet", "Cokaliong"],
    cost: { min: 800, max: 1200 },
    frequency: "2-3 daily",
    hasFerry: true,
    scenic: true,
    notes: "Direct ferry to Dumaguete, Negros Oriental",
  },

  "Cebu-Ormoc": {
    distance: 150,
    travelTime: 3.5,
    modes: ["ferry"],
    operators: ["SuperCat", "Roble Shipping"],
    cost: { min: 600, max: 900 },
    frequency: "daily",
    hasFerry: true,
    notes: "Gateway to Leyte",
  },

  // Iloilo & Bacolod
  "Iloilo-Bacolod": {
    distance: 80,
    travelTime: 2,
    modes: ["ferry"],
    operators: ["FastCat", "Weesam Express", "SuperCat"],
    cost: { min: 500, max: 800 },
    frequency: "multiple daily",
    hasFerry: true,
    scenic: false,
  },

  // ==================== MINDANAO ROUTES ====================

  // Western Mindanao Corridor (Zamboanga Peninsula)
  "Zamboanga-Pagadian": {
    distance: 135,
    travelTime: 3,
    modes: ["bus", "van"],
    operators: ["Ceres Liner", "Bachelor Express", "Rural Transit"],
    cost: { min: 200, max: 350 },
    frequency: "hourly (6am-4pm)",
    scenic: true,
    notes: "Coastal highway with scenic views, very practical route",
  },

  "Zamboanga-Dipolog": {
    distance: 210,
    travelTime: 5,
    modes: ["bus", "van"],
    operators: ["Ceres Liner", "Rural Transit", "Bachelor Express"],
    cost: { min: 400, max: 600 },
    frequency: "several daily",
    scenic: true,
    notes: "Western Mindanao corridor, coastal route",
  },

  "Pagadian-Dipolog": {
    distance: 95,
    travelTime: 2.5,
    modes: ["bus", "van"],
    operators: ["Ceres Liner", "Rural Transit"],
    cost: { min: 180, max: 300 },
    frequency: "hourly",
    scenic: true,
    notes: "Continues along coastal highway",
  },

  "Dipolog-Ozamis": {
    distance: 100,
    travelTime: 2,
    modes: ["bus", "van"],
    operators: ["Ceres Liner", "Rural Transit"],
    cost: { min: 150, max: 250 },
    frequency: "frequent",
    scenic: false,
  },

  "Zamboanga-Ozamiz": {
    distance: 310,
    travelTime: 7,
    modes: ["bus"],
    operators: ["Ceres Liner", "Rural Transit", "Bachelor Express"],
    cost: { min: 550, max: 850 },
    frequency: "several daily",
    scenic: true,
    notes: "Via Dipolog - Western Mindanao coastal route. Consider breaking journey in Dipolog or flying for convenience.",
    hasOvernightOption: false,
  },

  // ❌ IMPRACTICAL LONG-DISTANCE ROUTES (documented for awareness)
  "Zamboanga-Cagayan de Oro": {
    distance: 450,
    travelTime: 11,
    modes: ["bus"],
    operators: ["Bachelor Express", "Mindanao Star"],
    cost: { min: 800, max: 1200 },
    frequency: "few daily (evening departures)",
    hasOvernightOption: true,
    scenic: false,
    notes:
      "Overnight bus travel (8pm-7am). Sleep during journey, arrive refreshed. More time-efficient than connecting flights with 2-4hr layovers.",
    practical: true, // OPTIMAL: Evening departure → sleep → morning arrival. Better than 7-11hr daytime flight journey with layovers.
    preferOverFlight: true, // Flag: Recommend bus over connecting flights due to overnight optimization
  },

  // Southern Mindanao Corridor (Davao Region)
  "Davao-General Santos": {
    distance: 150,
    travelTime: 3.5,
    modes: ["bus", "van"],
    operators: ["Yellow Bus Line", "Philtranco", "Ecoland"],
    cost: { min: 300, max: 500 },
    frequency: "hourly",
    scenic: false,
    notes: "Well-maintained highway, comfortable journey",
  },

  "Davao-Tagum": {
    distance: 55,
    travelTime: 1.5,
    modes: ["bus", "van"],
    operators: ["Davao Metro Shuttle", "Bachelor Express"],
    cost: { min: 100, max: 200 },
    frequency: "every 20 mins",
    scenic: false,
    notes: "Frequent service, very practical",
  },

  "Davao-Digos": {
    distance: 60,
    travelTime: 1.5,
    modes: ["bus", "van"],
    operators: ["Yellow Bus Line", "Bachelor Express"],
    cost: { min: 120, max: 200 },
    frequency: "every 30 mins",
    scenic: false,
  },

  // Northern Mindanao Corridor (Cagayan de Oro Region)
  "Cagayan de Oro-Iligan": {
    distance: 90,
    travelTime: 2,
    modes: ["bus", "van"],
    operators: ["Super Five Transport", "Pelaez Transport", "Rural Transit"],
    cost: { min: 150, max: 250 },
    frequency: "every 30 mins",
    scenic: false,
    notes: "Very frequent service, well-connected cities",
  },

  "Cagayan de Oro-Valencia": {
    distance: 50,
    travelTime: 1.5,
    modes: ["bus", "van"],
    operators: ["Rural Transit", "Bachelor Express"],
    cost: { min: 100, max: 180 },
    frequency: "hourly",
    scenic: true,
    notes: "Gateway to Bukidnon highlands",
  },

  "Cagayan de Oro-Malaybalay": {
    distance: 90,
    travelTime: 2,
    modes: ["bus", "van"],
    operators: ["Rural Transit", "Bachelor Express", "Super Five Transport"],
    cost: { min: 200, max: 300 },
    frequency: "every hour (6am-6pm)",
    scenic: true,
    notes: "Highland route to Bukidnon capital. Cool climate destination. Regular service from Agora Terminal.",
  },

  "Valencia-Malaybalay": {
    distance: 40,
    travelTime: 1,
    modes: ["bus", "van"],
    operators: ["Rural Transit", "Bachelor Express"],
    cost: { min: 80, max: 150 },
    frequency: "frequent",
    scenic: true,
    notes: "Bukidnon highlands route",
  },

  "Malaybalay-Davao": {
    distance: 180,
    travelTime: 4.5,
    modes: ["bus"],
    operators: ["Bachelor Express", "Rural Transit"],
    cost: { min: 400, max: 600 },
    frequency: "several daily",
    scenic: true,
    notes: "Highland route through Bukidnon plateau",
  },

  "Cagayan de Oro-Butuan": {
    distance: 180,
    travelTime: 4,
    modes: ["bus", "van"],
    operators: ["Bachelor Express", "Super Five Transport"],
    cost: { min: 350, max: 500 },
    frequency: "several daily",
    scenic: false,
  },

  // ==================== ISLAND CONNECTIONS ====================

  // Batangas to Mindoro
  "Batangas-Calapan": {
    distance: 55,
    travelTime: 2,
    modes: ["roro"],
    operators: ["Starlite Ferries", "Montenegro Lines"],
    cost: { min: 300, max: 500 },
    frequency: "multiple daily",
    hasFerry: true,
    notes: "RORO ferry, gateway to Mindoro",
  },

  "Batangas-Puerto Galera": {
    distance: 60,
    travelTime: 1.5,
    modes: ["ferry"],
    operators: ["Si-Kat", "Minolo Shipping"],
    cost: { min: 400, max: 600 },
    frequency: "multiple daily",
    hasFerry: true,
    scenic: true,
    notes: "Beach resort destination",
  },
};

/**
 * Find ground transport route between two cities
 * @param {string} city1 - First city name
 * @param {string} city2 - Second city name
 * @returns {Object|null} Route data or null if not found
 */
export const findGroundRoute = (city1, city2) => {
  if (!city1 || !city2) return null;

  // Normalize city names (remove extra spaces, lowercase for comparison)
  const normalizeCity = (city) => {
    let normalized = city
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      // Remove common suffixes to improve matching
      .replace(/ city$/i, "")
      .replace(/ de oro$/i, "") // For "Cagayan de Oro" → "Cagayan"
      .replace(/\s+/g, " ")
      .trim();
    return normalized;
  };

  const normCity1 = normalizeCity(city1);
  const normCity2 = normalizeCity(city2);

  // Try both directions
  for (const [routeKey, routeData] of Object.entries(GROUND_TRANSPORT_ROUTES)) {
    const [start, end] = routeKey.split("-").map(normalizeCity);

    if (
      (normCity1 === start && normCity2 === end) ||
      (normCity1 === end && normCity2 === start)
    ) {
      return {
        ...routeData,
        routeKey,
        bidirectional: true,
      };
    }
  }

  return null;
};

/**
 * Check if ground transport exists for a route
 * @param {string} city1 - First city
 * @param {string} city2 - Second city
 * @returns {boolean} True if route exists
 */
export const hasGroundRoute = (city1, city2) => {
  return findGroundRoute(city1, city2) !== null;
};

/**
 * Get all available ground routes from a city
 * @param {string} city - City name
 * @returns {Array} Array of available routes
 */
export const getRoutesFromCity = (city) => {
  if (!city) return [];

  const normalizeCity = (c) =>
    c
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const normCity = normalizeCity(city);

  const routes = [];

  for (const [routeKey, routeData] of Object.entries(GROUND_TRANSPORT_ROUTES)) {
    const [start, end] = routeKey.split("-").map(normalizeCity);

    if (normCity === start) {
      routes.push({ destination: end, ...routeData, routeKey });
    } else if (normCity === end) {
      routes.push({ destination: start, ...routeData, routeKey });
    }
  }

  return routes;
};

export default {
  GROUND_TRANSPORT_ROUTES,
  findGroundRoute,
  hasGroundRoute,
  getRoutesFromCity,
};
