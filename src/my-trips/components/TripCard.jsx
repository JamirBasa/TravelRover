import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  MoreVertical,
  Trash2,
  MapPin,
  Calendar,
  Users,
  Plane,
  Hotel,
  Sparkles,
  DollarSign,
  Clock,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { googlePlacesService } from "@/services/GooglePlacesService";

// Google Places Image Cache Service with localStorage persistence
const GooglePlacesImageCache = {
  cache: new Map(),
  CACHE_PREFIX: "travelrover_gp_img_",
  CACHE_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days (photos don't change often)

  getCached(location) {
    // Check in-memory cache first (fastest, 0 API calls)
    if (this.cache.has(location)) {
      console.log(`💾 Memory cache hit: ${location}`);
      return this.cache.get(location);
    }

    // Check localStorage cache (persistent, 0 API calls)
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + location);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid (30 days)
        if (Date.now() - data.timestamp < this.CACHE_DURATION) {
          // Store in memory cache for faster subsequent access
          this.cache.set(location, data.url);
          console.log(`💾 LocalStorage cache hit: ${location}`);
          return data.url;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(this.CACHE_PREFIX + location);
          console.log(`⏰ Cache expired for: ${location}`);
        }
      }
    } catch (error) {
      console.error("❌ Error reading cache:", error);
    }
    return null;
  },

  setCache(location, url) {
    // Store in memory cache
    this.cache.set(location, url);

    // Store in localStorage for persistence
    try {
      localStorage.setItem(
        this.CACHE_PREFIX + location,
        JSON.stringify({
          url,
          timestamp: Date.now(),
        })
      );
      console.log(`✅ Cached Google Places image for: ${location}`);
    } catch (error) {
      console.error("❌ Error setting cache:", error);
      // If localStorage is full, clear old entries
      if (error.name === "QuotaExceededError") {
        this.clearOldestEntries();
        // Try again
        try {
          localStorage.setItem(
            this.CACHE_PREFIX + location,
            JSON.stringify({ url, timestamp: Date.now() })
          );
        } catch (retryError) {
          console.error("❌ Failed to cache after cleanup:", retryError);
        }
      }
    }
  },

  clearOldestEntries() {
    // Get all cache entries
    const entries = [];
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          entries.push({ key, timestamp: data.timestamp });
        } catch {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      }
    });

    // Sort by timestamp and remove oldest 25%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length * 0.25);
    entries.slice(0, toRemove).forEach((entry) => {
      localStorage.removeItem(entry.key);
    });
    console.log(`🧹 Cleared ${toRemove} old cache entries`);
  },

  clearCache() {
    this.cache.clear();
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log("🧹 Google Places image cache cleared");
  },
};

