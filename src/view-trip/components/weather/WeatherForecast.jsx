import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertCircle,
  Thermometer,
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
        forecastMessage = `Check back in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
        forecastDetail = `Weather forecasts become available 14 days before your trip. Your trip starts ${daysUntilTrip} days from now.`;
      } else if (daysUntilTrip < 0) {
        forecastTitle = "Trip Already Started";
        forecastMessage = "Weather forecast only available for upcoming trips";
        forecastDetail = "We hope you're having a great time on your trip!";
      } else {
        forecastTitle = "Weather Data Unavailable";
        forecastMessage = "Unable to load weather information";
        forecastDetail = error || "Please try refreshing the page or check back later.";
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

  const recommendation = getWeatherRecommendation(weatherData.forecast);

  // Calculate trip alignment
  const tripStartDate = trip?.userSelection?.startDate;
  const tripDuration = trip?.userSelection?.duration || weatherData.forecast.length;
  
  return (
    <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-sky-200 dark:border-sky-800 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/50 dark:to-blue-900/50 rounded-xl flex items-center justify-center shadow-sm">
            <Sun className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Weather for Your Trip
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {weatherData.location} • {tripStartDate ? new Date(tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Your dates'}
            </p>
          </div>
        </div>
        
        {/* Temperature Unit Toggle */}
        <button
          onClick={() => setShowFahrenheit(!showFahrenheit)}
          className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          title="Toggle temperature unit"
        >
          {showFahrenheit ? '°F' : '°C'}
        </button>
      </div>

      {/* Weather Summary Card */}
      {recommendation && (
        <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Thermometer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-1">
                {recommendation.summary}
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Here's what to expect and pack for your trip
              </p>
            </div>
          </div>

          {/* Packing List - Always Visible */}
          <div className="bg-white/60 dark:bg-slate-900/30 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Essential Items to Pack
              </h5>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recommendation.packingList.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Tips */}
          {recommendation.tips.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Travel Tips
                </h5>
              </div>
              <ul className="space-y-2">
                {recommendation.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Daily Forecast - Simplified */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Cloud className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          Daily Weather Forecast
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {weatherData.forecast.slice(0, Math.min(5, tripDuration)).map((day, index) => {
            const temp = showFahrenheit ? celsiusToFahrenheit(day.tempMax) : day.tempMax;
            const tempLow = showFahrenheit ? celsiusToFahrenheit(day.tempMin) : day.tempMin;
            
            return (
              <div
                key={day.date}
                className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-sky-100 dark:border-sky-900 hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all"
              >
                {/* Date */}
                <div className="text-center mb-3">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {index === 0 ? "Today" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>

                {/* Weather Icon & Condition */}
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{day.icon}</div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {getSimpleWeatherDescription(day.condition)}
                  </p>
                </div>

                {/* Temperature - Prominent */}
                <div className="text-center mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {temp}°
                    </span>
                    <div className="text-left">
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                        High
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                        {tempLow}° low
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rain Indicator - Prominent if rainy */}
                {day.rainChance === "Yes" && (
                  <div className="flex items-center justify-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg px-2 py-2 text-xs font-medium">
                    <CloudRain className="h-4 w-4" />
                    <span>Rain Expected</span>
                  </div>
                )}
                
                {day.rainChance === "No" && (
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
                    <Sun className="h-3.5 w-3.5" />
                    <span>No rain</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Weather Info - Collapsible */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition-colors"
      >
        {showDetails ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Hide detailed weather info
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Show detailed weather info (humidity, wind speed)
          </>
        )}
      </button>

      {showDetails && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 animate-in fade-in duration-200">
          {weatherData.forecast.slice(0, Math.min(5, tripDuration)).map((day) => (
            <div
              key={`details-${day.date}`}
              className="bg-gray-50 dark:bg-slate-900/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Droplets className="h-3.5 w-3.5" />
                    Humidity
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {day.humidity}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Wind className="h-3.5 w-3.5" />
                    Wind
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {day.windSpeed} km/h
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-sky-200 dark:border-sky-800">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Weather data from OpenWeatherMap • Updates every hour • Forecast accuracy may vary
        </p>
      </div>
    </div>
  );
}

export default WeatherForecast;
