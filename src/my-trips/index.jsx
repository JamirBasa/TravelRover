import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { Button } from "@/components/ui/button";

// Component imports
import TripCard from "./components/TripCard";
import SearchAndFilter from "./components/SearchAndFilter";
import EmptyState from "./components/EmptyState";
import LoadingState from "./components/LoadingState";

function MyTrips() {
  const [userTrips, setUserTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    budget: "",
    duration: "",
    travelers: "",
  });

  useEffect(() => {
    GetUserTrips();
  }, []);

  const GetUserTrips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userString = localStorage.getItem("user");

      if (!userString) {
        console.warn("No user found, redirecting to home");
        navigate("/");
        return;
      }

      const user = JSON.parse(userString);

      if (!user?.email) {
        throw new Error("No email found in user data");
      }

      console.log("Fetching trips for user:", user.email);

      const q = query(
        collection(db, "AITrips"),
        where("userEmail", "==", user.email)
      );

      const querySnapshot = await getDocs(q);
      const trips = [];

      querySnapshot.forEach((doc) => {
        console.log("Trip found:", doc.id, doc.data());
        trips.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log("Total trips loaded:", trips.length);
      setUserTrips(trips);
    } catch (error) {
      console.error("Error fetching user trips:", error);

      if (error.code === "permission-denied") {
        setError("Access denied. Please check your permissions.");
      } else if (error.code === "unavailable") {
        setError("Database unavailable. Please try again later.");
      } else {
        setError(error.message || "Failed to load trips");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Search and Filter Logic
  const filteredTrips = useMemo(() => {
    return userTrips.filter((trip) => {
      // Search in content only
      const matchesSearch = !searchTerm || (() => {
        const searchLower = searchTerm.toLowerCase().trim();
        const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
        
        const containsAllWords = (text) => {
          if (!text || typeof text !== 'string') return false;
          const lowerText = text.toLowerCase();
          return searchWords.every(word => lowerText.includes(word));
        };

        const containsAnyWord = (text) => {
          if (!text || typeof text !== 'string') return false;
          const lowerText = text.toLowerCase();
          return searchWords.some(word => lowerText.includes(word));
        };

        // 1. Trip title/destination
        const titleMatch = containsAllWords(trip.userSelection?.location);
        
        // 2. Trip summary
        const summaryMatch = containsAnyWord(trip.tripData?.trip_summary);
        
        // 3. Hotels
        const hotelMatch = trip.tripData?.tripData?.accommodations?.some(hotel => 
          containsAnyWord(hotel?.name) ||
          containsAnyWord(hotel?.address) ||
          containsAnyWord(hotel?.description) ||
          containsAnyWord(hotel?.type)
        ) || false;
        
        // 4. Activities/Places
        const placesMatch = trip.tripData?.tripData?.itinerary?.some(day => 
          day?.activities?.some(activity => 
            containsAnyWord(activity?.activity) ||
            containsAnyWord(activity?.location) ||
            containsAnyWord(activity?.description)
          )
        ) || false;

        return titleMatch || summaryMatch || hotelMatch || placesMatch;
      })();

      // Filter by attributes
      const matchesBudget = !filters.budget || 
        trip.userSelection?.budget?.toLowerCase() === filters.budget.toLowerCase();

      const matchesDuration = !filters.duration || (() => {
        const tripDuration = parseInt(trip.userSelection?.duration);
        switch (filters.duration) {
          case "short": return tripDuration <= 3;
          case "medium": return tripDuration >= 4 && tripDuration <= 7;
          case "long": return tripDuration > 7;
          default: return true;
        }
      })();

      const matchesTravelers = !filters.travelers || 
        trip.userSelection?.travelers === filters.travelers;

      return matchesSearch && matchesBudget && matchesDuration && matchesTravelers;
    });
  }, [userTrips, searchTerm, filters]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      budget: "",
      duration: "",
      travelers: "",
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
          <p className="text-gray-600 mt-1">
            {filteredTrips.length} of {userTrips.length} {userTrips.length === 1 ? "trip" : "trips"}
            {searchTerm || Object.values(filters).some(f => f) ? " (filtered)" : ""}
          </p>
        </div>
        <Button
          onClick={() => navigate("/create-trip")}
          className="bg-blue-500 hover:bg-blue-600 self-start"
        >
          + Create New Trip
        </Button>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        userTrips={userTrips}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 text-sm font-medium">Error:</span>
            <span className="text-red-700 text-sm ml-2">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={GetUserTrips}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Results */}
      {!error && filteredTrips.length === 0 ? (
        <EmptyState userTrips={userTrips} clearFilters={clearFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTrips;