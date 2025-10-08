// Modern Google Maps Routes API Service for TravelRover
// Uses the new Routes API instead of legacy Distance Matrix and Directions APIs

class ModernGoogleMapsService {
  constructor() {
    this.routesService = null;
    this.initialized = false;
    this.cache = new Map();
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }

  // Initialize the service
  async initialize() {
    if (!this.initialized && this.apiKey) {
      this.initialized = true;
      console.log('✅ Modern Google Maps Routes API Service initialized');
    }
  }

  // Get route information using the new Routes API
  async getRouteWithWaypoints(locations, travelMode = 'DRIVE') {
    try {
      await this.initialize();

      if (!this.apiKey || locations.length < 2) {
        return this.getFallbackRouteData(locations);
      }

      const origin = this.formatLocation(locations[0]);
      const destination = this.formatLocation(locations[locations.length - 1]);
      const waypoints = locations.length > 2
        ? locations.slice(1, -1).map(loc => ({ location: this.formatLocation(loc) }))
        : [];

      // Use the new Routes API endpoint
      const requestBody = {
        origin: { address: origin },
        destination: { address: destination },
        intermediates: waypoints,
        travelMode: travelMode,
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false
        },
        languageCode: 'en-US',
        units: 'METRIC'
      };

      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.distanceMeters,routes.legs.startLocation,routes.legs.endLocation'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.warn('Routes API error:', response.status, response.statusText);
        return this.getFallbackRouteData(locations);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        return this.processRoutesAPIResponse(data.routes[0], locations);
      }

