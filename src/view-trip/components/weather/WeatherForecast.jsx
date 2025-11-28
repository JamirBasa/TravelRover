import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  AlertCircle,
  Package,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getWeatherForecast,
  getWeatherRecommendation,
  isForecastAvailable,
  celsiusToFahrenheit,
  getSimpleWeatherDescription,
} from "@/services/weatherService";

// ✅ Import production logging
import { logDebug, logError } from "@/utils/productionLogger";

function WeatherForecast({ trip }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFahrenheit, setShowFahrenheit] = useState(false);
  const [showPackingTips, setShowPackingTips] = useState(false);

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
          <div
            className="w-5 h-5 border-2 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full"
            style={{ animation: "spin 1s linear infinite" }}
          />
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
    let forecastTitle = "Weather Forecast Coming Soon";
    let forecastMessage = "";
    let forecastDetail = "";

    if (startDate) {
      const start = new Date(startDate);
      const now = new Date();
      daysUntilTrip = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

      if (daysUntilTrip > 14) {
        const daysRemaining = daysUntilTrip - 14;
        forecastTitle = "Weather Info Available Soon";
        forecastMessage = `Check back in ${daysRemaining} day${
          daysRemaining > 1 ? "s" : ""
        }`;
        forecastDetail = `Weather forecasts become available 14 days before your trip. Your trip starts ${daysUntilTrip} days from now.`;
      } else if (daysUntilTrip < 0) {
        forecastTitle = "Trip Already Started";
        forecastMessage = "Weather forecast only available for upcoming trips";
        forecastDetail = "We hope you're having a great time on your trip!";
      } else {
        forecastTitle = "Weather Data Unavailable";
        forecastMessage = "Unable to load weather information";
        forecastDetail =
          error || "Please try refreshing the page or check back later.";
      }
    }

    return (
      <div className="bg-gradient-to-br from-blue-50/50 via-slate-50 to-gray-50 dark:from-gray-900/30 dark:via-slate-900/30 dark:to-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/50 dark:to-sky-900/50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Cloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {forecastTitle}
            </h3>
            <p className="text-base text-gray-700 dark:text-gray-300 mb-1 font-medium">
              {location || "Your destination"}
            </p>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold mb-2">
                    {forecastMessage}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    {forecastDetail}
                  </p>
                </div>
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

  // Calculate trip date range
  const tripStartDate = trip?.userSelection?.startDate;
  const tripDuration = trip?.userSelection?.duration || 5;
  
  // Calculate trip end date
  const tripStart = new Date(tripStartDate);
  const tripEnd = new Date(tripStart);
  tripEnd.setDate(tripEnd.getDate() + (tripDuration - 1)); // -1 because start day counts
  
  // Filter forecast to only show days within the trip date range
  const tripForecast = weatherData.forecast.filter(day => {
    const forecastDate = new Date(day.date);
    return forecastDate >= tripStart && forecastDate <= tripEnd;
  });
  
  logDebug("WeatherForecast", "Filtered forecast for trip dates", {
    totalForecast: weatherData.forecast.length,
    tripForecast: tripForecast.length,
    tripDuration,
  });

  const recommendation = getWeatherRecommendation(tripForecast);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm space-y-8">
      {/* Header - Clean & Minimal */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Weather Forecast
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{weatherData.location}</span>
            <span>•</span>
            <span>
              {tripStartDate
                ? new Date(tripStartDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "Your dates"}
            </span>
          </div>
          {recommendation && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              {recommendation.summary}
            </p>
          )}
        </div>

        {/* Temperature Unit Toggle */}
        <button
          onClick={() => setShowFahrenheit(!showFahrenheit)}
          className="px-3 py-2 text-sm font-medium bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Toggle temperature unit"
        >
          {showFahrenheit ? "°F" : "°C"}
        </button>
      </div>

      {/* Daily Forecast Cards - Hero Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tripForecast.map((day, index) => {
          const temp = showFahrenheit
            ? celsiusToFahrenheit(day.tempMax)
            : day.tempMax;
          const tempLow = showFahrenheit
            ? celsiusToFahrenheit(day.tempMin)
            : day.tempMin;

          return (
            <div
              key={day.date}
              className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-sky-100 dark:border-slate-700 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer"
            >
              {/* Date Header */}
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {index === 0
                      ? "Today"
                      : new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-5xl">{day.icon}</div>
              </div>

              {/* Temperature - Large & Prominent */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {temp}°
                  </span>
                  <span className="text-xl text-gray-500 dark:text-gray-400">
                    / {tempLow}°
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                  {getSimpleWeatherDescription(day.condition)}
                </p>
              </div>

              {/* Weather Details - Compact */}
              <div className="space-y-2 pt-4 border-t border-sky-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Droplets className="h-4 w-4" />
                    Humidity
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {day.humidity}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Wind className="h-4 w-4" />
                    Wind
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {day.windSpeed} km/h
                  </span>
                </div>
                {day.rainChance === "Yes" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <CloudRain className="h-4 w-4" />
                      Rain
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      Expected
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Packing & Travel Tips - Collapsible */}
      {recommendation && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            onClick={() => setShowPackingTips(!showPackingTips)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Packing Recommendations & Travel Tips
              </span>
            </div>
            {showPackingTips ? (
              <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {showPackingTips && (
            <div className="mt-4 grid md:grid-cols-2 gap-6 animate-fade-in-scale">
              {/* Packing List */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-5">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  What to Pack
                </h5>
                <ul className="space-y-2">
                  {recommendation.packingList.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-1.5 h-1.5 bg-sky-500 rounded-full flex-shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Travel Tips */}
              {recommendation.tips.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-5">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    Travel Tips
                  </h5>
                  <ul className="space-y-2">
                    {recommendation.tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="w-1.5 h-1.5 bg-sky-500 rounded-full flex-shrink-0 mt-1.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Data from OpenWeatherMap • Updated hourly
        </p>
      </div>
    </div>
  );
}

export default WeatherForecast;
