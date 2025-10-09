/**
 * Enhanced Google Places API Service for TravelRover
 * Provides real coordinates, place details, and photos
 */

class GooglePlacesService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    this.cache = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (!this.apiKey) {
      console.warn('⚠️ Google Places API key not found in environment variables');
      return false;
    }
    
    this.initialized = true;
    console.log('✅ Google Places API Service initialized');
    return true;
  }

  /**
   * Get real coordinates for a place name using Geocoding API
   */
  async getPlaceCoordinates(placeName, location = '') {
    if (!await this.initialize()) {
      return this.getFallbackCoordinates(placeName, location);
    }

    const cacheKey = `geocode_${placeName}_${location}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const query = location ? `${placeName}, ${location}` : placeName;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const result = data.results[0];
        const coordinates = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          source: 'google_geocoding'
        };

        this.cache.set(cacheKey, coordinates);
        console.log(`📍 Real coordinates for ${placeName}:`, coordinates);
        return coordinates;
      }

      console.warn(`⚠️ No geocoding results for: ${placeName}`);
      return this.getFallbackCoordinates(placeName, location);

    } catch (error) {
      console.error('❌ Geocoding API error:', error);
      return this.getFallbackCoordinates(placeName, location);
    }
  }

  /**
   * Get detailed place information using Places API
   */
  async getPlaceDetails(placeId) {
    if (!await this.initialize()) {
      return null;
    }

    const cacheKey = `details_${placeId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const fields = 'name,rating,formatted_address,geometry,photos,price_level,types,opening_hours,formatted_phone_number,website';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        this.cache.set(cacheKey, data.result);
        return data.result;
      }

      return null;
    } catch (error) {
      console.error('❌ Places Details API error:', error);
      return null;
    }
  }

  /**
   * Search for places using Places API Text Search
   */
  async searchPlaces(query, location = '') {
    if (!await this.initialize()) {
      return [];
    }

    try {
      const searchQuery = location ? `${query} in ${location}` : query;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        return data.results.map(place => ({
          place_id: place.place_id,
          name: place.name,
          rating: place.rating,
          formatted_address: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          price_level: place.price_level,
          types: place.types,
          photos: place.photos,
          source: 'google_places_search'
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ Places Search API error:', error);
      return [];
    }
  }

  /**
   * Get nearby places around coordinates
   */
  async getNearbyPlaces(coordinates, radius = 5000, type = 'tourist_attraction') {
    if (!await this.initialize()) {
      return [];
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${radius}&type=${type}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        return data.results.map(place => ({
          place_id: place.place_id,
          name: place.name,
          rating: place.rating || 4.0,
          vicinity: place.vicinity,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          price_level: place.price_level,
          types: place.types,
          photos: place.photos,
          source: 'google_nearby_search'
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ Nearby Places API error:', error);
      return [];
    }
  }

  /**
   * Get photo URL from Google Places
   */
  getPhotoUrl(photoReference, maxWidth = 400) {
    if (!this.apiKey || !photoReference) {
      return null;
    }

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Enhanced coordinate validation with real geocoding
   */
  async validateAndEnhanceCoordinates(activity, tripLocation) {
    let coordinates = null;

    // Try to extract existing coordinates
    if (activity.geoCoordinates) {
      coordinates = activity.geoCoordinates;
    }

    // If no coordinates or they look fake, get real ones
    if (!coordinates || this.areCoordinatesFake(coordinates)) {
      const placeName = activity.placeName || activity.location || activity.name;
      if (placeName) {
        console.log(`🔍 Getting real coordinates for: ${placeName}`);
        const realCoords = await this.getPlaceCoordinates(placeName, tripLocation);
        if (realCoords && realCoords.lat && realCoords.lng) {
          coordinates = {
            latitude: realCoords.lat,
            longitude: realCoords.lng,
            lat: realCoords.lat,
            lng: realCoords.lng,
            source: realCoords.source,
            place_id: realCoords.place_id
          };
        }
      }
    }

    return coordinates;
  }

  /**
   * Detect if coordinates are fake/dummy
   */
  areCoordinatesFake(coords) {
    if (!coords || !coords.latitude || !coords.longitude) {
      return true;
    }

    const lat = parseFloat(coords.latitude);
    const lng = parseFloat(coords.longitude);

    // Check if coordinates are the default Philippines coordinates used as fallback
    const defaultLat = 10.3157;
    const defaultLng = 123.8854;
    
    // If coordinates are very close to default (within 0.5 degrees), consider them fake
    return Math.abs(lat - defaultLat) < 0.5 && Math.abs(lng - defaultLng) < 0.5;
  }

  /**
   * Smart fallback coordinates based on location analysis
   */
  getFallbackCoordinates(placeName, location) {
    // Location-specific fallbacks for major destinations
    const locationCoordinates = {
      'cebu': { lat: 10.3157, lng: 123.8854 },
      'manila': { lat: 14.5995, lng: 120.9842 },
      'boracay': { lat: 11.9674, lng: 121.9248 },
      'palawan': { lat: 9.0820, lng: 118.0820 },
      'baguio': { lat: 16.4023, lng: 120.5960 },
      'davao': { lat: 7.1907, lng: 125.4553 }
    };

    const locationKey = location.toLowerCase();
    let baseCoords = locationCoordinates[locationKey] || locationCoordinates['cebu'];

    // Add small random offset for different places in same city
    const offset = 0.01; // ~1km variation
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * offset,
      lng: baseCoords.lng + (Math.random() - 0.5) * offset,
      source: 'smart_fallback',
      estimated: true
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Google Places API cache cleared');
  }
}

// Export singleton instance
export const googlePlacesService = new GooglePlacesService();
export default GooglePlacesService;