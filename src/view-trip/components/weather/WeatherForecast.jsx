import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertCircle,
} from "lucide-react";
import {
  getWeatherForecast,
  getWeatherRecommendation,
  isForecastAvailable,
} from "@/services/weatherService";

// ✅ Import production logging
import { logDebug, logError } from "@/utils/productionLogger";

function WeatherForecast({ trip }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add component mount logging
  useEffect(() => {
    logDebug("WeatherForecast", "Component mounted", {
      hasTrip: !!trip,
      location: trip?.userSelection?.location,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchWeather = async () => {
      const location = trip?.userSelection?.location;
      const startDate = trip?.userSelection?.startDate;

      logDebug("WeatherForecast", "useEffect triggered", {
        location,
        startDate: startDate?.toString(),
      });

      if (!location || !startDate) {
        logDebug("WeatherForecast", "Missing location or startDate");
        setLoading(false);
        return;
      }

      // Check if forecast is available for this date
      const available = isForecastAvailable(startDate);
      logDebug("WeatherForecast", "Forecast availability checked", {
        available,
      });

      if (!available) {
        logDebug("WeatherForecast", "Forecast not available for this date");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        logDebug("WeatherForecast", "Fetching weather data");
        const data = await getWeatherForecast(location, startDate);

        logDebug("WeatherForecast", "Weather data received", {
          available: data.available,
          hasData: !!data,
        });

        if (data.available) {
          logDebug(
            "WeatherForecast",
            "Weather data is available, setting state"
          );
          setWeatherData(data);
        } else {
          logDebug("WeatherForecast", "Weather data not available", {
            reason: data.reason,
            message: data.message,
          });
          setError(data.message);
        }
      } catch (err) {
        logError("WeatherForecast", "Weather fetch error", {
          error: err.message,
        });
        setError("Unable to load weather data");
      } finally {
        setLoading(false);
        logDebug("WeatherForecast", "Weather fetch complete");
      }
    };

    fetchWeather();
  }, [trip?.userSelection?.location, trip?.userSelection?.startDate]);

  // Don't render anything if loading or no data
  if (loading) {
    logDebug("WeatherForecast", "Still loading");
    // Show unified minimal loading state
    return (
      <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-sky-200 dark:border-sky-800 p-6 shadow-md">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400 tracking-wide">
            Loading weather forecast...
          </p>
        </div>
      </div>
    );
  }

  // Show helpful message if forecast not available
  if (error || !weatherData || !weatherData.available) {
    logDebug("WeatherForecast", "Not available due to error or missing data", {
      hasError: !!error,
      hasData: !!weatherData,
      available: weatherData?.available,
    });

    const location = trip?.userSelection?.location;
    const startDate = trip?.userSelection?.startDate;

    // Calculate days until trip
    let daysUntilTrip = null;
    let forecastMessage = "Weather forecast not available";

    if (startDate) {
      const start = new Date(startDate);
      const now = new Date();
      daysUntilTrip = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

      if (daysUntilTrip > 14) {
        forecastMessage = `Weather forecast will be available ${
          daysUntilTrip - 14
        } days before your trip`;
      } else if (daysUntilTrip < 0) {
        forecastMessage = "Weather forecast only available for upcoming trips";
      }
    }

    return (
      <div className="bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900/30 dark:via-slate-900/30 dark:to-gray-900/30 rounded-lg border border-gray-300 dark:border-gray-700 p-6 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Cloud className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Weather Forecast
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {location || "Your destination"}
            </p>
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
                  {forecastMessage}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {daysUntilTrip > 14
                    ? `Your trip is ${daysUntilTrip} days away. Weather forecasts are available for trips within 14 days.`
                    : error
                    ? "Unable to load weather data at this time."
                    : "Weather information will appear closer to your trip date."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  logDebug("WeatherForecast", "Rendering component with forecast", {
    forecastDays: weatherData.forecast.length,
  });

  const recommendation = getWeatherRecommendation(weatherData.forecast);

  return (
    <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-sky-200 dark:border-sky-800 p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/50 rounded-lg flex items-center justify-center">
          <Cloud className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Weather Forecast
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {weatherData.location} • Next {weatherData.forecast.length} days
          </p>
        </div>
      </div>

      {/* Recommendation Banner */}
      {recommendation && (
        <div className="mb-4 p-3 bg-sky-100 dark:bg-sky-900/30 border border-sky-300 dark:border-sky-700 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-sky-800 dark:text-sky-300 font-medium">
              {recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Forecast Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {weatherData.forecast.slice(0, 5).map((day, index) => (
          <div
            key={day.date}
            className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-sky-200 dark:border-sky-800 hover:shadow-md transition-shadow"
          >
            {/* Date */}
            <div className="text-center mb-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {index === 0
                  ? "Today"
                  : new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
              </p>
            </div>

            {/* Weather Icon */}
            <div className="text-center mb-2">
              <span className="text-3xl">{day.icon}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {day.condition}
              </p>
            </div>

            {/* Temperature */}
            <div className="text-center mb-2">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {day.tempMax}°
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {day.tempMin}°
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-1.5 border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Droplets className="h-3 w-3" />
                  Humidity
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {day.humidity}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Wind className="h-3 w-3" />
                  Wind
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {day.windSpeed} km/h
                </span>
              </div>
              {day.rainChance === "Yes" && (
                <div className="flex items-center justify-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded px-2 py-1 mt-2">
                  <CloudRain className="h-3 w-3" />
                  <span>Rain likely</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Weather data from OpenWeatherMap • Updates hourly
        </p>
      </div>
    </div>
  );
}

export default WeatherForecast;
