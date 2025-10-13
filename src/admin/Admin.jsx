import APIKeyMonitoring from "./components/APIKeyMonitoring";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Menu, X, Search, RefreshCw } from "lucide-react";

// ✅ Add Firebase imports
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [agents, setAgents] = useState({});
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // API base URL from environment
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

 // ✅ FIXED: Enhanced user fetching with dual data source support
const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching users from multiple data sources (Django + Firestore)...");

      let backendUsers = [];
      let firestoreUsers = [];

      // ✅ Method 1: Try Django backend first for comprehensive user data
      try {
        console.log("📡 Attempting to fetch users from Django backend...");
        const backendResponse = await fetch(`${API_BASE_URL}/api/admin/users/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          if (backendData.success && backendData.users) {
            backendUsers = backendData.users.map((user, index) => ({
              ...user,
              source: "backend",
              display_id: index + 1,
            }));
            console.log("✅ Django backend users loaded:", backendUsers.length);
          }
        }
      } catch (backendError) {
        console.warn("⚠️ Django backend not available for users:", backendError.message);
      }

      // ✅ Method 2: Fetch from Firestore UserProfiles collection
      try {
        console.log("🔥 Fetching users from Firestore UserProfiles...");
        
        // Fetch users from UserProfiles collection
        const userProfilesRef = collection(db, "UserProfiles");
        const usersQuery = query(userProfilesRef, orderBy("createdAt", "desc"));
        const usersSnapshot = await getDocs(usersQuery);

        // Fetch trips from AITrips collection for statistics
        const tripsRef = collection(db, "AITrips");
        const tripsSnapshot = await getDocs(tripsRef);

        console.log(`📊 Firestore users found: ${usersSnapshot.size}`);
        console.log(`📊 Firestore trips found: ${tripsSnapshot.size}`);

        // ✅ Build comprehensive trip statistics per user
        const tripStatsByUser = {};
        tripsSnapshot.forEach((tripDoc) => {
          const tripData = tripDoc.data();
          const userEmail = tripData.userEmail;

          if (userEmail) {
            if (!tripStatsByUser[userEmail]) {
              tripStatsByUser[userEmail] = {
                total_trips: 0,
                completed_trips: 0,
                recent_trip: null,
                has_real_flights: 0,
                has_real_hotels: 0,
              };
            }

            tripStatsByUser[userEmail].total_trips++;

            // ✅ Count completed trips (following TravelRover trip completion logic)
            if (tripData.tripData && Object.keys(tripData.tripData).length > 0) {
              tripStatsByUser[userEmail].completed_trips++;
            }

            // Track real flight/hotel bookings
            if (tripData.hasRealFlights) {
              tripStatsByUser[userEmail].has_real_flights++;
            }
            if (tripData.hasRealHotels) {
              tripStatsByUser[userEmail].has_real_hotels++;
            }

            // Track most recent trip
            const tripDate = new Date(tripData.createdAt || tripData.id);
            if (
              !tripStatsByUser[userEmail].recent_trip ||
              tripDate > new Date(tripStatsByUser[userEmail].recent_trip)
            ) {
              tripStatsByUser[userEmail].recent_trip = tripData.createdAt || tripData.id;
            }
          }
        });

        // ✅ Process Firestore users with enhanced data
        let userIndex = backendUsers.length + 1; // Continue numbering from backend

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const userEmail = userData.userEmail || doc.id;
          
          // ✅ Check if this user already exists in backend data
          const existsInBackend = backendUsers.some(bu => bu.email === userEmail);
          
          if (!existsInBackend) {
            const userStats = tripStatsByUser[userEmail] || {
              total_trips: 0,
              completed_trips: 0,
              recent_trip: null,
              has_real_flights: 0,
              has_real_hotels: 0,
            };

            // ✅ Following TravelRover user data structure
            firestoreUsers.push({
              id: userIndex++,
              firestore_id: doc.id,
              source: "firestore",
              username:
                userData.firstName && userData.lastName
                  ? `${userData.firstName} ${userData.lastName}`.trim()
                  : userEmail?.split("@")[0] || "User",
              email: userEmail,
              first_name: userData.firstName || "",
              last_name: userData.lastName || "",
              is_active: userData.isProfileComplete || false,
              is_staff: false,
              is_superuser: false,
              date_joined: userData.createdAt || userData.updatedAt || new Date().toISOString(),
              last_login: userData.updatedAt || null,

              // ✅ Enhanced trip statistics
              total_trips: userStats.total_trips,
              completed_trips: userStats.completed_trips,
              recent_trip_date: userStats.recent_trip,
              real_flights_booked: userStats.has_real_flights,
              real_hotels_booked: userStats.has_real_hotels,

              // ✅ TravelRover profile insights
              profile_complete: userData.isProfileComplete || false,
              phone: userData.phone || "",
              city: userData.address?.city || "",
              region: userData.address?.region || "",
              country: userData.address?.country || "Philippines",
              budget_range: userData.budgetRange || "",
              travel_style: userData.travelStyle || "",
              preferred_trip_types: Array.isArray(userData.preferredTripTypes)
                ? userData.preferredTripTypes
                : [],
              accommodation_preference: userData.accommodationPreference || "",

              // ✅ Additional TravelRover user insights
              travel_experience: userData.travelExperience || "",
              dietary_restrictions: userData.dietaryRestrictions || [],
              emergency_contact: userData.emergencyContact?.name || "",
            });
          }
        });
      } catch (firestoreError) {
        console.error("❌ Firestore users fetch error:", firestoreError);
      }

      // ✅ Combine both data sources
      const allUsers = [...backendUsers, ...firestoreUsers];

      console.log("✅ Combined users data loaded:", {
        backendUsers: backendUsers.length,
        firestoreUsers: firestoreUsers.length,
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.is_active || u.profile_complete).length,
        usersWithTrips: allUsers.filter(u => u.total_trips > 0).length,
      });

      setUsers(allUsers);

      // ✅ Enhanced success message
      const sources = [];
      if (backendUsers.length > 0) sources.push(`${backendUsers.length} from Django`);
      if (firestoreUsers.length > 0) sources.push(`${firestoreUsers.length} from Firestore`);

      toast.success(`Loaded ${allUsers.length} users (${sources.join(', ')})`);

    } catch (error) {
      console.error("❌ Error fetching users:", error);

      // ✅ Enhanced error handling following TravelRover patterns
      if (error.code === "permission-denied") {
        toast.error("Permission denied. Check Firestore security rules.");
      } else if (error.code === "unavailable") {
        toast.error("Firestore is unavailable. Check your connection.");
      } else if (error.code === "failed-precondition") {
        toast.error("Firestore index required. Check console for details.");
      } else {
        toast.error("Failed to load users. Check backend connection.");
      }

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADDED: Missing deleteUser function with proper error handling
  const deleteUser = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      toast.error("User not found");
      return;
    }

    // ✅ Debug log to see user structure
    console.log("🔍 User to delete:", user);
    
    // ✅ Check if user has proper Firestore ID
    const firestoreId = user.firestore_id || user.id;
    
    if (!firestoreId) {
      console.error("❌ No valid Firestore ID found for user:", user);
      toast.error("Cannot delete user: Missing document ID");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete user "${user.email}"? This action cannot be undone and will also delete all their trips.`
      )
    )
      return;

    try {
      console.log("🗑️ Deleting user from Firestore:", {
        email: user.email,
        firestoreId: firestoreId,
        source: user.source || 'unknown'
      });

      // ✅ Handle different user sources
      if (user.source === 'firestore' || !user.source) {
        // Delete from Firestore UserProfiles collection
        const userDocRef = doc(db, "UserProfiles", firestoreId);
        await deleteDoc(userDocRef);
        console.log("✅ Deleted from Firestore UserProfiles collection");

        // ✅ Also delete user's trips from AITrips collection
        try {
          const tripsRef = collection(db, "AITrips");
          const tripsQuery = query(tripsRef);
          const tripsSnapshot = await getDocs(tripsQuery);
          
          const userTripsToDelete = [];
          tripsSnapshot.forEach((doc) => {
            const tripData = doc.data();
            if (tripData.userEmail === user.email) {
              userTripsToDelete.push(doc.id);
            }
          });

          // Delete user's trips
          for (const tripId of userTripsToDelete) {
            const tripDocRef = doc(db, "AITrips", tripId);
            await deleteDoc(tripDocRef);
          }
          
          console.log(`✅ Deleted ${userTripsToDelete.length} associated trips`);
        } catch (tripsError) {
          console.warn("⚠️ Error deleting user's trips:", tripsError);
        }
        
      } else if (user.source === 'backend' || user.source === 'django') {
        // Delete from Django backend
        try {
          const backendResponse = await fetch(`${API_BASE_URL}/api/admin/users/${firestoreId}/`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (backendResponse.ok) {
            console.log("✅ Deleted from Django backend");
          } else {
            throw new Error("Backend deletion failed");
          }
        } catch (backendError) {
          console.warn("⚠️ Backend deletion failed, trying Firestore fallback:", backendError);
          // Fallback to Firestore deletion
          const userDocRef = doc(db, "UserProfiles", firestoreId);
          await deleteDoc(userDocRef);
          console.log("✅ Deleted using Firestore fallback");
        }
      }

      // Update local state
      setUsers(users.filter((u) => u.id !== userId));
      setTrips(trips.filter((t) => t.user_email !== user.email));

      toast.success(`Successfully deleted user "${user.email}" and their associated data`);

      // Refresh dashboard if we're on that tab
      if (activeTab === "dashboard") {
        setTimeout(() => fetchDashboardStats(), 1000);
      }
      
    } catch (error) {
      console.error("❌ Error deleting user:", {
        error: error.message,
        code: error.code,
        userId: userId,
        firestoreId: firestoreId,
        user: user
      });

      // ✅ Enhanced error handling
      if (error.code === "permission-denied") {
        toast.error("Permission denied. Check Firestore security rules.");
      } else if (error.code === "not-found") {
        toast.error("User not found in database. Removing from display.");
        // Remove from local state since it doesn't exist
        setUsers(users.filter((u) => u.id !== userId));
      } else if (error.message?.includes('indexOf')) {
        toast.error("Invalid document ID format. Cannot delete user.");
      } else {
        toast.error(`Failed to delete user: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // ✅ Fetch agents data from Django backend
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/agents/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data);
        console.log("🤖 Agents data loaded:", data);
        toast.success("LangGraph agents data loaded");
      } else {
        console.error("Failed to fetch agents");
        toast.error("Failed to load agents data");
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

 // ✅ ENHANCED: Dashboard stats with comprehensive data aggregation
const fetchDashboardStats = async () => {
  setLoading(true);
  try {
    console.log("📊 Calculating comprehensive dashboard stats from multiple sources...");
    
    let backendStats = null;

    // ✅ Try Django backend first for comprehensive stats
    try {
      console.log("📡 Fetching dashboard stats from Django backend...");
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          backendStats = data.overview;
          console.log("✅ Backend dashboard stats loaded:", backendStats);
        }
      }
    } catch (backendError) {
      console.warn("⚠️ Backend dashboard not available:", backendError.message);
    }
    
    // ✅ Enhanced Firestore calculation with Django user integration
    if (!backendStats) {
      console.log("🔥 Calculating comprehensive stats from Firestore + Django users...");
      
      // ✅ Count Django users as baseline
      let totalDjangoUsers = 0;
      let activeDjangoUsers = 0;
      
      try {
        const djangoUsersResponse = await fetch(`${API_BASE_URL}/api/admin/users/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (djangoUsersResponse.ok) {
          const djangoData = await djangoUsersResponse.json();
          if (djangoData.success && djangoData.users) {
            totalDjangoUsers = djangoData.users.length;
            activeDjangoUsers = djangoData.users.filter(u => u.is_active).length;
            console.log("✅ Django users counted:", { total: totalDjangoUsers, active: activeDjangoUsers });
          }
        }
      } catch (djangoError) {
        console.warn("⚠️ Django users count failed:", djangoError.message);
      }

      // ✅ Count Firestore users (additional to Django)
      const usersRef = collection(db, "UserProfiles");
      const usersSnapshot = await getDocs(usersRef);
      const firestoreUsersCount = usersSnapshot.size;
      
      // Calculate Firestore user metrics
      let activeFirestoreUsers = 0;
      let newFirestoreUsers24h = 0;
      let newFirestoreUsers7d = 0;
      
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        
        if (userData.isProfileComplete) {
          activeFirestoreUsers++;
        }
        
        const createdAt = new Date(userData.createdAt || userData.updatedAt);
        if (createdAt > last24h) newFirestoreUsers24h++;
        if (createdAt > last7d) newFirestoreUsers7d++;
      });

      // ✅ Comprehensive trip statistics from Firestore
      const tripsRef = collection(db, "AITrips");
      const tripsSnapshot = await getDocs(tripsRef);
      const totalTrips = tripsSnapshot.size;
      
      let completedTrips = 0;
      let newTrips24h = 0;
      let newTrips7d = 0;
      let tripsWithFlights = 0;
      let tripsWithHotels = 0;
      let personalizedTrips = 0;
      let totalEstimatedValue = 0;
      
      tripsSnapshot.forEach((doc) => {
        const tripData = doc.data();
        
        // Count completed trips (has valid itinerary)
        if (tripData.tripData && 
            tripData.tripData.itinerary && 
            Array.isArray(tripData.tripData.itinerary)) {
          completedTrips++;
        }
        
        // Count recent trips
        const createdAt = new Date(tripData.createdAt || tripData.id);
        if (createdAt > last24h) newTrips24h++;
        if (createdAt > last7d) newTrips7d++;
        
        // Count service integrations
        if (tripData.hasRealFlights) tripsWithFlights++;
        if (tripData.hasRealHotels) tripsWithHotels++;
        
        // Count personalized trips
        if (tripData.isPersonalized || tripData.userProfile) personalizedTrips++;
        
        // Calculate estimated value
        totalEstimatedValue += calculateEstimatedCost(tripData);
      });

      // ✅ Combined stats structure
      const totalUsers = totalDjangoUsers + firestoreUsersCount;
      const totalActiveUsers = activeDjangoUsers + activeFirestoreUsers;
      
      backendStats = {
        users: {
          total: totalUsers,
          active: totalActiveUsers,
          new_24h: newFirestoreUsers24h, // Only Firestore has creation tracking
          new_7d: newFirestoreUsers7d,
          growth_rate: totalUsers > 0 ? Math.round((newFirestoreUsers7d / totalUsers) * 100) : 0,
          django_users: totalDjangoUsers,
          firestore_users: firestoreUsersCount
        },
        trips: {
          total: totalTrips,
          completed: completedTrips,
          success_rate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0,
          new_24h: newTrips24h,
          new_7d: newTrips7d,
          with_flights: tripsWithFlights,
          with_hotels: tripsWithHotels,
          personalized: personalizedTrips,
          estimated_total_value: totalEstimatedValue
        },
        agents: {
          total_executions: totalTrips, // Estimate based on trips
          successful_executions: completedTrips,
          success_rate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0,
          executions_24h: newTrips24h
        }
      };
      
      console.log("📊 Comprehensive hybrid stats calculated:", backendStats);
    }
    
    setDashboardStats(backendStats);
    console.log("✅ Dashboard stats set:", backendStats);
    
  } catch (error) {
    console.error("❌ Error calculating dashboard stats:", error);
    
    // ✅ Set fallback empty stats to prevent UI errors
    setDashboardStats({
      users: { total: 0, active: 0, new_24h: 0, new_7d: 0, growth_rate: 0 },
      trips: { total: 0, completed: 0, success_rate: 0, new_24h: 0, new_7d: 0 },
      agents: { total_executions: 0, successful_executions: 0, success_rate: 0, executions_24h: 0 }
    });
    
    toast.error("Error loading dashboard statistics");
  } finally {
    setLoading(false);
  }
};

  // ✅ ENHANCED: Fetch trips with better data parsing and debugging
