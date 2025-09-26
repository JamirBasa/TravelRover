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
          // User has a profile, redirect to homepage
          toast.success("Welcome back! Taking you to the homepage...");
          setTimeout(() => navigate("/"), 1000);
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
    <div className="p-4 shadow-md flex justify-between items-center px-8 bg-white sticky top-0 z-10">
      <div className="flex items-center">
        <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
        <span className="ml-2 text-xl font-bold text-gray-800">
          Travel Rover
        </span>
      </div>
      <div>
        {user ? (
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              className="rounded-full cursor-pointer"
              onClick={() => navigate("/my-trips")}
            >
              My Trips
            </Button>

            {/* Added greeting here */}
            <span className="text-gray-700 font-medium">
              Hello,{" "}
              {user?.given_name || user?.name?.trim().split(" ")[0] || "there"}!
            </span>

            <Popover>
              <PopoverTrigger>
                <img
                  src={user?.picture}
                  className="h-[35px] w-[35px] rounded-full cursor-pointer"
                />
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-sm text-gray-500">{user?.email}</span>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  <Button
                    variant="outline"
                    className="w-full text-left cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                    onClick={() => navigate("/settings")}
                  >
                    ⚙️ Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-left cursor-pointer"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <Button
            onClick={() => setOpenDialog(true)}
            className="bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white font-medium rounded-full px-6 transition-all duration-200"
          >
            Sign In
          </Button>
        )}
      </div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center">
              <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
              <span className="ml-2 text-xl font-bold text-gray-800">
                Travel Rover
              </span>
            </DialogTitle>

            <DialogDescription className="mt-2 text-sm text-gray-500">
              Sign in to save your trips and access them from any device.
            </DialogDescription>

            <div className="mt-5">
              <h2 className="text-lg font-semibold">Start Your Journey</h2>
              <Button
                className="w-full mt-5 flex gap-4 items-center"
                onClick={() => googleLogin()}
                disabled={isLoggingIn}
              >
                <FcGoogle />
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
