import { Button } from "@/components/ui/button";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { googleLogout } from "@react-oauth/google";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { useNavigate } from "react-router-dom";

function Header() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    console.log(user);
  }, [user]);

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResp) => getUserProfile(codeResp),
    onError: (error) => {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
    },
  });

  const getUserProfile = useCallback(
    async (tokenInfo) => {
      setIsLoggingIn(true);
      try {
        const response = await axios.get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo?.access_token}`,
              Accept: "application/json",
            },
          }
        );

        const userData = response.data;

        // Check if user has a profile in Firestore
        try {
          if (userData.email) {
            const docRef = doc(db, "UserProfiles", userData.email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const profileData = docSnap.data();
              // If user has a complete profile, mark it in userData
              if (profileData && profileData.isProfileComplete) {
                userData.hasProfile = true;
              }
            }
          }
        } catch (profileError) {
          console.warn("Could not check user profile:", profileError);
          // Continue with login even if profile check fails
          // Default to no profile if there's an error
          userData.hasProfile = false;
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setOpenDialog(false);
        toast.success("Successfully signed in!");

        // Redirect based on profile status
        if (userData.hasProfile) {
          // User has a profile, redirect to home page
          toast.success("Welcome back! Taking you to the homepage...");
          setTimeout(() => navigate("/home"), 1000);
        } else {
          // First-time user or incomplete profile, redirect to user profile
          toast.success("Welcome! Let's set up your travel profile...");
          setTimeout(() => navigate("/user-profile"), 1000);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to get user profile");
      } finally {
        setIsLoggingIn(false);
      }
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    googleLogout();
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <div className="px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div
          className="flex items-center cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <img
            src="/logo.svg"
            alt="Logo"
            className="h-12 w-auto transition-transform duration-200 group-hover:scale-105"
          />
          <span className="ml-3 text-2xl font-black brand-gradient-text">
            Travel Rover
          </span>
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="rounded-full cursor-pointer font-medium text-gray-600 hover:text-sky-600 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-all duration-200"
                onClick={() => navigate("/home")}
              >
                Home
              </Button>
              <Button
                variant="ghost"
                className="rounded-full cursor-pointer font-medium text-gray-600 hover:text-sky-600 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-all duration-200"
                onClick={() => navigate("/my-trips")}
              >
                My Trips
              </Button>
              <span className="text-gray-700 font-medium text-sm">
                Hello,{" "}
                <span className="text-sky-600 font-semibold">
                  {user?.given_name ||
                    user?.name?.trim().split(" ")[0] ||
                    "there"}
                </span>
                !
              </span>
              <Popover>
                <PopoverTrigger>
                  <div className="relative">
                    <img
                      src={user?.picture}
                      className="h-[35px] w-[35px] rounded-full cursor-pointer border-2 border-sky-200 hover:border-sky-400 transition-all duration-200 shadow-sm"
                      alt="Profile"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl p-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">
                      {user?.name}
                    </span>
                    <span className="text-sm text-gray-500">{user?.email}</span>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      variant="ghost"
                      className="w-full text-left cursor-pointer hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 hover:text-sky-600 transition-all duration-200 rounded-lg"
                      onClick={() => navigate("/settings")}
                    >
                      ⚙️ Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-left cursor-pointer hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-lg"
                      onClick={handleLogout}
                    >
                      🚪 Logout
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Button
              onClick={() => setOpenDialog(true)}
              disabled={isLoggingIn}
              className="brand-button px-6 py-2"
            >
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center">
              <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
              <span className="ml-3 text-xl font-black brand-gradient-text">
                Travel Rover
              </span>
            </DialogTitle>

            <DialogDescription className="mt-3 text-sm text-gray-600 text-center">
              Sign in to save your trips and access them from any device.
            </DialogDescription>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">
                Start Your Journey
              </h2>
              <Button
                className="w-full mt-4 flex gap-3 items-center justify-center brand-button py-3"
                onClick={() => googleLogin()}
                disabled={isLoggingIn}
              >
                <FcGoogle className="text-xl" />
                {isLoggingIn ? "Signing in..." : "Sign In With Google"}
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Header;
