import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Users,
  Plane,
  Hotel,
  Sparkles,
  DollarSign,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
            const photoReference = place.photos[0].photo_reference;
            const photoUrl = googlePlacesService.getPhotoUrl(
              photoReference,
              800
            );

            if (photoUrl) {
              console.log(`✅ Found Google Places image for ${location}`);

              // Cache the photo URL for future use (30 days)
              GooglePlacesImageCache.setCache(location, photoUrl);
              setImageUrl(photoUrl);
              setIsLoading(false);
              return;
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

  const handleViewTrip = (e) => {
    if (e) e.stopPropagation();
    if (trip?.id) {
      navigate(`/view-trip/${trip.id}`);
    }
  };

  const handleEditTrip = (e) => {
    e.stopPropagation();
    if (trip?.id) {
      navigate(`/edit-trip/${trip.id}`);
    }
  };

  const handleDeleteTrip = (e) => {
    e.stopPropagation();
    onDelete(trip);
  };

  return (
    <div className="group border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow hover:shadow-lg dark:shadow-sky-500/10 dark:hover:shadow-sky-500/20 transition-all bg-white dark:bg-slate-900 relative">
      {/* Action Menu */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-600 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleViewTrip}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleEditTrip}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              Edit Trip
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeleteTrip}
              className="flex items-center gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete Trip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Trip Photo with loading state */}
      <div className="cursor-pointer" onClick={handleViewTrip}>
        {isLoading ? (
          <div className="h-48 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin text-blue-500 dark:text-sky-400" />
          </div>
        ) : null}
        <img
          src={
            imageUrl ||
            trip.userSelection?.photoUrl ||
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&q=80"
          }
          alt={trip.userSelection?.location || "Trip destination"}
          className={`w-full h-48 object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Enhanced Trip Summary */}
      <div className="p-5">
        {/* Destination Title */}
        <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 overflow-hidden">
          <MapPin className="h-5 w-5 flex-shrink-0 text-blue-500 dark:text-sky-400" />
          <span
            className="truncate cursor-pointer"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            onClick={handleViewTrip}
          >
            {trip.userSelection?.location || "Unknown Destination"}
          </span>
        </h3>

        {/* Travel Dates */}
        {dateRange && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{dateRange}</span>
          </div>
        )}

        {/* Creation Date */}
        {creationDate && (
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-500">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{creationDate}</span>
          </div>
        )}

        {/* Show AI-generated trip summary if available */}
        {trip.tripData?.trip_summary && (
          <p
            className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed cursor-pointer"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            onClick={handleViewTrip}
          >
            {trip.tripData.trip_summary}
          </p>
        )}

        {/* Trip details - Duration, Budget, Travelers */}
        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
          {/* Duration */}
          {trip.userSelection?.duration && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{trip.userSelection.duration} days</span>
            </div>
          )}

          {/* Budget */}
          {trip.userSelection?.budget && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{trip.userSelection.budget}</span>
            </div>
          )}

          {/* Travelers */}
          {trip.userSelection?.travelers &&
            trip.userSelection.travelers !== "Just Me" && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Users className="h-3.5 w-3.5" />
                <span>{trip.userSelection.travelers}</span>
              </div>
            )}
        </div>

        {/* Show trip highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight, index) => {
              const IconComponent = highlight.icon;
              return (
                <div
                  key={index}
                  className={`${highlight.bg} ${highlight.color} px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5`}
                >
                  <IconComponent className="h-3.5 w-3.5" />
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
