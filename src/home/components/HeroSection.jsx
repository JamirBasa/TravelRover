import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plane, Loader2 } from "lucide-react";
import { PlacesAutocomplete } from "../../components/common/PlacesAutocomplete";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { useAuthCheck } from "../../hooks/useAuthCheck";
import AuthDialog from "../../components/common/AuthDialog";

function HeroSection() {
  const [place, setPlace] = useState(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthCheck();

  // Load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Clean categories with essential data
  const categories = [
    {
      id: 1,
      name: "Adventure",
      icon: "🌄",
      tripType: "adventure",
      description: "Outdoor activities & thrills",
      activities: [
        "hiking",
        "mountain climbing",
        "zipline",
        "rock climbing",
        "river rafting",
        "caving",
        "trekking",
        "cliff jumping",
      ],
      keywords:
        "adventure sports, outdoor activities, extreme sports, mountain adventures, nature exploration",
    },
    {
      id: 2,
      name: "Beach",
      icon: "🏖️",
      tripType: "beach",
      description: "Island getaways & relaxation",
      activities: [
        "swimming",
        "snorkeling",
        "diving",
        "island hopping",
        "beach volleyball",
        "surfing",
        "kayaking",
        "beach relaxation",
      ],
      keywords:
        "beach resorts, island hopping, water sports, coastal activities, tropical paradise, beach relaxation",
    },
    {
      id: 3,
      name: "Cultural",
      icon: "🏛️",
      tripType: "cultural",
      description: "History & local heritage",
      activities: [
        "museum visits",
        "heritage tours",
        "local festivals",
        "historical sites",
        "cultural shows",
        "art galleries",
        "traditional crafts",
        "local markets",
      ],
      keywords:
        "historical sites, museums, cultural heritage, local traditions, historical landmarks, cultural experiences",
    },
    {
      id: 4,
      name: "Food Trip",
      icon: "🍜",
      tripType: "food",
      description: "Local cuisine & flavors",
      activities: [
        "food tours",
        "local restaurants",
        "street food",
        "cooking classes",
        "food markets",
        "specialty dining",
        "local delicacies",
        "food festivals",
      ],
      keywords:
        "local cuisine, food tours, restaurants, street food, culinary experiences, local specialties, food markets",
    },
  ];

  const handlePlanTrip = async () => {
    // Use requireAuth to check authentication
    requireAuth(async () => {
      // This code only runs if user is authenticated
      setIsCheckingProfile(true);

      try {
        const currentUser = JSON.parse(localStorage.getItem("user"));

        // Check if user has a complete profile
        const docRef = doc(db, "UserProfiles", currentUser.email);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !docSnap.data()?.isProfileComplete) {
          // Profile doesn't exist or is incomplete
          toast.error("Please complete your profile first", {
            description:
              "We need some information about your travel preferences to create personalized itineraries.",
            duration: 5000,
          });

          // Redirect to profile page after a short delay
          setTimeout(() => {
            navigate("/user-profile", {
              state: {
                returnTo: "/home",
                message: "Complete your profile to start planning trips",
              },
            });
          }, 1500);
          return;
        }

        // Profile is complete, proceed with trip planning
        if (place) {
          // Navigate to create-trip with the selected location
          navigate("/create-trip", {
            state: {
              searchedLocation: place.label,
              selectedDestination: place.label,
            },
          });
        } else {
          // Navigate to create-trip without location
          navigate("/create-trip");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        toast.error("Something went wrong", {
          description:
            "Please try again or contact support if the issue persists.",
        });
      } finally {
        setIsCheckingProfile(false);
      }
    });
  };

  const handleCategorySelect = async (category) => {
    // Use requireAuth to check authentication
    requireAuth(async () => {
      // This code only runs if user is authenticated
      setIsCheckingProfile(true);

      try {
        const currentUser = JSON.parse(localStorage.getItem("user"));

        // Check if user has a complete profile
        const docRef = doc(db, "UserProfiles", currentUser.email);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !docSnap.data()?.isProfileComplete) {
          // Profile doesn't exist or is incomplete
          toast.error("Please complete your profile first", {
            description:
              "We need some information about your travel preferences to create personalized itineraries.",
            duration: 5000,
          });

          // Redirect to profile page after a short delay
          setTimeout(() => {
            navigate("/user-profile", {
              state: {
                returnTo: "/home",
                message: "Complete your profile to start planning trips",
              },
            });
          }, 1500);
          return;
        }

        // Profile is complete, proceed with category selection
        navigate("/create-trip", {
          state: {
            selectedCategory: category.tripType,
            categoryName: category.name,
            categoryActivities: category.activities,
            categoryKeywords: category.keywords,
            searchedLocation: place?.label || null,
            prefilledTripType: category.tripType,
            categoryFocus: true, // Flag to indicate this is a category-focused trip
          },
        });
      } catch (error) {
        console.error("Error checking profile:", error);
        toast.error("Something went wrong", {
          description:
            "Please try again or contact support if the issue persists.",
        });
      } finally {
        setIsCheckingProfile(false);
      }
    });
  };

  return (
    <section className="flex flex-col items-center text-center pt-8 pb-16 px-4 max-w-5xl mx-auto relative">
      {/* Subtle background elements */}
      <div className="absolute -top-32 left-1/4 w-64 h-64 bg-gradient-to-r from-sky-100/50 to-blue-100/50 dark:from-sky-500/20 dark:to-blue-500/20 rounded-full blur-3xl -z-20"></div>
      <div className="absolute -top-12 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-100/40 to-sky-100/40 dark:from-blue-500/15 dark:to-sky-500/15 rounded-full blur-3xl -z-20"></div>

      <div className="mb-6">
        <h1 className="font-bold text-4xl md:text-5xl brand-gradient-text mb-3 tracking-tight">
          Plan Your Perfect Trip
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
          Discover amazing destinations and create unforgettable memories with
          AI-powered travel planning
        </p>
      </div>

      {/* Enhanced Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-2 shadow-lg hover:shadow-xl dark:shadow-sky-500/10 transition-all duration-300 w-full md:w-2/3 max-w-2xl relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative z-20">
            <PlacesAutocomplete
              value={place}
              onChange={(v) => {
                setPlace(v);
              }}
              placeholder="Search for cities or regions..."
              countryRestriction={["ph"]}
              restrictToCities={true}
              className="border-0 bg-transparent focus:ring-0"
            />
          </div>
          <Button
            className="brand-gradient text-white font-semibold px-6 py-3 cursor-pointer shadow-lg hover:shadow-xl rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={handlePlanTrip}
            disabled={isCheckingProfile}
          >
            {isCheckingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Checking...</span>
                <span className="sm:hidden">Wait</span>
              </>
            ) : (
              <>
                <Plane className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Plan Trip</span>
                <span className="sm:hidden">Plan</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Elegant Categories */}
      <div className="mt-16 w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Choose Your Adventure Style
          </h2>
          <div className="w-24 h-1 brand-gradient rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={`group transform transition-all duration-300 ${
                isCheckingProfile
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:-translate-y-1"
              }`}
              onClick={() => !isCheckingProfile && handleCategorySelect(cat)}
              title={isCheckingProfile ? "Please wait..." : cat.description}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 hover:border-sky-300/80 dark:hover:border-sky-500/80 hover:shadow-xl dark:hover:shadow-sky-500/20 p-5 rounded-2xl transition-all duration-300 text-center relative overflow-hidden min-h-[160px]">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/20 to-blue-50/20 dark:from-sky-500/10 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Icon with subtle glow */}
                <div className="relative mb-4">
                  <div className="brand-gradient p-4 rounded-2xl inline-block transition-all duration-300 group-hover:scale-110 shadow-lg group-hover:shadow-xl">
                    <span className="text-3xl text-white drop-shadow-sm">
                      {cat.icon}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:brand-gradient-text transition-all duration-300 mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {cat.description}
                  </p>
                </div>

                {/* Subtle bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 brand-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authentication Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={(userData) => {
          // Reload user state after successful login
          setUser(userData);
          toast.success("You can now start planning your trip!");
        }}
        title="Sign In to Plan Your Trip"
        description="Create an account to save your personalized travel plans and access them from any device."
      />
    </section>
  );
}

export default HeroSection;
