/**
 * Weather Service for TravelRover
 * 
 * Features:
 * - Fetches weather forecast for trip dates
 * - Only shows weather for trips within 14 days
 * - Caches results to minimize API calls
 * - Graceful error handling
 * - Supports Philippine locations
 * 
 * 🔄 MIGRATION NOTE (2025-11-07):
 * - Replaced console.log with logDebug for production cleanup
 */

import { logDebug, logError } from '../utils/productionLogger';

// OpenWeatherMap API (free tier: 1000 calls/day, 5-day forecast)
const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

// Cache to store weather data (prevents excessive API calls)
const weatherCache = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Check if trip dates are within forecast availability (14 days max)
 */
export const isForecastAvailable = (startDate) => {
  if (!startDate) return false;
  
  const start = new Date(startDate);
  const now = new Date();
  const daysUntilTrip = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
  
  // Weather forecasts typically available for next 14 days
  return daysUntilTrip >= 0 && daysUntilTrip <= 14;
};

/**
 * Get cached weather data if still valid
 */
const getCachedWeather = (cacheKey) => {
  const cached = weatherCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logDebug('WeatherService', 'Using cached weather data', { cacheKey });
    return cached.data;
  }
  
  return null;
};

/**
 * Fetch coordinates for a location (geocoding)
 * Handles complex location names like "Baguio City, Benguet, Philippines"
 */
export const getLocationCoordinates = async (locationName) => {
  const originalLocation = locationName;
  const cityName = originalLocation.split(',')[0].trim();
  
  // Try multiple location formats in order
  const formats = [
    { name: 'City name only', query: `${cityName},PH` },
    { name: 'City without country', query: cityName },
    { name: 'Original location', query: `${originalLocation},PH` }
  ];
  
  for (const format of formats) {
    try {
      logDebug('WeatherService', 'Trying location format', { format: format.name, query: format.query });
      const response = await fetch(
        `${WEATHER_API_URL}/weather?q=${encodeURIComponent(format.query)}&appid=${WEATHER_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        logDebug('WeatherService', 'Location found', { format: format.name, location: data.name });
        return {
          lat: data.coord.lat,
          lon: data.coord.lon,
          name: data.name,
        };
      } else {
        logDebug('WeatherService', 'Location format failed', { format: format.name, status: response.status });
      }
    } catch (error) {
      logDebug('WeatherService', 'Location format error', { format: format.name, error: error.message });
    }
  }
  
  logError('WeatherService', 'All location formats failed', { originalLocation });
  return null;
};

/**
 * Fetch 5-day weather forecast
 */
export const getWeatherForecast = async (location, startDate) => {
  try {
    logDebug('WeatherService', 'getWeatherForecast called', { location, startDate });
    
    // Check if forecast is available for this date
    if (!isForecastAvailable(startDate)) {
      logDebug('WeatherService', 'Date too far for forecast', { startDate });
      return {
        available: false,
        reason: 'too_far',
        message: 'Weather forecast not available for dates beyond 14 days',
      };
    }

    // Check if API key is configured
    logDebug('WeatherService', 'API Key status', { configured: !!WEATHER_API_KEY });
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'your_api_key_here') {
      logDebug('WeatherService', 'OpenWeatherMap API key not configured');
      return {
        available: false,
        reason: 'no_api_key',
        message: 'Weather service not configured',
      };
    }

    // Check cache first
    const cacheKey = `${location}-${startDate}`;
    const cachedData = getCachedWeather(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Get coordinates for location
    logDebug('WeatherService', 'Fetching coordinates', { location });
    const coords = await getLocationCoordinates(location);
    
    if (!coords) {
      logDebug('WeatherService', 'Location not found', { location });
      return {
        available: false,
        reason: 'location_not_found',
        message: 'Weather data not available for this location',
      };
    }
    
    logDebug('WeatherService', 'Coordinates found', { coords });

    // Fetch 5-day forecast
    logDebug('WeatherService', 'Fetching forecast from API');
    const response = await fetch(
      `${WEATHER_API_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      logError('WeatherService', 'API response not OK', { status: response.status, statusText: response.statusText });
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();
    logDebug('WeatherService', 'Weather data received', { forecastCount: data.list.length });

    // Parse and format weather data
    const weatherData = {
      available: true,
      location: coords.name,
      forecast: parseForecastData(data, startDate),
    };
    
    logDebug('WeatherService', 'Weather forecast ready', { forecastDays: weatherData.forecast.length });

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    return weatherData;
  } catch (error) {
    logError('WeatherService', 'Error fetching weather forecast', { error: error.message });
    return {
      available: false,
      reason: 'error',
      message: 'Unable to fetch weather data',
      error: error.message,
    };
  }
};

/**
 * Parse forecast data and match to trip dates
 */
const parseForecastData = (data, startDate) => {
  const tripStart = new Date(startDate);
  tripStart.setHours(0, 0, 0, 0);

  // Group forecasts by day
  const dailyForecasts = {};

  data.list.forEach((item) => {
    const forecastDate = new Date(item.dt * 1000);
    const dateKey = forecastDate.toISOString().split('T')[0];

    if (!dailyForecasts[dateKey]) {
      dailyForecasts[dateKey] = {
        date: dateKey,
        temps: [],
        conditions: [],
        humidity: [],
        windSpeed: [],
        rain: 0,
      };
    }

    dailyForecasts[dateKey].temps.push(item.main.temp);
    dailyForecasts[dateKey].conditions.push(item.weather[0].main);
    dailyForecasts[dateKey].humidity.push(item.main.humidity);
    dailyForecasts[dateKey].windSpeed.push(item.wind.speed);
    
    if (item.rain && item.rain['3h']) {
      dailyForecasts[dateKey].rain += item.rain['3h'];
    }
  });

  // Calculate daily averages and format
  const formattedForecast = Object.values(dailyForecasts).map((day) => ({
    date: day.date,
    tempMin: Math.round(Math.min(...day.temps)),
    tempMax: Math.round(Math.max(...day.temps)),
    tempAvg: Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length),
    condition: getMostCommonCondition(day.conditions),
    humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
    windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length),
    rainChance: day.rain > 0 ? 'Yes' : 'No',
    icon: getWeatherIcon(getMostCommonCondition(day.conditions)),
  }));

  return formattedForecast;
};

/**
 * Get most common weather condition
 */
const getMostCommonCondition = (conditions) => {
  const counts = {};
  conditions.forEach((c) => {
    counts[c] = (counts[c] || 0) + 1;
  });
  
  return Object.keys(counts).reduce((a, b) => 
    counts[a] > counts[b] ? a : b
  );
};

/**
 * Get weather icon/emoji
 */
const getWeatherIcon = (condition) => {
  const icons = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
  };
  
  return icons[condition] || '🌤️';
};

