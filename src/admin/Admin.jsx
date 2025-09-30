import APIKeyMonitoring from "./components/APIKeyMonitoring";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  const navigate = useNavigate();

  // API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const AdminHeader = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  return (
    <div className="bg-gray-900 text-white px-6 py-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <h1 className="text-xl font-bold">TravelRover Admin</h1>
        </div>
        <Button 
          onClick={handleLogout}
          variant="outline" 
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Verifying admin access...</p>
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
      {/* Admin Header */}
      <div className="bg-white shadow-lg border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
                <span className="text-white text-xl">🔐</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">TravelRover Admin Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {adminUser?.username} | Session Active
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Back to Site
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex space-x-4 mb-4">
            <Button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📊 Dashboard
            </Button>
            <Button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "users"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              👥 Users Management
            </Button>
            <Button
              onClick={() => setActiveTab("trips")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "trips"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ✈️ Trips Management
            </Button>
            <Button
              onClick={() => setActiveTab("agents")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "agents"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              🤖 LangGraph Agents
            </Button>
            {/* ✅ API Keys tab */}
            <Button
              onClick={() => setActiveTab("apikeys")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "apikeys"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              🔑 API Keys
            </Button>
          </div>

          {/* Search Bar for users and trips */}
          {(activeTab === "users" || activeTab === "trips") && (
            <div className="mb-4">
              <Input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && !loading && dashboardStats && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Total Users</h3>
                    <p className="text-3xl font-bold text-blue-600">{dashboardStats.users.total}</p>
                    <p className="text-sm text-gray-600">
                      {dashboardStats.users.new_7d} new this week
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <span className="text-2xl">✈️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Total Trips</h3>
                    <p className="text-3xl font-bold text-green-600">{dashboardStats.trips.total}</p>
                    <p className="text-sm text-gray-600">
                      {dashboardStats.trips.success_rate}% success rate
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Agent Executions</h3>
                    <p className="text-3xl font-bold text-purple-600">{dashboardStats.agents.total_executions}</p>
                    <p className="text-sm text-gray-600">
                      {dashboardStats.agents.success_rate}% success rate
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Est. Revenue</h3>
                    <p className="text-3xl font-bold text-orange-600">
                      ₱{dashboardStats.revenue.total_estimated.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₱{dashboardStats.revenue.average_trip_value} avg/trip
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* System Status */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">System Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🟢</div>
                  <div className="text-sm text-gray-600">Backend Status</div>
                  <div className="font-semibold text-green-600">Online</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="text-sm text-gray-600">Recent Activity</div>
                  <div className="font-semibold text-blue-600">
                    {dashboardStats.trips.new_24h} trips today
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-sm text-gray-600">AI Agents</div>
                  <div className="font-semibold text-purple-600">Active</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === "users" && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Users ({filteredUsers.length})</h2>
              <Button 
                onClick={fetchUsers}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Refresh
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Trips</th>
                    <th className="px-4 py-2 text-left">Date Joined</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{user.id}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">
                        {user.first_name || user.last_name 
                          ? `${user.first_name} ${user.last_name}`.trim()
                          : user.username || "N/A"
                        }
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {user.total_trips} total / {user.completed_trips} completed
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <Badge className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {user.is_staff && (
                          <Badge className="bg-purple-100 text-purple-800 ml-1">
                            Staff
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          onClick={() => deleteUser(user.id)}
                          disabled={user.is_superuser}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 disabled:opacity-50"
                        >
                          {user.is_superuser ? "Protected" : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found. Make sure your Django backend is running on {API_BASE_URL}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trips Management Tab */}
        {activeTab === "trips" && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Trips ({filteredTrips.length})</h2>
              <Button 
                onClick={fetchTrips}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{trip.destination}</h3>
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
                    <p><strong>User:</strong> {trip.user_email}</p>
                    <p><strong>Duration:</strong> {trip.duration} days</p>
                    <p><strong>Budget:</strong> {trip.budget}</p>
                    <p><strong>Travelers:</strong> {trip.travelers}</p>
                    <p><strong>Est. Cost:</strong> ₱{trip.total_estimated_cost.toLocaleString()}</p>
                    <p><strong>Score:</strong> {trip.optimization_score}/100</p>
                    <p><strong>Created:</strong> {new Date(trip.created_at).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      {trip.flight_search_completed && <Badge className="bg-blue-100 text-blue-800 text-xs">✈️</Badge>}
                      {trip.hotel_search_completed && <Badge className="bg-green-100 text-green-800 text-xs">🏨</Badge>}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button
                      onClick={() => deleteTrip(trip.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {filteredTrips.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No trips found. Make sure your Django backend is running on {API_BASE_URL}
              </div>
            )}
          </div>
        )}

        {/* LangGraph Agents Tab */}
        {activeTab === "agents" && !loading && (
          <div className="space-y-6">
            {/* Agent Status Cards */}
            {agents.agents && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(agents.agents).map(([agentType, agentData]) => (
                  <Card key={agentType} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <span className="text-xl">
                          {agentType === 'coordinator' ? '🎯' : 
                           agentType === 'flight' ? '✈️' : '🏨'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{agentData.name}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {agentData.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">{agentData.description}</p>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <p className="font-medium">Total Executions</p>
                          <p className="text-lg font-bold text-blue-600">
                            {agentData.total_executions}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Success Rate</p>
                          <p className="text-lg font-bold text-green-600">
                            {agentData.success_rate}%
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">24h Activity</p>
                          <p className="text-lg font-bold text-purple-600">
                            {agentData.executions_24h}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Avg Time</p>
                          <p className="text-lg font-bold text-orange-600">
                            {Math.round(agentData.average_execution_time_ms)}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* System Metrics */}
            {agents.system_metrics && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">System Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                    <div className="font-bold text-blue-600">{agents.system_metrics.total_sessions}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="font-bold text-green-600">{agents.system_metrics.completed_sessions}</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl mb-2">🔄</div>
                    <div className="text-sm text-gray-600">24h Activity</div>
                    <div className="font-bold text-yellow-600">{agents.system_metrics.sessions_24h}</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl mb-2">❌</div>
                    <div className="text-sm text-gray-600">Failed</div>
                    <div className="font-bold text-red-600">{agents.system_metrics.failed_sessions}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Execution Logs */}
            {agents.recent_logs && agents.recent_logs.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Agent Executions</h3>
                <div className="overflow-x-auto">
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
                          <td className="px-3 py-2">{log.destination}</td>
                          <td className="px-3 py-2">{log.user_email}</td>
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
            <div className="mt-6">
              <Button 
                onClick={() => window.open(`${API_BASE_URL}/admin/`, '_blank')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                Open Django Admin Panel
              </Button>
            </div>
          </div>
        )}
        
        {/* ✅ API Keys Monitoring Tab */}
            {activeTab === "apikeys" && !loading && (
            <APIKeyMonitoring />
        )}
      </div>
    </div>
  );
};

export default Admin;