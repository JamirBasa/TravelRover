/**
 * Travel Time Validator Service
 * Validates and corrects AI-generated travel times using coordinate-based distance calculations
 * Uses Haversine formula for accurate distance without requiring Google Maps API calls
 */

class TravelTimeValidator {
  constructor() {
    // Philippines-specific travel speeds (km/h)
    this.TRAVEL_SPEEDS = {
      // Urban areas (heavy traffic)
      URBAN_DRIVING: 20, // Manila, Cebu, Davao during normal hours
      URBAN_PEAK: 12, // Rush hour traffic (7-9 AM, 5-7 PM)
      URBAN_WALKING: 4,
      URBAN_JEEPNEY: 18, // Stops frequently
      URBAN_TAXI: 22,
      
      // Suburban/Provincial
      SUBURBAN_DRIVING: 40,
      SUBURBAN_WALKING: 5,
      
      // Highway/Inter-city
      HIGHWAY_DRIVING: 60,
      PROVINCIAL_BUS: 50,
      
      // Tourist areas
      TOURIST_WALKING: 4.5, // Leisurely pace
      TOURIST_DRIVING: 25,
    };

    // Major Philippine cities with heavy traffic
    this.MAJOR_CITIES = [
      'manila', 'makati', 'bgc', 'bonifacio global city', 'taguig',
      'quezon city', 'pasig', 'mandaluyong', 'cebu', 'cebu city',
      'davao', 'davao city'
    ];

    // Tourist areas with slower traffic
    this.TOURIST_AREAS = [
      'intramuros', 'baguio', 'boracay', 'el nido', 'coron',
      'vigan', 'sagada', 'bohol', 'palawan'
    ];

    // Road circuity factor (actual road distance vs straight line)
    this.CIRCUITY_FACTORS = {
      URBAN_GRID: 1.3, // Well-planned cities (BGC, Makati)
      URBAN_ORGANIC: 1.5, // Old cities (Manila, Cebu old districts)
      SUBURBAN: 1.4,
      RURAL: 1.6,
      MOUNTAINOUS: 1.8, // Baguio, Sagada
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Object} coord1 - {latitude, longitude}
   * @param {Object} coord2 - {latitude, longitude}
   * @returns {number} Distance in kilometers
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers

    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);
    const deltaLat = this.toRadians(coord2.latitude - coord1.latitude);
    const deltaLng = this.toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Determine circuity factor based on location type
   */
  getCircuityFactor(location1, location2) {
    const loc1Lower = location1.toLowerCase();
    const loc2Lower = location2.toLowerCase();

    // Mountainous areas
    if (loc1Lower.includes('baguio') || loc1Lower.includes('sagada') ||
        loc2Lower.includes('baguio') || loc2Lower.includes('sagada')) {
      return this.CIRCUITY_FACTORS.MOUNTAINOUS;
    }

    // Modern planned cities
    if ((loc1Lower.includes('bgc') || loc1Lower.includes('bonifacio') ||
         loc1Lower.includes('makati') || loc1Lower.includes('it park')) &&
        (loc2Lower.includes('bgc') || loc2Lower.includes('bonifacio') ||
         loc2Lower.includes('makati') || loc2Lower.includes('it park'))) {
      return this.CIRCUITY_FACTORS.URBAN_GRID;
    }

    // Old urban areas
    if (this.isMajorCity(location1) || this.isMajorCity(location2)) {
      return this.CIRCUITY_FACTORS.URBAN_ORGANIC;
    }

    // Default suburban
    return this.CIRCUITY_FACTORS.SUBURBAN;
  }

  /**
   * Determine if location is in a major city
   */
  isMajorCity(location) {
    const locLower = location.toLowerCase();
    return this.MAJOR_CITIES.some(city => locLower.includes(city));
  }

  /**
   * Determine if location is in a tourist area
   */
  isTouristArea(location) {
    const locLower = location.toLowerCase();
    return this.TOURIST_AREAS.some(area => locLower.includes(area));
  }

