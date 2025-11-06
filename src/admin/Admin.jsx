import APIKeyMonitoring from "./components/APIKeyMonitoring";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Menu, X, Search, RefreshCw, Trash2, Eye } from "lucide-react";

// ✅ Add Recharts imports
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Firebase imports
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import UserFilters from "./components/UserFilters";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    status: "",
    userType: "",
    tripActivity: "",
    dateRange: "", // ✅ Removed source
  });
  const [trips, setTrips] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊", mobile: "📊" },
    { id: "users", label: "Users", icon: "👥", mobile: "👥" },
    { id: "trips", label: "Trips", icon: "✈️", mobile: "✈️" },
    { id: "apikeys", label: "API Keys", icon: "🔑", mobile: "🔑" },
  ];

  // ✅ Chart color schemes
  const CHART_COLORS = {
    primary: "#0ea5e9", // brand-sky
    secondary: "#0284c7", // brand-blue
    success: "#10b981", // green
    warning: "#f59e0b", // amber
    danger: "#ef4444", // red
    purple: "#a855f7",
    pink: "#ec4899",
    indigo: "#6366f1",
  };

  const PIE_COLORS = [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.purple,
    CHART_COLORS.pink,
    CHART_COLORS.indigo,
  ];

  // ✅ Calculate estimated cost helper
  const calculateEstimatedCost = (tripData) => {
    if (tripData.userSelection?.customBudget) {
      return parseFloat(tripData.userSelection.customBudget);
    }

    const budgetRange = tripData.userSelection?.budget || "Moderate";
    const budgetEstimates = {
      Cheap: 5000,
      Budget: 5000,
      Moderate: 15000,
      Luxury: 50000,
    };

    return budgetEstimates[budgetRange] || 10000;
  };

  // ✅ NEW: Calculate popular destinations
  const calculatePopularDestinations = (tripsSnapshot) => {
    const destinationCounts = {};

    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();
      const destination =
        tripData.tripData?.destination ||
        tripData.userSelection?.location?.label ||
        null;

      if (destination) {
        destinationCounts[destination] =
          (destinationCounts[destination] || 0) + 1;
      }
    });

    const totalTrips = Object.values(destinationCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    const sortedDestinations = Object.entries(destinationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([location, count]) => ({
        location,
        count,
        percentage: totalTrips > 0 ? Math.round((count / totalTrips) * 100) : 0,
      }));

    return sortedDestinations;
  };

  // ✅ Calculate itinerary statistics
  const calculateItineraryStats = (tripsSnapshot) => {
    let totalItineraries = 0;
    let completedItineraries = 0;
    let itinerariesWithActivities = 0;
    let itinerariesWithHotels = 0;
    let newItineraries24h = 0;
    let newItineraries7d = 0;
    let totalDaysPlanned = 0;
    let totalActivitiesPlanned = 0;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();

      const hasItinerary =
        tripData.tripData?.itinerary &&
        Array.isArray(tripData.tripData.itinerary) &&
        tripData.tripData.itinerary.length > 0;

      if (hasItinerary) {
        totalItineraries++;

        const itinerary = tripData.tripData.itinerary;
        const hasContent = itinerary.some(
          (day) =>
            (day.activities && day.activities.length > 0) ||
            (day.plan && Array.isArray(day.plan) && day.plan.length > 0) ||
            (day.planText && day.planText.trim().length > 0)
        );

        if (hasContent) {
          completedItineraries++;
        }

        totalDaysPlanned += itinerary.length;

        itinerary.forEach((day) => {
          if (day.activities && Array.isArray(day.activities)) {
            totalActivitiesPlanned += day.activities.length;
          } else if (day.plan && Array.isArray(day.plan)) {
            totalActivitiesPlanned += day.plan.length;
          } else if (day.planText && typeof day.planText === "string") {
            totalActivitiesPlanned += day.planText
              .split("|")
              .filter((a) => a.trim()).length;
          }
        });

        const dayActivitiesCount = itinerary.reduce((count, day) => {
          if (day.activities?.length > 0 || day.plan?.length > 0)
            return count + 1;
          return count;
        }, 0);

        if (dayActivitiesCount > 0) {
          itinerariesWithActivities++;
        }

        if (
          tripData.tripData?.hotels &&
          Array.isArray(tripData.tripData.hotels) &&
          tripData.tripData.hotels.length > 0
        ) {
          itinerariesWithHotels++;
        }

        const createdAt = new Date(tripData.createdAt || tripData.id);
        if (createdAt > last24h) newItineraries24h++;
        if (createdAt > last7d) newItineraries7d++;
      }
    });

    const successRate =
      totalItineraries > 0
        ? Math.round((completedItineraries / totalItineraries) * 100)
        : 0;

    const avgDaysPerItinerary =
      totalItineraries > 0
        ? Math.round(totalDaysPlanned / totalItineraries)
        : 0;

    const avgActivitiesPerItinerary =
      totalItineraries > 0
        ? Math.round(totalActivitiesPlanned / totalItineraries)
        : 0;

    return {
      total: totalItineraries,
      completed: completedItineraries,
      success_rate: successRate,
      new_24h: newItineraries24h,
      new_7d: newItineraries7d,
      with_activities: itinerariesWithActivities,
      with_hotels: itinerariesWithHotels,
      total_days_planned: totalDaysPlanned,
      total_activities_planned: totalActivitiesPlanned,
      avg_days_per_itinerary: avgDaysPerItinerary,
      avg_activities_per_itinerary: avgActivitiesPerItinerary,
    };
  };

  // ✅ REPLACE the calculateAnalyticsData function with this:

  const calculateAnalyticsData = (tripsSnapshot, usersSnapshot) => {
    // 1. Trips created over last 30 days
    const now = new Date();
    const last30Days = [];
    const tripsByDate = {};
    const usersByDate = {};

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      last30Days.push(dateKey);
      tripsByDate[dateKey] = 0;
      usersByDate[dateKey] = 0;
    }

    // Count trips by date
    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();
      const createdDate = new Date(tripData.createdAt || tripData.id);
      const dateKey = createdDate.toISOString().split("T")[0];
      if (dateKey in tripsByDate) {
        tripsByDate[dateKey]++;
      }
    });

    // Count users by date
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const createdDate = new Date(userData.createdAt || userData.updatedAt);
      const dateKey = createdDate.toISOString().split("T")[0];
      if (dateKey in usersByDate) {
        usersByDate[dateKey]++;
      }
    });

    // Format for line chart
    const timeSeriesData = last30Days.map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      trips: tripsByDate[date],
      users: usersByDate[date],
    }));

    // ✅ 2. Budget distribution with normalization
    const budgetCounts = {};

    // Define standard budget categories (matching constants/options.jsx)
    const BUDGET_CATEGORIES = {
      cheap: "Cheap",
      budget: "Budget",
      moderate: "Moderate",
      luxury: "Luxury",
    };

    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();
      const rawBudget = tripData.userSelection?.budget || "Moderate";

      // ✅ Normalize to proper case (handles "budget", "Budget", "BUDGET", etc.)
      const normalizedBudget =
        BUDGET_CATEGORIES[rawBudget.toLowerCase()] || rawBudget;

      budgetCounts[normalizedBudget] =
        (budgetCounts[normalizedBudget] || 0) + 1;
    });

    const budgetDistribution = Object.entries(budgetCounts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    // 3. Trip duration analysis
    const durationCounts = {
      "1-3 days": 0,
      "4-7 days": 0,
      "8-14 days": 0,
      "15+ days": 0,
    };

    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();
      const duration = parseInt(
        tripData.userSelection?.duration || tripData.tripData?.duration || 0
      );

      if (duration <= 3) durationCounts["1-3 days"]++;
      else if (duration <= 7) durationCounts["4-7 days"]++;
      else if (duration <= 14) durationCounts["8-14 days"]++;
      else durationCounts["15+ days"]++;
    });

    const durationData = Object.entries(durationCounts).map(
      ([name, value]) => ({
        name,
        trips: value,
      })
    );

    // 4. Travelers distribution
    const travelersCounts = {
      Solo: 0,
      Couple: 0,
      Family: 0,
      Group: 0,
    };

    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();
      const travelers = tripData.userSelection?.travelers || "Solo";
      if (travelers in travelersCounts) {
        travelersCounts[travelers]++;
      }
    });

    const travelersData = Object.entries(travelersCounts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    // 5. Weekly comparison (This week vs Last week)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let thisWeekTrips = 0;
    let lastWeekTrips = 0;
    let thisWeekUsers = 0;
    let lastWeekUsers = 0;

    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();
      const createdDate = new Date(tripData.createdAt || tripData.id);
      if (createdDate > oneWeekAgo) thisWeekTrips++;
      else if (createdDate > twoWeeksAgo) lastWeekTrips++;
    });

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const createdDate = new Date(userData.createdAt || userData.updatedAt);
      if (createdDate > oneWeekAgo) thisWeekUsers++;
      else if (createdDate > twoWeeksAgo) lastWeekUsers++;
    });

    const weeklyComparison = [
      { period: "Last Week", trips: lastWeekTrips, users: lastWeekUsers },
      { period: "This Week", trips: thisWeekTrips, users: thisWeekUsers },
    ];

    return {
      timeSeriesData,
      budgetDistribution,
      durationData,
      travelersData,
      weeklyComparison,
      growth: {
        tripsGrowth:
          lastWeekTrips > 0
            ? Math.round(
                ((thisWeekTrips - lastWeekTrips) / lastWeekTrips) * 100
              )
            : thisWeekTrips > 0
            ? 100
            : 0,
        usersGrowth:
          lastWeekUsers > 0
            ? Math.round(
                ((thisWeekUsers - lastWeekUsers) / lastWeekUsers) * 100
              )
            : thisWeekUsers > 0
            ? 100
            : 0,
      },
    };
  };

  // ✅ Fetch dashboard stats
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      console.log(
        "📊 Calculating dashboard stats and analytics from Firestore..."
      );

      // Count Django users
      let totalDjangoUsers = 0;
      let activeDjangoUsers = 0;

      try {
        const djangoUsersResponse = await fetch(
          `${API_BASE_URL}/api/admin/users/`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (djangoUsersResponse.ok) {
          const djangoData = await djangoUsersResponse.json();
          if (djangoData.success && djangoData.users) {
            totalDjangoUsers = djangoData.users.length;
            activeDjangoUsers = djangoData.users.filter(
              (u) => u.is_active
            ).length;
          }
        }
      } catch (djangoError) {
        console.warn("⚠️ Django users count failed:", djangoError.message);
      }

      // Count Firestore users
      const usersRef = collection(db, "UserProfiles");
      const usersSnapshot = await getDocs(usersRef);
      const firestoreUsersCount = usersSnapshot.size;

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

      // Get trips data
      const tripsRef = collection(db, "AITrips");
      const tripsSnapshot = await getDocs(tripsRef);

      console.log(`🔍 Analyzing ${tripsSnapshot.size} trips for statistics...`);

      const itineraryStats = calculateItineraryStats(tripsSnapshot);
      const popularDestinations = calculatePopularDestinations(tripsSnapshot);
      const analytics = calculateAnalyticsData(tripsSnapshot, usersSnapshot);

      const totalUsers = totalDjangoUsers + firestoreUsersCount;
      const totalActiveUsers = activeDjangoUsers + activeFirestoreUsers;

      const stats = {
        users: {
          total: totalUsers,
          active: totalActiveUsers,
          new_24h: newFirestoreUsers24h,
          new_7d: newFirestoreUsers7d,
          growth_rate:
            totalUsers > 0
              ? Math.round((newFirestoreUsers7d / totalUsers) * 100)
              : 0,
          django_users: totalDjangoUsers,
          firestore_users: firestoreUsersCount,
        },
        itineraries: itineraryStats,
        popular_locations: popularDestinations,
      };

      console.log("📊 Dashboard stats calculated:", stats);
      console.log("📈 Analytics data calculated:", analytics);

      setDashboardStats(stats);
      setAnalyticsData(analytics);
      toast.success("Dashboard statistics and analytics loaded successfully");
    } catch (error) {
      console.error("❌ Error calculating dashboard stats:", error);

      setDashboardStats({
        users: { total: 0, active: 0, new_24h: 0, new_7d: 0, growth_rate: 0 },
        itineraries: {
          total: 0,
          completed: 0,
          success_rate: 0,
          new_24h: 0,
          new_7d: 0,
          with_activities: 0,
          with_hotels: 0,
          total_days_planned: 0,
          total_activities_planned: 0,
          avg_days_per_itinerary: 0,
          avg_activities_per_itinerary: 0,
        },
        popular_locations: [],
      });

      setAnalyticsData(null);
      toast.error("Error loading dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching users from multiple data sources...");

      let backendUsers = [];
      let firestoreUsers = [];

      // Try Django backend first
      try {
        console.log("📡 Attempting to fetch users from Django backend...");
        const backendResponse = await fetch(
          `${API_BASE_URL}/api/admin/users/`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          if (backendData.success && backendData.users) {
            backendUsers = backendData.users.map((user, index) => ({
              ...user,
              source: "backend", // ✅ Add source identifier
              display_id: index + 1,
            }));
            console.log("✅ Django backend users loaded:", backendUsers.length);
          }
        }
      } catch (backendError) {
        console.warn(
          "⚠️ Django backend not available for users:",
          backendError.message
        );
      }

      // Fetch from Firestore UserProfiles
      try {
        console.log("🔥 Fetching users from Firestore UserProfiles...");

        const userProfilesRef = collection(db, "UserProfiles");
        const usersQuery = query(userProfilesRef, orderBy("createdAt", "desc"));
        const usersSnapshot = await getDocs(usersQuery);

        const tripsRef = collection(db, "AITrips");
        const tripsSnapshot = await getDocs(tripsRef);

        console.log(`📊 Firestore users found: ${usersSnapshot.size}`);
        console.log(`📊 Firestore trips found: ${tripsSnapshot.size}`);

        const tripStats = {};
        tripsSnapshot.forEach((tripDoc) => {
          const tripData = tripDoc.data();
          const userEmail = tripData.userEmail;

          if (userEmail) {
            if (!tripStats[userEmail]) {
              tripStats[userEmail] = {
                total_trips: 0,
                completed_trips: 0,
                recent_trip: null,
                has_real_flights: 0,
                has_real_hotels: 0,
              };
            }

            tripStats[userEmail].total_trips++;

            if (
              tripData.tripData &&
              Object.keys(tripData.tripData).length > 0
            ) {
              tripStats[userEmail].completed_trips++;
            }

            if (tripData.hasRealFlights) {
              tripStats[userEmail].has_real_flights++;
            }
            if (tripData.hasRealHotels) {
              tripStats[userEmail].has_real_hotels++;
            }

            const tripDate = new Date(tripData.createdAt || tripData.id);
            if (
              !tripStats[userEmail].recent_trip ||
              tripDate > new Date(tripStats[userEmail].recent_trip)
            ) {
              tripStats[userEmail].recent_trip =
                tripData.createdAt || tripData.id;
            }
          }
        });

        let userIndex = backendUsers.length + 1;

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const userEmail = userData.userEmail || doc.id;

          const existsInBackend = backendUsers.some(
            (bu) => bu.email === userEmail
          );

          if (!existsInBackend) {
            const userStats = tripStats[userEmail] || {
              total_trips: 0,
              completed_trips: 0,
              recent_trip: null,
              has_real_flights: 0,
              has_real_hotels: 0,
            };

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
              date_joined:
                userData.createdAt ||
                userData.updatedAt ||
                new Date().toISOString(),
              last_login: userData.updatedAt || null,

              total_trips: userStats.total_trips,
              completed_trips: userStats.completed_trips,
              recent_trip_date: userStats.recent_trip,
              real_flights_booked: userStats.has_real_flights,
              real_hotels_booked: userStats.has_real_hotels,

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

              travel_experience: userData.travelExperience || "",
              dietary_restrictions: userData.dietaryRestrictions || [],
              emergency_contact: userData.emergencyContact?.name || "",
            });
          }
        });
      } catch (firestoreError) {
        console.error("❌ Firestore users fetch error:", firestoreError);
      }

      const allUsers = [...backendUsers, ...firestoreUsers];

      console.log("✅ Combined users data loaded:", {
        backendUsers: backendUsers.length,
        firestoreUsers: firestoreUsers.length,
        totalUsers: allUsers.length,
      });

      setUsers(allUsers);

      const sources = [];
      if (backendUsers.length > 0)
        sources.push(`${backendUsers.length} from Django`);
      if (firestoreUsers.length > 0)
        sources.push(`${firestoreUsers.length} from Firestore`);

      toast.success(`Loaded ${allUsers.length} users (${sources.join(", ")})`);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Trips
  const fetchTrips = async () => {
  setLoading(true);
  try {
    const tripsRef = collection(db, "AITrips");
    const tripsQuery = query(tripsRef, orderBy("createdAt", "desc"));
    const tripsSnapshot = await getDocs(tripsQuery);

    const tripsData = [];
    tripsSnapshot.forEach((doc) => {
      const tripData = doc.data();

      tripsData.push({
        id: doc.id,
        destination:
          tripData.tripData?.destination ||
          tripData.userSelection?.location?.label ||
          tripData.userSelection?.location ||
          "Unknown",
        user_email: tripData.userEmail || "Unknown",
        created_at: tripData.createdAt || new Date().toISOString(),
        duration:
          tripData.userSelection?.duration ||
          tripData.tripData?.duration ||
          "N/A",
        budget:
          tripData.userSelection?.budget ||
          tripData.tripData?.budget ||
          "Not set",
        travelers:
          tripData.userSelection?.travelers ||
          tripData.tripData?.travelers ||
          "Not specified",
        has_itinerary: !!(
          tripData.tripData?.itinerary &&
          Array.isArray(tripData.tripData.itinerary) &&
          tripData.tripData.itinerary.length > 0
        ),
        has_hotels: !!(
          tripData.tripData?.hotels &&
          Array.isArray(tripData.tripData.hotels) &&
          tripData.tripData.hotels.length > 0
        ),
        has_flights: tripData.hasRealFlights || false,
        is_personalized: tripData.isPersonalized || false,
      });
    });

    setTrips(tripsData);
    toast.success(`Loaded ${tripsData.length} trips`);
  } catch (error) {
    console.error("❌ Error fetching trips:", error);
    toast.error("Failed to load trips");
    setTrips([]);
  } finally {
    setLoading(false);
  }
};

  // ✅ Delete User
  const deleteUser = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      toast.error("User not found");
      return;
    }

    const firestoreId = user.firestore_id || user.id;

    if (!firestoreId) {
      toast.error("Cannot delete user: Missing document ID");
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${user.email}"?`))
      return;

    try {
      console.log("🗑️ Deleting user from Firestore:", user.email);

      const userDocRef = doc(db, "UserProfiles", firestoreId);
      await deleteDoc(userDocRef);

      // Delete user's trips
      const tripsRef = collection(db, "AITrips");
      const tripsSnapshot = await getDocs(tripsRef);

      const userTripsToDelete = [];
      tripsSnapshot.forEach((doc) => {
        const tripData = doc.data();
        if (tripData.userEmail === user.email) {
          userTripsToDelete.push(doc.id);
        }
      });

      for (const tripId of userTripsToDelete) {
        const tripDocRef = doc(db, "AITrips", tripId);
        await deleteDoc(tripDocRef);
      }

      setUsers(users.filter((u) => u.id !== userId));
      setTrips(trips.filter((t) => t.user_email !== user.email));

      toast.success(`Successfully deleted user "${user.email}"`);

      if (activeTab === "dashboard") {
        setTimeout(() => fetchDashboardStats(), 1000);
      }
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  // Filtered lists
  const filteredUsers = users.filter((user) => {
    // 1. Search term filter
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Status filter
    if (userFilters.status) {
      const isActive = userFilters.status === "active";
      if (user.is_active !== isActive) return false;
    }

    // 3. User type filter
    if (userFilters.userType) {
      if (userFilters.userType === "staff" && !user.is_staff) return false;
      if (userFilters.userType === "superuser" && !user.is_superuser)
        return false;
      if (
        userFilters.userType === "regular" &&
        (user.is_staff || user.is_superuser)
      )
        return false;
    }

    // 4. Trip activity filter
    if (userFilters.tripActivity) {
      const hasTrips = (user.total_trips || 0) > 0;
      if (userFilters.tripActivity === "has_trips" && !hasTrips) return false;
      if (userFilters.tripActivity === "no_trips" && hasTrips) return false;
    }

    // 5. Date range filter
    if (userFilters.dateRange) {
      const joinDate = new Date(user.date_joined);
      const now = new Date();

      if (userFilters.dateRange === "today") {
        if (joinDate.toDateString() !== now.toDateString()) return false;
      } else if (userFilters.dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (joinDate < weekAgo) return false;
      } else if (userFilters.dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (joinDate < monthAgo) return false;
      }
    }

    return true;
  });

  // Check admin authentication
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

    if (activeTab === "dashboard") {
      fetchDashboardStats();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "trips") {
      fetchTrips();
    }
  }, [activeTab, adminUser]);

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

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-blue-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="brand-gradient p-2 sm:p-3 rounded-full flex-shrink-0">
                <span className="text-white text-lg sm:text-xl">🔐</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold brand-gradient-text truncate">
                  TravelRover Admin
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Welcome, {adminUser?.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          {/* Desktop tabs */}
          <div className="hidden md:flex flex-wrap gap-2 lg:gap-4 mb-4">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm("");
                }}
                className={`px-3 lg:px-6 py-2 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                  activeTab === tab.id
                    ? "brand-gradient text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tab.icon} {tab.label}
              </Button>
            ))}
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchTerm("");
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? "brand-gradient text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <span className="mr-1">{tab.mobile}</span>
                  <span className="hidden xs:inline">{tab.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Search bar and filters */}
          {(activeTab === "users" || activeTab === "trips") && (
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border-sky-200 focus:border-sky-500"
                />
              </div>

              {/* Filter Button (only for users tab) */}
              {activeTab === "users" && (
                <UserFilters
                  filters={userFilters}
                  setFilters={setUserFilters}
                  users={users}
                />
              )}
            </div>
          )}
        </div>

        {/* ✅ DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">
                    Loading dashboard statistics...
                  </p>
                </div>
              </div>
            )}

            {/* Error/Empty State */}
            {!loading && !dashboardStats && (
              <Card className="brand-card p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-xl font-bold brand-gradient-text mb-2">
                  No Statistics Available
                </h2>
                <p className="text-gray-600 mb-4">
                  Unable to load dashboard data. Please try refreshing.
                </p>
                <Button onClick={fetchDashboardStats} className="brand-button">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Dashboard
                </Button>
              </Card>
            )}

            {/* Dashboard Content */}
            {!loading &&
              dashboardStats &&
              dashboardStats.users &&
              dashboardStats.itineraries && (
                <>
                  {/* Overview Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Users Card */}
                    <Card className="brand-card p-4 sm:p-6 border-sky-200">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="brand-gradient p-2 sm:p-3 rounded-full flex-shrink-0">
                          <span className="text-white text-xl sm:text-2xl">
                            👥
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">
                            Total Users
                          </h3>
                          <p className="text-2xl sm:text-3xl font-bold brand-gradient-text truncate">
                            {dashboardStats.users.total || 0}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {dashboardStats.users.django_users
                              ? `${
                                  dashboardStats.users.django_users || 0
                                } Django + ${
                                  dashboardStats.users.firestore_users || 0
                                } Firestore`
                              : `${
                                  dashboardStats.users.new_7d || 0
                                } new this week`}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Itineraries Card */}
                    <Card className="brand-card p-4 sm:p-6 border-sky-200">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-2 sm:p-3 rounded-full flex-shrink-0">
                          <span className="text-white text-xl sm:text-2xl">
                            📋
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">
                            Total Itineraries Generated
                          </h3>
                          <p className="text-2xl sm:text-3xl font-bold text-green-600 truncate">
                            {dashboardStats.itineraries.total || 0}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {dashboardStats.itineraries.completed || 0}{" "}
                            completed (
                            {dashboardStats.itineraries.success_rate || 0}%
                            success)
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* ✅ NEW LAYOUT: Top 3 Popular Destinations (Full Width) */}
                  <Card className="brand-card p-4 sm:p-6 border-sky-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-bold brand-gradient-text">
                        🌍 Top 3 Popular Destinations
                      </h3>
                    </div>

                    {dashboardStats.popular_locations &&
                    dashboardStats.popular_locations.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {dashboardStats.popular_locations.map(
                          (location, index) => (
                            <div
                              key={index}
                              className="relative bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 rounded-2xl border-2 border-sky-200 p-6 flex flex-col items-center justify-center text-center hover:shadow-xl transition-all group hover:scale-105"
                            >
                              {/* Rank Badge */}
                              <div className="absolute top-3 right-3 brand-gradient text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                                #{index + 1}
                              </div>

                              {/* Medal Icon */}
                              <div className="text-5xl sm:text-6xl mb-3">
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                              </div>

                              {/* Location Name */}
                              <div className="font-bold text-gray-800 text-lg sm:text-xl mb-2 group-hover:brand-gradient-text transition-all">
                                {location.location}
                              </div>

                              {/* Trip Count */}
                              <div className="text-sm text-gray-600 font-medium mb-3">
                                {location.count}{" "}
                                {location.count === 1 ? "trip" : "trips"}
                              </div>

                              {/* Percentage Badge */}
                              <div className="px-4 py-2 bg-white rounded-full border-2 border-sky-300 text-sm font-bold brand-gradient-text shadow-md">
                                {location.percentage}% of all trips
                              </div>

                              {/* Decorative Bottom Border */}
                              <div className="absolute bottom-0 left-0 right-0 h-1 brand-gradient rounded-b-2xl"></div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-3">🗺️</div>
                        <p className="text-base font-medium">
                          No destination data available yet
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Start creating trips to see popular destinations
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* ✅ Combined Metrics Card (Full Width Below) */}
                  <Card className="brand-card p-4 sm:p-6 border-sky-200">
                    <h3 className="text-lg sm:text-xl font-bold brand-gradient-text mb-5">
                      📊 Itinerary Metrics Overview
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Section - Activity Stats */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <span className="brand-gradient p-1.5 rounded-lg text-white text-xs">
                            📈
                          </span>
                          Generation Activity
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">📊</div>
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              Active Users
                            </div>
                            <div className="font-bold text-sky-600 text-2xl">
                              {dashboardStats.users.active || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 h-4">
                              {/* Empty space for alignment */}
                            </div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-500 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">✅</div>
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              Completed
                            </div>
                            <div className="font-bold text-green-600 text-2xl">
                              {dashboardStats.itineraries.completed || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 h-4">
                              {/* Empty space for alignment */}
                            </div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">🔄</div>
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              Generated Today
                            </div>
                            <div className="font-bold text-purple-600 text-2xl">
                              {dashboardStats.itineraries.new_24h || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 h-4">
                              {/* Empty space for alignment */}
                            </div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">📈</div>
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              Success Rate
                            </div>
                            <div className="font-bold text-yellow-600 text-2xl">
                              {dashboardStats.itineraries.success_rate || 0}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1 h-4">
                              {/* Empty space for alignment */}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Content Metrics */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <span className="brand-gradient p-1.5 rounded-lg text-white text-xs">
                            📋
                          </span>
                          Content Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">📅</div>
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              Days Planned
                            </div>
                            <div className="font-bold text-indigo-600 text-2xl">
                              {dashboardStats.itineraries.total_days_planned ||
                                0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 h-4">
                              Avg:{" "}
                              {dashboardStats.itineraries
                                .avg_days_per_itinerary || 0}{" "}
                              days
                            </div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">🎯</div>
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              Total Activities
                            </div>
                            <div className="font-bold text-pink-600 text-2xl">
                              {dashboardStats.itineraries
                                .total_activities_planned || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 h-4">
                              Avg:{" "}
                              {dashboardStats.itineraries
                                .avg_activities_per_itinerary || 0}
                            </div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">🎭</div>
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              With Activities
                            </div>
                            <div className="font-bold text-orange-600 text-2xl">
                              {dashboardStats.itineraries.with_activities || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 h-4">
                              {dashboardStats.itineraries.total > 0
                                ? Math.round(
                                    ((dashboardStats.itineraries
                                      .with_activities || 0) /
                                      dashboardStats.itineraries.total) *
                                      100
                                  )
                                : 0}
                              % of total
                            </div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200 hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-2">🏨</div>
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              With Hotels
                            </div>
                            <div className="font-bold text-teal-600 text-2xl">
                              {dashboardStats.itineraries.with_hotels || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 h-4">
                              {dashboardStats.itineraries.total > 0
                                ? Math.round(
                                    ((dashboardStats.itineraries.with_hotels ||
                                      0) /
                                      dashboardStats.itineraries.total) *
                                      100
                                  )
                                : 0}
                              % of total
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* ✅ NEW: Analytics Section */}
                  {analyticsData && (
                    <>
                      {/* Section Header */}
                      <div className="flex items-center justify-between mt-8 mb-4">
                        <h2 className="text-2xl font-bold brand-gradient-text flex items-center gap-3">
                          <span className="brand-gradient p-2 rounded-lg text-white">
                            📈
                          </span>
                          Analytics & Trends
                        </h2>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className={`px-3 py-1 rounded-full font-semibold ${
                                analyticsData.growth.tripsGrowth >= 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {analyticsData.growth.tripsGrowth >= 0
                                ? "↗"
                                : "↘"}{" "}
                              {Math.abs(analyticsData.growth.tripsGrowth)}%
                              Trips
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full font-semibold ${
                                analyticsData.growth.usersGrowth >= 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {analyticsData.growth.usersGrowth >= 0
                                ? "↗"
                                : "↘"}{" "}
                              {Math.abs(analyticsData.growth.usersGrowth)}%
                              Users
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 30-Day Trend Line Chart */}
                      <Card className="brand-card p-4 sm:p-6 border-sky-200">
                        <h3 className="text-lg font-bold brand-gradient-text mb-4">
                          📅 30-Day Activity Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analyticsData.timeSeriesData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#6b7280"
                              style={{ fontSize: "12px" }}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: "12px" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "1px solid #0ea5e9",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="trips"
                              stroke={CHART_COLORS.primary}
                              strokeWidth={3}
                              name="Trips Created"
                              dot={{ fill: CHART_COLORS.primary, r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="users"
                              stroke={CHART_COLORS.success}
                              strokeWidth={3}
                              name="New Users"
                              dot={{ fill: CHART_COLORS.success, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>

                      {/* Weekly Comparison Bar Chart */}
                      <Card className="brand-card p-4 sm:p-6 border-sky-200">
                        <h3 className="text-lg font-bold brand-gradient-text mb-4">
                          📊 Weekly Comparison
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analyticsData.weeklyComparison}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="period"
                              stroke="#6b7280"
                              style={{ fontSize: "12px" }}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: "12px" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "1px solid #0ea5e9",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="trips"
                              fill={CHART_COLORS.primary}
                              name="Trips"
                              radius={[8, 8, 0, 0]}
                            />
                            <Bar
                              dataKey="users"
                              fill={CHART_COLORS.success}
                              name="Users"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>

                      {/* Bottom Row: 3 Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Budget Distribution Pie Chart */}
                        <Card className="brand-card p-4 sm:p-6 border-sky-200">
                          <h3 className="text-base font-bold brand-gradient-text mb-4">
                            💰 Budget Distribution
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={analyticsData.budgetDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {analyticsData.budgetDistribution.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        PIE_COLORS[index % PIE_COLORS.length]
                                      }
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card>

                        {/* Duration Analysis Bar Chart */}
                        <Card className="brand-card p-4 sm:p-6 border-sky-200">
                          <h3 className="text-base font-bold brand-gradient-text mb-4">
                            📅 Trip Duration
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analyticsData.durationData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                              />
                              <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                style={{ fontSize: "10px" }}
                              />
                              <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: "10px" }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                                  border: "1px solid #0ea5e9",
                                  borderRadius: "8px",
                                }}
                              />
                              <Bar
                                dataKey="trips"
                                fill={CHART_COLORS.secondary}
                                radius={[8, 8, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </Card>

                        {/* Travelers Distribution Pie Chart */}
                        <Card className="brand-card p-4 sm:p-6 border-sky-200">
                          <h3 className="text-base font-bold brand-gradient-text mb-4">
                            👥 Travelers Type
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={analyticsData.travelersData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {analyticsData.travelersData.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        PIE_COLORS[index % PIE_COLORS.length]
                                      }
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card>
                      </div>
                    </>
                  )}
                </>
              )}
          </div>
        )}

        {/* ✅ USERS TAB */}
        {activeTab === "users" && !loading && (
          <>
            {/* Filter Summary */}
            {Object.values(userFilters).some(Boolean) && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-400">
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setUserFilters({
                        status: "",
                        userType: "",
                        tripActivity: "",
                        dateRange: "", // ✅ Removed source
                      })
                    }
                    className="text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}

            <Card className="brand-card overflow-hidden border-sky-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Trips
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-500 md:hidden">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 hidden lg:table-cell">
                            {user.total_trips || 0}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <Badge
                              className={
                                user.is_active
                                  ? "bg-green-100 text-green-700 border-green-300"
                                  : "bg-gray-100 text-gray-700 border-gray-300"
                              }
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteUser(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

           {/* ✅ ENHANCED TRIPS TAB */}
        {activeTab === "trips" && !loading && (
          <>
            {/* Search Bar for Trips */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search trips by destination or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border-sky-200 focus:border-sky-500"
                />
              </div>
            </div>

            <Card className="brand-card overflow-hidden border-sky-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">
                        Budget
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">
                        Travelers
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trips.filter((trip) =>
                      searchTerm
                        ? trip.destination
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          trip.user_email
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        : true
                    ).length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-4 py-12 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-5xl">🔍</div>
                            <p className="font-medium">No trips found</p>
                            {searchTerm && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchTerm("")}
                                className="border-sky-500 text-sky-700 hover:bg-sky-50 cursor-pointer"
                              >
                                Clear search
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      trips
                        .filter((trip) =>
                          searchTerm
                            ? trip.destination
                                ?.toLowerCase()
                                .includes(searchTerm.toLowerCase()) ||
                              trip.user_email
                                ?.toLowerCase()
                                .includes(searchTerm.toLowerCase())
                            : true
                        )
                        .map((trip) => (
                          <tr
                            key={trip.id}
                            className="hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-colors"
                          >
                            {/* Destination */}
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                  <span>📍</span>
                                  {trip.destination}
                                </div>
                                <div className="text-sm text-gray-500 md:hidden">
                                  {trip.user_email}
                                </div>
                              </div>
                            </td>

                            {/* User Email */}
                            <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <span className="text-base">👤</span>
                                {trip.user_email}
                              </div>
                            </td>

                            {/* Duration */}
                            <td className="px-4 py-3 text-sm font-medium text-gray-700 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <span className="text-base">📅</span>
                                {trip.duration} days
                              </div>
                            </td>

                            {/* Budget */}
                            <td className="px-4 py-3 text-sm font-medium text-gray-700 hidden xl:table-cell">
                              <div className="flex items-center gap-2">
                                <span className="text-base">💰</span>
                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                  {trip.budget}
                                </span>
                              </div>
                            </td>

                            {/* Travelers */}
                            <td className="px-4 py-3 text-sm font-medium text-gray-700 hidden xl:table-cell">
                              <div className="flex items-center gap-2">
                                <span className="text-base">👥</span>
                                {trip.travelers}
                              </div>
                            </td>

                            {/* Created Date */}
                            <td className="px-4 py-3 text-sm text-gray-600 hidden xl:table-cell">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🕒</span>
                                {new Date(trip.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </td>

                            {/* Status - Simplified */}
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <Badge
                                className={
                                  trip.has_itinerary
                                    ? "bg-green-100 text-green-700 border-green-300 font-semibold"
                                    : "bg-gray-100 text-gray-700 border-gray-300 font-semibold"
                                }
                              >
                                {trip.has_itinerary ? "✓ Complete" : "⚠ Incomplete"}
                              </Badge>
                            </td>

                            {/* Actions - View Only */}
                            <td className="px-4 py-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/view-trip/${trip.id}`)}
                                className="border-sky-500 text-sky-700 hover:bg-sky-50 cursor-pointer"
                                title="View trip details"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Trip Count */}
              {trips.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">
                      {trips.filter((trip) =>
                        searchTerm
                          ? trip.destination
                              ?.toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            trip.user_email
                              ?.toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          : true
                      ).length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {trips.length}
                    </span>{" "}
                    trips
                  </span>
                  <div className="text-sm text-gray-500">
                    {trips.filter((t) => t.has_itinerary).length} completed
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* API KEYS TAB */}
        {activeTab === "apikeys" && !loading && <APIKeyMonitoring />}
      </div>
    </div>
  );
};

export default Admin;
