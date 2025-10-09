import React, { useEffect, useState, useMemo } from "react";
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
  FaCompass,
} from "react-icons/fa";
import { INSPIRING_QUOTES, TRIP_GENERATION_CONFIG } from "@/utils/constants";

// Add keyframes for shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Base step definitions - will be filtered based on user preferences
const ALL_STEPS = [
  {
    id: "start",
    label: "Initializing",
    icon: FaRocket,
    color: "from-sky-500 to-blue-500",
    required: true, // Always shown
  },
  {
    id: "langgraph",
    label: "AI Analysis",
    icon: FaRobot,
    color: "from-blue-500 to-cyan-500",
    condition: (props) => props.includeFlights || props.includeHotels, // Only if flights or hotels requested
  },
  {
    id: "flights",
    label: "Flight Search",
    icon: FaPlane,
    color: "from-sky-500 to-blue-500",
    condition: (props) => props.includeFlights, // Only if flights requested
  },
  {
    id: "hotels",
    label: "Hotels",
    icon: FaHotel,
    color: "from-orange-500 to-red-500",
    condition: (props) => props.includeHotels, // Only if hotels requested
  },
  {
    id: "itinerary",
    label: "Itinerary",
    icon: FaMapMarkerAlt,
    color: "from-green-500 to-emerald-500",
    required: true, // Always shown
  },
  {
    id: "finalize",
    label: "Complete",
    icon: FaCheck,
    color: "from-emerald-500 to-teal-500",
    required: true, // Always shown
  },
];

function deriveProgress({
  loading,
  flightLoading,
  hotelLoading,
  langGraphLoading,
  includeFlights = false,
  includeHotels = false,
}) {
  // Filter steps based on user preferences
  const activeSteps = ALL_STEPS.filter(
    (step) =>
      step.required ||
      (step.condition && step.condition({ includeFlights, includeHotels }))
  );

  const doneLang = !langGraphLoading;
  const doneFlights = !flightLoading;
  const doneHotels = !hotelLoading;
  const doneItinerary = !loading;

  const completed = ["start"];

  // Only add langgraph if it's in active steps (flights or hotels requested)
  if (doneLang && activeSteps.some((s) => s.id === "langgraph")) {
    completed.push("langgraph");
  }

  // Only add flights if user requested them and they're done
  if (
    includeFlights &&
    doneFlights &&
    activeSteps.some((s) => s.id === "flights")
  ) {
    completed.push("flights");
  }

  // Only add hotels if user requested them and they're done
  if (
    includeHotels &&
    doneHotels &&
    activeSteps.some((s) => s.id === "hotels")
  ) {
    completed.push("hotels");
  }

  // Check if all requested services are done
  const allRequestedServicesDone =
    (!includeFlights || doneFlights) &&
    (!includeHotels || doneHotels) &&
    ((!includeFlights && !includeHotels) || doneLang);

  if (allRequestedServicesDone && !loading) {
    completed.push("itinerary");
    completed.push("finalize");
  }

  const current =
    activeSteps.find((s) => !completed.includes(s.id))?.id || "finalize";
  const progressRatio = completed.length / activeSteps.length;
  const progress = Math.min(100, Math.round(progressRatio * 100));

  return { progress, completed, current, activeSteps };
}

function estimateTime({
  langGraphLoading,
  flightLoading,
  hotelLoading,
  loading,
}) {
  const { ESTIMATED_TIMES } = TRIP_GENERATION_CONFIG;
  if (langGraphLoading) return ESTIMATED_TIMES.LANGGRAPH;
  if (flightLoading || hotelLoading) return ESTIMATED_TIMES.FLIGHTS_HOTELS;
  if (loading) return ESTIMATED_TIMES.ITINERARY;
  return ESTIMATED_TIMES.DEFAULT;
}

function TripGenerationModal({
  isOpen = false,
  loading = false,
  flightLoading = false,
  hotelLoading = false,
  langGraphLoading = false,
  destination = "Your Dream Destination",
  duration = 3,
  includeFlights = false,
  includeHotels = false,
}) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  const isAnyLoading = Boolean(
    loading || flightLoading || hotelLoading || langGraphLoading
  );

  const { progress, completed, current, activeSteps } = useMemo(
    () =>
      deriveProgress({
        loading,
        flightLoading,
        hotelLoading,
        langGraphLoading,
        includeFlights,
        includeHotels,
      }),
    [
      loading,
      flightLoading,
      hotelLoading,
      langGraphLoading,
      includeFlights,
      includeHotels,
    ]
  );

  useEffect(() => {
    if (!isAnyLoading) return;
    const id = setInterval(
      () => setQuoteIndex((q) => (q + 1) % INSPIRING_QUOTES.length),
      TRIP_GENERATION_CONFIG.QUOTE_ROTATION_INTERVAL
    );
    return () => clearInterval(id);
  }, [isAnyLoading]);

  if (!isOpen || !isAnyLoading) return null;

  const currentQuote = INSPIRING_QUOTES[quoteIndex] || INSPIRING_QUOTES[0];
  const eta = estimateTime({
    langGraphLoading,
    flightLoading,
    hotelLoading,
    loading,
  });
  const currentStepLabel =
    activeSteps.find((s) => s.id === current)?.label || "Working...";
  const isComplete = completed.includes("finalize");

  return (
    <>
      {/* Add shimmer keyframes to document head */}
      <style>{shimmerKeyframes}</style>

      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-y-auto">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `pulse ${
                  3 + Math.random() * 2
                }s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-4xl mx-auto">
            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Gradient Header */}
              <div
                className={`bg-gradient-to-r ${
                  isComplete
                    ? "from-emerald-500 to-teal-500"
                    : "from-blue-600 via-purple-600 to-pink-600"
                } p-8 text-white relative overflow-hidden`}
              >
                {/* Animated background waves */}
                <div className="absolute inset-0 opacity-20">
                  <div
                    className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
                    style={{ animationDuration: "4s" }}
                  />
                  <div
                    className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
                    style={{ animationDuration: "5s", animationDelay: "1s" }}
                  />
                  <div
                    className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
                    style={{ animationDuration: "6s", animationDelay: "2s" }}
                  />
                </div>

                <div className="relative z-10 text-center">
                  {/* Animated Icon */}
                  <div className="inline-flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse" />
                      <div className="relative w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/50">
                        {isComplete ? (
                          <FaCheck className="text-4xl text-white animate-bounce" />
                        ) : (
                          <FaCompass
                            className="text-4xl text-white"
                            style={{
                              animation: "spin 3s linear infinite",
                              transformOrigin: "center center",
                              willChange: "transform",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
                    {isComplete ? "Trip Ready! 🎉" : "Crafting Your Journey"}
                  </h1>
                  <p className="text-xl sm:text-2xl font-light text-white/90 mb-2">
                    {destination}
                  </p>
                  <p className="text-white/80 text-sm mb-1">
                    {duration} day{duration > 1 ? "s" : ""} of adventure
                  </p>
                  {(includeFlights || includeHotels) && (
                    <p className="text-white/70 text-xs">
                      {includeFlights && includeHotels
                        ? "✈️ Flights + 🏨 Hotels"
                        : includeFlights
                        ? "✈️ Flights included"
                        : "🏨 Hotels included"}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {/* Status Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-full border border-blue-200">
                    {!isComplete && (
                      <div className="relative flex h-3 w-3">
                        <span
                          className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"
                          style={{
                            animation:
                              "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                          }}
                        />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-700">
                      {currentStepLabel}
                    </span>
                    {!isComplete && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                        ⏱️ {eta}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">
                      Overall Progress
                    </span>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {progress}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={progress} className="h-4 bg-gray-100" />
                    <div
                      className="absolute top-0 left-0 h-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out overflow-hidden"
                      style={{ width: `${progress}%` }}
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        style={{
                          animation: "shimmer 2s ease-in-out infinite",
                          transform: "translateX(-100%)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Steps Grid - Responsive based on number of active steps */}
                <div
                  className={`grid gap-4 ${
                    activeSteps.length <= 4
                      ? "grid-cols-2 md:grid-cols-4"
                      : activeSteps.length <= 6
                      ? "grid-cols-2 md:grid-cols-3"
                      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  }`}
                >
                  {activeSteps.map((step) => {
                    const Icon = step.icon;
                    const isCompleted = completed.includes(step.id);
                    const isCurrent = step.id === current && !isCompleted;

                    return (
                      <div
                        key={step.id}
                        className={`relative group p-5 rounded-2xl transition-all duration-300 ${
                          isCompleted
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-md"
                            : isCurrent
                            ? "bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 shadow-lg scale-105"
                            : "bg-gray-50 border-2 border-gray-200"
                        }`}
                      >
                        {/* Glow effect for current step */}
                        {isCurrent && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 rounded-2xl blur-xl" />
                        )}

                        <div className="relative flex flex-col items-center text-center space-y-3">
                          <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg"
                                : isCurrent
                                ? `bg-gradient-to-br ${step.color} shadow-lg`
                                : "bg-gray-200"
                            }`}
                          >
                            {isCompleted ? (
                              <FaCheck className="text-white text-xl" />
                            ) : isCurrent ? (
                              <FaSpinner
                                className="text-white text-xl"
                                style={{
                                  animation: "spin 1s linear infinite",
                                  transformOrigin: "center center",
                                  willChange: "transform",
                                }}
                              />
                            ) : (
                              <Icon
                                className={`text-xl ${
                                  isCompleted || isCurrent
                                    ? "text-white"
                                    : "text-gray-400"
                                }`}
                              />
                            )}
                          </div>

                          <div>
                            <p
                              className={`font-semibold text-sm ${
                                isCompleted
                                  ? "text-green-700"
                                  : isCurrent
                                  ? "text-blue-700"
                                  : "text-gray-500"
                              }`}
                            >
                              {step.label}
                            </p>
                            {isCompleted && (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quote Section */}
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <FaQuoteLeft className="text-white text-sm" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 italic text-lg leading-relaxed mb-3">
                        "{currentQuote.text}"
                      </p>
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-semibold">
                        — {currentQuote.author}
                      </p>
                    </div>
                  </div>

                  {/* Quote indicators */}
                  <div className="flex justify-center gap-2 mt-4">
                    {INSPIRING_QUOTES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuoteIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === quoteIndex
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 w-8"
                            : "bg-gray-300 hover:bg-gray-400 w-2"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Info Banner */}
                {!isComplete && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-5">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <FaExclamationTriangle className="text-amber-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-900 mb-1">
                          Hold Tight!
                        </h4>
                        <p className="text-amber-800 text-sm leading-relaxed">
                          Our AI is personalizing your perfect itinerary. This
                          usually takes less than a minute. Please keep this
                          window open.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isComplete && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-xl p-5 text-center">
                    <p className="text-green-700 font-bold text-lg">
                      🎉 Success! Your personalized trip is ready to explore!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TripGenerationModal;
