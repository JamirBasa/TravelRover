import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { Button } from "@/components/ui/button";
import { GetPlaceDetails, PHOTO_REF_URL } from "@/config/GlobalApi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

// ✅ Individual Trip Card Component with photo loading
function TripCard({ trip }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (trip?.userSelection?.location) {
      GetPlacePhoto();
    }
  }, [trip?.userSelection?.location]);

  const GetPlacePhoto = async () => {
    if (!trip?.userSelection?.location) {
      console.warn("No location provided for photo search");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ✅ Add random delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

      const data = {
        textQuery: trip.userSelection.location,
      };

      console.log("Searching for trip photo:", data.textQuery);

      const response = await GetPlaceDetails(data);

      // ✅ Better error checking
      if (!response.data.places || response.data.places.length === 0) {
        throw new Error("No places found for this location");
      }

      const place = response.data.places[0];

      if (!place.photos || place.photos.length === 0) {
        console.warn("No photos available for this trip location");
        setPhotoUrl("");
        return;
      }

      // ✅ Safer photo access
      const photoReference = place.photos[0]?.name;

      if (photoReference) {
        const photoUrl = PHOTO_REF_URL.replace("{NAME}", photoReference);
        setPhotoUrl(photoUrl);
        console.log("Trip photo URL generated:", photoUrl);
      }
    } catch (error) {
      console.error("Error fetching trip photo:", error);

      // ✅ Handle rate limiting
      if (error.response?.status === 429) {
        console.warn("Rate limited, will retry...");
        setTimeout(() => GetPlacePhoto(), 2000 + Math.random() * 1000);
        return;
      }

      setError(error.message);
      setPhotoUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition-all cursor-pointer hover:scale-105"
      onClick={() => navigate(`/view-trip/${trip.id}`)}
    >
      {/* ✅ Trip Photo with loading state */}
      {isLoading ? (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <img
          src={photoUrl || "../placeholder.png"}
          alt={`${trip.userSelection?.location || "Trip"} photo`}
          className="w-full h-48 object-cover"
          onError={(e) => {
            console.log("Trip image failed to load, using placeholder");
            e.target.src = "../placeholder.png";
          }}
        />
      )}

      {/* ✅ Trip Details */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-3 text-gray-800 group-hover:text-blue-600 transition-colors duration-200 line-clamp-1">
          {trip.userSelection?.location || "Unknown Destination"}
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            📅 {trip.userSelection?.duration} days
          </span>
          <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
            👥 {trip.userSelection?.travelers}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
            💰 {trip.userSelection?.budget}
          </span>
        </div>

        {/* ✅ Show error state */}
        {error && (
          <p className="text-red-500 text-xs mb-3">Failed to load photo</p>
        )}

        {/* ✅ Aesthetic View Details */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors duration-200">
            View Trip Details
          </span>
          <svg
            className="w-4 h-4 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ✅ Main MyTrips Component
function MyTrips() {
  const [userTrips, setUserTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    GetUserTrips();
  }, []);

  const GetUserTrips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userString = localStorage.getItem("user");

      // ✅ Early return if no user
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

      // ✅ Handle different error types
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

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading your trips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ✅ Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
          <p className="text-gray-600 mt-1">
            {userTrips.length} {userTrips.length === 1 ? "trip" : "trips"}{" "}
            planned
          </p>
        </div>
        <Button
          onClick={() => navigate("/create-trip")}
          className="bg-blue-500 hover:bg-blue-600"
        >
          + Create New Trip
        </Button>
      </div>

      {/* ✅ Error state */}
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

      {/* ✅ Empty state */}
      {!error && userTrips.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              No trips yet
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Ready to explore the world? Start planning your next adventure by
              creating your first trip!
            </p>
            <Button
              onClick={() => navigate("/create-trip")}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600"
            >
              Create Your First Trip
            </Button>
          </div>
        </div>
      ) : (
        /* ✅ Trips Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTrips;
