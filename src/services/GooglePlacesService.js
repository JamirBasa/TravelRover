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
   * Get real coordinates for a place name using Geocoding API (via Django proxy)
   */
  async getPlaceCoordinates(placeName, location = '') {
    const cacheKey = `geocode_${placeName}_${location}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const query = location ? `${placeName}, ${location}` : placeName;
      
      // ✅ Use Django proxy for geocoding (secure, no API key exposure)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const url = `${apiBaseUrl}/langgraph/geocoding/`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: query,
          components: 'country:PH' // Restrict to Philippines for accuracy
        })
      });

      const result = await response.json();

      if (result.success && result.data?.status === 'OK' && result.data.results?.length > 0) {
        const geocodeResult = result.data.results[0];
        const coordinates = {
          lat: geocodeResult.geometry.location.lat,
          lng: geocodeResult.geometry.location.lng,
          formatted_address: geocodeResult.formatted_address,
          place_id: geocodeResult.place_id,
          source: 'google_geocoding_proxy'
        };

        this.cache.set(cacheKey, coordinates);
        console.log(`📍 Real coordinates for ${placeName}:`, coordinates);
        return coordinates;
      }

      console.warn(`⚠️ No geocoding results for: ${placeName}`);
      return this.getFallbackCoordinates(placeName, location);

    } catch (error) {
      console.error('❌ Geocoding proxy error:', error);
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

    // Check cache first
    const cacheKey = `search_${query}_${location}`;
    if (this.cache.has(cacheKey)) {
      console.log(`💾 Cache hit for search: ${query}`);
      return this.cache.get(cacheKey);
    }

    try {
      const searchQuery = location ? `${query} in ${location}` : query;
      
      // ✅ Use backend proxy instead of direct API call
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const backendUrl = `${apiBaseUrl}/langgraph/places-search/`;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textQuery: searchQuery,
        }),
      });
      
      const data = await response.json();

      if (data.success && data.data?.places?.length > 0) {
        const results = data.data.places.map(place => ({
          place_id: place.id,
          name: place.displayName?.text || place.displayName,
          rating: place.rating,
          formatted_address: place.formattedAddress,
          coordinates: {
            lat: place.location?.latitude,
            lng: place.location?.longitude
          },
          price_level: place.priceLevel,
          types: place.types,
          photos: place.photos,
          source: 'google_places_backend_proxy'
        }));

        // Cache the results
        this.cache.set(cacheKey, results);
        console.log(`✅ Cached search results for: ${query}`);
        return results;
      }

      // Cache empty results to avoid repeated failed searches
      this.cache.set(cacheKey, []);
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

    // Check cache first
    const cacheKey = `nearby_${coordinates.lat}_${coordinates.lng}_${radius}_${type}`;
    if (this.cache.has(cacheKey)) {
      console.log(`💾 Cache hit for nearby places at: ${coordinates.lat}, ${coordinates.lng}`);
      return this.cache.get(cacheKey);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${radius}&type=${type}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const results = data.results.map(place => ({
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

        // Cache the results
        this.cache.set(cacheKey, results);
        console.log(`✅ Cached nearby places for: ${coordinates.lat}, ${coordinates.lng}`);
        return results;
      }

      // Cache empty results
      this.cache.set(cacheKey, []);
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