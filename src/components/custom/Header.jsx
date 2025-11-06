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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { googleLogout } from "@react-oauth/google";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Moon,
  Sun,
  Menu,
  Home,
  MapPin,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";

function Header() {
  const { isDarkMode, toggleTheme } = useTheme();

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          setTimeout(() => navigate("/"), 1000);
        } else {
          // First-time user or incomplete profile, redirect to user profile
          toast.success("Welcome! Let's set up your travel profile...");
          setTimeout(() => navigate("/set-profile"), 1000);
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
    <div className="px-4 md:px-5 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-700/80 shadow-lg sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div
          className="flex items-center cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <img
            src="/logo.svg"
            alt="Logo"
            className="h-10 md:h-12 w-auto transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
          />
          <span className="ml-2 md:ml-3 text-xl md:text-2xl font-black brand-gradient-text transition-all duration-300 group-hover:tracking-wide">
            Travel Rover
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          {user ? (
            <div className="flex items-center gap-5">
              <nav className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full cursor-pointer font-medium text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-sky-900/30 dark:hover:to-blue-900/30 transition-all duration-300 hover:shadow-sm hover:scale-[1.02]"
                  onClick={() => navigate("/")}
                >
                  Home
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full cursor-pointer font-medium text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-sky-900/30 dark:hover:to-blue-900/30 transition-all duration-300 hover:shadow-sm hover:scale-[1.02]"
                  onClick={() => navigate("/my-trips")}
                >
                  My Trips
                </Button>
              </nav>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>

              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full cursor-pointer hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-sky-900/30 dark:hover:to-blue-900/30 transition-all duration-300 hover:shadow-md group"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 blur-md"></div>
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-sky-600 dark:text-sky-400 transition-all duration-500 group-hover:rotate-180 group-hover:scale-110 relative z-10" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600 transition-all duration-500 group-hover:rotate-[-15deg] group-hover:scale-110 relative z-10" />
                )}
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>

              <div className="flex items-center gap-2.5">
                <span className="text-gray-700 dark:text-gray-300 font-medium text-sm hidden sm:block">
                  Hello,{" "}
                  <span className="text-sky-600 dark:text-sky-400 font-semibold">
                    {user?.given_name ||
                      user?.name?.trim().split(" ")[0] ||
                      "there"}
                  </span>
                  !
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="relative group/avatar focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 rounded-full transition-all duration-200">
                      <img
                        src={user?.picture}
                        className="h-9 w-9 rounded-full cursor-pointer border-2 border-gray-200 dark:border-slate-700 group-hover/avatar:border-gray-300 dark:group-hover/avatar:border-slate-600 transition-all duration-200 shadow-sm"
                        alt="Profile"
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={12}
                    className="w-[300px] bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 shadow-xl rounded-xl p-0 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                  >
                    {/* User Info Section - GitHub Style */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-start gap-3">
                        <img
                          src={user?.picture}
                          className="h-10 w-10 rounded-full border-2 border-gray-200 dark:border-slate-700"
                          alt={user?.name}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                            {user?.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate("/settings");
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer group/item"
                      >
                        <div className="flex items-center gap-3">
                          <SettingsIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover/item:text-gray-700 dark:group-hover/item:text-gray-300" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            Settings
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-200 dark:bg-slate-700"></div>

                    {/* Logout */}
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer group/item"
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover/item:text-gray-700 dark:group-hover/item:text-gray-300" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            Sign out
                          </span>
                        </div>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle for non-logged users */}
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full cursor-pointer hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-sky-900/30 dark:hover:to-blue-900/30 transition-all duration-300 hover:shadow-md group"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 blur-md"></div>
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-sky-600 dark:text-sky-400 transition-all duration-500 group-hover:rotate-180 group-hover:scale-110 relative z-10" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600 transition-all duration-500 group-hover:rotate-[-15deg] group-hover:scale-110 relative z-10" />
                )}
              </Button>

              <Button
                onClick={() => setOpenDialog(true)}
                disabled={isLoggingIn}
                className="brand-button px-6 py-2 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-3">
          {/* Dark Mode Toggle - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full cursor-pointer hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-sky-900/30 dark:hover:to-blue-900/30 transition-all duration-300 group"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-sky-600 dark:text-sky-400 transition-all duration-300 group-hover:rotate-180" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600 transition-all duration-300" />
            )}
          </Button>

          {user ? (
            /* Mobile Menu for Logged In Users */
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors rounded-lg"
                >
                  <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-l border-gray-200/80 dark:border-slate-700/80"
              >
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>

                {/* User Profile Section */}
                <div className="flex items-center gap-3 pt-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                  <img
                    src={user?.picture}
                    className="h-12 w-12 rounded-full ring-2 ring-sky-200 dark:ring-sky-700 shadow-sm"
                    alt={user?.name}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 dark:text-gray-200 text-base truncate">
                      {user?.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2 py-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200 rounded-lg px-4 py-3 text-base group/nav"
                    onClick={() => {
                      navigate("/");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Home className="mr-3 h-5 w-5 group-hover/nav:scale-110 transition-transform" />
                    <span className="font-medium">Home</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200 rounded-lg px-4 py-3 text-base group/nav"
                    onClick={() => {
                      navigate("/my-trips");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <MapPin className="mr-3 h-5 w-5 group-hover/nav:scale-110 transition-transform" />
                    <span className="font-medium">My Trips</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200 rounded-lg px-4 py-3 text-base group/nav"
                    onClick={() => {
                      navigate("/settings");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <SettingsIcon className="mr-3 h-5 w-5 group-hover/nav:scale-110 transition-transform" />
                    <span className="font-medium">Settings</span>
                  </Button>
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-6 left-0 right-0 px-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded-lg px-4 py-3 text-base group/nav border-t border-gray-200 dark:border-slate-700 pt-6"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-3 h-5 w-5 group-hover/nav:scale-110 transition-transform" />
                    <span className="font-medium">Logout</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            /* Sign In Button for Non-Logged Users */
            <Button
              onClick={() => setOpenDialog(true)}
              disabled={isLoggingIn}
              className="brand-button px-4 py-2 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-sm"
            >
              {isLoggingIn ? "..." : "Sign In"}
            </Button>
          )}
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-gray-200/80 dark:border-slate-700/80 shadow-2xl rounded-2xl animate-in fade-in-0 zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center group">
              <img
                src="/logo.svg"
                alt="Logo"
                className="h-12 w-auto transition-transform duration-300 group-hover:scale-110"
              />
              <span className="ml-3 text-xl font-black brand-gradient-text transition-all duration-300 group-hover:tracking-wide">
                Travel Rover
              </span>
            </DialogTitle>

            <DialogDescription className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
              Sign in to save your trips and access them from any device.
            </DialogDescription>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center mb-5">
                Start Your Journey
              </h2>
              <Button
                className="w-full mt-4 flex gap-3 items-center justify-center brand-button py-3 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group/signin"
                onClick={() => googleLogin()}
                disabled={isLoggingIn}
              >
                <FcGoogle className="text-xl transition-transform duration-300 group-hover/signin:scale-110" />
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