function TripCard({ trip, onDelete }) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  const navigate = useNavigate();

  // Fetch destination image from Google Places with caching
  useEffect(() => {
    const fetchDestinationImage = async () => {
      const location = trip.userSelection?.location;
      if (!location) {
        setIsLoading(false);
        return;
      }

      try {
        // PRIORITY 1: Use stored photoUrl (instant, 0 API calls)
        if (trip.userSelection?.photoUrl) {
          console.log(`✅ Using stored photo for ${location}`);
          setImageUrl(trip.userSelection.photoUrl);
          setIsLoading(false);
          return;
        }

        // PRIORITY 2: Check cache (instant, 0 API calls)
        const cachedUrl = GooglePlacesImageCache.getCached(location);
        if (cachedUrl) {
          setImageUrl(cachedUrl);
          setIsLoading(false);
          return;
        }

        // PRIORITY 3: Fetch from Google Places API (1 request)
        // Note: googlePlacesService has its own internal cache for search results
        console.log(`🔍 Fetching Google Places image for: ${location}`);
        const places = await googlePlacesService.searchPlaces(location);

        if (places && places.length > 0) {
          const place = places[0];

          // Get photo URL if available
          if (place.photos && place.photos.length > 0) {
            // ✅ Handle both old (photo_reference) and new (name) formats
            const photoReference =
              place.photos[0].name || place.photos[0].photo_reference;

            if (photoReference) {
              // ✅ Use backend proxy for photos
              try {
                const apiBaseUrl =
                  import.meta.env.VITE_API_BASE_URL ||
                  "http://localhost:8000/api";
                const backendPhotoUrl = `${apiBaseUrl}/langgraph/photo-proxy/?photo_ref=${encodeURIComponent(
                  photoReference
                )}&maxHeightPx=800&maxWidthPx=800`;

                // ✅ Test if the URL actually works before caching
                console.log(`🔍 Testing photo URL for ${location}...`);
                const testResponse = await fetch(backendPhotoUrl, {
                  method: "HEAD",
                });

                if (testResponse.ok) {
                  console.log(
                    `✅ Photo URL verified for ${location} (Status: ${testResponse.status})`
                  );

                  // Cache the photo URL for future use (30 days)
                  GooglePlacesImageCache.setCache(location, backendPhotoUrl);
                  setImageUrl(backendPhotoUrl);
                  setIsLoading(false);
                  return;
                } else {
                  console.error(
                    `❌ Photo URL failed: ${testResponse.status} ${testResponse.statusText}`
                  );
                }
              } catch (photoError) {
                console.error(
                  "❌ Error fetching/verifying photo URL:",
                  photoError
                );
              }
            }
          }
        }

        console.log(
          `⚠️ No Google Places image found for ${location}, using fallback`
        );
      } catch (error) {
        console.error("❌ Error fetching destination image:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinationImage();
  }, [trip.userSelection?.location, trip.userSelection?.photoUrl]);

  // Helper function to format date ranges
  const formatDateRange = () => {
    const { startDate, endDate } = trip.userSelection || {};

    if (!startDate || !endDate) return null;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const formatOptions = { month: "short", day: "numeric" };
      const startFormatted = start.toLocaleDateString("en-US", formatOptions);
      const endFormatted = end.toLocaleDateString("en-US", formatOptions);

      // Add year if different from current year
      const currentYear = new Date().getFullYear();
      const startYear = start.getFullYear();
      const yearSuffix = startYear !== currentYear ? `, ${startYear}` : "";

      return `${startFormatted} - ${endFormatted}${yearSuffix}`;
    } catch {
      return null;
    }
  };

  // Helper function to format creation date
  const formatCreationDate = () => {
    if (!trip.createdAt) return null;

    try {
      // Handle both Firestore timestamp and regular date
      const date = trip.createdAt?.toDate
        ? trip.createdAt.toDate()
        : new Date(trip.createdAt);

      const now = new Date();
      const diffInMs = now - date;
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);

      // Show relative time for recent trips
      if (diffInHours < 1) {
        return "Created just now";
      } else if (diffInHours < 24) {
        return `Created ${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
      } else if (diffInDays < 7) {
        return `Created ${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
      } else {
        // Show actual date for older trips
        const formatOptions = {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        };
        return `Created ${date.toLocaleDateString("en-US", formatOptions)}`;
      }
    } catch (error) {
      console.error("Error formatting creation date:", error);
      return null;
    }
  };

  // Helper function to get trip highlights with correct data structure
  const getTripHighlights = () => {
    const highlights = [];

    // Check activity preference (new in updated flow)
    const activityPref = trip.userSelection?.activityPreference;
    if (activityPref !== undefined && activityPref !== null) {
      const paceLabels = {
        1: "Light Pace",
        2: "Moderate Pace",
        3: "Active Pace",
      };
      const paceLabel = paceLabels[activityPref] || "Moderate Pace";

      highlights.push({
        icon: Zap,
        text: paceLabel,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-950/50",
      });
    }

    // Check accommodations
    const accommodationsCount =
      trip.tripData?.tripData?.accommodations?.length || 0;
    if (accommodationsCount > 0) {
      highlights.push({
        icon: Hotel,
        text: `${accommodationsCount} hotel${
          accommodationsCount > 1 ? "s" : ""
        }`,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-950/50",
      });
    }

    // Check activities in itinerary
    const totalActivities =
      trip.tripData?.tripData?.itinerary?.reduce(
        (count, day) => count + (day.activities?.length || 0),
        0
      ) || 0;

    if (totalActivities > 0) {
      highlights.push({
        icon: Sparkles,
        text: `${totalActivities} activities`,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/50",
      });
    }

    // Check if flights are included
    if (
      trip.tripData?.tripData?.flights &&
      Object.keys(trip.tripData.tripData.flights).length > 0
    ) {
      highlights.push({
        icon: Plane,
        text: "Flights included",
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 dark:bg-sky-950/50",
      });
    }

    return highlights.slice(0, 3); // Show max 3 highlights
  };

  const highlights = getTripHighlights();
  const dateRange = formatDateRange();
  const creationDate = formatCreationDate();

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = (e) => {
    // Use a reliable fallback image instead of placeholder service
    e.target.src = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&q=80`;
    setIsLoading(false);
  };

  const handleViewTrip = () => {
    if (trip?.id) {
      navigate(`/view-trip/${trip.id}`);
    }
  };

  const handleDeleteTrip = () => {
    onDelete(trip);
  };

  return (
    <div
      className="group brand-card border-gray-200/80 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-md hover:shadow-2xl dark:shadow-slate-900/50 dark:hover:shadow-sky-500/20 transition-all duration-300 bg-white dark:bg-slate-900/80 backdrop-blur-sm relative cursor-pointer hover:-translate-y-1 flex flex-col"
      onClick={handleViewTrip}
    >
      {/* Action Menu with Enhanced Positioning and Higher Z-Index */}
      <div
        className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-95"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 shadow-lg border border-gray-200/50 dark:border-slate-600/50 rounded-lg transition-all duration-200 hover:shadow-xl hover:scale-110"
              aria-label="Trip options"
            >
              <MoreVertical className="h-4 w-4 text-gray-700 dark:text-gray-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            alignOffset={-5}
            sideOffset={8}
            className="w-48 shadow-xl z-50"
          >
            <DropdownMenuItem
              onClick={handleDeleteTrip}
              className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Trip</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Professional Image with Smooth Hover Animation */}
      <div className="relative overflow-hidden h-56 bg-gradient-to-br from-gray-100 via-blue-50 to-sky-50 dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-700">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div style={{ animation: "spin 1s linear infinite" }}>
              <AiOutlineLoading3Quarters className="h-7 w-7 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
        )}
        <img
          src={
            imageUrl ||
            trip.userSelection?.photoUrl ||
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&q=80"
          }
          alt={trip.userSelection?.location || "Trip destination"}
          className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 group-hover:brightness-110 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-500"></div>

        {/* Optional: Destination Label Overlay (appears on hover) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div className="flex items-center gap-2 text-white">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-semibold truncate tracking-wide">
              {trip.userSelection?.location || "Unknown Destination"}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Trip Content with Optimized Spacing */}
      <div className="p-6 space-y-5">
        {/* Destination Title with Icon */}
        <div className="space-y-4">
          <h3 className="font-bold text-xl text-gray-900 dark:text-gray-50 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-300 flex items-start gap-3 leading-snug tracking-tight">
            <MapPin className="h-5 w-5 flex-shrink-0 text-sky-500 dark:text-sky-400 mt-1 group-hover:scale-110 transition-transform duration-300" />
            <span
              className="line-clamp-2"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {trip.userSelection?.location || "Unknown Destination"}
            </span>
          </h3>

          {/* Travel Dates Badge */}
          {dateRange && (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 rounded-lg text-sm font-medium text-sky-700 dark:text-sky-300">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="tracking-wide">{dateRange}</span>
            </div>
          )}
        </div>

        {/* Creation Date - Subtle */}
        {creationDate && (
          <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-500 border-l-2 border-gray-200 dark:border-slate-700 pl-3.5 py-1">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="tracking-wide">{creationDate}</span>
          </div>
        )}

        {/* AI-Generated Summary with Better Typography */}
        {trip.tripData?.trip_summary && (
          <p
            className="text-gray-600 dark:text-gray-400 text-sm leading-loose line-clamp-2 tracking-wide"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {trip.tripData.trip_summary}
          </p>
        )}

        {/* Trip Metadata Pills with Better Spacing */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          {/* Duration */}
          {trip.userSelection?.duration && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-sm text-gray-700 dark:text-gray-300">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium tracking-wide">
                {trip.userSelection.duration} days
              </span>
            </div>
          )}

          {/* Budget - Enhanced Display */}
          {trip.userSelection?.budget && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium tracking-wide">
                {trip.userSelection.budget.startsWith("Custom:")
                  ? trip.userSelection.budget.replace("Custom: ", "")
                  : trip.userSelection.budget === "Budget"
                  ? "Budget-Friendly"
                  : trip.userSelection.budget}
              </span>
            </div>
          )}

          {/* Travelers */}
          {trip.userSelection?.travelers &&
            trip.userSelection.travelers !== "Just Me" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-sm text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                <Users className="h-4 w-4" />
                <span className="font-medium tracking-wide">
                  {trip.userSelection.travelers}
                </span>
              </div>
            )}
        </div>

        {/* Trip Highlights - Enhanced Badges with Better Spacing */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-gray-50 dark:border-slate-800/50">
            {highlights.map((highlight, index) => {
              const IconComponent = highlight.icon;
              return (
                <div
                  key={index}
                  className={`${highlight.bg} ${
                    highlight.color
                  } px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
                    highlight.color.includes("orange")
                      ? "border-orange-200 dark:border-orange-800/50"
                      : highlight.color.includes("purple")
                      ? "border-purple-200 dark:border-purple-800/50"
                      : highlight.color.includes("blue")
                      ? "border-blue-200 dark:border-blue-800/50"
                      : "border-sky-200 dark:border-sky-800/50"
                  } transition-all duration-200 hover:scale-105 tracking-wide`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{highlight.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripCard;
