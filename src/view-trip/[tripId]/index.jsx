// src/view-trip/[tripId]/index.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

// Import components
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import TripHeader from "../components/TripHeader";
import DevMetadata from "../components/DevMetadata";
import TabbedTripView from "../components/TabbedTripView";

function ViewTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Compact Header Section */}
      <TripHeader
        trip={trip}
        onShare={handleShare}
        onDownload={handleDownload}
        onEdit={handleEdit}
      />

      {/* Main Content with Tabbed Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabbed Content Interface */}
        <TabbedTripView trip={trip} />

        {/* Development Info (only in dev mode) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8">
            <DevMetadata trip={trip} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewTrip;
