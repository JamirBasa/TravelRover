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
import FlightDataBanner from "../components/FlightDataBanner";
import TripStatusBadges from "../components/TripStatusBadges";
import DevMetadata from "../components/DevMetadata";
import InfoSection from "../components/infoSection";
import Hotels from "../components/Hotels";
import PlacesToVisit from "../components/PlacesToVisit";
import Footer from "../components/Footer";
import FlightBooking from "../components/FlightBooking";

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
        console.log("Document data:", tripData);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <TripHeader
        trip={trip}
        onShare={handleShare}
        onDownload={handleDownload}
        onEdit={handleEdit}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Status and Flight Banner */}
        <div className="mb-8 space-y-4">
          <FlightDataBanner trip={trip} />
          <TripStatusBadges trip={trip} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Trip Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📍</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Trip Overview
                  </h2>
                </div>
                <InfoSection trip={trip} />
              </div>
            </div>

            {/* Daily Itinerary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm">📅</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Daily Itinerary
                  </h2>
                </div>
                <PlacesToVisit trip={trip} />
              </div>
            </div>

            {/* Flight Booking Section */}
            {trip?.hasRealFlights && (
              <div
                id="flight-booking-section"
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-sm">✈️</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Flight Booking
                    </h2>
                  </div>
                  <FlightBooking trip={trip} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hotels Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🏨</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Hotels
                  </h2>
                </div>
                <Hotels trip={trip} />
              </div>
            </div>

            {/* Trip Stats Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Trip Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Duration</span>
                  <span className="font-medium">
                    {trip?.userSelection?.duration} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Travelers</span>
                  <span className="font-medium">
                    {trip?.userSelection?.travelers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Budget</span>
                  <span className="font-medium">
                    {trip?.userSelection?.customBudget
                      ? `₱${trip?.userSelection?.customBudget}`
                      : trip?.userSelection?.budget}
                  </span>
                </div>
                {trip.hasRealFlights && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Flight Data</span>
                    <span className="font-medium text-green-300">
                      ✅ Real-time
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>📤</span> Share Trip
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>📄</span> Download PDF
                </button>
                <button
                  onClick={handleEdit}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>✏️</span> Edit Trip
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-sm">💡</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Travel Tips & Information
              </h2>
            </div>
            <Footer trip={trip} />
          </div>
        </div>

        {/* Development Metadata */}
        <DevMetadata trip={trip} />
      </div>
    </div>
  );
}

export default ViewTrip;