  /**
   * Determine travel speed based on location and transport mode
   */
  getTravelSpeed(location1, location2, transportMode, timeOfDay = '12:00 PM') {
    const isPeakHour = this.isPeakHour(timeOfDay);
    const mode = transportMode.toLowerCase();

    // Walking speed
    if (mode.includes('walk')) {
      if (this.isTouristArea(location1) || this.isTouristArea(location2)) {
        return this.TRAVEL_SPEEDS.TOURIST_WALKING;
      }
      return this.TRAVEL_SPEEDS.URBAN_WALKING;
    }

    // Driving/motorized transport
    if (this.isMajorCity(location1) || this.isMajorCity(location2)) {
      // Urban area
      if (isPeakHour) {
        return this.TRAVEL_SPEEDS.URBAN_PEAK;
      }
      
      if (mode.includes('jeepney')) {
        return this.TRAVEL_SPEEDS.URBAN_JEEPNEY;
      } else if (mode.includes('taxi') || mode.includes('grab')) {
        return this.TRAVEL_SPEEDS.URBAN_TAXI;
      }
      return this.TRAVEL_SPEEDS.URBAN_DRIVING;
    }

    if (this.isTouristArea(location1) || this.isTouristArea(location2)) {
      return this.TRAVEL_SPEEDS.TOURIST_DRIVING;
    }

    // Suburban/Provincial
    return this.TRAVEL_SPEEDS.SUBURBAN_DRIVING;
  }

  /**
   * Check if time is during peak hours
   */
  isPeakHour(timeString) {
    const hour = parseInt(timeString.split(':')[0]);
    const isPM = timeString.toLowerCase().includes('pm');
    const hour24 = isPM && hour !== 12 ? hour + 12 : hour;

    // Peak hours: 7-9 AM, 5-7 PM
    return (hour24 >= 7 && hour24 <= 9) || (hour24 >= 17 && hour24 <= 19);
  }

  /**
   * Calculate realistic travel time between two locations
   * @param {Object} from - {placeName, geoCoordinates: {latitude, longitude}}
   * @param {Object} to - {placeName, geoCoordinates: {latitude, longitude}, time}
   * @param {string} transportMode - Transport mode (default: 'driving')
   * @returns {Object} {minutes, distance, speed, confidence}
   */
  calculateTravelTime(from, to, transportMode = 'taxi') {
    // Validate coordinates
    if (!from.geoCoordinates || !to.geoCoordinates) {
      return null;
    }

    const { latitude: lat1, longitude: lng1 } = from.geoCoordinates;
    const { latitude: lat2, longitude: lng2 } = to.geoCoordinates;

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return null;
    }

    // Calculate straight-line distance
    const straightDistance = this.calculateDistance(
      { latitude: lat1, longitude: lng1 },
      { latitude: lat2, longitude: lng2 }
    );

    // Apply circuity factor for actual road distance
    const circuity = this.getCircuityFactor(from.placeName, to.placeName);
    const roadDistance = straightDistance * circuity;

    // Get appropriate speed
    const speed = this.getTravelSpeed(
      from.placeName,
      to.placeName,
      transportMode,
      to.time || '12:00 PM'
    );

    // Calculate time in minutes
    const timeHours = roadDistance / speed;
    let timeMinutes = Math.round(timeHours * 60);

    // Round to nearest 5 minutes for realism
    timeMinutes = Math.round(timeMinutes / 5) * 5;

    // Minimum 5 minutes for any travel
    timeMinutes = Math.max(timeMinutes, 5);

    // Confidence level based on distance
    let confidence = 'high';
    if (roadDistance < 0.5) {
      confidence = 'very-high'; // Very short distance, highly predictable
    } else if (roadDistance > 20) {
      confidence = 'medium'; // Long distance, more variables
    }

