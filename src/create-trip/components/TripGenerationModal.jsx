import React, { useEffect, useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import {
  FaMapMarkerAlt,
  FaPlane,
  FaHotel,
  FaRobot,
  FaCheck,
  FaSpinner,
  FaCompass,
  FaBus,
} from "react-icons/fa";
import { INSPIRING_QUOTES, TRIP_GENERATION_CONFIG } from "@/utils/constants";

// Base step definitions - will be filtered based on user preferences
const ALL_STEPS = [
  {
    id: "start",
    label: "Initializing",
    icon: FaCompass,
    color: "from-sky-500 to-blue-500",
    required: true, // Always shown
  },
  {
    id: "transport",
    label: "Planning Route",
    icon: FaCompass,
    color: "from-purple-500 to-indigo-500",
    required: true, // ✅ ALWAYS show - determines optimal travel method
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

  // ✅ Route planning completes when langGraph finishes (determines optimal travel method)
  if (doneLang && activeSteps.some((s) => s.id === "transport")) {
    completed.push("transport");
  }

  // Only add langgraph if it's in active steps (flights or hotels requested)
  if (doneLang && activeSteps.some((s) => s.id === "langgraph")) {
    completed.push("langgraph");
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

  // ✅ FIX: Itinerary step is IN PROGRESS when loading is true and services are done
  // Mark itinerary as completed only when loading is false (AI generation finished)
  if (allRequestedServicesDone && !loading) {
    completed.push("itinerary");

    // 🆕 NEW: Add validation step tracking
    if (validationPhase && ["validation", "saving"].includes(validationPhase)) {
      completed.push("validation");
    }

    if (validationPhase === "saving") {
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

  // Get transport icon
  const getTransportIcon = () => {
    if (groundTransportPreferred) {
      return transportAnalysis?.groundTransport?.hasFerry ? (
        "⛴️"
      ) : (
        <FaBus className="text-sm" />
      );
    }
    return <FaPlane className="text-sm" />;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl mx-auto">
          {/* Main Card - Clean, minimal */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header - Simplified */}
            <div className="relative p-8 text-center border-b border-slate-200 dark:border-slate-800">
              {/* Status Icon */}
              <div className="inline-flex items-center justify-center mb-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isComplete
                      ? "bg-emerald-100 dark:bg-emerald-950/50"
                      : "bg-sky-100 dark:bg-sky-950/50"
                  }`}
                >
                  {isComplete ? (
                    <FaCheck className="text-2xl text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <div className="animate-spin">
                      <FaCompass className="text-2xl text-sky-600 dark:text-sky-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {isComplete ? "Your Trip is Ready" : "Creating Your Itinerary"}
              </h1>

              {/* Destination Info */}
              <div className="space-y-1">
                <p className="text-lg text-slate-700 dark:text-slate-300">
                  {destination}
                </p>
                <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span>
                    {duration} day{duration > 1 ? "s" : ""}
                  </span>
                  {(includeFlights ||
                    includeHotels ||
                    groundTransportPreferred) && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        {getTransportIcon()}
                        {groundTransportPreferred ? "Ground" : "Flights"}
                        {includeHotels && " + Hotels"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Progress Section */}
              <div className="space-y-3">
                {/* Current Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!isComplete && (
                      <div className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {currentStepLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                      {progress}%
                    </span>
                    {!isComplete && eta && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        • {eta}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-400 dark:to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {/* Steps - Minimal horizontal flow */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {activeSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = completed.includes(step.id);
                  const isCurrent = step.id === current && !isCompleted;

                  return (
                    <React.Fragment key={step.id}>
                      {/* Step */}
                      <div className="flex flex-col items-center gap-2 min-w-fit">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? "bg-emerald-500 dark:bg-emerald-600"
                              : isCurrent
                              ? "bg-sky-500 dark:bg-sky-600 animate-pulse"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        >
                          {isCompleted ? (
                            <FaCheck className="text-white text-sm" />
                          ) : isCurrent ? (
                            <div className="animate-spin">
                              <FaSpinner className="text-white text-sm" />
                            </div>
                          ) : (
                            <Icon
                              className={`text-sm ${
                                isCompleted || isCurrent
                                  ? "text-white"
                                  : "text-slate-400"
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isCompleted
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isCurrent
                              ? "text-sky-600 dark:text-sky-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>

                      {/* Connector line */}
                      {index < activeSteps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 min-w-[20px] ${
                            completed.includes(activeSteps[index + 1].id)
                              ? "bg-emerald-500 dark:bg-emerald-600"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {/* Validation Phase Details */}
              {validationPhase && current === "validation" && (
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin">
                      <FaSpinner className="text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                        {validationPhase === "parsing" && "Parsing AI Response"}
                        {validationPhase === "autofix" &&
                          "Optimizing Itinerary"}
                        {validationPhase === "validation" &&
                          "Validating Travel Plan"}
                        {validationPhase === "saving" && "Saving Your Trip"}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                        {validationPhase === "parsing" &&
                          "Converting to structured format"}
                        {validationPhase === "autofix" &&
                          "Ensuring optimal activity pacing"}
                        {validationPhase === "validation" &&
                          "Checking locations and routes"}
                        {validationPhase === "saving" &&
                          "Finalizing travel plan"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Inspiring Quote - Simplified */}
              {!isComplete && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed mb-2">
                    "{currentQuote.text}"
                  </p>
                  <p className="text-sky-600 dark:text-sky-400 font-medium text-xs">
                    — {currentQuote.author}
                  </p>
                </div>
              )}
              {/* Completion Message */}
              {isComplete && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    ✓ Your personalized trip is ready!
                  </p>
                </div>
              )}{" "}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripGenerationModal;
