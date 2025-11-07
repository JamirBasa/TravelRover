import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useNavigate } from "react-router-dom";

/**
 * Reusable Authentication Dialog Component
 * Shows a sign-in dialog for protected actions
 *
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {function} onSuccess - Callback after successful authentication
 * @param {string} title - Custom title for the dialog
 * @param {string} description - Custom description
 */
const AuthDialog = ({
  open,
  onOpenChange,
  onSuccess,
  title = "Sign In Required",
  description = "Please sign in to access this feature and save your personalized travel plans.",
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResp) => getUserProfile(codeResp),
    onError: (error) => {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
      setIsLoggingIn(false);
    },
  });

  const getUserProfile = async (tokenInfo) => {
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
            if (profileData && profileData.isProfileComplete) {
              userData.hasProfile = true;
            }
          }
        }
      } catch (profileError) {
        console.warn("Could not check user profile:", profileError);
        userData.hasProfile = false;
      }

      localStorage.setItem("user", JSON.stringify(userData));
      toast.success("Successfully signed in!");

      // Close dialog
      onOpenChange(false);

      // Execute success callback if provided
      if (onSuccess) {
        onSuccess(userData);
      } else {
        // Default behavior: redirect based on profile status
        if (userData.hasProfile) {
          toast.success("Welcome back!");
        } else {
          toast.success("Welcome! Let's set up your travel profile...");
          setTimeout(() => navigate("/set-profile"), 1000);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to get user profile");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-2xl rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center">
            <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
            <span className="ml-3 text-xl font-black brand-gradient-text">
              Travel Rover
            </span>
          </DialogTitle>

          <DialogDescription className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center">
            {description}
          </DialogDescription>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center mb-4">
              {title}
            </h2>
            <Button
              className="w-full mt-4 flex gap-3 items-center justify-center brand-button py-3 cursor-pointer"
              onClick={() => googleLogin()}
              disabled={isLoggingIn}
            >
              <FcGoogle className="text-xl" />
              {isLoggingIn ? "Signing in..." : "Sign In With Google"}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
