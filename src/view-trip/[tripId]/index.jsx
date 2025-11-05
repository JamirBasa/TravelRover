// src/view-trip/[tripId]/index.jsx
import React, { useEffect, useState, useRef } from "react";
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

// ✅ Import PDF export service
import { generateTripPDF } from "@/services/pdfExportService";

// ✅ NEW: Import data flow auditor (development tool)
import { auditTripData } from "@/utils/tripDataAuditor";

function ViewTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ NEW: Ref to control TabbedTripView from parent
  const tabbedViewRef = useRef(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // ✅ Run comprehensive data flow audit (development only)
        // Auditor handles all string-to-array parsing automatically
        if (import.meta.env.DEV) {
          auditTripData(tripData);
        }

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
  const handleShare = async () => {
    const tripUrl = window.location.href;
    const shareData = {
      title: `${trip?.userSelection?.location || "My Trip"} Itinerary`,
      text: `Check out my ${trip?.userSelection?.duration || "amazing"} day trip to ${
        trip?.userSelection?.location || "this destination"
      }!`,
      url: tripUrl,
    };

    // Try Web Share API first (mobile/modern browsers)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (error) {
        if (error.name !== "AbortError") {
          // User didn't cancel, fall back to clipboard
          copyToClipboard(tripUrl);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      copyToClipboard(tripUrl);
    }
  };

  // Copy link to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Link copied to clipboard!", {
          description: "Share this link with friends and family",
          duration: 3000,
        });
      })
      .catch(() => {
        toast.error("Failed to copy link", {
          description: "Please copy the URL manually from your browser",
        });
      });
  };

  const handleDownload = async () => {
    if (!trip) {
      toast.error("Unable to generate PDF", {
        description: "Trip data is not available",
      });
      return;
    }

    const loadingToast = toast.loading("Generating your PDF itinerary...");

    try {
      const result = await generateTripPDF(trip);

      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success("PDF Downloaded!", {
          description: `Saved as ${result.filename}`,
          duration: 4000,
        });
      } else {
        throw new Error(result.error || "PDF generation failed");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF", {
        description: error.message || "Please try again later",
      });
    }
  };

  const handleEdit = () => {
    console.log("🔧 handleEdit called");
    console.log("📌 tabbedViewRef.current:", tabbedViewRef.current);
    
    // Check if ref is available
    if (!tabbedViewRef.current) {
      console.error("❌ tabbedViewRef.current is null!");
      toast.error("Unable to switch tabs", {
        description: "Please refresh the page and try again",
      });
      return;
    }

    // Check if method exists
    if (!tabbedViewRef.current.switchToItinerary) {
      console.error("❌ switchToItinerary method not found!");
      toast.error("Tab switching not available", {
        description: "Please refresh the page and try again",
      });
      return;
    }

    // Notify user about switching to Itinerary tab
    toast.info("Switching to Itinerary tab for editing...", {
      duration: 2000,
    });

    // Use ref to switch to Itinerary tab
    console.log("✅ Calling switchToItinerary()");
    tabbedViewRef.current.switchToItinerary();
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
          <TabbedTripView 
            ref={tabbedViewRef}
            trip={trip} 
            onTripUpdate={refreshTripData} 
          />
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
