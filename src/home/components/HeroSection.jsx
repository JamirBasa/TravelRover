import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plane } from "lucide-react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { toast } from "sonner";

function HeroSection() {
  const [place, setPlace] = useState(null);
  const navigate = useNavigate();

  // Enhanced categories with specific activity types for AI prompting
  const categories = [
    { 
      id: 1, 
      name: "Adventure", 
      icon: "🌄",
      tripType: "adventure",
      description: "Outdoor activities and thrilling experiences",
      activities: ["hiking", "mountain climbing", "zipline", "rock climbing", "river rafting", "caving", "trekking", "cliff jumping"],
      keywords: "adventure sports, outdoor activities, extreme sports, mountain adventures, nature exploration"
    },
    { 
      id: 2, 
      name: "Beach", 
      icon: "🏖️",
      tripType: "beach",
      description: "Island getaways and coastal relaxation",
      activities: ["swimming", "snorkeling", "diving", "island hopping", "beach volleyball", "surfing", "kayaking", "beach relaxation"],
      keywords: "beach resorts, island hopping, water sports, coastal activities, tropical paradise, beach relaxation"
    },
    { 
      id: 3, 
      name: "Cultural", 
      icon: "🏛️",
      tripType: "cultural",
      description: "Historical sites and local heritage",
      activities: ["museum visits", "heritage tours", "local festivals", "historical sites", "cultural shows", "art galleries", "traditional crafts", "local markets"],
      keywords: "historical sites, museums, cultural heritage, local traditions, historical landmarks, cultural experiences"
    },
    { 
      id: 4, 
      name: "Food Trip", 
      icon: "🍜",
      tripType: "food",
      description: "Culinary experiences and local cuisine",
      activities: ["food tours", "local restaurants", "street food", "cooking classes", "food markets", "specialty dining", "local delicacies", "food festivals"],
      keywords: "local cuisine, food tours, restaurants, street food, culinary experiences, local specialties, food markets"
    },
  ];

  const handlePlanTrip = () => {
    if (place) {
      // Navigate to create-trip with the selected location
      navigate("/create-trip", {
        state: {
          searchedLocation: place.label,
          selectedDestination: place.label
        }
      });
    } else {
      // Navigate to create-trip without location
      navigate("/create-trip");
    }
  };

  const handleCategorySelect = (category) => {
    // Enhanced category data for better AI prompt generation
    navigate("/create-trip", {
      state: {
        selectedCategory: category.tripType,
        categoryName: category.name,
        categoryActivities: category.activities,
        categoryKeywords: category.keywords,
        searchedLocation: place?.label || null,
        prefilledTripType: category.tripType,
        categoryFocus: true // Flag to indicate this is a category-focused trip
      }
    });
    
    // Show feedback to user
    toast.success(`Planning ${category.name} trip${place ? ` to ${place.label}` : ''}!`);
  };

  return (
    <section className="flex flex-col items-center text-center mt-16 px-4">
      <h1 className="font-extrabold text-4xl md:text-5xl">
        Plan Your Perfect Trip
      </h1>
      <p className="text-gray-500 mt-2 text-lg">
        Discover amazing destinations and create unforgettable memories
      </p>

      {/* Search Bar */}
      <div className="flex items-center gap-2 mt-6 w-full md:w-1/2">
        <div className="flex-1">
          <GooglePlacesAutocomplete
            apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
            autocompletionRequest={{
              componentRestrictions: {
                country: ["ph"],
              },
            }}
            selectProps={{
              value: place,
              onChange: (v) => {
                setPlace(v);
                if (v) {
                  toast.success(`Selected: ${v.label}`);
                }
              },
              placeholder: "Where do you want to go? (e.g., Baguio, Cebu)",
              className: "text-lg",
              styles: {
                control: (provided) => ({
                  ...provided,
                  border: "2px solid #e5e7eb",
                  borderRadius: "9999px",
                  padding: "0.75rem 1.25rem",
                  minHeight: "48px",
                  fontSize: "18px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  "&:hover": {
                    borderColor: "#9ca3af",
                  },
                  "&:focus-within": {
                    borderColor: "#0ea5e9",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(14, 165, 233, 0.1)",
                  },
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: "#9ca3af",
                  fontSize: "18px",
                }),
                singleValue: (provided) => ({
                  ...provided,
                  fontSize: "18px",
                  color: "#374151",
                }),
                menu: (provided) => ({
                  ...provided,
                  borderRadius: "0.75rem",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected ? "#0ea5e9" : state.isFocused ? "#f0f9ff" : "white",
                  color: state.isSelected ? "white" : "#374151",
                  fontSize: "16px",
                }),
              },
            }}
          />
        </div>
        <Button 
          className="rounded-full px-6 py-6 cursor-pointer"
          onClick={handlePlanTrip}
        >
          <Plane className="mr-2 h-5 w-5" /> Plan Trip
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant="outline"
            className="flex items-center gap-2 px-6 py-5 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all"
            onClick={() => handleCategorySelect(cat)}
            title={cat.description}
          >
            <span>{cat.icon}</span> {cat.name}
          </Button>
        ))}
      </div>
    </section>
  );
}

export default HeroSection;