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
  FaBus,
  FaRoute,
} from "react-icons/fa";
import { INSPIRING_QUOTES, TRIP_GENERATION_CONFIG } from "@/utils/constants";

// Add keyframes for shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Base step definitions - will be filtered based on user preferences and transport mode
const ALL_STEPS = [
  {
    id: "start",
    label: "Initializing",
    icon: FaRocket,
    color: "from-sky-500 to-blue-500",
    required: true, // Always shown
  },
  {
    id: "transport",
    label: "Transport Analysis",
    icon: FaCompass,
    color: "from-purple-500 to-indigo-500",
    required: true, // ✅ ALWAYS show transport analysis step (determines ground vs. air)
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
    condition: (props) =>
      props.includeFlights && !props.groundTransportPreferred, // Only if flights needed
  },
  {
    id: "ground",
    label: "Ground Route",
    icon: FaCompass,
    color: "from-emerald-500 to-green-500",
    condition: (props) =>
      props.includeFlights && props.groundTransportPreferred, // Only if ground preferred
  },
  {
    id: "hotels",
    label: "Accommodation",
    icon: FaHotel,
    color: "from-orange-500 to-red-500",
    condition: (props) => props.includeHotels, // Only if accommodation requested
  },
  {
    id: "itinerary",
    label: "Itinerary",
    icon: FaMapMarkerAlt,
    color: "from-green-500 to-emerald-500",
    required: true, // Always shown
  },
  {
    id: "validation",
    label: "Quality Check",
    icon: FaCheck,
    color: "from-purple-500 to-pink-500",
    required: true, // 🆕 Always validate
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
  validationPhase, // 🆕 NEW: Track validation progress
  includeFlights = false,
  includeHotels = false,
  groundTransportPreferred = false,
}) {
  // Filter steps based on user preferences and transport mode
  const activeSteps = ALL_STEPS.filter(
    (step) =>
      step.required ||
      (step.condition &&
        step.condition({
          includeFlights,
          includeHotels,
          groundTransportPreferred,
        }))
  );

  const doneLang = !langGraphLoading;
  const doneFlights = !flightLoading;
  const doneHotels = !hotelLoading;

  const completed = ["start"];

  // ✅ Transport analysis is complete when langGraph finishes (it runs transport mode internally)
  if (doneLang && activeSteps.some((s) => s.id === "transport")) {
    completed.push("transport");
  }

  // Only add langgraph if it's in active steps (flights or hotels requested)
  if (doneLang && activeSteps.some((s) => s.id === "langgraph")) {
    completed.push("langgraph");
  }

  // Only add ground transport step if ground is preferred and complete
  if (
    groundTransportPreferred &&
    doneLang &&
    activeSteps.some((s) => s.id === "ground")
  ) {
    completed.push("ground");
  }

  // Only add flights if user requested them, not ground preferred, and they're done
  if (
    includeFlights &&
    !groundTransportPreferred &&
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

  if (allRequestedServicesDone) {
    completed.push("itinerary");

    // 🆕 NEW: Add validation step tracking
    if (validationPhase && ["validation", "saving"].includes(validationPhase)) {
      completed.push("validation");
    }

    if (!loading && validationPhase === "saving") {
      completed.push("finalize");
    }
  }

  const current =
    activeSteps.find((s) => !completed.includes(s.id))?.id ||
    (validationPhase &&
    ["parsing", "autofix", "validation"].includes(validationPhase)
      ? "validation"
      : "finalize");
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
  validationPhase = null, // 🆕 NEW: 'parsing' | 'autofix' | 'validation' | 'saving'
  destination = "Your Dream Destination",
  duration = 3,
  includeFlights = false,
  includeHotels = false,
  groundTransportPreferred = false, // NEW: indicates if ground transport is preferred over flights
  transportAnalysis = null, // NEW: transport mode analysis data
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
        validationPhase, // 🆕 Pass validation phase
        includeFlights,
        includeHotels,
        groundTransportPreferred,
      }),
    [
      loading,
      flightLoading,
      hotelLoading,
      langGraphLoading,
      validationPhase, // 🆕 Add to dependencies
      includeFlights,
      includeHotels,
      groundTransportPreferred,
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

      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-y-auto">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 dark:bg-white/10 rounded-full"
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-sky-500/10 overflow-hidden border border-transparent dark:border-slate-700">
              {/* Gradient Header */}
              <div
                className={`bg-gradient-to-r ${
                  isComplete
                    ? "from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600"
                    : "from-sky-600 via-blue-600 to-sky-600 dark:from-sky-500 dark:via-blue-500 dark:to-sky-500"
                } p-8 text-white relative overflow-hidden`}
              >
                {/* Animated background waves */}
                <div className="absolute inset-0 opacity-20 dark:opacity-10">
                  <div
                    className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-pulse"
                    style={{ animationDuration: "4s" }}
                  />
                  <div
                    className="absolute top-0 right-0 w-96 h-96 bg-sky-300 dark:bg-sky-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-pulse"
                    style={{ animationDuration: "5s", animationDelay: "1s" }}
                  />
                  <div
                    className="absolute -bottom-32 left-20 w-96 h-96 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-pulse"
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
                          <div style={{ animation: "spin 1s linear infinite" }}>
                            <FaCompass className="text-4xl text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">
                    {isComplete ? "Trip Ready" : "Crafting Your Journey"}
                  </h1>
                  <p className="text-lg sm:text-xl font-light text-white/90 mb-1">
                    {destination}
                  </p>
                  <p className="text-white/70 text-xs">
                    {duration} day{duration > 1 ? "s" : ""}
                  </p>
                  {(includeFlights || includeHotels) && (
                    <p className="text-white/60 text-xs mt-1">
                      {groundTransportPreferred
                        ? includeHotels
                          ? "Ground Transport + Accommodation"
                          : "Ground Transport"
                        : includeFlights && includeHotels
                        ? "Flights + Accommodation"
                        : includeFlights
                        ? "Flights"
                        : "Accommodation"}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8 bg-white dark:bg-slate-900">
                {/* Status Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 px-4 py-2 rounded-lg border border-sky-200 dark:border-sky-800">
                    {!isComplete && (
                      <div className="relative flex h-2 w-2">
                        <span
                          className="absolute inline-flex h-full w-full rounded-full bg-sky-400 dark:bg-sky-500 opacity-75"
                          style={{
                            animation:
                              "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                          }}
                        />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500 dark:bg-sky-400" />
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {currentStepLabel}
                    </span>
                    {!isComplete && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {eta}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={progress}
                      className="h-2 bg-gray-200 dark:bg-slate-800"
                    />
                    <div
                      className="absolute top-0 left-0 h-2 bg-sky-500 dark:bg-sky-400 rounded-full transition-all duration-500 ease-out overflow-hidden"
                      style={{ width: `${progress}%` }}
                    />
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
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 shadow-md dark:shadow-green-500/10"
                            : isCurrent
                            ? "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-2 border-sky-300 dark:border-sky-700 shadow-lg dark:shadow-sky-500/20 scale-105"
                            : "bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700"
                        }`}
                      >
                        {/* Glow effect for current step */}
                        {isCurrent && (
                          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-400 dark:from-sky-500 dark:to-blue-500 opacity-20 dark:opacity-30 rounded-2xl blur-xl" />
                        )}

                        <div className="relative flex flex-col items-center text-center space-y-3">
                          <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? "bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 shadow-lg"
                                : isCurrent
                                ? `bg-gradient-to-br ${step.color} shadow-lg`
                                : "bg-gray-200 dark:bg-slate-700"
                            }`}
                          >
                            {isCompleted ? (
                              <FaCheck className="text-white text-xl" />
                            ) : isCurrent ? (
                              <div
                                style={{ animation: "spin 1s linear infinite" }}
                              >
                                <FaSpinner className="text-white text-xl" />
                              </div>
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
                                  ? "text-green-700 dark:text-green-400"
                                  : isCurrent
                                  ? "text-sky-700 dark:text-sky-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {step.label}
                            </p>
                            {isCompleted && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                ✓ Done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 🆕 Validation Phase Details */}
                {validationPhase && current === "validation" && (
                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-purple-950/30 rounded-2xl p-5 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div style={{ animation: "spin 1s linear infinite" }}>
                        <FaSpinner className="text-purple-500 dark:text-purple-400" />
                      </div>
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                        {validationPhase === "parsing" &&
                          "Parsing AI Response..."}
                        {validationPhase === "autofix" &&
                          "Optimizing Itinerary..."}
                        {validationPhase === "validation" &&
                          "Validating Travel Plan..."}
                        {validationPhase === "saving" && "Saving Your Trip..."}
                      </h4>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {validationPhase === "parsing" &&
                        "Converting AI response to structured itinerary"}
                      {validationPhase === "autofix" &&
                        "Ensuring optimal activity pacing and scheduling"}
                      {validationPhase === "validation" &&
                        "Checking locations, travel times, and hotel references"}
                      {validationPhase === "saving" &&
                        "Finalizing your personalized travel plan"}
                    </p>
                  </div>
                )}

                {/* Quote Section */}
                <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-sky-950/30 rounded-2xl p-6 border border-sky-100 dark:border-sky-800">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-600 rounded-full flex items-center justify-center">
                        <FaQuoteLeft className="text-white text-sm" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed mb-3">
                        "{currentQuote.text}"
                      </p>
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 font-semibold">
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
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === quoteIndex
                            ? "bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-600 w-8"
                            : "bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 w-2"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Info Banners */}
                {!isComplete && (
                  <div className="space-y-3">
                    {/* Main Progress Info */}
                    <div className="bg-sky-50 dark:bg-sky-950/30 border-l-4 border-sky-400 dark:border-sky-600 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 pt-0.5">
                          <FaRocket className="text-sky-600 dark:text-sky-400 text-sm" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sky-900 dark:text-sky-300 text-sm mb-1">
                            Building Your Itinerary
                          </h4>
                          <p className="text-sky-800 dark:text-sky-400/80 text-xs leading-snug">
                            AI-powered analysis to create your perfect day-by-day plan.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 🔧 Smart Transport Mode Info - Conditional based on transport analysis */}
                    {groundTransportPreferred &&
                    transportAnalysis?.groundTransport ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-400 dark:border-emerald-600 rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 pt-0.5 text-lg">
                            {transportAnalysis?.groundTransport?.hasFerry ? "⛴️" : <FaBus className="text-emerald-600 dark:text-emerald-400 text-sm" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm mb-1">
                              {transportAnalysis?.groundTransport?.hasFerry ? "Ferry Route Selected" : "Ground Transport Route Selected"}
                            </h4>
                            <p className="text-emerald-800 dark:text-emerald-400/80 text-xs leading-snug">
                              {transportAnalysis.hasAirport === false
                                ? `${destination.split(",")[0]} has no direct airport. Using ${transportAnalysis?.groundTransport?.hasFerry ? "ferry" : "ground transport"} instead.`
                                : `${transportAnalysis?.groundTransport?.hasFerry ? "Ferry" : "Ground transport"} is more practical for this route.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : includeFlights ? (
                      <div className="bg-sky-50 dark:bg-sky-950/30 border-l-4 border-sky-400 dark:border-sky-600 rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 pt-0.5">
                            <FaPlane className="text-sky-600 dark:text-sky-400 text-sm" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sky-900 dark:text-sky-300 text-sm mb-1">
                              Flight Search in Progress
                            </h4>
                            <p className="text-sky-800 dark:text-sky-400/80 text-xs leading-snug">
                              Searching for available flights and best prices for your travel dates.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Smart Itinerary Planning Info */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 dark:border-blue-600 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 pt-0.5">
                          <FaRoute className="text-blue-600 dark:text-blue-400 text-sm" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">
                            Intelligent Scheduling
                          </h4>
                          <ul className="text-blue-800 dark:text-blue-400/80 text-xs space-y-1 leading-snug">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 dark:text-blue-500 flex-shrink-0">
                                •
                              </span>
                              <span>
                                Smart pacing: Light arrivals, early departures
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 dark:text-blue-500 flex-shrink-0">
                                •
                              </span>
                              <span>
                                Optimized routes between locations
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isComplete && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-l-4 border-green-400 dark:border-green-600 rounded-xl p-5 text-center">
                    <p className="text-green-700 dark:text-green-400 font-bold text-lg">
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