const fetchTrips = async () => {
  setLoading(true);
  try {
    console.log("🔍 Fetching trips from multiple data sources...");
    
    // ✅ Method 1: Try Django backend first (for LangGraph sessions)
    let backendTrips = [];
    let firestoreTrips = [];
    
    try {
      console.log("📡 Attempting to fetch from Django backend...");
      const backendResponse = await fetch(`${API_BASE_URL}/api/admin/trips/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        if (backendData.success && backendData.trips) {
          // ✅ Map backend trips with proper IDs
          backendTrips = backendData.trips.map((trip, index) => ({
            ...trip,
            id: index + 1,
            source: "backend",
            firestore_id: trip.id || trip.session_id,
          }));
          console.log("✅ Django backend trips loaded:", backendTrips.length);
        }
      }
    } catch (backendError) {
      console.warn("⚠️ Django backend not available, using Firestore only:", backendError.message);
    }
    
    // ✅ Method 2: Fetch from Firestore AITrips collection with enhanced parsing
    try {
      console.log("🔥 Fetching from Firestore AITrips...");
      const tripsRef = collection(db, "AITrips");
      const tripsQuery = query(tripsRef, orderBy("createdAt", "desc"));
      const tripsSnapshot = await getDocs(tripsQuery);
      
      console.log(`📊 Firestore trips found: ${tripsSnapshot.size}`);
      
      let tripIndex = backendTrips.length + 1;
      
      tripsSnapshot.forEach((doc) => {
        const tripData = doc.data();
        
        // ✅ Enhanced debugging for trip data structure
        console.log(`🔍 Processing trip ${doc.id}:`, {
          userEmail: tripData.userEmail,
          destination: tripData.userSelection?.location || tripData.tripData?.destination,
          hasTripData: !!tripData.tripData,
          tripDataType: typeof tripData.tripData,
          tripDataKeys: tripData.tripData ? Object.keys(tripData.tripData) : [],
        });

        // ✅ Check if this trip already exists in backend data
        const existsInBackend = backendTrips.some(bt => 
          bt.user_email === tripData.userEmail && 
          bt.destination === (tripData.userSelection?.location || tripData.tripData?.destination)
        );
        
        if (!existsInBackend) {
          // ✅ FIXED: Accurate trip duration calculation
          const tripDuration = calculateAccurateTripDuration(tripData);
          
          // ✅ Enhanced validation for trip data
          const hasValidItinerary = tripData.tripData && 
            typeof tripData.tripData === 'object' &&
            Object.keys(tripData.tripData).length > 0;
          
          const isCompleted = hasValidItinerary && 
            tripData.tripData.itinerary && 
            Array.isArray(tripData.tripData.itinerary) &&
            tripData.tripData.itinerary.length > 0;
          
          // ✅ Enhanced trip status determination
          const tripStatus = determineTripStatus(tripData);
          
          // ✅ Calculate estimated cost from itinerary
          const estimatedCost = calculateEstimatedCost(tripData);
          
          // ✅ CRITICAL: Enhanced itinerary analysis with better debugging
          console.log(`🔍 Analyzing trip ${doc.id} data:`, tripData.tripData);
          const itineraryAnalysis = analyzeItineraryContent(tripData.tripData);
          console.log(`📊 Analysis result for trip ${doc.id}:`, itineraryAnalysis);
          
          // ✅ Following TravelRover trip data structure with PROPER firestore_id
          const processedTrip = {
            id: tripIndex++,
            firestore_id: doc.id, // ✅ CRITICAL: This is the actual Firestore document ID
            source: "firestore", // ✅ Track data source
            user_email: tripData.userEmail || "unknown@example.com",
            destination: tripData.userSelection?.location || 
              tripData.tripData?.destination || "Unknown Destination",
            
            // ✅ FIXED: Trip timing information with accurate duration
            start_date: tripData.userSelection?.startDate || null,
            end_date: tripData.userSelection?.endDate || null,
            duration: tripDuration,
            created_at: tripData.createdAt || new Date().toISOString(),
            
            // ✅ Trip preferences
            travelers: tripData.userSelection?.travelers || "Not specified",
            budget: tripData.userSelection?.customBudget ? 
              `₱${tripData.userSelection.customBudget.toLocaleString()}` :
              tripData.userSelection?.budget || "Not set",
            
            // ✅ Trip completion and quality metrics
            status: tripStatus,
            is_completed: isCompleted,
            has_valid_data: hasValidItinerary,
            optimization_score: calculateOptimizationScore(tripData),
            
            // ✅ Service integration status
            flight_search_requested: tripData.flightSearchRequested || false,
            hotel_search_requested: tripData.hotelSearchRequested || false,
            flight_search_completed: Boolean(tripData.hasRealFlights),
            hotel_search_completed: Boolean(tripData.hasRealHotels),
            has_real_flights: tripData.hasRealFlights || false,
            has_real_hotels: tripData.hasRealHotels || false,
            
            // ✅ Cost and personalization
            total_estimated_cost: estimatedCost,
            is_personalized: tripData.isPersonalized || Boolean(tripData.userProfile),
            langgraph_used: tripData.langGraphUsed || false,
            
            // ✅ CRITICAL: Trip content analysis with ENHANCED accurate counts
            itinerary_days: itineraryAnalysis.totalDays,
            hotels_count: itineraryAnalysis.hotelsCount,
            places_count: itineraryAnalysis.placesCount,
            activities_count: itineraryAnalysis.activitiesCount,
            
            // ✅ User profile integration
            user_profile_used: Boolean(tripData.userProfile),
            user_location: tripData.userProfile?.address?.city || "Unknown",
            user_travel_style: tripData.userProfile?.travelStyle || "Not specified",
          };

          console.log(`✅ Processed trip ${doc.id} metrics:`, {
            destination: processedTrip.destination,
            itinerary_days: processedTrip.itinerary_days,
            hotels_count: processedTrip.hotels_count,
            places_count: processedTrip.places_count,
            activities_count: processedTrip.activities_count,
          });

          firestoreTrips.push(processedTrip);
        }
      });
    } catch (firestoreError) {
      console.error("❌ Firestore fetch error:", firestoreError);
    }
    
    // ✅ Combine both data sources
    const allTrips = [...backendTrips, ...firestoreTrips];
    
    // ✅ Enhanced debug log to verify metrics
    console.log("✅ Combined trips data loaded with metrics:", {
      backendTrips: backendTrips.length,
      firestoreTrips: firestoreTrips.length,
      totalTrips: allTrips.length,
      sampleTripMetrics: allTrips[0] ? {
        id: allTrips[0].id,
        firestore_id: allTrips[0].firestore_id,
        source: allTrips[0].source,
        destination: allTrips[0].destination,
        itinerary_days: allTrips[0].itinerary_days,
        hotels_count: allTrips[0].hotels_count,
        places_count: allTrips[0].places_count,
        activities_count: allTrips[0].activities_count,
      } : null,
      completedTrips: allTrips.filter(t => t.is_completed).length,
      withRealFlights: allTrips.filter(t => t.has_real_flights).length,
      withRealHotels: allTrips.filter(t => t.has_real_hotels).length,
      personalizedTrips: allTrips.filter(t => t.is_personalized).length,
      tripsWithActivities: allTrips.filter(t => t.activities_count > 0).length,
      tripsWithHotels: allTrips.filter(t => t.hotels_count > 0).length,
      tripsWithPlaces: allTrips.filter(t => t.places_count > 0).length,
    });
    
    setTrips(allTrips);
    
    // ✅ Enhanced success message with metrics
    const sources = [];
    if (backendTrips.length > 0) sources.push(`${backendTrips.length} from Django`);
    if (firestoreTrips.length > 0) sources.push(`${firestoreTrips.length} from Firestore`);
    
    const metricsCount = allTrips.filter(t => 
      t.itinerary_days > 0 || t.hotels_count > 0 || t.places_count > 0 || t.activities_count > 0
    ).length;
    
    toast.success(
      `Loaded ${allTrips.length} trips (${sources.join(', ')}) - ${metricsCount} with detailed metrics`
    );
    
  } catch (error) {
    console.error("❌ Error fetching trips:", error);
    
    // ✅ Enhanced error handling following TravelRover patterns
    if (error.code === 'permission-denied') {
      toast.error("Permission denied. Check Firestore security rules.");
    } else if (error.code === 'unavailable') {
      toast.error("Firestore is unavailable. Check your connection.");
    } else {
      toast.error("Failed to load trips. Check backend connection.");
    }
    
    setTrips([]);
  } finally {
    setLoading(false);
  }
};

  // ✅ FIXED: Remove duplicate function and use proper naming convention

  // ✅ Keep this as the main trip duration calculator
  const calculateAccurateTripDuration = (tripData) => {
    // Priority 1: Use explicit duration from user selection
    if (tripData.userSelection?.duration) {
      const duration = parseInt(tripData.userSelection.duration);
      return isNaN(duration) ? 1 : Math.max(1, Math.min(duration, 365)); // Cap at 365 days
    }

    // Priority 2: Calculate from start/end dates
    if (tripData.userSelection?.startDate && tripData.userSelection?.endDate) {
      try {
        const startDate = new Date(tripData.userSelection.startDate);
        const endDate = new Date(tripData.userSelection.endDate);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end day
        return Math.max(1, Math.min(diffDays, 365)); // Cap at 365 days
      } catch (error) {
        console.warn("Error calculating duration from dates:", error);
      }
    }

    // Priority 3: Count from itinerary days
    if (
      tripData.tripData?.itinerary &&
      Array.isArray(tripData.tripData.itinerary)
    ) {
      const itineraryDays = tripData.tripData.itinerary.length;
      return Math.max(1, Math.min(itineraryDays, 365)); // Cap at 365 days
    }

    // Default fallback
    return 1;
  };

  // ✅ REMOVE this duplicate function - it's causing the error
  // ❌ DELETE: const calculateTripDuration = (startDate, endDate) => { ... }

  // ✅ FIXED: Determine trip status based on TravelRover logic
  const determineTripStatus = (tripData) => {
    if (!tripData.tripData || Object.keys(tripData.tripData).length === 0) {
      return "failed";
    }

    if (
      tripData.tripData.itinerary &&
      Array.isArray(tripData.tripData.itinerary)
    ) {
      return "completed";
    }

    return "partial";
  };

  // ✅ FIXED: Calculate optimization score based on trip completeness
  const calculateOptimizationScore = (tripData) => {
    let score = 0;

    // Base score for having trip data
    if (tripData.tripData && Object.keys(tripData.tripData).length > 0) {
      score += 30;
    }

    // Score for itinerary
    if (tripData.tripData?.itinerary?.length > 0) {
      score += 25;
    }

    // Score for hotels
    if (tripData.tripData?.hotels?.length > 0) {
      score += 15;
    }

    // Score for real flight data
    if (tripData.hasRealFlights) {
      score += 15;
    }

    // Score for real hotel data
    if (tripData.hasRealHotels) {
      score += 10;
    }

    // Score for personalization
    if (tripData.userProfile && Object.keys(tripData.userProfile).length > 0) {
      score += 5;
    }

    return Math.min(score, 100);
  };

  // ✅ FIXED: Calculate estimated cost from trip data
  const calculateEstimatedCost = (tripData) => {
    // If custom budget is set, use that
    if (tripData.userSelection?.customBudget) {
      return parseFloat(tripData.userSelection.customBudget);
    }

    // Estimate based on budget range
    const budgetRange = tripData.userSelection?.budget;
    const budgetEstimates = {
      Cheap: 5000,
      Moderate: 15000,
      Luxury: 50000,
    };

    return budgetEstimates[budgetRange] || 10000;
  };

 // ✅ FIXED: Comprehensive itinerary content analysis that handles all TravelRover formats
const analyzeItineraryContent = (tripData) => {
  const analysis = {
    totalDays: 0,
    hotelsCount: 0,
    placesCount: 0,
    activitiesCount: 0,
  };

  if (!tripData || typeof tripData !== "object") {
    console.log("⚠️ No valid tripData provided for analysis");
    return analysis;
  }

  console.log("🔍 Analyzing trip data structure:", {
    hasItinerary: !!tripData.itinerary,
    hasHotels: !!tripData.hotels,
    hasPlacesToVisit: !!tripData.placesToVisit,
    hasAccommodations: !!tripData.accommodations,
    dataKeys: Object.keys(tripData)
  });

  // ✅ Count hotels from multiple possible sources
  // Priority 1: accommodations array (newest format)
  if (tripData.accommodations && Array.isArray(tripData.accommodations)) {
    analysis.hotelsCount = tripData.accommodations.length;
    console.log("✅ Found accommodations:", analysis.hotelsCount);
  }
  // Priority 2: hotels array (legacy format)
  else if (tripData.hotels && Array.isArray(tripData.hotels)) {
    analysis.hotelsCount = tripData.hotels.length;
    console.log("✅ Found hotels:", analysis.hotelsCount);
  }

  // ✅ Count places to visit
  if (tripData.placesToVisit && Array.isArray(tripData.placesToVisit)) {
    analysis.placesCount = tripData.placesToVisit.length;
    console.log("✅ Found places to visit:", analysis.placesCount);
  }

  // ✅ Analyze itinerary with comprehensive format support
  if (tripData.itinerary && Array.isArray(tripData.itinerary)) {
    analysis.totalDays = tripData.itinerary.length;
    console.log("✅ Itinerary days:", analysis.totalDays);

    // Count total activities across all days with enhanced parsing
    analysis.activitiesCount = tripData.itinerary.reduce((totalActivities, day, dayIndex) => {
      if (!day) {
        console.log(`⚠️ Day ${dayIndex + 1} is null/undefined`);
        return totalActivities;
      }

      let dayActivities = 0;

      // ✅ Format 1: day.activities as array (newest format)
      if (day.activities && Array.isArray(day.activities)) {
        dayActivities = day.activities.length;
        console.log(`📋 Day ${dayIndex + 1} - activities array:`, dayActivities);
      }
      // ✅ Format 2: day.plan as array
      else if (day.plan && Array.isArray(day.plan)) {
        dayActivities = day.plan.length;
        console.log(`📋 Day ${dayIndex + 1} - plan array:`, dayActivities);
      }
      // ✅ Format 3: day.planText as pipe-separated string
      else if (day.planText && typeof day.planText === "string") {
        const activities = day.planText
          .split("|")
          .filter((activity) => activity.trim().length > 0);
        dayActivities = activities.length;
        console.log(`📋 Day ${dayIndex + 1} - planText string:`, dayActivities, activities);
      }
      // ✅ Format 4: day.plan as JSON string
      else if (day.plan && typeof day.plan === "string") {
        try {
          const parsedPlan = JSON.parse(day.plan);
          if (Array.isArray(parsedPlan)) {
            dayActivities = parsedPlan.length;
            console.log(`📋 Day ${dayIndex + 1} - parsed JSON plan:`, dayActivities);
          } else {
            // If parsed plan is not array, treat as pipe-separated
            dayActivities = day.plan
              .split("|")
              .filter((activity) => activity.trim().length > 0).length;
            console.log(`📋 Day ${dayIndex + 1} - JSON fallback to pipe-separated:`, dayActivities);
          }
        } catch (parseError) {
          // If JSON parsing fails, treat as pipe-separated text
          dayActivities = day.plan
            .split("|")
            .filter((activity) => activity.trim().length > 0).length;
          console.log(`📋 Day ${dayIndex + 1} - parse error, using pipe-separated:`, dayActivities);
        }
      }
      // ✅ Format 5: Check for other activity fields
      else if (day.activity && typeof day.activity === "string") {
        dayActivities = 1; // Single activity
        console.log(`📋 Day ${dayIndex + 1} - single activity field`);
      }
      // ✅ Format 6: Check day content for activity indicators
      else {
        // Count based on day object properties that indicate activities
        const activityIndicators = ['morning', 'afternoon', 'evening', 'activity1', 'activity2'];
        dayActivities = activityIndicators.filter(key => 
          day[key] && typeof day[key] === 'string' && day[key].trim().length > 0
        ).length;
        
        if (dayActivities === 0) {
          // Fallback: count non-empty string values as potential activities
          dayActivities = Object.values(day).filter(value => 
            typeof value === 'string' && 
            value.trim().length > 10 && // Assume strings > 10 chars are activities
            !['day', 'theme', 'date'].includes(key) // Exclude metadata fields
          ).length;
        }
        
        console.log(`📋 Day ${dayIndex + 1} - inferred from properties:`, dayActivities);
      }

      return totalActivities + dayActivities;
    }, 0);

    console.log("✅ Total activities calculated:", analysis.activitiesCount);
  }
  // ✅ GA-First: Check if this is a GA-optimized trip with itinerary_data
  else if (tripData.itinerary_data && Array.isArray(tripData.itinerary_data)) {
    analysis.totalDays = tripData.itinerary_data.length;
    console.log("✅ GA-First itinerary days:", analysis.totalDays);

    // Count activities in GA-First format
    analysis.activitiesCount = tripData.itinerary_data.reduce((totalActivities, day, dayIndex) => {
      if (!day || !day.plan || !Array.isArray(day.plan)) {
        console.log(`⚠️ GA-First Day ${dayIndex + 1} has no plan array`);
        return totalActivities;
      }

      const dayActivities = day.plan.length;
      console.log(`📋 GA-First Day ${dayIndex + 1} - plan array:`, dayActivities);
      return totalActivities + dayActivities;
    }, 0);

    console.log("✅ GA-First total activities calculated:", analysis.activitiesCount);
  }

  console.log("📊 Final analysis result:", analysis);
  return analysis;
};

  // ✅ FIXED: Enhanced delete trip function with proper error handling
const deleteTrip = async (tripId) => {
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) {
    toast.error("Trip not found");
    return;
  }

    // ✅ Debug log to see trip structure
  console.log("🔍 Trip to delete:", trip);
  
  // ✅ Check if trip has proper Firestore ID
  const firestoreId = trip.firestore_id || trip.id;
  
  if (!firestoreId) {
    console.error("❌ No valid Firestore ID found for trip:", trip);
    toast.error("Cannot delete trip: Missing document ID");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to delete the trip to "${trip.destination}"? This action cannot be undone.`
    )
  )
    return;

  try {
    console.log("🗑️ Deleting trip from Firestore:", {
      destination: trip.destination,
      firestoreId: firestoreId,
      source: trip.source || 'unknown'
    });

    // ✅ Handle different trip sources
    if (trip.source === 'firestore' || !trip.source) {
      // Delete from Firestore AITrips collection
      const tripDocRef = doc(db, "AITrips", firestoreId);
      await deleteDoc(tripDocRef);
      console.log("✅ Deleted from Firestore AITrips collection");
    } else if (trip.source === 'backend' || trip.source === 'django') {
      // Delete from Django backend
      try {
        const backendResponse = await fetch(`${API_BASE_URL}/api/admin/trips/${firestoreId}/`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (backendResponse.ok) {
          console.log("✅ Deleted from Django backend");
        } else {
          throw new Error("Backend deletion failed");
        }
      } catch (backendError) {
        console.warn("⚠️ Backend deletion failed, trying Firestore fallback:", backendError);
        // Fallback to Firestore deletion
        const tripDocRef = doc(db, "AITrips", firestoreId);
        await deleteDoc(tripDocRef);
        console.log("✅ Deleted using Firestore fallback");
      }
    }

    // Update local state
    setTrips(trips.filter((t) => t.id !== tripId));

    toast.success(`Successfully deleted trip to "${trip.destination}"`);

    // Refresh dashboard if we're on that tab
    if (activeTab === "dashboard") {
      setTimeout(() => fetchDashboardStats(), 1000);
    }
    
  } catch (error) {
    console.error("❌ Error deleting trip:", {
      error: error.message,
      code: error.code,
      tripId: tripId,
      firestoreId: firestoreId,
      trip: trip
    });

    // ✅ Enhanced error handling
    if (error.code === "permission-denied") {
      toast.error("Permission denied. Check Firestore security rules.");
    } else if (error.code === "not-found") {
      toast.error("Trip not found in database. Removing from display.");
      // Remove from local state since it doesn't exist
      setTrips(trips.filter((t) => t.id !== tripId));
    } else if (error.message?.includes('indexOf')) {
      toast.error("Invalid document ID format. Cannot delete trip.");
    } else {
      toast.error(`Failed to delete trip: ${error.message || 'Unknown error'}`);
    }
  }
};

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully!");
    navigate("/admin/login");
  };

  // Check admin authentication on component mount
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const adminSession = localStorage.getItem("adminUser");

        if (!adminSession) {
          toast.error("Access denied. Admin login required.");
          navigate("/admin/login");
          return;
        }

        const adminData = JSON.parse(adminSession);

        // Check session expiration
        if (adminData.expiresAt && new Date(adminData.expiresAt) < new Date()) {
          toast.error("Admin session expired. Please login again.");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }

        if (!adminData.isAdmin || adminData.username !== "admin") {
          toast.error("Invalid admin session. Please login again.");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }

        // Update last activity
        adminData.lastActivity = new Date().toISOString();
        localStorage.setItem("adminUser", JSON.stringify(adminData));

        setAdminUser(adminData);
      } catch (error) {
        console.error("Admin auth check failed:", error);
        toast.error("Authentication error. Please login again.");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [navigate]);

  // Fetch data based on active tab
  useEffect(() => {
    if (!adminUser) return;

    switch (activeTab) {
      case "dashboard":
        fetchDashboardStats();
        break;
      case "users":
        fetchUsers();
        break;
      case "trips":
        fetchTrips();
        break;
      case "agents":
        fetchAgents();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, adminUser]);

  // Filter data based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrips = trips.filter(
    (trip) =>
      trip.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tab configuration for better mobile handling
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊", mobile: "📊" },
    { id: "users", label: "Users", icon: "👥", mobile: "👥" },
    { id: "trips", label: "Trips", icon: "✈️", mobile: "✈️" },
    { id: "agents", label: "Agents", icon: "🤖", mobile: "🤖" },
    { id: "apikeys", label: "API Keys", icon: "🔑", mobile: "🔑" },
  ];

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium text-sm sm:text-base">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  // If no admin user after loading, redirect will happen in useEffect
  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      {/* Responsive Admin Header */}
      <div className="bg-white shadow-lg border-b border-blue-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo & Title */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 sm:p-3 rounded-full flex-shrink-0">
                <span className="text-white text-lg sm:text-xl">🔐</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                  TravelRover Admin
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Welcome, {adminUser?.username} | Session Active
                </p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Mobile menu toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden border-blue-200 text-blue-700 hover:bg-blue-50 p-2"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>

              {/* Desktop actions */}
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                >
                  Back to Site
                </Button>
                <Button
                  onClick={handleLogout}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate("/");
                    setMobileMenuOpen(false);
                  }}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 justify-start"
                >
                  Back to Site
                </Button>
                <Button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white justify-start"
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Responsive Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          {/* Desktop tabs */}
          <div className="hidden md:flex flex-wrap gap-2 lg:gap-4 mb-4">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 lg:px-6 py-2 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tab.icon} {tab.label}
              </Button>
            ))}
          </div>

          {/* Mobile tabs - Horizontal scroll */}
          <div className="md:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <span className="mr-1">{tab.mobile}</span>
                  <span className="hidden xs:inline">{tab.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Responsive Search Bar */}
          {(activeTab === "users" || activeTab === "trips") && (
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 text-sm sm:text-base">
                Loading...
              </span>
            </div>
          )}
        </div>

        {/* Dashboard Tab - Responsive Grid */}
        {activeTab === "dashboard" && !loading && dashboardStats && (
          <div className="space-y-4 sm:space-y-6">
            {/* Overview Cards - Enhanced with hybrid data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                    <span className="text-xl sm:text-2xl">👥</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Total Users</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 truncate">
                      {dashboardStats.users.total}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {dashboardStats.users.django_users ? 
                        `${dashboardStats.users.django_users} Django + ${dashboardStats.users.firestore_users} Firestore` :
                        `${dashboardStats.users.new_7d} new this week`
                      }
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-green-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                    <span className="text-xl sm:text-2xl">✈️</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Total Trips</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 truncate">
                      {dashboardStats.trips.total}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {dashboardStats.trips.success_rate}% success rate
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-purple-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                    <span className="text-xl sm:text-2xl">🤖</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Agent Executions</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600 truncate">
                      {dashboardStats.agents.total_executions}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {dashboardStats.agents.success_rate}% success rate
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* System Status - Enhanced with data source info */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">System Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <div className="text-xl sm:text-2xl mb-2">🟢</div>
                  <div className="text-xs sm:text-sm text-gray-600">Backend Status</div>
                  <div className="font-semibold text-green-600 text-sm sm:text-base">Online</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl sm:text-2xl mb-2">🔄</div>
                  <div className="text-xs sm:text-sm text-gray-600">Recent Activity</div>
                  <div className="font-semibold text-blue-600 text-sm sm:text-base">
                    {dashboardStats.trips.new_24h} trips today
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl sm:text-2xl mb-2">⚡</div>
                  <div className="text-xs sm:text-sm text-gray-600">AI Agents</div>
                  <div className="font-semibold text-purple-600 text-sm sm:text-base">Active</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                  <div className="text-xl sm:text-2xl mb-2">📊</div>
                  <div className="text-xs sm:text-sm text-gray-600">Data Sources</div>
                  <div className="font-semibold text-yellow-600 text-sm sm:text-base">
                    {dashboardStats.users.django_users ? 'Hybrid' : 'Firestore'}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* // ✅ Enhanced users table display with Firestore data */}
        {/* Users Management Tab - Enhanced with Firestore Data */}
        {activeTab === "users" && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Users ({filteredUsers.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    console.log("🔄 Manual refresh triggered");
                    fetchUsers();
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Users
                </Button>
                <Button
                  onClick={() => {
                    console.log("🔧 Testing Firestore connection...");
                    collection(db, "UserProfiles");
                    toast.success("Firestore connection successful!");
                  }}
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Test Firestore
                </Button>
              </div>
            </div>

            {/* Enhanced Debug Info Panel for Users */}
        {activeTab === "users" && !loading && import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-sm border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600">🔧</span>
              <strong className="text-blue-800">TravelRover Users Data Sources</strong>
              <Badge className="bg-blue-100 text-blue-800 text-xs">HYBRID MODE</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <div><strong>Data Sources:</strong></div>
                <div>Django: <Badge className="bg-blue-100 text-blue-800 text-xs">{users.filter(u => u.source !== 'firestore').length}</Badge></div>
                <div>Firestore: <Badge className="bg-orange-100 text-orange-800 text-xs">{users.filter(u => u.source === 'firestore').length}</Badge></div>
              </div>

              <div className="space-y-1">
                <div><strong>User Activity:</strong></div>
                <div>Active: <Badge className="bg-green-100 text-green-800 text-xs">{users.filter(u => u.is_active || u.profile_complete).length}</Badge></div>
                <div>With Trips: <Badge className="bg-purple-100 text-purple-800 text-xs">{users.filter(u => u.total_trips > 0).length}</Badge></div>
              </div>

              <div className="space-y-1">
                <div><strong>Backend Status:</strong></div>
                <div>Django: <Badge className="bg-purple-100 text-purple-800 text-xs">{API_BASE_URL.includes('localhost') ? 'Local' : 'Remote'}</Badge></div>
                <div>Firestore: <Badge className="bg-yellow-100 text-yellow-800 text-xs">Active</Badge></div>
              </div>

              <div className="space-y-1">
                <div><strong>Debug Info:</strong></div>
                <div>Total Users: <Badge className="bg-gray-100 text-gray-800 text-xs">{users.length}</Badge></div>
                <div>Data Age: <Badge className="bg-indigo-100 text-indigo-800 text-xs">{new Date().toLocaleTimeString()}</Badge></div>
              </div>
            </div>
          </div>
        )}

            {/* Mobile Cards View - Enhanced with Firestore data */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {user.first_name || user.last_name
                            ? `${user.first_name} ${user.last_name}`.trim()
                            : user.username || "N/A"}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                        {user.city && (
                          <p className="text-xs text-gray-500">
                            📍 {user.city}, {user.country}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge
                          className={
                            user.profile_complete
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {user.profile_complete ? "Complete" : "Incomplete"}
                        </Badge>
                        {user.budget_range && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {user.budget_range}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Profile ID:</span>{" "}
                        {user.id}
                      </div>
                      <div>
                        <span className="text-gray-500">Joined:</span>{" "}
                        {new Date(user.date_joined).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-gray-500">Trips:</span>{" "}
                        {user.total_trips}
                      </div>
                      <div>
                        <span className="text-gray-500">Travel Style:</span>{" "}
                        {user.travel_style || "N/A"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm flex flex-wrap gap-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          {user.total_trips} trips
                        </Badge>
                        {user.preferred_trip_types.length > 0 && (
                          <Badge className="bg-purple-100 text-purple-800">
                            {user.preferred_trip_types[0]}
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => deleteUser(user.id)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View - Enhanced with Firestore data */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Trips
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Profile
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Travel Style
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{user.id}</td>
                      <td className="px-4 py-3 text-sm truncate max-w-xs">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.first_name || user.last_name
                          ? `${user.first_name} ${user.last_name}`.trim()
                          : user.username || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.city
                          ? `${user.city}, ${user.country}`
                          : user.country || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className="bg-blue-100 text-blue-800">
                          {user.total_trips} total / {user.completed_trips}{" "}
                          completed
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge
                          className={
                            user.profile_complete
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {user.profile_complete ? "Complete" : "Incomplete"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {user.travel_style && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              {user.travel_style}
                            </Badge>
                          )}
                          {user.budget_range && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              {user.budget_range}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          onClick={() => deleteUser(user.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Empty State for Firestore */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-lg font-medium mb-2">No users found</p>
                <div className="space-y-2 text-sm">
                  <p>
                    Data Source:{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      Firebase Firestore
                    </code>
                  </p>
                  <p>
                    Collection:{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      UserProfiles
                    </code>
                  </p>
                  <p>
                    Check that your Firebase configuration is correct and users
                    have created profiles
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* // ✅ ENHANCED: Trips Management Tab with comprehensive Firestore data display */}
        {/* Enhanced Trips Management Tab - Comprehensive Firestore Integration */}
        {activeTab === "trips" && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Trips ({filteredTrips.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    console.log("🔄 Manual refresh triggered for trips");
                    fetchTrips();
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Trips
                </Button>
                <Button
                  onClick={() => {
                    console.log("📊 Refreshing dashboard stats");
                    fetchDashboardStats();
                  }}
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Update Stats
                </Button>
              </div>
            </div>

            {/* Enhanced Debug Info Panel (Development Only) */}
        {activeTab === "trips" && !loading && import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg text-sm border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-600">🔍</span>
              <strong className="text-green-800">TravelRover Trips Data Sources & Metrics</strong>
              <Badge className="bg-green-100 text-green-800 text-xs">ENHANCED ANALYSIS</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="space-y-1">
                <div><strong>Data Sources:</strong></div>
                <div>Django: <Badge className="bg-blue-100 text-blue-800 text-xs">{trips.filter(t => t.source !== 'firestore').length}</Badge></div>
                <div>Firestore: <Badge className="bg-orange-100 text-orange-800 text-xs">{trips.filter(t => t.source === 'firestore').length}</Badge></div>
              </div>
              
              <div className="space-y-1">
                <div><strong>Trip Quality:</strong></div>
                <div>Completed: <Badge className="bg-green-100 text-green-800 text-xs">{trips.filter(t => t.is_completed).length}</Badge></div>
                <div>With Data: <Badge className="bg-blue-100 text-blue-800 text-xs">{trips.filter(t => t.has_valid_data).length}</Badge></div>
              </div>
              
              <div className="space-y-1">
                <div><strong>Content Metrics:</strong></div>
                <div>With Activities: <Badge className="bg-purple-100 text-purple-800 text-xs">{trips.filter(t => t.activities_count > 0).length}</Badge></div>
                <div>With Hotels: <Badge className="bg-green-100 text-green-800 text-xs">{trips.filter(t => t.hotels_count > 0).length}</Badge></div>
              </div>
              
              <div className="space-y-1">
                <div><strong>Services:</strong></div>
                <div>Real Flights: <Badge className="bg-blue-100 text-blue-800 text-xs">{trips.filter(t => t.has_real_flights).length}</Badge></div>
                <div>Real Hotels: <Badge className="bg-green-100 text-green-800 text-xs">{trips.filter(t => t.has_real_hotels).length}</Badge></div>
              </div>
              
              <div className="space-y-1">
                <div><strong>Debug Info:</strong></div>
                <div>Total Trips: <Badge className="bg-gray-100 text-gray-800 text-xs">{trips.length}</Badge></div>
                <div>Data Age: <Badge className="bg-indigo-100 text-indigo-800 text-xs">{new Date().toLocaleTimeString()}</Badge></div>
              </div>
            </div>
            
            {/* Sample Trip Analysis */}
            {trips.length > 0 && (
              <div className="mt-3 p-2 bg-white rounded border border-green-200">
                <div className="text-xs text-gray-600">
                  <strong>Sample Trip Analysis:</strong> {trips[0]?.destination} - 
                  Days: {trips[0]?.itinerary_days}, Hotels: {trips[0]?.hotels_count}, 
                  Places: {trips[0]?.places_count}, Activities: {trips[0]?.activities_count}
                </div>
              </div>
            )}
          </div>
        )}

            {/* Enhanced Trip Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className="p-4 sm:p-5 hover:shadow-lg transition-shadow border-gray-200"
                >
                  <div className="space-y-4">
                    {/* Trip Header */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-800 line-clamp-2">
                        📍 {trip.destination}
                      </h3>
                      <div className="flex flex-col gap-1">
                        <Badge
                          className={
                            trip.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : trip.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : trip.status === "partial"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {trip.status.charAt(0).toUpperCase() +
                            trip.status.slice(1)}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Score: {trip.optimization_score}/100
                        </Badge>
                      </div>
                    </div>

                    {/* Trip Details Grid */}
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600">👤</span>
                          <span className="font-medium">User:</span>
                        </div>
                        <div className="truncate text-xs">
                          {trip.user_email.split("@")[0]}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-green-600">📅</span>
                          <span className="font-medium">Duration:</span>
                        </div>
                        <div className="font-semibold text-green-700">
                          {trip.duration} day{trip.duration !== 1 ? "s" : ""}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-purple-600">💰</span>
                          <span className="font-medium">Budget:</span>
                        </div>
                        <div className="truncate text-xs">{trip.budget}</div>

                        <div className="flex items-center gap-1">
                          <span className="text-orange-600">👥</span>
                          <span className="font-medium">Travelers:</span>
                        </div>
                        <div className="text-xs">{trip.travelers}</div>

                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">📆</span>
                          <span className="font-medium">Created:</span>
                        </div>
                        <div className="text-xs">
                          {new Date(trip.created_at).toLocaleDateString()}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-red-600">💸</span>
                          <span className="font-medium">Est. Cost:</span>
                        </div>
                        <div className="text-xs font-semibold text-red-700">
                          ₱{trip.total_estimated_cost.toLocaleString()}
                        </div>
                      </div>

                      {/* Service Integration Badges */}
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                        {trip.flight_search_completed && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            ✈️ Flights
                          </Badge>
                        )}
                        {trip.hotel_search_completed && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            🏨 Hotels
                          </Badge>
                        )}
                        {trip.is_personalized && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            👤 Personalized
                          </Badge>
                        )}
                        {trip.langgraph_used && (
                          <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                            🤖 AI Agent
                          </Badge>
                        )}
                      </div>

                      {/* Content Metrics with Accurate Counts */}
                      <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <span>📋</span>
                          {trip.itinerary_days} days planned
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🏨</span>
                          {trip.hotels_count} hotels
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          {trip.places_count} places
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🎯</span>
                          {trip.activities_count} activities
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      onClick={() => deleteTrip(trip.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2"
                    >
                      🗑️ Delete Trip
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Enhanced Empty State for Trips */}
            {filteredTrips.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✈️</div>
                <p className="text-xl font-semibold mb-2">No trips found</p>
                <div className="space-y-2 text-sm max-w-md mx-auto">
                  <p>
                    Data Source:{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded text-green-600">
                      Firebase Firestore
                    </code>
                  </p>
                  <p>
                    Collection:{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                      AITrips
                    </code>
                  </p>
                  <p className="text-gray-600">
                    Trips are created when users use the trip planning feature
                    in TravelRover
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-700 text-xs">
                      💡 <strong>Tip:</strong> Check that users are successfully
                      creating trips through the main app
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LangGraph Agents Tab - Responsive Layout */}
        {activeTab === "agents" && !loading && (
          <div className="space-y-4 sm:space-y-6">
            {/* Agent Status Cards */}
            {agents.agents && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {Object.entries(agents.agents).map(([agentType, agentData]) => (
                  <Card key={agentType} className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                        <span className="text-lg sm:text-xl">
                          {agentType === "coordinator"
                            ? "🎯"
                            : agentType === "flight"
                            ? "✈️"
                            : "🏨"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-800 truncate">
                          {agentData.name}
                        </h3>
                        <Badge className="bg-green-100 text-green-800">
                          {agentData.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {agentData.description}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">
                            Total Executions
                          </p>
                          <p className="text-sm sm:text-base font-bold text-blue-600">
                            {agentData.total_executions}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">
                            Success Rate
                          </p>
                          <p className="text-sm sm:text-base font-bold text-green-600">
                            {agentData.success_rate}%
                          </p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">
                            24h Activity
                          </p>
                          <p className="text-sm sm:text-base font-bold text-purple-600">
                            {agentData.executions_24h}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Avg Time</p>
                          <p className="text-sm sm:text-base font-bold text-orange-600">
                            {Math.round(agentData.average_execution_time_ms)}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* System Metrics - Responsive Grid */}
            {agents.system_metrics && (
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  System Metrics
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl sm:text-2xl mb-2">📊</div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Total Sessions
                    </div>
                    <div className="font-bold text-blue-600 text-sm sm:text-base">
                      {agents.system_metrics.total_sessions}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div className="text-xl sm:text-2xl mb-2">✅</div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Completed
                    </div>
                    <div className="font-bold text-green-600 text-sm sm:text-base">
                      {agents.system_metrics.completed_sessions}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                    <div className="text-xl sm:text-2xl mb-2">🔄</div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      24h Activity
                    </div>
                    <div className="font-bold text-yellow-600 text-sm sm:text-base">
                      {agents.system_metrics.sessions_24h}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                    <div className="text-xl sm:text-2xl mb-2">❌</div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Failed
                    </div>
                    <div className="font-bold text-red-600 text-sm sm:text-base">
                      {agents.system_metrics.failed_sessions}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Execution Logs - Responsive Table */}
            {agents.recent_logs && agents.recent_logs.length > 0 && (
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Recent Agent Executions
                </h3>

                {/* Mobile Cards View */}
                <div className="lg:hidden space-y-3">
                  {agents.recent_logs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          {log.agent_type}
                        </Badge>
                        <Badge
                          className={
                            log.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : log.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <strong>Destination:</strong> {log.destination}
                        </div>
                        <div>
                          <strong>User:</strong> {log.user_email}
                        </div>
                        <div>
                          <strong>Time:</strong>{" "}
                          {new Date(log.started_at).toLocaleString()}
                        </div>
                        <div>
                          <strong>Duration:</strong>{" "}
                          {log.execution_time_ms
                            ? `${log.execution_time_ms}ms`
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full table-auto text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left">Agent</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Destination</th>
                        <th className="px-3 py-2 text-left">User</th>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.recent_logs.slice(0, 20).map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <Badge className="bg-purple-100 text-purple-800">
                              {log.agent_type}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              className={
                                log.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : log.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 truncate max-w-xs">
                            {log.destination}
                          </td>
                          <td className="px-3 py-2 truncate max-w-xs">
                            {log.user_email}
                          </td>
                          <td className="px-3 py-2">
                            {new Date(log.started_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            {log.execution_time_ms
                              ? `${log.execution_time_ms}ms`
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Django Admin Panel Link */}
            <div className="text-center sm:text-left">
              <Button
                onClick={() => window.open(`${API_BASE_URL}/admin/`, "_blank")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                size="sm"
              >
                Open Django Admin Panel
              </Button>
            </div>
          </div>
        )}

        {/* API Keys Monitoring Tab */}
        {activeTab === "apikeys" && !loading && <APIKeyMonitoring />}
      </div>
    </div>
  );
};

export default Admin;
