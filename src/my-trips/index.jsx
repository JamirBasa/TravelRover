import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import Pagination from "./components/Pagination";

function MyTrips() {
  usePageTitle("My Trips");
  const [userTrips, setUserTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-newest");
  const [filters, setFilters] = useState({
    budget: "",
    duration: "",
    travelers: "",
  });

  // Pagination state with URL persistence - Fixed at 9 per page
  const pageSize = 9; // Fixed: 3x3 grid layout
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    return page > 0 ? page : 1;
  });

  useEffect(() => {
    GetUserTrips();
  }, []);

  // Update URL when pagination changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("page", currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [currentPage, searchParams, setSearchParams]);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy]);

  // Smooth scroll to top when page changes
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Page change handler
  const handlePageChange = useCallback(
    (newPage) => {
      setCurrentPage(newPage);
      scrollToTop();
    },
    [scrollToTop]
  );

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
          Array.isArray(trip.tripData?.tripData?.accommodations) &&
          trip.tripData.tripData.accommodations.some(
            (hotel) =>
              containsAnyWord(hotel?.name) ||
              containsAnyWord(hotel?.address) ||
              containsAnyWord(hotel?.description) ||
              containsAnyWord(hotel?.type)
          );

        // 4. Activities/Places in itinerary
        const placesMatch =
          Array.isArray(trip.tripData?.tripData?.itinerary) &&
          trip.tripData.tripData.itinerary.some((day) =>
            Array.isArray(day?.activities)
              ? day.activities.some(
                  (activity) =>
                    containsAnyWord(activity?.activity) ||
                    containsAnyWord(activity?.location) ||
                    containsAnyWord(activity?.description) ||
                    containsAnyWord(activity?.placeName) ||
                    containsAnyWord(activity?.placeDetails)
                )
              : false
          );

        // 5. Places to visit section
        const attractionsMatch =
          Array.isArray(trip.tripData?.tripData?.placesToVisit) &&
          trip.tripData.tripData.placesToVisit.some(
            (place) =>
              containsAnyWord(place?.placeName) ||
              containsAnyWord(place?.placeDetails) ||
              containsAnyWord(place?.location)
          );

        // 6. Day themes
        const themeMatch =
          Array.isArray(trip.tripData?.tripData?.itinerary) &&
          trip.tripData.tripData.itinerary.some((day) =>
            containsAnyWord(day?.theme)
          );

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
        (() => {
          const tripBudget = trip.userSelection?.budget;

          // Handle custom budget filter
          if (filters.budget.toLowerCase() === "custom") {
            return tripBudget?.startsWith("Custom:");
          }

          // Handle standard budgets (case-insensitive match)
          return tripBudget?.toLowerCase() === filters.budget.toLowerCase();
        })();

      const matchesDuration =
        !filters.duration ||
        (() => {
          const tripDuration = parseInt(trip.userSelection?.duration);
          switch (filters.duration) {
            case "short":
              return tripDuration <= 3; // 1-3 days
            case "medium":
              return tripDuration >= 4 && tripDuration <= 7; // 4-7 days (max limit)
            // ✅ REMOVED: "long" case (> 7 days) - impossible with 7-day maximum
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

  // Paginated trips
  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTrips.slice(startIndex, endIndex);
  }, [filteredTrips, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredTrips.length / pageSize);

  // Keyboard navigation - Must be after filteredTrips is defined
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not typing in an input
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && currentPage > 1) {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, handlePageChange]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-sky-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Enhanced Header with Gradient Accent */}
        <div className="mb-10 sm:mb-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 sm:gap-8">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-bold brand-gradient-text tracking-tight leading-tight">
                My Trips
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1 w-16 brand-gradient rounded-full"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium tracking-wide">
                  {filteredTrips.length} of {userTrips.length}{" "}
                  {userTrips.length === 1 ? "trip" : "trips"}
                  {searchTerm || Object.values(filters).some((f) => f)
                    ? " matching"
                    : ""}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/create-trip")}
              className="brand-button cursor-pointer self-start md:self-auto shadow-lg shadow-sky-500/20 dark:shadow-sky-500/10 hover:shadow-xl hover:shadow-sky-500/30 dark:hover:shadow-sky-500/20 transition-all duration-300"
              size="lg"
            >
              <span className="flex items-center gap-2.5 tracking-wide">
                <span className="text-lg">+</span>
                <span>Create New Trip</span>
              </span>
            </Button>
          </div>
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

        {/* Trips Grid with Enhanced Layout and Proper Spacing */}
        {filteredTrips.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mb-8">
              {paginatedTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={handleDeleteTrip}
                />
              ))}
            </div>

            {/* Pagination Component - Always show when there are trips */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredTrips.length}
              onPageChange={handlePageChange}
            />
          </>
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
    </div>
  );
}

export default MyTrips;