/**
 * Get weather recommendation message with packing suggestions
 */
export const getWeatherRecommendation = (forecast) => {
  if (!forecast || forecast.length === 0) return null;

  const avgTemp = forecast.reduce((sum, day) => sum + day.tempAvg, 0) / forecast.length;
  const rainyDays = forecast.filter((day) => day.rainChance === 'Yes').length;
  const totalDays = forecast.length;

  const recommendations = {
    summary: '',
    packingList: [],
    tips: []
  };

  // Temperature-based recommendations
  if (avgTemp > 32) {
    recommendations.summary = '🌡️ Hot & Humid Weather';
    recommendations.packingList = [
      '☀️ Sunscreen (SPF 50+)',
      '🧢 Hat or cap',
      '👕 Light, breathable clothing',
      '💧 Reusable water bottle',
      '😎 Sunglasses'
    ];
    recommendations.tips = [
      'Stay hydrated - drink water regularly',
      'Avoid outdoor activities during midday (11 AM - 3 PM)',
      'Seek shade when possible'
    ];
  } else if (avgTemp > 28) {
    recommendations.summary = '☀️ Warm & Pleasant';
    recommendations.packingList = [
      '👕 Light clothing',
      '☀️ Sunscreen',
      '� Sun protection',
      '👟 Comfortable walking shoes'
    ];
    recommendations.tips = [
      'Perfect weather for outdoor activities',
      'Stay hydrated'
    ];
  } else if (avgTemp > 24) {
    recommendations.summary = '🌤️ Comfortable Temperature';
    recommendations.packingList = [
      '👕 Casual clothing',
      '👟 Walking shoes',
      '🧥 Light jacket for evening'
    ];
    recommendations.tips = [
      'Great weather for sightseeing',
      'Evenings might be cooler'
    ];
  } else if (avgTemp > 20) {
    recommendations.summary = '🧥 Cool & Pleasant';
    recommendations.packingList = [
      '🧥 Light jacket or sweater',
      '👖 Long pants',
      '👟 Closed shoes',
      '🧣 Light scarf (optional)'
    ];
    recommendations.tips = [
      'Layer your clothing',
      'Perfect for outdoor exploration'
    ];
  } else {
    recommendations.summary = '🥶 Cool to Cold';
    recommendations.packingList = [
      '🧥 Jacket or hoodie',
      '🧣 Scarf',
      '👖 Long pants',
      '👟 Comfortable shoes',
      '🧤 Light gloves (optional)'
    ];
    recommendations.tips = [
      'Dress in layers',
      'Warm up with hot drinks'
    ];
  }

  // Rain-based additions
  if (rainyDays > totalDays / 2) {
    recommendations.summary += ' with Frequent Rain';
    recommendations.packingList.unshift('☔ Umbrella (essential)', '🧥 Waterproof jacket', '👟 Waterproof shoes');
    recommendations.tips.unshift('Rain expected most days - plan indoor activities');
  } else if (rainyDays > 0) {
    recommendations.summary += ' with Occasional Rain';
    recommendations.packingList.push('☔ Compact umbrella', '🧥 Light rain jacket');
    recommendations.tips.push('Brief showers possible - carry an umbrella');
  }

  return recommendations;
};

/**
 * Convert Celsius to Fahrenheit (for international travelers)
 */
export const celsiusToFahrenheit = (celsius) => {
  return Math.round((celsius * 9/5) + 32);
};

/**
 * Get simple weather description for users
 */
export const getSimpleWeatherDescription = (condition) => {
  const descriptions = {
    Clear: 'Sunny skies',
    Clouds: 'Cloudy',
    Rain: 'Rainy',
    Drizzle: 'Light rain',
    Thunderstorm: 'Thunderstorms',
    Snow: 'Snowy',
    Mist: 'Misty',
    Fog: 'Foggy',
    Haze: 'Hazy'
  };
  
  return descriptions[condition] || condition;
};
