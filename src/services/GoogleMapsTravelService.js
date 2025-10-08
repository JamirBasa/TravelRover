// Enhanced Google Maps Travel Time Service for TravelRover
// Provides accurate travel time estimations and route analysis

class GoogleMapsTravelService {
  constructor() {
    this.distanceService = null;
    this.directionsService = null;
    this.initialized = false;
    this.cache = new Map(); // Cache results to avoid duplicate API calls
    this.rateLimitQueue = [];
    this.isProcessingQueue = false;
  }

  // Initialize Google Maps services
  async initialize() {
    if (window.google?.maps && !this.initialized) {
      try {
        this.distanceService = new window.google.maps.DistanceMatrixService();
        this.directionsService = new window.google.maps.DirectionsService();
        this.initialized = true;
        console.log('✅ Google Maps Travel Service initialized');

        // Test API availability with a simple request
        await this.testAPIAvailability();
      } catch (error) {
        console.warn('⚠️ Google Maps API initialization failed:', error);
        this.initialized = false;
      }
    }
  }

  // Test API availability to handle REQUEST_DENIED gracefully
  async testAPIAvailability() {
    if (!this.distanceService) return false;

    return new Promise((resolve) => {
      // Test with a simple distance calculation
      this.distanceService.getDistanceMatrix({
        origins: ['Manila, Philippines'],
        destinations: ['Cebu, Philippines'],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      }, (response, status) => {
        if (status === 'REQUEST_DENIED') {
          console.warn('🚫 Google Maps Distance Matrix API is not enabled or accessible');
          console.warn('💡 Enable "Distance Matrix API" in Google Cloud Console');
          this.initialized = false;
        } else if (status === 'OK') {
          console.log('✅ Google Maps APIs are working correctly');
        }
        resolve(status === 'OK');
      });
    });
  }

  // Get travel time between multiple locations with caching and rate limiting
  async getTravelTimes(locations, travelMode = 'DRIVING') {
    try {
      await this.initialize();

      if (!this.distanceService || !this.initialized) {
        console.warn('⚠️ Google Maps API not available, using enhanced fallback estimations');
        return this.getFallbackTravelTimes(locations);
      }

      const results = [];

      for (let i = 0; i < locations.length - 1; i++) {
        const from = locations[i];
        const to = locations[i + 1];

        // Check cache first
        const cacheKey = this.getCacheKey(from, to, travelMode);
        if (this.cache.has(cacheKey)) {
          results.push(this.cache.get(cacheKey));
          continue;
        }

        // Get travel time with rate limiting
        const travelData = await this.getSingleTravelTime(from, to, travelMode);

        // Cache the result
        this.cache.set(cacheKey, travelData);
        results.push(travelData);

        // Small delay to avoid rate limiting
        await this.delay(100);
      }

      return results;
    } catch (error) {
      console.error('Error getting travel times:', error);
      return this.getFallbackTravelTimes(locations);
    }
  }

