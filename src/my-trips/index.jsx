import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  query,
  collection,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "../hooks/usePageTitle";
import { toast } from "sonner";

// Component imports
import TripCard from "./components/TripCard";
import SearchAndFilter from "./components/SearchAndFilter";
import EmptyState from "./components/EmptyState";
import LoadingState from "./components/LoadingState";
import DeleteConfirmDialog from "./components/DeleteConfirmDialog";

function MyTrips() {
  usePageTitle("My Trips");
  const [userTrips, setUserTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-newest");
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
        throw new Error("Please log in to view your trips");
      }

      const user = JSON.parse(userString);
      if (!user?.email) {
        throw new Error("Invalid user session");
      }

      const q = query(
        collection(db, "AITrips"),
        where("userEmail", "==", user.email)
      );

      const querySnapshot = await getDocs(q);
      const trips = [];

      querySnapshot.forEach((doc) => {
        trips.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setUserTrips(trips);
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError(err.message || "Failed to load trips. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced delete trip function with better validation
  const handleDeleteTrip = async (trip) => {
    console.log("🗑️ Delete trip requested:", {
      tripId: trip.id,
      location: trip.userSelection?.location,
      userEmail: trip.userEmail,
    });

    // Validate trip object
    if (!trip || !trip.id) {
      toast.error("Invalid trip data");
      return;
    }

    // Validate user ownership
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser?.email) {
      toast.error("Please sign in to delete trips");
      return;
    }

    if (trip.userEmail !== currentUser.email) {
      console.warn("❌ User doesn't own this trip:", {
        tripOwner: trip.userEmail,
        currentUser: currentUser.email,
      });
      toast.error("You can only delete your own trips");
      return;
    }

    // Show confirmation dialog
    setTripToDelete(trip);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return;

    setIsDeleting(true);
    try {
      console.log(`🗑️ Deleting trip: ${tripToDelete.id}`);

      // Verify trip exists before attempting delete
      const docRef = doc(db, "AITrips", tripToDelete.id);

      // Delete from Firebase
      await deleteDoc(docRef);

      // Update local state immediately for better UX
      setUserTrips((prev) => {
        const updatedTrips = prev.filter((trip) => trip.id !== tripToDelete.id);
        console.log(
          `✅ Local state updated: ${prev.length} → ${updatedTrips.length} trips`
        );
        return updatedTrips;
      });

      // Show success message
      toast.success(
        `🎯 Trip to ${
          tripToDelete.userSelection?.location || "destination"
        } deleted successfully`,
        {
          description:
            "Your trip has been permanently removed from your collection.",
          duration: 3000,
        }
      );

      console.log("✅ Trip deleted successfully:", tripToDelete.id);
    } catch (error) {
      console.error("❌ Error deleting trip:", {
        tripId: tripToDelete.id,
        error: error.message,
        code: error.code,
      });

      // Handle specific Firebase errors
      if (error.code === "permission-denied") {
        toast.error("Permission denied. You can only delete your own trips.");
      } else if (error.code === "not-found") {
        toast.error("Trip not found. It may have been already deleted.");
        // Remove from local state anyway since it doesn't exist
        setUserTrips((prev) =>
          prev.filter((trip) => trip.id !== tripToDelete.id)
        );
      } else if (error.code === "unavailable") {
        toast.error("Database unavailable. Please try again later.");
      } else {
        toast.error(
          "Failed to delete trip: " + (error.message || "Unknown error")
        );
      }
    } finally {
      // Always cleanup dialog state
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    }
  };

  // Enhanced filtering and sorting with travel date
  const filteredTrips = useMemo(() => {
    let filtered = userTrips.filter((trip) => {
      // Enhanced search functionality
      const matchesSearch = (() => {
        if (!searchTerm) return true;

        const searchWords = searchTerm
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 0);

        const containsAllWords = (text) => {
          if (!text || typeof text !== "string") return false;
          const lowerText = text.toLowerCase();
          return searchWords.every((word) => lowerText.includes(word));
        };

        const containsAnyWord = (text) => {
          if (!text || typeof text !== "string") return false;
          const lowerText = text.toLowerCase();
          return searchWords.some((word) => lowerText.includes(word));
        };

        // 1. Trip title/destination
        const titleMatch = containsAllWords(trip.userSelection?.location);

        // 2. Trip summary
        const summaryMatch = containsAnyWord(trip.tripData?.trip_summary);

        // 3. Hotels
        const hotelMatch =
          trip.tripData?.tripData?.accommodations?.some(
            (hotel) =>
              containsAnyWord(hotel?.name) ||
              containsAnyWord(hotel?.address) ||
              containsAnyWord(hotel?.description) ||
              containsAnyWord(hotel?.type)
          ) || false;

        // 4. Activities/Places in itinerary
        const placesMatch =
          trip.tripData?.tripData?.itinerary?.some((day) =>
            day?.activities?.some(
              (activity) =>
                containsAnyWord(activity?.activity) ||
                containsAnyWord(activity?.location) ||
                containsAnyWord(activity?.description) ||
                containsAnyWord(activity?.placeName) ||
                containsAnyWord(activity?.placeDetails)
            )
          ) || false;

        // 5. Places to visit section
        const attractionsMatch =
          trip.tripData?.tripData?.placesToVisit?.some(
            (place) =>
              containsAnyWord(place?.placeName) ||
              containsAnyWord(place?.placeDetails) ||
              containsAnyWord(place?.location)
          ) || false;

        // 6. Day themes
        const themeMatch =
          trip.tripData?.tripData?.itinerary?.some((day) =>
            containsAnyWord(day?.theme)
          ) || false;

        return (
          titleMatch ||
          summaryMatch ||
          hotelMatch ||
          placesMatch ||
          attractionsMatch ||
          themeMatch
        );
      })();

      // Filter by attributes
      const matchesBudget =
        !filters.budget ||
        trip.userSelection?.budget?.toLowerCase() ===
          filters.budget.toLowerCase();

      const matchesDuration =
        !filters.duration ||
        (() => {
          const tripDuration = parseInt(trip.userSelection?.duration);
          switch (filters.duration) {
            case "short":
              return tripDuration <= 3;
            case "medium":
              return tripDuration >= 4 && tripDuration <= 7;
            case "long":
              return tripDuration > 7;
            default:
              return true;
          }
        })();

      const matchesTravelers =
        !filters.travelers ||
        trip.userSelection?.travelers === filters.travelers;

      return (
        matchesSearch && matchesBudget && matchesDuration && matchesTravelers
      );
    });

    // Enhanced sorting with travel date options
    const sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-newest": {
          // Sort by creation date (newest first)
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        }
        case "date-oldest": {
          // Sort by creation date (oldest first)
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateA - dateB;
        }
        case "travel-earliest": {
          // Sort by travel start date (soonest first)
          const startA = a.userSelection?.startDate
            ? new Date(a.userSelection.startDate).getTime()
            : Infinity; // No date = push to end
          const startB = b.userSelection?.startDate
            ? new Date(b.userSelection.startDate).getTime()
            : Infinity;
          return startA - startB; // Ascending (earliest first)
        }
        case "travel-latest": {
          // Sort by travel start date (farthest first)
          const startA = a.userSelection?.startDate
            ? new Date(a.userSelection.startDate).getTime()
            : -Infinity; // No date = push to end
          const startB = b.userSelection?.startDate
            ? new Date(b.userSelection.startDate).getTime()
            : -Infinity;
          return startB - startA; // Descending (latest first)
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [userTrips, searchTerm, filters, sortBy]);

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("date-newest");
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            My Trips
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredTrips.length} of {userTrips.length}{" "}
            {userTrips.length === 1 ? "trip" : "trips"}
            {searchTerm || Object.values(filters).some((f) => f)
              ? " (filtered)"
              : ""}
          </p>
        </div>
        <Button
          onClick={() => navigate("/create-trip")}
          className="brand-button cursor-pointer self-start"
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
        sortBy={sortBy}
        setSortBy={setSortBy}
        clearFilters={clearFilters}
        userTrips={userTrips}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 dark:text-red-400 text-sm font-medium">
              Error:
            </span>
            <span className="text-red-700 dark:text-red-300 text-sm ml-2">
              {error}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 cursor-pointer"
            onClick={GetUserTrips}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Trips Grid */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={handleDeleteTrip} />
          ))}
        </div>
      ) : (
        <EmptyState userTrips={userTrips} clearFilters={clearFilters} />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        tripName={tripToDelete?.userSelection?.location || "this trip"}
      />
    </div>
  );
}

export default MyTrips;
