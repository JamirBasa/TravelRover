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

// ✅ Import production logging
import { logDebug, logError } from "@/utils/productionLogger";

// ✅ NEW: Import data flow auditor (development tool)
import { auditTripData } from "@/utils/tripDataAuditor";

function ViewTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false); // ✅ NEW: Track PDF download state

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

      // ✅ Check network connectivity first
      if (!navigator.onLine) {
        throw new Error(
          "No internet connection. Please check your network and try again."
        );
      }

      const docRef = doc(db, "AITrips", tripId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const tripData = docSnap.data();
        logDebug("ViewTrip", "Loaded trip document", {
          hasTripData: !!tripData?.tripData,
          tripDataType: typeof tripData?.tripData,
          destination: tripData?.userSelection?.location,
        });

        // ✅ Run comprehensive data flow audit (development only)
        // Auditor handles all string-to-array parsing automatically
        if (import.meta.env.DEV) {
          auditTripData(tripData);
        }

        setTrip(tripData);

        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (tripData.userEmail && currentUser.email !== tripData.userEmail) {
          logDebug("ViewTrip", "User viewing trip owned by different account", {
            currentEmail: currentUser.email,
            tripOwner: tripData.userEmail,
          });
        }
      } else {
        logDebug("ViewTrip", "Trip document not found in Firestore", {
          tripId,
        });
        setError("Trip not found");
        toast.error("Trip not found!", {
          description:
            "This trip may have been deleted or you don't have access to it.",
        });
      }
    } catch (err) {
      // ✅ IMPROVED: Better error handling with user-friendly messages
      console.error("GetTripData error:", err);

      const errorMessage =
        err.message || err.toString() || "Failed to load trip data";

      logError("ViewTrip", "Failed to fetch trip data from Firestore", {
        error: errorMessage,
        errorCode: err.code,
        tripId,
      });

      // ✅ User-friendly error messages based on error type
      let userMessage = "Failed to load trip data";
      let description = "Please try again in a moment.";

      if (!navigator.onLine) {
        userMessage = "No Internet Connection";
        description = "Please check your network connection and try again.";
      } else if (
        err.code === "unavailable" ||
        errorMessage.includes("unavailable")
      ) {
        userMessage = "Service Temporarily Unavailable";
        description =
          "Firebase is having connection issues. Your data will load when the connection is restored.";
      } else if (err.code === "permission-denied") {
        userMessage = "Access Denied";
        description = "You don't have permission to view this trip.";
      } else if (err.code === "not-found") {
        userMessage = "Trip Not Found";
        description = "This trip may have been deleted.";
      } else if (
        err.code === "deadline-exceeded" ||
        errorMessage.includes("timeout")
      ) {
        userMessage = "Connection Timeout";
        description =
          "The request took too long. Please check your connection and try again.";
      }

      setError(userMessage);
      toast.error(userMessage, { description, duration: 6000 });
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
        logDebug("ViewTrip", "Silent refresh completed", {
          destination: tripData?.userSelection?.location,
        });
        setTrip(tripData);
        return tripData;
      }
    } catch (err) {
      logError("ViewTrip", "Silent refresh failed", {
        error: err.message,
        tripId,
      });
      // Don't show error toast for silent refresh
    }
  };

  // Action handlers
  const handleShare = async () => {
    const tripUrl = window.location.href;
    const shareData = {
      title: `${trip?.userSelection?.location || "My Trip"} Itinerary`,
      text: `Check out my ${
        trip?.userSelection?.duration || "amazing"
      } day trip to ${trip?.userSelection?.location || "this destination"}!`,
      url: tripUrl,
    };

    // Try Web Share API first (mobile/modern browsers)
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
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
    // ✅ GUARD: Prevent multiple simultaneous downloads
    if (isDownloading) {
      toast.info("PDF generation in progress", {
        description: "Please wait for the current download to complete",
      });
      return;
    }

    if (!trip) {
      toast.error("Unable to generate PDF", {
        description: "Trip data is not available",
      });
      return;
    }

    setIsDownloading(true); // ✅ Lock the download button
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
      logError("ViewTrip", "PDF generation failed", {
        error: error.message,
        tripId,
      });
      toast.error("Failed to generate PDF", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsDownloading(false); // ✅ Always unlock the button
    }
  };

  const handleEdit = () => {
    logDebug(
      "ViewTrip",
      "Edit button clicked, attempting to switch to Itinerary tab",
      {
        hasRef: !!tabbedViewRef.current,
        hasMethod: !!tabbedViewRef.current?.switchToItinerary,
      }
    );

    // Check if ref is available
    if (!tabbedViewRef.current) {
      logError("ViewTrip", "Cannot switch tabs - ref is null", {
        message: "tabbedViewRef.current is null",
      });
      toast.error("Unable to switch tabs", {
        description: "Please refresh the page and try again",
      });
      return;
    }

    // Check if method exists
    if (!tabbedViewRef.current.switchToItinerary) {
      logError("ViewTrip", "Cannot switch tabs - method missing", {
        message: "switchToItinerary method not found on ref",
      });
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
    logDebug("ViewTrip", "Calling switchToItinerary()");
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
        isDownloading={isDownloading}
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
