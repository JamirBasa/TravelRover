// src/view-trip/[tripId]/index.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { usePageTitle } from "../../hooks/usePageTitle";

// Import enhanced styles
import "../styles/ViewTrip.css";

// Import components from organized folders
import { LoadingState, ErrorState, EmptyState } from "../components/ui-states";
import { TripHeader } from "../components/trip-management";
import { DevMetaData } from "../components/shared";
import { TabbedTripView } from "../components/navigation";
import TripViewErrorBoundary from "../../components/common/TripViewErrorBoundary";

function ViewTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set dynamic page title based on trip data
  const tripTitle = trip
    ? trip.destination || trip.tripData?.destination || "Trip Details"
    : "Loading Trip...";
  usePageTitle(loading ? "Loading Trip..." : tripTitle);

  useEffect(() => {
    if (tripId) {
      GetTripData();
    } else {
      setError("No trip ID provided");
      setLoading(false);
    }
  }, [tripId]);

  const GetTripData = async () => {
    try {
      setLoading(true);
      setError(null);

      const docRef = doc(db, "AITrips", tripId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const tripData = docSnap.data();
        console.log("🔍 ViewTrip - Full document data:", tripData);
        console.log("🔍 ViewTrip - tripData field:", tripData?.tripData);
        console.log("🔍 ViewTrip - tripData type:", typeof tripData?.tripData);
        setTrip(tripData);

        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (tripData.userEmail && currentUser.email !== tripData.userEmail) {
          console.warn("User doesn't own this trip");
        }
      } else {
        console.log("No such document!");
        setError("Trip not found");
        toast.error("Trip not found!");
      }
    } catch (err) {
      console.error("Error fetching trip:", err);
      setError("Failed to load trip data");
      toast.error("Failed to load trip data");
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh function for updates (doesn't show loading screen)
  const refreshTripData = async () => {
    try {
      const docRef = doc(db, "AITrips", tripId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const tripData = docSnap.data();
        console.log("🔄 Refreshing trip data after edit:", tripData);
        setTrip(tripData);
        return tripData;
      }
    } catch (err) {
      console.error("Error refreshing trip data:", err);
      // Don't show error toast for silent refresh
    }
  };

  // Action handlers
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Trip to ${trip?.userSelection?.location}`,
        text: `Check out my ${trip?.userSelection?.duration} day trip to ${trip?.userSelection?.location}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Trip link copied to clipboard!");
    }
  };

  const handleDownload = () => {
    toast.info("PDF download feature coming soon!");
  };

  const handleEdit = () => {
    navigate("/create-trip");
  };

  const handleRetry = () => {
    GetTripData();
  };

  const handleCreateNew = () => {
    navigate("/create-trip");
  };

  // Render states
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={handleRetry}
        onCreateNew={handleCreateNew}
      />
    );
  }

  if (!trip) {
    return <EmptyState onCreateNew={handleCreateNew} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-slate-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80">
      {/* Compact Trip Header - positioned below main header */}
      <TripHeader
        trip={trip}
        onShare={handleShare}
        onDownload={handleDownload}
        onEdit={handleEdit}
      />

      {/* Main Content with optimized spacing */}
      <main
        role="main"
        className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4"
        aria-label={`Trip details for ${
          trip?.userSelection?.location || "destination"
        }`}
      >
        {/* Enhanced Tabbed Content Interface */}
        <TripViewErrorBoundary onRetry={refreshTripData}>
          <TabbedTripView trip={trip} onTripUpdate={refreshTripData} />
        </TripViewErrorBoundary>

        {/* Development Info (only in dev mode) */}
        {import.meta.env.DEV && (
          <aside
            className="mt-8 border-t border-gray-100 dark:border-slate-800 pt-6"
            aria-label="Development metadata"
          >
            <DevMetaData trip={trip} />
          </aside>
        )}
      </main>
    </div>
  );
}

export default ViewTrip;
