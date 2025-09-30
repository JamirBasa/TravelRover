import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FaLock, FaUser, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Check if admin is already logged in
  useEffect(() => {
    const adminUser = localStorage.getItem("adminUser");
    if (adminUser) {
      try {
        const adminData = JSON.parse(adminUser);
        
        // Check if session is still valid (8 hours)
        if (adminData.expiresAt && new Date(adminData.expiresAt) > new Date()) {
          navigate("/admin");
        } else {
          // Session expired, clear it
          localStorage.removeItem("adminUser");
        }
      } catch (error) {
        console.error("Invalid admin session:", error);
        localStorage.removeItem("adminUser");
      }
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!credentials.username.trim() || !credentials.password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    // Simulate network delay for security
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Default admin credentials
      const defaultUsername = "admin";
      const defaultPassword = "admin";

      // Enhanced security checks
      const currentHour = new Date().getHours();
      const isBusinessHours = currentHour >= 3 && currentHour <= 23;

      if (!isBusinessHours) {
        toast.error("Admin access is restricted during off-hours (3 AM - 11 PM)");
        setIsLoading(false);
        return;
      }

      if (credentials.username === defaultUsername && credentials.password === defaultPassword) {
        // Create admin session
        const adminSession = {
          username: credentials.username,
          role: "admin",
          loginTime: new Date().toISOString(),
          sessionId: Math.random().toString(36).substring(2, 15),
          isAdmin: true,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
          lastActivity: new Date().toISOString(),
          loginIP: "localhost", // In production, get actual IP
        };
        
        localStorage.setItem("adminUser", JSON.stringify(adminSession));
        
        toast.success("Admin login successful! Welcome back.", {
          description: "Redirecting to admin dashboard..."
        });
        
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
        
      } else {
        // Rate limiting simulation
        toast.error("Invalid credentials. Access denied.", {
          description: "Please check your username and password."
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl">
              <FaLock className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-blue-200 text-lg">
              Secure access to TravelRover administration
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <FaUser className="inline mr-2" />
                  Username
                </label>
                <Input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleInputChange}
                  placeholder="Enter admin username"
                  required
                  autoComplete="username"
                  className="w-full h-12 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:border-blue-400 focus:ring-blue-400/50 rounded-xl"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <FaLock className="inline mr-2" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    placeholder="Enter admin password"
                    required
                    autoComplete="current-password"
                    className="w-full h-12 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:border-blue-400 focus:ring-blue-400/50 rounded-xl pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white h-8 w-8 p-0"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
                <p className="text-xs text-yellow-200 text-center">
                  🔒 Admin access is monitored and logged for security purposes
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Authenticating...
                  </div>
                ) : (
                  "Sign In to Admin Panel"
                )}
              </Button>
            </form>

            {/* Default Credentials Info - Development Only */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                <p className="text-xs text-blue-200 text-center">
                  <strong>Development Mode:</strong><br/>
                  Username: <code className="bg-black/30 px-1 rounded">admin</code> | 
                  Password: <code className="bg-black/30 px-1 rounded">admin</code>
                </p>
              </div>
            )}
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <FaArrowLeft className="mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-400 text-sm">
            <p>TravelRover Admin Portal © {new Date().getFullYear()}</p>
            <p className="text-xs mt-1">Secure • Monitored • Protected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;