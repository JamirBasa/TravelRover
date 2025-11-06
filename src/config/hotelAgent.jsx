import { HOTEL_CONFIG } from "../constants/options";
// Note: API_CONFIG moved to centralized apiConfig.js but not used in this file

export class HotelAgent {
  static async searchHotels(params) {
    console.log("🏨 Searching hotels with params:", params);

    try {
      // First try to get location coordinates
      const coordinates = await this.getLocationCoordinates(params.destination);

      if (!coordinates) {
        throw new Error("Could not get location coordinates");
      }

      // Search for hotels using Google Places API
      const hotels = await this.searchNearbyHotels(coordinates, params);

      return {
        success: true,
        hotels: hotels,
        location: params.destination,
        checkin: params.checkin_date,
        checkout: params.checkout_date,
        guests: params.guests,
      };
    } catch (error) {
      console.error("❌ Hotel search failed:", error);

      // Fallback to mock hotel data
      return this.generateMockHotels(params);
    }
  }

  static async getLocationCoordinates(destination) {
    try {
      // ✅ Use Django backend proxy for geocoding
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const geocodeUrl = `${apiBaseUrl}/langgraph/geocoding/`;
      
      const response = await fetch(geocodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: destination,
          components: 'country:PH'
        })
      });

      const result = await response.json();

      if (result.success && result.data?.results && result.data.results.length > 0) {
        const location = result.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error("❌ Geocoding proxy failed:", error);
      return null;
    }
  }

  static async searchNearbyHotels(coordinates, params) {
    try {
      // Use Google Places Nearby Search
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=${HOTEL_CONFIG.SEARCH_RADIUS}&type=lodging&key=${HOTEL_CONFIG.GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();

      if (data.results) {
        return data.results.slice(0, HOTEL_CONFIG.MAX_RESULTS).map((hotel) => ({
          id: hotel.place_id,
          name: hotel.name,
          rating: hotel.rating || 4.0,
          price_level: hotel.price_level || 2,
          price_range: HOTEL_CONFIG.PRICE_LEVELS[hotel.price_level || 2],
          address: hotel.vicinity,
          photo:
            hotel.photos && hotel.photos[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${hotel.photos[0].photo_reference}&key=${HOTEL_CONFIG.GOOGLE_PLACES_API_KEY}`
              : null,
          amenities: this.generateAmenities(hotel.price_level),
          distance: this.calculateDistance(coordinates, {
            lat: hotel.geometry.location.lat,
            lng: hotel.geometry.location.lng,
          }),
          is_recommended: hotel.rating >= 4.0 && hotel.price_level <= 3,
        }));
      }

      return [];
    } catch (error) {
      console.error("❌ Hotel search API failed:", error);
      return [];
    }
  }

  static generateMockHotels(params) {
    const mockHotels = [
      {
        id: "hotel_1",
        name: "Paradise Beach Resort",
        rating: 4.5,
        price_level: 3,
        price_range: "Luxury (₱20,000-40,000)",
        address: `${params.destination} Beach Area`,
        photo:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
        amenities: ["Free WiFi", "Pool", "Beach Access", "Restaurant"],
        distance: "2.1 km from center",
        is_recommended: true,
      },
      {
        id: "hotel_2",
        name: "City Center Hotel",
        rating: 4.2,
        price_level: 2,
        price_range: "Moderate (₱8,000-20,000)",
        address: `${params.destination} City Center`,
        photo:
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
        amenities: ["Free WiFi", "Restaurant", "Gym", "Business Center"],
        distance: "0.5 km from center",
        is_recommended: true,
      },
      {
        id: "hotel_3",
        name: "Budget Inn",
        rating: 3.8,
        price_level: 1,
        price_range: "Budget (₱2,000-8,000)",
        address: `${params.destination} Downtown`,
        photo:
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
        amenities: ["Free WiFi", "Air Conditioning", "24h Reception"],
        distance: "1.2 km from center",
        is_recommended: false,
      },
    ];

    return {
      success: true,
      hotels: mockHotels,
      location: params.destination,
      fallback: true,
      message: "Using mock hotel data - API unavailable",
    };
  }

  static generateAmenities(priceLevel) {
    const baseAmenities = ["Free WiFi", "Air Conditioning"];
    const levelAmenities = {
      1: ["24h Reception"],
      2: ["Restaurant", "Room Service"],
      3: ["Pool", "Gym", "Spa", "Restaurant"],
      4: ["Pool", "Gym", "Spa", "Restaurant", "Concierge", "Beach Access"],
    };

    return [...baseAmenities, ...(levelAmenities[priceLevel] || [])];
  }

  static calculateDistance(coord1, coord2) {
    // Simple distance calculation (you can make this more accurate)
    const distance =
      Math.sqrt(
        Math.pow(coord1.lat - coord2.lat, 2) +
          Math.pow(coord1.lng - coord2.lng, 2)
      ) * 111; // Rough km conversion

    return `${distance.toFixed(1)} km from center`;
  }

  static buildHotelSearchParams(destination, tripData) {
    console.log("🔧 Building hotel search params:", { destination, tripData });

    // Calculate check-in/check-out dates
    const today = new Date();
    const checkinDate = new Date(today);
    checkinDate.setDate(today.getDate() + HOTEL_CONFIG.DEFAULT_CHECKIN_DAYS);

    const checkoutDate = new Date(checkinDate);
    const duration = parseInt(tripData.duration) || 3;
    checkoutDate.setDate(checkinDate.getDate() + duration);

    // Extract number of guests
    const guestMapping = {
      "Just Me": 1,
      "A Couple": 2,
      Family: 4,
      Friends: 3,
    };
    const guests = guestMapping[tripData.travelers] || 1;

    const params = {
      destination: destination,
      checkin_date: checkinDate.toISOString().split("T")[0],
      checkout_date: checkoutDate.toISOString().split("T")[0],
      guests: guests,
      duration: duration,
    };

    console.log("🏨 Generated hotel search params:", params);
    return params;
  }
}

export default HotelAgent;
