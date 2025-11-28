import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plane, Loader2, Mountain, Waves, Landmark, UtensilsCrossed } from "lucide-react";
import { PlacesAutocomplete } from "../../components/common/PlacesAutocomplete";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { useAuthCheck } from "../../hooks/useAuthCheck";
import AuthDialog from "../../components/common/AuthDialog";

function HeroSection() {
  const [place, setPlace] = useState(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const navigate = useNavigate();
  const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthCheck();

  // Simplified categories with clean structure
  const categories = [
    {
      id: 1,
      name: "Adventure",
      icon: Mountain,
      tripType: "adventure",
      description: "Hiking, climbing & outdoor thrills",
      gradient: "from-emerald-500 to-teal-600",
      activities: [
        "hiking",
        "mountain climbing",
        "zipline",
        "rock climbing",
        "river rafting",
        "caving",
        "trekking",
        "cliff jumping",
        "camping",
        "mountain biking",
      ],
      keywords:
        "adventure sports, outdoor activities, extreme sports, mountain adventures, nature exploration, physical challenges",
      recommendedDestinations: [
        { city: "Sagada", reason: "Mountain trails, caves, hanging coffins" },
        { city: "Banaue", reason: "Rice terraces trekking, tribal villages" },
        {
          city: "San Antonio, Zambales",
          reason: "Mountain climbing, beach camping, Anawangin Cove",
        },
        {
          city: "Tanay, Rizal",
          reason: "Masungi Georeserve rock formations, conservation trail",
        },
        {
          city: "Cagayan de Oro",
          reason: "White-water rafting, zipline adventures",
        },
      ],
    },
    {
      id: 2,
      name: "Beach",
      icon: Waves,
      tripType: "beach",
      description: "Islands, diving & coastal relaxation",
      gradient: "from-sky-500 to-blue-600",
      activities: [
        "swimming",
        "snorkeling",
        "diving",
        "island hopping",
        "beach volleyball",
        "surfing",
        "kayaking",
        "beach relaxation",
        "sunset watching",
        "beach photography",
      ],
      keywords:
        "beach resorts, island hopping, water sports, coastal activities, tropical paradise, beach relaxation, marine life",
      recommendedDestinations: [
        {
          city: "El Nido",
          reason: "Pristine lagoons, limestone cliffs, island hopping",
        },
        {
          city: "Coron",
          reason: "Crystal-clear lakes, wreck diving, Kayangan Lake",
        },
        {
          city: "Siargao",
          reason: "Surfing paradise, coconut groves, island life",
        },
        {
          city: "Boracay, Aklan",
          reason: "White sand beaches, water sports, vibrant nightlife",
        },
        {
          city: "Batanes",
          reason:
            "Dramatic coastlines, untouched beaches, Valugan Boulder Beach",
        },
      ],
    },
    {
      id: 3,
      name: "Cultural",
      icon: Landmark,
      tripType: "cultural",
      description: "Heritage sites & local traditions",
      gradient: "from-amber-500 to-orange-600",
      activities: [
        "museum visits",
        "heritage tours",
        "local festivals",
        "historical sites",
        "cultural shows",
        "art galleries",
        "traditional crafts",
        "local markets",
        "heritage walks",
        "indigenous communities",
      ],
      keywords:
        "historical sites, museums, cultural heritage, local traditions, historical landmarks, cultural experiences, Spanish colonial history",
      recommendedDestinations: [
        {
          city: "Vigan",
          reason:
            "Spanish colonial architecture, Calle Crisologo, heritage city",
        },
        {
          city: "Manila",
          reason: "Intramuros walled city, Fort Santiago, Spanish era churches",
        },
        {
          city: "Baguio",
          reason: "Cordillera culture, indigenous crafts, Session Road",
        },
        {
          city: "Bataan",
          reason: "World War II history, Death March memorial",
        },
        {
          city: "Cebu City",
          reason: "Magellan's Cross, Basilica, colonial heritage",
        },
      ],
    },
    {
      id: 4,
      name: "Food Trip",
      icon: UtensilsCrossed,
      tripType: "food",
      description: "Culinary tours & local flavors",
      gradient: "from-rose-500 to-pink-600",
      activities: [
        "food tours",
        "local restaurants",
        "street food",
        "cooking classes",
        "food markets",
        "specialty dining",
        "local delicacies",
        "food festivals",
        "farm visits",
        "culinary workshops",
      ],
      keywords:
        "local cuisine, food tours, restaurants, street food, culinary experiences, local specialties, food markets, Filipino dishes",
      recommendedDestinations: [
        {
          city: "Angeles, Pampanga",
          reason: "Culinary capital, sisig, traditional kakanin",
        },
        { city: "Cebu City", reason: "Lechon capital, seafood, Larsian BBQ" },
        {
          city: "Manila",
          reason: "Diverse food scene, Chinatown, international cuisine",
        },
        {
          city: "Laoag",
          reason: "Bagnet, empanada, Vigan longganisa, Ilocos cuisine",
        },
        {
          city: "Bacolod",
          reason: "Chicken inasal, sweets capital, Manokan Country",
        },
      ],
    },
  ];

  // Centralized profile check to reduce code duplication
  const checkProfileAndNavigate = async (navigationCallback) => {
    requireAuth(async () => {
      setIsCheckingProfile(true);
      try {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const docRef = doc(db, "UserProfiles", currentUser.email);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !docSnap.data()?.isProfileComplete) {
          toast.error("Please complete your profile first", {
            description:
              "We need some information about your travel preferences to create personalized itineraries.",
          });
          setTimeout(() => {
            navigate("/set-profile", {
              state: {
                returnTo: "/home",
                message: "Complete your profile to start planning trips",
              },
            });
          }, 1500);
          return;
        }

        navigationCallback();
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

  const handlePlanTrip = () => {
    checkProfileAndNavigate(() => {
      navigate("/create-trip", {
        state: place
          ? {
              searchedLocation: place.label,
              selectedDestination: place.label,
            }
          : {},
      });
    });
  };

  const handleCategorySelect = (category) => {
    checkProfileAndNavigate(() => {
      navigate("/create-trip", {
        state: {
          selectedCategory: category.tripType,
          categoryName: category.name,
          categoryActivities: category.activities,
          categoryKeywords: category.keywords,
          recommendedDestinations: category.recommendedDestinations,
          searchedLocation: place?.label || null,
          prefilledTripType: category.tripType,
          categoryFocus: true,
        },
      });
    });
  };

  return (
    <section className="relative py-12 px-4 max-w-7xl mx-auto">
      {/* Hero Content */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold brand-gradient-text tracking-tight">
          Plan Your Perfect Trip
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          AI-powered travel planning for unforgettable Philippine adventures
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="relative">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-lg border border-gray-200 dark:border-slate-700 transition-shadow hover:shadow-xl">
            <div className="flex-1">
              <PlacesAutocomplete
                value={place}
                onChange={setPlace}
                placeholder="Where do you want to go?"
                countryRestriction={["ph"]}
                restrictToCities={true}
                className="border-0 bg-transparent focus:ring-0 text-base"
              />
            </div>
            <Button
              onClick={handlePlanTrip}
              disabled={isCheckingProfile}
              className="brand-button shrink-0"
            >
              {isCheckingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Checking...</span>
                </>
              ) : (
                <>
                  <Plane className="h-4 w-4" />
                  <span className="hidden sm:inline">Plan Trip</span>
                  <span className="sm:hidden">Plan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 max-w-3xl mx-auto mb-12">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          OR CHOOSE A STYLE
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => !isCheckingProfile && handleCategorySelect(category)}
              disabled={isCheckingProfile}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left shadow-md border border-gray-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative z-10 space-y-4">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${category.gradient} shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                
                {/* Text */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Bottom Accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </button>
          );
        })}
      </div>

      {/* Authentication Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={() => {
          toast.success("You can now start planning your trip!");
        }}
        title="Sign In to Plan Your Trip"
        description="Create an account to save your personalized travel plans and access them from any device."
      />
    </section>
  );
}

export default HeroSection;