    return {
      minutes: timeMinutes,
      distance: roadDistance.toFixed(2),
      straightLineDistance: straightDistance.toFixed(2),
      speed: speed,
      transportMode: transportMode,
      confidence: confidence,
      isPeakHour: this.isPeakHour(to.time || '12:00 PM'),
    };
  }

  /**
   * Validate AI-generated travel time against calculated time
   * @param {string} aiTimeTravel - AI-generated timeTravel string
   * @param {Object} calculatedTime - Output from calculateTravelTime
   * @returns {Object} {isAccurate, aiMinutes, calculatedMinutes, difference, suggestion}
   */
  validateTravelTime(aiTimeTravel, calculatedTime) {
    if (!calculatedTime) {
      return {
        isAccurate: null,
        message: 'Unable to validate - missing coordinates'
      };
    }

    // Parse AI time
    const aiMatch = aiTimeTravel.match(/(\d+)\s*(minute|min|hour|hr)/i);
    if (!aiMatch) {
      return {
        isAccurate: false,
        message: 'AI time format invalid',
        suggestion: `${calculatedTime.minutes} minutes by ${calculatedTime.transportMode}`
      };
    }

    let aiMinutes = parseInt(aiMatch[1]);
    const unit = aiMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      aiMinutes *= 60;
    }

    const difference = Math.abs(aiMinutes - calculatedTime.minutes);
    const percentDiff = (difference / calculatedTime.minutes) * 100;

    // Consider accurate if within 30% or 10 minutes (whichever is larger)
    const threshold = Math.max(calculatedTime.minutes * 0.3, 10);
    const isAccurate = difference <= threshold;

    return {
      isAccurate,
      aiMinutes,
      calculatedMinutes: calculatedTime.minutes,
      difference,
      percentDiff: percentDiff.toFixed(1),
      suggestion: isAccurate ? null : 
        `${calculatedTime.minutes} minutes by ${calculatedTime.transportMode} (₱${this.estimateCost(calculatedTime)})`,
      details: calculatedTime
    };
  }

  /**
   * Estimate transport cost based on distance and mode
   */
  estimateCost(travelTime) {
    const distance = parseFloat(travelTime.distance);
    const mode = travelTime.transportMode.toLowerCase();

    if (mode.includes('walk')) {
      return 0;
    } else if (mode.includes('jeepney')) {
      return Math.max(15, Math.ceil(distance / 4) * 15); // ₱15 base, +₱15 per 4km
    } else if (mode.includes('taxi') || mode.includes('grab')) {
      return Math.round(40 + (distance * 13.5)); // ₱40 flag down + ₱13.5/km
    } else if (mode.includes('tricycle')) {
      return Math.min(50, 20 + distance * 10); // ₱20-50 range
    }

    return 50; // Default estimate
  }

  /**
   * Validate entire itinerary and generate correction report
   * @param {Array} itinerary - Array of day objects with plan array
   * @returns {Object} Validation report with corrections
   */
  validateItinerary(itinerary) {
    const report = {
      totalChecks: 0,
      accurate: 0,
      inaccurate: 0,
      corrections: [],
      summary: null
    };

    itinerary.forEach((day, dayIndex) => {
      const activities = day.plan || [];

      for (let i = 0; i < activities.length - 1; i++) {
        const from = activities[i];
        const to = activities[i + 1];

        if (!to.timeTravel) continue;

        report.totalChecks++;

        // Extract transport mode from timeTravel
        const modeMatch = to.timeTravel.match(/by\s+(\w+)/i);
        const transportMode = modeMatch ? modeMatch[1] : 'taxi';

        const calculatedTime = this.calculateTravelTime(from, to, transportMode);
        
        if (calculatedTime) {
          const validation = this.validateTravelTime(to.timeTravel, calculatedTime);

          if (validation.isAccurate === false) {
            report.inaccurate++;
            report.corrections.push({
              day: dayIndex + 1,
              from: from.placeName,
              to: to.placeName,
              aiTime: to.timeTravel,
              suggested: validation.suggestion,
              difference: `${validation.difference} min (${validation.percentDiff}% off)`,
              details: validation.details
            });
          } else if (validation.isAccurate === true) {
            report.accurate++;
          }
        }
      }
    });

    report.summary = `${report.accurate}/${report.totalChecks} travel times are accurate. ${report.inaccurate} need correction.`;

    return report;
  }
}

export const travelTimeValidator = new TravelTimeValidator();
export default TravelTimeValidator;
