import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { API_CONFIG } from "../../config/apiConfig";
import {
  FaKey,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaCog,
  FaChartLine,
  FaBolt,
  FaCloud,
  FaDatabase,
  FaRobot,
  FaSync,
  FaRedo,
  FaUndo,
  FaSyncAlt,
  FaPause,
  FaPlay,
  FaInfoCircle,
} from "react-icons/fa";
import { ExternalLink } from "lucide-react"; // ✅ TravelRover standard icon

const APIKeyMonitoring = () => {
  // State management following TravelRover patterns
  const [apiKeys, setApiKeys] = useState({});
  const [systemHealth, setSystemHealth] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  // API base URL from TravelRover config
  const API_BASE_URL = API_CONFIG.BASE_URL || "http://localhost:8000";

  // Fetch API key statuses - following TravelRover async patterns
  const fetchAPIKeyStatus = async (showToast = false) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/admin/api-keys/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setApiKeys(data.api_keys || {});
          setSystemHealth(data.system_health || null);
          setRecommendations(data.recommendations || []);
          setLastUpdated(new Date().toLocaleString());

          if (showToast) {
            toast.success("🔄 API key status updated successfully");
          }
        } else {
          throw new Error(data.error || "Failed to fetch API status");
        }
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error fetching API key status:", error);
      toast.error(`Failed to fetch API status: ${error.message}`);

      // Show fallback data for development
      setApiKeys({
        serpapi: {
          service: "serpapi",
          status: "error",
          health: "error",
          message: "Backend not available - check Django server",
          last_checked: new Date().toISOString(),
        },
        google_places: {
          service: "google_places",
          status: "not_configured",
          health: "warning",
          message: "Backend not available - check Django server",
          last_checked: new Date().toISOString(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh mechanism following TravelRover patterns
  useEffect(() => {
    if (autoRefresh) {
      fetchAPIKeyStatus();
      intervalRef.current = setInterval(() => {
        fetchAPIKeyStatus();
      }, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  // UI helper functions following TravelRover patterns
  const getStatusIcon = (health) => {
    switch (health) {
      case "healthy":
        return <FaCheckCircle className="text-green-500" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      case "error":
      case "critical":
        return <FaTimesCircle className="text-red-500" />;
      case "info":
        return <FaInfoCircle className="text-blue-500" />;
      default:
        return <FaCog className="text-gray-500" />;
    }
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case "serpapi":
        return <FaBolt className="text-blue-600" />;
      case "google_places":
        return <FaCloud className="text-green-600" />;
      case "google_gemini":
        return <FaRobot className="text-purple-600" />;
      case "firebase":
        return <FaDatabase className="text-orange-600" />;
      default:
        return <FaKey className="text-gray-600" />;
    }
  };

  // Enhanced health badge with better status mapping
  const getHealthBadge = (health, status) => {
    const badgeClasses = {
      healthy: "bg-green-100 text-green-800 border-green-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      error: "bg-red-100 text-red-800 border-red-200",
      critical: "bg-red-100 text-red-800 border-red-200",
      info: "bg-blue-100 text-blue-800 border-blue-200",
    };

    const statusText = {
      active: "Active",
      active_unmonitored: "Active",
      active_warning: "Active (Warning)",
      near_limit: "Near Quota Limit",
      high_usage: "High Usage",
      quota_exceeded: "Quota Exceeded",
      not_configured: "Not Configured",
      error: "Error",
      access_denied: "Access Denied",
      configured: "Configured",
      partial_config: "Partially Configured",
      monitoring_error: "Monitoring Error",
    };

    return (
      <Badge
        className={`${
          badgeClasses[health] || "bg-gray-100 text-gray-800 border-gray-200"
        } border`}
      >
        {statusText[status] || status}
      </Badge>
    );
  };

  const formatServiceName = (service) => {
    const names = {
      serpapi: "SerpAPI (Flight Search)",
      google_places: "Google Places API",
      google_gemini: "Google Gemini AI",
      firebase: "Firebase Configuration",
    };
    return names[service] || service.toUpperCase();
  };

  // Manual refresh and auto-refresh controls
  const handleManualRefresh = () => {
    setLoading(true);
    fetchAPIKeyStatus(true);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(
      autoRefresh ? "⏸️ Auto-refresh paused" : "▶️ Auto-refresh enabled"
    );
  };

  // Loading state following TravelRover patterns
  if (loading && Object.keys(apiKeys).length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div
              className="rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
              style={{ animation: "spin 1s linear infinite" }}
            ></div>
            <p className="text-gray-600">🔍 Checking API key status...</p>
            <p className="text-gray-500 text-sm mt-2">
              Connecting to monitoring service
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls - TravelRover admin styling */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaKey className="text-blue-600" />
            API Key Monitoring
          </h2>
          <p className="text-gray-600">
            Real-time monitoring of TravelRover's external API integrations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={toggleAutoRefresh}
            variant={autoRefresh ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {autoRefresh ? <FaPause /> : <FaPlay />}
            {autoRefresh ? "Pause" : "Resume"} Auto-refresh
          </Button>

          <Button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <div
              style={loading ? { animation: "spin 1s linear infinite" } : {}}
            >
              <FaSync />
            </div>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Health Overview Card */}
      {systemHealth && (
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaChartLine className="text-blue-600" />
                System Health Overview
              </h3>
              {lastUpdated && (
                <div className="text-sm text-gray-500">
                  Last updated: {lastUpdated}
                  {autoRefresh && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm text-gray-600 mb-1">Healthy</div>
                <div className="font-bold text-green-600 text-xl">
                  {systemHealth.healthy_services || 0}
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-sm text-gray-600 mb-1">Warning</div>
                <div className="font-bold text-yellow-600 text-xl">
                  {systemHealth.warning_services || 0}
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="text-2xl mb-2">❌</div>
                <div className="text-sm text-gray-600 mb-1">Error</div>
                <div className="font-bold text-red-600 text-xl">
                  {systemHealth.error_services || 0}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-2xl mb-2">🚨</div>
                <div className="text-sm text-gray-600 mb-1">Critical</div>
                <div className="font-bold text-purple-600 text-xl">
                  {systemHealth.critical_services || 0}
                </div>
              </div>
            </div>

            {/* Overall Status Display */}
            <div className="text-center">
              <div
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${
                  systemHealth.overall_status === "healthy"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : systemHealth.overall_status === "warning"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : systemHealth.overall_status === "error"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {getStatusIcon(systemHealth.overall_status)}
                <span>{systemHealth.message || "System Status Unknown"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Key Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(apiKeys).map(([service, keyData]) => (
          <Card
            key={service}
            className="border-2 hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getServiceIcon(service)}</div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {formatServiceName(service)}
                    </h3>
                    <p className="text-sm text-gray-600">{keyData.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(keyData.health)}
                  {getHealthBadge(keyData.health, keyData.status)}
                </div>
              </div>

              {/* Enhanced Usage Information */}
              {keyData.usage && keyData.usage.percentage !== undefined && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Monthly Usage
                    </span>
                    <span className="text-sm text-gray-600">
                      {keyData.usage.percentage}%
                    </span>
                  </div>

                  <Progress
                    value={keyData.usage.percentage}
                    className="mb-3 h-3"
                  />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {keyData.usage.used !== undefined && (
                      <div>
                        <span className="text-gray-600">Used:</span>
                        <span className="font-medium ml-1">
                          {keyData.usage.used.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {keyData.usage.remaining !== undefined && (
                      <div>
                        <span className="text-gray-600">Remaining:</span>
                        <span className="font-medium ml-1 text-green-600">
                          {keyData.usage.remaining.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Monitoring Links */}
              {keyData.usage && keyData.usage.monitoring_url && (
                <div className="mb-4">
                  <Button
                    onClick={() =>
                      window.open(keyData.usage.monitoring_url, "_blank")
                    }
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 w-full"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Real-time Usage Dashboard
                  </Button>
                </div>
              )}

              {/* Service Details */}
              {keyData.limits && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                    <FaInfoCircle className="text-blue-500" />
                    Usage Limits & Details
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {Object.entries(keyData.limits).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="font-medium text-gray-800">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Checked */}
              <div className="text-xs text-gray-500 mt-4 pt-3 border-t">
                🕐 Last checked:{" "}
                {new Date(keyData.last_checked).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations Panel */}
      {recommendations.length > 0 && (
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartLine className="text-amber-600" />
              Smart Recommendations
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-l-4 ${
                    rec.priority === "high"
                      ? "border-red-500 bg-red-50"
                      : rec.priority === "medium"
                      ? "border-yellow-500 bg-yellow-50"
                      : rec.priority === "low"
                      ? "border-sky-500 bg-sky-50"
                      : "border-green-500 bg-green-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-1">
                        {rec.title}
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">
                        {rec.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        Service:{" "}
                        <span className="font-medium">
                          {formatServiceName(rec.service)}
                        </span>
                      </p>
                    </div>
                    <Badge
                      className={`ml-3 ${
                        rec.priority === "high"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : rec.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : rec.priority === "low"
                          ? "bg-sky-100 text-sky-800 border-sky-200"
                          : "bg-green-100 text-green-800 border-green-200"
                      } border`}
                    >
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === "development" && (
        <Card className="border border-gray-300 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <FaCog />
              <span>
                <strong>Dev Mode:</strong> Real-time monitoring every 30s •
                Backend: {API_BASE_URL}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default APIKeyMonitoring;
