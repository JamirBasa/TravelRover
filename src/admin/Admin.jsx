import APIKeyMonitoring from "./components/APIKeyMonitoring";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Menu, X, Search, RefreshCw } from "lucide-react";

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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // ...existing functions remain the same...
  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.overview);
        console.log("📊 Dashboard stats loaded:", data.overview);
      } else {
        console.error("Failed to fetch dashboard stats");
        toast.error("Failed to load dashboard statistics");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from Django backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        console.log("👥 Users loaded:", data.users?.length);
        toast.success(`Loaded ${data.users?.length || 0} users`);
      } else {
        console.error("Failed to fetch users");
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  // Fetch trips from Django backend
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/trips/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
       if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
        console.log("✈️ Trips loaded:", data.trips?.length);
        toast.success(`Loaded ${data.trips?.length || 0} trips`);
      } else {
        console.error("Failed to fetch trips");
        toast.error("Failed to load trips");
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents data from Django backend
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

  // Delete user
  const deleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their trips.")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        toast.success("User deleted successfully");
        // Refresh data
        if (activeTab === "users") fetchUsers();
        if (activeTab === "dashboard") fetchDashboardStats();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    }
  };

  // Delete trip
  const deleteTrip = async (tripId) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/trips/${tripId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        setTrips(trips.filter(trip => trip.id !== tripId));
        alert("Trip deleted successfully");
      } else {
        alert("Failed to delete trip");
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      alert("Error deleting trip");
    }
  };

  // ADMIN AUTHENTICATION
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

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully!");
    navigate("/admin/login");
  };

  // Check admin authentication on component mount
  useEffect(() => {
    checkAdminAuth();
  }, []);

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
  }, [activeTab, adminUser]);

  // Filter data based on search term
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrips = trips.filter(trip => 
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
    { id: "apikeys", label: "API Keys", icon: "🔑", mobile: "🔑" }
  ];

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium text-sm sm:text-base">Verifying admin access...</p>
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
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
              <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading...</span>
            </div>
          )}
        </div>

        {/* Dashboard Tab - Responsive Grid */}
        {activeTab === "dashboard" && !loading && dashboardStats && (
          <div className="space-y-4 sm:space-y-6">
            {/* Overview Cards - Responsive Grid */}
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
                      {dashboardStats.users.new_7d} new this week
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

            {/* System Status - Responsive Grid */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">System Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              </div>
            </Card>
          </div>
        )}

        {/* Users Management Tab - Responsive Table */}
        {activeTab === "users" && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Users ({filteredUsers.length})
              </h2>
              <Button 
                onClick={fetchUsers}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white self-start sm:self-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {user.first_name || user.last_name 
                            ? `${user.first_name} ${user.last_name}`.trim()
                            : user.username || "N/A"
                          }
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      </div>
                      <Badge className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span> {user.id}
                      </div>
                      <div>
                        <span className="text-gray-500">Joined:</span> {new Date(user.date_joined).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <Badge className="bg-blue-100 text-blue-800">
                          {user.total_trips} trips
                        </Badge>
                        {user.is_staff && (
                          <Badge className="bg-purple-100 text-purple-800 ml-1">
                            Staff
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => deleteUser(user.id)}
                        disabled={user.is_superuser}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        {user.is_superuser ? "Protected" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trips</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{user.id}</td>
                      <td className="px-4 py-3 text-sm truncate max-w-xs">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        {user.first_name || user.last_name 
                          ? `${user.first_name} ${user.last_name}`.trim()
                          : user.username || "N/A"
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className="bg-blue-100 text-blue-800">
                          {user.total_trips} total / {user.completed_trips} completed
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          <Badge className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {user.is_staff && (
                            <Badge className="bg-purple-100 text-purple-800">
                              Staff
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          onClick={() => deleteUser(user.id)}
                          disabled={user.is_superuser}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                        >
                          {user.is_superuser ? "Protected" : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-lg font-medium mb-2">No users found</p>
                <p className="text-sm">Make sure your Django backend is running on {API_BASE_URL}</p>
              </div>
            )}
          </div>
        )}

        {/* Trips Management Tab - Responsive Cards */}
        {activeTab === "trips" && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Trips ({filteredTrips.length})
              </h2>
              <Button 
                onClick={fetchTrips}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white self-start sm:self-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="p-4 sm:p-5 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-800 line-clamp-2">
                        {trip.destination}
                      </h3>
                      <Badge className={
                        trip.status === 'completed' ? "bg-green-100 text-green-800" :
                        trip.status === 'failed' ? "bg-red-100 text-red-800" :
                        trip.status === 'running' ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }>
                        {trip.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <div><strong>User:</strong></div>
                        <div className="truncate">{trip.user_email}</div>
                        
                        <div><strong>Duration:</strong></div>
                        <div>{trip.duration} days</div>
                        
                        <div><strong>Budget:</strong></div>
                        <div className="truncate">{trip.budget}</div>
                        
                        <div><strong>Travelers:</strong></div>
                        <div>{trip.travelers}</div>
                        
                        <div><strong>Score:</strong></div>
                        <div>{trip.optimization_score}/100</div>
                        
                        <div><strong>Created:</strong></div>
                        <div>{new Date(trip.created_at).toLocaleDateString()}</div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 pt-2">
                        {trip.flight_search_completed && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">✈️ Flights</Badge>
                        )}
                        {trip.hotel_search_completed && (
                          <Badge className="bg-green-100 text-green-800 text-xs">🏨 Hotels</Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => deleteTrip(trip.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      Delete Trip
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {filteredTrips.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">✈️</div>
                <p className="text-lg font-medium mb-2">No trips found</p>
                <p className="text-sm">Make sure your Django backend is running on {API_BASE_URL}</p>
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
                          {agentType === 'coordinator' ? '🎯' : 
                           agentType === 'flight' ? '✈️' : '🏨'}
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
                      <p className="text-gray-600 text-xs sm:text-sm">{agentData.description}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Total Executions</p>
                          <p className="text-sm sm:text-base font-bold text-blue-600">
                            {agentData.total_executions}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Success Rate</p>
                          <p className="text-sm sm:text-base font-bold text-green-600">
                            {agentData.success_rate}%
                          </p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">24h Activity</p>
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
                <h3 className="text-lg sm:text-xl font-semibold mb-4">System Metrics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl sm:text-2xl mb-2">📊</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Sessions</div>
                    <div className="font-bold text-blue-600 text-sm sm:text-base">
                      {agents.system_metrics.total_sessions}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div className="text-xl sm:text-2xl mb-2">✅</div>
                    <div className="text-xs sm:text-sm text-gray-600">Completed</div>
                    <div className="font-bold text-green-600 text-sm sm:text-base">
                      {agents.system_metrics.completed_sessions}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                    <div className="text-xl sm:text-2xl mb-2">🔄</div>
                    <div className="text-xs sm:text-sm text-gray-600">24h Activity</div>
                    <div className="font-bold text-yellow-600 text-sm sm:text-base">
                      {agents.system_metrics.sessions_24h}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                    <div className="text-xl sm:text-2xl mb-2">❌</div>
                    <div className="text-xs sm:text-sm text-gray-600">Failed</div>
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
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Recent Agent Executions</h3>
                
                {/* Mobile Cards View */}
                <div className="lg:hidden space-y-3">
                  {agents.recent_logs.slice(0, 10).map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          {log.agent_type}
                        </Badge>
                        <Badge className={
                          log.status === 'completed' ? "bg-green-100 text-green-800" :
                          log.status === 'failed' ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {log.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><strong>Destination:</strong> {log.destination}</div>
                        <div><strong>User:</strong> {log.user_email}</div>
                        <div><strong>Time:</strong> {new Date(log.started_at).toLocaleString()}</div>
                        <div><strong>Duration:</strong> {log.execution_time_ms ? `${log.execution_time_ms}ms` : 'N/A'}</div>
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
                            <Badge className={
                              log.status === 'completed' ? "bg-green-100 text-green-800" :
                              log.status === 'failed' ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {log.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 truncate max-w-xs">{log.destination}</td>
                          <td className="px-3 py-2 truncate max-w-xs">{log.user_email}</td>
                          <td className="px-3 py-2">
                            {new Date(log.started_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            {log.execution_time_ms ? `${log.execution_time_ms}ms` : 'N/A'}
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
                onClick={() => window.open(`${API_BASE_URL}/admin/`, '_blank')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                size="sm"
              >
                Open Django Admin Panel
              </Button>
            </div>
          </div>
        )}
        
        {/* API Keys Monitoring Tab */}
        {activeTab === "apikeys" && !loading && (
          <APIKeyMonitoring />
        )}
      </div>
    </div>
  );
};

export default Admin;