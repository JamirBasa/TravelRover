// src/create-trip/components/TripGenerationModal.jsx
import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import {
  FaRocket,
  FaMapMarkerAlt,
  FaPlane,
  FaHotel,
  FaRobot,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaQuoteLeft,
} from "react-icons/fa";

function TripGenerationModal({
  isOpen,
  loading,
  flightLoading,
  hotelLoading,
  langGraphLoading,
  destination,
  duration,
}) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentQuote, setCurrentQuote] = useState(0);

  // Calculate loading state
  const isAnyLoading =
    loading || flightLoading || hotelLoading || langGraphLoading;

  // Inspiring travel quotes
  const inspiringQuotes = [
    {
      text: "The world is a book, and those who do not travel read only one page.",
      author: "Saint Augustine",
    },
    {
      text: "Travel makes one modest. You see what a tiny place you occupy in the world.",
      author: "Gustave Flaubert",
    },
    {
      text: "Adventure is worthwhile in itself.",
      author: "Amelia Earhart",
    },
    {
      text: "To travel is to live.",
      author: "Hans Christian Andersen",
    },
    {
      text: "Not all those who wander are lost.",
      author: "J.R.R. Tolkien",
    },
    {
      text: "Travel far enough, you meet yourself.",
      author: "David Mitchell",
    },
    {
      text: "Life is short and the world is wide.",
      author: "Simon Raven",
    },
    {
      text: "A journey of a thousand miles begins with a single step.",
      author: "Lao Tzu",
    },
    {
      text: "We travel, initially, to lose ourselves; and we travel, next, to find ourselves.",
      author: "Pico Iyer",
    },
    {
      text: "The journey not the arrival matters.",
      author: "T.S. Eliot",
    },
    {
      text: "Travel is the only thing you buy that makes you richer.",
      author: "Anonymous",
    },
    {
      text: "Collect moments, not things.",
      author: "Anonymous",
    },
    {
      text: "Adventure awaits, go find it.",
      author: "Anonymous",
    },
    {
      text: "Every destination has a story. Every journey writes a new chapter.",
      author: "Anonymous",
    },
    {
      text: "Travel opens your heart, broadens your mind, and fills your life with stories to tell.",
      author: "Anonymous",
    },
    {
      text: "The best education you will ever get is traveling. Nothing teaches you more than exploring the world.",
      author: "Mark Twain",
    },
    {
      text: "Wanderlust: a strong desire to travel and explore the world.",
      author: "Anonymous",
    },
    {
      text: "Life begins at the end of your comfort zone.",
      author: "Neale Donald Walsch",
    },
  ];

  // Define the steps for trip generation
  const steps = [
    { id: "start", label: "Initializing trip generation", icon: FaRocket },
    {
      id: "langgraph",
      label: "AI agents analyzing your preferences",
      icon: FaRobot,
    },
    {
      id: "flights",
      label: "Searching for best flight options",
      icon: FaPlane,
    },
    { id: "hotels", label: "Finding perfect accommodations", icon: FaHotel },
    {
      id: "itinerary",
      label: "Creating your personalized itinerary",
      icon: FaMapMarkerAlt,
    },
    { id: "finalize", label: "Finalizing your travel plan", icon: FaCheck },
  ];

  useEffect(() => {
    if (!loading && !flightLoading && !hotelLoading && !langGraphLoading) {
      return;
    }

    let newProgress = 10;
    let newCurrentStep = "Preparing your trip...";
    let newCompletedSteps = ["start"];

    if (langGraphLoading) {
      newProgress = 25;
      newCurrentStep = `AI agents are analyzing your trip to ${
        destination || "your destination"
      } and finding the best options`;
      newCompletedSteps = ["start"];
    } else if (langGraphLoading === false && (flightLoading || hotelLoading)) {
      newProgress = 50;
      newCompletedSteps = ["start", "langgraph"];

      if (flightLoading) {
        newCurrentStep = `Searching for flights to ${
          destination || "your destination"
        } with the best prices and schedules`;
      } else if (hotelLoading) {
        newCurrentStep = `Finding amazing accommodations in ${
          destination || "your destination"
        } that match your style`;
        newCompletedSteps.push("flights");
        newProgress = 70;
      }
    } else if (!flightLoading && !hotelLoading && loading) {
      newProgress = 85;
      newCurrentStep = `Crafting your perfect ${
        duration ? duration + " day" : ""
      } itinerary with personalized recommendations`;
      newCompletedSteps = ["start", "langgraph", "flights", "hotels"];
    }

    setProgress(newProgress);
    setCurrentStep(newCurrentStep);
    setCompletedSteps(newCompletedSteps);
  }, [loading, flightLoading, hotelLoading, langGraphLoading]);

  // Cycle through quotes every 5 seconds
  useEffect(() => {
    if (!isAnyLoading) return;

    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % inspiringQuotes.length);
    }, 5000);

    return () => clearInterval(quoteInterval);
  }, [isAnyLoading, inspiringQuotes.length]);

  const getEstimatedTime = () => {
    if (langGraphLoading) return "30-45 seconds";
    if (flightLoading || hotelLoading) return "15-30 seconds";
    return "10-20 seconds";
  };

  // Don't render if not loading
  if (!isOpen || !isAnyLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Floating Animation Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-12 h-12 bg-pink-200 rounded-full opacity-20 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Additional floating elements */}
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-10 animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>
        <div
          className="absolute top-3/4 right-1/4 w-28 h-28 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-10 animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>

        {/* Travel Icons Floating */}
        <div
          className="absolute top-16 right-16 text-blue-200 opacity-30 animate-bounce"
          style={{ animationDelay: "0.5s", animationDuration: "2s" }}
        >
          <FaPlane className="text-4xl transform rotate-12" />
        </div>
        <div
          className="absolute bottom-32 left-16 text-purple-200 opacity-30 animate-bounce"
          style={{ animationDelay: "1.5s", animationDuration: "2.5s" }}
        >
          <FaHotel className="text-3xl transform -rotate-12" />
        </div>
        <div
          className="absolute top-1/2 left-8 text-indigo-200 opacity-30 animate-bounce"
          style={{ animationDelay: "2.5s", animationDuration: "3s" }}
        >
          <FaMapMarkerAlt className="text-2xl" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4 py-6 overflow-y-auto">
        <div className="max-w-xl w-full space-y-3 my-auto">
          {/* Header Section */}
          <div className="text-center space-y-3">
            {/* Logo/Icon */}
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <FaRocket className="text-white text-3xl animate-bounce" />
              </div>
              {/* Spinning Ring */}
              <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-800">
                Creating Your Perfect Trip
              </h1>
              {destination && (
                <p className="text-lg text-gray-600">
                  to{" "}
                  <span className="font-semibold text-blue-600">
                    {destination}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-semibold text-gray-800">
                  Progress
                </span>
                <span className="text-base font-bold text-blue-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="w-full h-3 mb-3" />

              {/* Current Step Description */}
              <div className="text-center space-y-1">
                <p className="text-base font-medium text-gray-800">
                  {currentStep}
                </p>
                <p className="text-xs text-gray-600">
                  Estimated time: {getEstimatedTime()}
                </p>
              </div>
            </div>

            {/* Steps Visualization - Show only key steps */}
            <div className="space-y-2">
              {steps.slice(0, 4).map((step) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = currentStep
                  .toLowerCase()
                  .includes(step.label.toLowerCase().split(" ")[0]);
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : isCurrent
                        ? "bg-blue-100 text-blue-800 shadow-md border border-blue-200"
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        isCompleted
                          ? "bg-green-200"
                          : isCurrent
                          ? "bg-blue-200"
                          : "bg-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <FaCheck className="text-sm" />
                      ) : isCurrent ? (
                        <FaSpinner className="text-sm animate-spin" />
                      ) : (
                        <Icon className="text-sm" />
                      )}
                    </div>
                    <span className="text-sm font-medium flex-1">
                      {step.label}
                    </span>
                    {isCurrent && (
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                            style={{
                              animationDelay: `${i * 0.2}s`,
                              animationDuration: "1s",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inspiring Quote Section */}
          <div className="bg-gradient-to-r from-purple-100/80 to-blue-100/80 backdrop-blur-sm border border-purple-200 rounded-xl p-4 text-center shadow-lg transition-all duration-500">
            <div className="flex items-center justify-center gap-2 mb-3">
              <FaQuoteLeft className="text-purple-600 text-base animate-pulse" />
              <span className="text-sm font-semibold text-purple-800">
                Travel Inspiration
              </span>
            </div>
            <div className="space-y-2 min-h-[80px] flex flex-col justify-center">
              <p
                key={currentQuote}
                className="text-sm italic text-gray-700 leading-relaxed transition-all duration-500 ease-in-out opacity-100 transform translate-y-0"
              >
                "{inspiringQuotes[currentQuote].text}"
              </p>
              <p
                key={`author-${currentQuote}`}
                className="text-xs font-medium text-purple-600 transition-all duration-500 ease-in-out opacity-100 transform translate-y-0"
              >
                — {inspiringQuotes[currentQuote].author}
              </p>
            </div>
            {/* Quote indicator dots */}
            <div className="flex justify-center gap-1 mt-3">
              {inspiringQuotes
                .slice(0, Math.min(6, inspiringQuotes.length))
                .map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                      index ===
                      currentQuote % Math.min(6, inspiringQuotes.length)
                        ? "bg-purple-600 w-6 shadow-lg"
                        : "bg-purple-300 w-1.5 hover:bg-purple-400"
                    }`}
                    onClick={() => setCurrentQuote(index)}
                  />
                ))}
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-100/80 backdrop-blur-sm border border-amber-300 rounded-xl p-4 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaExclamationTriangle className="text-amber-600 text-lg animate-pulse" />
              <span className="text-base font-bold text-amber-800">
                Please Don't Close This Page
              </span>
            </div>
            <p className="text-amber-700 text-sm">
              We're generating your personalized itinerary. This may take up to
              60 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripGenerationModal;