      return this.getFallbackRouteData(locations);

    } catch (error) {
      console.error('Routes API error:', error);
      return this.getFallbackRouteData(locations);
    }
  }

  // Process the Routes API response
  processRoutesAPIResponse(route, originalLocations) {
    const legs = route.legs || [];
    const routeDetails = [];

    legs.forEach((leg, index) => {
      const duration = this.formatDuration(leg.duration);
      const distance = this.formatDistance(leg.distanceMeters);

      routeDetails.push({
        from: originalLocations[index],
        to: originalLocations[index + 1],
        duration: duration,
        distance: distance,
        durationSeconds: parseInt(leg.duration?.replace('s', '') || '0'),
        distanceMeters: leg.distanceMeters || 0
      });
    });

    const totalDuration = this.formatDuration(route.duration);
    const totalDistance = this.formatDistance(route.distanceMeters);

    return {
      success: true,
      source: 'google_routes_api',
      totalDuration: totalDuration,
      totalDistance: totalDistance,
      legs: routeDetails,
      optimizedOrder: originalLocations // Routes API can optimize, but keeping original for now
    };
  }

  // Get travel time between two specific locations
  async getTravelTime(from, to, travelMode = 'DRIVE') {
    try {
      const routeData = await this.getRouteWithWaypoints([from, to], travelMode);

      if (routeData.success && routeData.legs.length > 0) {
        const leg = routeData.legs[0];
        return {
          duration: leg.duration,
          distance: leg.distance,
          durationSeconds: leg.durationSeconds,
          distanceMeters: leg.distanceMeters,
          status: 'success'
        };
      }

      return this.getFallbackTravelTime(from, to);
    } catch (error) {
      console.error('Error getting travel time:', error);
      return this.getFallbackTravelTime(from, to);
    }
  }

  // Format location for API request
  formatLocation(location) {
    if (typeof location === 'string') {
      return location;
    }

    return location.location ||
      location.placeName ||
      location.name ||
      location.address ||
      'Unknown Location';
  }

  // Format duration from API response (e.g., "1234s" -> "20 minutes")
  formatDuration(duration) {
    if (!duration) return '15 minutes';

    const seconds = parseInt(duration.replace('s', ''));
    const minutes = Math.ceil(seconds / 60);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  // Format distance from meters
  formatDistance(meters) {
    if (!meters) return '1-2 km';

    if (meters < 1000) {
      return `${meters}m`;
    }

    const km = (meters / 1000).toFixed(1);
    return `${km}km`;
  }

  // Fallback route data when API is unavailable
  getFallbackRouteData(locations) {
    const routeDetails = [];

    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i];
      const to = locations[i + 1];
      const fallback = this.getFallbackTravelTime(from, to);

      routeDetails.push({
        from: from,
        to: to,
        duration: fallback.duration,
        distance: fallback.distance,
        durationSeconds: fallback.durationSeconds,
        distanceMeters: fallback.distanceMeters
      });
    }

    const totalMinutes = routeDetails.reduce((sum, leg) => sum + (leg.durationSeconds / 60), 0);
    const totalMeters = routeDetails.reduce((sum, leg) => sum + leg.distanceMeters, 0);

    return {
      success: true,
      source: 'fallback_estimation',
      totalDuration: this.formatDuration(`${Math.ceil(totalMinutes * 60)}s`),
      totalDistance: this.formatDistance(totalMeters),
      legs: routeDetails,
      optimizedOrder: locations
    };
  }

  // Enhanced fallback travel time estimation
  getFallbackTravelTime(from, to) {
    const fromLocation = this.formatLocation(from);
    const toLocation = this.formatLocation(to);

    // Smart estimation based on location analysis
    let estimatedMinutes = 15; // Default
    let estimatedMeters = 2000; // 2km default

    // Same building/complex (hotels, malls, resorts)
    if (this.isSameComplex(fromLocation, toLocation)) {
      estimatedMinutes = 5;
      estimatedMeters = 500;
    }
    // Nearby locations (same district/area)
    else if (this.isNearbyArea(fromLocation, toLocation)) {
      estimatedMinutes = 10;
      estimatedMeters = 1500;
    }
    // City center to city center
    else if (this.isCityCenter(fromLocation) && this.isCityCenter(toLocation)) {
      estimatedMinutes = 12;
      estimatedMeters = 3000;
    }
    // Airport to city or vice versa
    else if (this.isAirport(fromLocation) || this.isAirport(toLocation)) {
      estimatedMinutes = 30;
      estimatedMeters = 15000;
    }
    // Tourist attractions (usually clustered)
    else if (this.isTouristAttraction(fromLocation) && this.isTouristAttraction(toLocation)) {
      estimatedMinutes = 20;
      estimatedMeters = 5000;
    }

    return {
      duration: `${estimatedMinutes} minutes`,
      distance: this.formatDistance(estimatedMeters),
      durationSeconds: estimatedMinutes * 60,
      distanceMeters: estimatedMeters,
      status: 'fallback'
    };
  }

  // Location analysis helpers
  isSameComplex(from, to) {
    const complexKeywords = ['mall', 'resort', 'hotel', 'complex', 'center', 'plaza', 'building'];
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    return complexKeywords.some(keyword =>
      fromLower.includes(keyword) && toLower.includes(keyword) &&
      this.hasCommonWords(fromLower, toLower)
    );
  }

  isNearbyArea(from, to) {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    // Check for common area names or districts
    const areaKeywords = ['downtown', 'district', 'park', 'square', 'street', 'avenue', 'road'];
    return areaKeywords.some(keyword =>
      fromLower.includes(keyword) && toLower.includes(keyword)
    ) || this.hasCommonWords(fromLower, toLower, 2);
  }

  isCityCenter(location) {
    const centerKeywords = ['downtown', 'center', 'central', 'plaza', 'square', 'main', 'core'];
    return centerKeywords.some(keyword => location.toLowerCase().includes(keyword));
  }

  isAirport(location) {
    const airportKeywords = ['airport', 'terminal', 'international', 'domestic', 'flight'];
    return airportKeywords.some(keyword => location.toLowerCase().includes(keyword));
  }

  isTouristAttraction(location) {
    const attractionKeywords = ['museum', 'temple', 'church', 'cathedral', 'park', 'beach',
      'monument', 'landmark', 'tourist', 'attraction', 'heritage', 'historical'];
    return attractionKeywords.some(keyword => location.toLowerCase().includes(keyword));
  }

  hasCommonWords(str1, str2, minWords = 1) {
    const words1 = str1.split(' ').filter(word => word.length > 3);
    const words2 = str2.split(' ').filter(word => word.length > 3);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length >= minWords;
  }

  // Generate Google Maps URL for the route
  generateGoogleMapsURL(locations, travelMode = 'driving') {
    if (!locations || locations.length < 2) return null;

    const origin = encodeURIComponent(this.formatLocation(locations[0]));
    const destination = encodeURIComponent(this.formatLocation(locations[locations.length - 1]));

    let url = `https://www.google.com/maps/dir/${origin}/${destination}`;

    // Add waypoints if there are intermediate locations
    if (locations.length > 2) {
      const waypoints = locations
        .slice(1, -1)
        .map(loc => encodeURIComponent(this.formatLocation(loc)))
        .join('/');
      url = `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}`;
    }

    // Add travel mode
    url += `?travelmode=${travelMode}`;

    return url;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Routes API cache cleared');
  }
}

// Export singleton instance
export const modernGoogleMapsService = new ModernGoogleMapsService();
export default ModernGoogleMapsService;