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
import DevMetadata from "../components/DevMetaData";
import InfoSection from "../components/InfoSection";
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
        {/* Flight Data Banner (only if flights available) */}
        {trip?.hasRealFlights && (
          <div className="mb-8">
            <FlightDataBanner trip={trip} />
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Trip Overview */}
            <InfoSection trip={trip} />

            {/* Daily Itinerary */}
            <PlacesToVisit trip={trip} />

            {/* Flight Booking Section */}
            {trip?.hasRealFlights && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">✈️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Flight Booking
                    </h2>
                    <p className="text-sm text-gray-600">
                      Book your flights with our travel partners
                    </p>
                  </div>
                </div>
                <FlightBooking trip={trip} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hotels Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 text-sm">🏨</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Hotels</h3>
                </div>
                <Hotels trip={trip} />
              </div>
            </div>

            {/* Trip Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h3 className="text-lg font-bold">Trip Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-100">Duration</span>
                  <span className="font-semibold">
                    {trip?.userSelection?.duration} days
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-100">Travelers</span>
                  <span className="font-semibold">
                    {trip?.userSelection?.travelers}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-100">Budget</span>
                  <span className="font-semibold">
                    {trip?.userSelection?.customBudget
                      ? `₱${trip?.userSelection?.customBudget}`
                      : trip?.userSelection?.budget}
                  </span>
                </div>
                {trip?.hasRealFlights && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-blue-100">Flight Data</span>
                    <span className="font-semibold text-green-300">
                      ✅ Live
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
                >
                  <span className="text-lg">📤</span> Share Trip
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
                >
                  <span className="text-lg">📄</span> Download PDF
                </button>
                <button
                  onClick={handleEdit}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
                >
                  <span className="text-lg">✏️</span> Edit Trip
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Tips */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-lg">💡</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Travel Tips & Information
                </h2>
                <p className="text-sm text-gray-600">
                  Essential information for your trip
                </p>
              </div>
            </div>
            <Footer trip={trip} />
          </div>
        </div>

        {/* Development Info (only in dev mode) */}
        {process.env.NODE_ENV === "development" && <DevMetadata trip={trip} />}
      </div>
    </div>
  );
}

export default ViewTrip;