  // Get single travel time between two locations
  async getSingleTravelTime(from, to, travelMode = 'DRIVING') {
    return new Promise((resolve) => {
      const fromLocation = this.formatLocationForAPI(from);
      const toLocation = this.formatLocationForAPI(to);

      this.distanceService.getDistanceMatrix({
        origins: [fromLocation],
        destinations: [toLocation],
        travelMode: window.google.maps.TravelMode[travelMode],
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
          const element = response.rows[0].elements[0];

          const result = {
            from: fromLocation,
            to: toLocation,
            duration: element.duration.text,
            durationValue: element.duration.value, // seconds
            distance: element.distance.text,
            distanceValue: element.distance.value, // meters
            status: 'success',
            travelMode: travelMode
          };

          console.log(`🗺️ Travel: ${fromLocation} → ${toLocation}: ${result.duration} (${result.distance})`);
          resolve(result);
        } else if (status === 'REQUEST_DENIED') {
          console.warn(`🚫 Google Maps API access denied. Please enable Distance Matrix API in Google Cloud Console.`);
          console.warn(`💡 Alternative: Use the new Routes API for better functionality.`);
          this.initialized = false; // Disable further API calls
          resolve(this.getFallbackSingleTravelTime(from, to, travelMode));
        } else {
          console.warn(`⚠️ Google Maps API error (${status}) for ${fromLocation} → ${toLocation}`);
          resolve(this.getFallbackSingleTravelTime(from, to, travelMode));
        }
      });
    });
  }

  // Format location for Google Maps API
  formatLocationForAPI(location) {
    if (typeof location === 'string') {
      return location;
    }

    return location.location ||
      location.placeName ||
      location.name ||
      location.address ||
      'Unknown Location';
  }

  // Generate cache key for travel time results
  getCacheKey(from, to, travelMode) {
    const fromStr = this.formatLocationForAPI(from);
    const toStr = this.formatLocationForAPI(to);
    return `${fromStr}|${toStr}|${travelMode}`;
  }

  // Get route directions with waypoints
  async getRouteDirections(locations, travelMode = 'DRIVING') {
    try {
      await this.initialize();

      if (!this.directionsService || locations.length < 2) {
        return null;
      }

      const origin = this.formatLocationForAPI(locations[0]);
      const destination = this.formatLocationForAPI(locations[locations.length - 1]);

      let waypoints = [];
      if (locations.length > 2) {
        waypoints = locations.slice(1, -1).map(location => ({
          location: this.formatLocationForAPI(location),
          stopover: true
        }));
      }

      return new Promise((resolve) => {
        this.directionsService.route({
          origin: origin,
          destination: destination,
          waypoints: waypoints,
          travelMode: window.google.maps.TravelMode[travelMode],
          optimizeWaypoints: true, // Let Google optimize the route
          unitSystem: window.google.maps.UnitSystem.METRIC
        }, (response, status) => {
          if (status === 'OK') {
            const route = response.routes[0];

            const result = {
              status: 'success',
              totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
              totalDuration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0),
              legs: route.legs.map(leg => ({
                distance: leg.distance.text,
                duration: leg.duration.text,
                startAddress: leg.start_address,
                endAddress: leg.end_address,
                steps: leg.steps.length
              })),
              optimizedOrder: response.routes[0].waypoint_order,
              polyline: route.overview_polyline
            };

            console.log('🗺️ Route directions obtained successfully');
            resolve(result);
          } else {
            console.warn(`⚠️ Directions API error: ${status}`);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error getting route directions:', error);
      return null;
    }
  }

  // Fallback travel time estimation when API is unavailable
  getFallbackTravelTimes(locations) {
    const results = [];

    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i];
      const to = locations[i + 1];
      results.push(this.getFallbackSingleTravelTime(from, to));
    }

    return results;
  }

  // Enhanced fallback travel time estimation with Philippines-specific intelligence
  getFallbackSingleTravelTime(from, to, travelMode = 'DRIVING') {
    const fromLocation = this.formatLocationForAPI(from);
    const toLocation = this.formatLocationForAPI(to);

    console.log(`🤖 Using AI estimation for: ${fromLocation} → ${toLocation}`);

    // Enhanced Philippines-specific travel time estimation
    let estimatedMinutes = 15; // Default
    let estimatedDistance = '2-5 km';

    // Airport connections (common in Philippines travel)
    if (this.isAirport(fromLocation) || this.isAirport(toLocation)) {
      if (this.isSameCity(fromLocation, toLocation)) {
        estimatedMinutes = 25; // Airport to city center
        estimatedDistance = '8-15 km';
      } else {
        estimatedMinutes = 45; // Airport to different city area
        estimatedDistance = '15-30 km';
      }
    }
    // Inter-island travel patterns
    else if (this.isInterIslandTravel(fromLocation, toLocation)) {
      estimatedMinutes = 60; // Typical inter-island transfer time
      estimatedDistance = '20-50 km';
    }
    // Same area/complex detection
    else if (this.isSameArea(fromLocation, toLocation)) {
      estimatedMinutes = 5;
      estimatedDistance = '0.5-1 km';
    }
    // Hotel/accommodation nearby
    else if (this.isNearAccommodation(fromLocation, toLocation)) {
      estimatedMinutes = 8;
      estimatedDistance = '1-2 km';
    }
    // Major city centers (Manila, Cebu, Davao)
    else if (this.isMajorCityCenter(fromLocation, toLocation)) {
      estimatedMinutes = 20; // Account for traffic
      estimatedDistance = '3-8 km';
    }
    // Tourist areas
    else if (this.isTouristArea(fromLocation, toLocation)) {
      estimatedMinutes = 12;
      estimatedDistance = '2-4 km';
    }
    // Restaurant to nearby locations (meal areas)
    else if (this.isRestaurantArea(fromLocation, toLocation)) {
      estimatedMinutes = 8;
      estimatedDistance = '1-3 km';
    }

    // Adjust for travel mode
    if (travelMode === 'WALKING') {
      estimatedMinutes = Math.max(estimatedMinutes * 3, 8);
      estimatedDistance = this.adjustDistanceForWalking(estimatedDistance);
    } else if (travelMode === 'TRANSIT') {
      estimatedMinutes = Math.max(estimatedMinutes * 1.8, 12); // Include wait time
    }

    // Add traffic considerations for driving in major Philippine cities
    if (travelMode === 'DRIVING' && this.isHighTrafficArea(fromLocation, toLocation)) {
      estimatedMinutes = Math.ceil(estimatedMinutes * 1.5); // 50% traffic buffer
    }

    return {
      from: fromLocation,
      to: toLocation,
      duration: `${estimatedMinutes} minutes`,
      durationValue: estimatedMinutes * 60,
      distance: estimatedDistance,
      distanceValue: this.estimateDistanceInMeters(estimatedDistance),
      status: 'ai-estimated',
      travelMode: travelMode,
      confidence: this.calculateConfidence(fromLocation, toLocation)
    };
  }

  // Enhanced utility functions for Philippines-specific location analysis
  isSameArea(from, to) {
    const areaKeywords = ['mall', 'resort', 'hotel', 'complex', 'center', 'plaza', 'building', 'it park', 'ayala', 'sm'];
    return areaKeywords.some(keyword =>
      from.toLowerCase().includes(keyword) && to.toLowerCase().includes(keyword)
    );
  }

  isAirport(location) {
    const airportKeywords = ['airport', 'international airport', 'zam', 'ceb', 'mnl', 'terminal'];
    return airportKeywords.some(keyword => location.toLowerCase().includes(keyword));
  }

  isInterIslandTravel(from, to) {
    const islands = {
      'cebu': ['cebu', 'mactan', 'lapu-lapu'],
      'zamboanga': ['zamboanga', 'mindanao'],
      'manila': ['manila', 'makati', 'bgc', 'quezon'],
      'davao': ['davao'],
      'iloilo': ['iloilo'],
      'bohol': ['bohol', 'tagbilaran'],
      'palawan': ['palawan', 'puerto princesa']
    };

    const fromIsland = this.getIslandFromLocation(from, islands);
    const toIsland = this.getIslandFromLocation(to, islands);

    return fromIsland && toIsland && fromIsland !== toIsland;
  }

  getIslandFromLocation(location, islands) {
    const loc = location.toLowerCase();
    for (const [island, keywords] of Object.entries(islands)) {
      if (keywords.some(keyword => loc.includes(keyword))) {
        return island;
      }
    }
    return null;
  }

  isSameCity(from, to) {
    const cities = ['manila', 'cebu', 'davao', 'zamboanga', 'iloilo', 'baguio', 'cagayan de oro'];
    return cities.some(city =>
      from.toLowerCase().includes(city) && to.toLowerCase().includes(city)
    );
  }

  isMajorCityCenter(from, to) {
    const centerKeywords = ['makati', 'bgc', 'ortigas', 'it park', 'ayala center', 'sm city', 'downtown'];
    return centerKeywords.some(keyword =>
      from.toLowerCase().includes(keyword) || to.toLowerCase().includes(keyword)
    );
  }

  isRestaurantArea(from, to) {
    const restaurantKeywords = ['restaurant', 'halal', 'food', 'dining', 'cafe', 'lunch', 'dinner'];
    const foodAreas = ['food court', 'food park', 'restaurant row'];

    return restaurantKeywords.some(keyword =>
      from.toLowerCase().includes(keyword) || to.toLowerCase().includes(keyword)
    ) || foodAreas.some(area =>
      from.toLowerCase().includes(area) || to.toLowerCase().includes(area)
    );
  }

  isHighTrafficArea(from, to) {
    const trafficAreas = ['makati', 'manila', 'edsa', 'ortigas', 'bgc', 'quezon city', 'it park'];
    return trafficAreas.some(area =>
      from.toLowerCase().includes(area) || to.toLowerCase().includes(area)
    );
  }

  adjustDistanceForWalking(driveDistance) {
    // Walking distance is typically shorter due to shortcuts
    return driveDistance.replace(/(\d+)-?(\d*)/g, (match, start, end) => {
      const startNum = parseInt(start);
      const endNum = end ? parseInt(end) : startNum;
      const walkStart = Math.max(Math.ceil(startNum * 0.7), 1);
      const walkEnd = Math.max(Math.ceil(endNum * 0.7), walkStart);
      return end ? `${walkStart}-${walkEnd}` : `${walkStart}`;
    });
  }

  estimateDistanceInMeters(distanceStr) {
    const match = distanceStr.match(/(\d+)-?(\d*)/);
    if (match) {
      const start = parseInt(match[1]) * 1000; // km to meters
      const end = match[2] ? parseInt(match[2]) * 1000 : start;
      return Math.floor((start + end) / 2);
    }
    return 2500; // Default 2.5km in meters
  }

  calculateConfidence(from, to) {
    let confidence = 70; // Base confidence

    if (this.isSameArea(from, to)) confidence = 90;
    else if (this.isAirport(from) || this.isAirport(to)) confidence = 85;
    else if (this.isSameCity(from, to)) confidence = 80;
    else if (this.isInterIslandTravel(from, to)) confidence = 65;

    return `${confidence}%`;
  }

  isNearAccommodation(from, to) {
    const accommodationKeywords = ['hotel', 'resort', 'inn', 'lodge', 'accommodation'];
    return accommodationKeywords.some(keyword =>
      from.toLowerCase().includes(keyword) || to.toLowerCase().includes(keyword)
    );
  }

  isCityCenter(from, to) {
    const centerKeywords = ['downtown', 'center', 'central', 'plaza', 'square', 'main'];
    return centerKeywords.some(keyword =>
      from.toLowerCase().includes(keyword) || to.toLowerCase().includes(keyword)
    );
  }

  isTouristArea(from, to) {
    const touristKeywords = ['museum', 'temple', 'church', 'park', 'beach', 'monument', 'tourist'];
    return touristKeywords.some(keyword =>
      from.toLowerCase().includes(keyword) || to.toLowerCase().includes(keyword)
    );
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear cache (useful for testing or memory management)
  clearCache() {
    this.cache.clear();
    console.log('🧹 Travel time cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Batch process travel times with better error handling
  async batchGetTravelTimes(locationPairs, travelMode = 'DRIVING') {
    try {
      await this.initialize();

      const results = [];
      const batchSize = 10; // Process in batches to avoid rate limiting

      for (let i = 0; i < locationPairs.length; i += batchSize) {
        const batch = locationPairs.slice(i, i + batchSize);
        const batchPromises = batch.map(([from, to]) =>
          this.getSingleTravelTime(from, to, travelMode)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Delay between batches
        if (i + batchSize < locationPairs.length) {
          await this.delay(500);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in batch travel time processing:', error);
      return locationPairs.map(([from, to]) =>
        this.getFallbackSingleTravelTime(from, to, travelMode)
      );
    }
  }
}

// Export singleton instance
export const googleMapsTravelService = new GoogleMapsTravelService();
export default GoogleMapsTravelService;